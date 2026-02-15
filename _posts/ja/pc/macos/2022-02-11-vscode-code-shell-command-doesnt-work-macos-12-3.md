---
date: 2022-02-11T00:00+09:00
title: "[macOS] macOS 12.3でVisual Studio Codeのcode Shellコマンドが動作しない問題の解決方法"
ref: vscode-code-shell-command-doesnt-work-macos-12-3
lang: ja
excerpt: "macOS 12.3でPython 2が削除されたことによりVS Codeのcodeコマンドが動作しなくなる問題の解決方法をまとめます。"
last_modified_at: 2022-02-11T18:27+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/vscode-code-shell-command-doesnt-work-macos-12-3.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/vscode-code-shell-command-doesnt-work-macos-12-3.png"
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
    url: /ja/pc/
  - title: "macOS"
    url: /ja/pc/macos/
---

# 概要

macOS 12.3でPython 2が削除されたことによりVS Codeの`code`コマンドが動作しなくなる問題の解決方法をまとめます。

# 手順

## 1. 原因の特定

- macOS 12.3でPython 2が削除されたことに伴い、Visual Studio Codeの`code` Shellコマンドを実行すると以下のようなエラーが発生します。
  ```bash
  /usr/local/bin/code: line 6: python: command not found
  /usr/local/bin/code: line 10: ./MacOS/Electron: No such file or directory
  ```

## 2. 問題の解決

### 2.1. /usr/local/binディレクトリに移動

```zsh
cd /usr/local/bin
```

### 2.2. viまたはnanoでcodeファイルの内容を修正

```zsh
nano code
```

```bash
# 修正前
function realpath() { python -c ...

# 修正後
function realpath() { python3 -c ...
```

# 参考

- <https://github.com/microsoft/vscode/issues/141738>
