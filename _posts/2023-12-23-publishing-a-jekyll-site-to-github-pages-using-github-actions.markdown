---
title: Publishing a Jekyll Site to GitHub Pages using GitHub actions
categories: Site
tags:
- Jekyll
summary: Publishing a Jekyll Site to GitHub Pages using GitHub actions has got a lot
  easier than last time I looked into this.
date: 2023-12-23 01:21
slug: publishing-a-jekyll-site-to-github-pages-using-github-actions
---
Ever since GitHub actions was announced I’ve a had a low priority item on my todo list to move my Jekyll blog build process to this over the native GitHub Pages setup. The key benefit to this has been that it allows you to use more modern versions of Jekyll as well as any custom plugins that you choose - instead of being limited to just the plugins and versions that GitHub supports. 

Recently this has been becoming higher priority as I was having issues keeping an updated devcontainer that still worked with this old version of Jekyll without needing to use an image that was not optimised for Apple Silicon. This was probably a solvable issue, but changing the build process was too. 

This used to be quite a custom process, requiring writing your own workflow using a number of third party actions. I was very pleased to see that it is now an [off the shelf solution][jekyll-github-actions] - so it took me less than 10 minutes to be switched over and on all the latest versions of Jekyll and plugins. I’ve not added anything new yet, but can already see the Paginate V2 plugin supports [generating pages for individual tags & categories][paginate-autopages], something that I was doing manually with a rake script. At this point I am looking to reduce the amount of custom code in my blog and go a lot more stock - I’m even planning on taking another look at [minima][minima] now that I’m on a recent version of Jekyll. 

[jekyll-github-actions]: https://jekyllrb.com/docs/continuous-integration/github-actions/ "GitHub Actions - Jekyll - Simple, blog-aware, static sites"
[paginate-autopages]: https://github.com/sverrirs/jekyll-paginate-v2/blob/master/README-AUTOPAGES.md "Jekyll::Paginate V2::AutoPages"
[minima]: https://github.com/jekyll/minima "Minima is a one-size-fits-all Jekyll theme for writers"
