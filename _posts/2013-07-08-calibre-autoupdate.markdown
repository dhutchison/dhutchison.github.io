---
layout: post
title: Calibre AutoUpdate
date: 2013-07-08 00:00:00
categories: []
tags:
- bash
- calibre
status: publish
type: post
published: true
meta:
  publicize_twitter_user: DavidHutchison
  _wpas_done_828427: '1'
  _publicize_done_external: a:1:{s:7:"twitter";a:1:{i:20342569;b:1;}}
---
I use [Calibre](http://calibre-ebook.com/ "Calibre") for managing eBooks that I have got from outside the Amazon Kindle store, and for backing up the books I have bought from Amazon. It has always irritated me that it does not autoupdate, and the update process involves downloading a DMG and copying from there. I finally got annoyed enough with it to do something. 

<!--more-->
Below is a Gist that I've written that acts as an updater script. It is a bit rough round the edges but appears to do the job at least. This will check if a new version is available, and if so download it, mount it, update the application, then unmount the DMG. Any feedback is welcome (bash scripting is not one of my strengths).

{% gist 5952763 %}
