---
title: Selective Generation with Swagger Codegen
summary: How to restrict the server stubs Swagger Codegen generates
series: Selective Code Generation from OpenAPI Specifications
series_part: 1
categories:
- Development
tags:
- OpenAPI
- swagger-codegen
date: 2020-05-16 20:38
slug: selective-generation-with-swagger-codegen
---
Swagger Codegen is a tool for generating server stubs and client SDKs for any API defined with an OpenAPI specification. This is particularly useful when you are following a [spec-first API development][spec-first-api-development] approach. 

When generating the stub code for the backend powering the API, it may not always be desirable to generate stubs for every endpoint in the same module. This will depend on the number of endpoints in your API definition, and your approach to the contents of deployed services (Microservices or otherwise). There does not appear to be a documented way to only generate stubs for some API paths using this tool. There does however appear to be an undocumented one. 

<!--more-->

## Sample Setup

As a sample for testing I used the USPTO [sample OpenAPI specification][openapi-specification-examples]. This contains three API paths:
* /
* /{dataset}/{version}/fields
* /{dataset}/{version}/records

For testing I am using a docker container for the generator, but there are other ways to install and run the CLI. A basic run of the generator for this API produces the following files.

~~~ bash
dhutchison@procent:~/codegen-test$ sudo docker run --rm -it -v $(pwd):/codegen swaggerapi/swagger-codegen-cli-v3 generate --lang jaxrs-spec --input-spec https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/uspto.yaml --output /codegen

dhutchison@procent:~/codegen-test$ tree .
.
├── pom.xml
├── src
│   └── gen
│       └── java
│           └── io
│               └── swagger
│                   ├── api
│                   │   ├── DatasetApi.java
│                   │   ├── DefaultApi.java
│                   │   └── RestApplication.java
│                   └── model
│                       ├── Body.java
│                       ├── DataSetListApis.java
│                       └── DataSetList.java
└── swagger.json

7 directories, 8 files
~~~

In this, the first file in the `io.swagger.api` package contains the APIs under the "/{dataset}" path, with the second file containing the API under the "/" path.

## Restricting the Generation

I went hunting through the code and found [this piece of code][system-property-usage]. The code generator looks for a system property, "apis", containing a comma separated list of paths. If it is not empty then it uses this to filter what is generated. 

The `paths` map keys that are compared to can change depending on the language generator implementation in use. I am only interested in the JAX-RS implementations. Specifically I've had a look at the "jaxrs-spec" and "jaxrs-jersey" implementations. 

Both of the JAX-RS implementations will use the first path element as their map key, so in this example the two items that can be filtered down to will be:
* "" - an empty string
* "{dataset}"


~~~ bash
dhutchison@procent:~/codegen-test$ sudo docker run --rm -it -v $(pwd):/codegen swaggerapi/swagger-codegen-cli-v3 generate --lang jaxrs-spec --input-spec https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/uspto.yaml --output /codegen  -D apis={dataset}

dhutchison@procent:~/codegen-test$ tree .
├── src
│   └── gen
│       └── java
│           └── io
│               └── swagger
│                   └── api
│                       └── DatasetApi.java
└── swagger.json

6 directories, 2 files

~~~

The "jaxrs-jersey" implementation can use tags instead if the additional property `useTags` is set to true.


~~~ bash
dhutchison@procent:~/codegen-test$ sudo docker run --rm -it -v $(pwd):/codegen swaggerapi/swagger-codegen-cli-v3 generate --lang jaxrs-jersey --input-spec https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/uspto.yaml --output /codegen --additional-properties useTags=true -D apis=Metadata

dhutchison@procent:~/codegen-test$ tree .
.
└── src
    ├── gen
    │   └── java
    │       └── io
    │           └── swagger
    │               └── api
    │                   ├── MetadataApi.java
    │                   └── MetadataApiService.java
    └── main
        └── java
            └── io
                └── swagger
                    └── api
                        ├── factories
                        │   └── MetadataApiServiceFactory.java
                        └── impl
                            └── MetadataApiServiceImpl.java

13 directories, 4 files
~~~

Note that when it comes to tags, it appears to require the first character to be uppercase, regardless on if this is in the definition or not. 

This additional property will also have the side effect of creating Service definition files split at the tag level instead of the path level. 


## Potential Improvements
Both of these approaches may result in a lot of API endpoints in a single file. If you were wanting to customise this behaviour to allow more fine grain creation of controllers, it looks like you would need to [add your own generator implementation][add-generator-impl] in order to to override the behaviour of the [addOperationToGroup][jaxrs-spec-addOperationToGroup] method which determines the `basePath` map keys. 


[swagger-codegen]: https://swagger.io/tools/swagger-codegen/ "API Code & Client Generator - Swagger Codegen"
[spec-first-api-development]: https://www.atlassian.com/blog/technology/spec-first-api-development "Using spec-first API development for speed and sanity – Work Life by Atlassian"

[system-property-usage]: https://github.com/swagger-api/swagger-codegen/blob/81bbdbe1d528e5b639e5df79ea29fb734e0613f2/modules/swagger-codegen/src/main/java/io/swagger/codegen/v3/DefaultGenerator.java#L472 "DefaultGenerator implementation which references the system property"

[openapi-specification-examples]: https://github.com/OAI/OpenAPI-Specification/tree/master/examples/v3.0 "OpenAPI-Specification/examples/v3.0 at master - OAI/OpenAPI-Specification"

[add-generator-impl]: https://github.com/swagger-api/swagger-codegen-generators/wiki/Adding-a-new-generator-for-a-language-or-framework. "Adding a new generator for a language or framework. - swagger-api/swagger-codegen-generators Wiki"

[jaxrs-spec-addOperationToGroup]: https://github.com/swagger-api/swagger-codegen-generators/blob/653630df89eb96e1293685dd01d3151b741321ef/src/main/java/io/swagger/codegen/v3/generators/java/JavaJAXRSSpecServerCodegen.java#L128 "addOperationToGroup method from JavaJAXRSSpecServerCodegen"
