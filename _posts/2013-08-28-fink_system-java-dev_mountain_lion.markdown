---
layout: post
date: 2013-08-28 21:46:03
title: Fink, system-java-dev and Mountain Lion
categories: Development
tags: 
- Mountain Lion
keywords:
- fink
- macports
- system-java-dev
- javac
- imagemagick
- automator
- mountain lion
- ruby
- java
---
For part of side project I've been working on (a bit of web site building), I've been trying to use Ruby for automated photo set page production. One of the crucial steps in this workflow is scaling down the original images ready for the web. Sure - I could use nearly anything to achieve this, even Automator, but it would be cleaner to have this task as part of a single build task that I can call via rake. Also, I need a solution that can be cross platform. 

<!--more-->

[The Bastards Book Of Ruby](http://ruby.bastardsbook.com/chapters/image-manipulation/ "Image Manipulation | The Bastards Book of Ruby") has a chapter which acts as a very quick start guide to achieving common tasks in [ImageMagick](http://www.imagemagick.org/script/index.php "ImageMagick: Convert, Edit, Or Compose Bitmap Images") with Ruby. The stumbling block I hit was the inability to install ImageMagick using [fink](http://fink.thetis.ig42.org/ "Fink - Home"). I kept getting the error `Failed: Can't resolve dependency "system-java-dev"`. Now, I know my java install had been seriously cocked up (by me) at one point, but I can type the javac command and have it work! The [fink faq][1] gives no real solution to this, except to install an old jdk from connect.apple.com, which at the time does not work at all (not even a 404).

    Q8.8: What are all these system-* "virtual packages" that are 
    sometimes present, but that I can't seem to install or remove myself?
    
    ... 
    
    system-javaXXX-dev: [virtual package representing Java X.X.X 
    development headers]
    Represents the Java SDK, which must be manually downloaded 
    from connect.apple.com (free registration required) and installed. 
    If you have updated your Java Runtime Environment, your SDK may 
    not be updated automatically (and may even be deleted!). 
    Remember to check for (and download and install if necessary) 
    the SDK after installing or upgrading your Runtime Environment. 

I knew there should be a cleaner solution to this, even by using symlinks to trick it. First step was to confirm there was a JDK: `type javac` returned `javac is hashed (/usr/bin/javac)` which seemed a bit odd, but it was there at least. Next I checked if the Xcode Command Line Tools were up to date, and it claimed they were not installed. After this installation the type command for javac returns `javac is /usr/bin/javac`. After this change fink no longer complains about the  system-java-dev package being missing!

On a side note, the package manager which seems to be most popular now (and I may have less headaches using) is [Homebrew](http://brew.sh/ "Homebrew — MacPorts driving you to drink? Try Homebrew!"), curiously their tagline is "MacPorts driving you to drink?". I had moved over to fink quite a while ago for that exact reason, MacPorts was so buggy!


[1]: http://fink.thetis.ig42.org/faq/usage-general.php "Fink - F.A.Q. - Usage (1)"
