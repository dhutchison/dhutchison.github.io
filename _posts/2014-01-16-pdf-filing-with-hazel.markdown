---
keywords:
- perl
- macports
- brew.sh
- iphoto
- ipod photo cache
- hazel
- PDF
- paperless
- regex
- grouping
category: Productivity
tags:
- AppleScript
- bash
- Hazel
layout: post
title: PDF Filing With Hazel
header_image: "![Hazel Logo](/images/hazel_pdftotext/hazel-icon.png \"Hazel Logo\")"
image: /images/hazel_pdftotext/hazel-icon.png
description: How I got Hazel filing my bank statements
date: 2014-01-16 23:05
lastmod: 2014-02-26 22:13:13
slug: pdf-filing-with-hazel
comments: true
---

I've started using [Hazel][hazel] to automate some repetitive tasks, like filing PDF bills and financial documents that I download. Hazel is a fantastic timesaver of a tool that I should have bought a long time ago. Once the rules are set up correctly I don't need to worry about dealing with things in my Downloads folder, Hazel does that for me! One of the first things I set up was a rule to periodically clean out that pesky [iPod Photo Cache][ipod_photo_cache] that was causing my iPhoto library to unnessecarily grow!

I thought I was in luck when all the bills that I receive electronically were properly searchable, and Hazel's ```contents``` filter was able to match all the information I needed. Unfortunately my bank had to be the awkward one.
<!--more-->
## Processing these files ##
In order to process these files, I needed a utility that could convert the binary PDF data into text, ```pdftotext``` was the first option I found.

I use [Brew][brew] as my general purpose package manager, but it took me a while to get this in a working state again. I managed to completely hose my developer tools by deleting an outdated version of Xcode, but it turned out that all I needed to do was run ```sudo xcode-select -r``` to force it to reconfigure the path. While I was doing this I took the advice of ```brew doctor``` and cleaned up old MacPorts and Fink installations which no longer worked.

I gave ```pdftotext``` a shot (available via the xpdf package in brew). This allowed me to get so far as writing some sort of script that at least confirmed if a file contained my partially redacted credit card number. This step was relatively simple, I just needed two conditions. The first just checks that the file extension is "pdf", the second is that it passes a shell script. As ```grep``` treats finding a result as a success, the script is just piping the output of pdftotext to grep and looking for the partially redactacted card number as it appears on my statement, remembering to escape the asterisks. The below command is the format my statement uses, but obviously not the correct number.

~~~ bash
pdftotext $1 - | grep "1111 11\*\* \*\*\*\* 1111"
~~~

After I got this far I came across [this article][auto_filing] which explains the whole process of getting this working in Hazel. Unfortunately it does not include the text of the script, only an image. The script also looks a bit overly verbose, so I wanted to try to find a cleaner solution that was also not as dependant on the date appearing in a fixed number of lines.

I went through every utility that I could think of (grep, awk and sed) to regex match and capture the date sequence. Annoyingly my regex memory is stuck in Java mode which does not use the same character classes, so many attempts were taken before I just got the regex syntax correct. Finally I got matches with awk but couldn't get the printing of groups correct. I had to resort to Perl. I wish I had remembered Perl earlier, I always used to associate regex with Perl code. I was trying to match to the format ```27th December 2013``` and Perl had my solution:

~~~ bash
pdftotext thestatement.pdf - | perl -ne '/([0-9]{2})[a-z]{2} ([A-Z]{1}[a-z]*) ([0-9]{4})/ && print $1." ".$2." ".$3."\n"' | head -n 1
~~~

 So to break what this does down:

 1. Extract the text of the PDF file using ```pdftotext```. The "-" at the end signifies that the output should be to stdout instead of a file. This information is not in the help for the command!
 2. Using Perl, print out the groups in the regex match for the day, month and year parts. A new line is added to aid filtering later. 
 3. Use ```head``` to restrict to the first matching row.

At this point we can use this bash script in a very similar Applescript as the original article:

~~~ applescript
set itemPath to quoted form of POSIX path of theFile
set theCommand to "/usr/local/bin/pdftotext " & itemPath & " - | perl -ne '/([0-9]{2})[a-z]{2} ([A-Z]{1}[a-z]*) ([0-9]{4})/ && print $1.\" \".$2.\" \".$3.\"\\n\"' | head -n 1"
log "Command is " & theCommand
set dateString to do shell script theCommand
log "DateString is: " & dateString
set stmtMonth to word 2 of dateString
if stmtMonth is "January" then
	set stmtMonth to "01"
else if stmtMonth is "February" then
	set stmtMonth to "02"
else if stmtMonth is "March" then
	set stmtMonth to "03"
else if stmtMonth is "April" then
	set stmtMonth to "04"
else if stmtMonth is "May" then
	set stmtMonth to "05"
else if stmtMonth is "June" then
	set stmtMonth to "06"
else if stmtMonth is "July" then
	set stmtMonth to "07"
else if stmtMonth is "August" then
	set stmtMonth to "08"
else if stmtMonth is "September" then
	set stmtMonth to "09"
else if stmtMonth is "October" then
	set stmtMonth to "10"
else if stmtMonth is "November" then
	set stmtMonth to "11"
else if stmtMonth is "December" then
	set stmtMonth to "12"
end if
return {hazelExportTokens:{stmtMonth:stmtMonth, stmtYear:word 3 of dateString, stmtDay:word 1 of dateString}}
~~~

This did not work without specifying the full path to the ```pdftotext``` command, it just resulted in the error that there was no word 2 in the (empty) date string. I had hoped to do the month mapping in Perl but the solutions I came across using Hashes just resulted in similar logic, just squeezed into a single line. While verbose this is readable. 

The values that are returned from this script can be used later when setting the new filename by defining the names of these tokens in Hazel.

![Hazel Custom Tokens][hazel_tokens]

So there it is, success!

![Final Rule][finished_rule]

Hopefully this helps someone apart from me, as this took quite a while to get completely right.

### Update
This month (February 2014) the format of the date used in my statements changed to just ```24 February 2014
```. This of course broke my existing script. In order to handle both formats the second line of the AppleScript required a small change. This modification adds an extra group that can appear zero or one times to capture the "th" type part of the old date format.

~~~ applescript
set theCommand to "/usr/local/bin/pdftotext " & itemPath & " - | perl -ne '/([0-9]{2})([a-z]{2})? ([A-Z]{1}[a-z]*) ([0-9]{4})/ && print $1.\" \".$3.\" \".$4.\"\\n\"' | head -n 1"
~~~



[hazel]: http://www.noodlesoft.com/hazel.php "Noodlesoft | Hazel"
[brew]: http://brew.sh/ "Homebrew — MacPorts driving you to drink? Try Homebrew!"
[auto_filing]: http://technosavvy.org/2012/09/07/automated-bank-statement-filing-with-hazel/ "Automated bank statement filing with Hazel | The Savvy Technologist"
[ipod_photo_cache]: http://support.apple.com/kb/ts1314 "iTunes: Understanding the iPod Photo Cache folder - Support - Apple"
[finished_rule]: /images/hazel_pdftotext/hazel_rule.png "Finished Rule"
[hazel_tokens]: /images/hazel_pdftotext/hazel_custom_tokens.png "Hazel Custom Tokens"
