---
title: Apache as a Reverse Proxy to GlassFish
summary: Working with Apache as a proxy with certificate authentication.
date: 2015-08-13 21:27
slug: apache-as-a-reverse-proxy-to-glassfish
---
This is largely just my notes on this problem. It seems like it should be a relatively simple thing to set up, but scattershot documentation, strange failure behaviours and undocumented inconsistencies have made this a major headache to figure out.

<!--more-->

## What are we trying to achieve?

![Client to Apache (SSL, with Client Cert) to GlassFish (Retaining Client Cert authentication)][what]

Our test client -> Apache HTTPD Proxy (SSL, with Client Cert) -> GlassFish (Retaining Client Cert authentication)
    
## What options are available?
    
There are two approaches which appear to be available between Apache and GlassFish, both using Apache as the SSL terminator:

1. AJP connector
2. HTTP using `auth-pass-through-enabled`

The implementation of the server side component also matters, as Java EE defines three methods of implementing a Web service: 

1. A JAX-RPC or JAX-WS service endpoint running in a web container
2. Stateless Session EJB as a JAX-RPC or JAX-WS web service
3. Singleton Session EJB as a JAX-WS web service

The source of this is section 5.3.2 of [JSR-000109 Implementing Enterprise Web Services 1.4 Maintenance Release 3 for Evaluation][jsr]. 

In addition to these there are also just plain Servlets deployed in a War file.

As you can see, there are two containers in use for these methods: Web and EJB. Each of these containers have their own security systems which appear to not inconsistent in my tests, although I could not find documentation detailing this.

Spoiler: Only the AJP connector behaves the same in the two containers, so it is the only option to allow proxied client certificate authentication in the EJB container. At the bottom of this article there is a [conclusion](#Conclusion) detailing which implementation and container combinations work.

## The test setup

I have created a [project][sample_proj] on my GitHub account containing sample code covering the first two web service implementation options as well as a plain servlet.

Any configuration in this test is just as an example, obviously assess any options for security before applying to a production environment.

The *ApacheSiteConfig* folder contains two files:

- proxytest.conf
    - The site configuration used in testing
- RequiredModules.txt
    - Text file detailing the required modules for this test.

Example configuration files contain references to three servers:

- dev-lamp.local
    - Apache/2.4.7 (Ubuntu)
- dev-gf3.local
    - GlassFish Server Open Source Edition 3.1.2.2
- dev-gf4.local
    - GlassFish Server Open Source Edition 4.1
	  - I did encounter a bug in GlassFish which [required a patch][glassfish_grizzly_bug]. 


Our base site configuration in Apache requires "mod_ssl" to be enabled and these configuration options to set up SSL.

    DocumentRoot /home/wwwroot/dwi
    ServerName dev-lamp.local
    ErrorLog /var/log/apache2/dwi-dev.local-ssl-error.log
    
    SSLEngine on
    SSLCipherSuite ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv2:+EXP
    
    SSLCertificateFile      certs/devlamp.crt
    SSLCertificateKeyFile   certs/devlamp.key
    SSLCACertificateFile certs/devca.pem
    
The "SSLCertificateFile" and "SSLCertificateKeyFile" settings relate to the server SSL certificate. 

The "SSLCACertificateFile" setting defines the CA which client certificates are trusted for.

## AJP connector

This approach uses the [Apache JServ Protocol (AJP)][ajp] to communicate between Apache HTTPD and a JK Enabled listener on the GlassFish server.

To create a new JK enabled listener in GlassFish the following commands can be run in the `asadmin` console, where "jk-listener" is the name of the listener to create:

    asadmin> create-http-listener --listenerport 8009 --listeneraddress 0.0.0.0 --defaultvs server jk-listener
    asadmin> create-network-listener --protocol jk-listener --listenerport 8009 --jkenabled true jk-connector
    
On the Apache HTTPD server side of things this requires the "mod_proxy" and "mod_proxy_ajp" modules to be enabled. This can be performed by using the `a2enmod` command:

    a2enmod proxy
    a2enmod proxy_ajp
    

### Proxying WAR module traffic

In order to test the authentication behaviour of both a Web Service and a Servlet in a WAR file two locations were created in the Apache configuration:

    <Location /warajp3>
        SSLOptions +ExportCertData
        SSLVerifyClient require
        SSLVerifyDepth 1
        ProxyPass ajp://dev-gf3.local:8009
    </Location>
    
    <Location /warajp4>
        SSLOptions +ExportCertData
        SSLVerifyClient require
        SSLVerifyDepth 1
        ProxyPass ajp://dev-gf4.local:8009
    </Location>

These location configurations are identical with the exception of the server they route to. Both of the target GlassFish servers appear to behave the same.

The sample project exposes the urls:

- https://dev-lamp.local/warajp3/whoami
    - The resource path for this on the GlassFish server is "*/whoami*"
    - This is a servlet which will print information on the client certificate which was used to authenticate.
    - This can be viewed in a web browser configured with an appropriate Client SSL Certificate (I was using Safari for my tests).
- https://dev-lamp.local/warajp3/WarWSService
    - The resource path for this on the GlassFish server is "*/WarWSService*"
    - This is a JAX-WS Web Service which will return details of the certificate which has been used to authenticate.
    - The project contains a "*TestClient*" class to call this web service. This is not a proper test case, just code which calls a set of URLs and outputs the results. The "Run Test Client" Ant target can be used to run this. 
        - *Note: * This Ant target contains hard coded details of a key store which contains the Client Certificate to authenticate with the service. It is not configured with proper dependency management, learning maven is for another day.


### Proxying EAR web service traffic

To test this proxy setup, two specific locations were added to the site configuration to proxy using AJP.

    <Location /earajp3>
        # Substitute filter is required because we are prefixing the URL path, and because source port not transfering through correctly
        AddOutputFilterByType SUBSTITUTE text/xml
        Substitute "s|https://dev-lamp.local:80/|https://dev-lamp.local/earajp3/|ni"

        SSLOptions +StdEnvVars +ExportCertData
        SSLVerifyClient require
        SSLVerifyDepth 1
        ProxyPass ajp://dev-gf3.local:8009/
    </Location>
    
    <Location /earajp4>
        # substitute filter only required because we are prefixing the URL path - not required if matching
        AddOutputFilterByType SUBSTITUTE text/xml
        Substitute "s|https://dev-lamp.local:443/|https://dev-lamp.local/earajp4/|ni"
        
        SSLOptions +StdEnvVars +ExportCertData
        SSLVerifyClient require
        SSLVerifyDepth 1
        ProxyPass ajp://dev-gf4.local:8009/
    </Location>
    
These locations are nearly identical again to route to the two different application servers. The "mod_substitue" module is required to update the URLs exposed in the WSDLs for these Web Services. This will be covered in more detail later.

Two Web Service URLs are exposed for each container. These are tested by the same "TestClient" class as above.

- https://dev-lamp.local/earajp3/HelloWS?wsdl
    - This is a stateless EJB Web Service which will contains a method `getHelloWithAuth(String name)` which will return the suppled text along with details of the user principal from the client certificate.
- https://dev-lamp.local/earajp3/HelloTwoWS?wsdl
    - Another stateless EJB Web Service which the test client class will access. This one uses an invalid configuration of the `login-config` in the `sun-ejb-jar.xml` deployment descriptor.

### WSDL URLs - A difference between GF3 and GF4

As alluded to above, in GlassFish 4.1 an AJP proxy with the same resource path does not require additional substitution.

For instance `https://dev-lamp.local/HelloTwoWS?wsdl` proxying to `ajp://dev-gf4.local:8009/HelloTwoWS?wsdl` with the following configuration works in GlassFish 4:

    <Location />                
        SSLOptions +StdEnvVars +ExportCertData
        SSLVerifyClient require
        SSLVerifyDepth 1
        ProxyPass ajp://dev-gf4.local:8009/
    </Location> 

In GlassFish 3 this configuration is not enough, the URLs in the WSDL appear like `https://dev-lamp.local:80/HelloTwoWS`. Note the incorrect port.

To correct this we require to use "mod_substitute". The complete location definition for GlassFish 3 is:

    <Location />
        AddOutputFilterByType SUBSTITUTE text/xml
        Substitute "s|https://dev-lamp.local:80/|https://dev-lamp.local/|ni"
        SSLOptions +StdEnvVars +ExportCertData
        SSLVerifyClient require
        SSLVerifyDepth 1
        ProxyPass ajp://dev-gf3.local:8009/
    </Location> 

### The invalid sun-ejb-jar.xml

As noted in the previous section, a second stateless EJB web service was deployed.

In our tests, the URL `https://dev-lamp.local/HelloTwoWS?wsdl` referred to an EJB defined as:

    <ejb>
        <ejb-name>com.devwithimagination.proxy.ws.HelloTwo</ejb-name>
        <webservice-endpoint>
            <port-component-name>HelloTwoWS</port-component-name>
            <endpoint-address-uri>HelloTwoWS</endpoint-address-uri>
            <login-config>
                <auth-method>CLIENT-CERT</auth-method>
                <realm-name>certificate</realm-name>
            </login-config>
            <transport-guarantee>CONFIDENTIAL</transport-guarantee>
        </webservice-endpoint>
    </ejb>

So what is wrong with this deployment descriptor? `realm-name` should just be `realm`. I was surprised to see that this deploys at all, although it does emit a warning in the GlassFish server log on deployment. Surprisingly it works as expected also in both GlassFish 3 and 4. This test had initially been added as it was suspected this incorrect deployment descriptor was impacting on the authentication. This suspicion was later found to be incorrect.

## HTTP using auth-pass-through-enabled

Oracle offers a load balancing plugin with the commercial GlassFish server distribution which uses HTTP between the proxy and the GlassFish server[^1]. This approach attempts to replicate this functionality using standard Apache HTTPD functionality. 

For reference, the documentation on how to configure this plugin is [Configuring the HTTP Load Balancer][oracle_lb_conf].

There are two settings in the GlassFish server which come in to play for this setup.

1. `auth-pass-through-enabled`
2. `proxyHandler`

This approach only works correctly with the services which are deployed in the Web container, and are part of the War file: the Servlet and Web Service.

### The "auth-pass-through-enabled" Attribute

    When the GlassFish Server `auth-pass-through-enabled` attribute is set to true, information about the original client request (such as client IP address, SSL keysize, and authenticated client certificate chain) is sent to the HTTP type network listeners using custom request headers. The `auth-pass-through-enabled` attribute allows you to take advantage of a hardware accelerator for faster SSL authentication if you have one installed. It is easier to configure a hardware accelerator on the load balancer than on each clustered GlassFish Server instance.

This setting should only be set to true only if the GlassFish Server is behind a firewall to deny external access. Otherwise a malicious user could bypass authentication by setting the correct HTTP headers.

This setting can be changed in the GlassFish admin console, it is called "Auth Pass Through" and is found at:

    Configuration -> server-config -> Network Config -> Protocols -> <your http listener> -> HTTP tab

The `asadmin set` command can also be used:

    asadmin> set server-config.network-config.protocols.<your http listener>.http.auth-pass-through-enabled=true

### The "proxyHandler" Attribute

The proxy handler is responsible for retrieving information from the HTTP headers (mentioned above) and converting these into the information required for GlassFish to authenticate the request. 

The "*proxyHandler*" property only takes effect if "*auth-pass-through-enabled*" is set to true. If you set the "*proxyHandler*" property on an individual HTTP or HTTPS listener, it overrides the default setting for all listeners.

The documentation says: 

    The proxy handler inspects incoming requests for the custom request headers through which the proxy server conveys the information about the original client request, and makes this information available to the web application using standard `ServletRequest` APIs.

The proxy handler implementation is configurable globally at the HTTP service level with the "*proxyHandler*" property, whose value specifies the fully-qualified class name of an implementation of the `com.sun.appserv.ProxyHandler` abstract class. The default implementation of this uses the following headers:

- Proxy-ip
    - Holds the client IP address 
- Proxy-keysize
    - Holds the client SSL key size
- Proxy-auth-cert
    - Holds the SSL client certificate chain. This value must contain the BASE-64 encoded client certificate chain without the "BEGIN CERTIFICATE" and "END CERTIFICATE" boundaries and with `\n` replaced with `% d% a`.

Using the Apache "[mod_headers][apache_mod_headers]" module (version 2.4) these headers can be set with the following configuration:

    <Location /warhttp3>
        SSLOptions +StdEnvVars +ExportCertData
        
        RequestHeader set PROXY-IP "%{Remote_Addr}s"
        RequestHeader set PROXY-KEYSIZE "%{SSL_CIPHER_USEKEYSIZE}s"
        RequestHeader set PROXY-AUTH-CERT "%{SSL_CLIENT_CERT}s"
        RequestHeader edit PROXY-AUTH-CERT "-----BEGIN CERTIFICATE-----[ ]*" ""
        RequestHeader edit PROXY-AUTH-CERT " -----END CERTIFICATE-----" ""
        RequestHeader edit* PROXY-AUTH-CERT " " "%% d%% a"
        SSLVerifyClient require
        SSLVerifyDepth 1
        ProxyPass http://dev-gf3.local:80
    </Location>

This configuration is identical for GlassFish 3 and 4.

The "*proxy-ip*" and "*proxy-keysize*" headers are straight forward, while the "*proxy-auth-cert*" header requires a few steps. These are:

1. Set the initial value.
2. Strip out the initial certificate boundary.
3. Strip out the end certificate boundary.
4. Replace all the spaces with the "% d% a" token which GlassFish expects to be in the place where newlines should exist. This "edit*" option does not exist in versions before 2.4.

The "*proxyHandler*" property can only be changed using the `asadmin set` command.

    asadmin> set server-config.http-service.property.proxyHandler=classname

#### Custom Proxy Handler Implementation

By referencing the [javadoc][ph] for the abstract class and the  [source][phs] of the default implementation I wrote a proxy handler implementation which avoids having to do manipulation of the SSL environment variables in Apache.

    <Location /warhttpcustomhandler3>
        SSLOptions +StdEnvVars +ExportCertData
        
        RequestHeader set PROXY-IP "%{Remote_Addr}s"
        RequestHeader set PROXY-KEYSIZE "%{SSL_CIPHER_USEKEYSIZE}s"
        RequestHeader set PROXY-SSL_CLIENT_CERT "%{SSL_CLIENT_CERT}s"
        RequestHeader set PROXY-SSL_CLIENT_CERT_CHAIN_0 "%{SSL_CLIENT_CERT_CHAIN_0}s"
        RequestHeader set PROXY-SSL_CLIENT_CERT_CHAIN_1 "%{SSL_CLIENT_CERT_CHAIN_1}s"
        RequestHeader set PROXY-SSL_CLIENT_CERT_CHAIN_2 "%{SSL_CLIENT_CERT_CHAIN_2}s"
        SSLVerifyClient require
        SSLVerifyDepth 1
        ProxyPass http://dev-gf3.local:80
    </Location>

Again, this configuration is identical for GlassFish 3 and 4.

Configuring GlassFish to use this required placing the created `ProxyHandler.jar` in to `glassfishX/glassfish/lib` and running an `asadmin` command: 

    asadmin -u admin -W passwordfile --secure set server-config.http-service.property.proxyHandler=com.devwithimagination.proxy.handler.ApacheProxyHandler
    
This change required GlassFish to be restarted to take effect.

## Conclusion

Comprehensive sources of documentation on this are few and far between.

The final results are:

|---
| Service Type | Container | AJP Works? | HTTP Works?
|:-:|:-:|:-:|:-:
| Servlet | Web | YES | YES
| JAX-WS Web Service | Web | YES | YES
| JAX-WS Web Service | EJB | YES | NO

I hope I have just missed a minor detail, as this mode of authentication only working over AJP severely restricts the proxy servers which can be used. There is an unofficial plugin for NGINX, which appears to be abandoned, and no support from HAProxy.

[^1]: The only reference to it I can find is the setup documentation so it may no longer exist. 
    
[what]: /images/gfproxy/what.png "Client connecting to an Apache Proxy which is connecting to GlassFish"
[14]: http://docs.oracle.com/graphics/caution.gif "Caution"
[ph]: https://glassfish.java.net/javaee5/api/com/sun/appserv/ProxyHandler.html "ProxyHandler (Java EE 5 SDK) "
[phs]: http://www.javadocexamples.com/java_source/com/sun/enterprise/web/ProxyHandlerImpl.java.html
[jsr]: http://download.oracle.com/otndocs/jcp/websvcs-1_4-mrel3-eval-spec/ "JSR-000109 Implementing Enterprise Web Services 1.4 Maintenance Release 3 for Evaluation "
[ajp]: https://en.wikipedia.org/wiki/Apache_JServ_Protocol "Apache JServ Protocol - Wikipedia, the free encyclopedia "
[sample_proj]: https://github.com/dhutchison/GlassfishProxyTests "GlassFishProxyTests project on GitHub"

[roles]: http://docs.oracle.com/cd/E18930_01/html/821-2418/beacr.html "Roles, Principals, and Principal to Role Mapping - Oracle GlassFish Server 3.1 Application Development Guide "

[apache_ssl_env]: http://httpd.apache.org/docs/2.4/mod/mod_ssl.html#envvars "mod_ssl - Apache HTTP Server Version 2.4 "
[apache_mod_proxy]: http://httpd.apache.org/docs/2.4/mod/mod_proxy.html "mod_proxy - Apache HTTP Server Version 2.4 "
[apache_mod_headers]: http://httpd.apache.org/docs/current/mod/mod_headers.html "mod_headers - Apache HTTP Server Version 2.4 "

[oracle_lb_conf]: http://docs.oracle.com/cd/E18930_01/html/821-2426/abdhs.html "Permalink to Configuring the HTTP Load Balancer"

[glassfish_grizzly_bug]: http://stackoverflow.com/questions/26886584/java-lang-nullpointerexception-at-org-apache-catalina-connector-coyoteadapter-se "glassfish - java.lang.NullPointerException at org.apache.catalina.connector.CoyoteAdapter.service(CoyoteAdapter.java:272) while accessing JAX-WS services - Stack Overflow "
