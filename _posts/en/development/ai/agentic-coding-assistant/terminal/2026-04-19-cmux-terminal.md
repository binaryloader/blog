---
title: "[cmux] A Ghostty-Powered Native macOS Terminal for Parallel AI Agents"
lang: en
permalink: /en/:categories/:title/
ref: cmux-terminal
excerpt: "cmux is a native Swift + AppKit macOS terminal that embeds the Ghostty engine and is built specifically for running multiple agentic coding assistants like Claude Code, Aider, and Cline side by side. This post covers installation, core features, and keyboard shortcuts."
date: 2026-04-19T10:20+09:00
last_modified_at: 2026-04-19T10:20+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/cmux-terminal.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/cmux-terminal.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Terminal
tags:
  - cmux
  - Ghostty
  - Terminal
  - macOS
  - Agentic Coding
  - Claude Code
depth:
  - title: "Development"
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "Agentic Coding Assistant"
    url: /en/development/ai/agentic-coding-assistant/
  - title: "Terminal"
    url: /en/development/ai/agentic-coding-assistant/terminal/
sidebar:
  nav: "menu-en"
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

cmux is a native Swift + AppKit macOS terminal that embeds the Ghostty engine and is built specifically for running multiple agentic coding assistants like Claude Code, Aider, and Cline side by side. This post covers installation, core features, and keyboard shortcuts.

# Steps

## 1. What cmux Is

cmux is an open source macOS terminal released by [manaflow-ai](https://github.com/manaflow-ai/cmux). Internally it uses libghostty - the same engine that powers Ghostty - but it ships as a separate app. It keeps the lightweight GPU-accelerated rendering of Ghostty while being written entirely in Swift and AppKit, so it behaves like any other native macOS app. Because it is not built on Electron, startup and memory footprint stay light.

What sets cmux apart from a generic terminal is its intent. The app is designed to run several agentic coding assistants (Claude Code, Aider, Cline, and similar tools) in parallel inside a single window. Each agent gets its own tab or split pane, while a shared sidebar surfaces the state you actually care about during agentic workflows - notification badges, working directories, listening ports, and the current git branch. The UX is tuned so you never miss the moment an agent switches into a "waiting for input" state.

cmux supports macOS 14.0 and above on both Apple Silicon and Intel Macs. The project is open source and free to use.

## 2. Key Features

The vertical tab sidebar is the face of cmux. Tabs stack vertically, and each one automatically shows its git branch, working directory, listening ports, and notification badges. Even when multiple agents are pumping out logs at once, a single glance at the sidebar tells you which session needs attention.

Window splitting works in both directions. You can have Claude Code rewriting a file on the left, Aider preparing a commit on the right, and a local server log streaming at the bottom - all inside the same window.

Workspaces are the higher-level container for separating projects and contexts. Each workspace keeps its own tab arrangement and split layout, which makes it easy to juggle several repositories from the same window without layouts bleeding into each other.

The notification ring is the feature most tuned to agentic coding. When an agent transitions into a state that is waiting for user input, cmux highlights the panel border with a ring, raises a badge in the sidebar, and fires a macOS desktop notification. Even if you are reviewing code in another window while several agents run in parallel, you will still catch the exact moment a prompt needs your response.

The built-in browser is a scriptable browser that can be split-placed right next to the terminal. Open a dev server that an agent just built, keep documentation visible while writing code, or drive the browser with the automation socket API to control tabs and panes from an external script.

## 3. Installation

There are two install paths: a direct DMG download or Homebrew.

To download the DMG, use the link below.

```
https://github.com/manaflow-ai/cmux/releases/latest/download/cmux-macos.dmg
```

Homebrew users can tap the cask and install with the commands below.

```bash
brew tap manaflow-ai/cmux
brew install --cask cmux
```

Either way, the first launch triggers a macOS security prompt. Right-click the app in the Applications folder and choose "Open" once, and subsequent launches behave normally.

If you want to invoke `cmux` directly from a shell, create an optional CLI symlink. It is handy when automation scripts or other tools need to launch cmux by name.

```bash
sudo ln -sf "/Applications/cmux.app/Contents/Resources/bin/cmux" /usr/local/bin/cmux
```

## 4. Keyboard Shortcuts

cmux rewards learning the shortcuts. The tables below group them by scope.

App-wide shortcuts cover settings, the command palette, and window management.

| Action | Shortcut |
|--------|----------|
| Open settings | `⌘+,` |
| Command palette | `⌘+⇧+P` |
| New window | `⌘+⇧+N` |
| Quit | `⌘+Q` |

Workspace shortcuts focus on the sidebar toggle and direct numeric selection.

| Action | Shortcut |
|--------|----------|
| Toggle sidebar | `⌘+B` |
| New workspace | `⌘+N` |
| Next workspace | `⌃+⌘+]` |
| Previous workspace | `⌃+⌘+[` |
| Select workspace directly | `⌘+1` to `⌘+9` |

Tab shortcuts follow conventions most terminal users already know.

| Action | Shortcut |
|--------|----------|
| New tab | `⌘+T` |
| Next tab | `⌘+⇧+]` |
| Previous tab | `⌘+⇧+[` |
| Close current tab | `⌘+W` |
| Close other tabs | `⌥+⌘+T` |

Split and focus movement is the heart of running AI agents in parallel.

| Action | Shortcut |
|--------|----------|
| Split right | `⌘+D` |
| Split down | `⌘+⇧+D` |
| Move focus | `⌥+⌘+←` / `→` / `↑` / `↓` |

Built-in browser shortcuts mirror a regular web browser.

| Action | Shortcut |
|--------|----------|
| Open browser | `⌘+⇧+L` |
| Focus address bar | `⌘+L` |
| Back | `⌘+[` |
| Forward | `⌘+]` |

Search and notification shortcuts are listed below.

| Action | Shortcut |
|--------|----------|
| Find | `⌘+F` |
| Next match | `⌘+G` |
| Show notifications | `⌘+I` |
| Unread notifications | `⌘+⇧+U` |

## 5. Configuring ~/.config/ghostty/config

cmux shares Ghostty's configuration file as-is. If you already use Ghostty, your font, theme, and keybindings carry over without any extra work. If you are new to both apps, a single `~/.config/ghostty/config` file will still drive both once you install them.

A reasonable starting config looks like this.

```
font-family = "JetBrains Mono"
font-size = 13
theme = "GruvboxDark"
background-opacity = 0.95
window-padding-x = 12
window-padding-y = 12
cursor-style = block
cursor-style-blink = false
copy-on-select = true
scrollback-limit = 100000

keybind = ctrl+shift+c=copy_to_clipboard
keybind = ctrl+shift+v=paste_from_clipboard
```

cmux-specific shortcuts live outside the Ghostty config. Edit them through the in-app settings UI or by modifying `~/.config/cmux/settings.json` directly. Two-step chained shortcuts are supported as well, so Emacs-style combinations such as `⌘+K ⌘+O` are available when you want them.

## 6. Wrapping Up

cmux pays off more as your agentic coding workflow grows. Instead of juggling a stack of terminal windows and flipping between them, you keep everything in one window and rely on the sidebar to tell you where attention is needed. You get Ghostty's rendering performance and the lightness of a native macOS app, with the multi-agent UX layered on top. If agentic coding assistants are part of your daily workflow, cmux is worth swapping in for your default terminal.

# References

- <https://cmux.com/docs/keyboard-shortcuts>
- <https://cmux.com/en>
- <https://cmux.com/en/docs/getting-started>
- <https://github.com/manaflow-ai/cmux>
