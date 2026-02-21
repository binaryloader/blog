---
date: 2026-02-21T15:00+09:00
title: "[macOS] Alfred で iTerm2 をデフォルトターミナルに設定する"
ref: alfred-iterm2-terminal-integration
lang: ja
excerpt: "Alfred でターミナルコマンドを実行する際にデフォルトの Terminal.app ではなく iTerm2 を使用するように設定する方法をまとめる。"
last_modified_at: 2026-02-21T15:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/alfred-iterm2-terminal-integration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/alfred-iterm2-terminal-integration.png"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - Alfred
  - iTerm2
  - Terminal
  - AppleScript
depth:
  - title: "PC"
    url: /ja/pc/
  - title: "macOS"
    url: /ja/pc/macos/
---

# 概要

Alfred でターミナルコマンドを実行する際にデフォルトの Terminal.app ではなく iTerm2 を使用するように設定する方法をまとめる。

# 手順

## 1. Alfred のターミナル設定を開く

Alfred Preferences で **Features > Terminal** に移動する。

## 2. Application を Custom に変更

**Application** ドロップダウンを **Custom** に変更すると AppleScript を入力できるテキストエリアが表示される。

## 3. AppleScript を入力

テキストエリアに以下の AppleScript を貼り付ける。

```applescript
on alfred_script(q)
    tell application "iTerm2"
        activate
        try
            tell current window
                create tab with default profile
                tell current session
                    write text q
                end tell
            end tell
        on error
            create window with default profile
            tell current window
                tell current session
                    write text q
                end tell
            end tell
        end try
    end tell
end alfred_script
```

このスクリプトは以下のように動作する。

- iTerm2 がすでに開いている場合は現在のウィンドウに新しいタブを作成してコマンドを実行する
- iTerm2 のウィンドウが存在しない場合は新しいウィンドウを作成してコマンドを実行する

## 4. 確認

Alfred で `>` プレフィックスを付けてコマンドを入力し iTerm2 で実行されることを確認する。

# 参考

- <https://github.com/vitorgalvao/custom-alfred-iterm-scripts>
