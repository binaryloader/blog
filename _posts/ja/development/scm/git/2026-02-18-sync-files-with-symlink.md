---
date: 2026-02-18T14:00+09:00
title: "[Git] シンボリックリンクで設定ファイルを Git リポジトリと同期する"
ref: sync-files-with-symlink
lang: ja
excerpt: "シンボリックリンクを活用して特定パスの設定ファイルを Git リポジトリでバージョン管理する方法をまとめる。"
last_modified_at: 2026-02-18T14:00+09:00
published: true
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/sync-files-with-symlink.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/sync-files-with-symlink.png"
categories:
  - Development
  - SCM
  - Git
tags:
  - Git
  - Symbolic Link
  - dotfiles
depth:
  - title: "Development"
    url: /ja/development/
  - title: "SCM"
    url: /ja/development/scm/
  - title: "Git"
    url: /ja/development/scm/git/
---

# 概要

シンボリックリンクを活用して特定パスの設定ファイルを Git リポジトリでバージョン管理する方法をまとめる。

# 手順

## 1. シンボリックリンクとは

シンボリックリンク（symbolic link、symlink）は、別のファイルやディレクトリを指す特殊なファイルである。Windows のショートカットに似た概念で、実際のデータは元のファイルにのみ存在し、シンボリックリンクはパス情報だけを保持する。

ハードリンクとの違いは以下の通りである。

- **シンボリックリンク**: 元ファイルの**パス**を参照する。元ファイルが削除されるとリンクが壊れる（dangling link）。
- **ハードリンク**: 元ファイルの **inode** を共有する。元ファイルが削除されてもデータにアクセスできる。

設定ファイルの同期にはシンボリックリンクが適している。元ファイルの場所が明確で、リンクがどのファイルを指しているか直感的に確認できるためである。

## 2. シンボリックリンクの作成

`ln -s` コマンドでシンボリックリンクを作成する。

```zsh
ln -s <元のパス> <リンクのパス>
```

例えば `~/Documents/memo.txt` をデスクトップからアクセスしたい場合は以下のように実行する。

```zsh
ln -s ~/Documents/memo.txt ~/Desktop/memo.txt
```

リンクが正常に作成されたか確認する。

```zsh
ls -la ~/Desktop/memo.txt
# lrwxr-xr-x  1 user  staff  25 Feb 18 14:00 memo.txt -> /Users/user/Documents/memo.txt
```

`l` で始まるファイルタイプと `->` 矢印でシンボリックリンクであることが確認できる。

## 3. Git リポジトリとの同期

設定ファイルが特定のシステムパスに存在しなければならないが、Git でバージョン管理もしたい場合がある。`~/.zshrc`、`~/.gitconfig`、`~/.ssh/config` などの dotfiles が代表的な例である。元ファイルを Git リポジトリに移動し、元の場所にシンボリックリンクを作成する。

### 3.1. 元ファイルをリポジトリに移動

```zsh
mv ~/.zshrc ~/repos/dotfiles/.zshrc
```

### 3.2. シンボリックリンクを作成

```zsh
ln -s ~/repos/dotfiles/.zshrc ~/.zshrc
```

これで `~/.zshrc` を編集すると実際にはリポジトリ内のファイルが変更される。リポジトリでコミット・プッシュすれば設定ファイルの変更履歴が管理される。

### 3.3. 他の dotfiles も同じ方法

```zsh
# 元ファイルをリポジトリに移動
mv ~/.gitconfig ~/repos/dotfiles/.gitconfig
mv ~/.ssh/config ~/repos/dotfiles/.ssh/config

# シンボリックリンクを作成
ln -s ~/repos/dotfiles/.gitconfig ~/.gitconfig
ln -s ~/repos/dotfiles/.ssh/config ~/.ssh/config
```

## 4. 同期の解除

シンボリックリンクを削除し、元ファイルを元の場所に戻す。

```zsh
# シンボリックリンクを削除（元ファイルに影響なし）
rm ~/.zshrc

# 元ファイルを復元
mv ~/repos/dotfiles/.zshrc ~/.zshrc
```

`rm` はシンボリックリンクのみを削除し、元ファイルには影響しない。

## 5. 注意事項

### 絶対パスと相対パス

シンボリックリンク作成時は元のパスを絶対パスで指定するのが安全である。相対パスはリンクファイルの位置を基準に解釈されるため、リンクを移動すると壊れる可能性がある。

```zsh
# 絶対パス（推奨）
ln -s /Users/user/repos/dotfiles/.zshrc ~/.zshrc

# 相対パス（リンクの位置基準）
ln -s ../repos/dotfiles/.zshrc ~/.zshrc
```

### 元ファイル削除時のリンク切れ

元ファイルを削除するとシンボリックリンクが壊れる。壊れたリンクにアクセスすると "No such file or directory" エラーが発生する。壊れたリンクは以下のコマンドで検出できる。

```zsh
find ~ -maxdepth 3 -type l ! -exec test -e {} \; -print
```

### Git でのシンボリックリンク追跡

Git はシンボリックリンク自体を追跡する。リポジトリにシンボリックリンクをコミットすると、リンクが指すパスが保存される。別の環境でクローンした際にそのパスに元ファイルが存在しなければリンクが壊れる。そのため、リポジトリには元ファイルを置き、シンボリックリンクはリポジトリ外のシステムパスに作成するのが一般的である。

# 参考

- <https://dotfiles.github.io/>
- <https://man7.org/linux/man-pages/man1/ln.1.html>
