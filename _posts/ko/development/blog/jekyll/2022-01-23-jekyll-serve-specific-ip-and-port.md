---
title: "[Jekyll] 특정 아이피와 포트로 로컬 서버 실행하기"
ref: jekyll-serve-specific-ip-and-port
excerpt: "Jekyll 로컬 서버를 특정 아이피와 포트로 실행하는 방법을 정리한다."
last_modified_at: 2022-01-23T14:23+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Development
  - Blog
  - Jekyll
tags:
  - Development
  - Blog
  - Jekyll
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Blog"
    url: /ko/development/blog/
  - title: "Jekyll"
    url: /ko/development/blog/jekyll/
---

# 개요

Jekyll 로컬 서버를 특정 아이피와 포트로 실행하는 방법을 정리한다.

# 정리

## 1. 서버 실행

```zsh
bundle exec jekyll serve -H 192.168.50.2 -P 1111
```
