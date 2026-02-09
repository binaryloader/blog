---
title: "[Ruby] 설치하기"
ref: install-ruby
excerpt: "macOS에서 rbenv를 이용하여 Ruby를 설치하는 방법을 정리한다."
last_modified_at: 2022-04-06T13:03+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Development
  - Language
  - Ruby
tags:
  - Development
  - Language
  - Ruby
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Language"
    url: /ko/development/language/
  - title: "Ruby"
    url: /ko/development/language/ruby/
---

# 개요

macOS에서 rbenv를 이용하여 Ruby를 설치하는 방법을 정리한다.

# 정리

## 1. rbenv 설치하기

```zsh
brew install rbenv
```

## 2. 설치 가능한 버전 리스트 확인

```zsh
rbenv install -l
```

## 3. 특정 버전 설치

```zsh
rbenv install 3.0.0
rbenv rehash
```

## 4. ~/.zshrc에 아래 라인 추가

```text
[[ -d ~/.rbenv  ]] && \
  export PATH=${HOME}/.rbenv/bin:${PATH} && \
  eval "$(rbenv init -)"
```

## 5. 전역 버전 변경

```zsh
rbenv global 3.0.0
```

## 6. 현재 버전 확인

```zsh
rbenv version
```

## 7. 설치되어 있는 모든 버전 확인

```zsh
rbenv versions
```

## 8. 특정 버전 삭제

```zsh
rbenv uninstall 3.0.0
```

# 참고

- <https://www.ruby-lang.org/ko/documentation/installation/>
- <https://devhints.io/rbenv>
- [Oh My Zsh 설치하기](/ko/pc/macos/install-oh-my-zsh/)
- [커맨드 라인으로 VSCode 열기 설정](/ko/pc/macos/setting-open-vscode-by-command-line/)
