---
title: Cloudflare Redirects
summary: Using Cloudflare features to redirect subdomains & paths
date: 2022-12-04 23:58
slug: cloudflare-redirects
tags:
  - cloudflare
---
There have been a couple of scenarios recently where I thought some additional subdomains and/or path redirects would be useful. 

1. I always forget the capitalisation in the URL for my [OpenAPIVisualiser](https://www.devwithimagination.com/OpenApiVisualiser/) tool, so wanted a redirect from "devwithimagination.com/oav" to the full URL for the project
2. While I have a ".scot" domain for my profile at the moment, I wanted to have "about.devwithimagination.com" redirect to it. 

This post, like many of mine, exists as a reminder to myself how this is setup as it took me a few reads of the documentation to understand this and when I did I found that I've done this before. 

<!--more-->

There seems to be two approaches that might be valid solutions:
* [Redirect one domain to another][redirect-domain]
* [Configuring URL forwarding or redirects with Page Rules][configuring-page-rules]

It turns out I've been down this road before - I've already got a page rule configured for the naked apex domain redirecting to www. On the free plan, you are allowed 3 page rules without paying for more. 

If we ran out of page rules, or needed a more complex logic, you could potentially use [Cloudflare workers for redirects][workers-example-redirects].

The Cloudflare documentation is pretty good, but as a worked example the second of my scenarios is the more complicated one. 

As this is a new subdomain I first needed to create the DNS entry for about.devwithimagination.com. I just created this as a CNAME record pointing to the domain it (may) eventually replace and left it as proxied. The proxied part is important for letting the page rule work. 

![DNS Entry][dns-entry-image]

Then going to Rules -> Redirect Rules and configuring a single redirect.

![Redirect Rule][redirect-rule-image]

And that's it. I repeated this second step for my other redirect and now both my scenarios are handled with minimal configuration within Cloudflare. 

[dns-entry-image]: /images/cloudflare-redirect/cloudflare-redirect-dns-entry.png "Configuration settings for the about.devwithimagination.com DNS entry"
[redirect-rule-image]: /images/cloudflare-redirect/cloudflare-redirect-rule-config.png "Configuration settings for the redirect rule"


[redirect-domain]: https://developers.cloudflare.com/fundamentals/get-started/basic-tasks/manage-domains/redirect-domain/ "Redirect one domain to another - Cloudflare Fundamentals docs"
[configuring-page-rules]: https://support.cloudflare.com/hc/en-us/articles/4729826525965-Configuring-URL-forwarding-or-redirects-with-Page-Rules "Configuring URL forwarding or redirects with Page Rules – Cloudflare Help Center"
[workers-example-redirects]: https://developers.cloudflare.com/workers/examples/redirect "Redirect - Cloudflare Workers docs"
