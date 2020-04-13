---
title: Git Commit Hooks for Branch Naming Using Husky
series: Git Commit Hooks for Branch Naming
series_part: 2
summary: How to use git hooks to enforce branch naming conventions
categories:
- Development
tags:
- husky
- git
date: 2020-04-13 23:07
slug: git-commit-hooks-for-branch-naming-using-husky
---
Following on from the previous part of this series which detailed how to use [pre-commit][precommit] to configure hooks to validate branch naming, this post will do the same thing using [Husky][husky] in an NPM based project. 

<!--more-->

For this, we need a shell script like the one in [this post][branch_naming_shell_post]. In our project we will store this as `hooks/check_branch_naming.sh`.

~~~ bash
#!/usr/bin/env bash
local_branch_name="$(git rev-parse --abbrev-ref HEAD)"

valid_branch_regex='^((fix|feat)\/[a-zA-Z0-9\-]+)$'

message="There is something wrong with your branch name. Branch names in this project must adhere to this contract: $valid_branch_regex. Your commit will be rejected. You should rename your branch to a valid name and try again."

if [[ ! $local_branch_name =~ $valid_branch_regex ]]; then
    echo "$message"
    exit 1
fi

exit 0
~~~


In `package.json`, create a script entry for making this script executable and running it. Also configure the Git hook in Husky. This uses [npm-run-all][npm-run-all] to run multiple scripts in parallel. 

~~~ json
"scripts": {
    "check-branch-name": "chmod 755 ./hooks/check_branch_naming.sh && sh ./hooks/check_branch_naming.sh"
},
"husky": {
    "hooks": {
      "pre-commit": "run-p lint check-branch-name"
    }
}
~~~

With this configured, committing to a badly named branch will fail.


~~~ bash
MacBook:git-hooks-husky dhutchison$ git checkout -b 'feats/test'
Switched to a new branch 'feats/test'
MacBook:git-hooks-husky dhutchison$ touch testfile
MacBook:git-hooks-husky dhutchison$ git add testfile 
MacBook:git-hooks-husky dhutchison$ git commit -m "Check fail"
husky > pre-commit (node v13.12.0)

> git-hooks-husky@0.0.0 check-branch-name /Users/david/Development/Local Projects/git-hooks-husky
> chmod 755 ./hooks/check_branch_naming.sh && sh ./hooks/check_branch_naming.sh


> git-hooks-husky@0.0.0 lint /Users/david/Development/Local Projects/git-hooks-husky
> ng lint

There is something wrong with your branch name. Branch names in this project must adhere to this contract: ^((fix|feat)\/[a-zA-Z0-9\-]+)$. Your commit will be rejected. You should rename your branch to a valid name and try again.
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! git-hooks-husky@0.0.0 check-branch-name: `chmod 755 ./hooks/check_branch_naming.sh && sh ./hooks/check_branch_naming.sh`
npm ERR! Exit status 1
npm ERR! 
npm ERR! Failed at the git-hooks-husky@0.0.0 check-branch-name script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/david/.npm/_logs/2020-04-13T22_56_17_047Z-debug.log
ERROR: "check-branch-name" exited with 1.
husky > pre-commit hook failed (add --no-verify to bypass)
~~~

Changing the name of the branch to meet our convention will allow commits to be made. 

~~~ bash
MacBook:git-hooks-husky dhutchison$ git branch -m 'feat/my-good-branch'
MacBook:git-hooks-husky dhutchison$ git commit -m "Check pass"
husky > pre-commit (node v13.12.0)

> git-hooks-husky@0.0.0 lint /Users/david/Development/Local Projects/git-hooks-husky
> ng lint


> git-hooks-husky@0.0.0 check-branch-name /Users/david/Development/Local Projects/git-hooks-husky
> chmod 755 ./hooks/check_branch_naming.sh && sh ./hooks/check_branch_naming.sh

Linting "git-hooks-husky"...
All files pass linting.
[feat/my-good-branch d1e5bd0] Check pass
 1 file changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 testfile
~~~


[branch_naming_shell_post]: https://itnext.io/using-git-hooks-to-enforce-branch-naming-policy-ffd81fa01e5e "Using Git hooks to enforce branch naming policy - ITNEXT"
[husky]: https://github.com/typicode/husky "typicode/husky: Git hooks made easy!"
[precommit]: https://pre-commit.com "pre-commit"
[npm-run-all]: https://www.npmjs.com/package/npm-run-all "npm-run-all  -  npm"
