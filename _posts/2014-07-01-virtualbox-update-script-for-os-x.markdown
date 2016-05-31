---
layout: post
title: VirtualBox Update Script for OS X
categories: Miscellaneous
comments: true
description: Auto-update should be a mandatory feature.
tags:
- bash
- VirtualBox
keywords:
- update script
- VirtualBox
- dmg
date: 2014-07-01 22:01
slug: virtualbox-update-script-for-os-x
---
I have a strong dislike for applications that are still not able to provide any sort of internal update functionality and require the user to go to a web page to download an update. 

I have written an [update script for Calibre][calibre_post] in the past to automate this update process. Today I made a modified version of this for [VirtualBox][virtualbox]. I use this application a lot for running various servers for my local development environment.

<!--more-->

This script performs four main steps:

1. Checks if a newer version of the application is available
2. If there is, the script will download the DMG of the latest version into a temporary directory
3. After the download is complete, the DMG will be mounted and the installer launched
4. Once the install completes, the DMG is unmounted

I don't write a lot of scripts, so there may be better ways to achieve this, but it works.

{% highlight bash linenos %}
#!/bin/bash
# Script to check for updates, and download updates for VirtualBox  (http://virtualbox.org/)
# Author: David Hutchison
# www: http://www.devwithimagination.com/

#################################
######### CONFIGURATION #########
# These default values should work for everyone. Only change if using a non-standard install location,
# or if the download URL changes in the future.
#################################

# The download page URL.
VIRTUALBOX_INSTALL_LOCATION=/Applications/VirtualBox.app
DOWNLOAD_URL=http://download.virtualbox.org/virtualbox
VIRTUALBOX_LATEST_VERSION_PAGE=$DOWNLOAD_URL/LATEST.TXT

#################################
##### ADDITIONAL FUNCTIONS #####
# Vercomp function by Dennis Williamson 
# from StackOverflow answer http://stackoverflow.com/a/4025065/230449
vercomp () {
    if [[ $1 == $2 ]]
    then
        return 0
    fi
    local IFS=.
    local i ver1=($1) ver2=($2)
    # fill empty fields in ver1 with zeros
    for ((i=${#ver1[@]}; i<${#ver2[@]}; i++))
    do
        ver1[i]=0
    done
    for ((i=0; i<${#ver1[@]}; i++))
    do
        if [[ -z ${ver2[i]} ]]
        then
            # fill empty fields in ver2 with zeros
            ver2[i]=0
        fi
        if ((10#${ver1[i]} > 10#${ver2[i]}))
        then
            return 1
        fi
        if ((10#${ver1[i]} < 10#${ver2[i]}))
        then
            return 2
        fi
    done
    return 0
}
#################################

#Start Update Check script


#Extract the latest offered version number.
LATEST_VERSION=`curl -s $VIRTUALBOX_LATEST_VERSION_PAGE`
#Extract the version number of the currently installed version.
CURRENT_VERSION=`defaults read $VIRTUALBOX_INSTALL_LOCATION/Contents/Info CFBundleShortVersionString`

vercomp $CURRENT_VERSION $LATEST_VERSION
case $? in
    0)
    	echo "Installed Version is the latest available ($CURRENT_VERSION).";;
    1)
    	echo "Uh Oh! Current Version is newer than the latest available! (Current: \"$CURRENT_VERSION\", Latest: \"$LATEST_VERSION\")";;
    2)
    	echo "Update Required. (Current: \"$CURRENT_VERSION\", Latest: \"$LATEST_VERSION\")"

    	FILENAME=`curl -s $DOWNLOAD_URL/$LATEST_VERSION/ | grep OSX | perl -ne '/(VirtualBox.*?\.dmg)/ && print $1'`
    	# Download the latest version
    	curl "$DOWNLOAD_URL/$LATEST_VERSION/$FILENAME" -L -o "$TMPDIR/LatestVirtualBox.dmg"
    	# Mount the drive
    	hdiutil attach -noverify "$TMPDIR/LatestVirtualBox.dmg"
    	MOUNT_POINT=/Volumes/VirtualBox
    	sleep 10
    	echo "Updating install…"

    	# Open the installer and wait on it to be closed.
    	open -W $MOUNT_POINT/VirtualBox.pkg

    	#Unmount the drive
    	hdiutil detach "$MOUNT_POINT"

    	echo "Update finished."
    	;;
esac
{% endhighlight %}

[calibre_post]: /2013/07/08/calibre-autoupdate/ "Calibre AutoUpdate"
[virtualbox]: https://www.virtualbox.org/ "Oracle VM VirtualBox "
