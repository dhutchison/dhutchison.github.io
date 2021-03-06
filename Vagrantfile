# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at vagrantup.com.

  # Every Vagrant virtual environment requires a box to build off of.
  config.vm.box = "chef/centos-6.6"

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
  config.vm.synced_folder "../dwi_built_site/", "/vagrant_data", create: true, mount_options: ["dmode=555","fmode=444"]

  # Disable the default share. 
  config.vm.synced_folder '.', '/vagrant', disabled: true

  # Provision the VM using a shell script
  config.vm.provision :shell, path: "Vagrant_bootstrap.sh"
end
