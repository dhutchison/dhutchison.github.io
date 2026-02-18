---
title: Video Transcode Container and Jenkins Docker Agents
series: Jenkins Configuration-as-Code
series_part: 2
summary: |
  Continuing on from my last post about Configuration as Code in Jenkins, this goes in to a bit more detail on how I've configured ephemeral docker-based Jenkins agents (and the container it runs for my transcoding workflow).
tags:
- jenkins
- docker
- transcode-video
date: 2026-02-18 21:52
slug: video-transcode-container-and-jenkins-docker-agents
---
In the last part I went in to some of the difficulties I'd encountered with attempting to get a Jenkins pipeline to import and run, as well as what I'm trying to achieve with this new Jenkins instance setup.

In this part I'll go a little in to how the pipeline instances are running the [transcode-video][video_transcoding] tool itself.

## The Setup

To run the `transcode-video` tool from our pipeline, it needs to be available to our Jenkins Docker instance.

To quote the Jenkins [documentation on container isolation][jenkins-isolation-docs]:

> Out of the box, Jenkins is set up to run builds on the built-in node. This is to make it easier to get started with Jenkins, but is inadvisable longer term: Any builds running on the built-in node have the same level of access to the controller file system as the Jenkins process.
>
> It is therefore highly advisable to not run any builds on the built-in node, instead using agents (statically configured or provided by clouds) to run builds.

What I wanted to do was use a Docker image that contains the tools we need for this type of build, and configure it to be used as an Agent (ideally that is used "on-demand" and not always running).

<!--more-->

## The Container Image

I could not find an existing published container image containing  the `transcode-video` tool and its dependencies - so I created one - [video_transcoding_docker][github-repo].

It is a pretty basic container which installs the scripts and the required dependencies. I publish two main versions - one with the tool on it's own, and with a Java install. The Java install is  needed so that the container can be used as a Jenkins Agent.

## The Jenkins Agent Definition

The agent configuration in my `00-jenkins.yaml` file as part of my Configuration-as-Code directory has two main parts.

First we disable using the built in node for builds entirely (not strictly required as we will specify an agent for the build, but we want to follow best practices here).

```yaml
jenkins:
  numExecutors: 0
```

Then we specify our local docker host as a "cloud", with our video transcode container as a template configuration we can start up. This requires the [docker-plugin][jenkins-docker-plugin] to be installed first.

```yaml
  clouds:
    - docker:
        name: "docker"
        dockerApi:
          dockerHost:
            uri: "unix:///var/run/docker.sock"
        templates:
          - labelString: "transcode-agent"
            dockerTemplateBase:
              image: "ghcr.io/dhutchison/video_transcoding_docker:2025.01.28-ruby3.4-jdk21"
              mounts:
                - "type=tmpfs,destination=/run"
                - "type=bind,source=/mnt/data-tank/encodes/_input,destination=/data/input"
                - "type=bind,source=/mnt/data-tank/encodes/_output,destination=/data/output"
            remoteFs: "/work"
            connector:
              attach:
                user: "568"
            instanceCapStr: "10"
            retentionStrategy:
              idleMinutes: 1
```

This was based on an [example][demo-docker-agent] from the Configuration as Code plugin repository. There are more advanced examples available like [this][docker-agent-remote-docs] which uses a docker daemon on a remote host.


This configuration includes something that is not exactly normal, but required for my use case here - I bind mount my encoding directory as opposed to working purely with the task workspace. This breaks isolation a little as the pipeline can directly access a filesystem location.


## Using this Agent

Taking us back to the start of the post, now any pipeline can specify their agent to use, and when it is ran a new instance of this container image will be started up and our pipeline steps ran inside of it.

```groovy
pipeline {
    agent {
        label 'transcode-agent'
    }
```

And that's it - we now have Jenkins able to use ephemeral container instances to do our encoding tasks, using a new container image packaging up the required tools.

[video_transcoding]: https://github.com/lisamelton/video_transcoding "GitHub - lisamelton/video_transcoding - Tools to transcode, inspect and convert videos."

[jenkins-isolation-docs]: https://www.jenkins.io/doc/book/security/controller-isolation/#not-building-on-the-built-in-node  "Controller Isolation"
[jenkins-docker-plugin]: https://plugins.jenkins.io/docker-plugin/ "Docker - Jenkins plugin"

[github-repo]: https://github.com/dhutchison/video_transcoding_docker "GitHub - dhutchison/video_transcoding_docker - Docker image for using lisamelton/video_transcoding"

[demo-docker-agent]: https://github.com/jenkinsci/configuration-as-code-plugin/tree/master/demos/docker "configuration-as-code-plugin/demos/docker at master · jenkinsci/configuration-as-code-plugin · GitHub"
[docker-agent-remote-docs]: https://plugins.jenkins.io/docker-plugin/#plugin-content-configuration-as-code-example "Docker | Jenkins plugin"
