---
title: 'Installing Python Libraries from Source: pip, Poetry, and Flat Layout Pitfalls'
summary: What to do when pip can't install a library from a Git source due to flat
  layout issues—and how Poetry, setuptools, and PEP 621 come into play.
tags:
- python
- pip
- poetry
- setuptools
- packaging
date: 2025-04-05 22:54
slug: installing-python-libraries-from-source-pip-poetry-and-flat-layout-pitfalls
---
There may be times when you want to install a Python library from source — maybe to test a specific commit, use a pre-release version, or debug a branch. Normally, this is relatively straightforward:

```bash
pip install git+https://github.com/aws-ia/taskcat@73de28457c66635a4517393c86484c18f44fef6f
```

But sometimes, things aren't that easy... we are getting an error when trying to do this:

```bash
  error: Multiple top-level packages discovered in a flat-layout: ['e2e', 'assets', 'taskcat', 'installer', 'taskcat_plugin_testhook'].

  To avoid accidental inclusion of unwanted files or directories,
  setuptools will not proceed with this build.

  If you are trying to create a single distribution with multiple packages
  on purpose, you should not rely on automatic discovery.
  Instead, consider the following options:

  1. set up custom discovery (`find` directive with `include` or `exclude`)
  2. use a `src-layout`
  3. explicitly set `py_modules` or `packages` with a list of names

  To find more information, look for "package discovery" on setuptools docs.
```

<!--more-->

## Why pip can't install this library

This error is caused by flat layout — a project structure where multiple top-level directories coexist in the project root, like this:


```bash
.
├── taskcat/
├── e2e/
├── assets/
├── installer/
├── taskcat_plugin_testhook/
└── pyproject.toml
```

Some of these top level directories may be actual Python packages, others might be unrelated directories like tests or assets. Without clear directions, tools like `setuptools` can get confused and refuse to guess what it should install.

In our example, taskcat has the main module source contained in the `taskcat` directory, with the other detected top level directories being unrelated to the contents of the published package.


## Can pip fix this?

Unfortunately, no. There’s nothing you can do as the consumer — no flags to pass to `pip`, no way to configure your local environment. This needs to be addressed in the library itself.

If the library was a multi-package project, you could add `#subdirectory=taskcat` to the install URL. But that only works if the subdirectory contains a full isolated package (including metadata files like `pyproject.toml`). That’s not the case here.


This post is mainly to act as a reminder of the steps I needed to take to solve this issue specifically in this project - your results may vary, but hopefully this should at least help with what areas to look in to.

## What’s going on behind the scenes?

The taskcat project uses [Poetry](https://python-poetry.org) for dependency and package management. It has a well-formed `pyproject.toml` for that tool, but it doesn't include metadata that `pip` (via `setuptools`) understands by default.

This is where [PEP 621](https://peps.python.org/pep-0621/) comes in — it standardizes how metadata like name, version, dependencies, etc., are defined in `pyproject.toml`. Poetry fully supports this, but pip still defers to setuptools, which (unless explicitly told otherwise) falls back to automatic discovery, and that fails with flat layouts like we are seeing here.

To fix this for pip, I forked the project and made a couple of small changes to make the library installable from source via pip.


## The Fix: Adding pip-friendly metadata

Firstly the `pyproject.toml` file needed modified to include a couple of additional pieces of metadata to define a build system to use.

```
[build-system]
requires = ["setuptools>=40.4.3", "wheel"]
build-backend = "setuptools.build_meta"
```

Additionally the `setup.cfg` file needed a few extra blocks to define a couple of bits of metadata, and the dependencies that taskcat uses (largely copying what was in the `[tool.poetry.dependencies]` block of `pyproject.toml`, and converting it into the correct format). The key one that solves our flat layout discovery problem is the `packages` line.

```
[metadata]
name = taskcat
version = 0.9.56
description-file = README.md

[options]
# Options for if this package is being installed from source via pip
packages = taskcat
python_requires = >=3.8.0,<4.0
install_requires =
    pathspec==0.10.3
    reprint
    tabulate>=0.8.2, <1.0
    cfn_lint>=0.78.1,<2.0
    setuptools>=40.4.3
    boto3>=1.9.21,<2.0
    botocore>=1.12.21,<2.0
    urllib3<2
    yattag>=1.10.0,<2.0
    PyYAML~=6.0
    jinja2>=3.1.1,<4.0
    markupsafe>=2.0.1
    requests>=2.31.0
    jsonschema~=3.0
    docker~=7.0
    dulwich~=0.19
    dataclasses-jsonschema>=2.9.0,<2.15.2
```


As you can hopefully see, most of this information was already in the project in a different format for use by Poetry. Effectively we are needing to duplicate this information to allow the project to be installed by two different package management tools.

But with that change, we can now install from source.

```bash
$ pip install git+https://github.com/dhutchison/taskcat@6e3f73e1fb7d78abc13d328aae9bb523dfc0b818

...
Successfully built taskcat
Successfully installed taskcat-0.9.56 ...
```
🎉 Success! The modified package installs cleanly via pip.

## Lessons Learned

I hadn’t appreciated until now that the packaging tool used by a Python library could directly impact how consumers install it. I’d assumed they all followed a standard structure. Realizing that’s not the case explains some of the weird behavior I saw when attempting to build a plugin detection for [cloud-radar](https://github.com/DontShaveTheYak/cloud-radar) — where the packaging tool affected whether a plugin was detected. With a better understanding now, I can get back to improving that feature.
