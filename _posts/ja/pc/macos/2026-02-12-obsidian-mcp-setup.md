---
date: 2026-02-12T05:00+09:00
title: "[macOS] Obsidian MCP 連携の設定"
ref: obsidian-mcp-setup
lang: ja
permalink: /ja/:categories/:title/
excerpt: "Claude Code から Obsidian ボルトを直接読み書きできるように MCP サーバーを連携する手順をまとめる。"
last_modified_at: 2026-02-12T05:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/obsidian-mcp-setup.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/obsidian-mcp-setup.png"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - Obsidian
  - MCP
  - Claude Code
depth:
  - title: "PC"
    url: /ja/pc/
  - title: "macOS"
    url: /ja/pc/macos/
---

# 概要

Claude Code から Obsidian ボルトを直接読み書きできるように MCP サーバーを連携する手順をまとめる。

# 手順

## 1. BRAT プラグインのインストール

Claude Code MCP プラグインはコミュニティプラグイン一覧に登録されていないため、BRAT 経由でインストールする必要がある。

1. **設定** > **コミュニティプラグイン** > **閲覧**
2. `BRAT` を検索してインストール＆有効化

## 2. Claude Code MCP プラグインのインストール

1. **設定** > **BRAT** > **Add Beta Plugin**
2. `iansinnott/obsidian-claude-code-mcp` を入力して追加
3. **設定** > **コミュニティプラグイン**で **Claude Code MCP** を有効化
4. デフォルトポート `22360` で MCP サーバーが自動起動する

## 3. Claude Code に MCP サーバーを登録

ターミナルで Obsidian ボルトがあるプロジェクトディレクトリに移動し、以下を実行する：

```bash
claude mcp add obsidian -- npx mcp-remote http://localhost:22360/sse
```

## 4. 連携の確認

- Claude Code を**新しい会話で開始**しないと MCP ツールがロードされない
- 連携されると `mcp__obsidian__` プレフィックスのツールが有効になる
  - `get_workspace_files` - ボルトのファイル一覧を取得
  - `view` - ノートの内容を読み取り
  - `create` - 新しいノートを作成
  - `str_replace` - ノートの内容を編集
  - `insert` - 特定の位置にテキストを挿入

## 5. 注意事項

- 複数のボルトで同時に使用する場合、各ボルトごとに異なるポートを設定する必要がある。

# 参考

- <https://github.com/iansinnott/obsidian-claude-code-mcp>
