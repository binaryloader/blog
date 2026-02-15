---
date: 2021-10-10T00:00+09:00
title: "[Git] GitHub에서 SSH 키 여러 개 사용하기"
ref: setting-multiple-ssh-key-on-github
excerpt: "GitHub에서 여러 SSH 키를 사용하는 방법을 정리한다."
last_modified_at: 2021-10-10T04:48+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/setting-multiple-ssh-key-on-github.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/setting-multiple-ssh-key-on-github.png"
categories:
  - Development
  - SCM
  - Git
tags:
  - Development
  - SCM
  - Git
  - GitHub
  - SSH
  - Key
  - SSH Config
depth:
  - title: "Development"
    url: /ko/development/
  - title: "SCM"
    url: /ko/development/scm/
  - title: "Git"
    url: /ko/development/scm/git/
---

# 개요

GitHub에서 여러 SSH 키를 사용하는 방법을 정리한다.

# 정리

## 1. ~/.ssh/config에 아래 라인 추가

```
Host github.com-user1
	HostName github.com
	User git
	IdentityFile ~/.ssh/id_rsa_user1
```

## 2. 작동 확인

```zsh
git clone git@github.com-user1:hacoma/iOS-Project.git
```
