---
title: "[Kiro] MCPサーバー設定"
lang: ja
permalink: /ja/:categories/:title/
ref: kiro-mcp-server-configuration
excerpt: "KiroでMCPサーバーを設定・管理する方法を実例とともにまとめた。"
date: 2026-03-13T21:43+09:00
last_modified_at: 2026-03-13T21:43+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-mcp-server-configuration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/kiro-mcp-server-configuration.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Kiro
tags:
  - Kiro
  - MCP
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

KiroでMCPサーバーを設定・管理する方法を実例とともにまとめた。

# 手順

## 1. 設定ファイルの場所

- グローバル設定（ユーザー全体）: `~/.kiro/settings/mcp.json` — すべてのプロジェクトで使用可能
- ワークスペース設定（プロジェクト別）: `.kiro/settings/mcp.json` — 該当プロジェクトでのみ使用、グローバル設定より優先適用

## 2. 基本設定構造

```json
{
  "mcpServers": {
    "サーバー名": {
      "command": "実行するコマンド",
      "args": ["--stdio"],
      "env": {
        "環境変数": "値"
      },
      "timeout": 120000,
      "disabled": false
    }
  }
}
```

## 3. CLIでサーバーを追加

### 3.1. 基本追加

```bash
kiro-cli mcp add --name git --command mcp-server-git --args --stdio
```

### 3.2. オプション付き

```bash
kiro-cli mcp add \
  --name github \
  --command mcp-server-github \
  --args --stdio \
  --env GITHUB_TOKEN=$GITHUB_TOKEN \
  --scope workspace
```

### 3.3. 主要オプション

| オプション | 説明 |
|---|---|
| `--name` | サーバー名（必須） |
| `--command` | 実行コマンド（必須） |
| `--args` | コマンド引数 |
| `--env` | 環境変数 |
| `--scope` | 適用範囲（default/workspace/global） |
| `--agent` | 特定エージェントにのみ追加 |
| `--disabled` | 無効状態で追加 |
| `--force` | 既存サーバーを上書き |

## 4. サーバー管理コマンド

### 4.1. サーバー一覧の確認

```bash
kiro-cli mcp list
kiro-cli mcp list workspace
kiro-cli mcp list global
```

### 4.2. サーバーの削除

```bash
kiro-cli mcp remove --name git
```

### 4.3. サーバー状態の確認

```bash
kiro-cli mcp status --name git
```

### 4.4. 設定ファイルのインポート

```bash
kiro-cli mcp import --file servers.json workspace
```

## 5. チャットでの確認

### 5.1. サーバー状態の表示

```
/mcp
/mcp list
```

### 5.2. 出力例

```
@git (mcp-server-git)
Status: ✓ Initialized
Tools: git_status, git_commit, git_log
@github (mcp-server-github)
Status: ⚠ Needs authentication
OAuth URL: https://github.com/login/oauth/...
Tools: (not loaded)
```

## 6. MCPサーバーの例

### 6.1. Context7（ドキュメント検索）

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

プログラミングライブラリ/フレームワークのドキュメント検索やコード例の照会を行う。

### 6.2. Sequential Thinking（思考プロセスの可視化）

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

複雑な問題をステップごとに分析し、解決過程を追跡する。

### 6.3. Atlassian(Confluence + Jira)

```json
{
  "mcpServers": {
    "mcp-atlassian": {
      "command": "uvx",
      "args": ["--with", "pydantic==2.11.9", "mcp-atlassian"],
      "env": {
        "CONFLUENCE_URL": "https://your-domain.atlassian.net/wiki",
        "CONFLUENCE_USERNAME": "your-email@company.com",
        "CONFLUENCE_API_TOKEN": "your-confluence-token",
        "JIRA_URL": "https://your-domain.atlassian.net",
        "JIRA_USERNAME": "your-email@company.com",
        "JIRA_API_TOKEN": "your-jira-token"
      }
    }
  }
}
```

Confluenceページの読み書き・検索、Jiraイシューの作成・照会・更新、ドキュメントとイシューの連携に対応している。

必須環境変数は以下のとおりである。

- `CONFLUENCE_URL`: ConfluenceインスタンスURL
- `CONFLUENCE_USERNAME`: ユーザーメールアドレス
- `CONFLUENCE_API_TOKEN`: APIトークン（Atlassianアカウント設定で生成）
- `JIRA_URL`: JiraインスタンスURL
- `JIRA_USERNAME`: ユーザーメールアドレス
- `JIRA_API_TOKEN`: APIトークン

### 6.4. GitLab

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@zereight/mcp-gitlab"],
      "env": {
        "GITLAB_PERSONAL_ACCESS_TOKEN": "your-gitlab-token",
        "GITLAB_API_URL": "https://your-gitlab.com/api/v4/",
        "GITLAB_PROJECT_ID": "your-project-id",
        "GITLAB_READ_ONLY_MODE": "false",
        "USE_GITLAB_WIKI": "false",
        "USE_MILESTONE": "false",
        "USE_PIPELINE": "false"
      }
    }
  }
}
```

GitLabイシュー/MR管理、コードレビューやコミットの照会、プロジェクト情報の確認に対応している。

必須環境変数は以下のとおりである。

- `GITLAB_PERSONAL_ACCESS_TOKEN`: GitLab Personal Access Token
- `GITLAB_API_URL`: GitLab APIエンドポイント
- `GITLAB_PROJECT_ID`: 対象プロジェクトID

オプション環境変数は以下のとおりである。

- `GITLAB_READ_ONLY_MODE`: 読み取り専用モード（true/false）
- `USE_GITLAB_WIKI`: Wiki機能の使用有無
- `USE_MILESTONE`: マイルストーン機能の使用有無
- `USE_PIPELINE`: パイプライン機能の使用有無

### 6.5. Figma Dev Mode（SSE方式）

```json
{
  "mcpServers": {
    "Figma Dev Mode MCP": {
      "type": "sse",
      "url": "http://127.0.0.1:3845/sse"
    }
  }
}
```

Figmaデザインファイルから開発情報を抽出する。`command`の代わりに`type`と`url`を使用し、ローカルで実行中のサーバーに接続する。

## 7. エージェント別MCP設定

### 7.1. エージェント設定ファイルに直接追加

`.kiro/agents/my-agent.json`に`mcpServers`フィールドを追加する。

```json
{
  "name": "my-agent",
  "tools": ["fs_read", "fs_write"],
  "mcpServers": {
    "git": {
      "command": "mcp-server-git",
      "args": ["--stdio"]
    }
  }
}
```

### 7.2. 特定エージェントにのみサーバーを追加

```bash
kiro-cli mcp add --name git --command mcp-server-git --agent my-agent
```

## 8. トラブルシューティング

### 8.1. サーバーが起動しないとき

- コマンドがPATHに含まれているか確認
- 手動で実行してみる: `mcp-server-git --stdio`
- ログを確認: `~/.kiro/logs/`または`$TMPDIR/kiro-log/`

### 8.2. ツールが表示されないとき

- `/mcp`コマンドでサーバー状態を確認
- OAuth認証が必要か確認
- サーバーの初期化完了まで待機

### 8.3. ツール名が長すぎるまたは無効なとき

サーバー提供者に問題を報告する。該当ツールは自動的に除外される。

### 8.4. 説明が長すぎるツール

警告メッセージが表示されるが使用可能である。レスポンス速度が遅くなることがある。

# 参考

- <https://kiro.dev/docs/mcp/>
- <https://modelcontextprotocol.io/>
