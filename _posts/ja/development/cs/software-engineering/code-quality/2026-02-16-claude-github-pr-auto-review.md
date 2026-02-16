---
title: "[Code Quality] Claudeを活用したPR自動コードレビュー構築記"
ref: claude-github-pr-auto-review
lang: ja
permalink: /ja/:categories/:title/
excerpt: "サイドプロジェクトでClaude Code ActionによりGitHub PR自動レビューを構築した経験をまとめる。"
date: 2026-02-16T01:00+09:00
last_modified_at: 2026-02-16T19:16+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/claude-github-pr-auto-review.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/claude-github-pr-auto-review.png"
categories:
  - Development
  - CS
  - Software-Engineering
  - Code-Quality
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
  - title: "CS"
    url: /ja/development/cs/
  - title: "Software Engineering"
    url: /ja/development/cs/software-engineering/
  - title: "Code Quality"
    url: /ja/development/cs/software-engineering/code-quality/
---

# 概要

サイドプロジェクトでClaude Code ActionによりGitHub PR自動レビューを構築した経験をまとめる。

# 手順

## 1. 背景

弟と一緒にAIエージェントを開発するサイドプロジェクトを進めている。最初の作業としてPythonバックエンドAPIを構築中だが、二人とも会社勤めなので週末や退勤後の時間を作って作業している状況だ。

### 1.1. 問題状況

コードレビューがボトルネックだった。お互いのPRをレビューする必要があるが、時間が合わずレビューが遅れることが頻繁にあり、急ぎのPRはレビューなしでマージすることもあり、複雑なコードはレビューするだけでかなりの時間がかかった。

より根本的な問題もあった。弟はAIエージェント開発が本業なので関連ドメイン知識と経験が豊富だが、私は別の開発分野で働いているためAIエージェントアーキテクチャやLLM関連のベストプラクティスに対する理解が不足していた。私が弟のコードをレビューする時は基本的なPython文法や一般的なコード品質程度しか確認できず、弟が私のコードをレビューする時は深く見ることができるが時間がなくて十分に見れない場合が多かった。

「これ、LLMにやらせたらダメかな?」

## 2. 解決策の探索

### 2.1. CodeRabbitの検討

最初はAIコードレビューツールとして有名なCodeRabbitを考慮した。しかし無料プランはPublicリポジトリのみサポートしており、私たちのプロジェクトはPrivateリポジトリを使用中だった。無料バージョンではPRサマリー程度しか提供されず、詳細なインラインコードレビューは有料プランでのみ可能だった。すでにClaude Maxプランを購読しており、毎月トークンを使い切れていない状況で別途有料プランを決済するのは非効率的だった。

### 2.2. Claude Code Actionの選択

Anthropicが公式提供する`claude-code-action`を発見した。GitHub Actionsワークフローとして動作し、Claude APIやOAuthトークンを使用して自動コードレビューを実行する。すでに購読中のClaude Maxを活用すれば追加費用がかからず、PrivateリポジトリもOAuthトークン方式でサポートされ、最新の高性能モデルであるClaude Opus 4.6を使用でき、プロンプトも希望通りにカスタマイズ可能だった。

## 3. 実装

### 3.1. OAuthトークン生成

Claude Pro/Max購読者はAPIキーの代わりにOAuthトークンを使用できる。

```bash
claude setup-token
```

注意事項は以下の通り。

- トークンは必ず1行でコピーする(改行を含むと認証失敗)
- Organization Secretsに`CLAUDE_CODE_OAUTH_TOKEN`という名前で登録する

### 3.2. GitHub App作成

デフォルトの`github-actions[bot]`の代わりにカスタムボット名を使用するためにGitHub Appを作成した。設定は以下の通り。

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
      actions: read
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app-id: ${{ secrets.REVIEW_APP_ID }}
          private-key: ${{ secrets.REVIEW_APP_PRIVATE_KEY }}

      - name: Add eyes reaction to PR
        run: |
          gh api repos/${{ github.repository }}/issues/${{ github.event.pull_request.number }}/reactions \
            -f content=eyes
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - name: Create or update tracking branch for fork PR
        if: github.event.pull_request.head.repo.fork == true
        run: |
          gh api repos/${{ github.repository }}/git/refs \
            -f ref="refs/heads/${{ github.event.pull_request.head.ref }}" \
            -f sha="${{ github.event.pull_request.head.sha }}" 2>/dev/null || \
          gh api repos/${{ github.repository }}/git/refs/heads/${{ github.event.pull_request.head.ref }} \
            -X PATCH -f sha="${{ github.event.pull_request.head.sha }}" -F force=true
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
               - PRタイトルからissue参照を見つけてRelatedリンクとして作成(既にある場合は重複追加しないでください)

               ## サマリー
               - PR変更事項をbullet pointで作成

               ## ダイアグラム
               - 主要な流れがあればMermaidシーケンスダイアグラムで表現(なければこのセクション省略)

               ## レビューフィードバック
               - 特定のコード行と関連しない一般的なレビューフィードバック(アーキテクチャ、設計方向、全体的な改善事項など)

            2. コードレビューは`mcp__github_inline_comment__create_inline_comment`を使用して該当コード行に直接付けてください:
               - コード品質とベストプラクティス
               - 潜在的なバグまたは問題
               - セキュリティ関連事項
               - パフォーマンス考慮事項
               - 問題のないコードにはコメントを付けないでください
               - 特定のコード行に該当しないフィードバックはインラインコメントではなくPR本文に記述してください

          claude_args: |
            --model claude-opus-4-6
            --system-prompt "すべての応答とコメントは韓国語で作成してください。"
            --allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*),Bash(gh pr edit:*)"

      - name: Cleanup tracking branch for fork PR
        if: always() && github.event.pull_request.head.repo.fork == true
        continue-on-error: true
        run: |
          gh api repos/${{ github.repository }}/git/refs/heads/${{ github.event.pull_request.head.ref }} -X DELETE
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}
```

#### claude.yml

コメントでトリガーフレーズをメンションするとインタラクティブに応答するワークフローだ。

```yaml
name: Claude Assistant
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  pull_request_review:
    types: [submitted]

jobs:
  claude-response:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@myteam/review')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@myteam/review')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@myteam/review'))
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app-id: ${{ secrets.REVIEW_APP_ID }}
          private-key: ${{ secrets.REVIEW_APP_PRIVATE_KEY }}

      - name: Add eyes reaction
        run: |
          if [ "${{ github.event_name }}" = "issue_comment" ]; then
            gh api repos/${{ github.repository }}/issues/comments/${{ github.event.comment.id }}/reactions \
              -f content=eyes
          elif [ "${{ github.event_name }}" = "pull_request_review_comment" ]; then
            gh api repos/${{ github.repository }}/pulls/comments/${{ github.event.comment.id }}/reactions \
              -f content=eyes
          elif [ "${{ github.event_name }}" = "pull_request_review" ]; then
            gh api repos/${{ github.repository }}/issues/${{ github.event.pull_request.number }}/reactions \
              -f content=eyes
          fi
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - name: Get fork PR info
        id: fork-check
        run: |
          if [ "${{ github.event_name }}" = "issue_comment" ]; then
            PR_NUMBER="${{ github.event.issue.number }}"
            PR_DATA=$(gh api repos/${{ github.repository }}/pulls/$PR_NUMBER 2>/dev/null) || {
              echo "is_fork=false" >> $GITHUB_OUTPUT
              exit 0
            }
          elif [ "${{ github.event_name }}" = "pull_request_review_comment" ] || [ "${{ github.event_name }}" = "pull_request_review" ]; then
            PR_NUMBER="${{ github.event.pull_request.number }}"
            PR_DATA=$(gh api repos/${{ github.repository }}/pulls/$PR_NUMBER)
          else
            echo "is_fork=false" >> $GITHUB_OUTPUT
            exit 0
          fi
          IS_FORK=$(echo "$PR_DATA" | jq -r '.head.repo.fork')
          HEAD_REF=$(echo "$PR_DATA" | jq -r '.head.ref')
          HEAD_SHA=$(echo "$PR_DATA" | jq -r '.head.sha')
          echo "is_fork=$IS_FORK" >> $GITHUB_OUTPUT
          echo "head_ref=$HEAD_REF" >> $GITHUB_OUTPUT
          echo "head_sha=$HEAD_SHA" >> $GITHUB_OUTPUT
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - name: Create or update tracking branch for fork PR
        if: steps.fork-check.outputs.is_fork == 'true'
        run: |
          gh api repos/${{ github.repository }}/git/refs \
            -f ref="refs/heads/${{ steps.fork-check.outputs.head_ref }}" \
            -f sha="${{ steps.fork-check.outputs.head_sha }}" 2>/dev/null || \
          gh api repos/${{ github.repository }}/git/refs/heads/${{ steps.fork-check.outputs.head_ref }} \
            -X PATCH -f sha="${{ steps.fork-check.outputs.head_sha }}" -F force=true
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          github_token: ${{ steps.app-token.outputs.token }}
          trigger_phrase: "@myteam/review"
          claude_args: |
            --model claude-opus-4-6
            --system-prompt "すべての応答とコメントは韓国語で作成してください。進行状況チェックリストやステップリストを作成しないでください。回答内容のみ記述してください。回答の冒頭で必ず質問者をタグ付けし、改行した後に回答を記述してください。例: @username様、\n\n回答内容"

      - name: Cleanup comment
        if: success()
        run: |
          NUMBER="${{ github.event.issue.number || github.event.pull_request.number }}"
          COMMENT=$(gh api "repos/${{ github.repository }}/issues/${NUMBER}/comments?per_page=100" \
            --jq '[.[] | select(.body | test("\\*\\*Claude finished"))] | last')
          COMMENT_ID=$(echo "$COMMENT" | jq -r '.id // empty')
          ENDPOINT="issues/comments"
          if [ -z "$COMMENT_ID" ]; then
            COMMENT=$(gh api "repos/${{ github.repository }}/pulls/${NUMBER}/comments?per_page=100" \
              --jq '[.[] | select(.body | test("\\*\\*Claude finished"))] | last')
            COMMENT_ID=$(echo "$COMMENT" | jq -r '.id // empty')
            ENDPOINT="pulls/comments"
          fi
          if [ -z "$COMMENT_ID" ]; then
            echo "No Claude comment found"
            exit 0
          fi
          export BODY
          BODY=$(echo "$COMMENT" | jq -r '.body')
          CLEANED=$(python3 << 'PYEOF'
          import os, re
          body = os.environ.get('BODY', '')
          body = re.sub(r'\*\*Claude finished.*?\n', '', body)
          body = re.sub(r'^---\s*\n', '', body.strip())
          body = re.sub(r'^(- \[[ x]\] .+\n)+', '', body.strip())
          body = re.sub(r'\[View job\s*(?:run)?\]\(https?://[^\)]+\)\s*', '', body)
          print(body.strip())
          PYEOF
          )
          gh api "repos/${{ github.repository }}/${ENDPOINT}/${COMMENT_ID}" \
            -X PATCH -f body="$CLEANED"
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - name: Cleanup tracking branch for fork PR
        if: always() && steps.fork-check.outputs.is_fork == 'true'
        continue-on-error: true
        run: |
          gh api repos/${{ github.repository }}/git/refs/heads/${{ steps.fork-check.outputs.head_ref }} -X DELETE
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}
```

### 3.4. fork基盤Git Flow対応

私たちはそれぞれforkしたリポジトリからPRを上げるGit Flowを使用しているが、初期にはfork PRでワークフローがトリガーされなかった。以下のように解決した。

- Organization設定でfork PRワークフロー権限を有効化:
  - "Send write tokens to workflows from fork pull requests"
  - "Send secrets to workflows from fork pull requests"
- fork PRのブランチをbaseリポジトリに一時的に作成して削除するworkaroundを適用

### 3.5. UX改善

#### カスタムトリガーフレーズ

デフォルトのトリガーは`@claude`だが、GitHub Organizationチームを活用してカスタムトリガーに変更した。GitHubのTeam有料プランはシート当たりの費用を支払うが、すでに利用中であればOrganizationチーム機能を活用できる。`review`というチームを作成すると、`@myteam/review`でメンションする時にオートコンプリートがサポートされ入力が便利になる。`trigger_phrase`パラメータでトリガーフレーズを指定し、`if`条件で`contains()`によって該当フレーズが含まれるイベントのみフィルタリングする。

#### リアクション

ワークフローがトリガーされると該当コメントに👀絵文字リアクションを追加する。Claudeが応答を生成する間、リクエストが受理されたことを視覚的に表示する。

#### 応答整理

claude-code-actionはtagモードで応答完了時に「Claude finished @user's task in Xs」というヘッダーと区切り線、チェックリスト、「View job」リンクを自動的に追加する。こうしたUI要素が応答内容と混ざると可読性が低下するため、完了後にPython regexでパースして不要な部分を除去するcleanupステップを追加した。

#### 質問者タグ付け

システムプロンプトで応答開始時に質問者を`@username様、`形式でタグ付けするよう指示した。これにより質問者がGitHub通知を受け取ることができ、誰に対する回答なのかが明確になる。

## 4. 結果

### 4.1. PR本文自動更新

![PR本文例]({{site.baseurl}}/assets/image/post/development/cs/software-engineering/code-quality/claude-github-pr-auto-review/pr-body-example.png){: style="max-width: min(800px, 100%);"}

PRが開かれるとClaudeが自動的に関連issueリンクを追加し、変更事項をbullet pointで要約し、Mermaidシーケンスダイアグラムで主要な流れを視覚化し、全体的なアーキテクチャと設計に対するフィードバックを提供する。

### 4.2. インラインコードレビュー

![インラインレビュー例]({{site.baseurl}}/assets/image/post/development/cs/software-engineering/code-quality/claude-github-pr-auto-review/inline-review-example.png){: style="max-width: min(800px, 100%);"}

特定のコード行に対して潜在的なバグを指摘し、コード例とともに改善案を提示し、問題の原因と解決方法を詳しく説明する。

### 4.3. @myteam/reviewメンション

![メンション例]({{site.baseurl}}/assets/image/post/development/cs/software-engineering/code-quality/claude-github-pr-auto-review/mention-example.png){: style="max-width: min(800px, 100%);"}

PRコメントで`@myteam/review`をメンションすると👀リアクションが付き、Claudeが応答を生成する。応答は質問者をタグ付けしながら始まり、「Claude finished」ヘッダーのような不要なUI要素は自動的に除去される。「この部分のリファクタリング方法を推薦して」、「この関数の時間計算量は?」、「セキュリティ問題はないか?」といった質問にリアルタイムで回答を受けられる。

## 5. 効果

### 5.1. 定量的効果

| 指標 | Before | After |
|---|---|---|
| レビュー待機時間 | 平均1~2日 | 平均5分 |
| レビューカバレッジ | ~60% | 100% |
| 追加費用 | - | 0円 |

### 5.2. 定性的効果

コード品質が改善された。思いつかなかったエッジケースや潜在的なバグを発見し、Pythonベストプラクティスを学習できた。ドメイン知識のギャップも補完された。AIエージェント開発に慣れていなくても、Claudeの詳細なレビューを通じてドメイン特化イシューを把握でき、現業専門家が見落としがちな基本的なコード品質イシューも自動的にチェックされる。ドキュメント化も自動化された。PR本文に自動的にサマリーとダイアグラムが生成され、履歴追跡が容易になった。心理的負担も減少した。「レビューしなきゃ...」という負担が減り、Claudeレビューを基に素早く承認できるようになった。

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
