---
layout: post
title: jekyll-compress - A pure Liquid way to compress HTML
date: 2014-06-12 21:15
slug: jekyll-compress-a-pure-liquid-way-to-compress-html
categories: Development
description: Jekyll generated pages can contain a lot of whitespace. There IS a solution without using plugins!
tags: Jekyll
keywords:
- html
- jekyll
- newline
- whitespace character
- inspect element
---
I have [written in the past][prev_post] about my dislike of the amount of whitespace in the HTML that is created by Jekyll's use of Liquid, but now I have been shown an even cleaner solution.

<!--more-->

## What is it?

[Jekyll-compress][jekyll_compress] is a layout for [Jekyll][jekyll] which removes all whitespace between block level elements. This reduces the size of the file that is to be served, and fixes some other [undesirable spacing issues][spacing_issue].

Most modern web browsers come with tools to inspect the source of a page in a more meaningful way than just viewing the raw source. Theses tools usually format the source to make it look readable, so stripping the whitespace will not cause an issue.

One of the benefits, [fixing spacing issues][spacing_issue] actually bit me the other way round. I had to add padding to my tag and category links after applying this layout.

## Usage

It is simple to use. There is just one file `_layouts/compress.html` which needs to go in the `_layouts` directoy of your Jekyll site. Then just change your main layout, for me this is `_layouts/main.html` to declare a parent layout as so:

    ---
    layout: compress
    ---

This can have some side effects, which are detailed in the [readme][readme] for the project.

[prev_post]: /2013/07/26/jekyll-generated-html/ "Jekyll Generated HTML | Dev With Imagination "
[jekyll_compress]: https://github.com/penibelst/jekyll-compress-html "penibelst/jekyll-compress-html "
[jekyll]: http://jekyllrb.com/ "Jekyll • Simple, blog-aware, static sites "
[spacing_issue]: http://css-tricks.com/fighting-the-space-between-inline-block-elements/ "Fighting the Space Between Inline Block Elements | CSS-Tricks "
[readme]: https://github.com/penibelst/jekyll-compress-html#compress-html-in-jekyll "penibelst/jekyll-compress-html "
