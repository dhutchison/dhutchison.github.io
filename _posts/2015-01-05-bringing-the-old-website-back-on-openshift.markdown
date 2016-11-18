---
title: Bringing the old website back on OpenShift
categories: Development
tags:
- OpenShift
description: I put my old site back up, powered by OpenShift.
date: 2015-01-05 22:34
slug: bringing-the-old-website-back-on-openshift
---
A few days ago I put the [final iteration][1] of my old skating site back online as a quick test of how easy it was to deploy a website on the [OpenShift][2] platform. I am very impressed with how easy this was.

<!--more-->

## The Site

Version 5 of the site, which was never fully finished, is written in PHP and uses a poor-mans CMS. Due to my cheapness at the time (start of university), I wouldn’t pay for a database. So this site is powered by delimited text files which are processed by the PHP back end.

It truly is horrible to look back on the code design, but it did the job at the time.

I had thrown together another quick [Vagrant VM][3] to test this site, as it has not been touched since 2005 and… the text file parsing appeared to be broken.

On closer inspection of the files in `vi`, the line breaks where mangled. `vi` displayed the file as a single line, separated by `^M` characters. These should be line endings, but not the correct ones for the Mac platform that I am developing on. I don’t know why these are broken now, as the site was originally developed on an older version of Mac OS X. (It’s predecessor was largely created in Mac OS 9!).

Replacing these with the correct line endings was easy thanks to [this StackOverflow answer][4]. The accepted answer to the question is not correct for the issue I had.

This vi command solved the problem, basically it is just doing find and replace to replace line returns with the correct ones for the current platform.

    :%s/^V^M/^V^M/g
    where ^V^M means type Ctrl+V, then Ctrl+M.

After this the site was ready to deploy in some state! There is one area of the site that appears to not work correctly at all, but it is not worth the effort at this point to fix. It was going back online purely for nostalgia reasons. Other versions of the design may reappear in the future.

## Getting started with OpenShift

My experience with OpenShift was great. It took me around 5 minutes from sign up to having a deployed web site with a custom domain.

[Sign up][7] for a new account and add a new application. I am using the PHP 5.4 cartridge. You can leave all the settings in this form with the default values if you want and just hit “Create Application”. The site was originally developed in PHP 4, so if it breaks it breaks. The original version would just be a security vulnerability waiting to happen.

Once the application is created details will be displayed of how to checkout the Git repository and to commit to it. After checking out and copying my site code into the directory, all it required was the commit and the site was live.

## Configuring a Custom Domain

Last step in the process was to set up the site to run off a subdomain off my domain instead of the preconfigured `ts-dwiapps.rhcloud.com`. This process was surprisingly simple. 

In the [applications console][6] select your newly created application. In this page there will be an option to change the alias.

![Change alias option][openshift_custom_domain_1]

Clicking this option will provide a field to enter the custom domain for this application.

![Change alias form][openshift_custom_domain_2]

The final step was to set up the DNS record for this subdomain. My DNS provider is [Namecheap][5], your results may vary. I just needed to set up a CNAME record pointing to my `xxx.rhcloud.com` application domain.

![Namecheap domain options][openshift_custom_domain_3]

Voila! The site is available [here][1].

[1]: http://trash-shit.devwithimagination.com/ "TS V5 "
[2]: https://www.openshift.com/ "OpenShift by Red Hat "
[3]: /2015/01/02/vagrant-setup/ "Vagrant Setup | Dev With Imagination "
[4]: http://stackoverflow.com/a/811208/230449 "line breaks - How to convert the ^M linebreak to 'normal' linebreak in a file opened in vim? - Stack Overflow "
[5]: https://www.namecheap.com/ "Namecheap.com • Cheap Domain Name Registration & Web Hosting "
[6]: https://openshift.redhat.com/app/console/applications "Applications | OpenShift Online by Red Hat "
[7]: https://www.openshift.com/app/account/new "Create an account | OpenShift Online by Red Hat "

[openshift_custom_domain_1]: /images/openshift_ts/custom_domain1.png "Change alias option in OpenShift application"
[openshift_custom_domain_2]: /images/openshift_ts/custom_domain2.png "Add alias form"
[openshift_custom_domain_3]: /images/openshift_ts/custom_domain3.png "Namecheap DNS settings"
