---
title: License & Version Checks - The Manual Way - NPM
series: Software Dependency Lifecycle
series_part: 3
categories:
- Development
tags:
- nexus
- npm
- sdlc
summary: An overview of the tools available to do dependency license & version checks
  with NPM.
date: 2020-03-26 22:57
slug: licence-and-version-checks-the-manual-way-npm
---
Throughout this series of blog posts I am looking at how to manage third party dependencies in the software development lifecycle. Before we get into how to automate the process of checking library licenses and checking if they are up to date, it is worth looking at how to do this yourself.

In this blog post I will look at the tools available for scanning an Angular application, which would also work for any type of project using NPM. 

<!--more-->

<div class="toc-container">
<p class="toc-title">In this post:</p>
* This list should be replaced with a ToC
{:toc}
</div>




## Checking Licenses of Dependencies

There is an NPM module available for inspecting the license information of modules and their dependencies - [License Checker][npm_license_checker].

~~~ bash
MacBook:OpenAPIVisualiser dhutchison$ npx -q license-checker
├─ @angular-devkit/architect@0.900.2
│  ├─ licenses: MIT
│  ├─ repository: https://github.com/angular/angular-cli
│  ├─ publisher: Angular Authors
│  ├─ path: /Users/david/Development/Local Projects/Angular/OpenAPIVisualiser/node_modules/@angular-devkit/architect
│  └─ licenseFile: /Users/david/Development/Local Projects/Angular/OpenAPIVisualiser/node_modules/@angular-devkit/architect/LICENSE
├─ @angular-devkit/build-angular@0.900.2
│  ├─ licenses: MIT
│  ├─ repository: https://github.com/angular/angular-cli
│  ├─ publisher: Angular Authors
│  ├─ path: /Users/david/Development/Local Projects/Angular/OpenAPIVisualiser/node_modules/@angular-devkit/build-angular
│  └─ licenseFile: /Users/david/Development/Local Projects/Angular/OpenAPIVisualiser/node_modules/@angular-devkit/build-angular/LICENSE
<snip a lot of lines>
~~~

As well as being able to just list out the licenses which are used, additional options can be used to filter the output. The default output can be very long depending on the amount of nested dependencies.

The `--summary` flag can be used just to provide a count of the number of dependencies with each license count, and in most cases the production dependencies are the most important ones to check.

~~~ bash
MacBook:OpenAPIVisualiser dhutchison$ npx -q license-checker --summary --production
├─ MIT: 26
├─ BSD-2-Clause: 3
├─ Apache-2.0: 2
├─ UNLICENSED: 1
└─ BSD-3-Clause: 1
~~~

The `--failOn` or `--onlyAllow` flags can be used to supply license names which will cause the build to fail, so this used be used in a build pipeline to ensure noncompliant licenses do not enter the build chain. 

## Finding Unused Dependencies

There is an NPM module available for finding unused dependencies - [depcheck][npm_depcheck].

~~~ bash
MacBook:OpenAPIVisualiser dhutchison$ npx -q depcheck
Unused dependencies
* @angular/animations
* @angular/cdk
* @angular/material
* core-js
* primeicons
* uuid
Unused devDependencies
* @angular/language-service
* @types/jasmine
* @types/jasminewd2
* @types/node
Missing dependencies
* src: ./src/app/components/api-components-detail/api-components-detail.component.spec.ts
* openapi3-ts: ./src/app/components/api-components-detail/api-components-detail.component.ts
~~~

This did however highlight a number of Angular components as not required when they are, and a few missing ones due to the way they had been imported. In my opinion this tool can only be used as an advisory check at this point and could not be included as part of a linting phase.

## Checking for Outdated Dependencies

NPM has a built in command for checking for outdated dependencies, [outdated][npm_outdated]. This will show any dependencies with new versions available, with columns to show versions which match the "wanted" `semver` range as well as the latest available version. 

~~~ bash
MacBook:OpenAPIVisualiser dhutchison$ npm outdated
Package                               Current    Wanted    Latest  Location
@angular-devkit/build-angular         0.900.2   0.900.7   0.901.0  open-apivisualiser
@angular/animations                     9.0.1     9.1.0     9.1.0  open-apivisualiser
@angular/cdk                            9.0.0     9.2.0     9.2.0  open-apivisualiser
@angular/cli                            9.0.2     9.1.0     9.1.0  open-apivisualiser
@angular/common                         9.0.1     9.0.7     9.1.0  open-apivisualiser
@angular/compiler                       9.0.1     9.0.7     9.1.0  open-apivisualiser
@angular/compiler-cli                   9.0.1     9.0.7     9.1.0  open-apivisualiser
@angular/core                           9.0.1     9.0.7     9.1.0  open-apivisualiser
@angular/forms                          9.0.1     9.0.7     9.1.0  open-apivisualiser
@angular/language-service               9.0.1     9.0.7     9.1.0  open-apivisualiser
@angular/material                       9.0.0     9.2.0     9.2.0  open-apivisualiser
@angular/platform-browser               9.0.1     9.0.7     9.1.0  open-apivisualiser
@angular/platform-browser-dynamic       9.0.1     9.0.7     9.1.0  open-apivisualiser
@angular/router                         9.0.1     9.0.7     9.1.0  open-apivisualiser
@types/jasmine                         2.8.16    2.8.16    3.5.10  open-apivisualiser
@types/js-yaml                         3.12.0    3.12.3    3.12.3  open-apivisualiser
@types/node                          12.12.27  12.12.31  12.12.31  open-apivisualiser
codelyzer                               5.2.1     5.2.2     5.2.2  open-apivisualiser
commonmark                             0.29.0    0.29.1    0.29.1  open-apivisualiser
core-js                                 2.6.5    2.6.11     3.6.4  open-apivisualiser
jasmine-core                           2.99.1    2.99.1     3.5.0  open-apivisualiser
jasmine-spec-reporter                   4.2.1     4.2.1     5.0.1  open-apivisualiser
karma-chrome-launcher                   2.2.0     2.2.0     3.1.0  open-apivisualiser
karma-coverage-istanbul-reporter        2.0.6     2.1.1     2.1.1  open-apivisualiser
karma-jasmine                           1.1.2     1.1.2     3.1.1  open-apivisualiser
karma-jasmine-html-reporter             0.2.2     0.2.2     1.5.3  open-apivisualiser
primeng                            9.0.0-rc.4     9.0.2     9.0.2  open-apivisualiser
ts-node                                 7.0.1     7.0.1     8.8.1  open-apivisualiser
tslib                                  1.10.0    1.11.1    1.11.1  open-apivisualiser
tslint                                 5.11.0    5.11.0     6.1.0  open-apivisualiser
typescript                              3.7.5     3.7.5     3.8.3  open-apivisualiser
uuid                                    3.3.2     3.4.0     7.0.2  open-apivisualiser
zone.js                                0.10.2    0.10.3    0.10.3  open-apivisualiser
~~~

## Checking for Vulnernable Dependencies

### The Native Way

NPM has a built in command for checking for vulnerable dependencies, [audit][npm_audit]. This will show any dependencies which are vulnerable, and additional options can be provided to only cause the command to exit with an error code if the severity of the vulnerabilities are above a given level. This will not work if you have configured Sonatype Nexus as a custom registry for NPM, another solution is in the next section.

The below command would return any vulnerable dependences which are not development dependences, and only exit with an error code if at least one item had a moderate or higher severity.

~~~ bash
MacBook:OpenAPIVisualiser dhutchison$ npm audit --production --audit-level=moderate
                                                                                
                       === npm audit security report ===                        
                                                                                
# Run  npm update minimist --depth 2  to resolve 1 vulnerability
┌───────────────┬──────────────────────────────────────────────────────────────┐
│ Low           │ Prototype Pollution                                          │
├───────────────┼──────────────────────────────────────────────────────────────┤
│ Package       │ minimist                                                     │
├───────────────┼──────────────────────────────────────────────────────────────┤
│ Dependency of │ commonmark                                                   │
├───────────────┼──────────────────────────────────────────────────────────────┤
│ Path          │ commonmark > minimist                                        │
├───────────────┼──────────────────────────────────────────────────────────────┤
│ More info     │ https://npmjs.com/advisories/1179                            │
└───────────────┴──────────────────────────────────────────────────────────────┘


found 1 low severity vulnerability in 33 scanned packages
  run `npm audit fix` to fix 1 of them.
~~~

As noted in the output of the command, `npm audit fix` can be executed to upgrade vulnerable dependencies.

### The Way That Works Using Nexus

As noted above, if you have Nexus configured as your NPM registry then the `npm audit` command will fail with an error like the one below. 

~~~ bash
MacBook:OpenAPIVisualiser dhutchison$ npm audit
npm ERR! code ENOAUDIT
npm ERR! audit Your configured registry (https://nexus.lan/repository/npm-central/) does not support audit requests.
~~~

There has been an open [Jira ticket][nexus_audit_issue] about this for the last two years, and the most recent comments suggest a fix is coming but will require a Sonatype IQ license. However, about three weeks ago (4th of March 2020) Sonatype published a new blog post [Beyond npm Audit to Traverse an Increasingly Complex Dependency Tree][audit_js_blog]. This talks about how an NPM module [Audit.js][auditjs] which audits JavaScript projects using the [Sonatype OSS Index][oss_index] to identify known vulnerabilities and outdated package versions. If you are an IQ subscriber, then this can use an IQ server instead. 

Running this with the "ossi" argument will use the OSS Index

~~~ bash
MacBook:OpenAPIVisualiser dhutchison$ npx -q auditjs@latest ossi
 ________   ___  ___   ________   ___   _________       ___   ________      
|\   __  \ |\  \|\  \ |\   ___ \ |\  \ |\___   ___\    |\  \ |\   ____\     
\ \  \|\  \\ \  \\\  \\ \  \_|\ \\ \  \\|___ \  \_|    \ \  \\ \  \___|_    
 \ \   __  \\ \  \\\  \\ \  \ \\ \\ \  \    \ \  \   __ \ \  \\ \_____  \   
  \ \  \ \  \\ \  \\\  \\ \  \_\\ \\ \  \    \ \  \ |\  \\_\  \\|____|\  \  
   \ \__\ \__\\ \_______\\ \_______\\ \__\    \ \__\\ \________\ ____\_\  \ 
    \|__|\|__| \|_______| \|_______| \|__|     \|__| \|________||\_________\
                                                                \|_________|
                                                                            
                                                                            
  _      _                       _   _              
 /_)    /_`_  _  _ _/_   _  _   (/  /_`_._  _   _/ _
/_)/_/ ._//_// //_|/ /_//_//_' (_X /  ///_'/ //_/_\ 
   _/                _//                            

  AuditJS version: 4.0.13

✔ Starting application
✔ Getting coordinates for Sonatype OSS Index
✔ Auditing your application with Sonatype OSS Index
✔ Submitting coordinates to Sonatype OSS Index
✔ Reticulating splines
✔ Removing whitelisted vulnerabilities

  Sonabot here, beep boop beep boop, here are your Sonatype OSS Index results:
  Total dependencies audited: 32

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
[1/32] - pkg:npm/@angular/animations@9.0.1 - No vulnerabilities found!
[2/32] - pkg:npm/@angular/cdk@9.0.0 - No vulnerabilities found!
[3/32] - pkg:npm/@angular/common@9.0.1 - No vulnerabilities found!
[4/32] - pkg:npm/@angular/compiler@9.0.1 - No vulnerabilities found!
[5/32] - pkg:npm/@angular/core@9.0.1 - No vulnerabilities found!
[6/32] - pkg:npm/@angular/forms@9.0.1 - No vulnerabilities found!
[7/32] - pkg:npm/@angular/material@9.0.0 - No vulnerabilities found!
[8/32] - pkg:npm/@angular/platform-browser-dynamic@9.0.1 - No vulnerabilities found!
[9/32] - pkg:npm/@angular/platform-browser@9.0.1 - No vulnerabilities found!
[10/32] - pkg:npm/@angular/router@9.0.1 - No vulnerabilities found!
[11/32] - pkg:npm/@loopback/openapi-v3-types@1.2.1 - No vulnerabilities found!
[12/32] - pkg:npm/@types/js-yaml@3.12.0 - No vulnerabilities found!
[13/32] - pkg:npm/argparse@1.0.10 - No vulnerabilities found!
[14/32] - pkg:npm/commonmark@0.29.0 - No vulnerabilities found!
[15/32] - pkg:npm/core-js@2.6.5 - No vulnerabilities found!
[16/32] - pkg:npm/entities@1.1.2 - No vulnerabilities found!
[17/32] - pkg:npm/esprima@4.0.1 - No vulnerabilities found!
[18/32] - pkg:npm/file-saver@2.0.2 - No vulnerabilities found!
[19/32] - pkg:npm/html-to-image@0.1.1 - No vulnerabilities found!
[20/32] - pkg:npm/js-yaml@3.13.1 - No vulnerabilities found!
[21/32] - pkg:npm/mdurl@1.0.1 - No vulnerabilities found!
[22/32] - pkg:npm/minimist@1.2.0 - No vulnerabilities found!
[23/32] - pkg:npm/openapi3-ts@1.3.0 - No vulnerabilities found!
[24/32] - pkg:npm/parse5@5.1.1 - No vulnerabilities found!
[25/32] - pkg:npm/primeicons@2.0.0 - No vulnerabilities found!
[26/32] - pkg:npm/primeng@9.0.0-rc.4 - No vulnerabilities found!
[27/32] - pkg:npm/rxjs@6.5.4 - No vulnerabilities found!
[28/32] - pkg:npm/sprintf-js@1.0.3 - No vulnerabilities found!
[29/32] - pkg:npm/string.prototype.repeat@0.2.0 - No vulnerabilities found!
[30/32] - pkg:npm/tslib@1.10.0 - No vulnerabilities found!
[31/32] - pkg:npm/uuid@3.3.2 - No vulnerabilities found!
[32/32] - pkg:npm/zone.js@0.10.2 - No vulnerabilities found!
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

~~~

When the `--quiet` option is provided the command will only output vulnerable dependencies. 

This does not provide a "fix" option however, so you will need to upgrade to fixed versions yourself. 

 

## Conclusion

In this post I have covered most of the constituent parts that I think are key to performing ongoing checks to ensure that dependencies are kept up to date and compliant with licensing requirements. These can be automated in your CI/CD workflow as required. 


[npm_outdated]: https://docs.npmjs.com/cli-commands/outdated.html "npm-outdated - npm Documentation"
[npm_license_checker]: https://www.npmjs.com/package/license-checker "license-checker - npm"
[npm_depcheck]: https://www.npmjs.com/package/depcheck "depcheck  -  npm"
[npm_audit]: https://docs.npmjs.com/cli/audit "npm-audit - npm Documentation"

[nexus_audit_issue]: https://issues.sonatype.org/browse/NEXUS-16954 "[NEXUS-16954] Add support for "npm audit" - Sonatype JIRA"
[audit_js_blog]: https://blog.sonatype.com/beyond-npm-audit "Beyond npm Audit to Traverse an Increasingly Complex Dependency Tree"
[auditjs]: https://www.npmjs.com/package/auditjs 
[oss_index]: https://ossindex.sonatype.org "Sonatype OSS Index"
