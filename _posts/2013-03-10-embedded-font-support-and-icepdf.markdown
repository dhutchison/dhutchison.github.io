---
layout: post
title: Embedded Font Support and ICEPdf
date: 2013-03-10 00:00:00
categories:
- Development
tags:
- ICEPdf
- Java
status: publish
type: post
published: true
meta:
  publicize_reach: a:2:{s:7:"twitter";a:1:{i:828427;i:48;}s:2:"wp";a:1:{i:0;i:2;}}
  publicize_twitter_user: DavidHutchison
  _wpas_done_828427: '1'
  _publicize_done_external: a:1:{s:7:"twitter";a:1:{i:20342569;b:1;}}
---
From [Embedded Font Support and ICEPdf](http://www.icesoft.org/wiki/display/PDF/Embedded+Font+Support "Embedded Font Support and ICEPdf")

> ### ICEpdf Open Source ###
> ICEpdf Open Source uses java.awt.Font when reading system font files for substitution. ICEpdf Open Source, by default, disables using java.awt.Font for reading embedded font files, because a malformed font file can crash the JVM. The system property `org.icepdf.core.awtFontLoading=true` can be set to enable java.awt.Font embedded font loading.

This will not work if the font embedded in the PDF is only a subset. It took far too long to figure this out.
