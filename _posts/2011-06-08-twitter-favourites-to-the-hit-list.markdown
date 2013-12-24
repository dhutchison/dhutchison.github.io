---
layout: post
title: Twitter Favourites to The Hit List
date: 2011-06-08 01:00:00.000000000 +01:00
categories:
- Productivity
tags:
- Ruby
- Scripting
- The Hit List
- Twitter
status: publish
type: post
published: true
meta:
  tagazine-media: a:7:{s:7:"primary";s:0:"";s:6:"images";a:0:{}s:6:"videos";a:0:{}s:11:"image_count";s:1:"0";s:6:"author";s:8:"23986909";s:7:"blog_id";s:8:"23849888";s:9:"mod_stamp";s:19:"2011-06-08
    18:08:14";}
  _wpas_done_fb: '1'
  _wpas_done_twitter: '1'
keywords:
- applescript
- twitter
- github
- geektool
- macheist
- application programming interface
- oauth
- the hit list
- ruby
---
For as long as I can remember, I have used twitter to keep up to date with events. When I see something that I want to action at a later date, I favourite the tweet as a reminder. The problem with this method is that I often forget to look at my favourites to remind myself what I have already forgotten to look at again!
Then, last week after clearing about a month's worth of favourites, I had a brainwave! 
<!--more-->

The title to this post should have provided a rather large clue to what is coming! I needed a way to automatically add anything I have favourited into my task manager of choice (partly because I got as part of a [MacHeist](http://macheist.com/ "MacHeist") bundle), [The Hit List](www.potionfactory.com/thehitlist/ "The Hit List").

I went through a couple of possible solutions prior to the final solution:

First, I thought the information on favourites for a user would be available through the AppleScript support which the Mac Twitter application has. Unfortunately the only information available is the favourite count, not the actual stream. This would have been ideal as I have written AppleScripts in the past for integrating Mail rules, and Snow Leopard Services with The Hit List, but alas, it was not to be.

The next attempt at a solution was going to be Java based, as it is the language I am most familiar with these days. Using Java to parse the tweets then sending to the command line to call an AppleScript is certainly not as tidy a solution as I would have hoped for, but it was a possibility. I started looking at Twitter4j, but (as far as I could find from a quick test) it has no way to call methods of the twitter API without authentication, and basic authentication is no longer supported. At this point it was time to find a better solution, as OAuth is a horrible, horrible protocol to try deciphering for the sake of a simple script.

This led to the final solution: a ruby script. I had previously seen a ruby script used with an AppleScript bridge to display the tasks for a list in The Hit List in a [GeekTool](http://projects.tynsoe.org/en/geektool/ "GeekTool") widget (the original script is [here](http://www.josefrichter.com/blog/one-more-wallpaper-with-the-hit-list-to-dos/ "one-more-wallpaper-with-the-hit-list-to-dos")), so I thought I would try my hand at some Ruby.

The majority of the hard work in this script is performed by the twitter gem for Ruby, which has very clear [API documentation](http://rdoc.info/gems/twitter "API documentation") which include plenty of code samples. The script requires a configuration file to tell it which user to look up favourites for, as I did not want to hard code it in the script. This also has the advantage as the configuration file can be updated to hold the last processed tweet, so the same tweet is not added to The Hit List every time the script is run. Once the favourites which have not already been added have been retrieved, the script uses the [rb-appscript](http://appscript.sourceforge.net/ "rb-appscript") gem as a bridge between ruby and AppleScript. I have only coded this single Ruby script and I already prefer it to writing AppleScript directly.

I set up a Launchd plist file so this script is run every couple of hours to keep my to-do list up to date, and so far it appears to be working perfectly.

Now, all this blurb would be even more of a complete waste of time if I did not include the script in question. The good news is it, and any future code I plan to write about here, is available on my [GitHub account](https://github.com/dhutchison/DWI). The related files are in the [TwitterFavouritesToTHL](https://github.com/dhutchison/DWI/tree/master/TwitterFavouritesToTHL) folder of the repository. The included README file should provide enough information to configure and use the script.
