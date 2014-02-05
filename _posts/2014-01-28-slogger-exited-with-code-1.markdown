---
keywords:
- ruby version manager
- launchd
- ruby
- mavericks
- slogger
- exited with code 1
layout: post
title: ! 'Slogger Exited with code: 1'
date: 2014-01-28 22:47
slug: slogger-exited-with-code-1
comments: true
---
I used to use Brett Terpstra's [Slogger][slogger] for logging various activities in to [Day One][dayone]. Probably around 6 months ago I stopped using Day One, just out of lazyness, but now I am trying to write down my thoughts and experiences more. Part of this is driven just by my poor memory.

Back to Slogger. Over the last 6 months this should have been silently running every evening, updating Day One with information in the background, but the scheduled task has been failing. Because I was not actively using Day One over this period I never noticed. This possibly stopped working around the upgrade to Mavericks, or it could have been when I started toying with Ruby development. Either way it is screwed. And the error that was appearing in the console was less than helpful. 

```
28/01/2014 21:31:29.437 com.apple.launchd.peruser.501[275]: (com.brettterpstra.Slogger[6346]) Exited with code: 1
```

All the searches I did on this just resulted in no response forum posts, or it magically working on its own again. I needed to find a solution.
<!--more-->

This initially had me stumped as the command Launchd would be calling was the same as I ran through terminal with no issues at all.

    /Users/david/.rvm/rubies/ruby-1.9.3-p194/bin/ruby /Users/david/Scripts/Slogger2/slogger

Deducing the problem took a bit of scavenging the internet to find parts to a solution.

## Step 1: Getting a useful error message

Launchd allows for a LaunchAgent plist file to specify locations for log files. All that is required is to add the following in to the main ```dict``` node, updating paths as appropriate to a writable location.

{% highlight xml %}
<key>StandardOutPath</key>
<string>/Users/david/temp/Slogger.out</string>
<key>StandardErrorPath</key>
<string>/Users/david/temp/Slogger.err</string>
{% endhighlight %}

## Step 2: Dealing with the error
This additional logging did give me some progress. The ```Slogger.err``` file now contained an error that I could debug.

```
/Users/david/.rvm/rubies/ruby-1.9.3-p194/lib/ruby/site_ruby/1.9.1/rubygems/custom_require.rb:36:in `require': cannot load such file -- twitter (LoadError)
        from /Users/david/.rvm/rubies/ruby-1.9.3-p194/lib/ruby/site_ruby/1.9.1/rubygems/custom_require.rb:36:in `require'
        from /Users/david/Scripts/Slogger2/plugins/twitterlogger.rb:39:in `<top (required)>'
        from /Users/david/.rvm/rubies/ruby-1.9.3-p194/lib/ruby/site_ruby/1.9.1/rubygems/custom_require.rb:36:in `require'
        from /Users/david/.rvm/rubies/ruby-1.9.3-p194/lib/ruby/site_ruby/1.9.1/rubygems/custom_require.rb:36:in `require'
        from /Users/david/Scripts/Slogger2/slogger.rb:241:in `block in run_plugins'
        from /Users/david/Scripts/Slogger2/slogger.rb:233:in `each'
        from /Users/david/Scripts/Slogger2/slogger.rb:233:in `run_plugins'
        from /Users/david/Scripts/Slogger2/slogger.rb:388:in `<top (required)>'
        from /Users/david/.rvm/rubies/ruby-1.9.3-p194/lib/ruby/site_ruby/1.9.1/rubygems/custom_require.rb:36:in `require'
        from /Users/david/.rvm/rubies/ruby-1.9.3-p194/lib/ruby/site_ruby/1.9.1/rubygems/custom_require.rb:36:in `require'
        from /Users/david/Scripts/Slogger2/slogger:18:in `<main>'
```

Something with the setup in [RVM][rvm](Ruby Version Manager) was making the availability of gems dependent on some environment variable that was not present for Launchd.

## Step 3: Fixing the issue
It turns out that an RVM script is included as part of my ```~/.bash_profile``` which sets an environment variable. This is not setup when Launchd tries to run. At first I was tempted just to remove RVM, as I do very little ruby and Mavericks now includes an even later version. I had initially installed this due to issues with version 1.8.

In order to get this working I had to bastardise my plist file quite a lot, but now Slogger can run via Launchd. The finished plist file I am using is below.

{% highlight xml %}
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>com.brettterpstra.Slogger</string>
	<key>ProgramArguments</key>
	<array>
		<string>/bin/bash</string>
        <string>-c</string>
		<string>export HOME=~; [[ -s "$HOME/.rvm/scripts/rvm" ]] &amp;&amp; source "$HOME/.rvm/scripts/rvm" &amp;&amp; ruby /Users/david/Scripts/Slogger2/slogger</string>
	</array>
	<key>RunAtLoad</key>
	<false/>
	<key>StandardErrorPath</key>
	<string>/Users/david/temp/Slogger.err</string>
	<key>StandardOutPath</key>
	<string>/Users/david/temp/Slogger.out</string>
</dict>
</plist>
{% endhighlight %}

Hopefully this helps someone else get past this issue, or at least make a start on diagnosing any issues.

[dayone]: http://dayoneapp.com/ "Day One | A simple Journal for iPhone, iPad and Mac App Store "
[slogger]: http://brettterpstra.com/projects/slogger/ "Slogger - BrettTerpstra.com "
[rvm]: http://rvm.io/ "RVM: Ruby Version Manager - RVM Ruby Version Manager - Documentation "
