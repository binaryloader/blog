---
title: "[macOS] Zsh 自動補完プラグインをインストールする"
ref: install-zsh-autosuggestions
lang: ja
excerpt: "macOS で zsh-autosuggestions プラグインをインストールする方法をまとめる。"
last_modified_at: 2021-08-21T15:33+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - Oh-My-Zsh
depth:
  - title: "PC"
    url: /ja/pc/
  - title: "macOS"
    url: /ja/pc/macos/
---

# 概要

macOS で zsh-autosuggestions プラグインをインストールする方法をまとめる。

# 手順

## 1. Oh-My-Zsh のプラグインフォルダに移動する

```zsh
cd ~/.oh-my-zsh/custom/plugins
```

## 2. プラグインリポジトリをクローンする

```zsh
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

## 3. ~/.zshrc の plugins に zsh-autosuggestions を追加する

```zsh
plugins=(
    # other plugins...
    zsh-autosuggestions
)
```

# 参考

- <https://github.com/zsh-users/zsh-autosuggestions>
