---
title: "[Ruby] 설치하기"
last_modified_at: 2022-04-06T13:03+09:00
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
    url: /development/
  - title: "Language"
    url: /development/language/
  - title: "Ruby"
    url: /development/language/ruby/
---

# 한번 알아보자

## 1. rbenv 설치하기

```bash
$ brew install rbenv
```

## 2. 설치 가능한 버전 리스트 확인

```bash
$ rbenv install -l
```

## 3. 특정 버전 설치

```bash
$ rbenv install 3.0.0
$ rbenv rehash
```

## 4. ~/.zshrc에 아래 라인 추가

```text
[[ -d ~/.rbenv  ]] && \
  export PATH=${HOME}/.rbenv/bin:${PATH} && \
  eval "$(rbenv init -)"
```

## 5. 전역 버전 변경

```bash
$ rbenv global 3.0.0
```

## 6. 현재 버전 확인

```bash
$ rbenv version
```

## 7. 설치되어 있는 모든 버전 확인

```bash
$ rbenv versions
```

## 8. 특정 버전 삭제

```bash
$ rbenv uninstall 3.0.0
```

# 참조

- [https://www.ruby-lang.org/ko/documentation/installation/](https://www.ruby-lang.org/ko/documentation/installation/)
- [https://devhints.io/rbenv](https://devhints.io/rbenv)
- [https://hacoma.github.io/pc/macos/install-oh-my-zsh/](https://hacoma.github.io/pc/macos/install-oh-my-zsh/)
- [https://hacoma.github.io/pc/macos/setting-open-vscode-by-command-line/](https://hacoma.github.io/pc/macos/setting-open-vscode-by-command-line/)

===

부족한 글 읽어주셔서 감사합니다.

잘못된 내용이나 오탈자에 대한 지적은 언제나 환영입니다.  
댓글로 남겨주시면 반영하도록 하겠습니다.
