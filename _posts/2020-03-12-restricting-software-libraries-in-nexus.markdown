---
title: Restricting Software Libraries in Nexus
series: Software Dependency Lifecycle
series_part: 2
categories:
- Development
tags:
- nexus
- Maven
- sdlc
summary: How to use Nexus to whitelist approved dependencies
date: 2020-03-12 20:29
slug: restricting-software-libraries-in-nexus
---
As part of looking in to controlling the third party libraries which could be included for use by a project, I wondered if it was possible to effectively apply an approved whitelist at the [Sonatype Nexus][nexus] level. This would only be effective if developers and CI tools are restricted in their web access and cannot contact the central artefact repositories directly, and so are forced to use Nexus as a mirror. 
 
It turns out that this is possible, and the Nexus documentation is pretty good if you know the pieces of the puzzle that need to be joined together to make this work. [Roles][nexus_roles], which can be assigned to specific [users][nexus_users] or an anonymous user, are made up of privileges. [Privileges][nexus_privilege] can include [Content Selectors][nexus_content_selector] to restrict the results which are returned. When combining these things, we can effectively build a whitelist. As this approach is role based, different rules can be used depending on who the caller is.

<!--more-->

While the examples in this post are for applying this to Maven dependencies, the same concept can be used with other repository types supported by Nexus such as NPM.

## Content Selectors

> [Content selectors][nexus_content_selector] provide a means for you to select specific content from all of your content. The content you select is evaluated against expressions written in CSEL (Content Selector Expression Language).

For example, to configure a selector for only Apache Software Foundation libraries, we would use these settings.

![ASF Content Selector][content_selector_asf]

There are a variety of options which can be used for making the filter conditions, based on the repository type and the type of artifact. 

Path based searches can be used for all repository formats.

~~~
format == "maven2" and path =^ "/org/apache/"
~~~

Maven format repositories can use additional filters based on the Maven coordinates.

~~~
format == "maven2" and coordinate.groupId == "org.apache"
~~~

The options which are available as properties of "coordinate" are not well documented, but are included in the code as the values for the "VALID_REFERENCES" constant in [CselValidator.java][csel_validator]. 

## Privileges

A [Repository Content Selector Privilege][nexus_privilege] is created using this Content Selector. This means that for each Content Selector that is to be added to our whitelist we require a Privilege.

![ASF Content Selector Privilege][privilege_asf]

## Roles

A [role][nexus_roles] is configured to group privileges together to form a group or permissions which a user can be assigned. 

![Role linked to our custom privileges][role_restricted_anon]

## Users

One or many roles can then be assigned to a [user][nexus_users], including to the anonymous user. 

![Anonymous user linked to our custom role][user_anon_roles]



## Testing the Implementation

For simplicity of a test, this was tested using cURL to verify that a whitelisted Maven artefact could be downloaded, while an item not in the list could not. 

An approved item returns an HTTP 200 (OK) response. 

~~~
MacBook:payara dhutchison$ curl -I https://nexus.lan/repository/maven-central/org/apache/ant/ant/1.10.5/ant-1.10.5.pom
HTTP/2 200 
content-security-policy: sandbox allow-forms allow-modals allow-popups allow-presentation allow-scripts allow-top-navigation
content-type: application/xml
date: Tue, 25 Feb 2020 22:10:49 GMT
etag: "1d48137927c0900a9d8e85e640b6cb74"
last-modified: Tue, 10 Jul 2018 04:54:03 GMT
server: Nexus/3.20.1-01 (OSS)
x-content-type-options: nosniff
x-xss-protection: 1; mode=block
content-length: 10470
~~~

Trying the same test for an item not in our approved whitelist will fail with an HTTP 401 (Unauthorized) response.

~~~
MacBook:payara dhutchison$ curl -I https://nexus.lan/repository/maven-central/xalan/xalan/2.7.2/xalan-2.7.2.pom
HTTP/2 401 
content-security-policy: sandbox allow-forms allow-modals allow-popups allow-presentation allow-scripts allow-top-navigation
date: Tue, 25 Feb 2020 22:13:08 GMT
server: Nexus/3.20.1-01 (OSS)
www-authenticate: BASIC realm="Sonatype Nexus Repository Manager"
x-content-type-options: nosniff
x-xss-protection: 1; mode=block
content-length: 0
~~~


[nexus]: https://www.sonatype.com/nexus-repository-oss "Nexus Repository OSS - Software Component Management - Sonatype"

[nexus_content_selector]: https://help.sonatype.com/repomanager3/configuration/repository-management#RepositoryManagement-ContentSelectors "Content Selectors"
[nexus_privilege]: https://help.sonatype.com/repomanager3/configuration/repository-management#RepositoryManagement-ManagingSelectorPermissions "Managing Selector Permissions"
[nexus_roles]: https://help.sonatype.com/repomanager3/security/roles "Roles"
[nexus_users]: https://help.sonatype.com/repomanager3/security/users "Users"


[content_selector_asf]: /images/nexus_whitelist/content_selector_asf.png "Configuration settings for an Apache Software Foundation Content Selector"
[privilege_asf]: /images/nexus_whitelist/privilege_asf.png "Configuration settings for an Apache Software Foundation Privilege"
[role_restricted_anon]: /images/nexus_whitelist/role_restricted_anon.png "Configuration settings for our custom role"
[user_anon_roles]: /images/nexus_whitelist/user_anon_roles.png "Configuration settings for the anonymous user with our custom role"

[csel_validator]: https://github.com/sonatype/nexus-public/blob/master/components/nexus-selector/src/main/java/org/sonatype/nexus/selector/CselValidator.java "CselValidator.java source"
