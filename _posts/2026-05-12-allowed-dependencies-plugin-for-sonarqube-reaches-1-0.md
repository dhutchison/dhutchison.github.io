---
title: Allowed Dependencies Plugin for SonarQube Reaches 1.0
categories:
    - Projects
tags:
    - sonarqube
    - sdlc
summary: My plugin for enforcing that project dependencies match an approval list has reached a 1.0 milestone.
date: "2026-05-12 00:00"
slug: allowed-dependencies-plugin-for-sonarqube-reaches-1-0
image:
    path: /images/sonarqube_plugin/allowed-dependencies-1-0-hero.png
    alt: SonarQube issue showing a forbidden left-pad dependency detected in package.json
---
That sounds like a grand milestone, but in reality it’s a major version bump because the plugin is dropping support for the older 9.X versions of SonarQube and using 26.4 as the minimum tested version.

The 0.1.13 version has been stable for nearly a couple of years now, but changes to how languages and rules interact in newer SonarQube versions meant it needed some TLC to get the rules detecting package files correctly again.

This plugin was [first born out of a "short term" need][original-post] to give us a way to enforce that dependencies being used in projects matched our approved items. (Nothing is more permanent than a temporary solution.) With even more focus on the supply chain as an attack vector, it was time to make sure this project remained up to date. It doesn't claim to solve all problems, but it does specifically target unknown dependencies, or multiple dependencies for the same purpose, slipping in without a proper review process first.

Currently the plugin provides rules for NPM `package.json` files and Maven `pom.xml` / `.flattened-pom.xml` files. The allow lists can use exact matches or `regex:` entries, but this is intentionally focused on dependency approval rather than checking licences, vulnerabilities, or version numbers.

You can find all the details of what this provides in the [project README][project-readme], and the full details of this release in the [v1.0.0 release notes][release-notes]. Existing users should note that this release contains breaking changes to consider before upgrading.

A 1.1 release will be coming in the next few weeks and will add support for Python library checking for some common configuration formats.

[project-readme]: https://github.com/dhutchison/sonar-alloweddependencies-plugin "GitHub - dhutchison/sonar-alloweddependencies-plugin: Sonarqube plugin for comparing declared dependencies against an approved list"
[release-notes]: https://github.com/dhutchison/sonar-alloweddependencies-plugin/releases/tag/v1.0.0 "Release v1.0.0 · dhutchison/sonar-alloweddependencies-plugin · GitHub"
[original-post]: /2021/04/09/introducing-sonar-alloweddependencies-plugin/ "Introducing sonar-alloweddependencies-plugin"
