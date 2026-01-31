---
title: EJB3, Stateful Firewalls, and Connection Timeouts with Payara
tags:
- payara
- ejb3
summary: After a firewall change our remote EJB3 calls started hanging mysteriously. The root cause? Silent TCP connection drops. To fix this we needed to enable and tune TCP keepalives at both the OS and Payara levels.
date: 2025-06-01 11:52
slug: ejb3-stateful-firewalls-and-connection-timeouts-with-payara
---

Recently I encountered an interesting and frustrating problem when troubleshooting an EJB3 connection issue between two Payara server instances. After a change in firewall vendor, we noticed that remote EJB3 calls would start hanging after a period of inactivity. Initially it seemed like an intermittent issue - but the deeper I looked, the more it felt like it never should have worked before the move either - a lovely Schroedinbug.

In this post, I’ll walk through the issue, why it happened, and the solution that ultimately fixed it.

## The Problem

Part of our system uses remote EJB3 calls between two Payara instances, communicating over a network with a stateful firewall in between. After the firewall vendor change, we started seeing EJB3 calls hang indefinitely if the connection had been idle for some time. This would appear to hang indefinitely, or at least until the ORB response timeout setting was hit (this is not configured by default though, and may not be a fast timeout depending on your workload). This in turn can tie up threads and make it difficult to track down the root cause of where the system pressure is coming from.

Here’s a simple view of the setup:

![Architecture Diagram](/images/ejb3_stateful_firewalls_connection_timeout/flow.drawio.svg "Diagram showing the path between two Payara instances with a stateful firewall in between")

<!--more-->

So what did we observe?

* The connection worked fine initially
* After some idle period (around 60 minutes), the next call would hang
* Listing connections on both sides would show connections existing on our EJB3 ports
* The firewall logs showed nothing being actively blocked
* Everything would work again fine after servers were restarted, for another hour or so (or more, depending on the load)

Eventually, it became clear - the stateful firewall was silently dropping idle TCP connections after a timeout, but neither side (Payara nor the OS TCP stack) was detecting the loss.

In effect, the application thought the TCP connection was still alive, but the firewall had forgotten about it.

## Why It Should Never Have Worked Reliably

This kind of behaviour is subtle because TCP itself doesn’t continuously verify that an idle connection is still valid unless you explicitly enable (and tune) TCP keepalive.

Many firewalls aggressively age out idle TCP sessions after a certain timeout to conserve resources. Without keepalive probes (or sustained traffic), both the OS and the application will continue assuming the connection is fine until they try to use it again - and it hangs indefinitely (or until any configured response timeout duration is hit).

If your application and/or OS doesn’t use TCP keepalives for long-lived idle connections, you’re simply relying on luck (or short enough idle times) that the network hasn’t closed the session in between.

## The Solution

Fixing this required two changes:
1. Configure TCP Keepalive at the OS level
2. Enable `fish.payara.SO_KEEPALIVE` in Payara

### 1. Configure TCP Keepalive on Linux

Linux supports TCP keepalive probes, but the default settings are often set far too high for this scenario (the default in most distributions is to send the first keepalive after *2 hours*). This no doubt dates back to a time where server-to-server bandwidth was not as fast as it now, but equally I'm sure on a high enough traffic system you could tune these settings incorrectly enough to cause an impact. I tuned the following kernel parameters (you should set the values appropriately for your environment):

```
# Enable TCP keepalive
sysctl -w net.ipv4.tcp_keepalive_time=300     # Start sending keepalive probes after 5 minutes idle
sysctl -w net.ipv4.tcp_keepalive_intvl=30      # Send a probe every 30 seconds if no response
sysctl -w net.ipv4.tcp_keepalive_probes=5      # After 5 failed probes (2.5 minutes), consider the connection dead
```

You can persist these settings in `/etc/sysctl.conf` (or a file in `/etc/sysctl.d`, depending on how your distribution expects configuration):

```bash
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 5
```

In theory there is a command that can be ran to dynamically reload these settings, but in my limited testing I found a full reboot was required for the settings to take effect - your results may vary.

These settings ensure that idle TCP connections are actively probed and broken down if unresponsive.

While this contains some information on how this applies in AWS, I found this to be a good explanation of how these settings apply to connections - [Implementing long-running TCP Connections within VPC networking][aws_networking].

### 2. Enable fish.payara.SO_KEEPALIVE in Payara

Configuring the OS level keepalives is not enough however - Payara must also be configured to explicitly set the `SO_KEEPALIVE` flag on its sockets when they are created. The OS settings only control the behaviour after the flag is set. Without the application-level flag, the OS will never send keepalive probes, regardless of how aggressively it is tuned.

This is done by setting the `fish.payara.SO_KEEPALIVE` property. There is a little detail on this in the [Payara Documentation][payara_runtime_docs].

> Enables keep alive (`SO_KEEPALIVE`) on the sockets created by an IIOP listener. Can be set as a global system property, or as a property on a specific listener (with the latter taking precedence over the global setting if both are set).

In a remote EJB3 call, the server-side Payara instance hosting the EJB is the listener — it receives the inbound connection initiated by the client Payara. So `fish.payara.SO_KEEPALIVE` must be enabled on the server-side listener to ensure the socket uses keepalive. In our case these settings would be rolled out to all Payara instances, but if you are troubleshooting it is important you remember which side is which.

In my case, I set this at the listener level using an `asadmin` command on our Domain Administration Server (noting that `server-config` may need updated if you use clustering), then restarted my instances to ensure it had set and that any stale connections had been cleaned up.

```
asadmin set "configs.config.server-config.iiop-service.iiop-listener.orb-listener-1.property.fish\-payara\-SO_KEEPALIVE=true"
```

## Lessons Learned


* If your application relies on long-lived idle TCP connections, always enable and properly configure TCP keepalives.
* Don’t trust the network to maintain session state forever — firewalls and NAT devices will aggressively clear idle sessions.
* When changing infrastructure components like firewalls, pay close attention to connection tracking and session timeout behaviours.

## Final Thoughts

This issue was ultimately a case of a hidden network assumption finally being exposed by a small environmental change. Now that TCP keepalive is properly configured on both the Payara and OS levels, this part of the system is stable even across longer idle periods.

It’s a reminder that robust distributed systems need to actively defend against unexpected network behaviours and ensure timeouts and retires are appropriately configured — not just hope for the best.

[aws_networking]: https://aws.amazon.com/blogs/networking-and-content-delivery/implementing-long-running-tcp-connections-within-vpc-networking/ "Implementing long-running TCP Connections within VPC networking - Networking & Content Delivery"
[payara_runtime_docs]: https://docs.payara.fish/community/docs/6.2025.5/Technical%20Documentation/Payara%20Server%20Documentation/General%20Administration/General%20Runtime%20Administration.html#list-of-system-properties "General Runtime Administration - Payara Community Documentation"
