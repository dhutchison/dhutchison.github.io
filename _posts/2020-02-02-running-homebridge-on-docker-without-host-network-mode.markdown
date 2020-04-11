---
title: Running HomeBridge on Docker without Host Network Mode
layout: post
summary: How to run HomeBridge on Docker without Host Network Mode
series: Running HomeBridge on Docker without Host Network Mode
series_part: 1
categories:
- Development
tags:
- Docker
- HomeBridge
- HomeKit
date: 2020-02-02 15:35
slug: running-homebridge-on-docker-without-host-network-mode
---
Over the past few months I have been expanding the number of smart home devices I have and appreciating how HomeKit allows these to all be managed in a single place, regardless of the manufacturer.

There is one older device that I have which does not support HomeKit, and was only controllable through the App from the manufacturer. HomeKit support for this device is not coming, but there is a workaround. 

Enter [HomeBridge][homebridge].

> HomeKit support for the impatient.
>
> Homebridge is a lightweight NodeJS server you can run on your home network that emulates the iOS HomeKit API. It supports Plugins, which are community-contributed modules that provide a basic bridge from HomeKit to various 3rd-party APIs provided by manufacturers of "smart home" devices.

There is a [docker image][homebridge_docker] available, but the setup instructions for this require the container to be ran with  the "host" networking mode. The primary reason for this appears to be to allow an [Avahi][avahi] daemon to run in the container and be able to answer responses to mDNS requests, which requires the container to be in the same local network subnet as the device performing the lookup.

For isolation purposes I'm not a fan of running services in host networking mode, and I already have an avahi-daemon running on my server for advertising other services.

<!--more-->

## Required Ports & Configuration

The main HomeBridge server only requires one port to be exposed to function, with another optional one if you wish to use the web UI for it. In my case I am using [Traefik][traefik] as a reverse proxy to front the web UI and enforce HTTPS in front of the web UI. The main HomeBridge server port is defined in the `config.json` file, so if this port is mapped from the docker host to the container then HomeBridge will work, if it can be discovered. 

~~~javascript
{
  "bridge": {
    "name": "Homebridge",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-154"
  }
}
~~~

If additional devices are being configured which require their own ports, then additional ports may be required. For devices which function this way, the HomeBridge [configuration][homebridge_sample] allows the range of ports which would be used to be specified.

~~~javascript
{
	// other configuration omitted 
 
  "ports": {
    "start": 52100,
    "end": 52150,
    "comment": "This section is used to control the range of ports that separate accessory (like camera or television) should be bind to."
  }
}
~~~

## Advertising the HomeKit device
This was the most tricky part of this setup. 

If we are not allowing the container to advertise its own "HAP" mDNS record, then we need to advertise it for it. 

While I could have just captured the output of the container's mDNS record and put it into a static service file, I wanted to be able to regenerate this if I ever scrapped the container and started again. 

Ultimately this involved some research into the HAP protocol, and how HomeBridge uses [HAP-NodeJS][HAP-NodeJS] to advertise the service. 

The result is the following bash script which inspects a running HomeBridge container for the required configuration it needs to generate an Avahi service file. This file is then moved to the `/etc/avahi/services` directory for use. This should be published without the need for a restart of the avahi-daemon. 

~~~bash
#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# Find the running homebridge container
CONTAINER=$(sudo docker ps | grep homebridge | cut -d " " -f1)


if [ -z "$CONTAINER" ]; then
  echo "No running homebridge container found"
  exit 1
fi

# Get configuration values out of the container configuration file
NAME=$(sudo docker exec "$CONTAINER" /bin/grep "\"name\":" /homebridge/config.json | head -n 1 | cut -d '"' -f4)
MAC=$(sudo docker exec "$CONTAINER" /bin/grep "\"username\":" /homebridge/config.json | cut -d '"' -f4)
PORT=$(sudo docker exec "$CONTAINER"  /bin/grep "\"port\":" /homebridge/config.json | head -n 1 | sed 's/[^0-9]*//g')
SETUPID=$(sudo docker exec "$CONTAINER"  /bin/grep "$NAME" /homebridge/persist/AccessoryInfo.$(echo $MAC | sed 's/://g').json | python3 -c "import sys, json; print(json.load(sys.stdin)['setupID'])")

# Write the service configurtion file to the current directory
cat <<EOF>"homebridge.service"
<service-group>
  <name>$NAME</name>
  <service>
    <type>_hap._tcp</type>
    <port>$PORT</port>

    <!-- friendly name -->
    <txt-record>md=$NAME</txt-record>

    <!-- HAP version -->
    <txt-record>pv=1.0</txt-record>
    <!-- MAC -->
    <txt-record>id=$MAC</txt-record>
    <!-- Current configuration number -->
    <txt-record>c#=2</txt-record>

    <!-- accessory category
         2=bridge -->
    <txt-record>ci=2</txt-record>

    <!-- accessory state
          This must have a value of 1 -->
    <txt-record>s#=1</txt-record>
    <!-- Pairing Feature Flags
         nothing to configure -->
    <txt-record>ff=0</txt-record>
    <!-- Status flags
         0=not paired, 1=paired -->
    <txt-record>sf=1</txt-record>
    <!-- setup hash (used for pairing).
         Required to support enhanced
         setup payload information (but
         not defined in the spec)        -->
    <txt-record>sh=$(echo -n ${SETUPID}${MAC} | openssl dgst -binary -sha512 | head -c 4 | base64)</txt-record>
  </service>
</service-group>
EOF

# Move it in to place
sudo mv -i homebridge.service /etc/avahi/services/

# Helper Message
echo "Please ensure you have exposed port $PORT"

~~~

## Docker Compose

The complete docker compose file I am using (minus my Traefik labels) is below. 

~~~yaml
version: '3.7'

networks:
  traefik-backend:
    external: 
      name: traefik-backend

volumes:
  homebridge_config:

services:

  homebridge:
    image: oznu/homebridge:no-avahi
    restart: unless-stopped
    networks: 
     - traefik-backend
    volumes:
      - homebridge_config:/homebridge
      - /data-storage/app-data/homebridge/config.json:/homebridge/config.json
    environment:
      - PGID=1099
      - PUID=1099
      - HOMEBRIDGE_CONFIG_UI=1
      - HOMEBRIDGE_CONFIG_UI_PORT=8080
    ports:
     # port matching config.json
     - 51826:51826/tcp
~~~

## In Conclusion

It is possible to run HomeBridge in a Docker container without requiring to use the host networking mode, it just requires a bit of additional configuration of an Avahi service. 

[homebridge]: https://homebridge.io "Homebridge - HomeKit support for the impatient"
[homebridge_sample]: https://github.com/nfarina/homebridge/blob/master/config-sample.json "homebridge/config-sample.json at master · nfarina/homebridge"
[homebridge_docker]: https://hub.docker.com/r/oznu/homebridge/ "oznu/homebridge - Docker Hub"
[avahi]: http://avahi.org "avahi - mDNS/DNS-SD"
[HAP-NodeJS]: https://github.com/KhaosT/HAP-NodeJS "KhaosT/HAP-NodeJS: Node.js implementation of HomeKit Accessory Server."
[traefik]: https://containo.us/traefik/ "Traefik, The Cloud Native Edge Router | Containous"
