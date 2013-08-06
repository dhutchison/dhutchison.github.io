---
layout: post
title: A Blogging Workflow
date: 2013-08-06 23:08:00.000000000 +01:00
categories: site
tags: jekyll
keywords:
- twitter
- zemanta
- github
- jekyll
- html
- plug-in
---
This must be one of the most common first posts for a site that has just started using Jekyll, but I'm starting to get a workflow together that automates a lot of the mundane tasks that arise from using a static site engine without being able to use plugins.

<!--more-->
### Implemented Features ###

By [Paul Stamatiou](https://twitter.com/Stammy "Stammy on Twitter") - a piece of a rake file for [generating individual tag pages](https://gist.github.com/stammy/790778 "Goes in Rakefile for Jekyll for those wanting tag pages"). 
I've changed this a lot to not hard code the HTML as part of the generation. I'd initially manually crafted these pages, with the content just being a call to an include with the current tag name. A have a very similar version for producing category pages too. 

By [Pedro Reys](http://pedroreys.com/ "Pedro Reys") - [Installing Less.css on OSX Lion](http://pedroreys.com/2012/02/03/installing-less-css-on-osx-lion/ "Installing Less.css on OSX Lion"). This is a quick start guide on using the [Node.js Package Manager](http://npmjs.org/ "Node.js Package Manager") to get less installed and available on the command line. Less is not available in Fink, which is my usual package manager.

By [Brett Terpstra](http://brettterpstra.com "Brett Terpstra") - [Auto-Tagging Jekyll posts with Zemanta](http://brettterpstra.com/2013/03/23/auto-tagging-jekyll-posts-with-zemanta/ "Auto-Tagging Jekyll posts with Zemanta"). A guide to using the (free) [Zemanta](http://developer.zemanta.com/ "Zemanta - contextual intelligence for everyone") contextual intelligence engine for working out the correct keywords for posts. I agree with Brett, this is proving to be highly accurate, but not accurate enough to post without checking. I highly recommend checking out his [Jekyll posts](http://brettterpstra.com/topic/jekyll/ "Jekyll"). I've learned a lot from it, and they were what introduced me to this framework. I'll be posting my Rakefile once I've got everything set up just the way I want it.


### Plugins ###
While Jekyll supports custom plugins coded in Ruby any appears to be really extensible, these cannot be used on sites that are hosted by GitHub. Fortunately, many of the common use cases that plugins exist for can be handled with the core framework, albeit not as cleanly.

By [Tobiass Josten](http://vvv.tobiassjosten.net/ "Tobiass Josten") - [Jekyll sitemap without plugins](http://vvv.tobiassjosten.net/jekyll/jekyll-sitemap-without-plugins/ "Jekyll sitemap without plugins").

### Planned Improvements ###

I've been trying to get [Twitter Cards](https://dev.twitter.com/docs/cards "Twitter Cards") to work but their validator appears to be broken (and going by the forums has been patchy for weeks). I did manage to get it to validate twice, but then started failing again when I tried to request approval. By adding some simple meta data to the head of the generated HTML files, this allows me to control how links to this site appear on Twitter.
