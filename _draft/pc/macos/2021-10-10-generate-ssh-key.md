---
title: "[macOS] SSH 키 생성하기"
last_modified_at: 2021-10-10T04:36+09:00
header:
  overlay_color: "#202020"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - SSH
  - Key
depth:
  - title: "PC"
    url: /pc/
  - title: "macOS"
    url: /pc/macos/
---

# 한번 알아보자

## 1. ~/.ssh 경로로 이동

```bash
$ cd ~/.ssh
```

**경고:** 경로가 존재하지 않는다면 새로 생성한다.
{: .notice--warning}

## 2. 키 생성

```bash
$ ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

===

부족한 글 읽어주셔서 감사합니다.

잘못된 내용이나 오탈자에 대한 지적은 언제나 환영입니다.  
댓글로 남겨주시면 반영하도록 하겠습니다.
