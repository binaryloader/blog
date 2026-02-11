---
date: 2021-10-10T00:00+09:00
title: "[macOS] SSHキーの生成"
lang: ja
ref: generating-ssh-keys
excerpt: "macOSでssh-keygenを使ってSSHキーを生成する方法をまとめる。"
last_modified_at: 2021-10-10T04:36+09:00
published: true
permalink: /ja/pc/macos/generating-ssh-keys/
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
  - Terminal
depth:
  - title: "PC"
    url: /ja/pc/
  - title: "macOS"
    url: /ja/pc/macos/
---

# 概要

macOSでSSHキーを生成する方法をまとめます。

# 手順

## 1. ~/.sshディレクトリに移動

```zsh
cd ~/.ssh
```

**警告:** ディレクトリが存在しない場合は、新しく作成してください。
{: .notice--warning}

## 2. キーの生成

```zsh
ssh-keygen -t rsa -b 4096 -C "email@example.com"
```
