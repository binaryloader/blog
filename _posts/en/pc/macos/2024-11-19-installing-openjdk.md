---
title: "[macOS] Installing OpenJDK"
lang: en
ref: installing-openjdk
excerpt: "How to install Eclipse Temurin OpenJDK on macOS using Homebrew."
last_modified_at: 2024-11-19T14:12+09:00
published: true
permalink: /en/pc/macos/installing-openjdk/
header:
  overlay_color: "#202020"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - JDK
  - OpenJDK
  - Java
depth:
  - title: "PC"
    url: /en/pc/
  - title: "macOS"
    url: /en/pc/macos/
---

# Overview

This guide covers how to install Eclipse Temurin OpenJDK on macOS.

# Steps

## 1. Install Eclipse Temurin OpenJDK

### Install the latest version

```zsh
brew install --cask temurin
```

### Install a specific version

```zsh
brew install --cask temurin@17
```

## 2. Verify the installation

```zsh
java --version
```

# References

- <https://adoptium.net/temurin>
- <https://formulae.brew.sh/cask/temurin>
