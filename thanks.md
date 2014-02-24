---
layout: post
title: Thanks
permalink: /thanks/
tags: 
- HTML
- CSS
- Design
categories:
- Web Design
sitemap: 
  lastmod: 2014-02-24 21:27:00
---
This site was built as part of a self re-education in the world of basic web development. While the site has been built from scratch, over time it has been inspired and helped by many great open source projects and utilities. 

### [Jekyll][jekyll]
`Jekyll is a blog-aware, static site generator in Ruby`

Jekyll is the underlying engine that generates the static HTML that drives this site. No database or dynamic language support is required to host this site. All pages are static HTML produced with a mixture of template and markdown files.

### [GitHub Pages][github pages]
GitHub offer free hosting for sites that are either static or powered by Jekyll. On Jekyll powered sites a commit to the correct branch is all that is required to redeploy the site with updated changes. They also support custom domain names. 

### [Kasper Theme for Jekyll][kasper]
I came across this pretty late on, when I was pretty sure the layout of the site was finalised. I ended up redesigning the page footer and adding social share functionality based on it.

### [Font Awesome - The Iconic Font Designed for Bootstrap][font awesome]
The icons used in the social sharing section as well as the links to my profiles across the internet use this font instead of images. It is very easy to set up, although I am going to need to clean this up a bit as the LESS code is producing a lot of bloat in my CSS file.

### [Alphabetizing Jekyll Page Tags In Pure Liquid (Without Plugins)][jekyll tags] 
I had created a rake based setup that would create a separate page containing the posts for a given tag. After stumbling across this on Twitter I have came to realise that the number of posts this site contains does not warrant that level of granularity. This previous setup also had the downside that every time a new tag was used I had to remember to run this rake task or the site would contain a broken link. I have made a tweak to the liquid code used ([Original](https://github.com/LanyonM/lanyonm.github.io/blob/master/tags.html "lanyonm.github.io / tags.html")) so the sort is case-insensitive. My updated version is available [here](https://github.com/dhutchison/dhutchison.github.io/blob/master/tags/index.html " dhutchison.github.io / tags / index.html").

### [Building a Better Sitemap.xml with Jekyll][sitemap]
The [sitemap][site_sitemap] for this site is now using this template. Previously this used a modified version of his old template.

### [CSS3 Patterns Gallery][css3 patterns] 
When viewing this site on a compatible desktop browser, the background uses the "Carbon" texture from this site. On browsers that do not support the radial gradients, it degrades gracefully to a solid background colour.

### Affiliates
Affiliate links are used where applicable when referring to products. This in no way affects the content of this site. I do not have that nasty marketing gene.

 - DevWithImagination is a participant in the Amazon EU Associates Programme, an affiliate advertising programme designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.co.uk.

[jekyll tags]: http://blog.lanyonm.org/articles/2013/11/21/alphabetize-jekyll-page-tags-pure-liquid.html "Alphabetizing Jekyll Page Tags In Pure Liquid (Without Plugins) &#8211; Michael Lanyon's Blog"
[font awesome]: http://fortawesome.github.io/Font-Awesome/ "Font Awesome - The Iconic Font Designed for Bootstrap"
[kasper]: http://rosario.io/2013/11/10/kasper-theme-for-jekyll.html "Rosario's Blog - Coding, startups and ideas."
[jekyll]: http://jekyllrb.com/ "Jekyll • Simple, blog-aware, static sites"
[github pages]: http://pages.github.com/ "GitHub Pages"
[css3 patterns]: http://lea.verou.me/css3patterns/ "CSS3 Patterns Gallery"
[sitemap]: http://davidensinger.com/2013/11/building-a-better-sitemap-xml-with-jekyll/ "Building a Better Sitemap.xml with Jekyll – Development, design, and more by David Ensinger "
[site_sitemap]: /sitemap.xml "The sitemap for this site"




