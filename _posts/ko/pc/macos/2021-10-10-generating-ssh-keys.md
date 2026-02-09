---
title: "[macOS] SSH 키 생성하기"
ref: generating-ssh-keys
excerpt: "macOS에서 ssh-keygen을 이용하여 SSH 키를 생성하는 방법을 정리한다."
last_modified_at: 2021-10-10T04:36+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - SSH Key
  - SSH
  - Key
depth:
  - title: "PC"
    url: /ko/pc/
  - title: "macOS"
    url: /ko/pc/macos/
---

# 개요

macOS에서 SSH 키를 생성하는 방법을 정리한다.

# 정리

## 1. ~/.ssh 경로로 이동

```zsh
cd ~/.ssh
```

**경고:** 해당 경로가 존재하지 않는다면 새로 생성한다.
{: .notice--warning}

## 2. 키 생성

```zsh
ssh-keygen -t rsa -b 4096 -C "email@example.com"
```
