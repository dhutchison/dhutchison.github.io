---
title: Introducing sonar-alloweddependencies-plugin
summary: I wrote a basic SonarQube plugin to support restricting to a known set of
  allowed dependencies
series: Software Dependency Lifecycle
series_part: 5
categories:
- Development
tags:
- sdlc
- sonarqube
date: 2021-04-09 00:23
slug: introducing-sonar-alloweddependencies-plugin
---
Around a year ago I published [part 2][nexus-post] of this series, providing an approach for restricting the dependencies which could be downloaded through a [Nexus][nexus] repository server. 

One struggle that became obvious when trying to implement this approach at scale is that you are required to approve all the transitive dependencies down the chain too. NPM projects especially become unreasonable to maintain quickly. As an example one of [my pretty basic Homebridge plugins][homebridge-ebeco] has a total of 15 dependencies between `dependencies` and `devDependencies` - after deduplication the dependency tree has more than 800 items. That is not maintainable through Nexus content selectors.

A different approach, which does not prevent downloading, is to integrate checks into the code quality analysis performed by [SonarQube][sonarqube]. There are no rules built in to do this though, so a custom plugin was required. 

<!--more-->

## The Plugin

I have created an initial implementation of a plugin which provides this functionality: [sonar-alloweddependencies-plugin][plugin-github].

This exposes a number of new rules, detailed in the project readme, and is only concerned with dependencies which are referenced in the project directly. It performs no checks against transitive dependencies. This supports both Maven `pom.xml` and NPM `package.json` dependency descriptors, and supports providing different dependency lists for different scopes (e.g. test and main). 

Once a rule is enabled and configured with an approved list of dependencies, this will create issues if a dependency is used that is not in the allowed list. 

![Example Maven Violations][maven-violations-image]
![Example NPM Violations][npm-violations-image]




## Releases 

Releases of this are published to GitHub Packages only at this point, so are accessible from the [GitHub project page][plugin-github]. I have not yet went through the validation process to get setup for Maven Central. Note that there are published versions for both snapshots and main releases. 

## Feedback

If you hit any issues, have suggested improvements, or even want to contribute then please raise an issue on the [GitHub page][plugin-github]. I still have some changes I want to make to this, but the latest non-snapshot release is usable. 

[nexus-post]: /2020/03/12/restricting-software-libraries-in-nexus/ "Restricting Software Libraries in Nexus"

[nexus]: https://www.sonatype.com/nexus-repository-oss "Nexus Repository OSS - Software Component Management - Sonatype"

[sonarqube]: https://www.sonarqube.org " Code Quality and Code Security - SonarQube"

[plugin-github]: https://github.com/dhutchison/sonar-alloweddependencies-plugin "dhutchison/sonar-alloweddependencies-plugin: Sonarqube plugin for comparing declared dependencies against an approved list"

[homebridge-ebeco]: https://github.com/dhutchison/homebridge-ebeco "dhutchison/homebridge-ebeco: Homebridge plugin for Ebeco Thermostats"

[maven-violations-image]: /images/sonarqube_plugin/maven-violation.png "Example of a violation for a maven pom"
[npm-violations-image]: /images/sonarqube_plugin/npm-violation.png "Example of a violation for an NPM package.json"
