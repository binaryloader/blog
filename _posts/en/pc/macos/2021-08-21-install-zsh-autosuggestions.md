---
date: 2021-08-21T00:00+09:00
title: "[macOS] Installing the Zsh Autosuggestions Plugin"
ref: install-zsh-autosuggestions
lang: en
excerpt: "How to install the zsh-autosuggestions plugin on macOS."
last_modified_at: 2021-08-21T15:33+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-zsh-autosuggestions.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/install-zsh-autosuggestions.png"
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
    url: /en/pc/
  - title: "macOS"
    url: /en/pc/macos/
---

# Overview

This post covers how to install the zsh-autosuggestions plugin on macOS.

# Steps

## 1. Navigate to the Oh-My-Zsh Plugins Folder

```zsh
cd ~/.oh-my-zsh/custom/plugins
```

## 2. Clone the Plugin Repository

```zsh
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

## 3. Add zsh-autosuggestions to the plugins in ~/.zshrc

```zsh
plugins=(
    # other plugins...
    zsh-autosuggestions
)
```

# References

- <https://github.com/zsh-users/zsh-autosuggestions>
