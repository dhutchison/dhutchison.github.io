---
title: Sharing from Mail.app to Obsidian
summary: My workflow for creating notes in Obsidian on a Mac, starting with the contents
  of an email in Mail.app.
tags:
- Obsidian
- AppleScript
- Mail.app
date: 2024-01-21 23:27
slug: sharing-from-mail-dot-app-to-obsidian
---
Over the last few months I've been trying to get more organised and take a proper look back at finding a productivity and note taking system that works for me. I've been through many different iterations over the years - sometimes it lasts for a while and other times it doesn't. At the moment I'm trying to centralise on using [Obsidian][obsidian] as the tool for all my notes. 

There are many emails that I receive that I want to create notes based off of - this might be planning next steps for a project based on information I have been provided, or for more informational messages what my summary/highlights/takeaways are. The point of truth for the message will remain to be Mail, so as well as the contents I want a link back to the original message. 

Unfortunately there is no share sheet or shortcuts functionality for Mail on that we can use to extract out mail message contents, so this is a MacOS only solution as it needs to use AppleScript. Even though this can only be created on MacOS, the Mail links which are embedded in the notes will also work on iOS/iPadOS. 

Ultimately what I wanted to create is a new note in an "Inbox" directory in my Obsidian Vault with the title being something like `<datetime> - subject line` and the note containing something like the following:

```
> [!quote]
> Subject: Mail subject
> Sender: Mail sender
> Date received: Mail date received
> [Open in Mail.app](Mail deeplink)
> 
> ---
> 
> Mail body
```

<!--more-->

It turns out this wasn't too complicated. There are two main parts to this solution:

1. An AppleScript that will get the selected email message from Mail.app and extract various attributes. This will be wrapped in an Automator Quick Action so that we can assign a keyboard shortcut to it
2. A Python script which will be called by the AppleScript and will create the formatted file in the Obsidian vault

## The Automator Action

To create a create the Automator action with a keyboard shortcut for this:

1. Open Automator
2. Create a new Quick Action
3. Set the workflow to receive 'no input' in Mail.app
4. Select Run Apple Script and paste in the script contents below. Note that this contains a path to the location of the Python script which we will get to next, you will need to customise this path. 
5. Save this action
6. Open System Settings and search for Keyboard Shortcuts. Select Services from the sidebar and find your service (this will likely be under the General category). Add a shortcut key by double clicking `(none)`

<p></p>
```AppleScript
tell application "Mail"
    set _msgs to selected messages of message viewer 0
    if (_msgs is not equal to missing value) then
        set _msg to first item of _msgs
        set _msgSender to (sender of _msg)
        set _msgReceived to ((date received of _msg) as «class isot» as string)
        set _msgSubject to (subject of _msg)
        set _msgBody to (content of _msg)
        
        return do shell script "/opt/homebrew/bin/python3 '/Users/dhutchison/Library/Mobile Documents/iCloud~md~obsidian/Documents/ObsidianVault/3 - Resources/Tools & Technology/Obsidian/Extracting Email to Obsidian.py' " & (quoted form of _msgSender) & " " & (quoted form of _msgSubject) & " " & (quoted form of _msgReceived) & " " & (message id of _msg) & " " & (quoted form of _msgBody)
        
    end if
end tell
```

Your action should look something like this:

![Automator action][img-quick-action]

## The Python Script

The Python script to create the formatted file is as follows. Note that this contains a path to the Obsidian vault, which you will need to customise to match your setup. 

While the file this creates functionally works just now, I think this will be something I iterate on a bit as I use this more. 

```python
import sys
import urllib.parse

obsidian_vault = '/Users/dhutchison/Library/Mobile Documents/iCloud~md~obsidian/Documents/ObsidianVault/Inbox/'

sender = sys.argv[1]
subject = sys.argv[2]
date_received = sys.argv[3]
message_id = sys.argv[4]
body = sys.argv[5]

message_url = "message://%3C" + urllib.parse.quote(message_id) + "%3E"

filename = date_received.replace(':', '').replace('-', '') + ' - ' + subject + '.md'

with open(obsidian_vault + filename, 'w') as the_file:

    the_file.write('> [!quote]\n')
    the_file.write(f'> Subject:: {subject}\n')
    the_file.write(f'> Sender:: {sender}\n')
    the_file.write(f'> Date received:: {date_received}\n')
    the_file.write(f'> [Open in Mail.app]({message_url})\n')
    the_file.write('> \n')
    the_file.write('> ---\n')
    the_file.write('> \n')

    for line in body.splitlines():
        the_file.write(f'> {line}\n')

print('Created ' + obsidian_vault + filename)
```

## The final output

This is what the final rendered note (for a sample email) looks like:

![Example generated note][img-example-note]


[img-quick-action]: /images/email_obsidian/action.png "Automator Action"
[img-example-note]: /images/email_obsidian/finished-note.png "Example generated note"


 





[obsidian]: https://obsidian.md "Obsidian - Sharpen your thinking"
