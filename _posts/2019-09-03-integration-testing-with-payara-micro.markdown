---
title: Integration Testing with Payara Micro
layout: post
series: A look in to MicroProfile
series_part: 3
categories:
- Development
tags:
- Maven
- Jacoco
summary: A look into integration testing options
date: 2019-09-03 00:00
slug: integration-testing-with-payara-micro
---
It should go without saying that in any piece of development testing is important. 

While unit testing can (and should) be used to test the individual components which make up a piece of software, there always comes a point where the software has to have a set of integration tests ran. Mocking of components can allow code to be tested in isolation, however if overdone all that has been achieved is testing the mocks. Integration tests should be ran in as close to a realistic deployment as possible, as the more differences which exist between the test environment and a production deployment, the more scope there is for bugs to slip through. Testing of a deployed component makes getting code coverage metrics more difficult than in regular unit tests, but is still possible. 

Frameworks such as the Jersey Test Framework can allow unit testing of JAX-RS REST endpoints that have been created, but this is not equivalent to a truly deployed component and so features such as CDI and the MicroProfile features I am looking into cannot easily be tested this way. While not related to MicroProfile, testing of DAO code is another area which has traditionally been an integration approach, as it required a running database server, but there are now libraries available that can allow this to be tested as unit tests. 

<!--more-->

## Database Testing

Originally this was not going to be part of this post as it does not relate to the MicroProfile features I will be looking into, but I came across this library while doing other research and felt it was worth briefly covering. 

Testing of DAO code has traditionally fallen on the "integration testing" side due to the need to have a database server instance available for testing. [otj-pg-embedded][otj-pg-embedded] is a testing library that allows a Postgres instance to be started in memory, and controlled by the JUnit test case. As a result, database tests can be performed as part of the unit test side, although ideally these should be split into a later suite of unit tests to allow the "fast" tests to run first. I have not looked into the performance overhead of setting this up for each test, but it won't be free of overhead. 

At the time of writing the current version of this library is 0.13.1 and includes Postgres 10.6. The README file shows an approach where, with a bit of code, the way the implementation is loaded could be changed to pick up a different version off of the classpath. While there are no versions of this classpath file available separately that I could find, the approach to create a packed version is contained in this script [repack-postgres.sh][repack_postgres].  

As well as the standard rule for just creating an embedded instance, there are implementations for [Flyway][flyway] and [Liquibase][liquibase] which allow the same scripts used for database deployments to be used to provision the database structures required for your tests. Note that at the time of writing the Flyway implementation does not support version 6,  due to a change in the constructor method signature of the core Flyway class. 

While in my example project the database scripts are in "src/test/resources", as the location is defined as being on the class path these scripts could equally come in as a dependency in a Jar file created by the deployment pipeline responsible for your database deployments. 

With this library, setting up a database and provisioning it with Flyway scripts from a directory on the classpath is a single line of code.

~~~ java
@Rule 
public PreparedDbRule db = EmbeddedPostgresRules.preparedDatabase(
          FlywayPreparer.forClasspathLocation("db/schema"));
~~~

This `PreparedDbRule` includes a `getTestDatabase()` method which returns a `javax.sql.DataSource` that can then either be used to get a connection from, or injected into the code being tested if it depended on using dependency injection in the container to get a SQL data source. 

The test case [EmbeddedPostgresTest][EmbeddedPostgresTest] shows a very basic example of how this can be used.

## The Test REST Endpoint

Before delving into the MicroProfile features, I set up a simple "Hello World" type of controller to test with first to get the setup right. 

This only exposes a single endpoint method which always returns the same hard-coded response. [HelloController][hello_controller].

~~~ java
@Path("/hello")
@Singleton
public class HelloController {

    @GET
    public String sayHello() {
        return "Hello World";
    }
}
~~~

While this is simple enough that it could just be unit tested, I wanted to setup this project so that I could deploy this in to Payara Micro and call it over a regular HTTP connection and verify it responded as expected. 


## Integration Test Setup

While there is support for [Payara Micro in Arquillian][payara_micro_arquillian], I have used a different approach to testing. In the [experiments project][experiments_github] that goes with this blog post series I have used the [Payara Micro Maven Plugin][payara_micro_maven_plugin] as part of the Maven "pre-integration-test" and "post-integration-test" lifecycle phases to start and stop an external Payara Micro instance around the integration test phase. 

The Payara Micro plugin configuration in the `pom.xml` file looks like this. Note that all the Java command line arguments supplied are because I am running my development environment on Java 11 now (specifically Amazon Corretto 11). 

~~~ xml
<plugins>
    ...
    <plugin>
        <groupId>fish.payara.maven.plugins</groupId>
        <artifactId>payara-micro-maven-plugin</artifactId>
        <version>1.0.5</version>
        <executions>
            <execution>
                <id>package-payara</id>
                <phase>package</phase>
                <goals>
                    <goal>bundle</goal>
                </goals>
            </execution>
            <execution>
                <id>start-payara</id>
                <goals>
                    <goal>start</goal>
                </goals>
            </execution>
            <execution>
                <id>pre-integration-payara</id>
                <phase>pre-integration-test</phase>
                <goals>
                    <goal>start</goal>
                </goals>
                <configuration>
                    <!-- start in the background -->
                    <daemon>true</daemon>
                </configuration>
            </execution>
            <execution>
                <id>post-integration-payara</id>
                <phase>post-integration-test</phase>
                <goals>
                    <goal>stop</goal>
                </goals>
            </execution>
        </executions>
        <configuration>
            <payaraVersion>5.192</payaraVersion>

            <deployWar>true</deployWar>

            <contextRoot>/</contextRoot>

            <javaCommandLineOptions>
                <!-- Java 9+ options -->
                <option>
                    <key>--add-opens</key>
                    <value>java.base/jdk.internal.loader=ALL-UNNAMED</value>
                </option>
                <option>
                    <key>--add-opens</key>
                    <value>jdk.management/com.sun.management.internal=ALL-UNNAMED</value>
                </option>
                <option>
                    <key>--add-exports</key>
                    <value>java.base/jdk.internal.ref=ALL-UNNAMED</value>
                </option>
                <option>
                    <key>--add-opens</key>
                    <value>java.base/java.lang=ALL-UNNAMED</value>
                </option>
                <option>
                    <key>--add-opens</key>
                    <value>java.base/java.nio=ALL-UNNAMED</value>
                </option>
                <option>
                    <key>--add-opens</key>
                    <value>java.base/sun.nio.ch=ALL-UNNAMED</value>
                </option>
                <option>
                    <key>--add-opens</key>
                    <value>java.management/sun.management=ALL-UNNAMED</value>
                </option>
                <option>
                    <key>--add-opens</key>
                    <value>java.base/sun.net.www.protocol.jrt=ALL-UNNAMED</value>
                </option>
            </javaCommandLineOptions>
        </configuration>
    </plugin>
    ...
</plugins>
~~~

The Maven failsafe plugin is used for performing Integration tests, and is used in the integration-test and verify phases of the lifecycle. 

By default test cases are identified as Integration Tests by [naming convention][failsafe_inclusion], although this can be customised. The documentation for [using the plugin with JUnit][failsafe_junit] also covers how to configure it based on JUnit categories, which are a more flexible approach to creating collections of tests. With a bit more configuration, categories can be used to ensure that fast tests are ran before the longer, more intensive, test suites. 


For most of the setup of Jacoco for test coverage, I referred to this brilliant article which you should read: [Creating Code Coverage Reports for Unit and Integration Tests With the JaCoCo Maven Plugin][petri]. I won't duplicate the steps gathered from that post, however as the code which is the focus of our integration tests is running in a separate server the normal approach to gathering integration test code coverage will not work. The Jacoco agent is required to be attached to the deployed Payara Micro instance.  


While the Jacoco plugin has been configured to set up the property "failsafeArgLine" with the required agent configuration to pass as an option to Payara Micro, I could not get this to work directly. It always resulted in a strange `Could not find or load main class "-javaagent:.Users.` exception, as if it was not interpreting the `-javaagent` part correctly. To work around this involved setting up the command option manually. 

To avoid hard coding a path to the jacoco-runtime jar I used the [properties goal][properties_goal] of the Maven Dependencies Plugin which resolves property values to the path of dependencies. The link previous includes the detail of the syntax, while this [answer on Stack Overflow][properties_so_answer] provides the example of usage which led me to this approach. 

Below is the relevant parts of the pom file which were added to setup this property resolution. 

~~~ xml

<properties>
    ...
    <jacoco.plugin.version>0.8.4</jacoco.plugin.version>
    <maven.dependency.plugin.version>3.1.1</maven.dependency.plugin.version>
   
    <!-- Properties for dependencies -->
    <!-- Must be listed in the dependencies section otherwise it will be null. -->
    <jacoco.agent.path>${org.jacoco:org.jacoco.agent:jar:runtime}</jacoco.agent.path>

</properties>

<dependencies>
    ...
    <!-- Coverage agent -->
    <dependency>
        <groupId>org.jacoco</groupId>
        <artifactId>org.jacoco.agent</artifactId>
        <version>${jacoco.plugin.version}</version>
        <classifier>runtime</classifier>
        <scope>test</scope>
    </dependency>
</dependencies>

<profiles>
    <profile>
      ...
      <build>
        <plugins>
          ...
          <plugin>
            <!-- Needed to process property links to dependencies.
                 See https://stackoverflow.com/a/6934552/230449 -->
              <groupId>org.apache.maven.plugins</groupId>
              <artifactId>maven-dependency-plugin</artifactId>
              <version>${maven.dependency.plugin.version}</version>
              <executions>
                  <execution>
                      <goals>
                          <goal>properties</goal>
                      </goals>
                  </execution>
              </executions>
          </plugin>
        </plugins>
      </build>
    </profile>
</profiles>

~~~

With this out the way an additional option could be specified to the Payara Micro command line options. This configures the agent path based on the property set up above, and to write the coverage to a local file which we will pick up at a later point for reporting. 

~~~ xml
    <javaCommandLineOptions>
        ...
        <!-- When running our integration tests, attach the jacoco agent -->
        <option>
            <value>-javaagent:${jacoco.agent.path}=destfile=target/coverage-reports/jacoco-it.exec,append=true</value>               
        </option>
    </javaCommandLineOptions>
~~~

It is worth noting that when multiple plugins are running as part of a phase, such as "post-integration-test", the order they are defined in the pom file matters. With the Jacoco agent configured this way, the coverage information will be written on shutdown of the Payara Micro instance so it is important that the Jacoco plugin is defined so "report" is ran after Payara Micro has shut down. Initially when trying to use the "failsafeArgLine" property I had moved the report to the "verify" phase instead of "post-integration-test", but as this didn't work I switched the order of the plugins back around. 


### The other way to use the Jacoco Agent
In the previous section the Jacoco setup relied on the fact the locally running server instance could store the coverage metric file to the local filesystem.

If, for a more realistic test, the deployed component under test was being ran on a remote host then this would not work. 

In the [Jacoco Agent][jacoco_agent] documentation there is another option for the output of the coverage data. With `tcpserver` the agent listens for incoming connections from a client. Once testing is complete the client can call the service on this exposed port to download the coverage file. This [article][dzone_coverage] includes detail of using the `dump` goal of the jacoco-maven-plugin to download the coverage file. 

Note that the `address` and `port` options will likely need customised to allow this to be remotely accessible. This is an unauthenticated service so it should be appropriately secured (through firewalls of otherwise) and only enabled in non-production environments.

## The Integration Test

With all this setup is place a simple integration test, [HelloControllerIT][HelloControllerIT], could be written.

This uses the [MicroProfile Rest Client][microprofile_rest_client].

> The MicroProfile Rest Client provides a type-safe approach to invoke RESTful services over HTTP. As much as possible the MP Rest Client attempts to use JAX-RS 2.0 APIs for consistency and easier re-use.
>
> --<cite>[Rest Client for MicroProfile][microprofile_rest_client]

Assuming our base URL is being supplied in, the body of the test method is only a few lines of code. 

~~~ java
        final URI uri = new URI(BASE_URL);

        HelloControllerClient client = RestClientBuilder.newBuilder()
            .baseUri(uri)
            .build(HelloControllerClient.class);

        String message = client.sayHello();
        Assert.assertEquals("Expected messages to match", "Hello World", message);
~~~

I am aiming to revisit this framework in more detail at a later date, but it allows an interface with JAX-RS annotations to be used with the framework providing all the HTTP caller implementation. When combined with the ability to import from an OpenAPI definition this becomes a powerful tool to ensure tests are written to conform to the published specification of an API. 

## Conclusion

This is in no way a complete picture of how to do integration testing, but does answer some of the issues I have been wanting to solve for a while. This setup should provide a firm basis for further developments, and verifying that the setup continues to work as changes are built up over time.  

The sample project this blog series is working on building up, with the complete set of code and pom file, is available [here][experiments_github].
 

[payara_micro_arquillian]: https://blog.payara.fish/how-to-test-applications-with-payara-server-micro-with-arquillian "How to Test Applications with Payara Server & Micro with Arquillian"

[payara_micro_maven_plugin]: https://docs.payara.fish/documentation/ecosystem/maven-plugin.html "Payara Micro Maven Plugin"

[experiments_github]: https://github.com/dhutchison/microprofile-experiments "dhutchison/microprofile-experiments on GitHub"
[hello_controller]: https://github.com/dhutchison/microprofile-experiments/blob/master/src/main/java/com/devwithimagination/microprofile/experiments/HelloController.java "microprofile-experiments/HelloController.java at master · dhutchison/microprofile-experiments"
[EmbeddedPostgresTest]: https://github.com/dhutchison/microprofile-experiments/blob/master/src/test/java/com/devwithimagination/microprofile/experiments/dao/EmbeddedPostgresTest.java "microprofile-experiments/EmbeddedPostgresTest.java at master · dhutchison/microprofile-experiments"
[HelloControllerIT]: https://github.com/dhutchison/microprofile-experiments/blob/master/src/test/java/com/devwithimagination/microprofile/experiments/it/HelloControllerIT.java "microprofile-experiments/HelloControllerIT.java at master · dhutchison/microprofile-experiments"

[failsafe_inclusion]: https://maven.apache.org/surefire-archives/surefire-2.19/maven-failsafe-plugin/examples/inclusion-exclusion.html "Maven Failsafe Plugin – Inclusions and Exclusions of Tests"

[failsafe_junit]: https://maven.apache.org/surefire/maven-failsafe-plugin/examples/junit.html "Maven Failsafe Plugin – Using JUnit"


[petri]: https://www.petrikainulainen.net/programming/maven/creating-code-coverage-reports-for-unit-and-integration-tests-with-the-jacoco-maven-plugin/ "Creating Code Coverage Reports for Unit and Integration Tests With the JaCoCo Maven Plugin"

[jacoco_agent]: https://www.eclemma.org/jacoco/trunk/doc/agent.html "JaCoCo - Java Agent"

[dzone_coverage]: https://dzone.com/articles/verifying-end-to-end-test-code-coverage-using-jaco "Verifying End-to-End Test Code Coverage Using Jacoco Agent - DZone DevOps"

[properties_so_answer]: https://stackoverflow.com/a/6934552/230449 "Can I use the path to a Maven dependency as a property? - Stack Overflow"
[properties_goal]: https://maven.apache.org/plugins/maven-dependency-plugin/properties-mojo.html "Apache Maven Dependency Plugin – dependency:properties"

[otj-pg-embedded]: https://github.com/opentable/otj-pg-embedded "opentable/otj-pg-embedded: Java embedded PostgreSQL component for testing"
[repack_postgres]: https://github.com/opentable/otj-pg-embedded/blob/master/repack-postgres.sh "otj-pg-embedded/repack-postgres.sh at master · opentable/otj-pg-embedded"
[liquibase]: https://www.liquibase.org "Liquibase | Database Refactoring | Liquibase"
[flyway]: https://flywaydb.org "Flyway by Boxfuse • Database Migrations Made Easy."

[microprofile_rest_client]: https://github.com/eclipse/microprofile-rest-client "eclipse/microprofile-rest-client: MicroProfile Rest Client"
