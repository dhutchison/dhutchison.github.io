---
title: Pythonista Dropbox Sync - Revisited
categories: Development
tags:
- pythonista
- python
description: Pythonista Dropbox Sync script has got some much needed updates
date: 2016-06-14 20:34
slug: pythonista-dropbox-sync-revisited
---
As mentioned in my [previous post][prev] the Pythonista Dropbox Sync script has been receiving some improvements as a result of "issues" raised on the [GitHub Project][ghp]. It still has some outstanding issues, but has gained many new features since it was first introduced.

## Run Arguments

Pressing and holding the Play button in Pythonista will result in a prompt dialog being displayed to allow arguments to be supplied to the script.

There are three run arguments which can be supplied to this script to change its behaviour.

1. "-v" turns on FINE level logging in the script
2. "-vv" turns on full DEBUG level logging in the script
3. "-c" runs the advanced configuration phase detailed below.


Arguments are processed from first to last, with later arguments taking precedence where there is any overlap.

## Configuration

The initial version of the script which was published required the user to tweak some variables near the start of the file to hold items such as API tokens. This made updating the script to commit, or pulling a new version problematic.


### First run configuration

When the script is ran without the "&lt;Pythonista Documents&gt;/dropbox_sync/PythonistaDropbox.conf" file existing, a set of first-run configuration prompts are shown. This just covers the basic configuration of the Dropbox authentication token required for the script to function.

### Advanced configuration

Running the script with the "-c" run argument will prompt for input for an advanced set of configuration options. 

These are:

* The file extensions to sync. 
	* The default set are: ".py, .pyui, .txt, .conf". 
	* A special value of "*" can be used to sync all file types.
	* Entered values will be merged with the default options.
* File paths to explicitly skip
	* Multiple paths can be specified by comma separating them.
	* Paths should be relative to the root Pythonista documents folder.


## Going Forward

There are still a few bugs to work out in the script, and a few larger enhancements. I'm hoping to get some time over the next month to tackle them, but all contributions are welcome!

You can contribute using [this GitHub repository][ghp].


[prev]: /2016/05/16/temporarily-abandoned-but-not-forgotten "(Temporarily) Abandoned, but not forgotten"
[ghp]: https://github.com/dhutchison/PythonistaScripts "Pythonista Scripts on GitHub"
