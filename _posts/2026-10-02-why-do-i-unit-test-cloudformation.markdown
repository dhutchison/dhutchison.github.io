---
title: Why do I Unit Test CloudFormation?
summary: Why I unit test CloudFormation, and what should the Cloud-Radar project add next?
date: "2026-10-02 10:18"
slug: why-do-i-unit-test-cloudformation
---

Before I get into the "why", I really should check a definition - is this actually "unit" testing, or does it fit the definition of one of many other types of checks? I don't know - it doesn't feel quite right somehow. Anyway - I use “unit testing” here to mean rendering a CloudFormation template locally with a known set of parameter values, then asserting against the resulting resources and properties. It is not an "integration" test as no stack is deployed and no AWS credentials are required. I do this with a Python library called [Cloud-Radar](https://github.com/DontShaveTheYak/cloud-radar) - a project I now help maintain. I became involved after finding gaps between what it supported and what I needed for the projects I was working on.

## Why Linting Was Not Enough

To set the scene a bit, I really started developing AWS infrastructure using CloudFormation back in 2022 or so. Before that I had some exposure through more manual configuration and proofs of concept, but this is when I really started getting heavily into building the platform rather than the software that would run on it.

At the time, the tooling around CloudFormation was rather immature, and a lot of issues could not be foreseen until deployment time. I was also looking at ways to "shift left" our standards enforcement to ensure that we were checking as much as we could at the pull request (PR) stage (and automating as many of those checks as possible).

The tools we knew existed around that time, and largely adopted, were:

* `cfn-lint` - the CloudFormation linter developed by AWS. We would have started with this around the v0.6 time - the tool has got significantly better since the 1.x versions started.
* `cfn_nag` - another opinionated linter, with more of a focus on secure configurations. Unfortunately, it is a tool that has not had a new release in a number of years now. I suspect it still picks up on some potential issues that `cfn-lint` still does not, but I've never had the inclination to do a detailed comparison. At the point we adopted it, it certainly did.
* CloudFormation Guard v2 - developing custom Guard rules to plug gaps in baseline configuration that the other two tools did not pick up on. As would be a pattern throughout my time developing on AWS, after we had developed quite a few checks the [AWS Guard Rules Registry](https://github.com/aws-cloudformation/aws-guard-rules-registry) appeared with a number of pre-built checks - although looking at it again now, it's not had a commit in two years. Personally, I find the Domain Specific Language that Guard uses pretty painful, and it was pretty difficult to create Guard rules, especially where you needed to look at the relationship between two resources. (TODO: EXAMPLE)

`cfn-lint` and CloudFormation Guard have both had major releases since I started on this journey, and have had significant improvements. 

One of the biggest gaps for us at the time was checking what a template produced with a particular set of parameter values. For example, a rule may see that a property contains `!Ref ServiceName`, while our test needs to establish that supplying a particular value produces the exact set of tags that we intended for all resources in the template.

`cfn-lint` has supported supplying [parameter files](https://github.com/aws-cloudformation/cfn-lint#parameters) since [mid-2025](https://github.com/aws-cloudformation/cfn-lint/pull/3884), bringing it potentially closer to handling many of the use cases I had. By then, though, we already had working tests written with Cloud-Radar, and we have not invested the time to find out whether moving them to `cfn-lint` would be feasible or worthwhile. As I am writing this, I am thinking of a "Part 2" where I try some of the same checks with `cfn-lint`, including custom rules.

## What I Test With Cloud-Radar

What I found when searching around was Cloud-Radar, a Python module for testing CloudFormation templates and stacks using Python.

Some of the main use cases I’ve used it for are:

* Checking that resource names follow our conventions after parameters are applied. For example, that they contain the expected region and remain within the service’s length limits. We found that `cfn-lint` would not always catch length issues once multiple parameters were in use.
* Checking tag values are as expected. We had implemented a Guard rule to check that taggable resources had tags, with a unit test checking the values were as expected. For example, every resource had `Service: XYZ`. This caught case and spacing variations such as `MicroService` versus `micro service`, as well as copied blocks retaining another service’s tags.
* Checking that input parameters for things like Lambda container image URIs use the right region (as you cannot deploy a Lambda function in `eu-west-1` that references an ECR image in `eu-west-2` - you need to replicate the image).

The [naming example in Cloud-Radar](https://github.com/DontShaveTheYak/cloud-radar/blob/master/examples/unit/naming/README.md) shows what one of these tests looks like. The template uses `!Sub` to build an S3 bucket name from `pName` and `AWS::Region`. After loading the template, the test supplies `pName=test` and a deliberately made-up region, then checks the resulting name:

```python
stack = template.create_stack(params={"pName": "test"}, region="xx-west-3")
bucket = stack.get_resource("rS3Bucket")
bucket.assert_property_has_value("BucketName", "test-xx-west-3-bucket")
```

Using a region that does not exist also helps catch a real region being hard-coded into a name. The [full example test](https://github.com/DontShaveTheYak/cloud-radar/blob/master/examples/unit/naming/test_naming_simple.py) checks a name stored in an EFS tag and shows how to test naming patterns, too.

A lot of these could be caught at the point of deployment, even more so now with [CloudFormation Hooks](https://docs.aws.amazon.com/cloudformation-cli/latest/hooks-userguide/what-is-cloudformation-hooks.html). Tag-related items can also be covered in part with [AWS Organizations tag policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_tag-policies-enforcement.html) - they can enforce allowed values and key casing for supported resources, although their basic rules do not catch resources created with no tags at all. I wanted to move those checks earlier in the development process (often described as “shifting left”) so that our standards could be checked automatically pre-commit, and again when a PR was opened.

It is important to reiterate that these tests do not prove that AWS will accept the template or that the deployed resources will behave correctly. Cloud-Radar resolves the parts of the template it supports so that I can test my own template logic quickly - deployment and functional testing still cover a different layer.

We're not going to try simulating CloudFormation to the extent where each generated value is truly correct - this is a quick test. If you want more complete local simulation, look at one of the many emulators like [Moto](https://github.com/getmoto/moto), [LocalStack](https://www.localstack.cloud), or the many newer alternatives that appeared when LocalStack changed its licensing model.

## How Cloud-Radar Grew Around Those Gaps

Over the years I have added changes to Cloud-Radar for:

* [Dynamic References](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/dynamic-references.html) support - although as I have spent more time developing AWS platforms, I have gained an appreciation for the pain these can cause and largely do not recommend them unless the value will be truly static for all time.
* Support for [`Fn::ForEach`](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/intrinsic-function-reference-foreach.html) and other [`AWS::LanguageExtensions`](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/transform-aws-languageextensions.html) features. `Fn::ForEach` can be useful for repetitive resource definitions, like CloudWatch metrics, as it will repeat a block of template content to generate multiple similar resources. CloudFormation expands this while preparing a stack create or update, and before any resources are created. However our linting and Guard rules ran earlier against what was going in version control - the unexpanded template - looking for resources of a particular type, and `cfn_nag` did not parse the format correctly. Resources inside a `Fn::ForEach` block often would be missed entirely, and as a silent omission. This issue pushed us towards writing resources out longhand (effectively copy and paste) because we could validate that structure reliably without rewriting all our validation tools.
* Improving validation in various areas of parameter handling.
* Improving how additional mock data can be handled. By default, Cloud-Radar takes a rather simplistic approach to how `Ref` and `Fn::GetAtt` return values - using the name of the resource or attribute as the value. In some cases, especially if passing the value to another intrinsic function, this can result in type or format errors (for example, if `Fn::GetAtt` is expected to return a list). I added a feature where attributes could be defined in Metadata as opposed to using the default generated values.
* Reusable Cloud-Radar test hook support - so resource- and template-level tests can be reused across test cases through importable libraries.
* ...as well as just generally a number of bug fixes and maintenance updates.

## What Should Come Next?

The last change I have pending, which I really need to get back to finishing, is automatic module loading - taking the Cloud-Radar test hook support and making it automatic as long as the library module is installed.

But after that, I don't know what. The project is fairly stable, and beyond a bit of refactoring or modernisation, I don't have any other concrete feature work planned.

So I have three questions for you, the reader:

1. Is this something you think would be useful for your use cases?
2. What features or improvements do you want to see?
3. Do you know of a better way to achieve these goals? (As I noted above, I'll be having another pass through `cfn-lint` to see just what its custom rules support now.)
