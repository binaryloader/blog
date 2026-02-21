---
date: 2026-02-21T15:00+09:00
title: "[macOS] Alfred에서 iTerm2를 기본 터미널로 설정하기"
ref: alfred-iterm2-terminal-integration
excerpt: "Alfred에서 터미널 커맨드를 실행할 때 기본 Terminal.app 대신 iTerm2를 사용하도록 설정하는 방법을 정리한다."
last_modified_at: 2026-02-21T16:11+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/alfred-iterm2-terminal-integration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/alfred-iterm2-terminal-integration.png"
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
    url: /ko/pc/
  - title: "macOS"
    url: /ko/pc/macos/
---

# 개요

Alfred에서 터미널 커맨드를 실행할 때 기본 Terminal.app 대신 iTerm2를 사용하도록 설정하는 방법을 정리한다.

# 정리

## 1. Alfred 터미널 설정 열기

Alfred Preferences에서 **Features > Terminal**로 이동한다.

## 2. Application을 Custom으로 변경

**Application** 드롭다운을 **Custom**으로 변경하면 AppleScript를 입력할 수 있는 텍스트 영역이 나타난다.

## 3. AppleScript 입력

텍스트 영역에 아래 AppleScript를 붙여넣는다.

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

이 스크립트는 아래와 같이 동작한다.

- iTerm2가 실행 중이고 윈도우가 있으면 새 탭을 생성하고 커맨드를 실행한다
- iTerm2가 실행 중이지만 윈도우가 없으면 새 윈도우를 생성하고 커맨드를 실행한다
- iTerm2가 실행 중이 아니면 iTerm2를 시작하고 커맨드를 실행한다

## 4. 확인

Alfred에서 `>` 접두사를 붙여 커맨드를 입력하면 iTerm2에서 실행되는지 확인한다.

# 참고

- <https://github.com/vitorgalvao/custom-alfred-iterm-scripts>
