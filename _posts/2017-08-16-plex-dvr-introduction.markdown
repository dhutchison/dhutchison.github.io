---
title: Plex DVR - Introduction
layout: post
series: Plex DVR with the Official Xbox One Digital TV Tuner
series_part: 1
summary: Introduction to series on Plex DVR with the Official Xbox One Digital TV
  Tuner
date: 2017-08-16 21:56
tags:
- Plex
categories: 
- Development
slug: plex-dvr-introduction
---
I have been using [Plex][plex] as the software powering my media server for around two years now, and recently opted to pay for a lifetime Plex Pass. It does get used daily, and some of the features of the paid version looked particularly useful, such as the offline mobile media sync and the (beta) Live TV & DVR feature.

Since I dropped my subscription to satellite television 6 months or so ago, I have been without the ability to record anything which shows on TV, and need to rely on catch up services. In reality, this is not much of a problem as I do not watch a lot of television, but there are a couple of programs I watch which I would like to keep.

My home antenna does have a cable terminating in to the same room as my server sits and, while not on the [supported hardware list][plex_supported_hardware], I do have a [Microsoft Official Xbox One Digital TV Tuner][tv_tuner] lying about unused. 

The setup I am starting with is:
* HP Gen8 MicroServer running Centos 7
* Plex running as a Docker container
* [Microsoft Official Xbox One Digital TV Tuner][tv_tuner]

It was worth spending a bit of time trying to get this tuner device working, as I already had it, and it is a cheap USB tuner compared to the devices which are officially supported (~£8, vs the cheapest of the supported devices being the [Hauppauge Freeview HD TV for Xbox One][haupage_tuner] at ~£40). Also, the host OS I use rules out the [Hauppauge Freeview HD TV for Xbox One][haupage_tuner] anyway, as the only operating system listed for Linux support is Ubuntu 16.4.

This is the introduction to a series of posts documenting the journey to getting Plex DVR working with this unsupported device. The approach has been rife with failures, but has been a learning experience and, while a bit less clean than I would like, it works. 


[plex]: https://www.plex.tv "Plex Media Server - Your media on all your devices"
[plex_dvr]: https://www.plex.tv/features/live-tv-dvr/ "Plex Live TV & DVR for Cord Cutting | Plex" 
[plex_supported_hardware]: https://support.plex.tv/hc/en-us/articles/225877427-Supported-DVR-Devices-and-Antennas "Supported DVR Tuners and Antennas – Plex" 
[tv_tuner]: https://www.amazon.co.uk/gp/product/B00E97HVJI/ref=as_li_ss_tl?ie=UTF8&psc=1&linkCode=ll1&tag=devwithimag-21&linkId=cfc0f85bf90f4f64dd5f16b4fb431919 "Amazon - Official Xbox One Digital TV Tuner (Xbox One)" 
[haupage_tuner]: https://www.amazon.co.uk/d/Electronics-Photo/HAUPPAUGE-Xbox-One-Win10-Freeview-Stick-Black/B01LVTNQ4K/ref=as_li_ss_tl?ie=UTF8&qid=1502657379&sr=8-1&keywords=Hauppauge+Freeview+HD+TV+for+Xbox+One&linkCode=ll1&tag=devwithimag-21&linkId=815f7f369d0f9dcd2c588ed40a039298 "HAUPPAUGE Xbox One with Win10 Freeview HD USB Stick - Black"
