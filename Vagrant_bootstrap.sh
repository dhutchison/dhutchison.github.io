#!/usr/bin/env bash
yum update -y # Not strictly necessary, but nice to make sure up to date linux when provisioning.

if yum info avahi | grep installed ; then
        echo "avahi already installed"
else
        yum install epel-release
        yum install nss-mdns
        yum -y install avahi
        sed -i "s/#host-name=foo/host-name=dwi/g" /etc/avahi/avahi-daemon.conf
fi

if  yum info httpd | grep installed ; then
	service httpd stop
	yum update httpd
else
	yum install -y httpd.x86_64
        sed -i "s/#ServerName www.example.com:80/ServerName dwi.local:80/g" /etc/httpd/conf/httpd.conf
        sed -i "s/#EnableSendfile/EnableSendfile/g" /etc/httpd/conf/httpd.conf
fi
rm -rf /var/www/html
ln -fs /vagrant_data /var/www/html
chkconfig httpd on
service httpd start
service messagebus restart
chkconfig avahi-daemon on
service avahi-daemon start
