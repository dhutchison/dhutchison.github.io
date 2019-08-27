---
title: Publishing to Nexus
layout: post
series: A look in to MicroProfile
series_part: 2
categories:
- Development
tags:
- Maven
summary: How to specify Maven servers for deployment without distributionManagement.
date: 2019-08-27 21:53
slug: publishing-to-nexus
---
I have a [Nexus 3][nexus_oss] server running on my internal network which I was using for testing some performance related things, which were relying on the Payara Micro feature that enables it to [deploy artifacts from Maven coordinates][payara_micro_deploy_maven] directly. 

What I wanted to do was to have my local machine know where to publish build artifacts, but not have the details of this server published in the publicly available pom file as it is not relevant to anyone except myself. Usually the server URLs are stored in the [distributionManagement][pom_distribution_management] section of the POM file. 

<!--more-->

The logical place for this to be is in the user [settings.xml][maven_settings] file, but if you look at the definition for `Servers` here, there is no option to include the URL for the server. 

The solution to this lies in the fact there are [command line options][maven_command_line_deploy] which can be supplied to the deploy plugin to specify an alternative server. These can be defined in the properties for a profile in settings.xml.

Included here is my settings.xml file, with private values replaced. Also in this configuration are the settings to always use my nexus instance as a mirror for all Maven requests. 

~~~ xml
<settings>
  <mirrors>
    <mirror>
      <!--This sends everything else to /public -->
      <id>nexus</id>
      <mirrorOf>*</mirrorOf>
      <url>https://my-nexus-server.example.com/repository/maven-public/</url>
    </mirror>
  </mirrors>
  <profiles>
    <profile>
      <id>nexus</id>
      <!--Enable snapshots for the built in central repo to direct -->
      <!--all requests to nexus via the mirror -->
      <repositories>
        <repository>
          <id>central</id>
          <url>http://central</url>
          <releases><enabled>true</enabled></releases>
          <snapshots><enabled>true</enabled></snapshots>
        </repository>
      </repositories>
     <pluginRepositories>
        <pluginRepository>
          <id>central</id>
          <url>http://central</url>
          <releases><enabled>true</enabled></releases>
          <snapshots><enabled>true</enabled></snapshots>
        </pluginRepository>
      </pluginRepositories>
      <!--Configure repositories so they don't need to go in the pom file-->
      <properties>
        <altSnapshotDeploymentRepository>nexus::default::https://my-nexus-server.example.com/repository/maven-snapshots/</altSnapshotDeploymentRepository>
        <altReleaseDeploymentRepository>nexus::default::https://my-nexus-server.example.com/repository/maven-releases/</altReleaseDeploymentRepository>
      </properties>
    </profile>
  </profiles>
  <activeProfiles>
    <!--make the profile active all the time -->
    <activeProfile>nexus</activeProfile>
  </activeProfiles>

  <servers>
    <server>
      <id>nexus</id>
      <username>admin</username>
      <password>the-super-secure-password</password>
    </server>
  </servers>
</settings>
~~~

Note that prior to version 2.8 of the maven-deploy-plugin the only option available was "altDeploymentRepository". This did not provide the flexibility to distinguish between the repository where snapshot and final releases would be published to. 

By default my project was using version 2.7 of this plugin, so I had to update the pom.xml to include the newer plugin version. 

~~~ xml
<plugins>
    ...
    <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-deploy-plugin</artifactId>
        <version>2.8.2</version>
    </plugin>
    ...
</plugins>
~~~

With this in place, running `mvn deploy` will pick up the alternative deployment location and deploy the build artifacts. 

~~~
...
[INFO] --- maven-deploy-plugin:2.8.2:deploy (default-deploy) @ experiments ---
[INFO] Using alternate deployment repository nexus::default::https://my-nexus-server.example.com/repository/maven-snapshots/

(Cut lots of logging)

Uploaded to nexus: https://my-nexus-server.example.com/repository/maven-snapshots/com/devwithimagination/microprofile/experiments/0.3-SNAPSHOT/maven-metadata.xml (1.0 kB at 11 kB/s)
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  46.515 s
[INFO] Finished at: 2019-08-27T21:39:14+01:00
[INFO] ------------------------------------------------------------------------
~~~


[maven_settings]: https://maven.apache.org/settings.html "Settings Reference"
[maven_command_line_deploy]: http://maven.apache.org/plugins-archives/maven-deploy-plugin-LATEST/deploy-mojo.html "Apache Maven Deploy Plugin – deploy:deploy"
[pom_distribution_management]: https://maven.apache.org/pom.html#Distribution_Management "Maven – POM Reference - Distribution Management"
[payara_micro_deploy_maven]: https://blog.payara.fish/did-you-know-payara-micro-allows-deploying-from-maven "Did You Know? Payara Micro Allows Deploying Directly from Maven Central!"
[nexus_oss]: https://www.sonatype.com/nexus-repository-oss "Nexus Repository OSS - Software Component Management | Sonatype"
