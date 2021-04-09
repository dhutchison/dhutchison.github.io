---
date: 2013-10-22 21:58
keywords: [iphoto, iphone, flickr, apple, itunes, itunes match, icloud, applescript]
layout: post
slug: cloud-services
description: Can I get away with storing photos and music in the cloud?
title: Cloud Services
category: Products
tags: 
- Software
sitemap:
  lastmod: 2013-11-15 22:55
---

I was certain that I was going to buy a 32GB iPhone 5s after seeing how much space free I still had on my 16GB iPhone 4, but then I got thinking: how much of the stuff I have on this phone really needs to be on the device and not just accessible somehow?

<!--more-->

I should be able to keep some kinds of content available in cloud services instead of residing on my device, my contract with Three includes unlimited data (plus tethering) so data usage is not a worry.

## Photos ##
A large chunk of the space on my device was being taken up by synced photos. Sometimes I want to show people photos, especially of my children, so I like having these handy. I don't take many photos with my phone anymore as I have been making a conscious effort to bring my proper camera whenever I am going anywhere, so storage space for new photos is not really an issue. I have had a pro Flickr account for years as a result of an old BT Internet account that I had long cancelled, but I never used it. I have recently been notified that this pro upgrade is going to expire, but now that Flickr are offering 1TB of storage for free to anyone the current offering is more than adequate for my entire photo collection (around 20GB). I thought I could just put all my photos in a private library on there and use the iOS apps if I need to show anything. Any photos I want to be public can then have their permissions changed as appropriate. 

Luckily I am not the first to have this idea. [George MacKerron](http://mackerron.com/ "George MacKerron - About me")  has written a little Ruby script called [iPhoto-Flickr](https://github.com/jawj/iphoto-flickr "jawj/iphoto-flickr · GitHub") which will incrementally upload all photos held in your iPhoto library to Flickr, including creating photo sets for any albums the photos were organised in (excluding smart albums, events and faces). It is important to note that this will upload photos using your default privacy settings, so you really should check this is set up as private if you do not want all your pictures shared with the world. 

It is really easy to set up: 

1. [Get non-commercial Flickr API Key](http://www.flickr.com/services/apps/create/apply "API Key Request").
2. Follow the rest of the [install instructions](https://github.com/jawj/iphoto-flickr/blob/master/README.md "iphoto-flickr/README.md at master · jawj/iphoto-flickr · GitHub"). 

I've came across a few images in my collection that Flickr rejects for one reason or another. This script will indefinitely keep retrying to upload these images. I have [forked](https://github.com/dhutchison/iphoto-flickr "iphoto-flickr fork") this script so it will give up on uploading an image after 3 failures, or if the API failure is not a recoverable error (such as unknown image type). I think I may also may want to change it so Events are synced as I tend to use events for organisation of my images and rarely use albums at all now. I may try this out once my initial upload is complete.

As I am still in the process of the initial upload so I have not yet set up a schedule to keep running this for updates, but as it is a single script it will be easy enough to configure as a Launchd task. The simple way to do this would just be on a schedule, I've used [Lingon](http://www.peterborgapps.com/lingon/ "Lingon - Peter Borg Apps") in the past for configuring Launchd tasks as opposed to writing the Plist files manually.

It is worth noting that this really should not be used as a backup strategy, as there is no easy way to restore an iPhoto library from Flickr. I use [CrashPlan](https://www.crashplan.com "CrashPlan") at home for offline backup as well as Time Machine for a local copy, so I do have multiple copies of all my photos (and other files).

## Music ##
 The next biggest chunk of storage is consumed by my music. To be honest I don't get as much opportunity to listen to music as I would like to, and I often find that the music I have on my phone is not the music I am in the mood for. I have a small set (<300 songs) that are in a playlist of music I have chosen to specifically sync, with the rest of my music being derived from two semi smart playlists. The first of these is a proper smart playlist set up in iTunes which gives me 3 hours worth of music that I have not listened to in the last 6 months. 
 
 ![Image](/images/cloud_services/3_Hours_of_Forgotten.png "3 hours of forgotten smart playlist")
 
 The second has not been possible as a smart playlist so I have an AppleScript that creates a playlist of complete albums, adding an album at a time until at least 50 tracks have been added, where at least half the album has not been listened to in the last fortnight. For a while I thought this selection was useful, now I feel that a lot of the music I have not listened to in a long time is just plain rubbish and I should be deleting it from my library. This leaves me in the situation where I have no music on my device that I want to listen to right at that moment in time. 
 
I have been aware of [iTunes Match][1]  since it launched, but never had the inclining to try it. It has came recommended, so I thought this would be a perfect time to try it out. 

![Image](/images/cloud_services/match_in_icloud.jpg "iTunes Match")

Initial impressions of the set up is that is quite temperamental. I have a music library of 19,638 songs according to it, and it took four attempts to complete step 2 in the process (for the first time, more on this later). The steps are:

1. Gathering information about your iTunes library.
2. Matching your music with songs in the iTunes Store.
3. Uploading artwork and remaining songs.

The first few attempts it made to complete this step have had it check varying amounts of the library, before going back to step 1 then redoing step 2 from a point that was before where it had gotten to, but not the start. The first time it got to around the 9k mark, before starting again at 6k. The next time it got as far as 16k before starting back at 9k. Then it got as far as 18k before jumping back to 11k. The final time it stuck just before the end but did finally complete!

![Image](/images/cloud_services/iTunes_match_step2.png "iTunes Match Stuck on Step 2")

What do I get four attempts later? A little over 10k matched with the rest to be uploaded. I had expected more matches, but I do have a lot of mashups in my collection. 

![Image](/images/cloud_services/iTunes_match_step3.png "iTunes Match Uploading")

##This Setup: In Practice##
My iPhone 5s has arrived, and I've been working with this set up for a week or so. I have no regrets about skimping and getting the 16GB version. Neither solution has finished their upload fully (I've not been leaving my machine on), but the results are good so far. 

On the music side: iTunes Match has been flawless on my 5s, but on the 4 it did have the tendency to lock up the device while loading data. The iPhone 4 was on it's last legs so it may not have been directly related to Match. Uploading has been a major pain however: if you stop it, it seems to do the whole process again to check if the unmatched items exist. For the 5k files I still have left this can take up to an hour before it begins uploading again, and it does randomly stop uploading and go back to stage 1 again for some unknown reason.

Accessing photos on Flickr is not something I have really done much of yet, but the upload process has been fairly smooth. My forked version of the script is making progress and will be updated again soon. Looking at the Flickr API while working on this has given me another little side project that should be ready to release shortly. 

[1]: http://www.apple.com/uk/itunes/itunes-match/ "Apple (United Kingdom) - iTunes - Match"
