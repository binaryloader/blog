---
date: 2021-10-16T00:00+09:00
title: "[CI/CD] Installing fastlane"
ref: install-fastlane
excerpt: "How to install fastlane on macOS."
lang: en
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
    url: /en/development/
  - title: "CS"
    url: /en/development/cs/
  - title: "Software Engineering"
    url: /en/development/cs/software-engineering/
  - title: "CI/CD"
    url: /en/development/cs/software-engineering/ci-cd/
---

# Overview

This post covers how to install fastlane on macOS.

# Steps

## 1. Install Xcode Command Line Tools

```zsh
xcode-select --install
```

- If already installed, proceed to the next step.

## 2. Method 1: Managed Ruby Environment + Bundler (macOS/Linux/Windows)

### 2.1. Check Ruby Version

```zsh
ruby --version
```

- fastlane supports Ruby versions 2.5 or newer. (As of October 16, 2021)

### 2.2. Install Bundler

```zsh
gem install bundler
```

### 2.3. Install via Homebrew

```zsh
brew install fastlane
```

## 3. Method 2: System Ruby + RubyGems (macOS/Linux/Windows)

### 3.1. Install via RubyGems

```zsh
sudo gem install fastlane
```

- This installation method using System Ruby is not recommended on macOS.

## 4. Verify Installation

```zsh
fastlane -v
```

# References

- <https://github.com/fastlane/fastlane>
- <https://docs.fastlane.tools/>
