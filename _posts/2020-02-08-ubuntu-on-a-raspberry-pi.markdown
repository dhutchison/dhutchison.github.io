---
title: Ubuntu on a Raspberry PI
layout: post
summary: Headless Configuration of Ubuntu on Raspberry Pi
categories:
- Development
tags:
- Ubuntu
- RaspberryPi
date: 2020-02-08 23:54
slug: ubuntu-on-a-raspberry-pi
---
As part of some experimentation I was doing with Docker Swarm I encountered some inconsistent behaviour in my setup. To rule out inconsistencies in OSs (since I was using a combination of Ubuntu and Debian Buster), I had a look at the install process for Ubuntu on a Raspberry Pi.

The Raspberry Pi which was spare for this experiment was a model 3A+, so no ethernet and only a single USB port. With Raspbian I would have added "wifi_supplicant.conf"[^1] and "ssh"[^2] files to configure the WiFi and enable SSH as part of the first boot. 

I was looking for a similar approach that would work for a headless Ubuntu install. 

I came across this project: [Raspberry Pi Cloud-Init for WiFi][project_orig]. This uses the cloud-init system to configure, amongst other things, WiFi. This basically provides a few scripts to generate some additional files to copy on to an Ubuntu imaged SD card.

I did find however that it required a few updates to make it work for me on Ubuntu 19.10. 

<!--more-->

## Partitioning

With the project as it was, I was seeing the installation process fail part way through to the disk partition for the root filesystem becoming full, which would solve itself after a restart. 

~~~
dhutchison@devpi0:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            185M     0  185M   0% /dev
tmpfs            41M  4.1M   37M  10% /run
/dev/mmcblk0p2  2.6G  2.6G     0 100% /
(skipping other partitions)
~~~

This was solved as part of the installation by adding running "partprobe" and "resize2fs /dev/mmcblk0p2" as part of the installation script. This has the effect of having the OS re-read the partitions and resize our root filesystem to fit the partition. 

## Passwords

Part of the configuration for the script involved putting in a "shadow" formatted hashed password. Many of the common approaches for this involve either using either openssl or python, but these seem to be platform specific. 

I primarily use a Mac as my personal development machine. The "openssl" command is provided through [LibreSSL][libressl], but this does not provide some of the more secure hashing algorithms which are available in the OpenSSL library. The only option which can be used to hash passwords of more than 10 characters is MD5, which has not been considered secure in a while. 

Various Stack Overflow answers suggest solutions which use some variant of this python 3 command. 

~~~ bash
python3 -c 'import crypt,getpass; print(crypt.crypt(getpass.getpass(), crypt.mksalt(crypt.METHOD_SHA512)))'
~~~

This does not work on macOS as it relies on the underlying system provided crypt function. More detail on this can be found in [this Stack Overflow answer][crypt_so].

This did point me towards an approach using the [passlib][passlib] module. While the answer shows how to use the MD5 version, there is also a SHA-512 version which we can use. 

~~~ bash
python3 -m pip install passlib
python3 -c 'from passlib.hash import sha512_crypt; import getpass; print(sha512_crypt.hash(getpass.getpass()))'

~~~

## Checking Progress

One first boot of the Ubuntu system, it may take a while to actually finish the installation. It will continue to run after you become able to SSH onto the system. 

While running, you can check the progress by tailing a log file.

~~~ bash
sudo tail -f /var/log/cloud-init-output.log
~~~

## Other Changes

I have committed my fork of this project on GitHub [here][project_mine]. 

Most of the other changes related to personal preference, where if I am re-running the "config.sh" script to regenerate the files required to copy onto the SD card, I'd prefer to be prompted for the configuration values. 

[^1]: See the "Adding the network details to the Raspberry Pi" section of [Setting WiFi up via the command line][wifi_supplicant]
[^2]: See the "Enable SSH on a headless Raspberry Pi (add file to SD card on another machine)" section of [SSH][ssh]

[wifi_supplicant]: https://www.raspberrypi.org/documentation/configuration/wireless/wireless-cli.md "Setting WiFi up via the command line - Raspberry Pi Documentation"
[ssh]: https://www.raspberrypi.org/documentation/remote-access/ssh/ "SSH (Secure Shell) - Raspberry Pi Documentation" 
[project_orig]: https://gitlab.com/Bjorn_Samuelsson/raspberry-pi-cloud-init-wifi "Raspberry Pi Cloud-Init for WiFi"
[project_mine]: https://github.com/dhutchison/raspberry-pi-cloud-init-wifi "dhutchison/raspberry-pi-cloud-init-wifi: Raspberry Pi Cloud-Init for WiFi"

[libressl]: https://www.libressl.org "LibreSSL"
[crypt_so]: https://stackoverflow.com/a/13052999/230449 "c - python crypt in OSX - Stack Overflow"
[passlib]: https://passlib.readthedocs.io/en/stable/ "Passlib 1.7.2 documentation — Passlib v1.7.2 Documentation"
