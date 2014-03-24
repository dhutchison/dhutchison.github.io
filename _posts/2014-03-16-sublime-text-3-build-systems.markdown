---
category: development
comments: true
date: 2014-03-16 22:02
keywords:
- sublime text
- build systems
- Jekyll
- grunt
layout: post
slug: sublime-text-3-build-systems
tags:
- Software
- Sublime Text
- Scripting
- Jekyll
title: Sublime Text 3 Build Systems
---

I have been trying out [Sublime Text 3][st3] as a replacement for [Espresso][espresso] as my general purpose editor. So far, I absolutely love it.

<!--more-->

Before I started this trial I was still using Espresso 1, as I was never convinced that version 2 had any new features that I urgently needed. As I have got back in to the hobby of more web focused development, the little bugs have became more and more annoying. I needed a change.

I have seen a lot of recommendations for this editor in the past, but I never understood what it did that was so special, as opposed to using a basic text editor. The true power of this application lies in the features behind the interface. I love the Build Systems feature. [This article][build systems] gives an example of using the build feature perform a commit to GitHub. To me that does not count as a build and a bit of an abuse of the feature, but it showed me what was possible and it looked useful. 

The build system feature provides a simple way to get a command run with a single shortcut: ⌘B. In the Tools menu I have configured the build system to be "Automatic" so it can choose the correct one for the file type I am editing. More on how to set this up later.

## Configuring a Build System for Jekyll

User created build systems, on the Mac at least, need to be in the `~/Library/Application Support/Sublime Text 3/Packages/User` directory. This application uses JSON formatted files for build system configuration.


For my Jekyll site development I have created a `Jekyll.sublime-build` file with this content:
{% highlight json %}
{
  "cmd": ["/usr/bin/rake",  "build[jekyll]"],
  "env": {"LANG":"en_US.UTF-8", "LC_ALL":"en_US.UTF-8"},
  "working_dir": "$project_path",
  "selector": "text.html.markdown.jekyll"
}
{% endhighlight %}

Based on the number of incompatible guides I found on the format of this file, I can only assume this has changed between the different versions of Sublime Text. I found [this documentation][bs guide] at least gave me a pointer in the direction to go, although it required a lot of trial and error to get working.

This script states to use the `rake` command to execute my `build` target, supplying the parameter `jekyll`. In my setup this means that only the Jekyll elements of the site get rebuilt. I can supply `all` to this target to also build the CSS files from the Less source at the same time. Prior to running this command the current working directory gets changed to the root directory of the project. I had to set some additional env settings as I was getting an `invalid byte sequence in US-ASCII` error for some of my markdown files. The `selector` attribute defines the scope that this build system should apply to, so the "Automatic" build system can pick this configuration. The value here relates to the "Markdown (Jekyll)" mode of [this plugin][jekyll plugin]. The value itself came from the `scopeName` attribute of a `.tmLanguage` file in the plugin source. I could not find a way to get this information from the user interface.

In all of the Jekyll based projects I am currently working on I stick to the same pattern for build targets. I'm a sucker for conventions across projects.

## Configuring a Build System for Grunt

Not long ago I switched from using the [less][lessnode] node compiler directly to setting up a workflow in [Grunt][grunt]. I wanted to switch to a better workflow so I could perform actions such as using [myth] to handle adding in required browser prefixes for CSS and [uncss][uncss] for cleaning up unused styles produced by Font Awesome. My `build` target, with the 'less' parameter, now calls Grunt. This just calls the command line, but still required some set up to work within Sublime Text.

I created another build file called `Less.sublime-build` with the content:
{% highlight json %}
{
  "cmd": ["/usr/bin/rake",  "build[css]"],
  "env": {"LANG":"en_US.UTF-8", "LC_ALL":"en_US.UTF-8"},
  "working_dir": "$project_path",
  "selector": "source.less"
}
{% endhighlight %}

To save having to configure the path that Sublime Text uses, I set up a symlink for the node binary, and in the rake file included the full path to my grunt binary. The error I had got without the symlink was pretty cryptic, but [Stack Overflow][env question] came to the rescue as always.

## The Rake File

As previouly mentioned, these targets just call the command line so the rake file itself remains simple to understand. 

{% highlight ruby %}

require 'yaml'
require 'rubygems'
require 'stringex'

desc 'Build and send to dev server'
task :build, :opt do |t, args|
    
  opt = args[:opt]
  if !opt then
    opt = "all"
  end

  puts sprintf("Building %s\n", opt)
  if ("all".casecmp opt) == 0 then
    css
    jekyll
  elsif("css".casecmp opt) == 0 then
    css
    # need to copy to the built site prior to deployment
    FileUtils.cp_r(Dir['assets/css/*'],'../dwi_built_site/assets/css')
  elsif("jekyll".casecmp opt) == 0 then
    jekyll
  end
  
  upload
  puts 'Done.'
end

def jekyll
  puts 'Building Jekyll pages...'
  sh 'bundle exec jekyll build -d ../dwi_built_site'
  puts 'Jekyll page build complete.'
end

def css
  puts 'Building CSS...'
  sh '/usr/local/bin/grunt build'
  puts 'CSS build complete.'
end

task :deploy_dev do
  upload
end

def upload
  puts 'Sending to server...'
  sh 'rsync -avz --delete ../dwi_built_site/ david@dev-lamp.local:/home/wwwroot/dwi/'
  puts 'Sent'

end
{% endhighlight %}


## In Conclusion

A build system built in to the editor like this a great convienience. For my purposes it saves me having to switch over to the terminal every time I want to deploy my code changes.

Sublime Text seems to be a nice powerful editor, with lots of hidden features. It may be my editor of choice, but I want to try out some of the other contenders before committing to purchasing any product.

[st3]: http://www.sublimetext.com/3 "Sublime Text - Download "
[espresso]: http://macrabbit.com/espresso/ "MacRabbit - Espresso - The Web Editor "
[build systems]: http://matthewpalmer.net/blog/2014/01/18/publish-jekyll-posts-from-sublime-text-2/ "How to Publish Jekyll Posts from Sublime Text 2 — Matthew Palmer"
[jekyll package]: https://sublime.wbond.net/packages/Jekyll "Jekyll - Packages - Package Control"
[bs guide]: http://docs.sublimetext.info/en/latest/reference/build_systems.html "Build Systems – Sublime Text Unofficial Documentation"
[env question]: http://stackoverflow.com/questions/20061529/sublime-text-coffeescript-build-system-env-node-no-such-file-or-directory "Sublime Text CoffeeScript build system: `env: node: No such file or directory` - Stack Overflow "
[jekyll plugin]: https://sublime.wbond.net/packages/Jekyll "Jekyll - Packages - Package Control "
[lessnode]: https://www.npmjs.org/package/less "less "
[grunt]: http://gruntjs.com/ "Grunt: The JavaScript Task Runner "
[myth]: http://www.myth.io/ "Myth - CSS the way it was imagined. "
[uncss]: https://github.com/addyosmani/grunt-uncss "addyosmani/grunt-uncss "
