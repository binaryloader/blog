---
title: "[Xcode] エージェンティックコーディングアシスタントにMCPサーバーを連携する"
ref: xcode-agentic-coding-assistant-mcp-setup
lang: ja
permalink: /ja/:categories/:title/
excerpt: "XcodeエージェンティックコーディングアシスタントにMCPサーバーを連携する方法をまとめる。"
date: 2026-02-11T19:37+09:00
last_modified_at: 2026-02-11T19:37+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Development
  - Apple
  - Xcode
tags:
  - Development
  - Apple
  - Xcode
  - Claude Code
  - MCP
  - Agentic Coding Assistant
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Apple"
    url: /ja/development/apple/
  - title: "Xcode"
    url: /ja/development/apple/xcode/
---

# 概要

XcodeエージェンティックコーディングアシスタントにMCPサーバーを連携する方法をまとめる。

# 手順

## 1. 設定ファイルのパス

MCPサーバーはClaude Codeの設定ファイルでプロジェクトごとに構成する。

```
~/Library/Developer/Xcode/CodingAssistant/ClaudeAgentConfig/.claude.json
```

## 2. 設定構造

`projects`内にプロジェクトパスをキーとして指定し`mcpServers`に使用するMCPサーバーを追加する。

```json
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        // MCPサーバー設定
      }
    }
  }
}
```

## 3. MCPサーバーの種類

MCPサーバーは2つのタイプで設定できる。

### 3.1. SSE (Server-Sent Events)

ローカルで実行中のMCPサーバーにHTTPで接続する方式だ。

```json
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        "Figma Dev Mode MCP": {
          "type": "sse",
          "url": "http://127.0.0.1:3845/sse"
        }
      }
    }
  }
}
```

| 項目 | 説明 |
|---|---|
| **type** | `"sse"`を指定する。 |
| **url** | MCPサーバーのSSEエンドポイントURLを入力する。 |

### 3.2. stdio

CLIコマンドでMCPサーバープロセスを直接起動する方式だ。

```json
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        "context7": {
          "type": "stdio",
          "command": "/path/to/npx",
          "args": ["-y", "@upstash/context7-mcp@latest"]
        }
      }
    }
  }
}
```

| 項目 | 説明 |
|---|---|
| **type** | `"stdio"`を指定する。 |
| **command** | 実行するコマンドの絶対パスを入力する。（例：`npx`、`uvx`） |
| **args** | コマンドに渡す引数の配列だ。 |
| **env** | （任意）環境変数を指定する。APIトークンなどが必要な場合に使用する。 |

## 4. 設定例

複数のMCPサーバーをまとめて構成した例だ。

```json
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        "Figma Dev Mode MCP": {
          "type": "sse",
          "url": "http://127.0.0.1:3845/sse"
        },
        "context7": {
          "type": "stdio",
          "command": "/path/to/npx",
          "args": ["-y", "@upstash/context7-mcp@latest"]
        },
        "sequential-thinking": {
          "type": "stdio",
          "command": "/path/to/npx",
          "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
        },
        "mcp-atlassian": {
          "type": "stdio",
          "command": "/path/to/uvx",
          "args": ["mcp-atlassian"],
          "env": {
            "JIRA_URL": "https://your-domain.atlassian.net",
            "JIRA_USERNAME": "your-email@example.com",
            "JIRA_API_TOKEN": "your-api-token"
          }
        }
      }
    }
  }
}
```

| MCPサーバー | 用途 |
|---|---|
| **Figma Dev Mode MCP** | Figmaデザインファイルをコードから参照できるようにする。 |
| **context7** | ライブラリドキュメントをコンテキストとして提供する。 |
| **sequential-thinking** | 複雑な問題をステップごとに思考する機能を追加する。 |
| **mcp-atlassian** | JiraイシューとConfluenceドキュメントにアクセスできるようにする。 |

## 5. 注意事項

- `command`にはバイナリの**絶対パス**を入力する必要がある。nvmなどでNode.jsを管理している場合は`which npx`でパスを確認する。
- `env`にAPIトークンやパスワードを入力する場合は設定ファイルが外部に漏洩しないよう注意する。
- 設定変更後はXcodeを再起動する必要がある。

# 参考

- <https://developer.apple.com/documentation/xcode/setting-up-coding-intelligence>
- <https://developer.apple.com/documentation/xcode/giving-agentic-coding-tools-access-to-xcode>
- <https://modelcontextprotocol.io>
- <https://docs.anthropic.com/en/docs/claude-code>
