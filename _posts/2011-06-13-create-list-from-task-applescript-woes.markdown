---
layout: post
title: Create List From Task / AppleScript Woes
date: 2011-06-13 00:00:00
categories:
- Productivity
tags:
- AppleScript
- The Hit List
status: publish
type: post
published: true
meta:
  _wpas_done_fb: '1'
  _wpas_done_twitter: '1'
---
Following a post from a previous user of OmniFocus in The Hit List mailing list, they missed the ability to hit a keyboard shortcut and create a list from a task. Basically (I think) with the purpose of creating a list of related tasks from a high level objective, in a situation where sub-tasks were not enough.

<!--more-->

### The Script ###
Seeing this, I instantly thought that this should be easy in AppleScript, and the basics of it were:

{% highlight applescript %}
tell application "The Hit List"
    set currentSelection to selection
    repeat with theTask in currentSelection
        set listName to timing task of theTask
        tell folders group to make new list with properties {name:listName}
        set newList to result
    end repeat
end tell
{% endhighlight %}

This creates a new list for each of the currently selected tasks.

Going on the assumption that this task may contain more information than just a title, this information should probably be preserved. Ideally the task which created the list should become part of the list.

Now, I thought this would be simple to do; but attempting "move theTask to newList" results in the incredibly helpful "Can’t make or move that element into that container". Great. Tried moving it into the inbox (the list my test task came from): nope, same error. After much hunting and experimentation, I still couldn't get this to work. So, time just to copy the task into the newly created list, then delete the original.

Unsurprisingly, "duplicate theTask to newList" results in the same incredibly unhelpful error. My understanding of AppleScript is far from perfect, but I would have thought even attempting to duplicate/move the item into the list I know it came from would have worked. If anyone knows how to resolve this issue, please do share. It would make the script a lot simpler.

In the end I gave up, I resorted to recreating the task with the same properties in the new list, before deleting the original task from the old list.

### Keyboard Shortcuts ###
There are various solutions available to assign a keyboard shortcut to an AppleScript, but my preferred solution is a combination of Automator and System Preferences. I believe this will not work in any version of OS X prior to Snow Leopard.

I created a simple service which will only appear available in The Hit List with a single action: Run AppleScript.

<a href="http://devwithimagination.files.wordpress.com/2011/06/automator-action.png"><img class="alignnone size-medium wp-image-28" title="Automator Action" src="http://devwithimagination.files.wordpress.com/2011/06/automator-action.png?w=300" alt="" width="300" height="198" /></a>

Next, in the Keyboard pane of System Preferences I configured a keyboard shortcut for the service, I named it "Create List From Task". It took a few attempts to find one which did not conflict with something else.

<a href="http://devwithimagination.files.wordpress.com/2011/06/keyboard-shortcut.png"><img class="alignnone size-medium wp-image-27" title="Keyboard Shortcut" src="http://devwithimagination.files.wordpress.com/2011/06/keyboard-shortcut.png?w=300" alt="" width="300" height="268" /></a>
 
### Finally ###
Every time I dabble in AppleScript, I seem to run into issues that result in unhelpful errors. I can see it is meant to be like typing natural language commands instead of the what I would consider "normal" programming syntax, but the syntax always seems to catch me out. While copying the properties for the new task, I kept getting errors about missing values not being allowed. I tried various comparisons using nulls and nils, and none of them worked. It appears the correct way to determine if a variable has a value in AppleScript is:

{% highlight applescript %}
if (taskSD is not missing value) then
    --do something here
end if
{% endhighlight %}

But anyway, the final script solution is available on my [GitHub](https://github.com/dhutchison/DWI) in the [THL-ListFromTask](https://github.com/dhutchison/DWI/tree/master/THL-ListFromTask) folder.
