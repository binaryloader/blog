---
date: 2021-10-10T00:00+09:00
title: "[Git] Using Multiple SSH Keys on GitHub"
ref: setting-multiple-ssh-key-on-github
lang: en
excerpt: "How to use multiple SSH keys on GitHub."
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
    url: /en/development/
  - title: "SCM"
    url: /en/development/scm/
  - title: "Git"
    url: /en/development/scm/git/
---

# Overview

This post covers how to use multiple SSH keys on GitHub.

# Steps

## 1. Add the Following Lines to ~/.ssh/config

```
Host github.com-user1
	HostName github.com
	User git
	IdentityFile ~/.ssh/id_rsa_user1
```

## 2. Verify It Works

```zsh
git clone git@github.com-user1:hacoma/iOS-Project.git
```
