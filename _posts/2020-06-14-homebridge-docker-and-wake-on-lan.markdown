---
title: Homebridge, Docker, and Wake-on-Lan
layout: post
summary: How to send Wake-on-Lan packets from within a Docker container without using
  host networking
series: Running HomeBridge on Docker without Host Network Mode
series_part: 3
categories:
- Development
tags:
- Docker
- HomeBridge
- HomeKit
date: 2020-06-15 23:18
slug: homebridge-docker-and-wake-on-lan
---

Continuing on from the previous post in this series, I have been doing a bit more investigation into solving the issues I was having with the [homebridge-samsung-tizen][homebridge-samsung-tizen] plugin. All the features of the plugin were functioning as expected, with the exception of powering on the TV. This depends on Wake-on-Lan, which by default only works in the same network subnet, something which is not true unless the docker container is ran in host network mode. I have now found how to configure this to work. 

<!--more-->


## Listening for Broadcast Traffic

For the purposes of investigating this I did not want to be turning my TV on and off repeatedly, so I used `tcpdump` to [inspect the network traffic][so_tcpdump_wol] that used the ports that can be used for Wake-on-Lan packets. 

In this example I had attached tcpdump to the interface the docker container was in directly, just to verify the approach worked. 


~~~ bash
dhutchison@procent:~$ sudo tcpdump -i br-b0695d90ec6a '(udp and port 7) or (udp and port 9)'
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on br-b0695d90ec6a, link-type EN10MB (Ethernet), capture size 262144 bytes
14:34:21.033509 IP 172.29.0.6.35290 > 172.29.255.255.discard: UDP, length 102
14:34:21.134265 IP 172.29.0.6.35290 > 172.29.255.255.discard: UDP, length 102
14:34:21.234811 IP 172.29.0.6.35290 > 172.29.255.255.discard: UDP, length 102
~~~

So broadcasting to the docker network subnet works fine, we just need to establish how to cross the subnet boundary.

For more isolated testing, I created a basic Docker container which used the python [awake][py_awake] library for sending Wake-on-Lan packets. 

~~~
FROM python:3-alpine  
RUN pip3 install awake

ENTRYPOINT ["awake"]
~~~


Once built (I called it "wol"), this takes in a few arguments when ran:

* the broadcast IP address of the network to send the packet to
* the mac address of the device to be woken


~~~
pi@devpi1:~ $ docker run --rm --network=core_traefik-backend wol -b 192.168.0.255 aa:bb:cc:dd:ee:ff
Sending magic packet to 192.168.0.255 with broadcast 192.168.0.255 MAC aa:bb:cc:dd:ee:ff port 9
~~~

## Allowing Broadcast Traffic to be Re-Broadcast

The controls which prevent a broadcast packet received on one network interface being sent to another are part of the linux kernel. In our scenario one of these network interfaces is a docker bridge network as opposed to an external network, but the same controls apply. 

These settings require to be set:

* net.ipv4.icmp_echo_ignore_broadcasts=0
* net.ipv4.conf.all.bc_forwarding=1
* net.ipv4.conf.${interface}.bc_forwarding=1

This last setting requires "${interface}" to be replaced with the name of the network interface which relates to the docker network. Even though the setting before it is for "all", it does not seem to work on its own and the specific interface setting also isn't enough on its own. 

I have put together a script [configure_docker_networks_for_wol.sh][configure_script], which for a specific docker network, configures these settings. These are configured using both "sysctl -w" and as a configuration file in "/etc/sysctl.d/" so they will be applied instantly and survive a reboot.

With this combination of settings configured, I can now use the test containing using awake and see the packet received by another device on the target network when using `tcpdump`.


~~~
pi@devpi1:~ $ docker run --rm --network=core_traefik-backend wol -b 192.168.0.255 aa:bb:cc:dd:ee:ff
Sending magic packet to 192.168.0.255 with broadcast 192.168.0.255 MAC aa:bb:cc:dd:ee:ff port 9


dhutchison@MacBook:~ $ sudo tcpdump -i en0 '(udp and port 9)'
listening on en0, link-type EN10MB (Ethernet), capture size 262144 bytes
22:36:25.537328 IP devpi1.lan.46235 > 192.168.0.255.discard: UDP, length 102
~~~

## Homebridge Plugin Configuration

The configuration for the [homebridge-samsung-tizen] plugin allows for an extra `wol` element to define the source IP for the Wake-on-Lan packet and the destination. 

~~~ json
"platforms": [
    {
        "platform": "SamsungTizen",
        "devices": [
            {
                "name": "TV",
                "ip": "192.168.0.30",
                "mac": "AB:CD:EF:12:34:56",
                "wol": {
                    "from": "172.32.0.200",
                    "address": "192.168.0.255"
                }
            }
        ]
    }
]
~~~

This is passed directly to the [wakeonlan][wakeonlan] library. If the `from` attribute is not set then the `address` will be ignored and the library will perform its default behaviour of calculating the broadcast address for each network interface. We need to change this to the broadcast address of the subnet the destination device for the Wake-on-Lan packet is in. 

This `from` address has to be a valid IP address for the interface that is connected to our docker container, unfortunately this means the container needs to have a fixed IP address assigned to it. 

## Setting a Fixed IP Address for a Docker Container
In my use case, I have a number of containers linked to a docker network which traefik acts as a reverse proxy in front of. This is created as an external network that different docker-compose files reference. Step one in assigning a container a fixed IP address is to set a fixed subnet on this network. 

~~~ bash
docker network create --driver bridge --subnet=172.32.0.0/16 traefik-backend
~~~

As part of the docker-compose configuration for the container we can then set an IP address in the subnet defined for the network. 

~~~ yaml
homebridge:
    image: oznu/homebridge:no-avahi
    restart: unless-stopped

    networks:
      traefik-backend:
        # Need a fixed IP here so we can use WOL from the Samsung Tizen plugin
        # without using host networking
        ipv4_address: 172.32.0.200
~~~
            

## Conclusion

So we have now managed to successfully send Wake-on-Lan packets from within a docker container without needing to set the container in host network mode. However, this did require the container to be assigned a fixed IP address which does negate some of the benefits of being able to run software in a container like this.

As I am going through this journey of adding more smart devices, I do seem to hit more issues with running Homebridge in a container. The next issue revolves around getting a bluetooth LE device working. 


[so_tcpdump_wol]: https://askubuntu.com/questions/520734/spy-wake-up-on-lan-packages "networking - Spy wake up on lan packages - Ask Ubuntu"

[py_awake]: https://pypi.org/project/awake/ "awake - pypi"

[configure_script]: https://github.com/dhutchison/container-images/blob/master/homebridge/configure_docker_networks_for_wol.sh "container-images/configure_docker_networks_for_wol.sh at master - dhutchison/container-images"

[wakeonlan]: https://www.npmjs.com/package/wakeonlan "wakeonlan - npm"
[homebridge-samsung-tizen]: https://www.npmjs.com/package/homebridge-samsung-tizen "homebridge-samsung-tizen - npm"
