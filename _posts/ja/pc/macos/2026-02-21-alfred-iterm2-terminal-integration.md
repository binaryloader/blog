---
date: 2026-02-21T15:00+09:00
title: "[macOS] Alfred で iTerm2 をデフォルトターミナルに設定する"
ref: alfred-iterm2-terminal-integration
lang: ja
excerpt: "Alfred でターミナルコマンドを実行する際にデフォルトの Terminal.app ではなく iTerm2 を使用するように設定する方法をまとめる。"
last_modified_at: 2026-02-21T16:11+09:00
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

Alfred Preferences で Features > Terminal に移動する。

## 2. Application を Custom に変更

Application ドロップダウンを Custom に変更すると AppleScript を入力できるテキストエリアが表示される。

## 3. AppleScript を入力

テキストエリアに以下の AppleScript を貼り付ける。

```applescript
on alfred_script(q)
    if application "iTerm2" is running or application "iTerm" is running then
        run script "
            on run {q}
                tell application \"iTerm\"
                    activate
                    try
                        select first window
                        set onlywindow to false
                    on error
                        create window with default profile
                        select first window
                        set onlywindow to true
                    end try
                    tell current session of current window
                        if not onlywindow then
                            tell current window
                                create tab with default profile
                            end tell
                        end if
                        write text q
                    end tell
                end tell
            end run
        " with parameters {q}
    else
        run script "
            on run {q}
                tell application \"iTerm\"
                    activate
                    try
                        select first window
                    on error
                        create window with default profile
                        select first window
                    end try
                    tell current session of current window
                        write text q
                    end tell
                end tell
            end run
        " with parameters {q}
    end if
end alfred_script
```

このスクリプトは以下のように動作する。

- iTerm2 が実行中でウィンドウが存在する場合は新しいタブを作成してコマンドを実行する
- iTerm2 が実行中だがウィンドウが存在しない場合は新しいウィンドウを作成してコマンドを実行する
- iTerm2 が実行中でない場合は iTerm2 を起動してコマンドを実行する

## 4. 確認

Alfred で `>` プレフィックスを付けてコマンドを入力し iTerm2 で実行されることを確認する。

# 参考

- <https://github.com/vitorgalvao/custom-alfred-iterm-scripts>
