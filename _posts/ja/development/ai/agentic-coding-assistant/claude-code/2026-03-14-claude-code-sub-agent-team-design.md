---
title: "[Claude Code] Subagentで専門家チームを設計する"
lang: ja
permalink: /ja/:categories/:title/
ref: claude-code-sub-agent-team-design
excerpt: "Claude CodeのSubagent、Skill、Rule、Hook、MCP Serverを組み合わせて、企画からデプロイまで専門家チームを構成する方法をまとめた。"
date: 2026-03-14T00:40+09:00
last_modified_at: 2026-03-14T00:40+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/claude-code-sub-agent-team-design.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/claude-code-sub-agent-team-design.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Claude-Code
tags:
  - Claude Code
  - Subagent
  - MCP
  - Agentic Coding
depth:
  - title: "Development"
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "Agentic Coding Assistant"
    url: /ja/development/ai/agentic-coding-assistant/
  - title: "Claude Code"
    url: /ja/development/ai/agentic-coding-assistant/claude-code/
sidebar:
  nav: "menu-ja"
---

# 概要

Claude CodeのSubagent、Skill、Rule、Hook、MCP Serverを組み合わせて、企画からデプロイまで専門家チームを構成する方法をまとめた。

# 手順

## 1. アーキテクチャ概要

Claude Codeはメインエージェントがユーザーと対話し、必要に応じてSubagentを呼び出す構造である。`.claude/`ディレクトリの下にエージェント、スキル、ルールを配置すれば、一つのCLIツールで開発チーム全体を運用できる。

```
CEO（ユーザー）
    │
    ▼
Claude Code メインセッション（CTO / オーケストレーター）
    │
    ├── 企画チーム ─── product-planner, ui-designer, tech-writer
    ├── 開発チーム ─── dev-planner, ios-developer, server-developer, infra-developer
    ├── レビューチーム ─── ios-reviewer-arch/quality, server-reviewer-arch/quality, infra-reviewer-security/ops
    └── 品質チーム ─── qa-engineer, security-auditor
```

| チーム | エージェント | 役割 | モデル | モード | 分離 |
|---|---|---|---|---|---|
| 企画 | `product-planner` | 企画者 | opus | plan | - |
| 企画 | `ui-designer` | デザイナー | sonnet | plan | - |
| 企画 | `tech-writer` | テクニカルライター | sonnet | acceptEdits | - |
| 開発 | `dev-planner` | 開発プランナー | opus | plan | - |
| 開発 | `ios-developer` | iOS開発者 | opus | default | worktree |
| 開発 | `server-developer` | サーバー開発者 | opus | default | worktree |
| 開発 | `infra-developer` | インフラ開発者 | opus | default | worktree |
| レビュー | `ios-reviewer-arch` | iOSアーキテクチャ | sonnet | plan | - |
| レビュー | `ios-reviewer-quality` | iOS品質 | sonnet | plan | - |
| レビュー | `server-reviewer-arch` | サーバーアーキテクチャ | sonnet | plan | - |
| レビュー | `server-reviewer-quality` | サーバー品質 | sonnet | plan | - |
| レビュー | `infra-reviewer-security` | インフラセキュリティ | sonnet | plan | - |
| レビュー | `infra-reviewer-ops` | インフラ運用 | sonnet | plan | - |
| 品質 | `qa-engineer` | QAエンジニア | sonnet | default | - |
| 品質 | `security-auditor` | セキュリティ監査者 | opus | plan | - |

主要な制約事項は以下の通りである。

- サブエージェントは他のサブエージェントを生成できない。メインセッションがすべての調整を担当する
- エージェントチーム（Agent Teams）は実験的機能である。`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`環境変数が必要である
- エージェントチームのメンバーは互いに直接通信するが、ネストされたチームは不可である

サブエージェントとエージェントチームの使い分け基準は以下の通りである。

- **サブエージェント**: 単一タスクを委任して結果を返す（レビュー、分析、単一機能の実装）
- **エージェントチーム**: 複数のエージェントが長時間独立して並列作業（iOS + サーバー同時開発）

## 2. ファイルマップ

### 2.1. グローバル設定 (~/.claude/)

すべてのプロジェクトに共通適用されるユーザーレベルの設定である。どのディレクトリでClaude Codeを実行しても常にロードされる。

```
~/.claude/
├── CLAUDE.md                       # グローバルルール（CLAUDE.md/MEMORY.mdフォーマット、rules/参照）
├── settings.json                   # グローバル権限、プラグイン、環境変数、hooks
├── .mcp.json                       # MCPサーバー設定（9個）
│
├── rules/                          # グローバルルール（10個）
│   ├── markdown.md                 # Markdownヘディング/ブレット/改行ルール（常にロード）
│   ├── korean.md                   # 韓国語カンマ/文体ルール（常にロード）
│   ├── git.md                      # Gitコミット/GitHubリポジトリルール（常にロード）
│   ├── security.md                 # セキュリティルール（常にロード）
│   ├── swift.md                    # Swiftスタイル/TCA（paths: **/*.swift）
│   ├── xcode.md                    # Xcodeヘッダー/プロジェクト（paths: **/*.swift, **/Package.swift, **/Project.swift）
│   ├── kotlin.md                   # Kotlinサーバールール（paths: server/**/*.kt）
│   ├── terraform.md                # Terraformルール（paths: infra/**/*.tf）
│   ├── api-design.md               # REST API設計（paths: **/api/**, **/controller/**, **/Controller/**, **/routes/**）
│   └── image-metadata.md           # 画像メタデータ（paths: **/*.jpg等）
│
├── agents/                         # サブエージェント（15個）
│   ├── product-planner.md          # 企画者（opus, plan, memory:project）
│   ├── ui-designer.md              # デザイナー（sonnet, plan）
│   ├── tech-writer.md              # テクニカルライター（sonnet, acceptEdits）
│   ├── dev-planner.md              # 開発プランナー（opus, plan, memory:project）
│   ├── ios-developer.md            # iOS開発者（opus, worktree, memory:project, hooks）
│   ├── server-developer.md         # サーバー開発者（opus, worktree, memory:project, hooks）
│   ├── infra-developer.md          # インフラ開発者（opus, worktree, memory:project, hooks）
│   ├── ios-reviewer-arch.md        # iOSアーキテクチャレビュアー（sonnet, plan）
│   ├── ios-reviewer-quality.md     # iOS品質レビュアー（sonnet, plan）
│   ├── server-reviewer-arch.md     # サーバーアーキテクチャレビュアー（sonnet, plan）
│   ├── server-reviewer-quality.md  # サーバー品質レビュアー（sonnet, plan）
│   ├── infra-reviewer-security.md  # インフラセキュリティレビュアー（sonnet, plan）
│   ├── infra-reviewer-ops.md       # インフラ運用レビュアー（sonnet, plan）
│   ├── qa-engineer.md              # QAエンジニア（sonnet, default）
│   └── security-auditor.md         # セキュリティ監査者（opus, plan）
│
├── skills/                         # ワークフロー（5個）
│   ├── planning/SKILL.md           # /planning <機能>
│   ├── develop/SKILL.md            # /develop <タスク>
│   ├── review-all/SKILL.md         # /review-all [ブランチ]
│   ├── release/SKILL.md            # /release <バージョン>
│   └── standup/SKILL.md            # /standup
│
└── hooks/                          # hooksスクリプト（3個）
    ├── lint-swift.sh               # Swiftファイル修正前のリントチェック
    ├── lint-kotlin.sh              # Kotlinファイル修正前のリントチェック
    └── notify.sh                   # サブエージェント完了通知
```

### 2.2. プロジェクト設定

すべてのエージェント、スキル、ルール、hooksはグローバル（`~/.claude/`）で管理する。個別プロジェクトにはプロジェクト固有の設定のみ配置する。

```
my-project/
├── CLAUDE.md                       # プロジェクトルートルール（技術スタック、ビルド、@import）
├── .mcp.json                       # MCPサーバー設定（プロジェクト別）
│
├── .claude/
│   ├── settings.json               # プロジェクト権限、環境変数（チーム共有）
│   ├── settings.local.json         # ローカル専用シークレット（.gitignore）
│   └── rules/                      # プロジェクト特化ルール（オプション）
│       ├── frontmatter.md          # ブログFront Matterルール等
│       └── writing.md              # プロジェクト固有の記述ルール等
│
├── ios/                            # iOSアプリソース（Swift/SwiftUI）
├── server/                         # バックエンドサーバー（Spring Boot/Kotlin）
├── infra/                          # インフラコード（Terraform）
└── docs/                           # プロジェクト文書
```

グローバルエージェント/スキルがすべてのプロジェクトで動作する仕組みは以下の通りである。

- `~/.claude/agents/*.md`に定義されたエージェントはどのディレクトリでClaude Codeを実行しても自動的に使用可能である
- `~/.claude/skills/*/SKILL.md`に定義されたスキルも同様にグローバルで呼び出し可能である
- `~/.claude/rules/*.md`の`paths`マッチングは現在作業中のプロジェクトのファイルパスに対して適用される
- `~/.claude/settings.json`のhooksもすべてのプロジェクトで実行される

## 3. エージェント設計（15名）

エージェントは`.claude/agents/`ディレクトリにMarkdownファイルで定義する。YAML Frontmatterでメタデータを設定し、本文に役割指示を記述する。

### 3.1. 企画チーム

**product-planner** — プロダクト企画、ユーザーストーリー、PRD作成。WebSearchで市場調査まで行う。

- モデル: opus / 権限: plan
- ツール: Read, Glob, Grep, Write, Edit, WebSearch, WebFetch
- メモリ: project（プロジェクト別の企画履歴を記憶）
- 役割: ユーザーストーリー定義、MoSCoW/RICE優先度、MVP範囲定義
- 出力: PRDドキュメント（背景、目標、受け入れ基準、除外範囲）

**ui-designer** — UI/UX設計、画面フロー定義、デザインシステム管理。Figma内蔵連携を使用する。

- モデル: sonnet / 権限: plan
- ツール: Read, Glob, Grep, Write, Edit, WebSearch, WebFetch
- 役割: 画面フロー、ワイヤーフレーム仕様、デザインシステム定義
- 原則: モバイルファースト、HIG準拠、VoiceOver/Dynamic Type対応

**tech-writer** — チケット、Wiki、APIドキュメント、README作成。MCPで外部ツールに直接書き込む。

- モデル: sonnet / 権限: acceptEdits
- ツール: Read, Write, Edit, Glob, Grep, WebFetch
- MCP: jira（チケット）、confluence（Wiki）、github（PR/README）
- 出力: チケット、Wiki、OpenAPIドキュメント、CHANGELOG、リリースノート
- 形式: Mermaidダイアグラム活用

### 3.2. 開発チーム

**dev-planner** — PRDベースの技術設計（TDD）、タスク分解、APIインターフェース設計。コードベースを読み込んで分析する。

- モデル: opus / 権限: plan
- ツール: Read, Glob, Grep, Write, Edit, WebSearch, WebFetch
- メモリ: project（設計履歴を記憶）
- MCP: sequential-thinking（複雑な設計の意思決定）、jira（要件参照）、confluence（設計ドキュメント参照）
- 役割: APIインターフェース、DBスキーマ、iOS/サーバー/インフラのタスク分解、依存関係グラフ
- 原則: YAGNI、タスク単位は1日以内、API契約優先

すべての開発者エージェントは`isolation: worktree`で隔離されたGit worktreeで作業し、互いに衝突なく並列開発が可能である。

**ios-developer** — Swift/SwiftUI iOSアプリ開発。隔離されたworktreeで作業する。

- モデル: opus / 権限: default / 隔離: worktree
- ツール: Read, Write, Edit, Glob, Grep, Bash, LSP
- メモリ: project
- MCP: github, context7, jira, confluence
- スキル: develop
- hooks: PostToolUse — Write/Edit時に`swift-format` + `swiftlint --fix`を自動実行
- スタック: Swift 6, SwiftUI, TCA, SPM, SwiftData, async/await
- ブランチ: `feature/ios-*`

**server-developer** — Spring Boot/Kotlinサーバー開発。API実装、DB設計。

- モデル: opus / 権限: default / 隔離: worktree
- ツール: Read, Write, Edit, Glob, Grep, Bash, LSP
- メモリ: project
- MCP: github, postgres, context7, jira, confluence
- スキル: develop
- hooks: PostToolUse — Write/Edit時に`ktlint --format`を自動実行
- スタック: Spring Boot 3, Kotlin, PostgreSQL, Redis, Flyway
- ブランチ: `feature/server-*`

**infra-developer** — AWSインフラ構築、Terraform IaC、CI/CDパイプライン。

- モデル: opus / 権限: default / 隔離: worktree
- ツール: Read, Write, Edit, Glob, Grep, Bash
- メモリ: project
- MCP: github, context7, jira, confluence
- スキル: develop
- hooks: PostToolUse — Write/Edit時に`terraform fmt`を自動実行
- スタック: AWS (ECS, RDS, S3, CloudFront, ALB), Terraform, GitHub Actions, Docker
- ブランチ: `feature/infra-*`

### 3.3. レビューチーム

開発者ごとに2名で、アーキテクチャ観点と品質観点を分離して多角的にレビューする。すべてのレビュアーは`permissionMode: plan`で読み取り専用である。

**iOSレビュー**

| エージェント | 観点 | 必須（🔴） | 推奨（🟡） |
|---|---|---|---|
| `ios-reviewer-arch` | TCAパターン準拠、モジュール依存方向、責務分離、SOLID原則 | アーキテクチャ違反、循環依存、レイヤー侵害 | 構造改善提案 |
| `ios-reviewer-quality` | オプショナル処理、循環参照、不要な再レンダリング、MainActor/Sendable | クラッシュ、メモリリーク、データレース | パフォーマンス改善、可読性 |

**サーバーレビュー**

| エージェント | 観点 | 必須（🔴） | 推奨（🟡） |
|---|---|---|---|
| `server-reviewer-arch` | REST原則、正規化、Controller/Service/Repository分離、拡張性 | API契約違反、データ整合性リスク | 設計改善、パフォーマンス最適化 |
| `server-reviewer-quality` | SQL Injection, XSS, CSRF, N+1, Bean Validation, ロギング | セキュリティ脆弱性、データ損失、リソースリーク | エラー処理強化 |

**インフラレビュー**

| エージェント | 観点 | 必須（🔴） | 推奨（🟡） |
|---|---|---|---|
| `infra-reviewer-security` | 最小権限、セキュリティグループ、Secrets Manager, TLS/KMS, CloudTrail | パブリック公開、シークレットハードコーディング、過剰な権限 | セキュリティ強化、監査ログ |
| `infra-reviewer-ops` | マルチAZ、オートスケーリング、CloudWatch、バックアップ/リストア、タグ戦略 | 単一障害点、バックアップなし、コスト爆発 | コスト削減、モニタリング強化 |

### 3.4. QA/セキュリティチーム

**qa-engineer** — ユニット/統合テスト作成、テストシナリオ設計、エッジケース探索

- モデル: sonnet / 権限: default
- ツール: Read, Write, Edit, Glob, Grep, Bash
- パターン: Given-When-Then、ファクトリパターンでテストデータ生成
- iOS: XCTest, Swift Testing
- サーバー: JUnit 5, MockK, Testcontainers
- 原則: Mockより実際の実装を優先、境界値/null/例外は必須

**security-auditor** — OWASP Top 10、認証/認可、機密情報漏洩、依存関係の脆弱性監査

- モデル: opus / 権限: plan
- ツール: Read, Glob, Grep, Bash
- MCP: sequential-thinking（体系的セキュリティ分析）
- 点検: OWASP A01~A10全体、JWT/セッション、SQL/NoSQL Injection, CVE
- iOSセキュリティ: キーチェーン使用、ATS、証明書ピンニング
- 深刻度: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low（4段階）

### 3.5. エージェント設定の詳細

#### 3.5.1. Frontmatterフィールド

```yaml
---
name: ios-developer
description: iOSアプリ開発の専門家。Swift/UIKit/SwiftUIコード作成を依頼する時に使用する。
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - LSP
model: opus
isolation: worktree
memory: project
permissionMode: default
mcpServers:
  - github
  - context7
  - jira
  - confluence
skills:
  - develop
hooks:
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: >-
            file="$TOOL_INPUT_file_path";
            [[ "$file" == *.swift ]] &&
            swift-format format --in-place "$file" 2>/dev/null &&
            swiftlint --fix --quiet --path "$file" 2>/dev/null; true
          timeout: 10
---
```

| フィールド | 説明 | 例 |
|---|---|---|
| `name` | エージェント固有の名前 | `ios-developer` |
| `description` | Claudeが自動的に適切なエージェントを選択するために使用 | "iOSアプリ開発の専門家..." |
| `model` | 使用するモデル（`opus`, `sonnet`） | `opus` |
| `tools` | アクセス可能なツール一覧 | Read, Write, Bash, LSP |
| `permissionMode` | `plan`=読み取り専用、`default`=書き込み、`acceptEdits`=自動承認 | `plan` |
| `isolation` | `worktree`で隔離されたGit worktreeで実行 | `worktree` |
| `memory` | メモリ範囲（`user`, `project`, `local`） | `project` |
| `mcpServers` | アクセス可能なMCPサーバーを制限 | github, context7 |
| `skills` | このエージェントで使用可能なスキル | develop |
| `hooks` | このエージェントでのみ実行されるフック | PostToolUse → swift-format |

#### 3.5.2. モデル配分

| モデル | エージェント数 | エージェント一覧 | 用途 |
|---|---|---|---|
| `opus` | 6名 | product-planner, dev-planner, ios-developer, server-developer, infra-developer, security-auditor | 創造的思考、正確なコード生成、深い分析 |
| `sonnet` | 9名 | ui-designer, レビュアー6名, qa-engineer, tech-writer | パターン化された作業、読み取り専用分析、ドキュメント作成 — コスト効率的 |

#### 3.5.3. 権限モード

| モード | 説明 | エージェント |
|---|---|---|
| `plan`（読み取り専用） | コード修正不可、分析/レビューのみ可能 | 企画チーム2名、dev-planner、レビュアー6名、security-auditor |
| `default`（デフォルト） | 修正時にユーザー承認が必要 | ios-developer, server-developer, infra-developer, qa-engineer |
| `acceptEdits` | ファイル修正を自動承認 | tech-writer |

## 4. エージェントチーム（実験的）

### 4.1. サブエージェント vs エージェントチーム

エージェントチームは複数のClaude Codeインスタンスが独立して並列実行され、互いに直接通信する機能である。サブエージェントと異なり、各メンバーが自身のコンテキストを維持し、共有タスクリストで自律的に調整する。

| | サブエージェント | エージェントチーム |
|---|---|---|
| 通信 | メインにのみ報告 | メンバー間で直接メッセージ |
| 調整 | メインがすべてのタスクを管理 | 共有タスクリストで自律調整 |
| コンテキスト | 結果のみ返却 | 完全に独立して維持 |
| コスト | 低い | 高い（独立インスタンス） |
| 適したタスク | 単一タスクの委任 | 長時間の並列開発 |

### 4.2. 有効化

`~/.claude/settings.json`に環境変数を設定する。

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### 4.3. チーム構成シナリオ

大きな機能をiOS + サーバー + インフラで同時開発する場合にエージェントチームを使用する。

```
チームリーダー（メインセッション = CTO）
    │
    ├── メンバー1: iOS開発     ← ios-developerエージェント設定で実行
    │   └── feature/ios-social-login ブランチ
    │
    ├── メンバー2: サーバー開発  ← server-developerエージェント設定で実行
    │   └── feature/server-social-login ブランチ
    │
    └── メンバー3: インフラ     ← infra-developerエージェント設定で実行
        └── feature/infra-oauth-provider ブランチ

    通信: 共有タスクリスト + メールボックスシステム
    表示: tmux分割ウィンドウ または in-process（Shift+Downで循環）
```

エージェントチームを使用する基準は以下の通りである。

- iOS + サーバー + インフラを**同時に長時間**開発する場合
- メンバー同士で**API契約を調整**する必要がある場合
- 作業が**30分以上**かかると予想される場合

サブエージェントを使用する基準は以下の通りである。

- 単一レビュー、単一分析、単一機能の実装
- 結果だけ受け取れば良い短いタスク
- コストを節約したい場合

## 5. スキル設計

Skillsは繰り返しのワークフローを`/skill-name`で呼び出す自動化単位である。`context: fork`で隔離されたサブエージェントで実行するか、メインセッションで直接実行できる。

### 5.1. Frontmatterフィールド

| フィールド | 説明 |
|---|---|
| `name` | 呼び出し名（`/name`） |
| `description` | Claudeが自動呼び出しのタイミングを判断するために使用 |
| `argument-hint` | 引数のヒント（ユーザーに表示） |
| `context: fork` | 隔離されたサブエージェントコンテキストで実行 |
| `agent` | `context: fork`時に使用するエージェント |
| `disable-model-invocation` | `true`なら手動呼び出しのみ（自動呼び出しなし） |
| `allowed-tools` | 承認なしで使用可能なツール |

### 5.2. 動的コンテキスト注入

`` !`command` ``構文でskillロード時にシェルコマンドを実行して結果を注入する。リアルタイムのプロジェクト状態をskillに渡す重要なメカニズムである。

```bash
# 例: skill本文で以下のように記述すると
!`git diff --stat`
!`git log --oneline -5`
!`gh pr list --state open`

# → skillロード時に自動実行され、結果がコンテキストに注入される
```

### 5.3. スキルの詳細

#### 5.3.1. /planning <機能>

新機能の企画から技術設計、タスク分解、ドキュメント化まで全フローを実行する。「機能企画」「PRD」「新機能プランニング」をリクエストした時に自動呼び出しされる。

- 動的注入: `git log --oneline -10`, `ls -la docs/`
- ステップ1: **product-planner** — PRD作成（ユーザーストーリー、受け入れ基準、優先度、除外範囲）
- ステップ2: **dev-planner** — 技術設計（APIインターフェース、DBスキーマ、タスク分解、依存関係グラフ）
- ステップ3: **ui-designer** — UI/UX設計（画面フロー、UI仕様）
- ステップ4: **tech-writer** — ドキュメント化（MCPでチケット作成、Wiki登録、docs/に保存）
- ステップ5: **メインセッション** — 最終報告（機能概要、予想作業量、リスク、次のステップ）

#### 5.3.2. /develop <タスク>

開発、テスト、コードレビューを順次実行する。「開発して」「実装して」「コーディングして」をリクエストした時に自動呼び出しされる。

- 動的注入: `git branch --show-current`, `git status -s`
- ステップ1: **タスク分析** — ファイルタイプ別に開発者エージェントを決定（*.swift→ios-developer, server/**→server-developer, infra/**→infra-developer）
- ステップ2: **コンテキスト収集** — チケット番号や外部ドキュメント参照がある場合、Jiraチケット、Confluence設計ドキュメント、APIスペック等の関連情報を収集し、以降のステップに渡す
- ステップ3: **\*-developerエージェント** — フィーチャーブランチでコード作成、Conventional Commits
- ステップ4: **qa-engineer** — ユニットテスト作成と実行
- ステップ5: **レビュアー2名** — 変更ファイルタイプに応じた並列レビュー
- ステップ6: **PR作成** — レビュー結果に🔴項目がなければ、GitHubにPRを作成する。PRタイトルと本文を自動生成し、レビュー結果のサマリーを含める
- ステップ7: **結果報告** — 実装概要、テスト結果、レビュー結果（深刻度別）

#### 5.3.3. /review-all [対象]

現在のブランチの変更に対してアーキテクチャ、品質、セキュリティレビューを並列で実行する。「レビューして」「コードレビュー」「PRレビュー」をリクエストした時に自動呼び出しされる。

- 動的注入: `git diff --name-only main...HEAD`, `git diff --stat main...HEAD`
- ステップ1: **変更ファイル分類** — *.swift → iOS, *.kt → サーバー, *.tf → インフラ
- ステップ2: **ドメイン別レビュアー2名** — 並列呼び出し（アーキテクチャ + 品質）
- ステップ3: **security-auditor** — 全変更に対するセキュリティ監査
- ステップ4: **総合レポート** — 🔴 必須修正 / 🟡 推奨 / 🟢 参考に分類、マージgo/no-go判断

#### 5.3.4. /release <バージョン>

リリースチェックリストを実行する。`disable-model-invocation: true`で手動呼び出しのみ可能である。

- 動的注入: `git log --oneline main..HEAD`, `git tag --list --sort=-version:refname | head -5`
- ステップ1: **qa-engineer** — 全テスト + カバレッジ確認
- ステップ2: **security-auditor** — 最終セキュリティ監査、依存関係CVEスキャン
- ステップ3: **infra-developer** — デプロイスクリプト、環境変数、ロールバック計画、DBマイグレーション確認
- ステップ4: **tech-writer** — CHANGELOG、リリースノート、APIドキュメント確認
- ステップ5: **Go/No-Go判断** — チェックリスト総合（テスト、セキュリティ、デプロイ、ドキュメント）

#### 5.3.5. /standup

デイリーステータスレポートを生成する。`context: fork`で隔離実行し、`disable-model-invocation: true`で手動呼び出しのみ可能である。

- 動的注入: `git log --since="24 hours ago"`, `git branch -a`, `git status -s`, `gh pr list`, `gh run list --status failure`
- 出力: 昨日完了 / 今日の予定 / ブロッカー / 数値（コミット、PR、CI）

## 6. ルール設計

`rules/`ディレクトリにMarkdownファイルを置くと、`paths` frontmatterで特定のファイル作業時にのみ自動ロードされる。CLAUDE.mdでimportする必要なく、該当ファイルを扱う際に自動的にルールが適用される。

### 6.1. グローバルルール (~/.claude/rules/)

10個のファイルを管理する。すべてのプロジェクトに共通適用される。

#### 6.1.1. 常にロード（pathsなし）

| ファイル | 内容 |
|---|---|
| `markdown.md` | H2~H4ヘディング番号付与、ブレットポイントルール（コロン禁止、完全な文）、改行ルール |
| `korean.md` | カンマは列挙にのみ使用（接続副詞の後は禁止）、文末の`~한다`体で統一 |
| `git.md` | Conventional Commits, Co-Authored-By禁止、MCP GitHubツール活用、リポジトリネーミング |
| `security.md` | シークレットのハードコーディング禁止、JWT有効期限/Refresh Token管理、SQL Injection/XSS防止 |

#### 6.1.2. パスベースロード

| ファイル | paths | 内容 |
|---|---|---|
| `swift.md` | `**/*.swift` | Airbnb Style Guide, TCAパターン、パラメータ改行ルール |
| `xcode.md` | `**/*.swift`, `**/Package.swift`, `**/Project.swift` | Xcodeファイルヘッダーコメント、Swift Package優先、最小iOS 16 |
| `kotlin.md` | `server/**/*.kt` | Kotlin公式コンベンション、Spring Bootレイヤー分離、N+1防止 |
| `terraform.md` | `infra/**/*.tf` | 環境別分離、モジュール化、S3+DynamoDB状態管理、最小権限 |
| `api-design.md` | `**/api/**`, `**/controller/**`, `**/Controller/**`, `**/routes/**` | REST原則、統一レスポンスフォーマット（`data/error/meta`）、Cursorページネーション |
| `image-metadata.md` | `**/*.jpg`, `**/*.png`等 | ICCプロファイル保持、個人情報のみ削除、HEIC→JPG変換 |

### 6.2. プロジェクトルール (.claude/rules/)

個別プロジェクトでのみ適用される特化ルールである。グローバルRulesで十分でないプロジェクト固有の要件がある場合に追加する。

| プロジェクト | ファイル | paths | 内容 |
|---|---|---|---|
| ブログ | `frontmatter.md` | `**/*.md` | Jekyll Front Matterフォーマット、カテゴリ/タグルール |
| ブログ | `writing.md` | （常にロード） | 記述スタイル、ポスト構造ルール |
| iOSアプリ | `testing.md` | `**/*Test*.swift` | XCTest/Swift Testingの記述ルール |

グローバル vs プロジェクトRulesの運用原則は以下の通りである。

- すべてのプロジェクトに共通適用されるルールはグローバルRulesで管理する
- プロジェクトRulesは該当プロジェクトにのみ必要な固有ルールにのみ使用する
- グローバルRulesとプロジェクトRulesに同じテーマがある場合、両方ロードされて合算適用される

### 6.3. エージェントとルールの分離

エージェント本文にコーディングルールを記述すると以下の問題が生じる。

- 複数のエージェントで同じルールが重複する
- ルールを修正する時にすべてのエージェントを探して変更する必要がある
- エージェントのコンテキストウィンドウを不必要に消費する

ルールの`paths`自動ロードを活用すれば、エージェントは役割説明のみ簡潔に維持できる。

## 7. フック設定

Claude Codeのライフサイクルの特定ポイントで自動実行されるハンドラである。

### 7.1. フックタイプ

| タイプ | 説明 | ブロック可能 |
|---|---|---|
| `command` | シェルコマンド実行 | exit 2でブロック |
| `http` | HTTP POST送信 | JSON `decision: "block"` |
| `prompt` | LLMシングルターン評価 | `ok: false` |
| `agent` | ツール使用可能なサブエージェント | `ok: false` |

### 7.2. グローバルフック

`~/.claude/settings.json`に設定し、すべてのエージェントに適用される。

#### 7.2.1. SessionStart — プロジェクトステータスダッシュボード

セッション開始時に現在のブランチ、直近5件のコミット、ファイル変更状態を自動表示する。

```json
"SessionStart": [{
  "hooks": [{
    "type": "command",
    "command": "echo 'プロジェクトステータス' && git branch --show-current && echo '---' && git log --oneline -5 && echo '---' && git status -s",
    "statusMessage": "プロジェクトステータスをロード中..."
  }]
}]
```

#### 7.2.2. PreToolUse — コード作成前の検証

Swift/Kotlinファイル修正前にリントを確認する。error levelの違反がある場合は修正をブロックする。

```bash
#!/bin/bash
# ~/.claude/hooks/lint-swift.sh
# exit 0 = 通過, exit 2 = ブロック（stderrをClaudeにフィードバック）

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c \
  "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

[[ "$FILE" != *.swift ]] && exit 0

if ! command -v swiftlint &>/dev/null; then
  exit 0
fi

RESULT=$(swiftlint lint --quiet --path "$FILE" 2>&1)
if echo "$RESULT" | grep -q "error:"; then
  echo "$RESULT" >&2
  exit 2
fi

exit 0
```

危険なコマンドも事前にブロックする。`rm -rf /`、`drop database`、`DROP TABLE`など破壊的コマンドをBashマッチャーで検出する。

#### 7.2.3. PostToolUse — コード作成後の自動フォーマット

Write/Editツール実行後、ファイル拡張子に応じて自動フォーマッターを実行する。

```json
"PostToolUse": [{
  "matcher": "Write|Edit",
  "hooks": [{
    "type": "command",
    "command": "file=\"$TOOL_INPUT_file_path\"; case \"$file\" in *.swift) swift-format format --in-place \"$file\" 2>/dev/null; swiftlint --fix --quiet --path \"$file\" 2>/dev/null ;; *.kt) ktlint --format \"$file\" 2>/dev/null ;; *.tf) terraform fmt \"$file\" 2>/dev/null ;; esac; true",
    "timeout": 15,
    "statusMessage": "自動フォーマット中..."
  }]
}]
```

| 拡張子 | フォーマッター |
|---|---|
| `*.swift` | `swift-format format --in-place` + `swiftlint --fix` |
| `*.kt` | `ktlint --format` |
| `*.tf` | `terraform fmt` |

#### 7.2.4. SubagentStop / TaskCompleted — 完了通知

サブエージェントまたはチームタスク完了時にmacOSデスクトップ通知を送信する。`async: true`で非同期実行し、メインフローをブロックしない。

```bash
#!/bin/bash
# ~/.claude/hooks/notify.sh

INPUT=$(cat)
AGENT_TYPE=$(echo "$INPUT" | python3 -c \
  "import sys,json; print(json.load(sys.stdin).get('agent_type','タスク'))" 2>/dev/null || echo "タスク")

if [[ "$(uname)" == "Darwin" ]]; then
  osascript -e "display notification \"${AGENT_TYPE} エージェントがタスクを完了しました\" \
    with title \"Claude Code\" sound name \"Glass\""
fi

exit 0
```

### 7.3. エージェント別フック

開発者エージェント（ios-developer, server-developer, infra-developer）は自身の`hooks` frontmatterでエージェント別フォーマッターを定義する。グローバルhooksとは別に、該当エージェント実行中にのみ動作する。

| エージェント | イベント | 動作 |
|---|---|---|
| ios-developer | PostToolUse (Write\|Edit) | `swift-format` + `swiftlint --fix`（*.swiftのみ） |
| server-developer | PostToolUse (Write\|Edit) | `ktlint --format`（*.ktのみ） |
| infra-developer | PostToolUse (Write\|Edit) | `terraform fmt`（*.tfのみ） |

### 7.4. フックイベント一覧

| イベント | タイミング | 主な用途 |
|---|---|---|
| `SessionStart` | セッション開始時 | プロジェクトステータス表示、環境確認 |
| `PreToolUse` | ツール実行前 | リントチェック、危険コマンドのブロック |
| `PostToolUse` | ツール実行後 | 自動フォーマット、後処理 |
| `Stop` | レスポンス完了後 | 自動テスト、検証 |
| `SubagentStop` | サブエージェント完了 | 通知、後続タスクのトリガー |
| `TaskCompleted` | チームタスク完了 | 通知、自動レビュー呼び出し |

## 8. Settings（権限/環境）

### 8.1. グローバル設定

`~/.claude/settings.json`ですべての権限、hooks、環境変数、プラグインをグローバルに管理する。

**権限（permissions）**

| 区分 | 内容 |
|---|---|
| allow（自動承認） | `Bash(git *)`, `Bash(swift-format *)`, `Bash(swiftlint *)`, `Bash(ktlint *)`, `Bash(terraform fmt *)`, `Bash(gh *)` |
| deny（ブロック） | `Bash(rm -rf /)`, `Bash(git push --force *)`, `Bash(git reset --hard *)`, `Bash(terraform destroy *)` |

**その他の設定**

| 項目 | 内容 |
|---|---|
| includeCoAuthoredBy | `false` — コミットにCo-Authored-Byトレーラーを含めない |
| plugins | `swift-lsp`, `clangd-lsp`（LSP） |
| language | 韓国語 |
| env | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

### 8.2. プロジェクト / ローカル設定

| ファイル | 範囲 | 用途 |
|---|---|---|
| `.claude/settings.json` | プロジェクト（チーム共有、gitコミット） | プロジェクト別の追加権限、環境変数 |
| `.claude/settings.local.json` | ローカル専用（.gitignore） | APIキー、DB URL等のシークレット |

```json
// .claude/settings.local.json（コミットしない）
{
  "env": {
    "JIRA_API_TOKEN": "",
    "JIRA_USERNAME": "",
    "CONFLUENCE_API_TOKEN": "",
    "CONFLUENCE_USERNAME": "",
    "DATABASE_URL": "",
  }
}
```

## 9. MCPサーバー（外部連携）

### 9.1. グローバル設定

MCPサーバー設定はグローバル（`~/.claude/.mcp.json`）で管理する。プロジェクト別に追加サーバーが必要な場合はプロジェクトルートに`.mcp.json`を作成する。

### 9.2. サーバー一覧（9個）

| サーバー | タイプ | 用途 | 使用エージェント | 認証 |
|---|---|---|---|---|
| GitHub | stdio | PR, Issue, コードレビュー、ファイル参照 | ios-developer, server-developer, infra-developer, tech-writer | `gh` CLI |
| Jira | stdio | チケット管理、スプリント、プロジェクト管理 | dev-planner, ios-developer, server-developer, infra-developer, tech-writer | `JIRA_API_TOKEN` |
| Confluence | stdio | Wiki、ドキュメント管理 | dev-planner, ios-developer, server-developer, infra-developer, tech-writer | `CONFLUENCE_API_TOKEN` |
| Context7 | http | ライブラリドキュメント参照 | ios-developer, server-developer, infra-developer | なし |
| Sequential Thinking | stdio | 複雑な意思決定、体系的分析 | dev-planner, security-auditor | なし |
| Obsidian | sse | ノート、ナレッジベース管理 | （グローバルアクセス） | なし |
| PDF Reader | stdio | PDFドキュメントの読み取り、検索 | （グローバルアクセス） | なし |
| Scapple | stdio | マインドマップ、アイデアの視覚化 | （グローバルアクセス） | なし |

一部のMCPサーバーはグローバルの`.mcp.json`ではなく、エージェントのfrontmatterで個別に設定する。例えばpostgresはserver-developerエージェントの`mcpServers`フィールドで参照する。

### 9.3. エージェント別MCPアクセス

エージェントの`mcpServers`フィールドでアクセス可能なMCPサーバーを制限する。明示しない場合はすべてのMCPにアクセス可能である。

| エージェント | アクセス可能なMCP |
|---|---|
| ios-developer | github, context7, jira, confluence |
| server-developer | github, postgres, context7, jira, confluence |
| infra-developer | github, context7, jira, confluence |
| tech-writer | jira, confluence, github |
| dev-planner | sequential-thinking, jira, confluence |
| security-auditor | sequential-thinking |

### 9.4. シークレット管理

APIキーは`.mcp.json`に直接入れない。

- `.mcp.json`では`$ENV_VAR`形式で環境変数を参照
- 実際の値はプロジェクトの`.claude/settings.local.json`の`env`セクションに保存
- `settings.local.json`は`.gitignore`に追加してコミットしない

## 10. CLAUDE.md体系

### 10.1. 階層構造

```
~/.claude/CLAUDE.md                        ← グローバル個人ルール
    │
    ▼
~/.claude/rules/*.md（10個）               ← グローバル自動ロードルール
    │
    ▼
プロジェクト/CLAUDE.md                     ← プロジェクトルール
    │  @docs/architecture.md               ← @importでドキュメントを自動参照
    │  @docs/api-contract.md
    │
    ▼
.claude/rules/*.md（オプション）            ← プロジェクト特化ルール
    ├── frontmatter.md → **/*.md
    ├── writing.md     → （常にロード）
    └── testing.md     → **/*Test*.swift
```

### 10.2. Rulesとの違い

| | CLAUDE.md | .claude/rules/*.md |
|---|---|---|
| ロードタイミング | セッション開始時に常に | 該当パスのファイル作業時 |
| パス制限 | 不可 | `paths` frontmatter |
| コンテキストコスト | 常に消費 | 必要な時のみ |
| 適した用途 | プロジェクト全体のルール | 言語/ドメイン別ルール |

### 10.3. @import構文

CLAUDE.mdで`@ファイルパス`で他のファイルをインポートする。最大5ホップの深さまで再帰可能である。

```markdown
# MyProject ルール

## 1. プロジェクト

### 1.1. アーキテクチャ

プロジェクトアーキテクチャは@docs/architecture.mdを参照する。
API契約は@docs/api-contract.mdを参照する。
```

## 11. 統合ワークフロー

### 11.1. 新機能開発の全体フロー

#### Phase 1: 企画（`/planning`）

```
/planning ソーシャルログイン（Apple、Google、Kakao）
```

1. **product-planner** — PRD作成（ユーザーストーリー、受入基準、優先順位）
2. **dev-planner** — 技術設計（APIインターフェース、DBスキーマ、タスク分解）
3. **ui-designer** — UI/UX設計（画面フロー、コンポーネント仕様）
4. **tech-writer** — チケット作成 + Wiki作成（Jira/Confluence MCP連携）
5. **メインセッション（CTO）** — 企画結果を統合、ユーザーに報告

#### Phase 2: 開発（`/develop`）

```
/develop PROJ-123
```

1. **メインセッション** — タスク分析（どの開発者エージェントを使用するか決定）
2. **メインセッション** — コンテキスト収集（Jiraチケット、Confluence設計ドキュメント、APIスペック）
3. **ios-developer + server-developer + infra-developer** — 並行開発（エージェントチームまたはworktree分離）
4. **qa-engineer** — テスト作成および実行
5. **メインセッション** — PR作成（レビュー通過時自動）
6. **メインセッション（CTO）** — 開発結果を統合、ユーザーに報告

#### Phase 3: レビュー（`/review-all`）

```
/review-all
```

1. **レビュアー6名** — アーキテクチャ + 品質の並行レビュー（各開発者につき2名）
2. **security-auditor** — セキュリティ監査
3. **メインセッション（CTO）** — 最終結果統合、マージ判断、ユーザーに報告

### 11.2. コードレビューフロー

```
/review-all feature/social-login
```

```
変更ファイル分析（git diff）
    │
    ├── *.swift変更 → ios-reviewer-arch + ios-reviewer-quality（並列）
    ├── *.kt変更   → server-reviewer-arch + server-reviewer-quality（並列）
    ├── *.tf変更   → infra-reviewer-security + infra-reviewer-ops（並列）
    │
    └── 全体       → security-auditor
    │
    ▼
総合レポート（深刻度別分類）
  🔴 必須修正 → マージブロック推奨
  🟡 推奨     → 選択的修正
  🟢 参考     → 情報提供
```

### 11.3. リリースフロー

```
/release 1.0.0
```

1. **qa-engineer** — 全テストスイート実行、カバレッジ確認
2. **security-auditor** — 最終セキュリティ監査、依存関係の脆弱性スキャン
3. **infra-developer** — デプロイスクリプト確認、ロールバック計画検証
4. **tech-writer** — CHANGELOG作成、リリースノート生成
5. **メインセッション** — チェックリスト総合、go/no-go判断報告

### 11.4. デイリースタンドアップ

```
/standup
```

動的コンテキスト注入（`` !`command` ``）でgitログ、PRステータス、CI結果を自動収集してステータスレポートを生成する。`context: fork`でメインコンテキストを汚染せずに隔離実行する。

## 12. コスト最適化

### 12.1. モデル配分戦略

- **Opus**（高価）: 企画、開発、セキュリティ監査 — 正確性と創造性が重要なタスクのみ
- **Sonnet**（安価）: レビュー、QA、ドキュメント作成 — パターン化されたタスクはSonnetで十分

### 12.2. コンテキスト節約

- `~/.claude/rules/`の`paths`マッチングで必要なルールのみロード
- レビュアーは`permissionMode: plan`で読み取り専用 — ツール呼び出しを最小化
- `context: fork` skillで隔離実行 — メインコンテキストの汚染を防止
- サブエージェントの結果は要約されて返却 — 詳細結果がメインコンテキストを消費しない

### 12.3. エージェントチーム vs サブエージェントのコスト

- エージェントチームは**独立インスタンス**なのでコストが高い — 大規模な並列作業にのみ使用
- 単一レビュー、分析等は**サブエージェント**で十分 — コスト効率的

## 13. 使い方ガイド

### 13.1. 初期設定

すべての設定は`~/.claude/`に構成されている。新しいプロジェクトですぐに使用できる。

```bash
# グローバル設定の構造を確認
ls ~/.claude/agents/     # 15個のエージェントファイル
ls ~/.claude/skills/     # 5個のスキルディレクトリ
ls ~/.claude/rules/      # 10個のルールファイル
ls ~/.claude/hooks/      # 3個のフックスクリプト

# フックスクリプトの実行権限を確認
chmod +x ~/.claude/hooks/*.sh

# 必要なツールをインストール
brew install swift-format swiftlint ktlint terraform gh
```

新しいプロジェクトに適用する方法は以下の通りである。

```bash
# 1. プロジェクト作成
mkdir my-app && cd my-app
git init

# 2. CLAUDE.mdを作成
cat > CLAUDE.md << 'EOF'
# my-app ルール

iOS + Spring Bootプロジェクトである。

## 1. プロジェクト

### 1.1. 技術スタック

- iOS: Swift 6, SwiftUI, TCA, SPM
- サーバー: Spring Boot 3, Kotlin, PostgreSQL
- インフラ: AWS, Terraform, GitHub Actions

### 1.2. ビルド

- iOS: cd ios && tuist generate && xcodebuild
- サーバー: cd server && ./gradlew build
- インフラ: cd infra && terraform plan
EOF

# 3. Claude Codeを実行
claude
```

### 13.2. エージェントの使い方

Claude Codeが`description`をもとに適切なエージェントを自動選択する。自然言語でリクエストすれば良い。

```bash
# 自動呼び出し — Claudeが適切なエージェントを判断
"ソーシャルログイン機能を企画して"           → product-planner 自動呼び出し
"ログインAPIを実装して"                     → server-developer 自動呼び出し
"現在のコードをレビューして"                 → review-all スキル → レビュアー並列呼び出し
"iOSアプリでログイン画面を作って"            → ios-developer 自動呼び出し

# 明示的呼び出し — エージェントを直接指定
"product-planner エージェントでソーシャルログインのPRDを作成して"
"security-auditorで現在のコードを監査して"
```

### 13.3. スキルの使い方

```bash
# スラッシュコマンドで呼び出し
/planning ソーシャルログイン（Apple, Google, Kakao）
/develop サーバーのソーシャルログインAPI実装
/review-all
/release 1.0.0
/standup

# 自然言語で呼び出し（disable-model-invocationがfalseのスキルのみ）
"この機能を企画して"    → /planning 自動呼び出し
"開発して"              → /develop 自動呼び出し
"レビューして"          → /review-all 自動呼び出し
```

`/release`と`/standup`は`disable-model-invocation: true`なので必ずスラッシュコマンドでのみ呼び出し可能である。

### 13.4. カスタムスキルの追加

新しいワークフローが必要な場合は`~/.claude/skills/{name}/SKILL.md`を作成する。

```markdown
# ~/.claude/skills/hotfix/SKILL.md
---
name: hotfix
description: 緊急ホットフィックスフロー。バグ分析、修正、テスト、デプロイを迅速に実行する。
argument-hint: "[バグの説明またはイシュー番号]"
---

緊急ホットフィックスを進行する。

## 現在の状態

!`git log --oneline -5`
!`git branch --show-current`

## 進行ステップ

### ステップ1: バグ分析

コードを分析して原因を特定する。

### ステップ2: 修正（該当*-developerエージェント）

最小限の変更で修正する。

### ステップ3: テスト（qa-engineer）

該当部分のテストのみ実行する。

### ステップ4: デプロイ（infra-developer）

ホットフィックスのデプロイを準備する。

バグ: $ARGUMENTS
```

### 13.5. カスタムルールの追加

```bash
# プロジェクトルールを追加（該当プロジェクトにのみ適用）
cat > .claude/rules/testing.md << 'EOF'
---
paths:
  - "**/*Test*.swift"
  - "**/*Test*.kt"
  - "**/test/**"
---

# テスト記述ルール

## 1. 構造

- Given-When-Thenパターンに従う
- テスト名: `test_状況_期待結果`

## 2. 原則

- Mockより実際の実装を優先する
- 境界値、null、例外を必ず含める
EOF
```

### 13.6. MCPサーバーの追加

```json
// .mcp.jsonに新しいサーバーを追加
{
  "mcpServers": {
    "sentry": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "$SENTRY_AUTH_TOKEN"
      }
    }
  }
}
```

エージェントのfrontmatterに`mcpServers`を明示すると、そのサーバーのみアクセス可能になる。

```yaml
# ~/.claude/agents/server-developer.md
---
mcpServers:
  - github
  - postgres
  - context7
  - jira
  - confluence
---
# → このエージェントはgithub, postgres, context7, jira, confluence MCPのみ使用可能
# → obsidian等にはアクセス不可
```

# 参考

- <https://docs.anthropic.com/en/docs/claude-code>
