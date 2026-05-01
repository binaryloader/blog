---
title: "[MCP] mcp-scapple"
ref: library-mcp-scapple
excerpt: "Scapple(.scap)ファイルを扱うMCPサーバー"
lang: ja
permalink: /ja/library/mcp/mcp-scapple/
date: 2026-05-01
published: true
categories:
  - Library
  - MCP
app_creator: "binaryloader"
app_summary: "Scapple(.scap)ダイアグラムファイルを扱うMCPサーバー"
app_version: "1.0.1"
app_runtime: "Node.js 18+"
app_license: "MIT"
app_github: "https://github.com/binaryloader/mcp-scapple"
app_homepage: "https://www.npmjs.com/package/@binaryloader/mcp-scapple"
depth:
  - title: "Library"
    url: /ja/library/
  - title: "MCP"
    url: /ja/library/mcp/
---

## 1. 概要

mcp-scappleは、Literature & Latteのブレインストーミングツール「Scapple」の`.scap`ファイルをAIアシスタントが直接読み書きしPNGにレンダリングできるMCPサーバーである。

## 2. 情報

- 開発: binaryloader
- バージョン: 1.0.1
- ライセンス: MIT
- 要件: Node.js 18+
- GitHub: [binaryloader/mcp-scapple](https://github.com/binaryloader/mcp-scapple)
- npm: [@binaryloader/mcp-scapple](https://www.npmjs.com/package/@binaryloader/mcp-scapple)

## 3. 主な機能

- read-scapple:`.scap`ファイルをノート・図形・スタイル・接続情報を持つ構造化JSONにパース
- write-scapple: 構造化ノートデータから双方向接続を自動管理しながら`.scap`ファイルを作成
- text-to-scapple: インデント・箇条書き・番号付きリストを自動レイアウトでScappleダイアグラムに変換
- scapple-to-image:`.scap`ファイルをPNGにレンダリング(色、フォント、影、パターンのテーマ対応)

## 4. インストール

```bash
npx @binaryloader/mcp-scapple
```
