---
layout: post
title: Pythonista Dropbox Sync
comments: true
category: Development
tags:
- python
- pythonista
image: /images/pythonista_ipad-t.jpg
header_image: '![Pythonista Logo](/images/pythonista_ipad-p.png "Pythonista Icon")'
date: 2014-05-11 21:19
slug: pythonista-dropbox-sync
---
Continuing on from [my last post][lastpost], I have been delving into Python using [Pythonista][pythonista_itunes]. Syncing scripts between platforms is not as simple as it could be, but now I have a solution. It is not perfect, but it does the job for me and it is developed in Python!

<!--more-->

## NewFromGist.py

Before we get on to the main script, there is this script that is useful for importing scripts into the application that have been shared by others, assuming the script is available as a [Gist][gist].

This is a fork of a [script][newfromgist_orig] by the application author, Ole Zorn. I have only made a couple of modifications to it:

1. Changed to handle the format of gist URLs that contain the author
2. Added support for the URL of the Gist to be supplied via an argument.

I wanted the ability to supply an argument so I could launch this script as a bookmarklet in Chrome, which switches to Pythonista and downloads the new script.

My bookmarklet is just:

`javascript:window.location='pythonista://NewFromGist.py?action=run&argv='+ encodeURIComponent(location.href)`

{% highlight python linenos %}
### Based on: https://gist.github.com/b0644f5ed1d94bd32805
### This version strips unicode characters from the downloaded script
### to work around the currently limited unicode support of the editor
### module.

# This script downloads and opens a Gist from a URL in the clipboard.
# It's meant to be put in the editor's actions menu.
#
# It works with "raw" and "web" gist URLs, but not with gists that
# contain multiple files or non-Python files.
#
# If a file already exists, a dialog is shown that asks whether the
# new file should be renamed automatically.

import clipboard
import editor
import console
import re
import os
import sys

class InvalidGistURLError (Exception): pass
class MultipleFilesInGistError (Exception): pass
class NoFilesInGistError (Exception): pass
class GistDownloadError (Exception): pass

def download_gist(gist_url):
  # Returns a 2-tuple of filename and content
  # console.show_activity()
  raw_match = re.match('http(s?)://raw.github.com/gist/', gist_url)
  if raw_match:
    import requests
    from urlparse import urlparse
    filename = os.path.split(urlparse(gist_url).path)[1]
    try:
      r = requests.get(gist_url)
      content = r.text
      return filename, content
    except:
      raise GistDownloadError()
  else:
    gist_id_match = re.match('http(s?)://gist.github.com/([0-9A-Za-z]*/){0,1}([0-9a-f]*)', gist_url)
    if gist_id_match:
      import requests
      gist_id = gist_id_match.group(3)
      json_url = 'https://api.github.com/gists/' + gist_id
      try:
        import json
        gist_json = requests.get(json_url).text
        gist_info = json.loads(gist_json)
        files = gist_info['files']
      except:
        raise GistDownloadError()
      py_files = []
      for file_info in files.values():
        lang =  file_info.get('language', None)
        if lang != 'Python':
          continue
        py_files.append(file_info)
      if len(py_files) > 1:
        raise MultipleFilesInGistError()
      elif len(py_files) == 0:
        raise NoFilesInGistError()
      else:
        file_info = py_files[0]
        filename = file_info['filename']
        content = file_info['content']
        return filename, content
    else:
      raise InvalidGistURLError()

def main():

  try:
    gist_url = sys.argv[1]
  except IndexError:
    gist_url = clipboard.get()

  try:
    filename, content = download_gist(gist_url)
    content = content.encode('ascii', 'ignore')
    if os.path.isfile(filename):
      i = console.alert('File exists', 'A file with the name ' + filename +
                        ' already exists in your library.',
                        'Auto Rename')
      if i == 1:
        editor.make_new_file(filename, content)
    else:
      editor.make_new_file(filename, content)
  except InvalidGistURLError:
    console.alert('No Gist URL',
                  'The clipboard doesn\'t seem to contain a valid Gist URL.',
                  'OK')
  except MultipleFilesInGistError:
    console.alert('Multiple Files', 'This Gist contains multiple ' +
                  'Python files, which isn\'t currently supported.')
  except NoFilesInGistError:
    console.alert('No Python Files', 'This Gist contains no Python files.')
  except GistDownloadError:
    console.alert('Error', 'The Gist could not be downloaded.')

if __name__ == '__main__':
  main()
{% endhighlight %}

This script is also [available as a gist][newfromgist_gist].

## DropboxSync.py

Now on to the script that I've spent quite a bit of time developing. I feel this has given me a reasonably complex problem to develop my knowledge of Python with.

As in my [previous post][lastpost], this script requires a [Dropbox API key][dropbox_create_app]. This will attempt to sync all the scripts in the Pythonista application with Dropbox. This performs two way sync, and keeps a state file to maintain what revision of a file is held locally.

This uses the Dropbox API in the way that should maintain versions of files, so you should be able to restore previous versions of scripts if needed.

**Standard disclaimer applies:** ***Make sure you have recent copies of any scripts, sync is hard. Bugs happen. This has been tested for my purposes, but there may be some edge cases that it does not handle.***

The latest version of this script is available [on github][gh_script].

{% highlight python linenos %}
import webbrowser, os, pprint
import dropbox
import hashlib
import json
import difflib
import sys

# Configuration
TOKEN_FILENAME = 'PythonistaDropbox.token'
# Get your app key and secret from the Dropbox developer website
APP_KEY = '<app key>'
APP_SECRET = '<app secret>'

# ACCESS_TYPE can be 'dropbox' or 'app_folder' as configured for your app
ACCESS_TYPE = 'app_folder'

# Program, do not edit from here
VERBOSE_LOGGING = False

PYTHONISTA_DOC_DIR = os.path.expanduser('~/Documents')
SYNC_STATE_FOLDER = os.path.join(PYTHONISTA_DOC_DIR, 'dropbox_sync')
TOKEN_FILEPATH = os.path.join(SYNC_STATE_FOLDER, TOKEN_FILENAME)

pp = pprint.PrettyPrinter(indent=4)

# Method to get the MD5 Hash of the file with the supplied file name.
def getHash(file_name):
  # Open,close, read file and calculate MD5 on its contents
  with open(file_name) as file_to_check:
    # read contents of the file
    data = file_to_check.read()
    # pipe contents of the file through
    file_hash = hashlib.md5(data).hexdigest()
  return file_hash

# Method to configure the supplied dropbox session.
# This will use cached OAUTH credentials if they have been stored, otherwise the
# user will be put through the Dropbox authentication process.
def configure_token(dropbox_session):
  if os.path.exists(TOKEN_FILEPATH):
    token_file = open(TOKEN_FILEPATH)
    token_key, token_secret = token_file.read().split('|')
    token_file.close()
    dropbox_session.set_token(token_key,token_secret)
  else:
    setup_new_auth_token(dropbox_session)
  pass

# Method to set up a new Dropbox OAUTH token.
# This will take the user through the required steps to authenticate.
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

def upload(file, details, client, parent_revision):
  print "Trying to upload %s" % file
  details['md5hash'] = getHash(file)
  print "New MD5 hash: %s" % details['md5hash']

  response = client.put_file(file, open(file, 'r'), False, parent_revision)
  #print "Response: %s" % response
  details = update_file_details(details, response)

  print "File %s uploaded to Dropbox" % file

  return details

def download(dest_path, dropbox_metadata, details, client):
  out = open(dest_path, 'w')
  file_content = client.get_file(dropbox_metadata['path']).read()
  out.write(file_content)

  details['md5hash'] = getHash(dest_path)
  print "New MD5 hash: %s" % details['md5hash']
  details = update_file_details(details, dropbox_metadata)

  return details

def process_folder(client, dropbox_dir, file_details):

  # Get the metadata for the directory being processed (dropbox_dir).
  # If the directory does not exist on Dropbox it will be created.
  try:
    folder_metadata = client.metadata(dropbox_dir)

    if VERBOSE_LOGGING == True:
      print "metadata"
      pp.pprint(folder_metadata)
  except dropbox.rest.ErrorResponse as error:
    pp.pprint(error.status)
    if error.status == 404:
      client.file_create_folder(dropbox_dir)
      folder_metadata = client.metadata(dropbox_dir)
    else:
      pp.pprint(error)
      raise error

  # If the directory does not exist locally, create it.
  local_folder = os.path.join(PYTHONISTA_DOC_DIR, dropbox_dir[1:])
  if not os.path.exists(local_folder):
    os.mkdir(local_folder)


  # All the files that have been processed so far in this folder.
  processed_files = []
  # All the directories that exist on Dropbox in the current folder that need to be processed.
  dropbox_dirs = []
  # All the local directories in this current folder that do not exist in Dropbox.
  local_dirs = []

  # Go through the files currently in Dropbox and compare with local
  for file in folder_metadata['contents']:
    dropbox_path = file['path'][1:]
    file_name = file['path'].split('/')[-1]
    if file['is_dir'] == False and file['mime_type'].endswith('python'):

      if not os.path.exists(os.path.join(PYTHONISTA_DOC_DIR, dropbox_path)):
        print "Processing Dropbox file %s (%s)" % (file['path'], dropbox_path)
        try:


          if dropbox_path in file_details:
            # in cache but file no longer locally exists
            details = file_details[dropbox_path]

            print "File %s is in the sync cache and on Dropbox, but no longer exists locally. [Delete From Dropbox (del)|Download File (d)] (Default Delete)" % file['path']

            choice = raw_input()
            if (choice == 'd'):
              download_file = True
            else:
              # Default is 'del'
              download_file = False

              #delete the dropbox copy
              client.file_delete(file['path'])
              file_details.remove(dropbox_path)

          else:
            details = {}
            download_file = True

          if (download_file ==  True):
            print "Downloading file %s (%s)" % (file['path'], dropbox_path)
            if VERBOSE_LOGGING == True:
              print details

            details = download(dropbox_path, file, details, client)
            file_details[dropbox_path] = details

          # dealt with this file, don't want to touch it again later
          processed_files.append(file_name)
          write_sync_state(file_details)

        except:
          pass
      else:
        # need to check if we should update this file
        # is this file in our map?
        if dropbox_path in file_details:
          details = file_details[dropbox_path]

          if VERBOSE_LOGGING == True:
            print "Held details are: %s" % details

          if details['revision'] == file['revision']:
            # same revision
            current_hash = getHash(dropbox_path)

            if VERBOSE_LOGGING == True:
              print 'New hash: %s, Old hash: %s' % (current_hash, details['md5hash'])

            if current_hash == details['md5hash']:
              print 'File "%s" not changed.' % dropbox_path
            else:
              print 'File "%s" updated locally, uploading...' % dropbox_path

              details = upload(dropbox_path, details, client, file['rev'])
              file_details[dropbox_path] = details

            processed_files.append(file_name)
          else:
            #different revision
            print 'Revision of "%s" changed from %s to %s. ' % (dropbox_path, details['revision'], file['revision'])

            current_hash = getHash(dropbox_path)

            if VERBOSE_LOGGING == True:
              print 'File %s. New hash: %s, Old hash: %s' % (dropbox_path, current_hash, details['md5hash'])

            if current_hash == details['md5hash']:
              print 'File "%s" updated remotely. Downloading...' % dropbox_path

              details = download(dropbox_path, file, details, client)
              file_details[dropbox_path] = details
            else:
              print "File %s has been updated both locally and on Dropbox. Overwrite [Dropbox Copy (d)|Local Copy (l)| Skip(n)] (Default Skip)" % file['path']
              choice = raw_input()

              if choice == 'd' or choice == 'D':
                print "Overwriting Dropbox Copy of %s" % file
                details = upload(dropbox_path, details, client, file['rev'])
                file_details[dropbox_path] = details
              elif choice == 'l' or choice == 'L':
                print "Overwriting Local Copy of %s" % file
                details = download(dropbox_path, file, details, client)
                file_details[dropbox_path] = details


        else:
          # Not in cache, but exists on dropbox and local, need to prompt user

          print "File %s is not in the sync cache but exists both locally and on dropbox. Overwrite [Dropbox Copy (d)|Local Copy (l) | Skip(n)] (Default Skip)" % file['path']
          choice = raw_input()

          details = {}
          if choice == 'd' or choice == 'D':
            print "Overwriting Dropbox Copy of %s" % file
            details = upload(dropbox_path, details, client, file['rev'])
            file_details[dropbox_path] = details
          elif choice == 'l' or choice == 'L':
            print "Overwriting Local Copy of %s" % file
            details = download(dropbox_path, file, details, client)
            file_details[dropbox_path] = details
          else:
            print "Skipping processing for file %s" % file

        # Finished dealing with this file, update the sync state and mark this file as processed.
        write_sync_state(file_details)
        processed_files.append(file_name)
    elif file['is_dir'] == True:
      dropbox_dirs.append(file['path'])


  # go through the files that are local but not on Dropbox, upload these.
  files = os.listdir(local_folder)
  for file in files:

    full_path = os.path.join(local_folder, file)
    relative_path = os.path.relpath(full_path)
    db_path = '/'+relative_path

    if not file in processed_files and not os.path.isdir(file) and not file.startswith('.') and file.endswith('.py'):

      if VERBOSE_LOGGING == True:
        print 'Searching "%s" for "%s"' % (dropbox_dir, file)
      found = client.search(dropbox_dir, file)

      if found:
        print "File found on Dropbox, this shouldn't happen! Skipping %s..." % file
      else:
        if VERBOSE_LOGGING == True:
          pp.pprint(file)

        if file in file_details:
          details = file_details[file]
        else:
          details = {}
        print details

        details = upload(relative_path, details, client, None )
        file_details[relative_path] = details
        write_sync_state(file_details)

    elif not db_path in dropbox_dirs and os.path.isdir(file) and not file.startswith('.') and not file == SYNC_STATE_FOLDER:
      local_dirs.append(db_path)


  #process the directories
  for folder in dropbox_dirs:
    if VERBOSE_LOGGING == True:
      print 'Processing dropbox dir %s from %s' % (folder, dropbox_dir)
    process_folder(client, folder, file_details)

  for folder in local_dirs:
    if VERBOSE_LOGGING == True:
      print 'Processing local dir %s from %s' % (folder, dropbox_dir)
    process_folder(client, folder, file_details)

def update_file_details(file_details, dropbox_metadata):
  file_details['revision'] = dropbox_metadata['revision']
  file_details['rev'] = dropbox_metadata['rev']
  file_details['modified'] = dropbox_metadata['modified']
  file_details['path'] = dropbox_metadata['path']
  return file_details

def write_sync_state(file_details):
  # Write sync state file
  sync_status_file = os.path.join(SYNC_STATE_FOLDER, 'file.cache.txt')

  if VERBOSE_LOGGING:
    print 'Writing sync state to %s' % sync_status_file

  with open(sync_status_file, 'w') as output_file:
    json.dump(file_details, output_file)

def main():

  # Process any supplied arguments
  global VERBOSE_LOGGING
  for argument in sys.argv:
    if argument == '-v':
      VERBOSE_LOGGING = True

  # Load the current sync status file, if it exists.
  sync_status_file = os.path.join(SYNC_STATE_FOLDER, 'file.cache.txt')

  if not os.path.exists(SYNC_STATE_FOLDER):
    os.mkdir(SYNC_STATE_FOLDER)
  if os.path.exists(sync_status_file):
    with open(sync_status_file, 'r') as input_file:
      file_details = json.load(input_file)
  else:
    file_details = {}

  if VERBOSE_LOGGING == True:
    print "File Details: "
    pp.pprint(file_details)

  #configure dropbox
  sess = dropbox.session.DropboxSession(APP_KEY, APP_SECRET, ACCESS_TYPE)
  configure_token(sess)
  client = dropbox.client.DropboxClient(sess)

  print "linked account: %s" % client.account_info()['display_name']
  #pp.pprint (client.account_info())

  process_folder(client, '/', file_details)

  # Write sync state file
  write_sync_state(file_details)


if __name__ == "__main__":
  print 'Begin Dropbox sync'
  main()
  print 'Dropbox sync done!'

{% endhighlight %}

Any feedback on either of these scripts is welcome. I'm just starting to learn Python and it is very different from any language I have tried in the past!

[newfromgist_gist]: https://gist.github.com/dhutchison/8528503 "New from Gist.py "
[gh_script]: https://github.com/dhutchison/PythonistaScripts/blob/master/DropboxSync.py "PythonistaScripts/DropboxSync.py at master · dhutchison/PythonistaScripts "
[gist]: https://gist.github.com/ "Gists "
[dropbox_create_app]: https://www.dropbox.com/developers/apps "App Console - Dropbox "
[lastpost]: http://dev-lamp.local/2014/05/06/downloading-files-with-pythonista/ "Downloading files with Pythonista"
[pythonista_itunes]: https://itunes.apple.com/gb/app/pythonista/id528579881?mt=8&uo=4&at=10lsY7 "Pythonista on iOS App Store"
[newfromgist_orig]: https://gist.github.com/omz/4076735 "New from Gist "
