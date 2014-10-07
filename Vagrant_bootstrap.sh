#!/usr/bin/env bash
#yum update -y # Not strictly nessecary, but nice to make sure up to date.
yum install -y httpd.x86_64
rm -rf /var/www/html
ln -fs /vagrant_data /var/www/html
chkconfig httpd on
service httpd start
