---
title: "[macOS] OpenJDK 설치하기"
last_modified_at: 2024-11-19T14:12+09:00
published: true
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
    url: /playground/
  - title: "macOS"
    url: /playground/macos/
---

# 정리

## Eclipse Temurin OpenJDK 설치

### 최신 버전 설치

```zsh
brew install --cask temurin
```

### 특정 버전 설치

```zsh
brew install --cask temurin@17 
```

## 버전 확인

```zsh
java --version
```

# 참고

- <https://adoptium.net/temurin>
- <https://formulae.brew.sh/cask/temurin>
