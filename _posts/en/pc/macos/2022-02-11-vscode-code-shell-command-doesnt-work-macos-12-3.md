---
date: 2022-02-11T00:00+09:00
title: "[macOS] Fixing Visual Studio Code's code Shell Command Not Working on macOS 12.3"
ref: vscode-code-shell-command-doesnt-work-macos-12-3
lang: en
excerpt: "A guide on how to fix the issue where VS Code's code command stops working due to the removal of Python 2 in macOS 12.3."
last_modified_at: 2022-02-11T18:27+09:00
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
  - Python
  - Troubleshooting
depth:
  - title: "PC"
    url: /en/pc/
  - title: "macOS"
    url: /en/pc/macos/
---

# Overview

This guide explains how to fix the issue where VS Code's `code` command stops working due to the removal of Python 2 in macOS 12.3.

# Steps

## 1. Identifying the Cause

- With the removal of Python 2 in macOS 12.3, running Visual Studio Code's `code` Shell Command produces the following error:
  ```bash
  /usr/local/bin/code: line 6: python: command not found
  /usr/local/bin/code: line 10: ./MacOS/Electron: No such file or directory
  ```

## 2. Fixing the Issue

### 2.1. Navigate to the /usr/local/bin Directory

```zsh
cd /usr/local/bin
```

### 2.2. Edit the code File Using vi or nano

```zsh
nano code
```

```bash
# Before
function realpath() { python -c ...

# After
function realpath() { python3 -c ...
```

# References

- <https://github.com/microsoft/vscode/issues/141738>
