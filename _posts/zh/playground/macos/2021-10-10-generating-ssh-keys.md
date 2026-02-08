---
title: "[macOS] 生成SSH密钥"
lang: zh
ref: generating-ssh-keys
last_modified_at: 2021-10-10T04:36+09:00
published: true
permalink: /zh/playground/macos/generating-ssh-keys/
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
    url: /zh/playground/
  - title: "macOS"
    url: /zh/playground/macos/
---

# 概述

本文介绍如何在macOS上生成SSH密钥。

# 步骤

## 1. 进入~/.ssh目录

```zsh
cd ~/.ssh
```

**警告：** 如果该目录不存在，请先创建。
{: .notice--warning}

## 2. 生成密钥

```zsh
ssh-keygen -t rsa -b 4096 -C "email@example.com"
```
