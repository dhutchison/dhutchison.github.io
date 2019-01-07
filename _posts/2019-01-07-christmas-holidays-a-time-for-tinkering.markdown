---
title: Christmas Holidays, a time for tinkering
layout: post
summary: The Christmas break has been a chance to work on some little projects that
  have been building up.
date: 2019-01-07 22:32
slug: christmas-holidays-a-time-for-tinkering
---
Ah, the Christmas holidays - a few weeks of rest & relaxation, not having to think about work at all. 

So of course it was time to get some little ongoing projects moving!

(Warning - this feels like a long one!)

<!--more-->

<div class="toc-container">
<p class="toc-title">In this post:</p>
* This list should be replaced with a ToC
{:toc}
</div>

## The rebuild

Twas the night before Christmas Eve and all was quiet, a standard "dnf update" was ran and oh no! Services are not working after the reboot!

Looks like I hit a [known issue][zfs_dkms_issue] with the ZFS-DKMS package and the upgrade screwed the DKMS configuration, meaning that the ZFS kernel modules were not recompiling. Reinstalling packages did not seem to help at all so it was rebuild time. 

Ubuntu 18.10 (Cosmic Cuttlefish) has now been [released][ubuntu_release], and is built on version 4.18 of the Linux Kernel. This is higher than the 4.16 which was the original driver to go to Fedora for getting our [XBox One Tuner working with Plex][plex_dvr_post]. It includes ZFS built in so should be more stable in this regard.

At the time of writing, there [is not a stable Docker-CE release][docker_ce_cosmic], but a version is available in the "test" repository so I'm using that for now (and around a week in, I'm seeing no issues).

The work I've been doing recently to docker-ise the services I run on my home server, and many utility scripts, paid off here as the rebuild process was fairly painless. I had everything back up and running with the new OS in an hour or so, as all I needed to do was:

* install a few software packages
* set the static IP address for the server
* create some users and groups
* import my existing ZFS data pools

The most complicated part of the install was getting it to overwrite the SSD I was trying to use, which had previously had some mirrored LVM volumes on it. As the volumes had been mirrored, and the other drive was not available, the installation wizard would not let me remove them. As a quick workaround I ended up bringing up a shell from the installer and using `dd` to zero the first part of the drive to wipe out the partition table. 

## Angular, Electron & MoneyWell

Over the last few months I have been trying to re-learn Angular, after having not touched it since I completed a Proof of Concept project at work a little over a year ago. I generally find the best way to absorb information like this is to try to build something, so I needed a project. 

Over the years I have left and came back to [MoneyWell][moneywell]. It is a personal finance application that could have a lot of promise, but it goes through spurts of development and then being abandoned. I had been trying a few months ago to make more of an informed budget, but found getting statistical information back out of the application pretty difficult. As a result, the learning project for Angular (and Electron) has been an application which can do reporting on the data held in the MoneyWell SQLite database. 

There is still quite a bit of work to do on this before I put it up publicly, but it has been useful for learning. The biggest problems so far have been in attempting to reverse engineer the database structure to get accurate information out.

## PiHole DHCP

Over the last few months I have been using [PiHole][pihole] in a docker container, paired with the [Cloudflare DNS service over HTTPS][cloudflare_https_dns], to provide DNS with ad-blocking built in.

The key to getting all devices on the network using this depends on being able to set the IP for this server as a DHCP option. I had been using a Netgear R7000P as my router which did allow a DNS server to be set, but the end result of this was that clients used the router as the DNS server, which then performed the required lookups against the PiHole. This does have the end result of filtering being applied, but it means the only "client" the PiHole sees is the router. This removes one of the benefits of being able to understand of what client devices are talking to.

To do this properly we need a DHCP server running, and the PiHole has the option to handle this. This has hit some issues though, likely linked to running the service in a Docker container. Some of the proposed solutions to this involve using the host network mode, but I am not wanting to do this as I want to run additional services on the 80/443 ports and I am taking advantage of Nginx and server name based virtual hosts. 

I have been trying to narrow down why this does not work with PiHole in the Docker container, so I have been trying a few other avenues, but I have not got to a solution yet. In the interim I have installed a DHCP server directly on my server (using [this tutorial][dhcp_install_tutorial]), so at least I have proved the DHCP requests are getting to the server - I just need to figure out why the Docker container could not.

## Configuring a Raspberry Pi 3B+ as a retro games console

As part of my Christmas present from my girlfriend I got a Raspberry Pi 3B+ kit including a case and a couple of SNES style controllers labeled as by GEEEKPi.

For the game console setup I started following [this tutorial by the Wirecutter][wirecutter_rpi], but the recommended operating system (Recalbox) has not yet been officially updated to support the 3B+ hardware. What I have ended up installing instead is [batocera.linux][batocera_linux]. This started off as a fork of Recalbox (and appears to get more frequent updates) but the install process was pretty much identical. I had a spare 16GB Micro-SD card lying around so I have left the one the kit came with, preinstalled with Raspbian, alone for future tinkering. 

So now, when I'm not playing through Assassin's Creed Odyssey, I can re-live my youth and play excessive amounts of 2D Mario games and Super Bomberman.

## Troubleshooting / returning broken R7000P

Back in September I picked up a Netgear R700P (aka Netgear AC 2300 Nighthawk Wireless Router) to make up for the performance issues I was seeing with the Virgin Media supplied Hub 3. This choice was largely just based off the [Wirecutter Best Wifi Router][wirecutter_best_wifi] review as it was the top pick.

I got lazy, didn't do enough research and ended up with an absolute piece of junk. I don't know if it ever worked fully, but it wasn't long before I hit a [seemingly][r7000p_issue_3] [common][r7000p_issue_2] [issue][r7000p_issue_1] where the 5GHz radios just seem to disappear. The comments on the Wirecutter post are filled with reports of this, as are the Netgear product forms. The status pages on the router just show a big red X for the network, and the "missing character" type of glyph where the channel number should be. 

It also required a weekly reboot as it just seemed to get to a point where it stopped processing packets. This was with the router purely doing wired and wireless connections - not using any of the more advanced features such as VPNs and USB device sharing. In the last few weeks of use it was not even performing DHCP & DNS functions as these were being handled by my server instead. 

As I had a bit of free time it was worth doing the bare minimum troubleshooting prior to returning the device as defective: a factory reset followed by a firmware downgrade to what it shipped with. Neither of these made the slightest bit of difference, so back it went. 

This leaves me currently just with my Virgin Hub 3, and it took about 20 minutes to remember why it had been put in Modem mode in the first place. It supports both the 2.4 and 5GHz Wifi bands, and up to the 802.11ac WiFi specification - but the useful range on it is next to useless. It can effectively cover the room which the device is in, but any further results in a "full signal" but no working coverage. My smart thermostat in the hall is able to see the SSID, but cannot connect (likely around 14ft away, through a single wall). It also seems to be a bit unstable, with multiple wired devices connected to the router resulting in dropped connections (particularly noticeable on XBox Live). At the range between the XBox One and the Hub, Wifi performance is not good (the distance is around a whole foot), but at least the connection appeared to be more stable. This wire performance issue appears to go away if all my wired devices are going in to an [unmanaged switch][dumb_switch], and then only the switch is plugged in to the router directly. 

As a temporary measure, I have an old [TL-WA850re][tl-wa850re] running the [Gargoyle][gargoyle] router firmware to allow the device to work as an Access Point (of sorts). I have a V1 of this device, and the ability to use the device as an access point in the native TP-Link firmware is only available in newer versions of the hardware. This Access Point is sitting in my hall and provides usable 2.4GHz 802.11N coverage over the entire house. The only downside to this is it appears to require to be in it's own subnet and do it's own DHCP (meaning connected devices are not being given the details of the PiHole DNS server for instance).

I have been looking for what I want to get to get to a more stable setup and I think it is going to be done in a few phases over the next few months. 

The first priority is to get some decent Wifi coverage throughout the house. Using the Wifi Analysis feature in the free version of [NetSpot][netspot_app], and walking about with my laptop, the TP-Link device is actually achieving at least 50% signal throughout the entire house (on both storeys). It is situated at floor level in the middle of one edge of the house, so not exactly ideal positioning, but for such a small (and old) device it is doing remarkably well. So range wise it is performing fine, but I would like support for the newer wireless technologies and the reduced interference of the 5GHz band to allow higher speeds when closer to the Wifi Access Point. 

Based on various reviews I've seen, I think a [Ubiquiti UAP-AC-LITE Access Point][uap_ac_lite] is the right direction to take here, so I have one on order due to arrive in the next few days. 

After that, a [Unifi Security Gateway Router][usg] is on the list. A lot of the discussion around performance I have been seeing around the USG seem to set the benchmark around it being unable to do gigabit WAN speeds, which is not an issue I expect to see in the remotely near future. It sounds like [around 600Mbps is possible][usg_speed_1] (again, much higher than I can get) with the Deep Packet Inspection feature turned on (a feature I am interested in just for analytics more than anything). I have also seen some reports of it not being able to do more than 80Mbps with QoS turned on - while results may vary I do not see this being a feature I actually need to use. I did have this setup on a DD-WRT router over 10 years ago when my internet speeds were very low, but now I see it being a lot less of an issue now I have a 100Mbs connection. 

## So What's Next?

As you can probably see, quite a few of these projects still have work to do, so in the near future there should be follow ups detailing what I've got working and learned on the journey. 

I am not one for the whole "new year, new me" type of posts, so I don't have any "this year will be different" type of goals. There are however a few targets I have already for the coming year: 

* I am aiming to get at least one associate level AWS certification (although this overlaps with work, it will still require additional time outside of work)
* Learn more about Angular application development. While I have thrown together a Proof of Concept web application in Angular before, I never really learned how to do development properly with TypeScript and Angular, particularly around testing. I can see a number of ways where the MoneyWell Visualisation application can grow, and this application should act as a good experimentation project for learning. 
* Write more. This may just be trying to make a short journal part of my daily routine, but I do feel that this will help going forward with the days that seem like nothing was achieved and provide something to look back on.
* Plan more effectively. I have went through various drives over the years to be more organised and keep TODO lists etc, but I've fallen off the productivity wagon over the last year, and it is not a good feeling. This, combined with writing more, aims to help me achieve more, and feel that I have achieved things. 


[ubuntu_release]: https://wiki.ubuntu.com/CosmicCuttlefish/ReleaseNotes "CosmicCuttlefish/ReleaseNotes - Ubuntu Wiki"
[plex_dvr_post]: /2018/04/22/plex-dvr-with-the-official-xbox-one-digital-tv-tuner-the-direct-and-working-approach/ "Plex DVR with the Official Xbox One Digital TV Tuner - The Direct (and working!) Approach" 
[docker_ce_cosmic]: https://github.com/docker/for-linux/issues/442 "docker-ce package is missing for Ubuntu "Cosmic" 18.10 x86_64  · Issue #442 · docker/for-linux · GitHub" 
[zfs_dkms_issue]: https://github.com/zfsonlinux/zfs/issues/7457 "dnf/yum reinstall of dkms rpms removes dkms config · Issue #7457 · zfsonlinux/zfs · GitHub"

[pihole]: https://pi-hole.net "Pi-hole: A black hole for Internet advertisements"
[cloudflare_https_dns]: https://developers.cloudflare.com/1.1.1.1/dns-over-https/cloudflared-proxy/ "Running a DNS over HTTPS Client - Cloudflare Resolver"
[dhcp_install_tutorial]: https://www.tecmint.com/install-dhcp-server-in-ubuntu-debian/ "How to Install a DHCP Server in Ubuntu and Debian"

[wirecutter_best_wifi]: https://thewirecutter.com/reviews/best-wi-fi-router/ "The Best Wi-Fi Router for 2018: Reviews by Wirecutter | A New York Times Company"
[r7000p_issue_1]: https://community.netgear.com/t5/Nighthawk-WiFi-Routers/r7000p-nighthawk-5g-channel-reads-gibberish/m-p/1642812 "Re: r7000p nighthawk 5g channel reads gibberish - NETGEAR Communities" 
[r7000p_issue_2]: https://community.netgear.com/t5/Nighthawk-WiFi-Routers/R7000P-5ghz-channel-broken/td-p/1261955 "R7000P 5ghz channel broken? - NETGEAR Communities" 
[r7000p_issue_3]: https://www.reddit.com/r/NETGEAR/comments/9c40jm/netgear_r7000p_5ghz_issues/ "Netgear R7000P 5ghz issues : NETGEAR" 

[tl-wa850re]: https://www.amazon.co.uk/Universal-Extender-Broadband-Ethernet-TL-WA850RE/dp/B00AHXXJVW/ref=as_li_ss_tl?ie=UTF8&qid=1546291510&sr=8-1&keywords=tl-wa850re&linkCode=ll1&tag=devwithimag-21&linkId=e8bfc09a05d4723cac20046867cb2932&language=en_GB "TP-Link N300 Universal Range Extender, Broadband/Wi-Fi Extender, Wi-Fi Booster/Hotspot with 1 Ethernet Port, Plug and Play, Built-in Access Point Mode, UK Plug (TL-WA850RE)"
[dumb_switch]: https://www.amazon.co.uk/gp/product/B00TV4A96Q/ref=as_li_ss_tl?ie=UTF8&th=1&linkCode=ll1&tag=devwithimag-21&linkId=a1e0692d578efdd2b638701df6ca1ee5&language=en_GB "NETGEAR GS305-100UKS 5-Port Gigabit Metal Ethernet Desktop/Wallmount Switch,Grey"
[gargoyle]: https://www.gargoyle-router.com "Gargoyle Router Management Utility"
[netspot_app]: http://netspotapp.com/ "FREE WiFi Site Survey Software for MAC OS X & Windows"
[uap_ac_lite]: https://www.amazon.co.uk/Ubiquiti-Networks-UAP-AC-LITE-Access-Point/dp/B016K4GQVG/ref=as_li_ss_tl?rps=1&ie=UTF8&qid=1546296456&sr=8-1&keywords=uap-ac-lite&refinements=p_76:419158031&linkCode=ll1&tag=devwithimag-21&linkId=3cca025a623ce4a2dd5bd8928598d29f&language=en_GB "Ubiquiti Networks UAP-AC-LITE WLAN Access Point" 

[usg]: https://www.amazon.co.uk/UBIQUITI-Networks-Security-Gateway-Router/dp/B00LV8YZLK/ref=as_li_ss_tl?ie=UTF8&qid=1546806005&sr=8-1&keywords=usg+unifi&linkCode=ll1&tag=devwithimag-21&linkId=6af91a4d35b2234269e910e9bf24795a&language=en_GB "UBIQUITI Networks Unifi Security Gateway Router"
[usg_speed_1]: https://community.ubnt.com/t5/UniFi-Routing-Switching/Performance-of-USG-3-Gigabit-WAN-speed-results/td-p/1936042 "Performance of USG-3 @ Gigabit WAN speed results - Ubiquiti Networks Community" 

[wirecutter_rpi]: https://thewirecutter.com/reviews/raspberry-pi-game-console/ "How to Turn a Raspberry Pi Into a Game Console: Reviews by Wirecutter | A New York Times Company"
[batocera_linux]: https://batocera-linux.xorhub.com "batocera.linux"

[moneywell]: https://moneywellapp.com "MoneyWell — Personal Finance Software for Mac and iOS"
