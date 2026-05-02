---
date: 2021-10-10T00:00+09:00
title: "[macOS] Command Line으로 Visual Studio Code 열기"
ref: setting-open-vscode-by-command-line
excerpt: "macOS에서 터미널을 통해 Visual Studio Code를 여는 방법을 정리한다."
last_modified_at: 2021-10-10T05:09+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/setting-open-vscode-by-command-line.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/setting-open-vscode-by-command-line.png"
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
    url: /ko/pc/
  - title: "macOS"
    url: /ko/pc/macos/
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

# 개요

macOS에서 터미널을 통해 Visual Studio Code를 여는 방법을 정리한다.

# 정리

## 1. Visual Studio Code에서 Command Palette 실행

- `Command` + `Shift` + `P`

## 2. 아래와 같은 Shell Command 검색 후 설치

```
> Shell Command: install 'code' command in PATH
```

## 3. 작동 확인

```zsh
code ~/.ssh/config
```
