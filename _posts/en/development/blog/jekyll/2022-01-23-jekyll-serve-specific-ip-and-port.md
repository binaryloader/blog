---
date: 2022-01-23T00:00+09:00
title: "[Jekyll] Running a Local Server with a Specific IP and Port"
ref: jekyll-serve-specific-ip-and-port
excerpt: "How to run a Jekyll local server with a specific IP address and port."
lang: en
last_modified_at: 2022-01-23T14:23+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/jekyll-serve-specific-ip-and-port.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/jekyll-serve-specific-ip-and-port.png"
categories:
  - Development
  - Blog
  - Jekyll
tags:
  - Development
  - Blog
  - Jekyll
  - CLI
  - Server
depth:
  - title: "Development"
    url: /en/development/
  - title: "Blog"
    url: /en/development/blog/
  - title: "Jekyll"
    url: /en/development/blog/jekyll/
---

# Overview

This post covers how to run a Jekyll local server with a specific IP address and port.

# Steps

## 1. Start the Server

```zsh
bundle exec jekyll serve -H 192.168.50.2 -P 1111
```
