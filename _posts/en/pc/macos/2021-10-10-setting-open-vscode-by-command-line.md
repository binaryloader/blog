---
date: 2021-10-10T00:00+09:00
title: "[macOS] Opening Visual Studio Code from the Command Line"
ref: setting-open-vscode-by-command-line
lang: en
excerpt: "How to open Visual Studio Code from the terminal on macOS."
last_modified_at: 2021-10-10T05:09+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/setting-open-vscode-by-command-line.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/setting-open-vscode-by-command-line.png"
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

This post covers how to open Visual Studio Code from the terminal on macOS.

# Steps

## 1. Open the Command Palette in Visual Studio Code

- `Command` + `Shift` + `P`

## 2. Search for and Install the Following Shell Command

```
> Shell Command: install 'code' command in PATH
```

## 3. Verify It Works

```zsh
code ~/.ssh/config
```
