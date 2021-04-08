---
title: Revisiting Selective Code Generation from OpenAPI Specifications
series: Selective Code Generation from OpenAPI Specifications
series_part: 2
summary: openapi-generator now has tag support, and is the better option for code
  generation from OpenAPI specifications now.
categories:
 - Development
tags:
 - OpenAPI
 - swagger-codegen
 - openapi-generator
date: 2021-04-07 22:19
slug: revisiting-code-generation
---
I have now moved fully to using the [openapi-generator][openapi-generator] for generating code from OpenAPI specifications, instead of the "official" [swagger-codegen][swagger-codegen]. This fork, by some of the original maintainers, has a much more active community & development pace over the original project. My [PR][pr-link] to improve tag support in swagger-codegen is still sitting with no activity more than 6 months on.

Using tags as part of generation has been supported for all JAX-RS based generators as of version 5 of openapi-generator. I am using this through through the maven plugin, which correctly integrates with maven to add generated sources to the sources paths. We use this with the `generate` goal linked to the maven lifecycle so code generation is performed in every build of the project, so we can be sure that the code in the produced artefact reflects the specification in the repository. 

The maven plugin has very [detailed documentation][openapi-maven] with all the configuration options available for it, but going into this it is worth noting that some of the terminology is different between the two forks of the plugin. This is reflected in the documentation. Individual generators are [documented here][openapi-generator-docs].

<!--more-->

With the maven plugin, to generate an API endpoint file containing all the endpoints tagged with "Pet" we could configure the plugin like this:

~~~ xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <!-- RELEASE_VERSION -->
    <version>5.1.0</version>
    <!-- /RELEASE_VERSION -->
    <dependencies>
        <dependency>
            <!-- Our specification comes from a dependency --> 
            <groupId>${project.groupId}</groupId>
            <artifactId>sample-schema</artifactId>
            <version>${project.parent.version}</version>
        </dependency>
    </dependencies>
    <executions>
        <execution>
            <goals>
                <goal>generate</goal>
            </goals>
            <configuration>
                <!-- specify the OpenAPI spec -->
                <inputSpec>openapi.yaml</inputSpec>

                <!-- target to generate jaxrs spec code -->
                <generatorName>jaxrs-spec</generatorName>
                <!-- restrict the APIs to generate -->
                <apisToGenerate>Pet</apisToGenerate>

                <!-- pass any necessary config options -->
                <configOptions>
                    <dateLibrary>java8</dateLibrary>

                    <!-- Generate API files based on tags -->
                    <useTags>true</useTags>
                </configOptions>
            </configuration>
        </execution>
    </executions>
</plugin>

~~~


As with swagger-codegen, tags as they are used in the maven plugin configuration have all non alphanumeric characters removed. 

The project also contains an [example][multi-module-example] repository showing how a multi-module maven project could be created to produce artefacts for a specification as well as separate modules for client and server generated artefacts.

[swagger-codegen]: https://github.com/swagger-api/swagger-codegen/tree/3.0.0 "swagger-api/swagger-codegen at 3.0.0"
[pr-link]: https://github.com/swagger-api/swagger-codegen-generators/pull/740 "[JAVA] Refactor so 'useTags' feature is available for all AbstractJavaJAXRSServerCodegen implementations by dhutchison - Pull Request #740 - swagger-api/swagger-codegen-generators"

[openapi-generator]: https://github.com/OpenAPITools/openapi-generator "OpenAPITools/openapi-generator: OpenAPI Generator allows generation of API client libraries (SDK generation), server stubs, documentation and configuration automatically given an OpenAPI Spec (v2, v3)"
[openapi-maven]: https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin "openapi-generator/modules/openapi-generator-maven-plugin at master - OpenAPITools/openapi-generator"
[openapi-generator-docs]: https://github.com/OpenAPITools/openapi-generator/tree/master/docs/generators "openapi-generator/docs/generators at master - OpenAPITools/openapi-generator"

[multi-module-example]: https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin/examples/multi-module "openapi-generator/modules/openapi-generator-maven-plugin/examples/multi-module at master - OpenAPITools/openapi-generator"
