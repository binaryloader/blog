---
date: 2021-10-10T00:00+09:00
title: "[Git] GitHub で複数の SSH キーを使う"
ref: setting-multiple-ssh-key-on-github
lang: ja
excerpt: "GitHub で複数の SSH キーを使用する方法をまとめる。"
last_modified_at: 2021-10-10T04:48+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/setting-multiple-ssh-key-on-github.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/setting-multiple-ssh-key-on-github.png"
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
    url: /ja/development/
  - title: "SCM"
    url: /ja/development/scm/
  - title: "Git"
    url: /ja/development/scm/git/
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: binaryloader
---

# 概要

GitHub で複数の SSH キーを使用する方法をまとめる。

# 手順

## 1. ~/.ssh/config に以下の行を追加する

```
Host github.com-user1
	HostName github.com
	User git
	IdentityFile ~/.ssh/id_rsa_user1
```

## 2. 動作確認

```zsh
git clone git@github.com-user1:hacoma/iOS-Project.git
```
