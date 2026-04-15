---
title: "[Kiro] エージェント設定"
lang: ja
permalink: /ja/:categories/:title/
ref: kiro-agent-configuration
excerpt: "Kiroエージェントの作成、設定、プロンプトのモジュール化、サブエージェントの活用までまとめた。"
date: 2026-03-13T21:42+09:00
last_modified_at: 2026-03-13T21:42+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-agent-configuration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/kiro-agent-configuration.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Kiro
tags:
  - Kiro
  - Agent
depth:
  - title: "Development"
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "Agentic Coding Assistant"
    url: /ja/development/ai/agentic-coding-assistant/
  - title: "Kiro"
    url: /ja/development/ai/agentic-coding-assistant/kiro/
---

# 概要

Kiroエージェントの作成、設定、プロンプトのモジュール化、サブエージェントの活用までまとめた。

# 手順

## 1. 設定ファイル

### 1.1. 用途

エージェントの行動ルール、使用ツール、コンテキストファイル、MCPサーバーなどを定義する設定ファイルである。

### 1.2. 場所

- グローバルエージェント（ユーザー全体）: `~/.kiro/agents/<name>.json`（すべてのプロジェクトで使用可能）
- ワークスペースエージェント（プロジェクト別）: `.kiro/agents/<name>.json`（該当プロジェクトでのみ使用、グローバルエージェントより優先適用）

### 1.3. 基本構造

```json
{
  "name": "エージェント名",
  "description": "エージェントの説明",
  "prompt": "システムプロンプトまたはfile:///パス/プロンプト.txt",
  "tools": ["fs_read", "fs_write", "execute_bash", "grep", "glob", "code"],
  "allowedTools": ["fs_read", "grep", "glob"],
  "resources": ["file://README.md", "file://src/**/*.swift"],
  "hooks": {},
  "mcpServers": {}
}
```

### 1.4. 主要フィールド

| フィールド | 説明 |
|---|---|
| `name` | エージェント名 |
| `description` | エージェントの説明 |
| `prompt` | システムプロンプト（インラインテキストまたは`file://` URI） |
| `tools` | 使用可能なツール一覧 |
| `allowedTools` | 自動承認ツール（確認なしで実行） |
| `resources` | 各会話で自動ロードするコンテキストファイル |
| `hooks` | イベントベースの自動実行コマンド |
| `mcpServers` | エージェント専用MCPサーバー |
| `model` | エージェント専用モデル |
| `keyboardShortcut` | エージェント切り替えショートカット |

## 2. エージェントの作成

### 2.1. スラッシュコマンド

```
/agent generate
```

### 2.2. CLIコマンド

```bash
kiro-cli agent create --name my-project
```

### 2.3. 手動作成

`.kiro/agents/my-project.json`ファイルを直接作成する。

## 3. エージェント管理

### 3.1. エージェント一覧

```bash
kiro-cli agent list
```

### 3.2. エージェントの検証

```bash
kiro-cli agent validate --path .kiro/agents/my-project.json
```

### 3.3. デフォルトエージェントの設定

```bash
kiro-cli agent set-default my-project
```

### 3.4. チャットでの切り替え

```
/agent my-project
```

## 4. 設定例

### 4.1. iOS開発エージェント

```json
{
  "name": "my-project",
  "description": "iOS開発エージェント",
  "prompt": "file:///Users/username/.kiro/prompts/my-project.txt",
  "tools": ["fs_read", "fs_write", "execute_bash", "grep", "glob", "code"],
  "allowedTools": ["fs_read", "grep", "glob", "code"],
  "resources": [
    "file://README.md"
  ]
}
```

### 4.2. 既存のCLAUDE.mdの再活用

Claude Codeで使っていたCLAUDE.mdをKiroエージェントのpromptとしてそのまま活用できる。

```json
{
  "name": "my-project",
  "prompt": "file:///Users/username/.claude/CLAUDE.md",
  "resources": ["file://README.md"]
}
```

## 5. モジュール化されたプロンプト構造

プロンプトをモジュールに分離して再利用性と保守性を高めることができる。

### 5.1. ディレクトリ構造

```
~/.kiro/
├── agents/
│   ├── developer-ios.json
│   └── reviewer-ios.json
└── prompts/
    ├── modules/
    │   ├── common-rules.md
    │   ├── developer-ios-rules.md
    │   └── reviewer-ios-rules.md
    └── agents/
        ├── developer-ios.md
        └── reviewer-ios.md
```

### 5.2. モジュールファイルの例

`common-rules.md`（共通ルール）

```markdown
# 共通ルール

## 1. 言語

### 1.1. 韓国語

- 連続した項目を列挙するときのみカンマを使用する
- 接続副詞や接続語尾の後にカンマを打たない

## 2. ツール

### 2.1. GitLab

- GitLab作業はGitLab MCPを使用する
- ホストは`gitlab.example.com`である
```

`developer-ios-rules.md`（iOS開発ルール）

```markdown
# iOS開発ルール

## 1. Swiftスタイル規約

- 型宣言の後に空行を追加する
- パラメータが2つ以上の場合は各パラメータを改行する
- guard文の後には必ず空行を追加する
- returnは省略せず常に明示する
```

### 5.3. 統合プロンプト

`developer-ios.md`（モジュール参照）

```markdown
# iOS開発者エージェント

あなたは10年以上のキャリアを持つシニアiOS開発者です。SwiftとiOSフレームワークに精通しており、クリーンコードとアーキテクチャ設計に長けています。

以下のルールに従います。

- 共通ルールは`~/.kiro/prompts/modules/common-rules.md`に定義されている
- iOS開発ルールは`~/.kiro/prompts/modules/developer-ios-rules.md`に定義されている
```

### 5.4. エージェント設定

```json
{
  "name": "developer-ios",
  "description": "iOS開発エージェント",
  "prompt": "file:///Users/username/.kiro/prompts/agents/developer-ios.md",
  "tools": ["fs_read", "fs_write", "execute_bash", "grep", "glob", "code"],
  "allowedTools": ["fs_read", "grep", "glob", "code"],
  "resources": ["file://README.md"]
}
```

### 5.5. モジュール化の利点

- 再利用性: 共通ルールを複数のエージェントで共有
- 保守性: ルール変更時にモジュールファイルのみ修正
- 明確性: 役割ごとにルールが分離されて管理しやすい

## 6. サブエージェント

複数のエージェントを並列実行して複雑な作業を分担できる。

### 6.1. 有効化

```bash
kiro-cli settings chat.enableSubagent true
```

### 6.2. 使用例

リクエスト:

```
reviewer-ios エージェントで現在のブランチの変更点をレビューして
```

動作フローは以下のとおりである。

1. メインエージェントが`use_subagent`ツールを呼び出し
2. reviewer-iosサブエージェントが実行
3. サブエージェントがgit diffを確認してコードレビューを実行
4. 結果をメインエージェントに返却

### 6.3. 特徴

- 最大4つのサブエージェントを同時実行
- 各サブエージェントは独立したコンテキスト
- 並列処理による高速実行
- 専門化されたエージェントの活用が可能

### 6.4. 活用シナリオ

- 開発 + レビュー: developer-iosでコード作成後、reviewer-iosでレビュー
- マルチプラットフォーム: iOSとAndroidエージェントの同時実行
- 役割分担: バックエンド、フロントエンド、インフラエージェントの並列作業

## 7. セッション中の一時コンテキスト追加

エージェント設定以外に会話中に一時的にファイルをコンテキストに追加できる（セッション終了時に消去）。

```
/context add README.md docs/**/*.md
/context show
/context remove README.md
/context clear
```

# 参考

- <https://kiro.dev/docs/agents/>
- <https://kiro.dev/docs/context/>
