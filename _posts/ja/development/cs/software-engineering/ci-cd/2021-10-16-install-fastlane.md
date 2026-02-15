---
date: 2021-10-16T00:00+09:00
title: "[CI/CD] fastlaneをインストールする"
ref: install-fastlane
excerpt: "macOSでfastlaneをインストールする方法をまとめる。"
lang: ja
last_modified_at: 2021-10-16T04:32+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-fastlane.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/install-fastlane.png"
categories:
  - Development
  - CS
  - Software-Engineering
  - CI/CD
tags:
  - Development
  - CS
  - Software Engineering
  - CI/CD
  - fastlane
  - iOS
  - Automation
  - Ruby
depth:
  - title: "Development"
    url: /ja/development/
  - title: "CS"
    url: /ja/development/cs/
  - title: "Software Engineering"
    url: /ja/development/cs/software-engineering/
  - title: "CI/CD"
    url: /ja/development/cs/software-engineering/ci-cd/
---

# 概要

macOSでfastlaneをインストールする方法をまとめる。

# 手順

## 1. Xcode Command Line Toolsのインストール

```zsh
xcode-select --install
```

- 既にインストール済みの場合は次のステップに進む。

## 2. 方法1: Managed Ruby環境 + Bundler (macOS/Linux/Windows)

### 2.1. Rubyバージョンの確認

```zsh
ruby --version
```

- fastlane supports Ruby versions 2.5 or newer.（2021年10月16日時点）

### 2.2. Bundlerのインストール

```zsh
gem install bundler
```

### 2.3. Homebrewでインストール

```zsh
brew install fastlane
```

## 3. 方法2: System Ruby + RubyGems (macOS/Linux/Windows)

### 3.1. RubyGemsでインストール

```zsh
sudo gem install fastlane
```

- System Rubyを使用するこのインストール方法はmacOS環境では推奨されない。

## 4. インストールの確認

```zsh
fastlane -v
```

# 参考

- <https://github.com/fastlane/fastlane>
- <https://docs.fastlane.tools/>
