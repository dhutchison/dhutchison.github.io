---
title: Eclipse MicroProfile
layout: post
series: A look in to MicroProfile
series_part: 1
categories:
- Development
tags:
- Java
- MicroProfile
summary: The Eclipse MicroProfile project has been evolving over the last few years,
  but only in the last month or so have I started taking a proper look into it.
date: 2019-08-18 22:40
slug: eclipse-microprofile
---
The [Eclipse MicroProfile][microprofile] project has been evolving over the last few years, but only in the last month or so have I started taking a proper look into it.

The mission of the project is described to provide:

> An open forum to optimize Enterprise Java for a microservices architecture by innovating across multiple implementations and collaborating on common areas of interest with a goal of standardization.
>
> --<cite>[microprofile.io][microprofile]</cite>


The collection of framework specifications which are included in this standard, when used along with JAX-RS, provides the pieces  required to build applications in a modern "microservices" architecture, while leaving behind more legacy aspects (and bloat) of the Java EE specification.


## Starter

For starting with MicroPofile developments a ["starter"][starter] wizard is available to quickly generate Maven projects for your chosen target specification and application server version. One of the options which differentiate this from the traditional Maven archetype approach is it provides options to include sample code for the different specification versions. The README document in the generated project Zip file is a good place to get started as it contains links to the documentation on the different specification areas.


## The Experiment Project	

As well as writing up some details of what I am learning as part of going through this standard, I will be committing the code that I am creating in my [microprofile-experiments][mp-experiments-repo] repository.

For my experiments with MicroProfile, I'll be targeting the latest version of the specification available for Payara Micro at the time of writing (MP 2.2). MicroProfile 3 support is due in Payara [later this month][mp3_payara].

## Next

The first MicroProfile feature I will be delving in to is going to the [MicroProfile Configuration Feature][microprofile-config], and how it can be used with CDI to work with feature toggles. As part of this series there will be posts which are more generally on Maven, as the build system I have the most experience with is [Ant][ant] and I have a lot to learn about how to make the most of Maven. 


[microprofile]: https://microprofile.io "Microprofile – An open forum to optimize Enterprise Java for a microservices architecture by innovating across multiple implementations and collaborating on common areas of interest with a goal of standardization."
[starter]: https://start.microprofile.io "Starter | MicroProfile"
[mp-experiments-repo]: https://github.com/dhutchison/microprofile-experiments "dhutchison/microprofile-experiments on GitHub"
[microprofile-config]: https://microprofile.io/project/eclipse/microprofile-config "MicroProfile Configuration Feature"
[mp3_payara]: https://blog.payara.fish/announcing-the-release-of-eclipse-microprofile-3.0 "Announcing the Release of Eclipse MicroProfile 3.0"
[ant]: https://ant.apache.org "Apache Ant"
