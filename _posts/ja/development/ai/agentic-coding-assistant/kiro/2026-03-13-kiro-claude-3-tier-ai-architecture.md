---
title: "[Kiro] Kiro × Claude: 3-Tier AIサービスアーキテクチャ"
lang: ja
permalink: /ja/:categories/:title/
ref: kiro-claude-3-tier-ai-architecture
excerpt: "KiroがClaudeモデルを呼び出す経路をClient Layer + 3-Tier Service Layerで分析し、同じモデルでもApp Providerによってなぜ異なるパフォーマンスが出るのかをまとめた。"
date: 2026-03-13T21:40+09:00
last_modified_at: 2026-03-13T21:40+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-claude-3-tier-ai-architecture.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/kiro-claude-3-tier-ai-architecture.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Kiro
tags:
  - Kiro
  - Claude
  - AWS Bedrock
  - Agentic Coding
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

KiroがClaudeモデルを呼び出す経路をClient Layer + 3-Tier Service Layerとして推定・分析し、同じモデルでもApp Providerによってなぜ異なるパフォーマンスが出るのかをまとめた。

会社では元々Claude Codeを使っていたが、最近セキュリティ通知で未承認ツールに分類され使用禁止となった。そのため社内標準ツールであるKiroに切り替えて業務をしているが、体験の逆行がかなり厳しい。同じClaudeモデルを使っているのになぜこれほど体感が違うのか気になり、公式ドキュメントと障害事例をもとに内部構造を自分なりに分析してみた。

# まとめ

## 1. 構造の概要

KiroがClaudeモデルを呼び出す経路は`Kiro → Amazon Bedrock → Claude`と推定される。Bedrock障害時にKiroサービスが停止した事例とKiro内でBedrockモデルIDが使用されている点がこれを裏付けている。

本記事ではこの構造を分析の便宜上`Client Layer` + `3-Tier Service Layer`（`App Provider` — `Managed AI Platform` — `Model Provider`）として推定・分類する。3-Tier、App Provider、Managed AI Platform、Model ProviderはAWS公式用語ではなく、筆者が分析の便宜上定義した分類体系である。実際の内部アーキテクチャは異なる可能性がある。

![Kiro × Claude: 3-Tier AIサービスアーキテクチャ](/assets/image/post/development/ai/agentic-coding-assistant/kiro/kiro-claude-3-tier-ai-architecture/kiro-3-tier-architecture.png)

## 2. Client Layer

### 2.1. ユーザー (User)

開発者がIDEまたはターミナルを通じてKiroとやり取りするエントリーポイントである。

### 2.2. Kiro IDE / CLI

Kiro IDEはCode OSS（VS Codeオープンソース）フォークベースの独立したデスクトップアプリケーションである。VS Codeの設定、テーマ、Open VSXプラグインと互換性がある。

Kiro CLIはAmazon Q Developer CLIからリブランディングされた。既存の`q`、`q chat`エントリーポイントは下位互換され、`.amazonq`フォルダの既存設定も引き続き読み込まれる。

ログインはGitHub、Google、AWS Builder ID、AWS IAM Identity Centerに対応しており、AWSアカウントなしでも利用可能である。

## 3. 3-Tier Service Layer

### 3.1. App Provider — Kiro (fka Amazon Q Developer)

Amazon Q Developerとの関係は以下のとおりである（AWS公式ドキュメント基準）。

- Q Developer CLI → Kiro CLIへのリブランディングが完了
- KiroコンソールもQ Developerコンソールのリブランディング
- Q Developer Proサブスクリプションで Kiro IDE/CLIへのアクセスが可能

主要機能は以下のとおりである。

- Spec-driven development（要件 → 設計 → タスク → コーディング）
- Hooks（イベントベースの自動化）
- Steering（プロジェクト別ルールのマークダウン）
- MCP連携
- Powers（ワンクリック拡張 — Aurora、IAM Policy Autopilotなど）

### 3.2. Managed AI Platform — Amazon Bedrock

KiroとClaudeモデルの間の中間レイヤーとして推論（inference）、スケーリング、セキュリティ、モデルルーティングを担当する。

AutoモードはKiroのデフォルトモデル選択であり、タスクの種類に応じて最適なモデルを自動ルーティングする。Bedrock自体はAmazon、Anthropic、Meta、Mistralなど多数のモデルをホスティングする汎用プラットフォームだが、Kiroは現在Claudeモデルのみを使用している。

### 3.3. Model Provider — Claude Models (by Anthropic)

実際のLLM推論を実行するモデル提供者である。Anthropicがモデルを開発・提供し、Bedrockを通じてサービングする。

Kiroで対応しているモデルは以下のとおりである（2026-03、kiro.dev/docs基準）。

- Claude Opus 4.6 (Experimental) — 最上位モデル、Pro/Pro+/Power専用
- Claude Opus 4.5 — Pro/Pro+/Power専用
- Claude Sonnet 4.6 — Sonnet 4.5の後継モデル
- Claude Sonnet 4.5 — Autoモードの主力モデル
- Claude Sonnet 4.0 — 安定した汎用モデル
- Claude Haiku 4.5 — 最速の軽量モデル

Anthropicは純粋なModel Providerとしてのみ参加しており、インフラ（Bedrock）やアプリ（Kiro）には関与していない。

### 3.4. Amazonの二重役割（垂直統合）

AmazonはApp Provider（Kiro）+ Managed AI Platform（Bedrock）の両レイヤーを所有している。Q Developer CLI → Kiro CLIのリブランディングが完了しており、Q Dev Proサブスクリプションでもkiroにアクセス可能である（並行運営）。

AnthropicはModel Providerとしてのみ参加しているが、Kiro/Bedrock経由と自社直接販売（Claude Code、claude.ai、API）の両方から収益が発生している。

## 4. 同じモデルでも異なるパフォーマンス — App Providerレイヤーの影響

この構造で注目すべき点は、同一のClaudeモデルを使用してもApp Providerレイヤーによってコーディングパフォーマンスが大きく異なることである。例えばClaude Opus 4.6をKiro、Claude Code、Cursorでそれぞれ使用すると体感品質が異なる。これはモデル自体の能力ではなくモデルを包むエージェントアーキテクチャが異なるためである。

### 4.1. System Prompt & Persona

各アプリがモデルに注入するシステムプロンプトが異なる。エージェントの行動ルール、応答形式、役割定義がここで決まる。Kiroはspec-drivenワークフローを前提に設計されており、Claude Codeはターミナルベースのagentic実行を前提に設計されている。

### 4.2. Context Window管理 & RAG戦略

限られたコンテキストウィンドウにどの情報を入れるかが核心である。Kiroはsteeringファイル、specドキュメント、コードベースの要約を自動注入する。Claude Codeはagentic searchでコードベースを自律的に探索し、必要なファイルを動的にretrievalする。どのチャンクをどのタイミングで入れるかによって同じモデルでも出力品質が変わる。

### 4.3. Tool Use (Function Calling)

モデルにバインドされるツール定義（tool schema）がアプリごとに異なる。ファイルの読み書き、シェル実行、Web検索、MCPサーバー連携など、利用可能なツールセットと呼び出し権限が異なればモデルが選択できるaction space自体が変わる。

### 4.4. Agentic Loop & Orchestrationパターン

単一のLLM呼び出しではなくmulti-stepエージェントループの設計の違いである。KiroはPlan → Act → Observeをspec単位で構造化する（structured orchestration）。Claude CodeはReActスタイルの自由形式ループを実行する。ループ内でのself-correction、retry、sub-agent委任などの戦略もアプリごとに異なる。

### 4.5. Planning & Decomposition

複雑なタスクをどう分解するかの違いである。Kiroは要件 → 設計 → タスクリストへの明示的なdecompositionを強制する。Claude Codeはモデルが自ら計画を立てるように委任する。Agent Teams（sub-agent分岐）をサポートする場合は並列実行も可能である。

結局Model Providerはfoundation modelというエンジンを提供し、App Providerはそのエンジンの上にエージェントフレームワーク（プロンプト、RAG、ツール、オーケストレーション）という車体を載せる構造である。

# 参考

- <https://aws.amazon.com/bedrock/>
- <https://docs.anthropic.com/en/docs/about-claude/models>
- <https://kiro.dev/docs/>
