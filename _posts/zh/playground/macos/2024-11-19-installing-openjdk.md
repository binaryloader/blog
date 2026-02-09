---
title: "[macOS] 安装OpenJDK"
lang: zh
ref: installing-openjdk
excerpt: "介绍如何在macOS上使用Homebrew安装Eclipse Temurin OpenJDK。"
last_modified_at: 2024-11-19T14:12+09:00
published: true
permalink: /zh/playground/macos/installing-openjdk/
header:
  overlay_color: "#202020"
categories:
  - Playground
  - macOS
tags:
  - Playground
  - macOS
  - JDK
  - OpenJDK
  - Java
depth:
  - title: "Playground"
    url: /zh/playground/
  - title: "macOS"
    url: /zh/playground/macos/
---

# 概述

本文介绍如何在macOS上安装Eclipse Temurin OpenJDK。

# 步骤

## 1. 安装Eclipse Temurin OpenJDK

### 安装最新版本

```zsh
brew install --cask temurin
```

### 安装特定版本

```zsh
brew install --cask temurin@17
```

## 2. 验证版本

```zsh
java --version
```

# 参考

- <https://adoptium.net/temurin>
- <https://formulae.brew.sh/cask/temurin>
