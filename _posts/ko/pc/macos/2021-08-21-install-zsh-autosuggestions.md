---
date: 2021-08-21T00:00+09:00
title: "[macOS] Zsh 자동 완성 플러그인 설치하기"
ref: install-zsh-autosuggestions
excerpt: "macOS에서 zsh-autosuggestions 플러그인을 설치하는 방법을 정리한다."
last_modified_at: 2021-08-21T15:33+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-zsh-autosuggestions.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/install-zsh-autosuggestions.png"
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
  - Plugin
depth:
  - title: "PC"
    url: /ko/pc/
  - title: "macOS"
    url: /ko/pc/macos/
---

# 개요

macOS에서 zsh-autosuggestions 플러그인을 설치하는 방법을 정리한다.

# 정리

## 1. Oh-My-Zsh 플러그인 폴더로 이동

```zsh
cd ~/.oh-my-zsh/custom/plugins
```

## 2. 플러그인 레포지토리 클론

```zsh
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

## 3. ~/.zshrc의 plugins에 zsh-autosuggestions 추가

```zsh
plugins=(
    # other plugins...
    zsh-autosuggestions
)
```

# 참고

- <https://github.com/zsh-users/zsh-autosuggestions>
