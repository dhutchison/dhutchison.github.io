---
title: Site Updates
categories: Site
tags:
- jekyll
- css
description: Fixing issues, and process changes.
date: 2016-06-24 00:34
slug: site-updates
---
Last week I became aware of an issue where some pages of my site were not rendering correctly, specifically ones which used code blocks including line numbers. Unfortunately it looks like this has been the case since February when [GitHub Pages upgraded to Jekyll 3][ghp-jekyll3].

With the help of [Parker Moore][pm] from the Jekyll Project the cause was found to be the compress layout for Jekyll, which I've [previously written about][compress-post] and recommended. This is logged as an [issue against the project][compress-issue], but there does not seem to be a fix on the horizon.

In addition to removing this layout from use, I have redone the CSS to be built using SASS instead of LESS. This change is purely so the build is part of Jekyll and not a separate process to manage. Re-doing it provided the opportunity to streamline and optimise the CSS used. The styling is not yet perfect, but it is sure a lot more manageable than it was previously.

[compress-issue]: https://github.com/penibelst/jekyll-compress-html/issues/71 "Nested <pre> tags cause output errors · Issue #71 · penibelst/jekyll-compress-html"
[ghp-jekyll3]: https://github.com/blog/2100-github-pages-now-faster-and-simpler-with-jekyll-3-0 "GitHub Pages now faster and simpler with Jekyll 3.0"
[compress-post]: /2014/06/12/jekyll-compress-a-pure-liquid-way-to-compress-html/ "jekyll-compress - A pure Liquid way to compress HTML" 
[pm]: https://byparker.com/ "Parker Moore - By Parker"
