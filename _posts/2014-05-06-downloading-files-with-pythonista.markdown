---
layout: post
title: Downloading files with Pythonista
category: development
tags:
- python
- pythonista
image: /images/pythonista_ipad-t.jpg
header_image: "![Pythonista Logo](/images/pythonista_ipad-p.png \"Pythonista Icon\")"
date: 2014-05-06 21:49
slug: downloading-files-with-pythonista
comments: true
---

I have been trying to broaden the programming languages that I am familiar with and I am giving Python a shot. I have been trying out [Pythonista][pythonista] as my IDE. Pythonista is a universal app for iPad & iPhone ([iTunes link][pythonista_itunes]). This is working out quite well for me, as it means I can read a book on my iPad, then just change apps to try out the things I have learned without needing to sit in front of my computer. It also allows me to do some more powerful things with my iOS devices.

The first script I want to share solves a little problem I have. While browsing the internet during the day on my iPhone, when I am away from my main computer, there will be files that I want to download later. Up to now the process has been to add a reminder with the link to come back to it later.

Now I can use Pythonista to download the file and upload it to my Dropbox folder. Later on, when I am at home, this will sync to my desktop and Hazel can process it appropriately. 

<!--more-->

## Why Pythonista?

Pythonista is by the same developer as [Editorial][editorial_itunes], my iPad text editor [of choice][editorial_post]. The workflow system in Editorial is powered by the same Python backend, so the modules available in the two applications are mostly the same. This means that any scripts I develop in Pythonista can be used as part of a text workflow. Eventually I would like to integrate the [PyGitHub library][py_github] into something so I can commit updates to this site without needing my desktop, but I appreciate this is not going to be an easy task.

One of the annoyances I have had with this application is there is not an easy way to transport scripts between the two platforms. The current solutions appear to revolve around using the GitHub Gist service. An example, which I could not get to work, is called [gist check][gistcheck].

I am working on a solution to this problem that will use the Dropbox API to sync files. I am currently testing this, but it seems to still have a few bugs that need ironed out before it is released to the wild.

If you are looking for a complete review of the application, this is not the place. I would suggest you check out Federico Viticci's excellent article: [Automating iOS: How Pythonista Changed My Workflow][macstories_pythonista].

## Setting Up a Dropbox Developer Account

In order to use the Dropbox API you will require your own developer account. You will need to [create an app][dropbox_create_app] and plug in your own `APP_KEY` and `APP_SECRET` values into the script below. I set up my script to use a seperate application directory, but you can choose to use the root of your Dropbox by changing the `ACCESS_TYPE` variable.

    #### App folder
    
    A dedicated folder named after your app is created within the Apps folder of a user's Dropbox. Your app gets read and write access to this folder only and users can provide content to your app by moving files into this folder. Your app can also read and write datastores using the Datastore API.
    
    #### Full Dropbox
    
    You get full access to all the files and folders in a user's Dropbox, as well as permission to read and write datastores using the Datastore API.
    
    Your app should use the least privileged permission it can. When applying for production, we'll review that your app doesn't request an unnecessarily broad permission.

## The Script

This script takes in a single argument, the URL to download. This script is not complicated, and really should perform validation, but I am new to Python and still learning.

You can either set this argument by holding the Run button in Pythonista, which will display a "Run With Arguments" dialog, or by use of a bookmarklet. In Chrome I have a bookmarklet that will take the current page URL and call the script via the `pythonista://` URL scheme.

`javascript:window.location='pythonista://FileDownloader.py?action=run&argv='+ encodeURIComponent(location.href)`

The first time the script is run it will ask to be authenticated with Dropbox.

{% highlight python %}
# Script for downloading a URL to Dropbox
import sys
import urllib2
import urllib
import dropbox
import os
import console

# Configuration
DOWNLOAD_FOLDER = 'downloads'
# Get your app key and secret from the Dropbox developer website
APP_KEY = '<your app key>'
APP_SECRET = '<your app secret>'
# ACCESS_TYPE should be 'dropbox' or 'app_folder' as configured for your app
ACCESS_TYPE = 'app_folder'

### Main program below ###
PYTHONISTA_DOC_DIR = os.path.expanduser('~/Documents')
SYNC_STATE_FOLDER = os.path.join(PYTHONISTA_DOC_DIR, 'dropbox_sync')
TOKEN_FILEPATH = os.path.join(SYNC_STATE_FOLDER, TOKEN_FILENAME)
 
def transfer_file(a_url):

    # Configure Dropbox
    sess = dropbox.session.DropboxSession(APP_KEY, APP_SECRET, ACCESS_TYPE)
    configure_token(sess)
    client = dropbox.client.DropboxClient(sess)
    
    print "Attempting to download %s" % a_url
    
    file_name = a_url.split('/')[-1]
    file_name = urllib.unquote(file_name).decode('utf8') 

    
    if not os.path.exists(DOWNLOAD_FOLDER):
        os.makedirs(DOWNLOAD_FOLDER)
        
    download_file = os.path.join(DOWNLOAD_FOLDER, file_name)
    
    u = urllib2.urlopen(a_url)
    f = open(download_file, 'wb')
    meta = u.info()
    file_size = int(meta.getheaders("Content-Length")[0])
    print "Downloading: %s Bytes: %s" % (file_name, file_size)
    
    file_size_dl = 0
    block_sz = 8192
    while True:
        buffer = u.read(block_sz)
        if not buffer:
            break

        file_size_dl += len(buffer)
        f.write(buffer)
        status = r"%10d  [%3.2f%%]" % (file_size_dl, file_size_dl * 100. / file_size)
        status = status + chr(8)*(len(status)+1)
        print status,
        
    f.close()
    
    print "Uploading to dropbox"
    upload(download_file, client)
    
    # Delete the local file
    os.remove(download_file)
    
    print "DONE !"

def upload(file, client):
    print "Trying to upload %s" % file

    response = client.put_file(file, open(file, 'r'), True)
    
    print "File %s uploaded to Dropbox" % file
    
 
def configure_token(dropbox_session):
    if os.path.exists(TOKEN_FILEPATH):
        token_file = open(TOKEN_FILEPATH)
        token_key, token_secret = token_file.read().split('|')
        token_file.close()
        dropbox_session.set_token(token_key,token_secret)
    else:
        setup_new_auth_token(dropbox_session)
    pass

def setup_new_auth_token(sess):
    request_token = sess.obtain_request_token()
    url = sess.build_authorize_url(request_token)
    
    # Make the user sign in and authorize this token
    print "url:", url
    print "Please visit this website and press the 'Allow' button, then hit 'Enter' here."
    webbrowser.open(url)
    raw_input()
    # This will fail if the user didn't visit the above URL and hit 'Allow'
    access_token = sess.obtain_access_token(request_token)
    #save token file
    token_file = open(TOKEN_FILEPATH,'w')
    token_file.write("%s|%s" % (access_token.key,access_token.secret) )
    token_file.close()
    pass

def main():

    # Attempt to take a URL from the arguments
    the_url = None
    try:
        the_url = sys.argv[1]
    except IndexError:
        # no arguments, use the clipboard contents
        the_url = clipboard.get()

    if not the_url:
        print repr(sys.argv)
        return

    console.clear()
    transfer_file(the_url)
 
if __name__ == '__main__':
    main()

{% endhighlight %}

This script is also available as a [gist][filedownloader_gist].

I would appriciate any feedback, as my coding experience these days is mostly Java and there may be a better way to do this in Python that I have missed. 

## Next?
After my last few Python projects are complete, I think the next language I want to try my hand at will be JavaScript. I did my final year project at University in JavaScript and have barely touched it since. I have a handful of projects in mind that shouldn't be too difficult to achieve, but will still give me a good understanding of the language.

[macstories_pythonista]: http://www.macstories.net/stories/automating-ios-how-pythonista-changed-my-workflow/ "Automating iOS: How Pythonista Changed My Workflow – MacStories "
[filedownloader_gist]: https://gist.github.com/dhutchison/113f634a034c13716925 "Script for downloading a file at a URL and uploading the file to Dropbox. For use with Pythonista. "
[dropbox_create_app]: https://www.dropbox.com/developers/apps "App Console - Dropbox "
[py_github]: https://omz-forums.appspot.com/pythonista/post/4550380411158528 "omz:software Forums — Access your Github Account from Pythonista "
[editorial_post]: /2013/10/03/editorial-first-impressions-and-a-workflow/ "Editorial – First Impressions, and a Workflow"
[editorial_itunes]: https://itunes.apple.com/gb/app/editorial/id673907758?mt=8&uo=4&at=10lsY7 "Editorial on iOS App Store"
[pythonista]: http://omz-software.com/pythonista/ "Pythonista "
[pythonista_itunes]: https://itunes.apple.com/gb/app/pythonista/id528579881?mt=8&uo=4&at=10lsY7 "Pythonista on iOS App Store"
[gistcheck]: https://gist.github.com/spencerogden/4702275 "Script for use with Pythonista to allow Github Gists for script storage and retrieval. Copy script in full into a new script in Pythonista called "gitcheck". Run the script and it will create 4 scripts starting with "Gist". These can be added to the action menu. See comments for more details. "
