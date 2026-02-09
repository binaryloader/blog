---
title: "[macOS] OpenJDK 설치하기"
ref: installing-openjdk
excerpt: "macOS에서 Homebrew를 이용하여 Eclipse Temurin OpenJDK를 설치하는 방법을 정리한다."
last_modified_at: 2024-11-19T14:12+09:00
published: true
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
    url: /ko/pc/
  - title: "macOS"
    url: /ko/pc/macos/
---

# 개요

macOS에서 Eclipse Temurin OpenJDK를 설치하는 방법을 정리한다.

# 정리

## 1. Eclipse Temurin OpenJDK 설치

### 최신 버전 설치

```zsh
brew install --cask temurin
```

### 특정 버전 설치

```zsh
brew install --cask temurin@17
```

## 2. 버전 확인

```zsh
java --version
```

# 참고

- <https://adoptium.net/temurin>
- <https://formulae.brew.sh/cask/temurin>
