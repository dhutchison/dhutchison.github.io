---
title: Plex, Docker, and the problem of always appearing as "Remote"
layout: post
summary: My Plex server was always showing as remote. It was a quoting issue.
categories:
- Miscellaneous
tags:
- Docker
- Plex
date: 2019-08-21 00:45
slug: plex-docker-and-the-problem-of-always-appearing-as-remote
---
I have no idea when exactly this issue started happening, but for a while now I have been noticing that when I attempted to play media through the Plex application on my Xbox One it would default to transcoding down to a lower quality. While this was an annoyance, I could always manually set the quality back to original quality. 

Finally this week I spent a bit of time to try and work out why. 

## The Problem

It appears that the majority of Plex clients on my network were considering the server to be a "remote" server, and so were setting bandwidth restrictions on playback. It is worth noting that there are two types of settings at play here, in the Xbox Plex application, and the [bandwidth settings][plex_pass_bandwidth] in the Plex Server settings which are available to Plex Pass subscribers. 

<!--more-->

## Plex Server Setup

I run my Plex instance in a Docker container, and there are two ways currently set up to access it:

* directly hitting the server with Docker Bridge networking on port 32400
* going through Traefik using an internal host name and https on port 443 

Both of these are configured, in this order, with the "ADVERTISE_IP" environment variable set so these names are advertised. 

As I was able to see in the Plex dashboard that the server considered playback as being from a remote client, the first port of call was to address the [bandwidth settings][plex_pass_bandwidth] in the Plex Server settings. This is noted as recommended in the [Plex Docker image documentation][pms_docker], but I had  missed this. Surprisingly this is not a setting which is configurable through environment variables for the docker container.

> (Plex Pass only) After the server has been set up, you should configure the LAN Networks preference to contain the network of your LAN. This instructs the Plex Media Server to treat these IP addresses as part of your LAN when applying bandwidth controls. The syntax is the same as the ALLOWED_NETWORKS below. For example 192.168.1.0/24,172.16.0.0/16 will allow access to the entire 192.168.1.x range and the 172.16.x.x range.
>
> --<cite>[Plex Docker image documentation][pms_docker]</cite>

I set mine to "192.168.0.1/24,172.16.0.0/12" to include my local network subnet and the network space that docker runs in. 


With this change, the Plex dashboard will show the Xbox Client as being local while playing content, but the Xbox client is still transcoding. Going into the Media Server Status menu in the Xbox Plex application shows my server as being Remote. Curiously when accessing the server web dashboard using the IP address it would show as "nearby", but when accessing with the internal DNS name it showed as "remote". So this configuration change solved one issue, but there is still one remaining. 

## Why do clients think the server is Remote?

When I started writing this up, there was a much more hacky solution involving custom DNS entries for &lt;my id&gt;.plex.direct records which solved this part. However it appears the solution was much more simple. 

In my docker-compose definition I had the "ADVERTISE_IP" environment variable defined as this. 

~~~ yaml
    environment:
     - ADVERTISE_IP="http://$IP_ADDRESS:32400/,https://plex.lan.example.com/"
~~~

When revisiting the settings to write this up, I noticed the Advertise IP showing with these quotes included. Quoting the value, either with single or double quotes, results in Plex including the quotes in the configuration. If these quotes are omitted then everything works correctly, and clients on the local network correctly report the server as being nearby. 

Based on this [Stack Overflow answer][so_answer], the correct way to quote this value would have been this:

~~~ yaml
    environment:
     - 'ADVERTISE_IP=http://$IP_ADDRESS:32400/,https://plex.lan.example.com/'
~~~

[plex_pass_bandwidth]: https://support.plex.tv/articles/227715247-server-settings-bandwidth-and-transcoding-limits "Server Settings – Bandwidth and Transcoding Limits" 
[pms_docker]: https://hub.docker.com/r/plexinc/pms-docker/ "plexinc/pms-docker - Docker Hub"
[so_answer]: https://stackoverflow.com/a/41988810/230449 "docker-compose - how to escape environment variables"
