---
title: Running HomeBridge on Docker without Host Network Mode - Additional Accessories
layout: post
summary: A new version of the generate service script is now available, now supporting
  platforms & accessories.
series: Running HomeBridge on Docker without Host Network Mode
series_part: 2
categories:
- Development
tags:
- Docker
- HomeBridge
- HomeKit
date: 2020-04-11 13:13
slug: running-homebridge-on-docker-without-host-network-mode-additional-accessories
---
This is just a quick post to announce that a new version of the `generate_service.sh` script is now available. 

Instead of putting the source for this into this post, I've now committed it to a Github repository here: [generate_service.sh][generate_service.sh]. This version adds support for generating additional service files for accessories defined under a platform in Homebridge. 

I have been testing this out with a Samsung Tizen based TV, but this has exposed another issue with Wake-on-Lan packets not being able to be routed from a Docker network without using host mode. I'm still investigating options to solve this, which will be another post (or defeat, time will tell). 



[generate_service.sh]: https://github.com/dhutchison/container-images/blob/master/homebridge/generate_service.sh "container-images/generate_service.sh at master · dhutchison/container-images"
