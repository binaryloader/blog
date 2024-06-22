---
title: "[CI/CD] fastlane 설치하기"
last_modified_at: 2021-10-16T04:32+09:00
header:
  overlay_color: "#202020"
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
depth:
  - title: "Development"
    url: /development/
  - title: "CS"
    url: /development/cs/
  - title: "Software Engineering"
    url: /development/cs/software-engineering/
  - title: "CI/CD"
    url: /development/cs/software-engineering/ci/cd/
---

# 한번 알아보자

## 1. Xcode command line tools 설치

```bash
$ xcode-select --install
```

- 이미 설치가 되어 있다면 다음 단계로 넘어가도 된다.

## 2. 방법 1. Managed Ruby environment + Bundler (macOS/Linux/Windows)

### 2.1. Ruby 버전 확인

```bash
$ ruby --version
```

- fastlane supports Ruby versions 2.5 or newer. (2021. 10. 16 기준)

### 2.2. Bundler 설치

```bash
$ gem install bundler
```

### 2.3. Homebrew로 설치

```bash
$ brew install fastlane
```

## 3. 방법 2. System Ruby + RubyGems (macOS/Linux/Windows)

### 3.1. RubyGems로 설치

```bash
$ sudo gem install fastlane
```

- System Ruby를 사용하는 이 설치 방법은 macOS 환경에서 권장되지 않는다.

## 4. 설치 확인

```bash
$ fastlane -v
```

# 참조

- [https://github.com/fastlane/fastlane](https://github.com/fastlane/fastlane)
- [https://docs.fastlane.tools/](https://docs.fastlane.tools/)

===

부족한 글 읽어주셔서 감사합니다.

잘못된 내용이나 오탈자에 대한 지적은 언제나 환영입니다.  
댓글로 남겨주시면 반영하도록 하겠습니다.
