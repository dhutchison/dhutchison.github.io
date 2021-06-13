---
title: Extracting a Maven Artifact Version from the Command Line
category:
- Development
tags:
- maven
summary: How to extract the version number from a maven artifact using commonly available
  CLI tools.
date: 2021-06-13 20:42
slug: extracting-a-maven-artifact-version-from-the-command-line
---
As part of ongoing maintenance and releases to application servers, I needed a quick way to determine the versions of various components to check if they were up to date or not. 

Ideally what I was after was a shell command I could run against one or more components to extract version information, as ultimately this check would likely be run via an SSH session from a central management host. 

This one-liner can do what I needed:

~~~ bash
$ unzip -p component.jar 'META-INF/maven/*/pom.properties' | grep '^version=' | cut -d '=' -f 2
0.1.5-SNAPSHOT
~~~

Note that this may return more than one version number if the component is a fat or shaded jar file. If you at least know some of the `groupId` you can be more specific in the file path to extract the version from. The `pom.properties` file is always located in `META-INF/maven/<groupId>/<artifactId>/pom.properties`.

~~~ bash
unzip -p component.jar 'META-INF/maven/com.devwithimagination*/*/pom.properties'
~~~
