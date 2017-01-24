---
title: Fixing issues updating Jekyll
summary: My local Jekyll install had some issues...
categories: Development
tags:
- Jekyll
date: 2017-01-23 00:38
slug: fixing-issues-updating-jekyll
---
This is a quick post mostly so I remember how to solve this problem if I come across it again, as I have seen it a few times now when running a `bundle update` on my local jekyll install. 

<!--more-->

~~~
Installing nokogiri 1.6.8.1 (was 1.6.8) with native extensions

Gem::Ext::BuildError: ERROR: Failed to build gem native extension.

    /Users/david/.rbenv/versions/2.2.3/bin/ruby -r ./siteconf20170122-7248-dj1g23.rb extconf.rb --use-system-libraries --with-xml2-include=/usr/local/Cellar/libxml2/2.9.2/include/libxml2 --with-xml2-lib=/usr/local/Cellar/libxml2/2.9.2/lib
checking if the C compiler accepts ... yes
checking if the C compiler accepts -Wno-error=unused-command-line-argument-hard-error-in-future... no
Building nokogiri using system libraries.
ERROR: cannot discover where libxml2 is located on your system. please make sure `pkg-config` is installed.
*** extconf.rb failed ***
Could not create Makefile due to some reason, probably lack of necessary
libraries and/or headers.  Check the mkmf.log file for more details.  You may
need configuration options.
~~~

The mystery is where the cached path for libxml2 was coming from. I have this installed via [Homebrew][homebrew].


Using the brew command to get details on the library gave a few clues.

~~~
mm:dhutchison.github.io david$ brew info libxml2
libxml2: stable 2.9.4 (bottled), HEAD [keg-only]
GNOME XML library
http://xmlsoft.org
/usr/local/Cellar/libxml2/2.9.4_2 (277 files, 9.8M)
  Poured from bottle on 2017-01-15 at 22:26:17
From: https://github.com/Homebrew/homebrew-core/blob/master/Formula/libxml2.rb
==> Requirements
Optional: python ✔
==> Options
--universal
	Build a universal binary
--with-python
	Build with python support
--HEAD
	Install HEAD version
==> Caveats
This formula is keg-only, which means it was not symlinked into /usr/local.

macOS already provides this software and installing another version in
parallel can cause all kinds of trouble.

Generally there are no consequences of this for you. If you build your
own software and it requires this formula, you'll need to add to your
build variables:

    LDFLAGS:  -L/usr/local/opt/libxml2/lib
    CPPFLAGS: -I/usr/local/opt/libxml2/include
    PKG_CONFIG_PATH: /usr/local/opt/libxml2/lib/pkgconfig
~~~

Note the caveat - there must be a build variable set somewhere. I checked and the suggested libxml2 directory shown is a symlink to the real version I am expecting to link to.

~~~
mm:dhutchison.github.io david$  ls -l /usr/local/opt/libxml2
lrwxr-xr-x  1 david  admin    25B 15 Jan 22:26 /usr/local/opt/libxml2@ -> ../Cellar/libxml2/2.9.4_2
~~~

So, where is the direct link to (the non-extistant) "/usr/local/Cellar/libxml2/2.9.2"?

Trying to just install the "nokogiri" gem wit the Gem command directly also failed, but with a different error message.

~~~
mm:dhutchison.github.io david$ gem install nokogiri -v '1.6.8.1'
Building native extensions.  This could take a while...
ERROR:  Error installing nokogiri:
	ERROR: Failed to build gem native extension.

    current directory: /Users/david/.rbenv/versions/2.3.0/lib/ruby/gems/2.3.0/gems/nokogiri-1.6.8.1/ext/nokogiri
/Users/david/.rbenv/versions/2.3.0/bin/ruby -r ./siteconf20170122-24653-1p8lqiq.rb extconf.rb
checking if the C compiler accepts ... yes
checking if the C compiler accepts -Wno-error=unused-command-line-argument-hard-error-in-future... no
Building nokogiri using packaged libraries.
Using mini_portile version 2.1.0
checking for iconv.h... yes
checking for gzdopen() in -lz... yes
checking for iconv... yes
************************************************************************
IMPORTANT NOTICE:

Building Nokogiri with a packaged version of libxml2-2.9.4.

Team Nokogiri will keep on doing their best to provide security
updates in a timely manner, but if this is a concern for you and want
to use the system library instead; abort this installation process and
reinstall nokogiri as follows:

    gem install nokogiri -- --use-system-libraries
        [--with-xml2-config=/path/to/xml2-config]
        [--with-xslt-config=/path/to/xslt-config]


If you are using Bundler, tell it to use the option:

    bundle config build.nokogiri --use-system-libraries
    bundle install

Note, however, that nokogiri is not fully compatible with arbitrary
versions of libxml2 provided by OS/package vendors.
~~~

Running `bundle config` shows that I've set this before, but to a fixed-version:

~~~
mm:dhutchison.github.io david$ bundle config
Settings are listed in order of priority. The top value will be used.
build.nokogiri
Set for the current user (/Users/david/.bundle/config): "\"--use-system-libraries --with-xml2-include=/usr/local/Cellar/libxml2/2.9.2/include/libxml2"
~~~

So, the fix? Set the bundler configuration to the symlink value, as opposed to the fixed version, and re-run the bundle update:

~~~ bash

mm:dhutchison.github.io david$ bundle config build.nokogiri --use-system-libraries --with-xml2-include=/usr/local/opt/libxml2/include/libxml2
mm:dhutchison.github.io david$ bundle update

~~~

[homebrew]: http://brew.sh "Homebrew — The missing package manager for macOS"
