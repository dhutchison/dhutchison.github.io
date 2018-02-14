---
title: Getting Started With Apache Ivy
series: Learning CDI and Ivy
series_part: 2
categories:
- Development
tags:
- ivy
---

## Introduction

As noted in the introduction to this series, I wanted to learn a bit about how Ivy worked as a dependency management system integrating with Ant. 

The logical starting point here is the [Ivy Tutorial][ivy_tutorial], but there are many broken areas of the Quick Start page which make it difficult to follow. It also heavily relies on just inspecting the sample code available as part of the [Ivy source code][ivy_git], instead of explaining it in any depth as part of the tutorial. 

This and the next part of the series will build up a basic project with a REST service using CDI to inject a cache manager, will all of our code as part of the same module.

<!--more-->

## Getting Ivy


When I started this project, I was just using Visual Studio Code and it's Java plugin to do the coding, so I needed Ant available on the command line. Usually I would be using Ant through the Eclipse IDE. 

As noted in previous posts, I use [Homebrew][homebrew] as a package manager. This includes a package for Ant with Ivy already installed, so installation was as simple as running the following command in a Terminal. 

    brew install ant --with-ivy 

This installs Ant, including the Ivy jar file in the Ant lib directory. 

If you do not wish to modify the Ant lib directly, the ant tasks can be imported using "taskdef" as normal (where "ivy.lib.path" is a path including the Ivy jar files).

    <taskdef resource="org/apache/ivy/ant/antlib.xml" uri="antlib:org.apache.ivy.ant" classpathref="ivy.lib.path"/> 


## The Basics - Declaring and Retrieving Dependencies

For our simple project, we are only concerned with retrieving dependencies using Ivy. 

The main configuration file required to use Ivy is an [Ivy file][ivy_files]. This is usually called "ivy.xml", and is a module descriptor file. This file shares a lot of similarities in purpose with Maven's POM files - it defines information like the dependencies for the module, as well as its name and version. However it differs in function from a POM file by not including any build lifecycle process - as that task is still performed by Ant. 

A basic "ivy.xml" file defining 3 dependencies is shown below. 

    <ivy-module version="2.0">
        <info organisation="com.devwithimagination" module="hello-ivy"/>
        <dependencies>
            <dependency org="javax.cache" name="cache-api" rev="1.1.0"/>
            <dependency org="javax.enterprise" name="cdi-api" rev="2.0"/>
            <dependency org="javax.inject" name="javax.inject" rev="1"/>
        </dependencies>
    </ivy-module>

The structure of a dependency definition is similar to that used in a POM, so it is fairly easy to port a dependency definition. The [maven central repository][maven_search] artifact details however also includes the format for Ivy as well as a few other dependency management systems. 

    <!-- Ivy Definition -->
    <dependency org="javax.cache" name="cache-api" rev="1.1.0"/>
    
    <!-- Maven Definition -->
    <dependency>`
        <groupId>javax.cache</groupId>`
        <artifactId>cache-api</artifactId>`
        <version>1.1.0</version>`
    </dependency>`


In order to resolve dependencies, we need an Ant target which our build target can depend on. 

    <project name="test" xmlns:ivy="antlib:org.apache.ivy.ant">
    
        <property name="ivy.file" value="${basedir}/ivy.xml"/>
        <property name="lib.dir" value="${basedir}/lib"/>
    
        <target name="resolve" depends="clean-lib" description="--> resolve and retrieve dependencies with ivy">

            <!-- the call to resolve is not mandatory, retrieve makes an implicit call if we don't -->
            <ivy:resolve file="${ivy.file}"/>
            <!-- If there are dependencies, this will create lib.dir if it does not already exist -->
            <ivy:retrieve pattern="${lib.dir}/[artifact]-[type]-[revision].[ext]" />
        </target>
    
    </project>

So what does this do? This defines a property "ivy.file" which details the file to read for the ivy project configuration, and a property "lib.dir" defining where our resolved libraries will be stored in the context of this project. Then it will read our "ivy.xml" file and download any defined dependencies in to our lib dir. 

As the dependencies are saved to this lib folder, we can just use them in paths like any other local filesystem dependency.

    <path id="lib.path">
        <fileset dir="${lib.dir}"/>
    </path>
    <property name="lib.path" refid="lib.path"/>



## Issues Encountered

### Dependency Resolution Errors

When I was trying to perform some testing of the JAX-RS module I was writing I encountered an error while trying to resolve the JAX-RS-API dependency. 

    [ivy:resolve] :: problems summary ::
    [ivy:resolve] :::: WARNINGS
    [ivy:resolve]           [FAILED     ] javax.ws.rs#javax.ws.rs-api;2.1!javax.ws.rs-api.${packaging.type}:  (0ms)
    [ivy:resolve]   ==== shared: tried
    [ivy:resolve]     /Users/david/Development/Local Projects/cdi-test/modules/jax-rs-standalone-example/repository/shared/javax.ws.rs/javax.ws.rs-api/2.1/${packaging.type}s/javax.ws.rs-api.${packaging.type}
    [ivy:resolve]   ==== public: tried
    [ivy:resolve]     https://repo1.maven.org/maven2/javax/ws/rs/javax.ws.rs-api/2.1/javax.ws.rs-api-2.1.${packaging.type}
    [ivy:resolve]           ::::::::::::::::::::::::::::::::::::::::::::::
    [ivy:resolve]           ::              FAILED DOWNLOADS            ::
    [ivy:resolve]           :: ^ see resolution messages for details  ^ ::
    [ivy:resolve]           ::::::::::::::::::::::::::::::::::::::::::::::
    [ivy:resolve]           :: javax.ws.rs#javax.ws.rs-api;2.1!javax.ws.rs-api.${packaging.type}
    [ivy:resolve]           ::::::::::::::::::::::::::::::::::::::::::::::
    [ivy:resolve]
    [ivy:resolve] :: USE VERBOSE OR DEBUG MESSAGE LEVEL FOR MORE DETAILS

The thing that stands out in this error is the URL it attempted to connect to: `https://repo1.maven.org/maven2/javax/ws/rs/javax.ws.rs-api/2.1/javax.ws.rs-api-2.1.${packaging.type}`. There is an unresolved variable where the file extension should be. 

Usually a Maven POM file will define a "packaging" attribute to specify the type of artefact produced by the module, but if it is missing from the module then "jar" is used as a the default. In this module, it is defined in the POM file as `<packaging>${packaging.type}</packaging>`. It appears that Ivy does not currently support this. I could not find any documentation defining what the expected behaviour of this should be. 

There have been various issues raised against the JAX-RS API project on GitHub, including a [pull request][jaxrs_pr], but the maintainers seem fairly set in their ways that Maven supports this so it shouldn't be changed, even if other build systems are still broken. 

At this point the only workaround is to run ant with a system property defining the value to use.

    ant -Dpackaging.type=jar 


### Multiple artifacts of the module XXX are retrieved to the same file

    BUILD FAILED
    /Users/david/Development/Local Projects/cdi-test/common/common-include.xml:29: impossible to ivy retrieve:java.lang.RuntimeException: problem during retrieve of com.devwithimagination#jax-rs-standalone-example: java.lang.RuntimeException: Multiple artifacts of the module org.glassfish.jersey.core#jersey-server;2.26 are retrievedto the same file! Update the retrieve pattern  to fix this error.
            at org.apache.ivy.core.retrieve.RetrieveEngine.retrieve(RetrieveEngine.java:249)
            at org.apache.ivy.Ivy.retrieve(Ivy.java:561)
            at org.apache.ivy.ant.IvyRetrieve.doExecute(IvyRetrieve.java:98)
            at org.apache.ivy.ant.IvyTask.execute(IvyTask.java:271)
            (rest of the error ommitted)

While the fix of this is quite simple, as found in this [Stack Overflow Question][so_multiple], it was a bit surprising to see that the sample build files from the Ivy tutorials would not be configured to handle this situation already. 

We needed to change the retrieval part of our build file.

    <!-- Old version -->
    <!--
    <ivy:retrieve pattern="${lib.dir}/[artifact].[ext]"/>
    -->
    <!-- New Version -->
    <ivy:retrieve pattern="${lib.dir}/[artifact]-[type]-[revision].[ext]" />

The important part of the change is adding in the "type" property. "revision" is included so the artifacts retrieved include their version numbers in the file name (a personal preference based on historical issues with dependencies not including version information in their Manifest files). 

## Next?

This was just a very basic example of resolving dependencies. Much more complicated setups are available, including creating dependency groups, and of course we have not touched the publishing features of Ivy. 

The code for this part of the series, and the next, is available on GitHub [here][jax-rs-standalone-example-code].

In the next part of this series, we will look at the CDI `@Produces` annotation, and start looking at injection.

[homebrew]: https://brew.sh "Homebrew — The missing package manager for macOS"
[jaxrs_pr]: https://github.com/jax-rs/api/pull/576 "FIX - packaging.type property is breaking various build systems (sbt, gradle, ivy, etc.) by Randgalt - Pull Request #576 - jax-rs/api"
[so_multiple]: https://stackoverflow.com/questions/7283757/how-do-i-solve-multiple-artifacts-of-the-module-x-are-retrieved-to-the-same-file/7284005 "java - How do I solve Multiple artifacts of the module X are retrieved to the same file in Apache Ivy? - Stack Overflow"
[ivy_tutorial]: http://ant.apache.org/ivy/history/latest-milestone/tutorial.html  "Tutorials | Apache Ivy"
[ivy_git]: https://git-wip-us.apache.org/repos/asf/ant-ivy.git "ASF Git Repos - ant-ivy.git/summary"
[ivy_files]: http://ant.apache.org/ivy/history/latest-milestone/ivyfile.html "Ivy Files | Apache Ivy"
[maven_search]: http://search.maven.org "The Central Repository Search Engine"
[jax-rs-standalone-example-code]: https://github.com/dhutchison/DWI/tree/master/CDI-Learning-Project/modules/jax-rs-standalone-example "GitHub: DWI/CDI-Learning-Project/modules/jax-rs-standalone-example"