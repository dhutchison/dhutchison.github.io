---
layout: post
title: iPhoto -> Day One
date: 2012-08-14 00:00:00
categories: []
tags:
- AppleScript
- Day One
- iPhoto
status: publish
type: post
published: true
meta:
  _wpas_done_facebook: '1'
  _wpas_done_twitter: '1'
---
In version 1.8 of Day One they introduced the ability to add an image into the entry. This is a great feature, as a picture always brings back memories clearer than just words. However I was trying to add a photo from iPhoto last night, and at some point they have removed the "Show File" option, so I had to find it manually in the library package. Very annoying.

<!--more-->

Jordan Patterson blogged a script ([link](http://http://jordanpatterson.me/post/28961089470/aperture-to-dayone "aperture-to-dayone")) to do this from Aperture, which I have modified to work with the selected image in iPhoto. It is not smart, it does not check for selection etc but it does the job.

{% highlight applescript %}
#Script to add a photo from iPhoto to DayOne. 
#Based on script by Jordan Patterson and posted originally at 
#http://jordanpatterson.me/post/28961089470/aperture-to-dayone
#Feel free to modify, reuse, and repost this script

tell application "iPhoto"
    set imageSel to (get selection)
	repeat with i from 1 to count of imageSel
		
	    # This script uses the date and time attached to 
    	# the image to set the date and time of the Day One journal entry
        set theDate to date of (item i of imageSel)
    		
    	set theYear to year of theDate as integer
        set theMonth to month of theDate as integer
    	set theDay to day of theDate as integer
	    set theHour to hours of theDate as integer
    	set theMin to minutes of theDate as integer
		    
    	set theExportPath to image path of (item i of imageSel)
    end repeat
end tell
    
set theDate to theMonth & "/" & theDay & "/" & theYear as string
set theAP to "AM"
if theMin is less than 10 then
    set theMin to "0" & theMin
end if
if theHour is greater than 12 then
    set theAP to "PM"
   	set theHour to theHour - 12
end if
set theTime to theHour & ":" & theMin & " " & theAP as string
set theDateTime to "\"" & theDate & " " & theTime & "\""

set theScript to "echo \"\" | /usr/local/bin/dayone -p='" ¬
    & theExportPath & "' -d=" & theDateTime & " new" as string

set theEntry to do shell script theScript
set theLength to the length of theEntry
set theStart to theLength - 39
set theEnd to theLength - 8
set theUDID to text theStart thru theEnd of theEntry
    
do shell script "open dayone://edit?entryId='" & theUDID & "'"
{% endhighlight %}

