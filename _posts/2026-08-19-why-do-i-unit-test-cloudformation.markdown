---
title: Why do I Unit Test Cloudformation?
summary: Why I unit test CloudFormation, and what should the Cloud-Radar project add next?
date: "2026-08-19 10:18"
slug: why-do-i-unit-test-cloudformation
---

Before I get in to the "why", I really should check a definition - is this actually "unit" testing, or does it fit the definition of one of many other types of checks? I don't know. I use “unit testing” here to mean rendering a CloudFormation template locally with a known set of parameter values, then asserting against the resulting resources and properties. It is not an "integration" test as no stack is deployed and no AWS credentials are required. I do this with a Python library called Cloud-Radar (LINK) - a project I now help maintain. I became involved after finding gaps between what it supported and what I needed for the projects I was working on.

To set the scene a bit, I really started developing AWS Infrastructure using CloudFormation back in 2022 or so. Before that I had some exposure through more manual configuration and proof-of-concepts, but this is when I really started getting heavily into building the platform rather than the software that would run on it.

At the time, the tooling around CloudFormation was rather immature, and a lot of issues could not be foreseen until deployment time. At the same time, I was looking in a lot of ways how to "shift-left" a lot of our standards enforcement to ensure that we were checking as much as we could at the PR stage (and also automating as much of those checks as possible).

What we knew existed around that time, and largely adopted, were:
* cfn-lint - the CloudFormation linter developed by AWS. We would have started with this around the v0.6 time - the tool has got significantly better since the 1.x versions started
* cfn-nag - another opinionated linter, with more of a focus on secure configurations. Unfortunately a tool that has not had a new release in a number of years now. I suspect it still picks up on some potential issues that `cfn-lint` still does not, but I've never had the inclining to do a detailed comparison. At the point we adopted it, it certainly did.
* cfn-guard - v2 - developing custom guard rules to plug gaps in baseline configuration that the other two tools did not pick up on. As would be a pattern throughout my time developing on AWS,  after we had developed quite a few checks the https://github.com/aws-cloudformation/aws-guard-rules-registry repository appeared with a number of pre-built checks. Personally I find the Domain Specific Language that Guard uses pretty painful, and it was pretty difficult to create guards especially where you needed to look at the relationship between two resources (TODO: EXAMPLE)

`cfn-lint` and `cfn-guard` have both had major releases since I started on this journey, and have had significant improvements (especially `cfn-lint` since it hit `1.0`). `cfn-lint` now even has support for supplying [parameter files](https://github.com/aws-cloudformation/cfn-lint#parameters) as one of it's CLI arguments, bringing it a lot closer to handling many of the use cases I had. (As I am writing this, I am thinking of a "Part 2" where I try see if some of my use cases could be handled, even as custom rules...). The biggest gap in my view has been how they deal with Parameters - we wanted to check the result with a particular set of values. For example, a rule may see that a property contains `!Ref ServiceName`, while our test needs to establish that supplying a particular value produces the exact set of tags (for all resources in the template) that we intended.

What I found when searching around was Cloud-Radar.

> Cloud-Radar is a python module that allows testing of Cloudformation Templates/Stacks using Python.


Some of the main use cases I’ve used it for are:
* Checking that resource names follow our conventions after parameters are applied. For example, that they contain the expected region and remain within the service’s length limits. We found that `cfn-lint` would not always catch length issues once multiple parameters were in use. 
* Checking tag values are as expected. We had implemented a guard rule to check that taggable resources had tags, with a unit test checking the values were as expected. For example, every resource had `Service: XYZ`. This caught case and spacing variations such as `MicroService` versus `micro service`, as well as copied blocks retaining another service’s tags.
* Checking input parameters for things like Lambda Container URIs are for the right region (as you cannot deploy a Lambda in EU-WEST-1 referencing an ECR in EU-WEST-2 - you need to replicate the image).

A lot of these could be caught at the point of deployment, even more so now with [CloudFormation Hooks](https://docs.aws.amazon.com/cloudformation-cli/latest/hooks-userguide/what-is-cloudformation-hooks.html). Tag related items can be covered mostly with [AWS Organizations tag policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_tag-policies-enforcement.html) - although it does not cover resources created without tags entirely. I wanted to move those checks earlier in the development process (often described as “shifting left”) so that our standards could be checked automatically pre-commit, and again when a pull request was opened.

It is important to reiterate that these tests do not prove that AWS will accept the template or that the deployed resources will behave correctly. Cloud-Radar resolves the parts of the template it supports so that I can test my own template logic quickly - deployment and functional testing still cover a different layer.

Over the years I have added changes to Cloud-Radar for:
* [Dynamic References](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/dynamic-references.html) support - although as I have went on through my time developing AWS platforms I have gained an appreciation for the pain the use of these can cause and largely do not recommend them unless the value will be truly static for all time.
* Support for `Fn::ForEach` and, later, other `AWS::LanguageExtensions` features. This was a significant gap for us because our Guard rules did not expand the transform before looking for resources of a particular type. `cfn_nag` also did not parse the format correctly. Resources nested inside a `Fn::ForEach` block could therefore be missed entirely. That silent omission pushed us towards writing resources out longhand (effectively copy and paste) because we could validate that structure reliably without rewriting all our validation tools.
* Improving validation in various parameter handling
* Improving how additional mock data can be handled. By default Cloud-Radar takes a rather simplistic approach to how `Ref` and `GetAtt` return values - using the name of the Resource/Attribute as the value. In some cases, especially if passing the value to another intrinsic function, this can result in type or format errors (like if `GetAtt` is expected to return a list). I added a feature where attributes could be defined in Metadata as opposed to using the default generated values. We're not going to try simulating CloudFormation to that extent where each generated value is truly correct, this is a quick test - if you want full simulation look at one of the many emulators like [moto](https://github.com/getmoto/moto), [LocalStack](https://www.localstack.cloud), or the many newer alternatives that appeared when LocalStack changed their licensing model.
* Resusable Cloud-Radar test hook support - so resource and template level tests can be reused across test cases through importable libraries
* ...as well as just generally a number of bug fixes and maintenance updates

The last change I have pending, which I really need to get back to finishing, is automatic module loading. Taking the Cloud-Radar test hooks support and making it automatic as long as the library module is installed.

But after that, I don't know what. The project is fairly stable, and beyond a bit of refactoring / modernisation, there are no pending tickets.


So I have three questions for you the reader:
1. Is this something you think would be useful for your use cases?
2. What features / improvements do you want to see?
3. Do you know of a better way to achieve these goals? (As I noted above, I'll be having another pass through `cfn-lint` to see just what its custom rules support now.) 
