---
title: Backing Up Docker Services
layout: post
categories:
- Development
tags:
- ansible
- Docker
- RaspberryPi
summary: How to backup self-hosted Docker service data.
date: 2023-07-26 00:00
slug: backing-up-docker-services
---
This week I had an issue where one of the Raspberry Pis that I use for self-hosting some services stopped working. It started with `docker pull` commands failing due to unknown paths that looked to be complete gobbledegook, and ended up with the Pi not booting at all. Checking the disk, it was full of filesystem errors that could not be repaired - I'm pretty sure the SSD it was using had previously been retired due to similar problems, so it was time for a replacement.

Taking a new SSD and reprovisioning this Pi was the easy part thanks to the [Raspberry Pi Imager](https://www.raspberrypi.com/software/) and the [Ansible](https://github.com/ansible/ansible) playbook I had written when I first setup the server. That handles the core OS configuration and many configuration files, including the Docker compose files that defines the services that I run. What it does not include is data.

This server had backups taken on a very ad-hoc basis, and as is often the case the topic of backups becomes a prority again *after* a data loss event (even if it was largely recoverable from the failing SSD).

<!--more-->

## What do I need to backup?

This server currently runs 5 main services:
* [traefik][traefik] - a load balancer that serves as the entrypoint for all my dockerized services. This handles provisioning certificates from LetsEncrypt, and uses labels on running Docker containers to drive most of the service level configuration. Beyond configuration files, this service has no persistant data that I need to back up.
* [heimdall][heimdall] - an application dashboard which I use as a landing page to link to other services
* [pihole][pihole] - for DNS level adblocking
* [actual budget][actual] - a personal finance & budgeting application (which I've not used a huge amount yet)
* [unifi controller][unifi-controller] - a docker version of the Ubiquiti Networks Unifi Controller software. This consists of two containers: the `jacobalberty/unifi-docker` one for the actual controller and a `mongodb` container for it's database.

## How do I back these up?

Each piece of software stores data in it's own format, and have different approaches for backups. While I could use a consistent approach of backing up the entire docker volumes, where software has it's own backup utilities I would prefer to use them.

From the above list there are 4 services that I want to backup, and 3 different approaches. In all cases I want to have a location on the host filesystem that I can collect these from to ship them off-device.

### Unifi Controller - built-in scheduled backups

The Unifi controller software has an option in the settings for scheduled backups. Unfortunately it looks like my previous controller had not performed one of these in 2 months, even with the option enabled. I have no idea why this was the case, but the rebuilt server appears to be backing up on schedule. I'll need to monitor this to ensure it does not stop working randomly again.

These backup files are written to `/unifi/data/backup` within the container, and set to keep a fixed number of past backups. This location is bind mounted to a directory on the host filesystem to allow for them to be collected and published off device.

### Pi-Hole - Scheduling of CLI tool

Pi-Hole includes a teleporter tool that can be used to import & export configuration files. This does not include statistics, but I'm less concerned about those.

An export can be performed using the `pihole` [CLI](https://docs.pi-hole.net/core/pihole-command/). In the container I can run `pihole -a -t <path to file>` to create an export of the configuration to a location that is mounted into the container. As I run this as part of a `docker-compose` file, the cron job will be configured something like this:

```shell
0 2 * * * pi docker compose -f /data-storage/docker-stacks/docker-compose.yml exec pihole pihole -a -t /etc/pihole/backups/adminpi_pihole_backup_$(date -d "today" +"\%Y\%m\%d\%H\%M").tar.gz
```

This will execute a command at 2am daily to run the Pi-Hole teleporter in the docker container, writing the backup file into the `/etc/pihole/backups/` directory in the container as a file containing the current date and time. This location in the container is mounted to a location on the host filesystem for later collection.

I configured this with Ansible using the following task configuration:

```yaml
{% raw %}
- name: Configure pihole backup cron job
  ansible.builtin.cron:
    cron_file: pihole_backup
    name: pihole backup
    user: pi
    hour: 2
    minute: 0
    job: docker compose -f {{ core_docker_stack_dir }}/docker-compose.yml exec pihole pihole -a -t /etc/pihole/backups/{{ inventory_hostname }}_pihole_backup_$(date -d "today" +"\%Y\%m\%d\%H\%M").tar.gz
{% endraw %}
```




### Heimdall and Actual Budget - Filesystem backups

Both of these applications have no native backup solutions that we can automate. There is an ongoing [discussion](https://github.com/linuxserver/Heimdall/discussions/695) for Heimdall on backups, and while Actual Budget has a way to [manually create backups in the web interface](https://actualbudget.org/docs/backup-restore/backup) there is no API for it. For these we will need to backup their data manually.

The core data for these applications are stored within the containers in:
* `/config/www/` for heimdall
* `/app/server-files` and `/app/user-files` for actual

As is a familiar pattern by now - I have these locations in the container as volume mounts to known directories on the host filesystem, so this is just a matter of creating an archive of these locations. I use a common naming pattern so these any mount points for a service are in a local directory `/data-storage/app-data/<service name>`. Backups will be stored in a sub directory of this location.

The cron job for each service is something like this, which creates a timestamped backup file for the service directory, excluding the backups subdirectory.

```shell
0 18 * * * dhutchison tar -cvzf /data-storage/app-data/actual-server/backups/adminpi_actual-server_backup_$(date -d "today" +"\%Y\%m\%d\%H\%M").tar.gz --exclude backups /data-storage/app-data/actual-server
```

These cron entries are templated using Ansible, with this task definition:

```yaml
{% raw %}
- name: Configure general file backup cron jobs
  ansible.builtin.cron:
    cron_file: "{{ item.name }}_backup"
    name: "{{ item.name }} backup"
    user: dhutchison
    hour: 18
    minute: 0
    job: tar -cvzf /data-storage/app-data/{{ item.name }}/backups/{{ inventory_hostname }}_{{ item.name }}_backup_$(date -d "today" +"\%Y\%m\%d\%H\%M").tar.gz --exclude backups /data-storage/app-data/{{ item.name }}
  with_items: "{{ backup_app_data_dirs }}"
  when: backup_app_data_dirs is defined
{% endraw %}
```

This depends on a host variable in my Ansible configuration defining the services to perform this type of backup for.

```yaml
backup_app_data_dirs:
  - name: actual-server
  - name: heimdall
```



## How do I limit the number of backup files retained?

In addition to setting up the above to create the backup files, I wanted another to limit the number of backup files which were retained locally on the host to prevent disk space running out. The Unifi controller does this as part of it's backup scheduling, so I didn't need to do anything for that. For the other services, I have an additionl cron job for each service which will delete any files from the  backup directory which have not been modified in a set number of days.

This example was used for initial testing, and deletes any pihole backups which were last modified more than two days ago.

```shell
5 2 * * * pi find /data-storage/app-data/pihole/backups -maxdepth 1 -type f -mtime +2 -exec rm {} \;
```


I have configured these in a general fashion using Ansible with the following snippet.

```yaml
{% raw %}
- name: Configure general backup rotation jobs
  ansible.builtin.cron:
    cron_file: "{{ item.name }}_backup"
    name: "{{ item.name }} backup retention"
    user: dhutchison
    hour: 18
    minute: 5
    job: find /data-storage/app-data/{{ item.name }}/backups -maxdepth 1 -type f -mtime +{{ item.last_modified | default(15) }} -exec rm {} \;
  with_items: "{{ backup_rotate_app_data_dirs }}"
  when: backup_rotate_app_data_dirs is defined
{% endraw %}
```

This depends on a host variable defining the item the backup is for and (optionally) the last modified time. If this optional parameter is not supplied then it will default to 15 days.

```yaml
backup_rotate_app_data_dirs:
  - name: actual-server
    last_modified: 14
  - name: heimdall
  - name: pihole
```


## How to I store the backups off the original device?

In looking for some options to upload to a cloud service I came across  [Rclone][rclone].

> Rclone is a command-line program to manage files on cloud storage. It is a feature-rich alternative to cloud vendors' web storage interfaces. [Over 70 cloud storage products](https://rclone.org/#providers) support rclone including S3 object stores, business & consumer file storage services, as well as standard transfer protocols.

Unfortunately it doesn't support iCloud which would have been my preference, but I've opted to use Google Drive initially. I won't go into the specifics of how this is configured as the project documentation is pretty good, and it will largely depend on where you are trying to copy files to.

At the moment this is using the rclone [copy](https://rclone.org/commands/rclone_copy/) action:

> Copy the source to the destination. Does not transfer files that are identical on source and destination, testing by size and modification time or MD5SUM. Doesn't delete files from the destination. If you want to also delete files from destination, to make it match source, use the [sync](https://rclone.org/commands/rclone_sync/)command instead.

This means that if anything goes wrong it should not delete files from Google Drive, but it is not a long term solution as I will run out of space there. I may switch this to sync later on, but I'll be looking at other maintenance & observability options in a follow up post.

Once it was configured, I have another cron job that periodically runs the following command to copy all the created backup files to a location in Google Drive.

```
docker run --rm -it \
  --volume /data-storage/app-data/rclone/config:/config/rclone \
  --volume /data-storage/app-data/actual-server/backups:/data/adminpi/backups/actualserver \
  --volume /data-storage/app-data/heimdall/backups:/data/adminpi/backups/heimdall \
  --volume /data-storage/app-data/pihole/backups:/data/adminpi/backups/pihole \
  --volume /data-storage/app-data/unifi/backups:/data/adminpi/backups/unifi \
  --user $(id -u):$(id -g) \
  rclone/rclone \
  copy /data/adminpi gdrive:adminpi-backup
```

[actual]: https://actualbudget.org "Actual - Actual Budget Documentation"
[pihole]: https://pi-hole.net "Pi-hole – Network-wide Ad Blocking"
[traefik]: https://traefik.io/traefik/ "Traefik, The Cloud Native Application Proxy - Traefik Labs"
[unifi-controller]: https://github.com/jacobalberty/unifi-docker "jacobalberty/unifi-docker: Unifi Docker files"
[heimdall]: https://heimdall.site "Heimdall Application Dashboard"

[rclone]: https://rclone.org "Rclone"
