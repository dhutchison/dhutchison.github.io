---
title: Using Cloudflare for Dynamic DNS on Unifi
tags:
- unifi
- cloudflare
summary: Using Cloudflare for Dynamic DNS on Unifi OS without any additional local
  components
date: 2022-05-28 12:13
slug: using-cloudflare-for-dynamic-dns-on-unifi
---
I have recently been revisiting my home server setup and moving more "core" tools onto Raspberry Pis as opposed to my ageing HP MicroServer. As part of this, I had been checking if the way I had things set up was still a good way to go. 

Up until last week I was using [ddclient](https://github.com/ddclient/ddclient) for updating a DNS record in Cloudflare with my home IP address for the (now rare) cases where I need remote access back into my home network. I had always found it strange that the Dynamic DNS options in Unifi did not support Cloudflare. 


Now there is the [Cloudflare DDNS for UniFi OS](https://github.com/willswire/unifi-cloudflare-ddns) project. 

>  Cloudflare Worker script that exposes a UniFi-compatible DDNS API to dynamically update the IP address of a DNS A record.


With this I can deploy a (free) Cloudflare worker that the Unifi OS can call to update my DNS record without requiring to run additional service containers on my local network. 


I did initially have some problems setting this up (which have now fixed by a PR), and this blog post was very helpful in providing commands that could be ran from the USG-3P to force Dynamic DNS updates while I was testing changes: [Configuring Ubiquiti UniFi USG to use Namecheap DDNS](https://daltonflanagan.com/configuring-ubiquiti-unifi-usg-for-namecheap-ddns/).
