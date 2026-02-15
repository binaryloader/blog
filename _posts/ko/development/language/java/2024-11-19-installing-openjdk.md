---
date: 2024-11-19T00:00+09:00
title: "[Java] OpenJDK 설치하기"
ref: installing-openjdk
excerpt: "macOS에서 Homebrew를 이용하여 Eclipse Temurin OpenJDK를 설치하는 방법을 정리한다."
last_modified_at: 2024-11-19T14:12+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/installing-openjdk.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/installing-openjdk.png"
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
    url: /ko/development/
  - title: "Language"
    url: /ko/development/language/
  - title: "Java"
    url: /ko/development/language/java/
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
