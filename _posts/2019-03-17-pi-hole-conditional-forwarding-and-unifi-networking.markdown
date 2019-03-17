---
title: Pi-hole, Conditional Forwarding, and Unifi Networking
layout: post
summary: I got some new network gear, and now Pi-hole displays hostnames in the dashboard
date: 2019-03-17 21:35
slug: pi-hole-conditional-forwarding-and-unifi-networking
categories:
- Miscellaneous
tags:
- networking
- pi-hole
- unifi
---
In my [start of the year post][start-of-year], I had given up with attempting to get Pi-hole to work as a DHCP server while in a docker container and had started using "isc-dhcp-server". The main driver to having Pi-hole performing DHCP was so that in the dashboard I could see actual hostnames as opposed to the IP addresses of the clients. Instead of persevering with trying to get DHCP working in the Pi-hole container, I took advantage of changes I was making in my home network setup. 

<!--more-->

Since writing that post I have set up some new Ubiquiti kit for running parts of my home network. The main components of my home network now consists of:

* [Unifi Security Gateway (USG) Router][usg]
* [UAP-AC-LITE WLAN Access Point][ac-lite]
* [TP-Link TL-PA8010PKIT Gigabit Passthrough Powerline Network Starter Kit][powerline]
* A couple of cheap [NETGEAR GS305 5-Port Gigabit Metal Unmanaged Ethernet Switches][netgear-switch]

Since getting the USG, I have switched over to performing DHCP on it instead of my home server. This setup is still notifying clients to use the Pi-hole as the DNS server. 

This change alone was not going to get Pi-hole to display client names, two more changes were needed:

* in the Pi-hole DNS settings, turn on conditional forwarding pointing back to the IP address of the USG for the local domain in use.
* in the docker container configuration add configuration for "dns" pointing to 127.0.0.1. This is now the recommended setup in the [Pi-hole docker documentation][pihole-docker] as of version 4.1.1 onwards so I won't repeat the steps here.

Now I can see proper device hostnames. There is one ongoing issue however - I had changed the domain name for the network in the USG configuration but reverse DNS lookups still resolve hostnames with the default ".localdomain" instead of my configured domain name. This means that Pi-hole will also show hostnames ending with ".localdomain". This does only appear to be an issue with reverse lookups, regular DNS lookups do resolve on the correct domain name. I am still looking in to this part, but getting any sort of hostname is a plus. 

It is worth noting that I could not have used conditional forwarding when I was using the ISC DHCP Server as it does not include a DNS component. I would have had to run a Bind instance along side it as the DHCP server can perform dynamic DNS updates, but dnsmasq (which backs Pi-hole) does not support being updated in this way.




[usg]: https://www.amazon.co.uk/gp/product/B00LV8YZLK/ref=as_li_ss_tl?ie=UTF8&psc=1&linkCode=ll1&tag=devwithimag-21&linkId=df42dd15fb0f9e93ec2fb3dcb4c49cca&language=en_GB "UBIQUITI Networks Unifi Security Gateway Router"
[ac-lite]: https://www.amazon.co.uk/gp/product/B016K4GQVG/ref=as_li_ss_tl?ie=UTF8&psc=1&linkCode=ll1&tag=devwithimag-21&linkId=d8c040ef14f9c9cb25fffb161a1cb74d&language=en_GB "Ubiquiti Networks UAP-AC-LITE WLAN Access Point"
[netgear-switch]: https://www.amazon.co.uk/gp/product/B00TV4A96Q/ref=as_li_ss_tl?ie=UTF8&psc=1&linkCode=ll1&tag=devwithimag-21&linkId=74e2bae5d28e0654ac587c28dcd99b3f&language=en_GB "NETGEAR GS305-100UKS 5-Port Gigabit Metal Ethernet Desktop/Wallmount Switch,Grey"
[powerline]: https://www.amazon.co.uk/TL-PA8010PKIT-V2-Passthrough-Configuration-UK/dp/B0734B71N6/ref=as_li_ss_tl?ie=UTF8&linkCode=ll1&tag=devwithimag-21&linkId=2e9671e8202519e95e52bb5850a1635c&language=en_GB "TP-Link TL-PA8010PKIT V2 1-Port Gigabit Passthrough Powerline Starter Kit"
[pihole-docker]: https://hub.docker.com/r/pihole/pihole/ "pihole/pihole on Docker Hub"
[start-of-year]: /2019/01/07/christmas-holidays-a-time-for-tinkering/ "Christmas Holidays, a time for tinkering"
