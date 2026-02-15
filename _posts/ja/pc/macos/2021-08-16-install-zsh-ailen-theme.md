---
date: 2021-08-16T00:00+09:00
title: "[macOS] Zsh Alien テーマをインストールする"
ref: install-zsh-alien-theme
lang: ja
excerpt: "macOS で Oh My Zsh の Alien テーマをインストールする方法をまとめる。"
last_modified_at: 2021-08-16T08:17+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-zsh-alien-theme.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/install-zsh-alien-theme.png"
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
    url: /ja/pc/
  - title: "macOS"
    url: /ja/pc/macos/
---

# 概要

macOS で Oh My Zsh の Alien テーマをインストールする方法をまとめる。

# 手順

## 1. Oh-My-Zsh のテーマフォルダに移動する

```zsh
cd ~/.oh-my-zsh/custom/themes
```

## 2. テーマリポジトリとサブモジュールをクローンする

```zsh
git clone https://github.com/eendroroy/alien.git
cd alien
git submodule update --init --recursive
```

## 3. ~/.zshrc に以下の行を追加する

```zsh
source ~/.oh-my-zsh/custom/themes/alien/alien.zsh
export ALIEN_THEME="red"
```

## 4. 変更を適用する

```zsh
source ~/.zshrc
```

# 参考

- <https://github.com/eendroroy/alien>
- <https://github.com/powerline/fonts>
