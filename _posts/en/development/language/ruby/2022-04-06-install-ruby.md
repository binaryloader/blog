---
date: 2022-04-06T00:00+09:00
title: "[Ruby] Installing Ruby"
ref: install-ruby
lang: en
excerpt: "How to install Ruby using rbenv on macOS."
last_modified_at: 2022-04-06T13:03+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-ruby.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/install-ruby.png"
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
    url: /en/development/
  - title: "Language"
    url: /en/development/language/
  - title: "Ruby"
    url: /en/development/language/ruby/
---

# Overview

How to install Ruby using rbenv on macOS.

# Steps

## 1. Install rbenv

```zsh
brew install rbenv
```

## 2. Check available version list

```zsh
rbenv install -l
```

## 3. Install a specific version

```zsh
rbenv install 3.0.0
rbenv rehash
```

## 4. Add the following lines to ~/.zshrc

```text
[[ -d ~/.rbenv  ]] && \
  export PATH=${HOME}/.rbenv/bin:${PATH} && \
  eval "$(rbenv init -)"
```

## 5. Change the global version

```zsh
rbenv global 3.0.0
```

## 6. Check the current version

```zsh
rbenv version
```

## 7. Check all installed versions

```zsh
rbenv versions
```

## 8. Uninstall a specific version

```zsh
rbenv uninstall 3.0.0
```

# References

- <https://www.ruby-lang.org/ko/documentation/installation/>
- <https://devhints.io/rbenv>
- [Install Oh My Zsh](/en/pc/macos/install-oh-my-zsh/)
- [Setting Up Opening VSCode by Command Line](/en/pc/macos/setting-open-vscode-by-command-line/)
