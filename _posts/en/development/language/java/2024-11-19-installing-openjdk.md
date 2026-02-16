---
date: 2024-11-19T00:00+09:00
title: "[Java] Installing OpenJDK"
lang: en
ref: installing-openjdk
excerpt: "How to install Eclipse Temurin OpenJDK on macOS using Homebrew."
last_modified_at: 2024-11-19T14:12+09:00
published: true
permalink: /en/development/language/java/installing-openjdk/
header:
  overlay_image: "/assets/image/thumbnail/header/installing-openjdk.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/installing-openjdk.png"
categories:
  - Development
  - Language
  - Java
tags:
  - Development
  - Language
  - Java
  - JDK
  - OpenJDK
  - Homebrew
  - Temurin
depth:
  - title: "Development"
    url: /en/development/
  - title: "Language"
    url: /en/development/language/
  - title: "Java"
    url: /en/development/language/java/
---

# Overview

This guide covers how to install Eclipse Temurin OpenJDK on macOS.

# Steps

## 1. Install Eclipse Temurin OpenJDK

### 1.1. Install the latest version

```zsh
brew install --cask temurin
```

### 1.2. Install a specific version

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
