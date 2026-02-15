---
date: 2021-10-10T00:00+09:00
title: "[macOS] Generating SSH Keys"
lang: en
ref: generating-ssh-keys
excerpt: "How to generate SSH keys on macOS using ssh-keygen."
last_modified_at: 2021-10-10T04:36+09:00
published: true
permalink: /en/pc/macos/generating-ssh-keys/
header:
  overlay_image: "/assets/image/thumbnail/header/generating-ssh-keys.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/generating-ssh-keys.png"
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
    url: /en/pc/
  - title: "macOS"
    url: /en/pc/macos/
---

# Overview

This guide covers how to generate SSH keys on macOS.

# Steps

## 1. Navigate to ~/.ssh directory

```zsh
cd ~/.ssh
```

**Warning:** If the directory does not exist, create it first.
{: .notice--warning}

## 2. Generate a key

```zsh
ssh-keygen -t rsa -b 4096 -C "email@example.com"
```
