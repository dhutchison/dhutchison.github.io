---
title: Updating the Unifi Controller URL in Home Assistant
summary: Updating the URL for a Unifi controller in Home Assistant, when there is
  no configuration option in the UI for this.
category:
- iot
tags:
- HomeAssistant
date: 2023-04-07 00:21
slug: updating-the-unifi-controller-url-in-home-assistant
---

In the last few weeks I've been changing over the domain name that my lan runs on. This broke some of the Home Assistant integrations I use, like the Unifi integration - but there is no option in the UI to reconfigure the controller URL. Now I could have removed & re-added the integration, but that would have resulted in recreating the entities with a new name (usually with a "_2" suffix).

So to work around this I have found where the configuration which is performed through the UI is stored - `/config/.storage/core.config_entries`. This is where all the warnings come in - you are not meant to manipulate this file manually. Things may break, the world may end. Ensure you have good backups and keep a hold of your [towel](https://hitchhikers.fandom.com/wiki/Towel).

For the Unifi integration, this file will contain an object like this:

``` json
      {
        "entry_id": "0820e19d88fb12000d1ca989774c98f2",
        "version": 1,
        "domain": "unifi",
        "title": "Home",
        "data": {
          "host": "unifi.lan.devwithimagination.com",
          "username": "metrics",
          "password": "<REDACTED>",
          "port": 443,
          "verify_ssl": true,
          "site": "default",
          "controller": {
            "host": "unifi.lan.devwithimagination.com",
```

To update the URL for my controller I stopped my Home Assistant container, edited the URLs in this file, then started Home Assistant back up. This same approach also worked for the Pi-hole integration.
