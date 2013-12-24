---
layout: post
title: Ruby / Twitter woes
date: 2012-10-17 01:00:00.000000000 +01:00
categories:
- Productivity
tags:
- OAUTH
- Ruby
- Twitter
status: publish
type: post
published: true
meta:
  _publicize_pending: '1'
  tagazine-media: a:7:{s:7:"primary";s:0:"";s:6:"images";a:0:{}s:6:"videos";a:0:{}s:11:"image_count";i:0;s:6:"author";s:8:"23986909";s:7:"blog_id";s:8:"23849888";s:9:"mod_stamp";s:19:"2012-10-17
    21:34:30";}
  _wpas_done_828426: '1'
  _publicize_done_external: a:1:{s:8:"facebook";a:1:{i:1562110534;b:1;}}
  publicize_twitter_user: DavidHutchison
  _wpas_done_828427: '1'
keywords:
- twitter
- oauth
- reminders
- ruby
---
A while ago I made a modified version of the [Twitter Favourites to The Hit List](/2011/06/08/twitter-favourites-to-the-hit-list/ "Twitter Favourites to The Hit List") script to import in to the Reminders application that ships with Mountain Lion. I have completely moved away from The Hit List due to the lack of updates / support the application is getting. Currently I am using a combination of [Due](http://www.dueapp.com "Due") and Reminders for my workflow.

<!--more-->

I had recently started using RVM so I could upgrade ruby easily for another project I was working on, but this has caused some issues. The latest version of the [Twitter Ruby Gem](http://rdoc.info/gems/twitter), as a result of twitter API changes, has removed the ability to call methods unauthenticated. This is a major headache and has implications on how easy the script is to distribute in a working fashion. 

In order to call methods on the Twitter API it is now required to have a consumer (developer) API key, that must remain secret, as well as an OAUTH token for the user that is using the application. This poses two issues:
 
 - at this point, I have no idea how to easily do an OATH authentication from a command line ruby script
 - the bigger issue is how to keep a consumer key secret is an open source script. It seems a bit of a hassle requiring any user that wants to use it to get their own twitter developer API key

I am hoping to get back to looking at this in the next week or so, with the hope of releasing an updated version soon. Unfortunately at this time I may look like each user may need to get their own API key, unless I can find a way around this obstacle.
