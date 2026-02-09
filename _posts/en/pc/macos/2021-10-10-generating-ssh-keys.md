---
title: "[macOS] Generating SSH Keys"
lang: en
ref: generating-ssh-keys
excerpt: "How to generate SSH keys on macOS using ssh-keygen."
last_modified_at: 2021-10-10T04:36+09:00
published: true
permalink: /en/pc/macos/generating-ssh-keys/
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
