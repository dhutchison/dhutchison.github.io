---
title: A Feature Flag Experiment with Config and CDI
layout: post
series: A look in to MicroProfile
series_part: 4
summary: A look into Config, and how it can be used with CDI
categories:
- Development
tags:
- Java
- MicroProfile
date: 2019-09-16 22:18
slug: a-feature-flag-experiment-with-config-and-cdi
---
Lately I have been doing some research into Feature Toggle approaches, and how these can be used in Micro Services components developed in Java. These are simple true/false values used to determine if a given application feature (or code path) is enabled. 

On looking at a MicroProfile quick start with sample code, the Config feature specification looked interesting for tackling a piece of this functionality. 

The aim here is to provide a proof-of-concept implementation that allows for feature toggles that can be scoped down to different user attributes. This should be able to act as a starting point for a more complicated implementation if required. While it turned out that this could not be done solely using the Config feature, there appears to be a viable approach when combining this with Context Dependency Injection (CDI). 

In the interests of speed and simplicity, this will use a header in the HTTP request to define the role of the user. If this approach was to be used in a production environment this role assignment would need to be provided by something which is verifiable, such as the JWT token provided. 

All the source code for this implementation is part of my [microprofile experiments][experiments_github] project. 

<!--more-->


## Config Feature

The [Config Feature][config] in MicroProfile aims to standardise the approach to loading runtime configuration, accepting that applications require to get their configuration values from a variety of hierarchical sources. 

> Each ConfigSource has a specified ordinal, which is used to determine the importance of the values taken from the associated ConfigSource. A higher ordinal means that the values taken from this ConfigSource will override values from lower-priority ConfigSources. This allows a configuration to be customized from outside a binary, assuming that external ConfigSource s have higher ordinal values than the ones whose values originate within the release binaries.
>
> --<cite>[Config Sources][configsources]</cite>



This will iterate through all the available configuration sources (from highest ordinal to lowest) until it finds a non-null value. This alone has the potential to drastically simplify any configuration loading code which was previously written to look for system properties, and if they were not found use some default configuration values. 

This could potentially be used as the "read" side of our feature toggle implementation. This abstracts out how the configuration is ultimately read, as the calling code only cares about the value. 

While the focus of my testing is focused on the most recent release of Payara Micro, this functionality has been part of Payara server since the 4.173 release.

The source of the above quote defines the default configuration sources which are required as part of the specification. Implementations of the specification are free to provide their own additional sources, [which Payara does][payara_configsources]. 

In the sample code, the file `src/main/resources/META-INF/microprofile-config.properties` defines the key/value configuration value pairs that is used by the lowest ordinal configuration source from the default set, so can be used to define any default configuration values which should be used if they are not found elsewhere. This configuration file becomes part of the deployable WAR file produced as the build artifact of the project.  

### Custom Configuration Sources

Additional configuration sources can be written if the default set are not enough. These need to implement the interface [ConfigSource][ConfigSource_javadoc], then are discovered through the Service Provider Interface (SPI) mechanism through class path resources `META-INF/services/org.eclipse.microprofile.config.spi.ConfigSource`.

In my experiment project, an implementation [FeatureFlagConfigSource][FeatureFlagConfigSource_class] was created to read a JSON array from a file on the class path, but this could have just as easily performed an HTTP call to get this JSON array from an API.

An important factor in any system which is used to load data, configuration or otherwise, is performance. While reading a configuration file once is relatively low impact, if this implementation was loading its data from a remote API it would be expected to cache the loaded data, and periodically refresh the held information. 

JCache is not part of the MicroProfile specification, and so not part of the template project which has been used as the basis of this experiment project. 

As it is provided as part of Payara Micro, I just needed to add it as a dependency in the POM file. 

    <dependency>
        <groupId>javax.cache</groupId>
        <artifactId>cache-api</artifactId>
        <version>1.0.0</version>
        <scope>provided</scope>
    </dependency>

As we are unable to use the `@Inject` annotation to inject a CacheManager instance into the configuration source implementation, a manual lookup from JNDI is required. The approach to getting a CacheManager instance may vary based on the application server you are deploying to, this is the approach used [for Payara][payara_cachemanager]. 

~~~ java
    Context ctx = new InitialContext();
    CachingProvider provider = (CachingProvider) ctx.lookup("payara/CachingProvider");
    CacheManager manager = (CacheManager) ctx.lookup("payara/CacheManager");
~~~

This Cache Manager can then be used to get the configured Cache instance for holding the loaded values. 

### Configuration Value Types

The default type for all values is String. The framework has limited support built in for converting from a string value to some [primitive data types][config_converters]. If the value is required to be converted in to a more complex object type, a custom implementation of [Converter][Converter_javadoc] needs to be written. Just like with the configuration sources, these are discovered through the SPI mechanism, this time using the class path resources `META-INF/services/org.eclipse.microprofile.config.spi.Converter`. 

In the case of our feature toggle example, a JSON object is used as our value and is converted to a FeatureFlag object containing the conditions where the toggle should be activated. The custom configuration source reads in a JSON array to make up a map of "name" to the JSON object string for the value. 

~~~ javascript
[
    {
        "name": "feature.one",
        "enabled": true,
        "properties": {
            "requires-header-role": "admin"
        }
    },
    {
        "name": "feature.two",
        "enabled": false
    }
]
~~~

However, due to the way that the hierarchy of configuration sources work we can also define settings in the "microprofile-config.properties" file. 

~~~
future.feature={"name": "future.feature", "enabled": true}
~~~

At this point we are able to have our Feature object loaded from the JSON file and injected into the controller with the below code. Getting this directly from the configuration provider in this fashion does not allow us to do any customisation based on the request context. 

~~~ java
    @Inject
    @ConfigProperty(name = "feature.one")
    private Feature featureOne;
~~~

It would be possible to take this injected value and pass it, along with whatever contextual information is required, to a "resolver" class to determine the final value. This is a pattern that appears to be used in [ff4j][ff4j_flipping].This does however add additional code into each endpoint method, when ideally I want to hide all this in framework code.

## Injection

Inside of a ConfigSource implementation itself there appears to be no way to get any information on the context of the request, which in a way makes sense as the framework is standalone and not part of JAX-RS or CDI. Two approaches were tested, using [@Context][context_annotation] for HttpHeaders and [@Inject][inject_annotation] for other CDI resources, but neither resulted in any dependency injection occurring. 

So in order to use contextual information, we need to use our own CDI provider instead of the one provided for Config. 

In regular CDI, it is possible to specify methods as taking in an [InjectionPoint][injectionpoint], which provides details on where the value will ultimately be injected into. In this example implementation, the `getAnnotated()` method is used to get the annotations which are set on the injection target. The `ConfigProperty` annotation could not be reused for the feature name without triggering the Config feature, so a custom annotation [FeatureProperty][FeatureProperty_class] was created with a very similar definition. 


~~~ java
@Qualifier
@Retention(RUNTIME)
@Target({METHOD, FIELD, PARAMETER, TYPE})
public @interface FeatureProperty {
    
    /**
     * The key of the config property used to look up the configuration value.
     *
     * @return Name (key) of the config property to inject
     */
    @Nonbinding
    String name() default "";
}
~~~

This annotation holds the name of the feature toggle, which is then used by the [ResolvedFeatureFlagProducer][ResolvedFeatureFlagProducer_class] class to load the `FeatureFlag` definition from the Config feature before being turned in to a boolean for injection based on the available context information. 

~~~ java
        /* Get the config name annotation value */
        FeatureProperty configProperty = injectionPoint.getAnnotated().getAnnotation(FeatureProperty.class);
        if (configProperty == null) {
            throw new IllegalStateException(
                    "Failed to find required FeatureProperty annotation");
        }

        final String featureName = configProperty.name();

        /* Load the enabled state and return */
        return featureFlagResolver.isFeatureEnabled(featureName);
~~~

The logic to resolve the feature into a boolean is delegated to another class which is injected by CDI, [FeatureFlagResolver][FeatureFlagResolver_class]. This has the request context information available, and gets the Config instance through CDI also. 

~~~ java
@RequestScoped
public class FeatureFlagResolver {

    /**
     * The headers associated with the request.
     */
    @Context
    private HttpHeaders headers;

    /**
     * The config source
     */
    @Inject
    private Config config;

    /* rest of implementation here */
}		
~~~

While in initial testing it did not seem to be required to define our custom `FeatureProperty` annotation as a Qualifier, it is preferable to include to avoid future ambiguous dependencies. 



## Conclusion

Using this approach we can use a standard part of the MicroProfile specification, with a bit of custom loading and conversion code, to handle loading our feature toggle definitions from a variety of sources. This includes the possibility to have flags which can be defined by an API call, or can use default settings which are bundled in through configuration with the application (or even system properties or environment variables) if the API does not know about them. 

To avoid potential clashes, a production scale implementation of this system would incorporate a naming scheme which is specific to your software. This could additionally be used to limit the scope of the feature toggles that an application loads from a remote source (as a micro service may only be interested in a handful of feature flags). 

The sample feature flag resolver is a simple implementation as an example. For production usage, or conversion into a library, this could be modified to include additional flipping strategies or at least the required extension points to allow this to be customisable. This could take a few different forms:

1. setting the default strategy
2. allowing the "FeatureProperty" annotation to take in an optional class parameter with the resolution strategy to use
3. providing a mechanism for the feature definition to determine the resolution strategy 


The combination of the Config feature and CDI looks like a workable, and relatively clean, solution to implement a feature toggle client.

[config]: https://microprofile.io/project/eclipse/microprofile-config "MicroProfile Configuration Feature"
[config_converters]: https://github.com/eclipse/microprofile-config/blob/master/spec/src/main/asciidoc/converters.asciidoc "Converter"
[configsources]: https://github.com/eclipse/microprofile-config/blob/master/spec/src/main/asciidoc/configsources.asciidoc "Config Sources"
[payara_configsources]: https://docs.payara.fish/documentation/microprofile/config.html "Eclipse MicroProfile Config API"
[injectionpoint]: https://docs.oracle.com/javaee/7/api/javax/enterprise/inject/spi/InjectionPoint.html "Interface InjectionPoint"
[payara_cachemanager]: https://github.com/payara/Payara-Server-Documentation/blob/master/documentation/payara-server/jcache/jcache-accessing.adoc "Accessing the Caching Provider and Cache Manager"

[ConfigSource_javadoc]: https://download.eclipse.org/microprofile/microprofile-config-1.3/apidocs/org/eclipse/microprofile/config/spi/ConfigSource.html "ConfigSource (MicroProfile Config API 1.3 API)"
[Converter_javadoc]: https://download.eclipse.org/microprofile/microprofile-config-1.3/apidocs/org/eclipse/microprofile/config/spi/Converter.html "Converter (MicroProfile Config API 1.3 API)"

[ff4j_flipping]: https://github.com/ff4j/ff4j/wiki/Flipping-Strategies "Flipping Strategies"

[context_annotation]: https://docs.oracle.com/javase/7/docs/api/javax/naming/Context.html "Context (Java Platform SE 7 )"
[inject_annotation]: https://docs.oracle.com/javaee/6/api/javax/inject/Inject.html "Inject (Java EE 6 )"

[FeatureProperty_class]: https://github.com/dhutchison/microprofile-experiments/blob/master/src/main/java/com/devwithimagination/microprofile/experiments/config/featureflag/producer/FeatureProperty.java "microprofile-experiments/FeatureProperty.java at master · dhutchison/microprofile-experiments"
[ResolvedFeatureFlagProducer_class]: https://github.com/dhutchison/microprofile-experiments/blob/master/src/main/java/com/devwithimagination/microprofile/experiments/config/featureflag/producer/ResolvedFeatureFlagProducer.java "microprofile-experiments/ResolvedFeatureFlagProducer.java at master · dhutchison/microprofile-experiments"
[FeatureFlagResolver_class]: https://github.com/dhutchison/microprofile-experiments/blob/master/src/main/java/com/devwithimagination/microprofile/experiments/config/featureflag/resolver/FeatureFlagResolver.java "microprofile-experiments/FeatureFlagResolver.java at master · dhutchison/microprofile-experiments"
[FeatureFlagConfigSource_class]: https://github.com/dhutchison/microprofile-experiments/blob/master/src/main/java/com/devwithimagination/microprofile/experiments/config/featureflag/FeatureFlagConfigSource.java "microprofile-experiments/FeatureFlagConfigSource.java at master · dhutchison/microprofile-experiments"

[experiments_github]: https://github.com/dhutchison/microprofile-experiments "dhutchison/microprofile-experiments on GitHub"
