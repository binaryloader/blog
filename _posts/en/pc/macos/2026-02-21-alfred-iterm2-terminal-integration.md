---
date: 2026-02-21T15:00+09:00
title: "[macOS] Setting iTerm2 as the Default Terminal in Alfred"
ref: alfred-iterm2-terminal-integration
lang: en
excerpt: "How to configure Alfred to use iTerm2 instead of the default Terminal.app when running terminal commands."
last_modified_at: 2026-02-21T16:11+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/alfred-iterm2-terminal-integration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/alfred-iterm2-terminal-integration.png"
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
    url: /en/pc/
  - title: "macOS"
    url: /en/pc/macos/
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: Claude
---

# Overview

This post covers how to configure Alfred to use iTerm2 instead of the default Terminal.app when running terminal commands.

# Steps

## 1. Open Alfred Terminal Settings

In Alfred Preferences, navigate to Features > Terminal.

## 2. Change Application to Custom

Change the Application dropdown to Custom. A text area for entering AppleScript will appear.

## 3. Enter the AppleScript

Paste the following AppleScript into the text area.

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

This script works as follows.

- If iTerm2 is running and a window exists, it creates a new tab and runs the command
- If iTerm2 is running but no window exists, it creates a new window and runs the command
- If iTerm2 is not running, it launches iTerm2 and runs the command

## 4. Verify

Type a command in Alfred with the `>` prefix and verify that it runs in iTerm2.

# References

- <https://github.com/vitorgalvao/custom-alfred-iterm-scripts>
