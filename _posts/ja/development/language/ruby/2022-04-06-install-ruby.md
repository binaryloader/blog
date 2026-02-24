---
date: 2022-04-06T00:00+09:00
title: "[Ruby] Rubyをインストールする"
ref: install-ruby
lang: ja
excerpt: "macOSでrbenvを利用してRubyをインストールする方法をまとめる。"
last_modified_at: 2022-04-06T13:03+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-ruby.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/install-ruby.png"
categories:
  - Development
  - Language
  - Ruby
tags:
  - Development
  - Language
  - Ruby
  - rbenv
  - Version Management
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Language"
    url: /ja/development/language/
  - title: "Ruby"
    url: /ja/development/language/ruby/
---

# 概要

macOSでrbenvを利用してRubyをインストールする方法をまとめる。

# 手順

## 1. rbenvをインストール

```zsh
brew install rbenv
```

## 2. インストール可能なバージョンリストを確認

```zsh
rbenv install -l
```

## 3. 特定バージョンをインストール

```zsh
rbenv install 3.0.0
rbenv rehash
```

## 4. ~/.zshrcに以下の行を追加

```text
[[ -d ~/.rbenv  ]] && \
  export PATH=${HOME}/.rbenv/bin:${PATH} && \
  eval "$(rbenv init -)"
```

## 5. グローバルバージョンを変更

```zsh
rbenv global 3.0.0
```

## 6. 現在のバージョンを確認

```zsh
rbenv version
```

## 7. インストールされているすべてのバージョンを確認

```zsh
rbenv versions
```

## 8. 特定バージョンを削除

```zsh
rbenv uninstall 3.0.0
```

# 参考

- <https://devhints.io/rbenv>
- <https://www.ruby-lang.org/ko/documentation/installation/>
- [Oh My Zshをインストールする](/ja/pc/macos/install-oh-my-zsh/)
- [コマンドラインでVSCodeを開く設定](/ja/pc/macos/setting-open-vscode-by-command-line/)
