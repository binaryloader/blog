---
title: "[macOS] SSH 키 생성하기"
last_modified_at: 2021-10-10T04:36+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Playground
  - macOS
tags:
  - Playground
  - macOS
  - SSH Key
  - SSH
  - Key
  - PC
depth:
  - title: "Playground"
    url: /playground/
  - title: "macOS"
    url: /playground/macos/
---

# 정리

## ~/.ssh 경로로 이동

```zsh
cd ~/.ssh
```

**경고:** 해당 경로가 존재하지 않는다면 새로 생성한다.
{: .notice--warning}

## 키 생성

```zsh
ssh-keygen -t rsa -b 4096 -C "email@example.com"
```
