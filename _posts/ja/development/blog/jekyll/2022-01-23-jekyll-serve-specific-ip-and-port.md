---
title: "[Jekyll] 特定のIPアドレスとポートでローカルサーバーを起動する"
ref: jekyll-serve-specific-ip-and-port
excerpt: "Jekyllローカルサーバーを特定のIPアドレスとポートで起動する方法をまとめる。"
lang: ja
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
    url: /ja/development/
  - title: "Blog"
    url: /ja/development/blog/
  - title: "Jekyll"
    url: /ja/development/blog/jekyll/
---

# 概要

Jekyllローカルサーバーを特定のIPアドレスとポートで起動する方法をまとめる。

# 手順

## 1. サーバーの起動

```zsh
bundle exec jekyll serve -H 192.168.50.2 -P 1111
```
