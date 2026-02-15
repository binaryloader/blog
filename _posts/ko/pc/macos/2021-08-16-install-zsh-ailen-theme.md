---
date: 2021-08-16T00:00+09:00
title: "[macOS] Zsh Alien 테마 설치하기"
ref: install-zsh-alien-theme
excerpt: "macOS에서 Oh My Zsh의 Alien 테마를 설치하는 방법을 정리한다."
last_modified_at: 2021-08-16T08:17+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-zsh-alien-theme.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/install-zsh-alien-theme.png"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - Oh-My-Zsh
  - Terminal
  - Zsh
  - Shell
  - Theme
depth:
  - title: "PC"
    url: /ko/pc/
  - title: "macOS"
    url: /ko/pc/macos/
---

# 개요

macOS에서 Oh My Zsh의 Alien 테마를 설치하는 방법을 정리한다.

# 정리

## 1. Oh-My-Zsh 테마 폴더로 이동

```zsh
cd ~/.oh-my-zsh/custom/themes
```

## 2. 테마 레포지토리 및 서브 모듈 클론

```zsh
git clone https://github.com/eendroroy/alien.git
cd alien
git submodule update --init --recursive
```

## 3. ~/.zshrc에 아래 라인 추가

```zsh
source ~/.oh-my-zsh/custom/themes/alien/alien.zsh
export ALIEN_THEME="red"
```

## 4. 적용

```zsh
source ~/.zshrc
```

# 참고

- <https://github.com/eendroroy/alien>
- <https://github.com/powerline/fonts>
