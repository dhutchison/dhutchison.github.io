---
title: Restarting PoE via SSH on a USW-Lite-16-PoE
summary: How to remotely restart a PoE device without a working Unifi controller
tags: unifi
date: 2022-08-07 23:04
slug: restarting-poe-via-ssh-on-a-usw-lite-16-poe
---

I recently moved my Unifi controller off of my Proliant MicroServer and on to a Raspberry Pi, which is powered via PoE from my main Unifi USW-Lite-16-PoE switch. This evening this Pi was unresponsive, and unlike on the MicroServer there is no out-of-band interface I could use to restart it. If this did not host the Unifi controller I could have used the controller to power-cycle the PoE port, but as the controller couldn't be accessed either I needed another approach. While I could have just got up and went under the stairs to pull some cables, it would be preferable to be able to solve this via SSH.

There are [many posts][telnet_post] on the Unifi community forums with solutions for this involving `telnet` after connecting to the switch via SSH, but `telnet` is not available on the newer devices like the USW-Lite-16-PoE. 

I came across this [reddit post][reddit_post] which pointed me in the direction of the `swctrl poe` command. 


To list the PoE status of the ports on this device that support PoE:

```
NetworkRack-USW-Lite-16-US.6.2.5# swctrl poe show id 1-8
Total Power Limit(mW): 45000

Port  OpMode      HpMode    PwrLimit   Class   PoEPwr  PwrGood  Power(W)  Voltage(V)  Current(mA)
                              (mW)                                                               
----  ------  ------------  --------  -------  ------  -------  --------  ----------  -----------
   1    Auto        Dot3at     32000  Class 2      On     Good      1.38       53.24        26.00
   2    Auto        Dot3at     32000  Unknown     Off      Bad      0.00        0.00         0.00
   3    Auto        Dot3at     32000  Class 4      On     Good      3.40       53.11        64.00
   4    Auto        Dot3at     32000  Unknown     Off      Bad      0.00        0.00         0.00
   5    Auto        Dot3at     32000  Unknown     Off      Bad      0.00        0.00         0.00
   6    Auto        Dot3at     32000  Class 4      On     Good      6.81       53.24       128.00
   7    Auto        Dot3at     32000  Unknown     Off      Bad      0.00        0.00         0.00
   8    Auto        Dot3at     32000  Class 3      On     Good      4.63       53.24        87.00
```

This doesn't include any of the port labels, but at a guess the highest current draw is likely the Pi that has hung. 

This port can be turned off by running `swctrl poe set off id 6`, then switched back on with `swctrl poe set auto id 6`. 

As a word of caution with this though - originally I had ran `swctrl poe set off 6` (note the missing `id` between `off` and `6`). This is the incorrect syntax, so it ignores the number and turned PoE off on all ports of the switch. This was a problem for me as the Wifi Access Points were also powered by this switch so I needed to go reconnect with a cable to re-enable PoE for the access points too. 

A safer option, sent in by Shawn Kelley, is the `restart` command. So instead of setting poe "off" then "on" you can run `swctrl poe restart id 6` to power cycle the port. 



[telnet_post]: https://community.ui.com/questions/Power-Cycle-POE-port-on-UniFi-Switch-remotely-/f14675bd-85ae-41de-a524-5ffdfcdca7bf "Power Cycle POE port on UniFi Switch remotely. - Ubiquiti Community"
[reddit_post]: https://www.reddit.com/r/Ubiquiti/comments/ngudcr/uswlite16poe_power_control_of_poe_port/ "USW-Lite-16-PoE power control of PoE port? : Ubiquiti"
