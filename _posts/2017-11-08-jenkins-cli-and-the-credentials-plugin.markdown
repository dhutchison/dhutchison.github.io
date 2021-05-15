---
title: Jenkins CLI and the Credentials Plugin
summary: I could not get the CLI commands of the credentials plugin to work - the
  fix was too easy
tags:
- Jenkins
categories:
- Development
date: 2017-11-08 21:55
slug: jenkins-cli-and-the-credentials-plugin
---
A few months ago I was working on a project which involved building an application estate on the AWS platform, with all the infrastructure scripted using CloudFormation. Part of this included a Jenkins server for building and deploying the applications.

This Jenkins instance was an EC2 server, and part of the install process was using the cloud-init definitions to include plugins if they were not already installed, as well as adding the Jenkins jobs themselves. 

One thing I was trying to get working, and failed on, was using the Jenkins CLI to configure the [credentials plugin][credentials_plugin]. Each attempt to run a command would have the same result, a return code of "255" with no errors displayed on the client.

~~~ bash

MacBook:temp dhutchison$ java -jar jenkins-cli.jar -s http://procent.local:8080 -auth jenkinsuser:supersecurepassword list-credentials system::system::jenkins
MacBook:temp dhutchison$ echo $?
255

~~~

I revisited this the other day, and encountered the same issue when using a fresh Jenkins docker image and configuring it through the quick start wizard. After a bit of investigation, the solution to this was frustratingly simple.

<!--more-->

When I tested this on the Docker image this time around, I did see some log statements to indicate there was an issue on the Jenkins server. 


	Nov 07, 2017 9:28:00 PM hudson.init.impl.InstallUncaughtExceptionHandler$1 reportException
	WARNING: null
	org.kohsuke.args4j.IllegalAnnotationError: No OptionHandler is registered to handle class com.cloudbees.plugins.credentials.CredentialsStore
		at org.kohsuke.args4j.OptionHandlerRegistry.createOptionHandler(OptionHandlerRegistry.java:163)
		at org.kohsuke.args4j.CmdLineParser.addArgument(CmdLineParser.java:129)
		at org.kohsuke.args4j.ClassParser.parse(ClassParser.java:38)
		at org.kohsuke.args4j.CmdLineParser.<init>(CmdLineParser.java:93)
		at org.kohsuke.args4j.CmdLineParser.<init>(CmdLineParser.java:68)
		at hudson.cli.CLICommand.getCmdLineParser(CLICommand.java:326)
		at hudson.cli.CLICommand.main(CLICommand.java:254)
		at hudson.cli.CLIAction$PlainCliEndpointResponse$1.run(CLIAction.java:221)


Based on this trace I ended up taking a bit of a deep dive into how Jenkins plugins are registered, and how CLI support as a whole is added. The result of this was that I could understand that for this error to be displayed, Jenkins had to be aware that the "list-credentials" command was valid, but was not able to process the arguments required by the command.

It appears that, even though the plugin worked through the Jenkins web interface, the Jenkins server requires to be restarted before the plugin can be used completely through the CLI. 

So - a simple but non-obvious fix.


[credentials_plugin]: https://github.com/jenkinsci/credentials-plugin/ "jenkinsci/credentials-plugin on GitHub"
