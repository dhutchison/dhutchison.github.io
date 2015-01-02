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
