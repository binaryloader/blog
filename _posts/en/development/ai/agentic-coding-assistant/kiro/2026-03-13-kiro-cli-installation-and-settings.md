---
title: "[Kiro] CLI Installation and Settings"
lang: en
permalink: /en/:categories/:title/
ref: kiro-cli-installation-and-settings
excerpt: "A guide on how to install Kiro CLI and the key configuration options in the cli.json settings file."
date: 2026-03-13T21:41+09:00
last_modified_at: 2026-03-13T21:41+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-cli-installation-and-settings.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/kiro-cli-installation-and-settings.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Kiro
tags:
  - Kiro
  - CLI
depth:
  - title: "Development"
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "Agentic Coding Assistant"
    url: /en/development/ai/agentic-coding-assistant/
  - title: "Kiro"
    url: /en/development/ai/agentic-coding-assistant/kiro/
---

# Overview

A guide on how to install Kiro CLI and the key configuration options in the cli.json settings file.

# Steps

## 1. Installation

### 1.1. cURL

```bash
curl -fsSL https://cli.kiro.dev/install | bash
```

### 1.2. Homebrew

```bash
brew install --cask kiro-cli
```

## 2. Settings File

### 2.1. Purpose

A configuration file that controls Kiro CLI behavior. It manages feature toggles, default model, UI options, and more.

### 2.2. Location

- Global settings (user-wide): `~/.kiro/settings/cli.json` -- available across all projects
- Workspace settings (per-project): `.kiro/settings/cli.json` -- available only in that project, takes precedence over global settings

### 2.3. Key Settings

| Setting Key | Type | Default | Description |
|---|---|---|---|
| `chat.defaultModel` | string | none | Default AI model |
| `chat.defaultAgent` | string | none | Default agent |
| `chat.enableThinking` | boolean | false | Complex reasoning mode |
| `chat.enableCheckpoint` | boolean | false | Workspace snapshots |
| `chat.enableTodoList` | boolean | false | TODO list feature |
| `chat.enableCodeIntelligence` | boolean | false | Code intelligence (LSP) |
| `chat.disableMarkdownRendering` | boolean | false | Disable markdown rendering |
| `chat.enableNotifications` | boolean | false | Desktop notifications |
| `chat.enableTangentMode` | boolean | false | Tangent mode (conversation branching) |
| `chat.greeting.enabled` | boolean | true | Startup greeting message |

## 3. Managing Settings via CLI

### 3.1. List All Settings

```bash
kiro-cli settings list
```

### 3.2. Check a Setting Value

```bash
kiro-cli settings chat.defaultModel
```

### 3.3. Change a Global Setting

```bash
kiro-cli settings chat.defaultModel "anthropic.claude-opus-4-6-20250610"
```

### 3.4. Change a Workspace Setting

```bash
kiro-cli settings --workspace chat.defaultModel "anthropic.claude-opus-4-6-20250610"
```

### 3.5. Delete a Setting

```bash
kiro-cli settings --delete chat.defaultModel
kiro-cli settings --delete --workspace chat.defaultModel
```

## 4. Settings Example

```json
{
  "chat.defaultModel": "anthropic.claude-opus-4-6-20250610",
  "chat.defaultAgent": "my-project",
  "chat.enableThinking": true,
  "chat.enableCheckpoint": true,
  "chat.enableTodoList": true,
  "chat.greeting.enabled": false
}
```

## 5. Comparison with Claude Code

| Role | Claude Code | Kiro |
|---|---|---|
| Feature/behavior settings | settings.json | cli.json |
| Project context/rules | CLAUDE.md | Steering (`.kiro/steering/`) |
| Agent-specific instructions | - | Agent configuration prompt field |
| Auto-loaded context files | File references in CLAUDE.md | Steering + agent configuration resources field |
| In-session memory | MEMORY.md | N/A |

# References

- <https://kiro.dev/docs/cli/>
- <https://kiro.dev/docs/settings/>
- <https://kiro.dev/docs/steering/>
