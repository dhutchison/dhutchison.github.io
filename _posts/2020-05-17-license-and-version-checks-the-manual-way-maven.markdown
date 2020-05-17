---
title: License & Version Checks - The Manual Way - Maven
series: Software Dependency Lifecycle
series_part: 4
categories:
- Development
tags:
- nexus
- maven
- sdlc
summary: An overview of the tools available to do dependency license & version checks
  with Maven.
date: 2020-05-17 19:10
slug: license-and-version-checks-the-manual-way-maven
---
Before we get into how to automate the process of checking library licenses and checking if they are up to date, it is worth looking at how to do this yourself.

In this part, I will be looking at the options for use in a Java application using Maven. 

<!--more-->

<div class="toc-container">
<p class="toc-title">In this post:</p>
* This list should be replaced with a ToC
{:toc}
</div>



## Checking Licenses of Dependencies

The [License Maven Plugin][check_license_plugin] can perform a variety of license related tasks for a Maven project, including updating file headers, downloading licenses for dependencies, and checking third-party licenses.

The `license:add-third-party` or `license:aggregate-add-third-party` goals can be used to generate a file containing all the third-party dependencies and their licenses. 

~~~ bash
[INFO] --- license-maven-plugin:2.0.0:add-third-party (default-cli) @ experiments ---
[INFO] Writing third-party file to /Users/david/Development/Local Projects/microprofile-experiments/target/generated-sources/license/THIRD-PARTY.txt
[INFO] ------------------------------------------------------------------------
~~~ 

This generated file will contain contents like this.

~~~
Lists of 100 third-party dependencies.
     (The Apache License, Version 2.0) Woodstox (com.fasterxml.woodstox:woodstox-core:5.0.3 - https://github.com/FasterXML/woodstox)
     (The Apache Software License, Version 2.0) Java Faker (com.github.javafaker:javafaker:0.12 - http://github.com/DiUS/java-faker)
     (The Apache Software License, Version 2.0) Generex (com.github.mifmif:generex:1.0.2 - https://github.com/mifmif/Generex/tree/master)
~~~

## Finding Unused Dependencies

The [Maven Dependency Plugin][maven_dependency_plugin] has a number of goals which can be used for analysis of dependencies. 

Three of particular interest are:
* [dependency:analyze][maven_dependency_plugin_analyze] analyzes the dependencies of this project and determines which are: used and declared; used and undeclared; unused and declared.
* [dependency:analyze-dep-mgt][maven_dependency_plugin_analyze_dep_mgt] analyzes your projects dependencies and lists mismatches between resolved dependencies and those listed in your `dependencyManagement` section.
* [dependency:analyze-duplicate][maven_dependency_plugin_dup] analyzes the `<dependencies/>` and `<dependencyManagement/>` tags in the pom.xml and determines the duplicate declared dependencies.

The first two of these include configuration options which can be used to fail the build if issues are identified. 

## Checking for Outdated Dependencies

The [Versions Maven Plugin][maven_versions_plugin] can be used for reviewing outdated dependency versions, as well as applying updates to the POM file. 

There is a pretty detailed tutorial over on Baeldung on how to use this plugin - [Use the Latest Version of a Dependency in Maven][versions_tutorial].

## Checking for Vulnernable Dependencies

There are two different Maven plugins I have encountered that can check for vulnerable dependencies. 

### Dependency Check

The [dependency-check][maven_dependency_check] plugin from OWASP scans for vulnerable dependencies, comparing against the National Vulnerability Database hosted by NIST. Running a check against a project is performed by running the following command.  There are also [usage examples][maven_dependency_check_usage] for configuring this to run as part of different phases of the Maven lifecycle. 

~~~ bash
mvn dependency-check:check
~~~

It is worth quoting this section from the usage documentation.

> It is important to understand that the first time this task is executed it may take 20 minutes or more as it downloads and processes the data from the National Vulnerability Database (NVD) hosted by NIST: https://nvd.nist.gov
> 
> After the first batch download, as long as the plug-in is executed at least once every seven days the update will only take a few seconds.

In my testing, the first run took around 5 minutes with subsequent runs taking a little over 10 seconds. This behaviour is not ideal for use in an environment using a clean build environment each time (like CI/CD).

Vulnerable dependencies will be reported in the build output like this. 

~~~
One or more dependencies were identified with known vulnerabilities in experiments:

cdi-api-2.0.jar (pkg:maven/javax.enterprise/cdi-api@2.0, cpe:2.3:a:redhat:jboss_weld:2.0:*:*:*:*:*:*:*) : CVE-2014-8122


See the dependency-check report for more details.
~~~

The referenced report is generated as `target/dependency-check-report.html`. 

### Sonatype OSS Index

The [Sonatype OSS Index][maven_oss_index_plugin] performs an audit of project dependencies using the [Sonatype OSS Index][oss_index].

If you do not modify the pom file, this can be ran standalone by running this.

~~~ bash
mvn org.sonatype.ossindex.maven:ossindex-maven-plugin:audit -f pom.xml
~~~

This uses a different vulnerability database than the OWASP plugin, so did turn out with different (but more detailed) results. 

~~~
[ERROR] Failed to execute goal org.sonatype.ossindex.maven:ossindex-maven-plugin:3.1.0:audit (default-cli) on project experiments: Detected 3 vulnerable components:
[ERROR]   org.bouncycastle:bcprov-jdk15on:jar:1.53:test; https://ossindex.sonatype.org/component/pkg:maven/org.bouncycastle/bcprov-jdk15on@1.53
[ERROR]     * [CVE-2015-6644] Information disclosure (0.0); https://ossindex.sonatype.org/vuln/3a59870b-28b3-4b6b-86b0-9629ebe9de40
[ERROR]     * [CVE-2016-1000344]  Cryptographic Issues (7.4); https://ossindex.sonatype.org/vuln/9f7731e8-3e99-4140-b731-075349493eaa
[ERROR]     * [CVE-2016-1000352]  Cryptographic Issues (7.4); https://ossindex.sonatype.org/vuln/4ae5f237-0395-46d3-8a76-64543475e31c
[ERROR]     * [CVE-2016-1000345] In the Bouncy Castle JCE Provider version 1.55 and earlier the DHIES/ECIES CBC m... (5.9); https://ossindex.sonatype.org/vuln/776d6f0f-dfc1-4a13-86c7-062d8e4a0cd1
[ERROR]     * [CVE-2016-1000346] In the Bouncy Castle JCE Provider version 1.55 and earlier the other party DH pu... (3.7); https://ossindex.sonatype.org/vuln/d3e65139-8f42-48b6-afee-3a98cdf267f6
[ERROR]     * [CVE-2016-1000340]  Data Handling (7.5); https://ossindex.sonatype.org/vuln/3d6799ae-696b-4c94-a07c-289333113419
[ERROR]     * [CVE-2018-1000613]  Deserialization of Untrusted Data (9.8); https://ossindex.sonatype.org/vuln/fd2210b6-0f22-45aa-aab6-1b9013f32653
[ERROR]     * [CVE-2016-1000338]  mproper Verification of Cryptographic Signature (7.5); https://ossindex.sonatype.org/vuln/80e267ed-a032-42d2-b4c7-4a1d44adf8d7
[ERROR]     * [CVE-2016-1000341] In the Bouncy Castle JCE Provider version 1.55 and earlier DSA signature generat... (5.9); https://ossindex.sonatype.org/vuln/5c694896-8b83-4276-ac13-482aa3c7246d
[ERROR]     * [CVE-2016-1000342]  mproper Verification of Cryptographic Signature (7.5); https://ossindex.sonatype.org/vuln/8d83d52d-304c-468c-ba47-30959386d1b0
[ERROR]     * [CVE-2016-1000343]  Cryptographic Issues (7.5); https://ossindex.sonatype.org/vuln/39e53aee-521d-462f-b233-35fa10c11571
[ERROR]     * [CVE-2017-13098] BouncyCastle TLS prior to version 1.0.3, when configured to use the JCE (Java Cr... (5.9); https://ossindex.sonatype.org/vuln/42765c46-9e37-43e0-8386-34f61a348df5
[ERROR]     * [CVE-2016-1000339]  Cryptographic Issues (5.3); https://ossindex.sonatype.org/vuln/314fe12b-7853-4852-ad38-96c000bf9cb1
[ERROR]   org.apache.cxf:cxf-rt-frontend-jaxrs:jar:3.3.3:test; https://ossindex.sonatype.org/component/pkg:maven/org.apache.cxf/cxf-rt-frontend-jaxrs@3.3.3
[ERROR]     * [CVE-2019-17573] By default, Apache CXF creates a /services page containing a listing of the avai... (6.1); https://ossindex.sonatype.org/vuln/1117a537-fe28-4ac6-bf7b-e31223749b8a
[ERROR]     * [CVE-2019-12406] Apache CXF before 3.3.4 and 3.2.11 does not restrict the number of message attac... (6.5); https://ossindex.sonatype.org/vuln/684e1cf8-48c8-44ec-bf58-528411cb2b54
[ERROR]     * [CVE-2019-12419] Apache CXF before 3.3.4 and 3.2.11 provides all of the components that are requi... (9.8); https://ossindex.sonatype.org/vuln/aa414971-d58a-4c9d-a317-f07113516a95
[ERROR]     * [CVE-2020-1954] Apache CXF has the ability to integrate with JMX by registering an Instrumentati... (5.3); https://ossindex.sonatype.org/vuln/20bc51e8-29c6-4168-9326-ae0ed18e5d51
[ERROR]     * [CVE-2019-12423] Apache CXF ships with a OpenId Connect JWK Keys service, which allows a client t... (7.5); https://ossindex.sonatype.org/vuln/d131c7cd-2028-4417-8141-2b2cb3d31776
[ERROR]   org.apache.cxf:cxf-core:jar:3.3.3:test; https://ossindex.sonatype.org/component/pkg:maven/org.apache.cxf/cxf-core@3.3.3
[ERROR]     * [CVE-2019-17573] By default, Apache CXF creates a /services page containing a listing of the avai... (6.1); https://ossindex.sonatype.org/vuln/1117a537-fe28-4ac6-bf7b-e31223749b8a
[ERROR]     * [CVE-2019-12406] Apache CXF before 3.3.4 and 3.2.11 does not restrict the number of message attac... (6.5); https://ossindex.sonatype.org/vuln/684e1cf8-48c8-44ec-bf58-528411cb2b54
[ERROR]     * [CVE-2019-12423] Apache CXF ships with a OpenId Connect JWK Keys service, which allows a client t... (7.5); https://ossindex.sonatype.org/vuln/d131c7cd-2028-4417-8141-2b2cb3d31776
[ERROR]     * [CVE-2019-12419] Apache CXF before 3.3.4 and 3.2.11 provides all of the components that are requi... (9.8); https://ossindex.sonatype.org/vuln/aa414971-d58a-4c9d-a317-f07113516a95
[ERROR]     * [CVE-2020-1954] Apache CXF has the ability to integrate with JMX by registering an Instrumentati... (5.3); https://ossindex.sonatype.org/vuln/20bc51e8-29c6-4168-9326-ae0ed18e5d51
[ERROR] 

~~~

## Enforcement

The [Maven Enforcer Plugin][maven_enforcer_plugin] is a powerful tool for enforcing rules in the Maven lifecycle. As well as the built in [rules][enforcer_rules], custom rules can be written using Java code. Through the use of wildcards, the [Banned Dependencies][enforcer_banned] rule can even be used to build approved whitelists of dependencies. Of course this works best when the enforcement rules can be defined in a parent pom that applies to all projects you publish. 

## Conclusion

Through the configurability of the Maven build lifecycle, it is relatively easy to integrate all these tools to perform ongoing checks to ensure that dependencies are kept up to date and compliant with licensing requirements as part of the build process. These can be automated in your CI/CD workflow as required.



[check_license_plugin]: https://www.mojohaus.org/license-maven-plugin/ "License Maven Plugin – Introduction"

[maven_dependency_plugin]: http://maven.apache.org/plugins/maven-dependency-plugin/index.html "Apache Maven Dependency Plugin – Introduction"
[maven_dependency_plugin_analyze]: http://maven.apache.org/plugins/maven-dependency-plugin/analyze-mojo.html "Apache Maven Dependency Plugin – dependency:analyze"
[maven_dependency_plugin_analyze_dep_mgt]: http://maven.apache.org/plugins/maven-dependency-plugin/analyze-dep-mgt-mojo.html "Apache Maven Dependency Plugin – dependency:analyze-dep-mgt"
[maven_dependency_plugin_dup]: http://maven.apache.org/plugins/maven-dependency-plugin/analyze-duplicate-mojo.html "Apache Maven Dependency Plugin – dependency:analyze-duplicate"

[maven_versions_plugin]: https://www.mojohaus.org/versions-maven-plugin/index.html "Versions Maven Plugin – Introduction"
[versions_tutorial]: https://www.baeldung.com/maven-dependency-latest-version "Use the Latest Version of a Dependency in Maven - Baeldung"

[maven_oss_index_plugin]: https://sonatype.github.io/ossindex-maven/maven-plugin/ "Maven Plugin – OSS Index: Maven"
[oss_index]: https://ossindex.sonatype.org "Sonatype OSS Index"

[maven_dependency_check]: https://jeremylong.github.io/DependencyCheck/index.html "dependency-check – About"
[maven_dependency_check_usage]: https://jeremylong.github.io/DependencyCheck/dependency-check-maven/index.html "dependency-check-maven – Usage"

[maven_enforcer_plugin]: http://maven.apache.org/enforcer/maven-enforcer-plugin/ "Maven Enforcer plugin – Introduction"
[enforcer_rules]: http://maven.apache.org/enforcer/enforcer-rules/index.html "Apache Maven Enforcer Built-In Rules – Built-In Rules"
[enforcer_custom_rules]: http://maven.apache.org/enforcer/enforcer-api/writing-a-custom-rule.html "Apache Maven Enforcer API – Writing a custom rule"
[enforcer_banned]: https://maven.apache.org/enforcer/enforcer-rules/bannedDependencies.html "Apache Maven Enforcer Built-In Rules – Banned Dependencies"
