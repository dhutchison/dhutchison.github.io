---
title: Adding HomeKit Devices to HomeAssistant
summary: A quick how-to on adding HomeKit devices into Home Assistant
category:
- iot
tags:
- HomeAssistant
- Meross
date: 2023-09-26 00:01
slug: adding-homekit-devices-to-homeassistant
---

One of the first smart home devices I purchased was a [Meross MSS425F power strip](https://amzn.to/45XyngX), which has 4 individually controllable sockets and a group of 4 USB ports that are controlled in a single block. At the time I had not yet discovered Home Assistant, and was using the Apple Home application to control my smart home. 

This device was the last thing I did not have in Home Assistant and it was leaving my night time automation incomplete - so it was time to finally get it added in. There is a [HomeKit Device](https://www.home-assistant.io/integrations/homekit_controller/) integration, but I couldn't see from the pre-requisites how to get this device discovered - although it is pretty easy. The basic steps I took were:

1. With my iPhone on Wi-Fi network I wanted the device to join, add device to Home through the Meross app
2. Remove the device from the Apple Home app
3. Home assistant will now discover it. The Configure  button will prompt for the HomeKit code on the bottom of the device

...and that is it. The first two steps were not immediately obvious from the Home Assistant documentation, but are probably required for most WiFi HomeKit devices. 