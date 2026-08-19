---
title: Why do I Unit Test Cloudformation?
summary: Why I unit test CloudFormation, and what should the Cloud-Radar project add next?
date: "2026-08-19 10:18"
slug: why-do-i-unit-test-cloudformation
---
(Semi-)Disclaimer - I help maintain a project called Cloud-Radar which is what I use to do this. I started helping on it after seeing feature gaps in it (vs what I needed). 

To set the scene a bit, I really started developing AWS Infrastructure using CloudFormation back in 2022 or so. Before that I had some exposure through more manual configuration and PoCs, but this is where I really started getting heavily into building the platform rather than the software that would run on it. 

At the time, the tooling around CloudFormation was rather immature, and a lot of issues could not be foreseen until deployment time. At the same time, I was looking in a lot of ways how to "shift-left" a lot of our standards enforcement to ensure that we were checking as much as we could at the PR stage (and also automating as much of those checks as possible). 

What we knew existed around that time, and largely adopted, were:
* cfn-lint - the CloudFormation linter developed by AWS. We would have started with this around the v0.6 time - the tool has got significantly better since the 1.x versions started
* cfn-nag - another opinionated linter, with more of a focus on secure configurations. Unfortunately a tool that has not had a new release in a number of years now. I suspect it still picks up on some potential issues that `cfn-lint` still does not, but I've never had the inclining to do a detailed comparison. At the point we adopted it, it certainly did. 
* cfn-guard - v2 - developing custom guard rules to plug gaps in baseline configuration that the other two tools did not pick up on. As would be a pattern throughout my time developing on AWS,  after we had developed quite a few checks the https://github.com/aws-cloudformation/aws-guard-rules-registry repository appeared with a number of pre-built checks. Personally I find the Domain Specific Language that Guard uses pretty painful, and it was pretty difficult to create guards especially where you needed to look at the relationship between two resources (TODO: EXAMPLE)

cfn-lint had had a lot more development since the 1.x stream started, and Guard has had another major release, one key area we found where these fell down is when Parameters come in to play. 

What I found when searching around was Cloud-Radar. 

> Cloud-Radar is a python module that allows testing of Cloudformation Templates/Stacks using Python.


Some of the main use cases I’ve used it for are:
* Checking naming conventions are met for resources match after parameters are applied (these could also include that the right region is in a name, the length constraints are not exceeded etc
* Checking tag values are as expected. We had implemented a guard rule to check that taggable resources had tags, with a unit test checking the values were as expected. This could be things like I expect all resources in this template to have a Service tag with the value XYZ - helpful especially for catching slight variations (MicroService, micro service, etc) and straight copy/paste issues where a block had been taken from another template
* Checking input parameters for things like Lambda Container URIs are for the right region (as you cannot deploy a Lambda in EU-WEST-1 referencing an ECR in EU-WEST-2 - you need to replicate the image). 

A lot of these could be caught at the point of deployment, even more so now with CloudFormation Hooks, but I am continually trying to shift left (and automate) checks so devs are informed early, before their PRs can be merged.

Over the years I have added changes to Cloud-Radar for:
* Dynamic References support (although as I have went on through my time developing AWS platforms I have gained an appreciation for the pain the use of these can cause and largely do not recommend them unless the value will be truly static for all time)
* ForEach support (and later other language extensions) - this is actually a bit a big one, as where tools like Guard fall down is they have no native support for Transforms - in our case, as our rules were targets resources of type x, if a for-each applied it just missed the blocks entirely due to the nesting. Not a good failure mode, and something that actually moved us towards different implementation patterns (/copy-paste) due to not having the validation tools we needed
* Improving validation in various parameter handling
* Improving how additional mock data can be handled (where attributes could be defined as opposed to using the default generated names, helpful where an attribute is expected to return a list - we're not going to try simulating CloudFormation to that extent - this is a quick test - if you want full simulation look at one of the many emulators - moto/localstack/others)
* Resusable hook support - so resource and template level tests can be reused across test cases 
* as well as just generally a number of bug fixes and maintenance updates

The last change I have pending, which I really need to get back to finishing, is automatic module loading. Taking the hooks support and making it automatic as long as the hook module is installed. 

But after that, I don't know what. The project is fairly stable, and beyond a bit of refactoring / modernisation, there are no pending tickets. 

(MENTION TAG POLICIES SOMEWHERE)

So I have two questions for you the reader:
1. Is this something you think would be useful for your use cases?
2. What features / improvements do you want to see?
