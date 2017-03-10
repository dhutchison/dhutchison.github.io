---
title: Vagrant Setup
categories: Development
tags:
- VirtualBox
- Vagrant
description: I have been trying out Vagrant. This is a very quick start guide.
date: 2015-01-02 23:01
slug: vagrant-setup
---
For development purposes I use Virtual Machines in [VirtualBox][virtualbox], usually using the Ubuntu Server OS and are manually configured. Vagrant provides a mechanism to easily script the creation of these virtual machines so they can be torn down and rebuilt easily. 

From the [Vagrant site][whyvagrant]:

> Vagrant provides easy to configure, reproducible, and portable work environments built on top of industry-standard technology and controlled by a single consistent workflow to help maximize the productivity and flexibility of you and your team

This is largely a quick start guide for my purposes, as I started experimenting with Vagrant. All this information is based on [this getting started guide][1].

<!--more-->

## Getting Started

Vagrant works by creating instances of a base VM image. While you can create your own base box, in my case I am going to use a pre-made one from [Vagrant Cloud][3]. My existing VM setup would use an ubuntu server setup, ```vagrant init hashicorp/precise64```, but I want to move to CentOS. 

    mm:dhutchison.github.io david$ vagrant init chef/centos-6.5
    A `Vagrantfile` has been placed in this directory. You are now ready to `vagrant up` your first virtual environment! Please read the comments in the Vagrantfile as well as documentation on `vagrantup.com` for more information on using Vagrant.

This command creates a new `Vagrantfile` with a template configuration for this base box. 

Before we can start the virtual machine, we need to download the base VM image (only if this has not been done before). Depending on the base box which was chosen this may prompt for the [provider][4] to use, in my case this is VirtualBox.

    mm:dhutchison.github.io david$ vagrant box add chef/centos-6.5
    ==> box: Loading metadata for box 'chef/centos-6.5'
        box: URL: https://vagrantcloud.com/chef/centos-6.5
    This box can work with multiple providers! The providers that it
    can work with are listed below. Please review the list and choose
    the provider you will be working with.
    
    1) virtualbox
    2) vmware_desktop
    
    Enter your choice: 1
    ==> box: Adding box 'chef/centos-6.5' (v1.0.0) for provider: virtualbox
        box: Downloading: https://vagrantcloud.com/chef/boxes/centos-6.5/versions/1/providers/virtualbox.box
    ==> box: Successfully added box 'chef/centos-6.5' (v1.0.0) for 'virtualbox'!

Now we have enough to start the VM.

    mm:dhutchison.github.io david$ vagrant up
    Bringing machine 'default' up with 'virtualbox' provider...
    ==> default: Importing base box 'chef/centos-6.5'...
    ==> default: Matching MAC address for NAT networking...
    ==> default: Checking if box 'chef/centos-6.5' is up to date...
    ==> default: Setting the name of the VM: dhutchisongithubio_default_1412714089269_91734
    ==> default: Clearing any previously set network interfaces...
    ==> default: Preparing network interfaces based on configuration...
        default: Adapter 1: nat
    ==> default: Forwarding ports...
        default: 22 => 2222 (adapter 1)
    ==> default: Booting VM...
    ==> default: Waiting for machine to boot. This may take a few minutes...
        default: SSH address: 127.0.0.1:2222
        default: SSH username: vagrant
        default: SSH auth method: private key
        default: Warning: Connection timeout. Retrying...
        default: Warning: Connection timeout. Retrying...
    ==> default: Machine booted and ready!
    ==> default: Checking for guest additions in VM...
    ==> default: Mounting shared folders...
        default: /vagrant => /Users/david/Sites/dhutchison.github.io


To remote into this box, and test we can connect, `ssh` into the virtual machine.

    vagrant ssh

Now we have confirmed the basics work we will destroy this instance. We still need to configure it appropriately for our needs.

    mm:dhutchison.github.io david$ vagrant destroy
        default: Are you sure you want to destroy the 'default' VM? [y/N] y
    ==> default: Forcing shutdown of VM...
    ==> default: Destroying VM and associated drives...

I will be configuring this as a basic Apache setup for testing this web site. In order to view the site content I need to share the build directory of the web site with the VM. Alternatively  I could use SCP or RSYNC to do a copy over SSH, but for testing purposes a direct filesystem share is certainly simpler.

    config.vm.synced_folder "../dwi_built_site/", "/vagrant_data", create: true

More information on the configuration options which can be applied to synced folders is available [in the documentation][6].

The next step is to create a script to install any pre-requisite packages into the VM. We will call this `Vagrant_bootstrap.sh`. This will install a stock Apache 2 and create a symlink between our synced folder and the default apache `wwwroot`. If Apache is already installed (i.e. if doing a re-provision via `vagrant up --provision`), this will attempt to update the package.

{% highlight bash linenos %}
#!/usr/bin/env bash
yum update -y # Not strictly necessary, but nice to make sure up to date linux when provisioning.
if  yum info httpd | grep installed ; then
  service httpd stop
  yum update httpd
else
  yum install -y httpd.x86_64
  echo "EnableSendfile off" >> /etc/httpd/conf/httpd.conf
fi
rm -rf /var/www/html
ln -fs /vagrant_data /var/www/html
chkconfig httpd on
service httpd start
{% endhighlight %}

## Networking

There are a variety of different ways to configure the network setup of the virtual machine. The simple option is to expose a single port on the local host.

    config.vm.network :forwarded_port, host: 8080, guest: 80


Alternatively, the VM can be configured to use a bridged network with a fixed IP.

    config.vm.network "public_network", bridge: 'en1: Wi-Fi (AirPort)', ip: "192.168.0.65"

Not including the `IP` parameter results in the host using DHCP to get an IP address. Unfortunately this does not output the IP on startup, so some program like Avahi would be required to advertise the hostname. It is a bit of a pain to have to SSH into the host to find it's IP address.
If the `bridge` parameter is ommitted, you will be prompted to pick an interface when the VM is brought up:

    ==> default: Available bridged network interfaces:
    1) en1: Wi-Fi (AirPort)
    2) en0: Ethernet
    3) bridge100
        default: What interface should the network bridge to? 

## Finished
And there we go! A working CentOS setup using Apache with a shared folder.

The complete Vagrantfile:

{% highlight ruby linenos %}
# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at vagrantup.com.

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "chef/centos-6.5"

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # config.vm.network :forwarded_port, host: 8080, guest: 80

  # Alternatively to the above, we can set up the VM as a bridged network with a fixed IP
  config.vm.network "public_network", bridge: 'en1: Wi-Fi (AirPort)', ip: "192.168.0.65"

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.
  config.vm.synced_folder "../dwi_built_site/", "/vagrant_data", create: true

  # Disable the default share. 
  config.vm.synced_folder '.', '/vagrant', disabled: true

  # Provision the VM using a shell script
  config.vm.provision :shell, path: "Vagrant_bootstrap.sh"
end
{% endhighlight %}

## Caveats

There is a [VirtualBox bug][5] related to `sendfile` which can result in corrupted or non-updating files. You should deactivate `sendfile` in any web servers you may be running.

In Nginx:


    sendfile off;


In Apache:


    EnableSendfile Off


[1]: https://docs.vagrantup.com/v2/getting-started/index.html "Getting Started - Vagrant Documentation "
[2]: https://docs.vagrantup.com/v2/getting-started/boxes.html "Boxes - Getting Started - Vagrant Documentation "
[3]: https://vagrantcloud.com/ "Vagrant Cloud "
[4]: https://docs.vagrantup.com/v2/providers/
[5]: https://github.com/mitchellh/vagrant/issues/351#issuecomment-1339640
[6]: https://docs.vagrantup.com/v2/synced-folders/virtualbox.html "Permalink to VirtualBox Shared Folders - Synced Folders"
[virtualbox]: https://www.virtualbox.org/ "Oracle VM VirtualBox"
[whyvagrant]: https://docs.vagrantup.com/v2/why-vagrant/ "Why Vagrant? - Vagrant Documentation"
