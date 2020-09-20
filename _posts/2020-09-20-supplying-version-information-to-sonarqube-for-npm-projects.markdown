---
title: Supplying Version Information to Sonarqube for NPM Projects
categories:
- Development
tags:
- npm
- sdlc
- sonarqube
summary: A few approaches to supplying version information from NPM projects to the
  Sonarqube scanner
date: 2020-09-20 21:20
slug: supplying-version-information-to-sonarqube-for-npm-projects
---
One of the optional [Analysis Parameters][sonar_params] for Sonarqube is the project version. For Maven projects this is automatically picked up from the `pom.xml` file, but this is not the case for NPM projects even though they have a version in the `package.json` file.

Running a scan with a manually supplied version number just requires an additional parameter to be supplied.

```
sonar-scanner -Dsonar.projectVersion=<version number>
```

There are many different approaches that can be taken to extract out the version number from the `package.json` file.

Using only node, this one-liner will work. 
```
$ node -pe "require('./package.json').version"
0.0.1
```

If you have the fabulous [jq][jq] installed this would also work.
```
$ cat package.json | jq -r .version
0.0.1
```

Once you have an approach that works for you, this can be setup as a script in the `package.json` file to save a bit of typing of commands later on. The latter approach, using `jq` is a little bit cleaner to do this with as it does not require escaping. 

``` json
{
  "name": "open-apivisualiser",
  "version": "0.0.1",
  "scripts": {
    
    "sonar": "sonar-scanner -Dsonar.projectVersion=$(cat ./package.json | jq -r .version)"

  }
``` 

[sonar_params]: https://docs.sonarqube.org/latest/analysis/analysis-parameters/#header-2 "Analysis Parameters - SonarQube Docs"
[jq]: https://stedolan.github.io/jq/ "jq"
