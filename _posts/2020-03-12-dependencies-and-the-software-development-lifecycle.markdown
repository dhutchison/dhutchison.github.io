---
title: Dependencies & The Software Development Lifecycle
series: Software Dependency Lifecycle
series_part: 1
categories:
- Development
tags:
- sdlc
summary: An introduction to the concerns about Dependencies and the Software Development Lifecycle
date: 2020-03-12 18:51
slug: dependencies-and-the-software-development-lifecycle
---
Third party dependencies are an essential part of every modern software project. It is nearly impossible to build a non-trivial application without depending on third party libraries. 

However, by introducing external software dependencies you are also introducing an area of risk to a project. The [OWASP top 10][owasp_ten] lists "Using Components with Known Vulnerabilities" as the [number 9][owasp_ten_nine] most critical risk to web applications in the last (2017) list. The linked page provides a lot more detail on the risk and general mitigations, and if you have not came across this list before it really should be required reading for all developers.

There are four key points that need to be considered for the use of libraries by a project:
* only including libraries which are actually required
* ensuring the libraries have a licence which allows their use/distribution in your product
* ensuring libraries are kept up to date
* being aware of [Common Vulnerabilities and Exposures (CVEs)][cve]

For a small number of dependencies it may be possible to manually keep on top of this, but ideally it should be automated. There are many commercial tools (such as [Snyk][snyk] and [Sonatype Lifecycle][nexus_lifecycle]) which can be used as part of the software delivery supply chain for performing scans and audits on the libraries that a project is using. In this series I will explore some of the options which can be put together using open source solutions.






[owasp_ten]: https://owasp.org/www-project-top-ten/ "OWASP Top Ten"
[owasp_ten_nine]: https://owasp.org/www-project-top-ten/OWASP_Top_Ten_2017/Top_10-2017_A9-Using_Components_with_Known_Vulnerabilities "A9-Using Components with Known Vulnerabilities | OWASP"

[cve]: https://cve.mitre.org "CVE - Common Vulnerabilities and Exposures (CVE)"

[snyk]: https://snyk.io/product/ "Open Source Security - Snyk"
[nexus_lifecycle]: https://www.sonatype.com/product-nexus-lifecycle "Nexus Lifecycle - Continuously clean your entire software supply chain - Sonatype"
