---
title: Centos, MakeMKV and External Drives
summary: Working with permissions using udev
date: 2017-01-22 23:35
slug: centos-makemkv-and-external-drives
categories: Development
tags:
- CentOS
- udev
---
For most of the last two years, I have been using an HP Microserver as my media server (running [plex][plex]) and general development server running on CentOS 7. A few months ago I bought an external Blu-Ray writer, specifically a Samsung SE-506, for use with it.

In the past I have tried [MakeMKV][makemkv] for extracting MKV files from some old home made DVDs, and I wanted to try this directly from the server. I had two problems when trying this:

1. The drive was not supported by the libusb version supplied with the version of CentOS which was available at the time, fortunately the release of CentOS 7.3 brought the support I needed. 
2. MakeMKV was unable to use the attached drive unless it was being ran by root.


In order to allow MakeMKV to be able to access the drive when ran as a non-root user, a new [udev][udev] rule is needed. My drive is mounting as the device "/dev/sr0", so I created a new file "etc/udev/rules.d/80-bluray.rules" with the content:

~~~
    KERNEL=="sr?", MODE="0666"
~~~

This file will target any "sr" device and change the permissions so it is accessible by any user (the default permissions where 0660). More details are available in the [udev][udev] documentation - it looks to be an enourmously powerful utility.


[makemkv]: http://www.makemkv.com "MakeMKV"
[plex]: https://www.plex.tv "Plex Media Server - Your media on all your devices"
[udev]: https://wiki.archlinux.org/index.php/udev "udev"
