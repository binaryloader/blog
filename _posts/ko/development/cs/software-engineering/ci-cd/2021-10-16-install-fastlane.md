---
date: 2021-10-16T00:00+09:00
title: "[CI/CD] fastlane 설치하기"
ref: install-fastlane
excerpt: "macOS에서 fastlane을 설치하는 방법을 정리한다."
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
    url: /ko/development/
  - title: "CS"
    url: /ko/development/cs/
  - title: "Software Engineering"
    url: /ko/development/cs/software-engineering/
  - title: "CI/CD"
    url: /ko/development/cs/software-engineering/ci-cd/
---

# 개요

macOS에서 fastlane을 설치하는 방법을 정리한다.

# 정리

## 1. Xcode command line tools 설치

```zsh
xcode-select --install
```

- 이미 설치가 되어 있다면 다음 단계로 넘어가도 된다.

## 2. 방법 1. Managed Ruby environment + Bundler (macOS/Linux/Windows)

### 2.1. Ruby 버전 확인

```zsh
ruby --version
```

- fastlane supports Ruby versions 2.5 or newer. (2021. 10. 16 기준)

### 2.2. Bundler 설치

```zsh
gem install bundler
```

### 2.3. Homebrew로 설치

```zsh
brew install fastlane
```

## 3. 방법 2. System Ruby + RubyGems (macOS/Linux/Windows)

### 3.1. RubyGems로 설치

```zsh
sudo gem install fastlane
```

- System Ruby를 사용하는 이 설치 방법은 macOS 환경에서 권장되지 않는다.

## 4. 설치 확인

```zsh
fastlane -v
```

# 참고

- <https://github.com/fastlane/fastlane>
- <https://docs.fastlane.tools/>
