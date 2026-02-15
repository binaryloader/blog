---
date: 2021-08-16T00:00+09:00
title: "[Git] Git LFS をインストールする"
ref: install-git-lfs
lang: ja
excerpt: "macOS で Git LFS をインストールし設定する方法をまとめる。"
last_modified_at: 2021-08-16T08:21+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-git-lfs.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/install-git-lfs.png"
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
    url: /ja/development/
  - title: "SCM"
    url: /ja/development/scm/
  - title: "Git"
    url: /ja/development/scm/git/
---

# 概要

macOS で Git LFS をインストールし設定する方法をまとめる。

# 手順

## 1. インストール

```zsh
brew install git-lfs
```

## 2. 特定のリポジトリで LFS を有効にする

```zsh
git lfs install
```

# 参考

- <https://git-lfs.github.com/>
