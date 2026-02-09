---
title: "[macOS] Opening Visual Studio Code from the Command Line"
ref: setting-open-vscode-by-command-line
lang: en
excerpt: "How to open Visual Studio Code from the terminal on macOS."
last_modified_at: 2021-10-10T05:09+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - Command Line
  - Visual Studio Code
  - VSCode
depth:
  - title: "PC"
    url: /en/pc/
  - title: "macOS"
    url: /en/pc/macos/
---

# Overview

This post covers how to open Visual Studio Code from the terminal on macOS.

# Guide

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
