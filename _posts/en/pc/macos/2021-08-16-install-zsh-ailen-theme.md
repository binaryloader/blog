---
date: 2021-08-16T00:00+09:00
title: "[macOS] Installing the Zsh Alien Theme"
ref: install-zsh-alien-theme
lang: en
excerpt: "How to install the Alien theme for Oh My Zsh on macOS."
last_modified_at: 2021-08-16T08:17+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-zsh-alien-theme.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/install-zsh-alien-theme.png"
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
    url: /en/pc/
  - title: "macOS"
    url: /en/pc/macos/
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: binaryloader
---

# Overview

This post covers how to install the Alien theme for Oh My Zsh on macOS.

# Steps

## 1. Navigate to the Oh-My-Zsh Themes Folder

```zsh
cd ~/.oh-my-zsh/custom/themes
```

## 2. Clone the Theme Repository and Its Submodules

```zsh
git clone https://github.com/eendroroy/alien.git
cd alien
git submodule update --init --recursive
```

## 3. Add the Following Lines to ~/.zshrc

```zsh
source ~/.oh-my-zsh/custom/themes/alien/alien.zsh
export ALIEN_THEME="red"
```

## 4. Apply the Changes

```zsh
source ~/.zshrc
```

# References

- <https://github.com/eendroroy/alien>
- <https://github.com/powerline/fonts>
