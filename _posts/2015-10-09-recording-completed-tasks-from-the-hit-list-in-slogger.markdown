---
title: Recording completed tasks from The Hit List in Slogger
tags:
- The Hit List
- Slogger
- AppleScript
- Ruby
categories:
- Development
summary: I wrote a plugin to update Slogger from The Hit List
date: 2015-10-09 21:37
slug: recording-completed-tasks-from-the-hit-list-in-slogger
---
I have been using Brett Terpstra's [Slogger][slogger] for a number of years to update [Day One][dayone] with information from services I use. One thing that was missing was keeping some sort of record of the tasks I had completed in a day, in an easy to view fashion.

<!--more-->

I use [The Hit List][thl] as my task management application of choice, after switching back from a Things/Reminders mismatch solution. I originally got the Mac version of this application through a MacHeist promotion, but had switched away from it around the time that the iPhone application was released (after much delay) which required a paid subscription for sync. This sync service is now free, so I gave the application another chance and I am hooked again.

Based on the Things plugin which is included in the Slogger project, I created a plugin to capture the completed tasks from The Hit List and group them by date. 

The majority of the code in this plugin is Applescript. I had written this part separately before making the small changes required to run this embedded in a Ruby script and parse the output. It is definitely not an efficient way of finding the completed tasks, as for each date in the filter range it effectively does a depth first search looking for tasks completed on that day, but it achieves the goal.



The pull request for this plugin has now been [merged][thl_pr], so it is available as a disabled plugin [in the Slogger project][thl_plugin]. 



[slogger]: http://brettterpstra.com/projects/slogger/ "Slogger - BrettTerpstra.com"
[dayone]: http://dayoneapp.com "Day One | A simple and elegant journal for iPhone, iPad, and Mac."
[thl]: http://www.karelia.com/products/the-hit-list/mac.html "The Hit List for Mac: Handles life’s little tasks & big projects"
[thl_pr]: https://github.com/ttscoff/Slogger/pull/387#event-430765755 "Pull Request 387"
[thl_plugin]: https://github.com/ttscoff/Slogger/blob/master/plugins_disabled/thehitlist.rb "thehitlist.rb in ttscoff/Slogger"
