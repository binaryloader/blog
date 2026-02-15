---
date: 2021-08-16T00:00+09:00
title: "[Git] Installing Git LFS"
ref: install-git-lfs
lang: en
excerpt: "How to install and set up Git LFS on macOS."
last_modified_at: 2021-08-16T08:21+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-git-lfs.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/install-git-lfs.png"
categories:
  - Development
  - SCM
  - Git
tags:
  - Development
  - SCM
  - Git
  - Homebrew
  - LFS
depth:
  - title: "Development"
    url: /en/development/
  - title: "SCM"
    url: /en/development/scm/
  - title: "Git"
    url: /en/development/scm/git/
---

# Overview

This post covers how to install and set up Git LFS on macOS.

# Steps

## 1. Installation

```zsh
brew install git-lfs
```

## 2. Enable LFS for a Specific Repository

```zsh
git lfs install
```

# References

- <https://git-lfs.github.com/>
