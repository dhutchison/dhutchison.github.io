---
title: Introducing toggl-summary-cli
categories:
- Development
tags:
- toggl
summary: I wrote a Typescript CLI for my own special Toggl reporting requirements
date: 2020-09-22 23:40
slug: introducing-toggl-summary-cli
---
[toggl-summary-cli][github] is a CLI utility, written in Typescript, for my own specific Toggl reporting requirements 

I use [Toggl Track][toggl_track] for keeping track of what I am spending my time on while working. I'm not a contractor though, so I don't have any hard requirement to ensure every minute of my day is accounted for. I do need to know though how many hours in a day or week that I have have been on the clock for reporting purposes.

This tool will, for a day or a week, report on:
- booked time, the total for tasks
- unbooked time, the total for unaccounted for time between tasks
- total time, the sum of booked and unbooked time
- break time, the sum of any times between a "marker" entry and the next task

In order to pick up on unbooked time and differentiate it from break time, I add entries with a tag of "marker". This is used to indicate the start of a break. The break is determined to end when the next entry starts. 

## Configuration

This uses [commander.js][commander.js] for supporting command line arguments. Running the program with a `-h` or `--help` flag will print out the usage instructions. Note if you have a `.env` file as below this will include the values from that file in the output. 

```
$ npx @devwithimagination/toggl-summary-cli -h
npx: installed 52 in 12.172s
Usage: toggl-summary-cli [options]

Options:
  -D, --debug                    output extra debugging
  --api-key <api-key>            api token, found in Toggle profile settings
  --email <email>                your email address
  --workspace-id <workspace id>  id of the Toggle workspace
  -d, --day <date>               day to report on (in yyyy-MM-dd format). If a date is not supplied then this will default to today. (default: "2020-09-21")
  -w, --week                     If specified, interpret the day as the start of a week.
  -h, --help                     display help for command
```

This uses [dotenv][dotenv] for supporting loading secrets from a `.env` file in directory the tool is ran from. This is used to provide default values for the required CLI options above. This file can contain:

```
API_TOKEN=<api token, found in Toggle profile settings>
EMAIL=<your email address>
WORKSPACE_ID=<id of the Toggle workspace>

```

## Example Usage 

An example of running this for a single day:
```
$ npx @devwithimagination/toggl-summary-cli -d 2020-09-18
Report page loaded 1 total booked time: 02:49:13
==== Totals for 2020-09-18 to 2020-09-18 ====
Counted booked time: 02:49:11
Counted unbooked time: 00:54:20
Counted break time: 00:00:00
Counted total time: 03:43:31
```

Running for a week:
```
$ npx @devwithimagination/toggl-summary-cli -d 2020-09-14 -w
Report page loaded 1 total booked time: 28:22:01
Report page loaded 2 total booked time: 28:22:01
==== Totals for 2020-09-14 to 2020-09-20 ====
Counted booked time: 28:21:26
Counted unbooked time: 07:20:12
Counted break time: 04:01:59
Counted total time: 35:41:38
```

This might be no use to anybody but me, but it helps with my time tracking and that is what matters. If you are interested in the implementation, it is available on GitHub [here][github].

[github]: https://github.com/dhutchison/toggl-summary-cli "dhutchison/toggl-summary-cli: Typescript CLI for my own special Toggl reporting requirements"
[commander.js]: https://github.com/tj/commander.js/ "tj/commander.js: node.js command-line interfaces made easy"
[toggl_track]: https://toggl.com/track/ "Toggl Track: Effortless Time-Tracking for Any Workflow"
[dotenv]: https://www.npmjs.com/package/dotenv "dotenv  -  npm"
[jest]: https://jestjs.io "Jest - Delightful JavaScript Testing"
[ts-jest]: https://github.com/kulshekhar/ts-jest "kulshekhar/ts-jest: TypeScript preprocessor with sourcemap support for Jest"
