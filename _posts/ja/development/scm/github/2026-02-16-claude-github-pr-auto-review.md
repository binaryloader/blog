---
title: "[GitHub] Claudeを活用したPR自動コードレビュー構築記"
ref: claude-github-pr-auto-review
lang: ja
permalink: /ja/:categories/:title/
excerpt: "サイドプロジェクトでClaude Code ActionによりGitHub PR自動レビューを構築した経験をまとめる。"
date: 2026-02-16T01:00+09:00
last_modified_at: 2026-02-16T02:17+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/claude-github-pr-auto-review.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/claude-github-pr-auto-review.png"
categories:
  - Development
  - SCM
  - GitHub
tags:
  - Development
  - GitHub
  - Claude
  - Code Review
  - GitHub Actions
  - CI/CD
  - Automation
depth:
  - title: "Development"
    url: /ja/development/
  - title: "SCM"
    url: /ja/development/scm/
  - title: "GitHub"
    url: /ja/development/scm/github/
---

# 概要

サイドプロジェクトでClaude Code ActionによりGitHub PR自動レビューを構築した経験をまとめる。

# 詳細

## 1. 背景

弟と一緒にAIエージェントを開発するサイドプロジェクトを進めている。最初の作業としてPythonバックエンドAPIを構築中だが、二人とも会社勤めなので週末や退勤後の時間を作って作業している状況だ。

### 1.1. 問題状況

コードレビューがボトルネックだった。お互いのPRをレビューする必要があるが、時間が合わずレビューが遅れることが頻繁にあり、急ぎのPRはレビューなしでマージすることもあり、複雑なコードはレビューするだけでかなりの時間がかかった。

より根本的な問題もあった。弟はAIエージェント開発が本業なので関連ドメイン知識と経験が豊富だが、私は別の開発分野で働いているためAIエージェントアーキテクチャやLLM関連のベストプラクティスに対する理解が不足していた。私が弟のコードをレビューする時は基本的なPython文法や一般的なコード品質程度しか確認できず、弟が私のコードをレビューする時は深く見ることができるが時間がなくて十分に見れない場合が多かった。

「これ、LLMにやらせたらダメかな?」

## 2. 解決策の探索

### 2.1. CodeRabbitの検討

最初はAIコードレビューツールとして有名なCodeRabbitを考慮した。しかし無料プランはPublicリポジトリのみサポートしており、私たちのプロジェクトはPrivateリポジトリを使用中だった。無料バージョンではPRサマリー程度しか提供されず、詳細なインラインコードレビューは有料プランでのみ可能だった。

すでにClaude Maxプランを購読しており、毎月トークンを使い切れていない状況で別途有料プランを決済するのは非効率的だった。

### 2.2. Claude Code Actionの選択

AnthropicがオフィシャルGitHub Actionsワークフローとして動作し、Claude APIやOAuthトークンを使用して自動コードレビューを実行する。すでに購読中のClaude Maxを活用すれば追加費用がかからず、PrivateリポジトリもOAuthトークン方式でサポートされ、最新の高性能モデルであるClaude Opus 4.6を使用でき、プロンプトも希望通りにカスタマイズ可能だった。

## 3. 実装

### 3.1. OAuthトークン生成

Claude Pro/Max購読者はAPIキーの代わりにOAuthトークンを使用できる。

```bash
claude setup-token
```

**注意事項:**
- トークンは必ず1行でコピーする(改行を含むと認証失敗)
- Organization Secretsに`CLAUDE_CODE_OAUTH_TOKEN`という名前で登録する

### 3.2. GitHub App生成

デフォルトの`github-actions[bot]`の代わりにカスタムボット名を使用するためにGitHub Appを作成した。**設定:**
- App name: 希望するボット名(例: `myteam-review`)
- Permissions:
  - Contents: Read and write
  - Pull requests: Read and write
  - Issues: Read and write
- Private key生成後、Organization Secretsに登録:
  - `REVIEW_APP_ID`: GitHub App ID
  - `REVIEW_APP_PRIVATE_KEY`: Private key全体(PEM形式)

### 3.3. ワークフロー作成

#### claude-review.yml

PRが開かれると自動的にレビューを実行するワークフローだ。

```yaml
name: Claude Auto Review
on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

jobs:
  review:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app-id: ${{ secrets.REVIEW_APP_ID }}
          private-key: ${{ secrets.REVIEW_APP_PRIVATE_KEY }}

      - name: Create tracking branch for fork PR
        if: github.event.pull_request.head.repo.fork == true
        run: |
          gh api repos/${{ github.repository }}/git/refs \
            -f ref="refs/heads/${{ github.event.pull_request.head.ref }}" \
            -f sha="${{ github.event.pull_request.head.sha }}"
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          github_token: ${{ steps.app-token.outputs.token }}
          track_progress: false
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}
            PR TITLE: ${{ github.event.pull_request.title }}

            このPRをレビューして以下の作業を実行してください:

            1. PR本文更新(`gh pr edit --body`で既存本文を維持しながら追加):
               以下のような構造で作成してください:

               ## 情報
               - PRタイトルからissue参照を見つけてRelatedリンクとして作成

               ## サマリー
               - PR変更事項をbullet pointで作成

               ## ダイアグラム
               - 主要な流れがあればMermaidシーケンスダイアグラムで表現(なければ省略)

               ## レビューフィードバック
               - 特定のコード行と関連しない一般的なレビューフィードバック

            2. コードレビューはインラインコメントで該当コード行に直接付けてください:
               - コード品質とベストプラクティス
               - 潜在的なバグまたは問題
               - セキュリティ関連事項
               - パフォーマンス考慮事項
               - 問題のないコードにはコメントを付けないでください

          claude_args: |
            --model claude-opus-4-6
            --system-prompt "すべての応答とコメントは日本語で作成してください。"

      - name: Cleanup tracking branch for fork PR
        if: always() && github.event.pull_request.head.repo.fork == true
        continue-on-error: true
        run: |
          gh api repos/${{ github.repository }}/git/refs/heads/${{ github.event.pull_request.head.ref }} -X DELETE
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}
```

#### claude.yml

コメントで`@claude`をメンションするとインタラクティブに応答するワークフローだ。

```yaml
name: Claude Assistant
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  claude-response:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app-id: ${{ secrets.REVIEW_APP_ID }}
          private-key: ${{ secrets.REVIEW_APP_PRIVATE_KEY }}

      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          github_token: ${{ steps.app-token.outputs.token }}
          claude_args: |
            --model claude-opus-4-6
            --system-prompt "すべての応答とコメントは日本語で作成してください。"
```

### 3.4. Fork基盤Git Flow対応

チームメンバーがforkしたリポジトリからPRを上げるGit Flowを使用しているが、初期にはfork PRでワークフローがトリガーされなかった。**解決:**
1. Organization設定でfork PRワークフロー権限を有効化:
   - "Send write tokens to workflows from fork pull requests"
   - "Send secrets to workflows from fork pull requests"
2. fork PRのブランチをbaseリポジトリに一時的に作成して削除するworkaroundを適用

## 4. 結果

### 4.1. PR本文自動更新

![PR本文例]({{site.baseurl}}/assets/image/post/development/scm/github/claude-github-pr-auto-review/pr-body-example.png){: style="max-width: min(800px, 100%);"}

PRが開かれるとClaudeが自動的に関連issueリンクを追加し、変更事項をbullet pointで要約し、Mermaidシーケンスダイアグラムで主要な流れを視覚化し、全体的なアーキテクチャと設計に対するフィードバックを提供する。

### 4.2. インラインコードレビュー

![インラインレビュー例]({{site.baseurl}}/assets/image/post/development/scm/github/claude-github-pr-auto-review/inline-review-example.png){: style="max-width: min(800px, 100%);"}

特定のコード行に対して潜在的なバグを指摘し、コード例とともに改善案を提示し、問題の原因と解決方法を詳しく説明する。

### 4.3. @claudeメンション

PRコメントで`@claude`をメンションすればいつでも追加質問が可能だ。「この部分のリファクタリング方法を推薦して」、「この関数の時間複雑度は?」、「セキュリティ問題はないか?」といった質問にリアルタイムで回答を受けられる。

## 5. 効果

### 5.1. 定量的効果

| 指標 | Before | After |
|---|---|---|
| レビュー待機時間 | 平均1~2日 | 平均5分 |
| レビューカバレッジ | ~60% | 100% |
| 追加費用 | - | 0円 |

### 5.2. 定性的効果

コード品質が改善された。思いつかなかったエッジケースや潜在的なバグを発見し、Pythonベストプラクティスを学習できた。

ドメイン知識のギャップも解消された。AIエージェント開発に慣れていないチームメンバーもClaudeの詳細なレビューを通じてドメイン特化イシューを把握でき、現業専門家が見落としがちな基本的なコード品質イシューも自動的にチェックされる。

ドキュメント化も自動化された。PR本文に自動的にサマリーとダイアグラムが生成され、履歴追跡が容易になった。

心理的負担も減少した。「レビューしなきゃ...」という負担が減り、Claudeレビューを基に素早く承認できるようになった。

## 6. 限界点

### 6.1. 盲目的に信頼してはいけない

Claudeも間違うことがある。プロジェクト特有のコンテキストを知らなかったり、最新ライブラリAPIの変更事項を反映できなかったり、ビジネスロジックの意図を誤解することもある。最終判断は常に人間がする必要がある。

### 6.2. プロンプトチューニングが必要

最初はすべてのレビューがコメントとして付いてPRが煩雑になった。プロンプトを継続的に修正しながら一般的なフィードバックはPR本文に、コード行別の具体的なイシューのみインラインコメントに分離するのに何度も試行錯誤があった。

### 6.3. Fork PRイシュー

Fork基盤Git Flowを使うならOrganization設定とワークフローworkaroundが必要だ。この部分は公式ドキュメントに明確に書かれておらず、試行錯誤が必要だった。

## 7. おわりに

「コードレビューする時間がなくて品質が落ちる」という言い訳はもう通用しない。Claudeを活用した自動コードレビューでより速くPRをマージし、より高いコード品質を維持し、お互いの時間を尊重しながらプロジェクトを進められるようになった。

特にすでにClaude Maxを購読しているなら追加費用なしですぐに適用可能だ。週末プロジェクトやスタートアップチームに強くお勧めする。

# 参考

- <https://github.com/anthropics/claude-code-action>
- <https://github.com/anthropics/claude-code-action/issues/821>
- <https://github.com/actions/create-github-app-token>
