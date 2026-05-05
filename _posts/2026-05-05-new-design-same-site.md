---
title: New Design, Same Site
categories:
    - Site
tags:
    - Jekyll
summary: The time for developing my own blog CSS from scratch has come to an end - I've switched to the Chirpy theme.
date: "2026-05-05 00:20"
slug: new-design-same-site
---

When I first moved my blog to Jekyll in [mid 2013][first-jekyll-post] theme support wasn’t really a thing, and my CSS was built using the [LESS pre-processor][less]. Over time I moved to [SASS][sass], which was part of the Jekyll package.

That setup has now started to show its age. The build emits deprecation warnings for SCSS features I used, while regular CSS has gained many of the features I originally needed pre-processors for.

Theme support in Jekyll has come a long way in all these years, and I wanted to move away from my own custom design if I could find a theme that I liked and met my needs for technical posts - especially handling responsive layouts, which I have struggled to keep bug-free myself.

I found [Chirpy][chirpy]. It describes itself as a "minimal, responsive, and feature-rich Jekyll theme for technical writing" - exactly what I needed.

Nobody needs another blog post overhyping the AI future, but converting my blog from my custom layouts to use the Chirpy theme was something that Codex / GPT 5.4 could do 90% of with ease. It handled most of the layout, configuration, and front matter changes without much fuss. It took a bit of steering to work through bugs I was finding. Overall though, it saved so much time on what I foresaw being a monotonous task. Maybe it wouldn't have been as bad as I was expecting due to the quality of Chirpy. Regardless, that's less custom styling code I need to maintain, allowing me to focus on the bits I'm really interested in - the content.

When AI works it is amazing and near magic, and saves so much time when I know exactly how to implement what I want. I still hit a fair number of cases where I’m getting convincing but incorrect detail - I will accept that is probably down to the nature of some of the technical problems I am trying to solve, where I am not even sure there is a solution. Sometimes just being able to say “I have no clue” would be a lot better than making something up.

[first-jekyll-post]: /site/2013/07/24/progress/ "Progress"
[less]: https://lesscss.org "Getting started - Less.js"
[sass]: https://sass-lang.com "Sass - Syntactically Awesome Style Sheets"
[chirpy]: https://github.com/cotes2020/jekyll-theme-chirpy "GitHub - cotes2020/jekyll-theme-chirpy - A minimal, responsive, and feature-rich Jekyll theme for technical writing. · GitHub"
