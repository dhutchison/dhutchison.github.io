---
title: Raspberry Pi USB Boot with JMS578 Based USB-to-SATA Enclosures
summary: "Some JMS578 based USB-to-SATA enclosures cannot boot a Raspberry Pi 4B over
  USB 3 without a firmware update being applied. \n"
tags:
- RaspberryPi
categories:
- Development
date: 2021-01-03 18:29
slug: raspberry-pi-usb-boot-with-jms578-based-usb-to-sata-enclosures
---
During the festive holiday period a part of one of the projects I have been working on involved moving my home automation setup from a Raspberry Pi 3B+ to a Raspberry Pi 4B 4GB. As part of this, I wanted to switch from using an SD card to [booting from an SSD][usb-boot] for improved performance.

I already had spare parts lying around which would be reused for this. 

* [ORICO 2.5 Inch SATA to USB 3.0 Tool-free External Hard Drive Enclosure][orico-enclosure]
* [Crucial 256GB SSD][crucial-ssd]

After using the [Raspberry Pi Imager][rpi-imager] to provision the SSD with Raspberry Pi OS Lite, mounting the boot partition to add the `ssh` file, and connecting the enclosure to one of the USB 3 ports on the Pi it wouldn't boot. After a bit of digging I found a workaround to get this working. 

<!--more-->

This is in no way a recommendation for this USB enclosure, just a workaround to get it working. If I was buying new parts, I would do some research into working setups that others have used.  


While this is an Orico branded enclosure that I got in late 2019, I do also have an Anker enclosure that I have had for a few years which also did not boot and is visually the same. There may be many different branded versions of this generic enclosure. 

This is listed in the Amazon listing as using a JMS578 chipset, and there is a lengthy thread on a Raspberry Pi [GitHub issue][pi-jms578-issue] around flakey support. This suggests adding an extra setting to the beginning of the `/boot/cmdline.txt` file to enable `usb-storage` mode for the device (instead of the `uas` mode).

~~~
usb-storage.quirks=152d:0578
~~~

After adding this, it still wouldn't boot. Connecting it to a USB 2 port however did allow it to boot (albeit with much lower performance). I wanted to get to a USB 3 boot though, and forum posts suggested that it should have been possible. 

The "quirks" setting that we applied has a value that consists of of the vendor and device IDs for the USB device, and should match what `lsusb` lists. The values I tried came from the forum post, not my own checks. 


Running `lsusb` shows our device registering with an “unknown” vendor id, 0080, which didn't seem right. While trying to find out more about this device and if there were firmware updates available for it, I came across a post on the [ODROID forums][odroid-forum] talking about other issues with this chipset and sleep/wake behaviour. The manufacturer has no updated software on their site for it, and it sounds like it has more issues with long term usage. This forum post did however point to a [firmware updater utility][jms578-fw-update] on the ODROID site. 

Using this utility I could see that it reports back a firmware version, which I hoped confirmed that the product page was correct about the chipset used in the enclosure. 

```
pi@raspberrypi:~/JMS578FwUpdater $ sudo ./JMS578FwUpdate -d /dev/sda -v
Bridge Firmware Version: v0.2.0.4
```

Next I updated the firmware, using the instructions on the utility page and disabled the auto spin down feature (as I was using an SSD anyway).

```
pi@raspberrypi:~/JMS578FwUpdater $ sudo ./JMS578FwUpdate -d /dev/sda -f ./JMS578-Hardkenel-Release-v173.01.00.02-20190306.bin -b ./backup.bin -t 0
Update Firmware file name: ./JMS578-Hardkenel-Release-v173.01.00.02-20190306.bin
Backup Firmware file name: ./backup.bin
Auto spin-down timer: 0 min.
Backup the ROM code sucessfully.
Programming & Compare Success!!
```

Using the utility again to check the version number reported the original version, until I performed a reboot. I was running this utility from the PI, targeting the disk it was booting from over USB 2, so could not just disconnect and reconnect the device. 

After performing this firmware update, `lsusb` now reports the device as we expected to see.

```
Bus 001 Device 003: ID 152d:0578 JMicron Technology Corp. / JMicron USA Technology Corp. JMS567 SATA 6Gb/s bridge
```

Now I could shut down the Pi, move the enclosure to a USB 3 port and boot from USB 3 successfully. 

At the start we had enabled "quirks" mode to use `usb-storage` instead of `uas`. This is still required to maintain consistent drive performance, but on the upside we can now boot over USB 3 after performing this firmware upgrade.  

[usb-boot]: https://www.raspberrypi.org/documentation/hardware/raspberrypi/bootmodes/msd.md "USB mass storage boot - Raspberry Pi Documentation"
[rpi-imager]: https://www.raspberrypi.org/software/ "Raspberry Pi OS – Raspberry Pi"
[pi-jms578-issue]: https://github.com/raspberrypi/linux/issues/3070 "USB3.0 to SATA adapter causes problems - Issue #3070 - raspberrypi/linux"


[orico-enclosure]: https://www.amazon.co.uk/gp/product/B079FR7H5H/ref=as_li_ss_tl?&linkCode=ll1&tag=devwithimag-21&linkId=01b1cd6b8f7f80f9bd49c084b8e35012&language=en_GB "ORICO 2.5 Inch SATA to USB 3.0 Tool-free External Hard Drive Enclosure for 2.5" SATA III HDD and SSD with UASP Compatible for Windows Mac OS (Black)"
[crucial-ssd]: https://www.amazon.co.uk/gp/product/B00KFAGCWK/ref=as_li_ss_tl?ie=UTF8&psc=1&linkCode=ll1&tag=devwithimag-21&linkId=339cc941bb98c67ec7aac96333b4c4c1&language=en_GB "Crucial CT256MX100SSD1 256GB MX100 SATA 2.5 Inch 7mm SSD Includes 9.5mm Spacer"

[odroid-forum]: https://forum.odroid.com/viewtopic.php?t=28535 "Automatic Spin-Down of SATA Drive - ODROID"
[jms578-fw-update]: https://wiki.odroid.com/odroid-xu4/software/jms578_fw_update "odroid-xu4:software:jms578_fw_update [ODROID Wiki]"
