---
date: 2026-02-09T00:00+09:00
title: "[Xcode] Xcode 26.3でClaude Opus 4.6を使用する"
lang: ja
ref: xcode-26-claude-opus-4-6
excerpt: "Xcode 26.3でClaude Opus 4.6モデルをAgentic Coding Assistantとして設定する方法をまとめる。"
last_modified_at: 2026-02-09T00:30+09:00
published: true
permalink: /ja/development/apple/xcode/xcode-26-claude-opus-4-6/
header:
  overlay_image: "/assets/image/thumbnail/header/xcode-26-claude-opus-4-6.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/xcode-26-claude-opus-4-6.png"
categories:
  - Development
  - Apple
  - Xcode
tags:
  - Development
  - Apple
  - Xcode
  - Claude Code
  - Claude Opus
  - AI
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

Xcode 26.3ではAgentic Coding AssistantとしてClaude Codeをサポートしています。しかし、デフォルトで使用されるモデルが最新バージョンではない場合があります。この記事では、Xcode 26.3 Release CandidateでClaude Opus 4.6モデルを使用するための設定方法をまとめます。

# 手順

## 1. Claude Codeバイナリのコピー

XcodeのAgentic Coding Assistantは内部的にClaude Codeバイナリを使用しています。目的のバージョンのバイナリを以下のパスにコピーします。

```zsh
cp $(which claude) ~/Library/Developer/Xcode/CodingAssistant/Agents/Versions/26.3/claude
```

`claude`バイナリがインストールされていない場合は、まずClaude Code CLIをインストールしてください。

```zsh
curl -fsSL https://claude.ai/install.sh | bash
```

## 2. settings.jsonの作成

モデルをClaude Opus 4.6に変更するために`settings.json`ファイルを作成します。

```zsh
cat <<'EOF' > ~/Library/Developer/Xcode/CodingAssistant/ClaudeAgentConfig/settings.json
{
  "model": "claude-opus-4-6"
}
EOF
```

## 3. 確認

設定が完了したら、Xcodeを再起動してください。Agentic Coding Assistantを使用する際にClaude Opus 4.6モデルが適用されます。

### 3.1. ディレクトリ構造

設定完了後のディレクトリ構造は以下の通りです。

```
~/Library/Developer/Xcode/CodingAssistant/
├── Agents/
│   └── Versions/
│       └── 26.3/
│           └── claude          # Claude Codeバイナリ
└── ClaudeAgentConfig/
    └── settings.json           # {"model": "claude-opus-4-6"}
```

# 参考

- <https://docs.anthropic.com/en/docs/claude-code>
- <https://developer.apple.com/xcode/>
- <https://www.youtube.com/watch?v=RwMPvH1LRz0>
