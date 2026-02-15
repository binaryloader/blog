---
date: 2021-10-10T00:00+09:00
title: "[macOS] コマンドラインから Visual Studio Code を開く"
ref: setting-open-vscode-by-command-line
lang: ja
excerpt: "macOS でターミナルから Visual Studio Code を開く方法をまとめる。"
last_modified_at: 2021-10-10T05:09+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/setting-open-vscode-by-command-line.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/setting-open-vscode-by-command-line.png"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - Command Line
  - Visual Studio Code
  - VSCode
  - Terminal
  - Shell
depth:
  - title: "PC"
    url: /ja/pc/
  - title: "macOS"
    url: /ja/pc/macos/
---

# 概要

macOS でターミナルから Visual Studio Code を開く方法をまとめる。

# 手順

## 1. Visual Studio Code でコマンドパレットを開く

- `Command` + `Shift` + `P`

## 2. 以下の Shell Command を検索してインストールする

```
> Shell Command: install 'code' command in PATH
```

## 3. 動作確認

```zsh
code ~/.ssh/config
```
