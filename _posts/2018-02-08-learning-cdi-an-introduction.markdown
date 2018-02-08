---
title: Learning CDI - An Introduction
series: Learning CDI and Ivy
series_part: 1
categories:
- Development
tags:
- cdi
- ivy
---

There is a wide selection of technologies which I am wanting to learn, at least in a basic sense, this coming year. 

Two of these are:

* [Contexts and Dependency Injection (CDI)][cdi_spec]
* [Apache Ivy][apache_ivy]

<!--more-->

## Why CDI?

After seeing one too many repeated lifecycle bean implementations across projects seeking to configure a singleton JCache CacheManager and handle the cleanup of this resource, I started looking into how this object could be provided as an injected dependency. The answer to this is by using the CDI component of Java EE.

> What is CDI?
> 
> Contexts and Dependency Injection for Java EE (CDI) 1.0 was introduced as part of the Java EE 6 platform, and has quickly become one of the most important and popular components of the platform.
>
> CDI defines a powerful set of complementary services that help improve the structure of application code.
>
> * A well-defined lifecycle for stateful objects bound to lifecycle contexts, where the set of contexts is extensible
> * A sophisticated, typesafe dependency injection mechanism, including the ability to select dependencies at either development or deployment time, without verbose configuration
> * Support for Java EE modularity and the Java EE component architecture - the modular structure of a Java EE application is taken into account when resolving dependencies between Java EE components
> * Integration with the Unified Expression Language (EL), allowing any contextual object to be used directly within a JSF or JSP page
> * The ability to decorate injected objects
> * The ability to associate interceptors to objects via typesafe interceptor bindings
> * An event notification model
>
> --<cite>[Contexts and Dependency Injection for Java Specification][cdi_spec]</cite>

Through the use of this component of the platform, we will be able to use dependency injection to get a CacheManager instance just as easily as we can get an implementation of an EJB interface with the "@EJB" annotation, and the "@Resource" annotation for JDNI items.

As I found through implementing this learning project, the [Payara][payara] application server (including the micro variant) includes a CDI provider for the Hazelcast implementation of JCache.


## Why Ivy?

While I have had a little experience using Maven, which appears to be the leading build automation and dependency management tool for Java at present, my main experience has been with Apache Ant. Unlike Maven, Ant does not include resolution of external dependencies out of the box - so I wanted to see what the dependency/release management tools which integrate with Ant look like. 

Through my initial plan for a learning project, this will be able to progress through basic resolution of dependencies to a multi-module project with inter-module dependencies. 

 

[cdi_tutorial]: https://docs.oracle.com/javaee/6/tutorial/doc/giwhb.html "The Java EE 6 Tutorial - Chapter 28 Introduction to Contexts and Dependency Injection for the Java EE Platform"
[cdi_spec]: http://cdi-spec.org "Contexts and Dependency Injection for Java Specification | Contexts and Dependency Injection"
[apache_ivy]: http://ant.apache.org/ivy/ "Apache Ivy - Apache Ant - The Apache Software Foundation!"
[payara]: https://www.payara.fish "Pazara Server"