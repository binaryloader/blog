---
date: 2021-08-16T00:00+09:00
title: "[Git] Git LFS 설치하기"
ref: install-git-lfs
excerpt: "macOS에서 Git LFS를 설치하고 설정하는 방법을 정리한다."
last_modified_at: 2021-08-16T08:21+09:00
published: true
header:
  overlay_color: "#202020"
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
    url: /ko/development/
  - title: "SCM"
    url: /ko/development/scm/
  - title: "Git"
    url: /ko/development/scm/git/
---

# 개요

macOS에서 Git LFS를 설치하고 설정하는 방법을 정리한다.

# 정리

## 1. 설치

```zsh
brew install git-lfs
```

## 2. 특정 레포지토리에 LFS 사용 적용

```zsh
git lfs install
```

# 참고

- <https://git-lfs.github.com/>
