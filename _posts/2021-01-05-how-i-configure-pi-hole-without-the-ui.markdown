---
title: How I Configure Pi-hole Without the UI
summary: 'I run two Pi-hole instances for redundancy and needed an approach to  keep
  some configuration consistent between the two instances.
'
tags:
- pi-hole
categories:
- Development
date: 2021-01-05 13:24
slug: how-i-configure-pi-hole-without-the-ui
---

I run two [Pi-hole][pi-hole] instances for redundancy and needed an approach to keep some configuration consistent between the two instances.

There is a utility, [gravity-sync][gravity-sync], that can automate the sync between a primary instance and secondary instances, but I wanted to keep it simple as I don't apply changes too often. I also wanted to still be able to set up a new instance with my existing configuration without needing to have one already working.

The two main things I need to keep in sync are:

1. Custom DNS entries. I run Traefik as a load balancer in front of services running in Docker to provide HTTPS, and also so services have their own DNS names instead of needing to remember which port a specific service runs on
2. Whitelist configuration, as there are some hosts on the default block lists that I need to be accessible

<!--more-->

## DNS Names

The approach I used to take was to bind mount a file `/etc/dnsmasq.d/02-static-entries.conf` into my docker container. This file had the format:

~~~
address=/my.fqdn.example.com/192.168.0.4
~~~

As of Pi-hole V5 this configuration could now be done in the UI (under the Local DNS navigation menu item), and while the approach I was using still worked it would be nice for it to show in the UI. I run quite a lot of services which resolve to the same IP address, so the CNAME feature would allow configuring the IP once then aliasing services to the host they run on. 

Changes made in the DNS Records and CNAME Records pages are written to `/etc/pihole/custom.list` and `/etc/dnsmasq.d/05-pihole-custom-cname.conf` respectively. 

`custom.list` uses a standard hosts file format containing the IP and FQDN. 

~~~
192.168.0.4 my.fqdn.example.com
~~~

`05-pihole-custom-cname.conf` contains mappings of the FQDN for the CNAME record to the FQDN of the host. Note that for a CNAME to work, the Pi-hole instance needs to be the authoritive source for the DNS record you are linking to. So it needs to be in as a custom DNS name (if you are not using Pi-hole for DHCP), even if the upstream would have resolved the name you are linking to. 

~~~
cname=pihole.example.com,my.fqdn.example.com
~~~

## Whitelists

In Pi-hole V4, you could configure a file `/etc/pihole/whitelist.txt` which would be loaded at startup to apply a whitelist. This functionality was removed when Pi-hole moved to the new FTL engine in V5. 

There are two approaches that can be used to configure Pi-hole from a CLI to replace this functionality:

1. Use the web API (LINK). This requires an access token to be configured, and provides a rich interface for administering a running Pi-hole instance
2. Use the `pihole` command

For simplicity I went with the second option, primarily to avoid having to work out how to setup an API token without having to do it manually through the UI. 

I run Pi-hole in a docker container, started up using `docker-compose`. I have added an extra service to my docker-compose file to apply my whitelist updates using the `pihole` command. This runs a container with the docker cli to be able to run commands in another container. While this script could just be ran locally, adding it in as a service means that any time `docker-compose up` is ran the whitelist changes are re-applied. 

~~~
pihole-config:
    # Short lived container used to configure white/black lists for pihole
    image: docker:19
    volumes:
     - "/data-storage/app-data/pihole/whitelist.txt:/etc/pihole-config/whitelist.txt"
     - "/data-storage/app-data/pihole-config/deploy-whitelist.sh:/etc/pihole-config/deploy-whitelist.sh"
     - "/var/run/docker.sock:/var/run/docker.sock"
    entrypoint: "sh /etc/pihole-config/deploy-whitelist.sh"
    depends_on: 
      - pihole
~~~

The script this runs:

1. Looks for a running `pihole/pihole` container image
2. Runs the `pihole -w` command to add entries to the whitelist that have been read out of a file

~~~ bash
#!/bin/bash

DOCKER_IMAGE=pihole/pihole

# Find the running container id
container=$(docker ps | grep "$DOCKER_IMAGE" | cut -f 1 -d ' ')

if [ ! -z container ]; then

    echo "Got container $container"

    # Apply the whitelist
    docker exec $container pihole -w $(cat /etc/pihole-config/whitelist.txt)
else
    echo "Could not determine the running container for $DOCKER_IMAGE"
    exit 20
fi
~~~


## Next Steps

This setup does still require some manual intervention to push updates to files and restart services, I am planning on looking to automate this a bit more so that I at least just have a single script to run from my laptop to update all instances. 


[pi-hole]: https://pi-hole.net "Pi-hole – Network-wide protection"
[gravity-sync]: https://github.com/vmstan/gravity-sync "vmstan/gravity-sync: An easy way to synchronize the blocklist and local DNS configurations of multiple Pi-hole 5.x instances."
