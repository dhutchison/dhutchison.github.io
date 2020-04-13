---
title: Git Commit Hooks for Branch Naming Using Pre-commit
categories:
- Development
tags:
- pre-commit
- git
summary: How to use git hooks to enforce branch naming conventions
date: 2020-04-13 21:50
slug: git-commit-hooks-for-branch-naming-pre-commit
---
In many organisations there are conventions on how Git branches should be named. As with all aspects of code quality, it is better to be able to identify these issues before they are pushed into version control. 

There is not a hook that we can specifically use at the point that a branch is created, so the best we can do is ensure that commits are not made to the newly created branch. 

<!--more-->

## Using Pre-commit

If we are using [pre-commit][precommit], like in our [previous post]({% post_url 2020-04-05-managing-git-hooks-in-maven-projects %}), this can be achieved by using the out-of-the-box [no-commit-to-branch][no-commit-to-branch-hook] hook. This is designed to protect specific branches from direct checkins, but can also take in zero or more `pattern` parameters for regex patterns. By using negations in the regex we can prevent commits to branches which do not match the naming convention. 

With this example `.pre-commit-hooks.yaml`, only branch names starting with "fix/" or "feat/" followed by some alphanumeric description will be accepted. 

~~~ yaml
- repo: https://github.com/pre-commit/pre-commit-hooks
  rev: v2.2.1
  hooks:
      - id: no-commit-to-branch
        args: ['--pattern', '^(?!((fix|feat)\/[a-zA-Z0-9\-]+)$).*']
~~~

Attempting to commit to "master" now will fail, as it does not meet the branch naming rules.

~~~ bash
MacBook:git-hooks-scratch dhutchison$ git status | grep 'On branch'
On branch master
MacBook:git-hooks-scratch dhutchison$ git commit -m "Added pre-commit hooks"
Don't commit to branch...................................................Failed
- hook id: no-commit-to-branch
- exit code: 1
~~~

If we create a branch that matches the naming scheme then it will work. 

~~~ bash
MacBook:git-hooks-scratch dhutchison$ git checkout -b 'feat/01-my-test-feature'
Switched to a new branch 'feat/01-my-test-feature'
MacBook:git-hooks-scratch dhutchison$ git add .pre-commit-config.yaml 
MacBook:git-hooks-scratch dhutchison$ git commit -m "Added pre-commit hooks"
Don't commit to branch...................................................Passed
[feat/01-my-test-feature 7e1b3bd] Added pre-commit hooks
 1 file changed, 5 insertions(+)
 create mode 100644 .pre-commit-config.yaml
~~~

## Renaming a Branch

Now we have a Git commit hook in place that restricts branch naming at the point of performing commits, developers will need a way to fix their branch names. 

~~~ bash
# Create a branch that will fail our naming restrictions
MacBook:git-hooks-scratch dhutchison$ git checkout -b 'my-badly-named-branch'
Switched to a new branch 'my-badly-named-branch'
# Create a test file and try to commit it
MacBook:git-hooks-scratch dhutchison$ touch my-great-file
MacBook:git-hooks-scratch dhutchison$ git add my-great-file 
MacBook:git-hooks-scratch dhutchison$ git commit -m "test-commit"
Don't commit to branch...................................................Failed
- hook id: no-commit-to-branch
- exit code: 1
~~~

Renaming the current branch is as easy as running `git branch -m <newname>`

~~~ bash
# Rename the branch
MacBook:git-hooks-scratch dhutchison$ git branch -m 'feat/02-my-great-files'
# Try committing again
MacBook:git-hooks-scratch dhutchison$ git commit -m "test-commit"
Don't commit to branch...................................................Passed
[feat/02-my-great-files e63a966] test-commit
 1 file changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 my-great-file
~~~

[no-commit-to-branch-hook]: https://github.com/pre-commit/pre-commit-hooks#no-commit-to-branch "pre-commit/pre-commit-hooks: Some out-of-the-box hooks for pre-commit"
[precommit]: https://pre-commit.com "pre-commit"
