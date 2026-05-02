---
date: 2021-10-16T00:00+09:00
title: "[Python] PIPをインストールする"
ref: install-python3-pip
lang: ja
excerpt: "Python 3のパッケージマネージャPIPをインストールする方法をまとめる。"
last_modified_at: 2021-10-16T04:32+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-python3-pip.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/install-python3-pip.png"
categories:
  - Development
  - Language
  - Python
tags:
  - Development
  - Language
  - Python
  - Python3
  - PIP
  - Package Management
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Language"
    url: /ja/development/language/
  - title: "Python"
    url: /ja/development/language/python/
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

# 概要

Python 3のパッケージマネージャPIPをインストールする方法をまとめる。

# 手順

## 1. get-pip.pyをダウンロードするパスに移動

```zsh
cd desktop
```

## 2. get-pip.pyをダウンロード

```zsh
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
```

## 3. Pythonスクリプト実行によるPIPインストール

```zsh
python3 get-pip.py
```

# 参考

- <https://pip.pypa.io/en/stable/>
