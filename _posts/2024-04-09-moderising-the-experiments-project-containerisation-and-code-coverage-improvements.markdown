---
title: Moderising the Experiments Project - Containerisation and Code Coverage Improvements
layout: post
series: A look in to MicroProfile
series_part: 5
summary: Solving 4 years of technical debt and adding containerisation to the project.
categories:
- Development
tags:
- Docker
- Jacoco
- Java
- MicroProfile
- Testcontainers
date: 2024-04-09 21:43
slug: moderising-the-experiments-project-containerisation-and-code-coverage-improvements
---
Wow, it's been over 4 years since the last post in this series. At that point I had hit all the key features that I thought I needed to learn for an upcoming project, and then moved on to other things. Now I'm coming up to some work where I may need this sample application for looking into aspects of [OpenTelemetry][opentelemetry] - so it is time for some updates.

The [microprofile-experiments](https://github.com/dhutchison/microprofile-experiments) project was really out of date. [This PR](https://github.com/dhutchison/microprofile-experiments/pull/2/files) brings the project up to the latest versions of most dependencies, but also includes some notable improvements.

The PR looks bigger than the changes really are however, mostly due to a combination of the `javax` to `jakarta` [namespace change][jakarta-namespace-change] and the code formatter setup altering the expected import order.

<!--more-->

## Packaging

Previously this project built a war file and used the [Payara Micro maven plugin][payara-micro-maven-plugin] to run the application, including for running integration tests.

This now includes a [Dockerfile](https://github.com/dhutchison/microprofile-experiments/blob/139b72cc668b225c148e09fb0a9dc9ef74d6965e/Dockerfile) and uses the [Docker maven plugin][docker-maven-plugin] to build this container image as part of the Maven `package` lifecycle phase. This packaging setup is more akin to what I do day-to-day, and shows how we can run integration tests against a containerised applications ahead of their deployment. This also should allow me to in future swap out the MicroProfile application server without requiring to change the test setup (in theory).

Building container images as part of the maven lifecycle is easy using this plugin (plus the [documentation][docker-maven-plugin-build-docs] for it is pretty good)

```xml
<plugin>
    <groupId>io.fabric8</groupId>
    <artifactId>docker-maven-plugin</artifactId>

    <configuration>
        <images>
            <image>
                <name>devwithimagination/microprofile-experiments</name>
                <build>
                    <contextDir>${project.basedir}</contextDir>
                    <tags>
                        <tag>latest</tag>
                        <tag>${project.version}</tag>
                    </tags>
                </build>
            </image>
        </images>
    </configuration>

    <executions>
        <execution>
            <id>build</id>
            <phase>package</phase>
            <goals>
                <goal>build</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

Note that this is only a sample `Dockerfile`, based off the `amazoncorretto:17-alpine` base image. This is not meant to be an example of a minimised and hardened image - your requirements will likely vary, but the general principle that the less the image contains, the less scope there is for vulnerabilities usually applies.


## Integration Test Coverage

When we used the Payara Micro Maven plugin this project added a jacoco agent to the running Payara Micro instance by customising the java command line options to include a `-javaagent`, which was configured to write to a local file.

With a Docker setup this gets a little bit more complicated, as we do not want to:
* include the Jacoco agent in the "production" image build
* encounter issues with file permissions for the capture file
* keep the container running after the tests have complete to be able to capture coverage information after all the tests - I've seen issues with this before (especially with plugin lifecycle inheritance) that can make this painful and modifying the lifecycle can cause containers to be left running after failures

In this example project I use the [Testcontainers][testcontainers] library to manage running the container as part of the `JUnit` integration tests. To avoid starting and stopping containers for every test, this uses the [manual container lifecycle control][testcontainers-manual] approach where each of our integration tests extends a common [AbstractBaseIT](https://github.com/dhutchison/microprofile-experiments/blob/139b72cc668b225c148e09fb0a9dc9ef74d6965e/src/test/java/com/devwithimagination/microprofile/experiments/it/AbstractBaseIT.java) class. This has two main parts to it.


### Setup

The container setup is performed once by a `static` block that starts up our container.

```java
import org.testcontainers.containers.BindMode;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;
import io.restassured.RestAssured;

...

    static final GenericContainer<?> API_CONTAINER;
    static {

        API_CONTAINER = new GenericContainer<>(DockerImageName.parse("devwithimagination/microprofile-experiments:latest"))
            .withExposedPorts(8080, 6300)
            .waitingFor(Wait.forHttp("/health").forStatusCode(200))
            .withFileSystemBind("./target/jacoco-agent", "/opt/jacoco/agent", BindMode.READ_ONLY)
            .withEnv("JAVA_OPTS", "-javaagent:/opt/jacoco/agent/org.jacoco.agent-runtime.jar=output=tcpserver,address=*,port=6300")
            .withEnv("PAYARA_OPTS", "--noHazelcast");

        API_CONTAINER.start();

        /* Setup the base URL for RestAssured */
        final String baseUrl = "http://" + API_CONTAINER.getHost() + ":" + API_CONTAINER.getMappedPort(8080) + "/experiments/data/";

        RestAssured.baseURI = baseUrl;

    }
```

The `GenericContainer` definition contains a few key steps:

* `.waitingFor` defines that startup should wait on the container to reach a healthy state (based on the MicroProfile health endpoint), waiting for a maximum of 60 seconds (the default, which can be changed as required)
* `. withFileSystemBind` mounts a volume into the container to include the Jacoco agent file. The `maven-dependency-plugin` is used in the `pom.xml` file to copy this agent into this location (without a version number) for ease of use. This removes our need to build this agent into the container image.
* `.withEnv("JAVA_OPTS"` sets the `JAVA_OPTS` environment variable exposed by the container to allow the Jacoco agent to be set. This is configured to run on port 6300 in the container which is also exposed


### Capture Coverage

A `captureCoverage` method that runs after all tests in a single test file. There currently is no test lifecycle hook that is called after every test has completed, only for after a single test or a single test class (we use the latter here).

```java
import org.jacoco.core.tools.ExecDumpClient;
import org.jacoco.core.tools.ExecFileLoader;
import org.junit.jupiter.api.AfterAll;
...

    @AfterAll
    static void captureCoverage() throws IOException {

        ExecDumpClient jacocoClient = new ExecDumpClient();
        ExecFileLoader dump = jacocoClient.dump(API_CONTAINER.getHost(), API_CONTAINER.getMappedPort(6300));
        dump.save(new File("./target/coverage-reports/jacoco-it.exec"), true);

    }
```

This uses a Jacoco client class (provided by the `org.jacoco:org.jacoco.core` library) to contact a port on the running container to get the coverage information, and update a file with the new information. This appends to the existing file, so each test cases ran adds coverage. As this file is cleaned between test runs, nothing from a previous run should persist.

## Developer Usability

### Devcontainer

This is a minor usability point, but I've long accepted that the Java setup on my laptop should never be considered consistant or stable. I know there are ways to switch between versions, but I always forget the commands for these and end up needing to look them up every time. I do the majority of my Java development in VSCode these days, so the project now contains a [devcontainer](https://containers.dev) definition. This ensures the correct Java version is installed, maven and docker-in-docker are available, and a number of VSCode plugins are configured.

I read recently that IntelliJ had added support for devcontainers, but it only appears to be available in the Ultimate edition and not the community edition.


### Code Formatting

The project now uses a number of plugins (based on the [OSS Quickstart Archetype][oss-quickstart]) to ensure the code is formatted a certain way. There are some aspects of this that are not the way I would usually format my code, but from doing plenty of Python development in recent years I've grown to accept the role of opinionated code formatters - all that really matters is that the end code is in a consistent format.

These plugins are:
* [formatter-maven-plugin][formatter-maven-plugin] - for formatting the code
* [impsort-maven-plugin][impsort-maven-plugin] - for organising the imports


## Next Steps?

Well that is the project is a better state for the next few years. I'll likely be experimenting with [OpenTelemetry][opentelemetry] next (at least on the Java side of my tinkering).

[opentelemetry]: https://microprofile.io/specifications/microprofile-telemetry/ "microprofile-telemetry - MicroProfile"

[docker-maven-plugin]: https://github.com/fabric8io/docker-maven-plugin "fabric8io/docker-maven-plugin: Maven plugin for running and creating Docker images"
[docker-maven-plugin-build-docs]: https://dmp.fabric8.io/#docker:build "fabric8io/docker-maven-plugin"
[payara-micro-maven-plugin]: https://docs.payara.fish/community/docs/documentation/ecosystem/maven-plugin.html "Payara Micro Maven Plugin :: Payara Community Documentation"

[formatter-maven-plugin]: https://github.com/revelc/formatter-maven-plugin "revelc/formatter-maven-plugin: Formatter Maven Plugin"
[impsort-maven-plugin]: https://github.com/revelc/impsort-maven-plugin "revelc/impsort-maven-plugin: Java import sorter plugin. Sort your imps!"


[jakarta-namespace-change]: https://jakarta.ee/blogs/javax-jakartaee-namespace-ecosystem-progress/ "Javax to Jakarta Namespace Ecosystem Progress - The Eclipse Foundation"

[oss-quickstart]: https://www.morling.dev/blog/introducing-oss-quickstart-archetype/ "Introducing the OSS Quickstart Archetype - Gunnar Morling"

[testcontainers]: https://java.testcontainers.org "Testcontainers for Java"
[testcontainers-manual]: https://java.testcontainers.org/test_framework_integration/manual_lifecycle_control/ "Manual container lifecycle control - Testcontainers for Java"
