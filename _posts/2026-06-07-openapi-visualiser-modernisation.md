---
title: OpenAPI Visualiser modernisation
categories:
    - Projects
tags:
    - OpenAPI
summary: My OpenAPI Visualiser project has had a modernisation update and reached 1.x. What is it, and what is new?
date: "2026-06-07 00:00"
slug: openapi-visualiser-modernisation
image:
    path: /images/openapi-visualiser/openapi-visualiser-modernisation-hero.png
    alt: OpenAPI Visualiser branching path logo on a decorated technical background
---
When I am setting out to design a new set of APIs, I generally focus on what the “shape” of the API will look like pretty early on. I like to visualise this, usually starting with a mind-map-like diagram showing the path hierarchy and building up the required operations from there.

Trying to visualise this shape once the API specification had been developed wasn’t easy in any Swagger editor I’d come across (a number of years ago now). The same problem applies when trying to get an overall feel for a large API, either from a design or from an implementation being reviewed.

So we developed a utility to help with this - [OpenAPI Visualiser][openapi-visualiser] ([GitHub repository][openapi-visualiser-github]).

This is a browser-based application that processes the API specification entirely locally - no API data is sent to a server. It supports loading OpenAPI specifications from one or more files, or from a URL.

The view that solves my main visualisation use case is API Paths, which renders the API path hierarchy like this. It also lets you export the result as an image if you need it for a design document or similar.

![OpenAPI Visualiser API Paths view showing an example API path hierarchy][api-paths-web]

This was first released back in 2019, so why is it getting a post now? Well I realised I’d never written about it, and it was a few major versions behind the latest Angular LTS, so it was due a maintenance upgrade. I added a few features while I was in there.

A few weeks ago I published version 1.0.0, which modernises the project with an Angular 20 / PrimeNG 20 upgrade, a refreshed UI (including dark mode), and a new drill-in flow that lets you open an individual API endpoint in Swagger UI.

The full list of changes is covered in [pull request #131][modernisation-pr].

While I am using a very small example API specification for the screenshot above, the visualiser has been used with specifications containing hundreds of endpoints.

…and when I wrote that, I thought I really should test it with some very [large][github-rest-api-description] [public][stripe-openapi-description] examples. That highlighted that performance could be better, so version 1.2.0 addresses *that*.

Does this fit with how you design or review APIs, or do you approach visualising their shape differently? If there is a view or feature that would make this more useful for your use cases, please let me know or [raise an issue on GitHub][openapi-visualiser-issues].

[openapi-visualiser]: https://www.devwithimagination.com/OpenApiVisualiser/ "OpenAPI Visualiser"
[openapi-visualiser-github]: https://github.com/dhutchison/OpenApiVisualiser "GitHub - dhutchison/OpenApiVisualiser"
[openapi-visualiser-issues]: https://github.com/dhutchison/OpenApiVisualiser/issues "Issues - dhutchison/OpenApiVisualiser - GitHub"
[github-rest-api-description]: https://raw.githubusercontent.com/github/rest-api-description/main/descriptions-next/api.github.com/api.github.com.json "GitHub REST API OpenAPI description"
[stripe-openapi-description]: https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json "Stripe OpenAPI description"
[modernisation-pr]: https://github.com/dhutchison/OpenApiVisualiser/pull/131 "Modernise framework and UI - Pull request #131 - dhutchison/OpenApiVisualiser"

[api-paths-web]: /images/openapi-visualiser/api-paths-web.png "OpenAPI Visualiser API Paths view showing an example API path hierarchy"
