---
title: "[macOS] OpenJDKのインストール"
lang: ja
ref: installing-openjdk
excerpt: "macOSでHomebrewを使ってEclipse Temurin OpenJDKをインストールする方法をまとめる。"
last_modified_at: 2024-11-19T14:12+09:00
published: true
permalink: /ja/pc/macos/installing-openjdk/
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
    url: /ja/pc/
  - title: "macOS"
    url: /ja/pc/macos/
---

# 概要

macOSでEclipse Temurin OpenJDKをインストールする方法をまとめます。

# 手順

## 1. Eclipse Temurin OpenJDKのインストール

### 最新バージョンのインストール

```zsh
brew install --cask temurin
```

### 特定バージョンのインストール

```zsh
brew install --cask temurin@17
```

## 2. バージョンの確認

```zsh
java --version
```

# 参考

- <https://adoptium.net/temurin>
- <https://formulae.brew.sh/cask/temurin>
