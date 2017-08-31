---
title: Plex DVR with the Official Xbox One Digital TV Tuner - The direct approach
layout: post
series: Plex DVR with the Official Xbox One Digital TV Tuner
series_part: 2
summary: Does connecting the Xbox One Tuner to Plex in Docker work?
date: 2017-08-18 22:01
tags:
- Plex
categories: 
- Development
slug: plex-dvr-the-direct-approach
---
[Part one][part_1] of this series lay the groundwork of what I set out to achieve, to get Plex to use the [Xbox One Digital TV Tuner][tv_tuner].

The first avenue of investigation with an unsupported setup has to be: does it just work?

In order to answer this question, we needed to pass through the USB device through to Plex running in the Docker container.

<!--more-->

## Identifying the USB device path

Before we can pass through a device, we need to be able to identify the path for the device. 

We can use the `lsusb` command to list the devices which are connected to the host.

    [dhutchison@procent ~]$ lsusb
    Bus 001 Device 005: ID 045e:02d5 Microsoft Corp. Xbox One Digital TV Tuner

With the device and bus numbers shown, we can access the device in "/dev/bus/usb/001/005". This is not a stable approach however as the device number will change depending on the USB port being used, and if the device is disconnected and reconnected.

## Getting a consistent device path

In order to get a persistent device name, we need to create a [udev][udev] rule. 

> udev (userspace /dev) is a device manager for the Linux kernel. As the successor of devfsd and hotplug, udev primarily manages device nodes in the /dev directory. At the same time, udev also handles all user space events raised when hardware devices are added into the system or removed from it, including firmware loading as required by certain devices.
> -- <cite>[udev on Wikipedia][udev_wikipedia]</cite>

In order to get the device attributes we need to write a new rule, we can use `udevadm`.

    [dhutchison@procent ~]$ udevadm info -a --name=/dev/bus/usb/001/005
    Udevadm info starts with the device specified by the devpath and then
    walks up the chain of parent devices. It prints for every device
    found, all possible attributes in the udev rules key format.
    A rule to match, can be composed by the attributes of the device
    and the attributes from one single parent device.

    looking at device '/devices/pci0000:00/0000:00:1c.6/0000:04:00.0/usb4/4-2':
        KERNEL=="4-2"
        SUBSYSTEM=="usb"
        DRIVER=="usb"
        ATTR{bDeviceSubClass}=="00"
        ATTR{bDeviceProtocol}=="00"
        ATTR{devpath}=="2"
        ATTR{idVendor}=="045e"
        ATTR{speed}=="480"
        ATTR{bNumInterfaces}==" 1"
        ATTR{bConfigurationValue}=="1"
        ATTR{bMaxPacketSize0}=="64"
        ATTR{busnum}=="4"
        ATTR{devnum}=="4"
        ATTR{configuration}==""
        ATTR{bMaxPower}=="500mA"
        ATTR{authorized}=="1"
        ATTR{bmAttributes}=="a0"
        ATTR{bNumConfigurations}=="1"
        ATTR{maxchild}=="0"
        ATTR{bcdDevice}=="0110"
        ATTR{avoid_reset_quirk}=="0"
        ATTR{quirks}=="0x0"
        ATTR{serial}=="001234567890"
        ATTR{version}==" 2.00"
        ATTR{urbnum}=="14206613"
        ATTR{ltm_capable}=="no"
        ATTR{manufacturer}=="Microsoft Corp."
        ATTR{removable}=="unknown"
        ATTR{idProduct}=="02d5"
        ATTR{bDeviceClass}=="00"
        ATTR{product}=="Xbox USB Tuner"

In my case, I created a new rule file (as root) "/etc/udev/rules.d/99-usb-tv.rules", with the contents below (serial number redacted).

    ACTION=="add", ATTR{serial}=="001234567890", SYMLINK+="usbMicrosoftTV"

This rule is specific to my device, and would be a useful approach if you were planning on using more than one tuner. A more general purpose rule, targeting the vendor and model, is below.

    ACTION=="add", ATTR{idVendor}=="045e", ATTR{idProduct}=="02d5", SYMLINK+="usbMicrosoftTV"

The newly created rule should detected automatically, but the USB device may need to be disconnected and reinserted in order to take effect.

This rule results in the symlink "/dev/usbMicrosoftTV" being created pointing to the path in "/dev/usb/bus" when the device is connected.

## Passing a device to Docker

The docker run command can take an argument specifying a device to pass through to the container.

    docker run --device=/dev/usbMicrosoftTV (rest of the command here)

With our Plex container running with the tuner passed through, we can run a `bash` prompt in the running the container and check if the device is available.

First we need to get the ID of our running container from the list of running containers.

    [dhutchison@procent Docker]$ sudo docker ps
    
Then run the bash prompt.

    sudo docker exec -it <container> bash

Once we have a shell prompt in the container we can use `lsusb` and see that the container can see the USB device.

## Did it work?

No.

When trying to configure a tuner in the Plex web interface, no tuner is found and only the option to connect to an IP based tuner is available. 

It was worth a shot, but this unsupported tuner truely is not supported. However this is the approach we would need to take if we had a supported device. 

In the next post in this series, we will build a set up which does allow Plex to use this TV tuner.






[part_1]: /2017/08/16/plex-dvr-introduction/ "Plex DVR - Introduction"
[docker_run]: https://docs.docker.com/engine/reference/run/#runtime-privilege-and-linux-capabilities "Docker run reference" 
[udev]: https://wiki.archlinux.org/index.php/udev "udev - Arch Wiki"
[udev_wikipedia]: https://en.wikipedia.org/wiki/Udev "udev - Wikipedia"
[tv_tuner]: https://www.amazon.co.uk/gp/product/B00E97HVJI/ref=as_li_ss_tl?ie=UTF8&psc=1&linkCode=ll1&tag=devwithimag-21&linkId=cfc0f85bf90f4f64dd5f16b4fb431919 "Amazon - Official Xbox One Digital TV Tuner (Xbox One)" 
