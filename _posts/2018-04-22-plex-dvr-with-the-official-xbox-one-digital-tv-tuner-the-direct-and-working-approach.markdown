---
title: Plex DVR with the Official Xbox One Digital TV Tuner - The Direct (and working!) Approach
layout: post
series: Plex DVR with the Official Xbox One Digital TV Tuner
series_part: 4
summary: Plex DVR with the Official Xbox One Digital TV Tuner - Working without TVheadend!!
tags:
- Plex
categories: 
- Development
---

With the recent release of version 4.16 of the linux kernel, the drivers needed to use the Xbox One Tuner are now distributed with the kernel.

At the time of writing, the only [mainstream distribution using this version of the kernel][distrowatch_search] is the Fedora 28 beta (due for mainstream [release early May][fedora28_schedule]). 

With this driver now part of the kernel, Plex appears to recognise the tuner as a [community supported tuner][plex_unsupported_tuner] and functions correctly using it directly. We still need to download and install the "dvb-demod-mn88472-02.fw" firmware file however as without this, while the tuner will be recognised in Plex, scanning for channels will always return zero results.

<!--more-->

## The VM Setup

As in the previous parts I am using Vagrant to create a VM for testing. The Vagrantfile should be customised with any required shared directories.

This Vagrantfile requires the installation of the [vagrant-reload][vagrant_reload] plugin.

    vagrant plugin install vagrant-reload

This is required for the `config.vm.provision :reload` line, which we need as we are upgrading the kernel as part of the initial updates stage, and the version of `kernel-modules` which is installed matches the updated kernel instead of the running kernel. This should hopefully not be required once we out out of the beta distribution. 

After running `vagrant up` from the directory with the following two files, you should be able to configure the Live TV & DVR feature using the steps for a [community supported tuner][plex_unsupported_tuner]. 

The Plex web interface will be available at [http://192.168.0.88:32400/web/](http://192.168.0.88:32400/web/). 

### Vagrantfile

~~~ ruby
# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  
  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "fedora/28-beta-cloud-base"

  # set up the VM as a bridged network with a fixed IP
  config.vm.network "public_network", bridge: 'eno1', ip: "192.168.0.88"

  # Configure the memory and CPU requirements for Virtualbox - was starting with 512M!
  config.vm.provider "virtualbox" do |v|
    v.memory = 2048
    v.cpus = 1
  end

  # Pass through our USB device
  config.vm.provider "virtualbox" do |vb|
    vb.customize ["modifyvm", :id, "--usb", "on"]
    vb.customize ["modifyvm", :id, "--usbxhci", "on"]
    vb.customize ["usbfilter", "add", "0",
      "--target", :id,
      "--name", "MicrosoftUSB",
      "--serialnumber", "0123456789"]
  end

  # Disable the default share. 
  config.vm.synced_folder '.', '/vagrant', disabled: true

  # Provision the VM using a shell script
  config.vm.provision :shell, path: "Vagrant_bootstrap.sh"
  config.vm.provision :reload
end
~~~

### Vagrant_bootstrap.sh

~~~ bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Make sure we are up to date
dnf update -y

# Add the udev configuration file
if [ -f /etc/udev/rules.d/99-usb-tv.rules ]; then
  echo 'Udev already condifigured'
else
  echo 'ACTION=="add", ATTR{serial}=="007287190615", SYMLINK+="usbMicrosoftTV"' > /etc/udev/rules.d/99-usb-tv.rules
fi

# Install the kernel modules
if [ dnf list --installed kernel-modules  > /dev/null 2>&1 ]; then
  dnf install -y kernel-modules
else
  echo 'Kernel modules already installed'
fi

# Add additional firmware files
# Without this, the tuner will still be recognised by plex, but trying to scan
# for channels will always find none. 
if [ ! -f /lib/firmware/dvb-demod-mn88472-02.fw ]; then
  curl --silent http://palosaari.fi/linux/v4l-dvb/firmware/MN88472/02/088b891ac9273ff8c6818fca27b24d81/dvb-demod-mn88472-02.fw --output /lib/firmware/dvb-demod-mn88472-02.fw
  restorecon -r /lib/firmware/
fi

# Install Plex
dnf install -y "https://downloads.plex.tv/plex-media-server/1.12.3.4973-215c28d86/plexmediaserver-1.12.3.4973-215c28d86.x86_64.rpm"
~~~



[distrowatch_search]: https://distrowatch.com/search.php?pkg=linux&relation=similar&pkgver=4.16&distrorange=InLatest#pkgsearch "Distrowarch Search for Kernel 4.16"
[fedora28_schedule]: https://fedoraproject.org/wiki/Releases/28/Schedule "Releases/28/Schedule"
[plex_unsupported_tuner]: https://support.plex.tv/articles/community-supported-tuners/ "Plex - Community Supported Tuners"
[vagrant_reload]: https://github.com/aidanns/vagrant-reload  "Vagrant Reload Provisioner on GitHub"
