---
title: Docker and Locales
link: http://jaredmarkell.com/docker-and-locales/
tags:
- Docker
summary: A docker task was failing with Locale issues, this is a working solution
date: 2019-01-26 21:56
slug: docker-and-locales
---
Since I rebuilt my server I have been seeing issues where my use of the [transcode-video docker image][transcode-video] would consistently fail to complete the encoding process with this error.

    transcode-video: invalid byte sequence in US-ASCII

The [linked post][docker-and-locales] led me to the solution - I needed to update the Dockerfile for my version of the image to include additional commands to configure the locale. This was a pretty easy addition as I already was using my own to customise a couple of things. I do not know why the appeared, but all I really care about is that it is working again now. 

{% highlight yaml %}
FROM ntodd/video-transcoding
  
# Configure locale
RUN locale-gen en_GB.UTF-8
ENV LANG en_GB.UTF-8
ENV LANGUAGE en_GB:en
ENV LC_ALL en_GB.UTF-8
{% endhighlight %}


[transcode-video]: https://hub.docker.com/r/ntodd/video-transcoding "ntodd/video-transcoding - Docker Hub" 
[docker-and-locales]: http://jaredmarkell.com/docker-and-locales/ "Docker and Locales"
