---
title: "[Kiro] CLIのインストールと設定"
lang: ja
permalink: /ja/:categories/:title/
ref: kiro-cli-installation-and-settings
excerpt: "Kiro CLIのインストール方法とcli.json設定ファイルの主要項目をまとめた。"
date: 2026-03-13T21:41+09:00
last_modified_at: 2026-03-13T21:41+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-cli-installation-and-settings.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/kiro-cli-installation-and-settings.png"
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
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "Agentic Coding Assistant"
    url: /ja/development/ai/agentic-coding-assistant/
  - title: "Kiro"
    url: /ja/development/ai/agentic-coding-assistant/kiro/
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

# 概要

Kiro CLIのインストール方法とcli.json設定ファイルの主要項目をまとめた。

# 手順

## 1. インストール

### 1.1. cURL

```bash
curl -fsSL https://cli.kiro.dev/install | bash
```

### 1.2. Homebrew

```bash
brew install --cask kiro-cli
```

## 2. 設定ファイル

### 2.1. 用途

Kiro CLIの動作を制御する設定ファイルである。機能のon/off、デフォルトモデル、UIオプションなどを管理する。

### 2.2. 場所

- グローバル設定（ユーザー全体）: `~/.kiro/settings/cli.json`（すべてのプロジェクトで使用可能）
- ワークスペース設定（プロジェクト別）: `.kiro/settings/cli.json`（該当プロジェクトでのみ使用、グローバル設定より優先適用）

### 2.3. 主要設定項目

| 設定キー | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `chat.defaultModel` | string | なし | デフォルトAIモデル |
| `chat.defaultAgent` | string | なし | デフォルトエージェント |
| `chat.enableThinking` | boolean | false | 高度な推論モード |
| `chat.enableCheckpoint` | boolean | false | ワークスペーススナップショット |
| `chat.enableTodoList` | boolean | false | TODOリスト機能 |
| `chat.enableCodeIntelligence` | boolean | false | コードインテリジェンス（LSP） |
| `chat.disableMarkdownRendering` | boolean | false | マークダウンレンダリング無効化 |
| `chat.enableNotifications` | boolean | false | デスクトップ通知 |
| `chat.enableTangentMode` | boolean | false | タンジェントモード（会話分岐） |
| `chat.greeting.enabled` | boolean | true | 開始時の挨拶メッセージ |

## 3. CLIでの設定管理

### 3.1. 設定一覧の確認

```bash
kiro-cli settings list
```

### 3.2. 設定値の確認

```bash
kiro-cli settings chat.defaultModel
```

### 3.3. グローバル設定の変更

```bash
kiro-cli settings chat.defaultModel "anthropic.claude-opus-4-6-20250610"
```

### 3.4. ワークスペース設定の変更

```bash
kiro-cli settings --workspace chat.defaultModel "anthropic.claude-opus-4-6-20250610"
```

### 3.5. 設定の削除

```bash
kiro-cli settings --delete chat.defaultModel
kiro-cli settings --delete --workspace chat.defaultModel
```

## 4. 設定例

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

## 5. Claude Codeとの比較

| 役割 | Claude Code | Kiro |
|---|---|---|
| 機能/動作設定 | settings.json | cli.json |
| プロジェクトコンテキスト/ルール | CLAUDE.md | Steering(`.kiro/steering/`) |
| エージェント別指示 | なし | エージェント設定のpromptフィールド |
| 自動コンテキストファイル | CLAUDE.mdのファイル参照 | Steering + エージェント設定のresourcesフィールド |
| 会話中の記憶 | MEMORY.md | 該当なし |

# 参考

- <https://kiro.dev/docs/cli/>
- <https://kiro.dev/docs/settings/>
- <https://kiro.dev/docs/steering/>
