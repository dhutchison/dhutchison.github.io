---
title: Publishing a Compodoc Site to Nexus
summary: Publishing a Compodoc site to a Raw repository in Sonatype Nexus
categories:
- Development
tags:
- compodoc
- nexus
date: 2020-05-27 23:24
slug: publishing-a-compodoc-site-to-nexus
---
Recently I have been looking at [Compodoc][compodoc] for generating documentation sites for Angular projects. Some of these projects are for libraries that will be reused elsewhere, so this documentation requires to be published somewhere.

The libraries are published as NPM modules to a [Sonatype Nexus][nexus] instance, so it would be ideal if the documentation could be published to the same place. 

<!--more-->

Nexus has a [Raw Repository][raw-repo] type which can be used for hosting static websites. The linked page includes details of how to configure a repository, how to publish to it from Maven, and using `curl` to upload single files using HTTP requests.  

Based on this `curl` approach I have put together a bash script below that:
* has a number of configuration options for the user, nexus server, repository name, and documentation directory to upload
* prompts for the password for the user to use
* uses the git repository name as a subdirectory to store items in within the nexus repository, so that the same nexus repository could be used as a central location for generated documentation for multiple projects
* iterates through every file in the configured documentation directory and uploads it to nexus

Once this script runs, you will be able to see the contents of the site in the browse view for the repository.

![Repository browse view][nexus_browse]

Clicking on the `index.html` file will show the details, including the direct path to the artefact. 

![Index details][nexus_detail]

This will be the URL that your documentation site will be available at. The script below assumes there will be an `index.html` file and outputs the direct URL to this resource. 

~~~ bash
#!/bin/bash

# Configure username to use. The password will be prompted for later.
USER=admin

# The URL for the Nexus server
NEXUS_SERVER=https://nexus.example.com
# The name of the raw repository
REPOSITORY_NAME=documentation
# Each project will have its own directory based on the git repository name
GIT_REPO_NAME=$(basename -s .git $(git config --get remote.origin.url))

# Make our base Nexus repository directory URL
DEST_REPO_DIRECTORY="${NEXUS_SERVER}/repository/${REPOSITORY_NAME}/${GIT_REPO_NAME}"

# The directory to get the contents of to upload
LOCAL_DOCS=./documentation

# Prompt for the user password to use
read -s -p "Password for $USER: " PASS

# Find all the files in the directory and upload them. 
# This may have issues if you had spaces in filenames, but 
# generated documentation produced by compodoc doesn't

for file in $(find "$LOCAL_DOCS" -type f -print); do

    # Need to trim the local documentation directory part off the string
    destination_file="${file/$LOCAL_DOCS/}"
    
    # Upload the file
    # This uses verbose logging, you will want to reduce the logging here
    # if using this in a production environment
    curl -v --user "${USER}:${PASS}" --upload-file "$file" "${DEST_REPO_DIRECTORY}${destination_file}"

done


echo "If no errors were reported above, your documentation site will be available at ${DEST_REPO_DIRECTORY}/index.html"


~~~

[nexus_browse]: /images/compodoc_publish/browse_view.png "Repository browse view showing generated site files"
[nexus_detail]: /images/compodoc_publish/index_details.png "Details of the index.html file including the resource path"

[compodoc]: https://compodoc.app "Compodoc - The missing documentation tool for your Angular application"

[nexus]: https://www.sonatype.com/nexus-repository-oss "Nexus Repository OSS - Software Component Management - Sonatype"

[raw-repo]: https://help.sonatype.com/repomanager3/formats/raw-repositories "Raw Repositories"
[upload_raw]: https://help.sonatype.com/repomanager3/formats/raw-repositories#RawRepositories-UploadingFilestoHostedRawRepositories "Uploading Files to Hosted Raw Repositories"
