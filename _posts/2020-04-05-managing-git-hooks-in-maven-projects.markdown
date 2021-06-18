---
title: Managing Git Hooks in Maven Projects
categories:
- Development
tags:
- Maven
- git
- pre-commit
summary: How to install Git Hooks as part of the Maven Lifecycle
date: 2020-04-05 23:17
slug: managing-git-hooks-in-maven-projects
---
Git hooks are a fantastic first step for identifying issues before code is pushed to a repository. However, the configuration files which control these client-side hooks cannot be committed to the repository and need to be configured on each client once the repository has been checked out. 

In the NPM world, [Husky][husky] is a tool which is used to maintain commit hooks through the `package.json` file, and integrates with the NPM build lifecycle to keep the contents of the local ".git/hooks" folder up to date. With this, I have been using [commitlint][commitlint] for ensuring commit messages conform to a standard format, as well as ensuring code has had linting checks ran against it. 

I had a look for a similar solution for Maven, but could not immediately find one. I wanted to find a solution that could be integrated with the Maven lifecycle, like Husky does for NPM. 

<!--more-->

[Pre-commit][precommit] is a framework for managing and maintaining multi-language pre-commit hooks. The introduction for this tool describes it best. 

> We believe that you should always use the best industry standard linters. Some of the best linters are written in languages that you do not use in your project or have installed on your machine. For example scss-lint is a linter for SCSS written in Ruby. If you’re writing a project in node you should be able to use scss-lint as a pre-commit hook without adding a Gemfile to your project or understanding how to get scss-lint installed.
> 
> We built pre-commit to solve our hook issues. It is a multi-language package manager for pre-commit hooks. You specify a list of hooks you want and pre-commit manages the installation and execution of any hook written in any language before every commit. pre-commit is specifically designed to not require root access. If one of your developers doesn’t have node installed but modifies a JavaScript file, pre-commit automatically handles downloading and building node to run eslint without root.

Ultimately, if we are wanting to conform to one of the [Conventional Commits][conventionalcommits] formats for our commit messages, then we will end up using NPM in our hooks. There is a hook configuration, [commitlint-pre-commit-hook][commitlint-pre-commit-hook], for using commitlint. This does still require the `commitlint.config.js` file to be configured. 

While installing commit hooks with pre-commit are as easy as running `pre-commit install`, this can be integrated with Maven using the [Exec Maven Plugin][exec-maven-plugin] configured to run against the "initialize" phase. Note that because this is a `commit-msg` hook, we would need to have ran `pre-commit install -t commit-msg` to install it. At this point I can't see how to get pre-commit to install for all hook types with one install command, without chaining `-t` arguments. 

~~~ xml
<build>
  <plugins>
    <plugin>
      <groupId>org.codehaus.mojo</groupId>
      <artifactId>exec-maven-plugin</artifactId>
      <version>1.6.0</version>
      <executions>
        <execution>
          <id>install-git-hooks</id>
          <phase>initialize</phase>
          <goals>
            <goal>exec</goal>
          </goals>
          <configuration>
            <executable>pre-commit</executable>
            <arguments>
              <argument>install</argument>
              <argument>-t</argument>
              <argument>pre-commit</argument>
              <argument>-t</argument>
              <argument>commit-msg</argument>
            </arguments>
          </configuration>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
~~~

[commitlint]: https://commitlint.js.org "commitlint - Lint commit messages"
[conventionalcommits]: https://www.conventionalcommits.org "Conventional Commits"
[husky]: https://github.com/typicode/husky "typicode/husky: Git hooks made easy!"

[precommit]: https://pre-commit.com "pre-commit"

[commitlint-pre-commit-hook]: https://github.com/alessandrojcm/commitlint-pre-commit-hook "alessandrojcm/commitlint-pre-commit-hook: A pre-commit hook for commitlint"

[exec-maven-plugin]: https://www.mojohaus.org/exec-maven-plugin/   "Exec Maven Plugin – Introduction"
