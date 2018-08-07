---
title: Plex DVR on Docker with the Official Xbox One Digital TV Tuner
layout: post
series: Plex DVR with the Official Xbox One Digital TV Tuner
series_part: 5
summary: Overcoming the last few issues to get DVR features working on Plex in Docker
  with the Official Xbox One Digital TV Tuner.
tags:
- Plex
categories:
- Development
date: 2018-08-07 21:47
slug: plex-dvr-on-docker-with-the-official-xbox-one-digital-tv-tuner
---
In the last part of this series we got the [Official Xbox One TV Tuner][tv_tuner] working successfully with Plex on a beta version of Fedora 28.

Last weekend one part of the RAID-1 boot drive array I used for my media server failed, so I took the opportunity to give Fedora 28 a shot as my boot OS with the replacement drive as opposed to imediately repairing the RAID. If this didn't work out I can still swap some drives around and let the RAID resync. This may still happen, as Fedora is not offically supported on the HP Microserver I run, so I miss out on some of the agents used by the Integrated Lights-Out (iLO) server management interface to report back machine metrics. 

As part of this switch I am re-evaluating what I can use Docker for, and so have OS distribution agnostic, scripted, services. Even if I do choose to switch back to CentOS this will not be a waste as there were some software packages which I was already compiling from source due to a lack of availability in CentOS repositories. When Ubuntu move to the 4.16 kernel I will likely switch again, but should have an easier time as I can re-use the configured Docker containers I have already scripted. 

So it is now time to get Plex working on Docker with this tuner. 

<!--more-->

## The initial setup

As we have found in the previous parts of this series, there is a piece of firmware missing from the OS distribution which we need to install in order to use the tuner. 

    sudo curl http://palosaari.fi/linux/v4l-dvb/firmware/MN88472/02/088b891ac9273ff8c6818fca27b24d81/dvb-demod-mn88472-02.fw --output /lib/firmware/dvb-demod-mn88472-02.fw

After this I just installed Docker as per their [installation guide][docker_fedora].

## Passing through the tuner

When I was working with the various setups in a VirtualBox Virtual Machine, I was just passing through the tuner USB device itself. Trying to do this into a Docker container resulted in the tuner not being detected at all. [This forum post][plex_dvb_passthrough] however had already solved that problem - you need to pass through the whole "/dev/dvb" directory as a device.

## Failing with permission problems

Now that the dvb directory is being passed through, I could see a bit more progress. There was still no tuner appearing in the Plex UI, but the Plex Tuner Service log file at least was showing an error now.

    v4l::DeviceGetList_impl. open failed on frontend /dev/dvb/adapter0/frontend0 (13)

Initial searches around this error pointed towards the user running the plex process not having access to the "video" group. Looking inside the container, everything looked ok. 

    [dhutchison@procent Docker]$ sudo docker exec -it plex /bin/bash
    root@PlexServer:/# /bin/grep plex /etc/group
    video:x:44:plex
    users:x:100:plex

The issue however is that video group shown in the container. The [Docker container][plex_dockerfile] used by Plex is built from the "ubuntu:16.04" base, which appears to use different default group numbers from Fedora 28. 

    [dhutchison@procent Docker]$ grep video /etc/group
    video:x:39:


To solve this, we need to create the container supplying the environment variable "PLEX_GID". I say create as the environment variables to set group and user IDs are only used by the Plex container on first run. I use the following to assign the correct ID for the group based on the name on the host, which should work on any linux distribution.

    -e PLEX_GID=$(getent group video | cut -d: -f3)


## It Works!

Setting this environment variable on the first run of the container was enough to fix the permissions problems, and allow the tuner to appear in the Plex UI. So once again, we have a working DVR using a  cheap but officially unsupported tuner. 


I have a shell script I use when I need to set this container up again, purely so I don't need to work out all the required values again. 


The complete command is shown below. 

{% highlight bash %}

sudo docker run \
-d \
--name plex \
--restart unless-stopped \
-p 192.168.0.89:32400:32400/tcp \
-p 192.168.0.89:3005:3005/tcp \
-p 192.168.0.89:8324:8324/tcp \
-p 192.168.0.89:32469:32469/tcp \
-p 192.168.0.89:1900:1900/udp \
-p 192.168.0.89:32410:32410/udp \
-p 192.168.0.89:32412:32412/udp \
-p 192.168.0.89:32413:32413/udp \
-p 192.168.0.89:32414:32414/udp \
-e TZ="Europe/London" \
-e PLEX_CLAIM="!!YOUR CLAIM HERE!!" \
-e ADVERTISE_IP="http://192.168.0.89:32400/,http://procent.local:32400" \
-e PLEX_UID=$(id -u plex) \
-e PLEX_GID=$(getent group video | cut -d: -f3) \
-h PlexServer \
-v /data-storage/plex/db:/config \
-v /data-storage/plex/temp:/transcode \
-v /data/data/Movies:/data/Movies:ro \
-v /data/data/TV:/data/TV:ro \
-v /data/data/iTunes:/data/iTunes:ro \
-v /data/data/dvr:/data/dvr:rw \
--device=/dev/dvb \
plexinc/pms-docker:plexpass

{% endhighlight %}





[prev_part]: /2018/04/22/plex-dvr-with-the-official-xbox-one-digital-tv-tuner-the-direct-and-working-approach/ "Plex DVR with the Official Xbox One Digital TV Tuner - The Direct (and working!) Approach"
[tv_tuner]: https://www.amazon.co.uk/gp/product/B00E97HVJI/ref=as_li_ss_tl?ie=UTF8&psc=1&linkCode=ll1&tag=devwithimag-21&linkId=cfc0f85bf90f4f64dd5f16b4fb431919 "Amazon - Official Xbox One Digital TV Tuner (Xbox One)" 
[plex_dvb_passthrough]: https://forums.plex.tv/t/getting-plex-pass-docker-and-live-tv-working-sharing-usb-devices/195392 "Getting Plex Pass Docker and Live TV working. Sharing USB devices - NAS & Devices - Plex Forum"
[plex_dockerfile]: https://github.com/plexinc/pms-docker/blob/master/Dockerfile "pms-docker/Dockerfile on GitHub"
[docker_fedora]: https://docs.docker.com/install/linux/docker-ce/fedora/ "Get Docker CE for Fedora | Docker Documentation"
