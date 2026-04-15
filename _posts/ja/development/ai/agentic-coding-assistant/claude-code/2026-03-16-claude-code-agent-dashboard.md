---
title: "[Claude Code] リアルタイムエージェントダッシュボードの構築"
lang: ja
permalink: /ja/:categories/:title/
ref: claude-code-agent-dashboard
excerpt: "19人のClaude Codeサブエージェントが何をしているかリアルタイムで可視化するモニタリングダッシュボードを構築した過程。Gather Town実験の失敗からWebSocketベースのコントロールセンターまで。"
date: 2026-03-16T01:00+09:00
last_modified_at: 2026-03-16T01:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/claude-code-agent-dashboard.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/claude-code-agent-dashboard.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Claude-Code
tags:
  - Claude Code
  - Dashboard
  - WebSocket
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

19人のClaude Codeサブエージェントが何をしているかリアルタイムで可視化するモニタリングダッシュボードを構築した過程。Gather Town実験の失敗からWebSocketベースのコントロールセンターまで。

この記事は[[Claude Code] Subagentで専門家チームを設計する](/ja/development/ai/agentic-coding-assistant/claude-code/claude-code-sub-agent-team-design/)の続編である。前回の記事では15人のAIエージェントチームを設計した。その後ドメイン別の専任レビュアーを追加しインフラ役割を分離して19人に拡張した。チームは構築され、エージェントは定義され、スキルとフックも配線された。しかし一つの決定的な疑問が残っていた。19人のエージェントが一斉に動いているとき、実際に何が起きているのかをどうやって把握するのか。

# 手順

## 1. 問題：19人のエージェントで視界ゼロ

Claude Codeのセッションを単独で実行する分には問題ない。出力がスクロールされ、ツールコールを読み、承認または拒否する。しかしサブエージェントを並列でオーケストレーションし始めた瞬間、そのシンプルさは消え去る。

COO(メインセッション)が3人のプランナーに同時にタスクを委任する。完了すると2人の開発者が起動する。続いて4人のレビュアーが並列で立ち上がる。セキュリティ監査者がQAエンジニアと並行して動く。これらはすべてClaude Codeのフックシステムを通じて行われ、エージェントの開始、停止、ツール使用、タスク完了時にHTTPイベントが発火する。

しかしユーザーの視点からはどうか。見えるのは一つのターミナルだけである。COOはフェーズ完了時にサマリーを報告するが、報告と報告の間は完全に見えない。どのエージェントが今動いているのかわからない。あるエージェントが10分間止まっているのか、もうすぐ終わるのかも判別できない。セキュリティ監査者がクリティカルな脆弱性を発見しても、フェーズ全体が完了してCOOが報告するまでわからない。

19人のエージェントとマルチフェーズパイプラインを抱えた状況では、これは到底やっていけない。可視性が必要だった。

## 2. 最初の試み：Gather Town風2Dオフィス

最初のアイデアは野心的だった。おそらく野心的すぎた。Gather Town風の2Dバーチャルオフィスを構築し、各エージェントにデスクを与え、ピクセルアートのスプライトで歩き回らせ、性格に基づくアイドル行動を取らせようとした。プロダクトプランナーのキム・ソヨンはカフェテリアで雑談する社交型、バックエンド開発者のパク・ドヒョンはデスクでおやつを食べる。COOキャラがCEOのオフィスまで歩いてレポートを届け、エージェントがCOOのデスクに列を作り、完了したエージェントが紙吹雪パーティクルで祝う。

実際に作った。初期バージョンのREADMEには全容が記載されている。Dev、Planning、QA/Security、Reviewのチームゾーン。アイドル状態のエージェントがコーヒーを取りに行くカフェテリア。デスクデコレーション付きのレベルアップシステム。Open-Meteo APIで実際の天気と同期する天候システム。朝の暖かさから夜の残業グローまでシフトする時間帯ライティング。COOがGoogleのGeminiまたはChirpボイスでサマリーを読み上げるTTS音声レポート。エージェントのアニメーション速度を上げるハートパーティクルを送る「エンカレッジ」ボタン。

率直に言って楽しかった。ピクセルアートのエージェントがカフェテリアに歩いて行き、エラーで頭を掻き、長いタスク完了後にハイタッチする様子を眺めるのは、ソロ開発に驚くほどの喜びをもたらした。

しかし実用的ではなかった。2Dオフィスはビジュアル的に魅力的だったが、最も必要な情報（今どのエージェントがアクティブか、何に取り組んでいるか、どのくらい動いているか、何か失敗したか）を逆に見えにくくしていた。ピクセルアートのスプライトやウォーキングアニメーションは、開発時間と画面スペースを消費するだけで状況認識の向上にはつながらなかった。楽しい要素は、明確さを優先すべきモニタリングツールにとって心地よい気晴らしだった。

そこでピボットした。サーバー、WebSocketインフラ、フック統合はそのまま残した。アーキテクチャのコアは堅固だった。2Dオフィスのクライアントだけを、一つのことに特化したダッシュボードに置き換えた。エージェントの活動を一目で可視化することである。

## 3. ダッシュボードアーキテクチャ

プロジェクトはpnpmワークスペースのモノレポで、3つのパッケージで構成されている。

```
claude-code-agent-dashboard/
  packages/
    shared/     # 型、定数、エージェント定義
    server/     # Hono HTTPサーバー + WebSocketブロードキャスター
    client/     # React 19 SPA (Vite + Tailwind CSS 4 + zustand)
```

技術スタックは意図的にシンプルにした。Honoが単一ポート(3100)でREST APIとWebSocketアップグレードの両方を処理する。クライアントは標準的なReact 19 + Vite + Tailwind CSS 4のSPAで、状態管理にzustandを使用する。sharedパッケージにはTypeScriptの型と、COOを含む19人のエージェントの単一情報源であるエージェント定義レジストリが含まれる。

### 3.1. データフロー

コアアーキテクチャは単方向のイベントパイプラインである。

```
┌──────────────────┐     HTTP POST     ┌──────────────────┐
│ Claude Code      │──────────────────▶│                  │
│ (Hooks)          │                   │  Hono Server     │
├──────────────────┤     HTTP POST     │  (:3100)         │
│ COO              │──────────────────▶│                  │
│ (task-assign)    │                   │  ┌────────────┐  │
└──────────────────┘                   │  │Agent Store │  │
                                       │  └─────┬──────┘  │
┌──────────────────┐    WebSocket      │        │         │
│ Browser          │◀──────────────────│  State Change    │
│ Dashboard        │                   │                  │
│                  │──REST (init)─────▶│                  │
└──────────────────┘                   └──────────────────┘
```

Claude Codeがフックイベント(SubagentStart、SubagentStop、PreToolUse、PostToolUseなど)をHTTP POSTリクエストとして`http://localhost:3100/api/v1/events`に送信する。サーバーが各イベントを処理し、インメモリのエージェントストアを更新し、WebSocket経由で接続中のすべてのブラウザクライアントに状態変更をブロードキャストする。ブラウザも初回ロード時にRESTコールで全状態をハイドレートする。

### 3.2. なぜポーリングではないのか

WebSocketは当然の選択だった。フックイベントは頻繁に発火する。単一のエージェントセッションで1分に数十件のPreToolUse/PostToolUseイベントが発生する。ポーリングではイベントを取りこぼすか、帯域を浪費する。WebSocketプッシュなら、エージェントの状態変更からミリ秒以内にダッシュボードが更新される。

## 4. フックシステム統合

Claude Codeは11種類のフックイベントタイプを提供する。ダッシュボードサーバーはそのすべてを受け付ける。

```typescript
const KNOWN_EVENTS: HookEventName[] = [
  "SessionStart",
  "SessionEnd",
  "SubagentStart",
  "SubagentStop",
  "Stop",
  "TaskCompleted",
  "TeammateIdle",
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "UserPromptSubmit",
  "Notification",
];
```

Claude Codeをダッシュボードに接続するには、`~/.claude/settings.json`にHTTPフックを追加する。

```json
{
  "hooks": {
    "SubagentStart": [{
      "matcher": "",
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }],
    "SubagentStop": [{
      "matcher": "",
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }],
    "Stop": [{
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }],
    "TaskCompleted": [{
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }],
    "SessionStart": [{
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }],
    "SessionEnd": [{
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }]
  }
}
```

各フックは`hook_event_name`、`session_id`、`agent_type`、および`last_assistant_message`や`tool_name`などのコンテキストフィールドを含むJSONペイロードをHTTP POSTで送信する。サーバーはこれらのペイロードを正規化し、イベントがどのエージェントに属するかを特定し、ストアを更新する。

イベント処理のフローは以下の通りである。

- **SubagentStart**：エージェントが生成された。サーバーがエージェントの状態を「working」に作成または更新し、開始時間を記録する
- **SubagentStop / Stop**：エージェントが完了した。サーバーは`SubagentStop`ペイロードの`reason`フィールドに`"error"`または`"failure"`が含まれるかを確認し、ステータスを設定する。初期実装では`last_assistant_message`に「error」というキーワードが含まれるかを検索していたが、これは誤検知を引き起こした。エージェントがレスポンスで「ErrorHistory.tsx」に言及しただけでエラー状態がトリガーされてしまう。`reason`フィールドの検出に切り替えることで解決した。`Stop`には注意すべき点がある。セッション終了時だけでなく、毎回のレスポンス後に発火する。毎回の`Stop`でCOOをリセットすると、レスポンス間でアイドル状態にちらつく。解決策として`Stop`はCOOを完全にスキップする。COOがアイドルに戻るのは`SessionEnd`のみである。`UserPromptSubmit`でCOOのデフォルトタスクを「CEOの指示を処理中」に設定し、`task-assign`で具体的な説明に上書きできるようにした
- **PreToolUse / PostToolUse**：エージェントがツールを使用中である。これらのイベントはエージェントがまだ生きて動作していることを確認する
- **TaskCompleted**：チームタスクが完了した。エージェントチームの調整に使用される
- **SessionStart / SessionEnd**：メインのClaude Codeセッションのライフサイクル

サーバーはパースエラーが発生しても常にHTTP 200を返す。これは重要で、ダッシュボードフックの障害がClaude Codeのエージェント実行をブロックしてはならないからである。

## 5. task-assignパターン

ここで興味深い制約にぶつかった。Claude Codeが`SubagentStart`フックを発火するとき、ペイロードには`agent_type`(例: "product-planner")が含まれるが、エージェントに何を依頼したかという人間が読める説明は含まれない。フックシステムは誰が開始したかを教えてくれるが、なぜかは教えてくれない。

これはダッシュボードにとって重要である。「product-planner: working」と表示するより、「product-planner: ボイスメモ機能の市場調査とPRD」と表示する方がはるかに有用である。

解決策が**task-assign**パターンである。COO(メインセッション)がサブエージェントを呼び出す前に、ダッシュボードサーバーに事前登録リクエストを送信する。

```bash
curl -s -X POST http://localhost:3100/api/v1/task-assign \
  -H 'Content-Type: application/json' \
  -d '{"agent_type":"product-planner","task":"Market research and PRD for voice memo feature"}' \
  2>/dev/null || true
```

サーバーはこれを`pendingTaskStore`に保存する。直後に`SubagentStart`イベントが到着すると、サーバーが`agent_type`で照合し、事前登録されたタスク説明を紐付ける。末尾の`|| true`は、ダッシュボードサーバーがダウンしていてもCOOのワークフローが中断されないようにするためである。

task-assignエンドポイントはClaude Codeのフックが発火する前でも、エージェントのステータスをダッシュボード上で即座に「working」に遷移させ、ユーザーに視覚的フィードバックを提供する。COO自体も同じパターンで`agent_type: "coo"`を使い、オーケストレーターが何をしているかを表示する。

```typescript
// サーバー側: task-assignルート
taskAssignRoute.post("/", async (c) => {
  const body = await c.req.json<{ agent_type?: string; task?: string }>();

  if (body.agent_type !== "coo") {
    pendingTaskStore.set(body.agent_type, body.task);
  }

  if (body.agent_type === "coo" || AGENT_MAP.has(body.agent_type)) {
    const agent = agentStore.get(body.agent_type);
    if (agent) {
      const updates: Partial<AgentState> = { originalTask: body.task };
      if (agent.status !== "working" && agent.status !== "reporting") {
        updates.status = "working";
        updates.startedAt = new Date().toISOString();
      }
      agentStore.update(body.agent_type, updates);
      broadcaster.broadcast(buildAgentUpdatePayload(agent));
    }
  }

  return c.json({ ok: true });
});
```

このパターン（システムイベントが発火する前に意図を事前登録する）は、フックシステムの限られたコンテキストに対するクリーンな回避策であることが判明した。COOのワークフロールール(`~/.claude/rules/workflow.md`)がこの動作を自動化している。すべてのエージェント呼び出しの前にtask-assignコールが行われる。

このアプローチには一つ問題があった。COOがtask-assignの呼び出しを時々忘れるのである。ワークフロールールに「絶対に省略するな」と強調して書いたが、それでも漏れが発生した。ルールはLLMにとって提案であり保証ではない。

解決策は指示ではなく構造だった。PreToolUseフックはAgent道具を含む全ての道具呼び出し時に発火する。サーバーがPreToolUseイベントでtool_nameが"Agent"であることを検知すると、tool_inputからsubagent_typeとdescriptionを抽出して自動的にタスクを登録する。手動のcurl呼び出しの代わりにフックシステムがトリガーする。COOが覚えている必要はない。システムが処理する。

ダッシュボードをクリーンに保つために2つのタイミング機構がある。第一に、エージェントが完了した後は即座にではなく10秒の遅延を経てアイドルに遷移する。この短い間があることで、カードがActiveカラムから消える前に完了結果を読む時間が確保される。第二に、`task-assign`で登録されたタスク説明は、対応する`SubagentStart`イベントが5分以内に到着しなければ期限切れになる。これにより`pendingTaskStore`に古いエントリーが蓄積されて将来のセッションを汚染することを防ぐ。COOがタスクを事前登録したがサブエージェントが起動しなかった場合(計画変更など)、孤児エントリーは静かに自己クリーンアップされる。

## 6. エージェントレジストリ

COOを含む19人のエージェント全員が共有定数ファイルで定義されている。各エージェントには一意のID、韓国語名、チーム配属、役割の説明、そして2Dオフィス時代から残る性格特性がある。

```typescript
export const AGENTS: AgentDefinition[] = [
  // Planning Team
  {
    id: "product-planner",
    name: "김소연",
    team: "planning",
    role: "プロダクトプランナー",
  },
  {
    id: "dev-planner",
    name: "이준혁",
    team: "planning",
    role: "テクニカルデザイナー",
  },
  // ... 16 more agents
  {
    id: "coo",
    name: "윤시현",
    team: "coo",
    role: "最高運営責任者",
  },
];
```

韓国語の名前は意図的な選択である。COOがオーケストレーションメッセージで「プロダクトプランナーのKim Soyeon」と言及すると、実際のチームと連携しているような感覚になる。また、ダッシュボードのサイドバーも「product-planner」「server-reviewer-quality」のようなIDの羅列より、はるかに読みやすくなる。

## 7. 組織構造

システム全体が企業の階層構造メタファーに従っている。

**CEO(ユーザー)** → **COO Yun Sihyeon(オーケストレーター)**

| 企画チーム | 開発チーム | レビューチーム | QA & セキュリティ |
|-----------|----------|-------------|----------------|
| プロダクトプランナー Kim Soyeon | Webデベロッパー Kang Harin | Webアーキテクチャ Choi Yujin | QAエンジニア Oh Taeyun |
| テクニカルデザイナー Lee Junhyuk | iOSデベロッパー Yun Seojin | Web品質 Im Subin | セキュリティ監査 Shin Jaewon |
| UI/UXデザイナー Han Yeseul | バックエンド Park Dohyeon | iOSアーキテクチャ Bae Jihun | |
| テクニカルライター Jo Minji | インフラ Jeong Wooseong | iOS品質 Song Daeun | |
| | | サーバーアーキテクチャ Hwang Minho | |
| | | サーバー品質 Jeon Jisu | |
| | | インフラセキュリティ Kwon Doyun | |
| | | インフラ運用 Na Youngjun | |

CEO(ユーザー)がハイレベルな指示を出す。COO(Claude Codeメインセッション)がそれを分解し、エージェントを割り当て、フェーズを調整し、エラーを処理し、報告する。各エージェントは定義された役割、モデル割り当て(創造的/重要なタスクにはOpus、パターン化された作業にはSonnet)、権限レベルを持つサブエージェントである。

## 8. ダッシュボードUI

ダッシュボードは2Dオフィスを、モニタリングに最適化されたクリーンで情報密度の高いレイアウトに置き換えた。

### 8.1. サイドバー：エージェント名簿

左サイドバーには、すべてのエージェントがチーム別にグループ化されて一覧表示される。Staff、Planning、Dev、Review、QA、Security。各エージェントにはカラーステータスドットが表示される。

- グレー：idle(作業可能)
- 青(パルス)：working(処理中)

completedやerror状態は緑または赤で10秒間表示された後グレー(idle)に戻る。状態変化を認識する余裕を与えつつサイドバーが雑然とならないようにしている。

エージェントをクリックすると**Agent Detail**サイドシートが開く。

### 8.2. 3パネルメインエリア

メインコンテンツエリアは3列に分割されている。

![ダッシュボード アイドル状態](/assets/image/post/claude-code-agent-dashboard/00-idle.png)

**Active Tasks**には、現在稼働中のエージェントがタスク説明と経過時間とともに表示される。各カードにはエージェントの韓国語名、役割、チーム、割り当てられたタスク、リアルタイムタイマーが表示される。

**Completed**には、完了したタスクが新しい順に一覧表示される。各カードは展開可能で、クリックするとTailwind Typographyでレンダリングされた完全なMarkdown結果が表示される。ここにPRDドキュメント、コードレビューサマリー、テスト結果などの実際の出力が表示される。

**Errors**には、問題が発生したエージェントが表示される。エージェントの`last_assistant_message`からのエラーメッセージが表示されるため、Claude Codeのトランスクリプトファイルを掘り返さなくても何が問題だったかすぐにわかる。

### 8.3. サマリーカウンター

上部の3つのサマリーカードに、現在のセッションの合計が表示される。アクティブ数、完了数、エラー数。エージェントが状態間を遷移するたびにリアルタイムで更新される。

### 8.4. Agent Detailサイドシート

サイドバーのエージェントをクリックすると、現在のステータス、取り組んでいる(または完了した)タスク、ストリークカウント(エラーなしの連続完了数)、累計完了タスク数、タイムスタンプが表示される詳細パネルが開く。

![Agent Detailサイドシート](/assets/image/post/claude-code-agent-dashboard/14-agent-detail.png)

ストリークシステムは2Dオフィスからの名残りで、エージェントはエラーなしで連続完了するたびにストリークが蓄積される。モニタリングをより楽しくするちょっとした仕掛けである。

## 9. 実例：エージェントチームによるボイスメモPoC

ダッシュボードを理解する最良の方法は、実際のマルチフェーズパイプラインを処理する様子を見ることである。Claude CodeにボイスメモのPoCをゼロから構築させたときの様子を紹介する。

プロンプトはシンプルである。

> "Research voice memo features in the market and build a PoC."

COOがこのリクエストを分析し、マルチフェーズの計画を作成し、オーケストレーションを開始する。

### 9.1. Phase 1：企画(3エージェント並列)

COOが3つのtask-assignコールを発火し、3人のプランナーを並列サブエージェントとして呼び出す。

![Phase 1：企画 アクティブ](/assets/image/post/claude-code-agent-dashboard/01-phase1-active.png)

ダッシュボードのActive Tasksに即座に4枚のカードが表示される。COOとプランナー3人である。プロダクトプランナーのKim Soyeonがボイスメモ市場を調査している。テクニカルデザイナーのLee Junhyukが技術アーキテクチャを設計している。UI/UXデザイナーのHan YeseulがUIワイヤーフレームを作成している。各カードの経過時間がリアルタイムでカウントアップされる。

3人全員が完了すると、カードがActiveからCompletedにスライドする。サイドバーのドットが緑に変わる。

![Phase 1：企画 完了](/assets/image/post/claude-code-agent-dashboard/02-phase1-done.png)

企画エージェントたちは`docs/`ディレクトリに設計文書を生成する。プロダクトプランナーのKim SoyeonのPRDにはコア機能の優先度テーブルとユーザーストーリーが含まれ、UI/UXデザイナーのHan YeseulのUI設計書にはカラーパレット、ワイヤーフレーム、インタラクションフローがまとめられている。

![PRD文書（プロダクトプランナーが生成した要件定義書）](/assets/image/post/claude-code-agent-dashboard/20-prd-doc.png)

![UI/UX設計書（デザイナーが生成した画面設計文書）](/assets/image/post/claude-code-agent-dashboard/21-ui-design-doc.png)

### 9.2. Phase 2：開発(1エージェント)

COOがプランナーたちの出力を読み、Web開発者をディスパッチする。WebデベロッパーのKang HarinがReactフロントエンドを構築する。リアルタイム文字起こしにWeb Speech API、メモの永続化にlocalStorageを使用する。ブラウザネイティブのPoCなので、バックエンドサーバーは不要である。

![Phase 2：開発 アクティブ](/assets/image/post/claude-code-agent-dashboard/03-phase2-active.png)

ダッシュボードのActive Tasksに開発カードが表示される。企画チームのエントリーはCompletedカラムに並ぶ。サイドバーにも反映され、企画エージェントが緑、開発エージェントが青である。

![Phase 2：開発 完了](/assets/image/post/claude-code-agent-dashboard/04-phase2-done.png)

### 9.3. CEOフィードバック：テストとイテレーション

ここからが本番である。PoCは一発で完璧にはならない。アプリを開いてテストすると、すぐに問題が見つかる。Web Speech APIはChromeでは動くがSafariではユーザーへのフィードバックなしに黙って失敗する。録音ボタンが小さすぎる。キーボードショートカットがない。

Claude Codeに入力する。

> "Safariで音声認識が動かないんだけど? フォールバック処理して。あと録音ボタンをもっと大きくして、Spaceキーでも録音できるようにして。"

COOがフィードバックを受け取り、タスクを「CEOフィードバック反映」に更新し、WebデベロッパーのKang Harinを再ディスパッチして修正を実装させる。

![CEOフィードバック：Web開発者を再ディスパッチ](/assets/image/post/claude-code-agent-dashboard/17-ceo-feedback.png)

このサイクル（ビルド、テスト、フィードバック、修正）は実際のプロジェクトで何度も繰り返される。ダッシュボードがそれを可視化する。COOが新しい指示を処理し、開発者が再割り当てされるのが見える。Completedカラムに各イテレーションが蓄積され、フィードバックを通じてプロダクトがどう進化したかの履歴が残る。

重要なポイントは、エージェンティックコーディングはプロンプトを一つ打てば完璧なアプリが出てくるものではないということである。これは対話である。エージェントが重労働を担い、人間が舵を取る。

### 9.4. Phase 3：レビュー(3エージェント並列)

3人のエージェントが同時に起動する。2人のレビュアーがアーキテクチャと品質の観点からコードを検査し、セキュリティ監査者が完全な監査を実施する。

![Phase 3：検証 アクティブ](/assets/image/post/claude-code-agent-dashboard/05-phase3-active.png)

そこで事が起きる。セキュリティ監査のShin Jaewonが2つの問題を発見する。トランスクリプト表示のXSS脆弱性と、localStorageの暗号化されていないメモデータだ。彼のカードが赤に変わり、Errorsカラムに移動する。

![Phase 3：セキュリティエラー検出](/assets/image/post/claude-code-agent-dashboard/06-phase3-error.png)

これはまさにターミナルだけのワークフローでは見落としやすいイベントである。ダッシュボードではそれを見逃すことが不可能になる。エラーカウンターが増加し、カードが赤いErrorsカラムに表示され、サイドバーのドットが赤に変わる。

COOがエラーを読み、WebデベロッパーのKang Harinをディスパッチして修正させる。彼女がXSS防止にDOMPurifyを適用し、Web Crypto APIでlocalStorageデータを暗号化する。修正が完了するとCompletedカラムに表示される。

![Phase 3：セキュリティ修正適用](/assets/image/post/claude-code-agent-dashboard/07-security-fixed.png)

### 9.5. Phase 4：QA & 再検証(2エージェント並列)

セキュリティ問題が解決され、COOがQAテストとセキュリティ再監査を起動して修正を検証する。QAエンジニアのOh Taeyunがフルテストスイートを実行し、セキュリティ監査のShin Jaewonがパッチ済みコードを再監査する。

![Phase 4：QA & 再検証 アクティブ](/assets/image/post/claude-code-agent-dashboard/08-phase4-active.png)

両方パスする。QAエンジニアが12件のテスト全通過を確認し、セキュリティ監査者がXSS脆弱性とlocalStorageの暗号化が適切に修正されたことを検証する。

![全フェーズ完了](/assets/image/post/claude-code-agent-dashboard/09-all-done.png)

### 9.6. バグ報告：CEOが問題を発見

QA通過後も自分でテストを続ける。録音中に別のブラウザタブに移動して戻ると、波形の可視化がフリーズする一方で録音は裏で続いていることに気づく。Claude Codeに報告する。

> "録音中に別のタブに行って戻ると波形が止まるんだけど? 録音は続いてるのに波形だけ動かない。"

COOはすぐに開発者をディスパッチするのではなく、まずQAエンジニアのOh Taeyunにバグの再現と確認を依頼する。

![バグ報告：QA再現中](/assets/image/post/claude-code-agent-dashboard/18-bug-report.png)

QAエンジニアが確認する。`requestAnimationFrame`が非アクティブタブで停止し、復帰時に再起動しない。バグが確認され根本原因が特定されたところで、COOがWebデベロッパーのKang Harinをディスパッチして修正させる。

![バグ修正：開発者パッチ中](/assets/image/post/claude-code-agent-dashboard/19-bug-fix.png)

彼女が`visibilitychange`イベントリスナーを追加し、タブがアクティブに戻った時にアニメーションループを再起動するようにする。1ファイルの修正で、3分以内に完了。

これがリアルなワークフローである。CEO報告 → QA再現 → 開発者修正。「一つのプロンプトで魔法のように完成品が出てくる」のではない。

### 9.7. Phase 5：ドキュメント(1エージェント)

すべての検証が完了し、COOが最後のタスクを割り当てる。テクニカルライターのJo Minjiが開発プロセス全体をドキュメント化する。

彼女がすべてのフェーズの出力（PRD、技術設計、コード変更、レビュー所見、セキュリティ修正、QA結果）をレビューし、ブログ記事、更新されたREADME、CHANGELOGエントリー、フック設定ガイドを作成する。

![Phase 5：ドキュメント アクティブ](/assets/image/post/claude-code-agent-dashboard/10-techwriter-documenting.png)

ドキュメントが完了すると、彼女が作成したすべてのもののMarkdownサマリーとともにカードがCompletedに移動する。

![Phase 5：ドキュメント 完了](/assets/image/post/claude-code-agent-dashboard/11-techwriter-done.png)

生成された技術設計ドキュメントの様子である。目次、アーキテクチャ概要、データフロー図、API仕様を含むConfluenceスタイルのページである。

![テクニカルライターが生成した技術設計ドキュメント](/assets/image/post/claude-code-agent-dashboard/16-techwriter-doc.png)

### 9.8. 完了カードの展開

完了カードをクリックすると展開され、Tailwind Typographyでレンダリングされた完全なMarkdown出力が表示される。Web開発者の完了カードの様子で、実装サマリー、変更ファイル、テストカバレッジが確認できる。

![完了カード展開 Markdown表示](/assets/image/post/claude-code-agent-dashboard/12-completed-expanded.png)

そしてエラーカードを展開した様子。セキュリティ監査者が何を発見したかが正確にわかる。

![エラーカード展開](/assets/image/post/claude-code-agent-dashboard/13-error-expanded.png)

### 9.9. 最終プロダクト

これがエージェントたちが実際に構築したボイスメモアプリである。リアルタイムの音声テキスト変換、波形可視化、メモ管理を備えた完全に機能するPoCだ。

![ボイスメモPoCアプリ](/assets/image/post/claude-code-agent-dashboard/15-voice-memo-app.png)

一つのプロンプトから動くアプリケーションまで、すべてのフェーズがダッシュボード上でリアルタイムに可視化された。

### 9.10. パイプライン全体の要約

5つのフェーズにわたる完全なオーケストレーションフロー。

**CEO**: "音声メモPoC開発" → **COO**: 分析・計画

| フェーズ | エージェント |
|---------|------------|
| **Phase 1: 企画** | Kim Soyeon(PRD), Lee Junhyuk(技術設計), Han Yeseul(ワイヤーフレーム) |
| **Phase 2: 開発** | Kang Harin(React SPA) |
| **CEOフィードバック** | Kang Harin(Safari対応 + UI) |
| **Phase 3: レビュー** | Choi Yujin(アーキテクチャ), Im Subin(品質), Shin Jaewon(セキュリティ) → **エラー** |
| **セキュリティ修正** | Kang Harin(XSS + 暗号化) |
| **Phase 4: QA・再検証** | Oh Taeyun(QA), Shin Jaewon(再監査) |
| **バグ修正**(CEOレポート) | Oh Taeyun(再現確認), Kang Harin(波形修正) |
| **Phase 5: 文書化** | Jo Minji(Blog, README, CHANGELOG) |

## 10. macOS自動起動(launchd)

ダッシュボードサーバーはClaude Codeのセッション開始前に起動している必要があるため、macOS起動時に自動的に開始するlaunchdサービスとして設定した。

プロジェクトには`install-launchd.sh`スクリプトが含まれている。

```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PLIST_NAME="com.binaryloader.agent-dashboard"
PLIST_SRC="$PROJECT_DIR/$PLIST_NAME.plist"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

# 全パッケージをビルド
cd "$PROJECT_DIR"
pnpm build

# pnpmパスを置換してplistをコピー
PNPM_PATH=$(which pnpm)
sed "s|/path/to/pnpm|$PNPM_PATH|g" "$PLIST_SRC" > "$PLIST_DST"

# サービスをロード
launchctl unload "$PLIST_DST" 2>/dev/null || true
launchctl load "$PLIST_DST"
```

`scripts/install-launchd.sh`を実行すると、ダッシュボードサーバーがログインのたびに起動する。ログは`/tmp/agent-dashboard.log`に出力される。サーバーはクライアントを静的ファイルにビルドして同じポートから配信するため、`http://localhost:3100`でAPIとダッシュボードUIの両方にアクセスできる。

アンインストールはコマンド1つである。

```bash
launchctl unload ~/Library/LaunchAgents/com.binaryloader.agent-dashboard.plist \
  && rm ~/Library/LaunchAgents/com.binaryloader.agent-dashboard.plist
```

## 11. 学び

### 11.1. ピボットすべきタイミングを見極める

2Dバーチャルオフィスはクリエイティブな探求だった。確かな魅力があった。エージェントがカフェテリアに歩いて行き、エラーで頭を掻き、完了を紙吹雪で祝う様子はすべて心地よかった。しかし魅力と実用性は同じではない。ピクセルスプライトを凝視してどのエージェントがアクティブか見分けようとしている自分に気づいた瞬間、このコンセプトがユースケースに合っていないとわかった。

Gather Town風モニタリングの構築からダッシュボードの完成まで、全プロセスは土曜の夜から約9時間で完了した。サーバーアーキテクチャがすでに堅固だったため、プレゼンテーション層の入れ替えは迅速に進んだ。教訓は、プレゼンテーション層を変更してもデータパイプラインを書き直す必要がないほど、インフラを汎用的に構築すべきだということである。

### 11.2. フックシステムの制約と回避策

Claude Codeのフックシステムは強力だが、モニタリングダッシュボード向けには設計されていない。重要なギャップはコンテキストである。フックは何が起きたか(エージェントが開始した、ツールが使われた)を教えてくれるが、なぜ(エージェントに何を依頼したか)は教えてくれない。task-assignパターンがこのギャップをエレガントに埋めるが、オーケストレーション層での規律が求められる。すべてのエージェント呼び出しの前にtask-assignコールを行う必要がある。

これを`~/.claude/rules/workflow.md`のルールとしてエンコードすることで自動化された。COOは指示にそう書いてあるので常にタスクを事前登録する。手動の規律は不要である。

その後の改善で手動ステップを完全に排除した。サーバーがAgent道具のPreToolUseイベントを傍受してタスク名を自動登録するため、ワークフロールール自体が不要になった。

### 11.3. リアルタイムWebSocketがすべてを変える

ポーリングベースのモニタリングとWebSocketプッシュの違いは、技術的なものだけではない。システムとのインタラクションの仕方そのものを変える。リアルタイム更新があれば、エージェントが作業している間ダッシュボードを眺めることができる。エラーが発生した瞬間を目撃する。エージェントがworkingからcompletedに遷移するのをリアルタイムで見る。「定期的にチェックする」から「一目でわかる」への変革である。

### 11.4. 韓国語名が人格を与える

これは主観的だが、エージェントに韓国語名を付けたことで体験全体がより魅力的になった。「セキュリティ監査のShin JaewonがXSS脆弱性を発見した」は「security-auditorがXSS脆弱性を発見した」より記憶に残る。抽象的なツール使用が、チーム連携のように感じられるものに変わる。

名前はClaude Codeとの会話でも役立つ。COOが「プロダクトプランナーのKim Soyeonを市場調査にディスパッチ」と言えば、関数呼び出しではなく自然な委任のように読める。

## 12. 率直な評価：プロダクションレベルか?

否である。明確にしておく。

マルチエージェントパイプラインの出力は粗い。コードは動くが洗練されていない。一貫性のないネーミング、欠落したエッジケース、人間の開発者なら二度見なしには出荷しないUIの細部が見つかるだろう。セキュリティ監査者は明白な脆弱性を捕捉するが、微妙なアーキテクチャの問題はすり抜ける可能性がある。QAエンジニアはテストを実行するが、カバレッジは網羅的ではない。

エージェントが生成したコードは一発でクリーンに動作しない。importパスが間違っていたり、型が合わなかったり、実際にアプリを開いて初めて発覚するブラウザ固有のエラーが出たりする。こうした細かいバグを潰す作業はまだ人間の仕事である。エージェントに「これ動かないんだけど?」と投げ返せば直してくれるが、そのやり取り自体に時間がかかる。現時点でエージェントパイプラインは完成品自動生成機というよりは初稿作成機に近い。

これはPoCツールであり、その用途では卓越している。アイデアを素早く検証したいとき（コンセプトの妥当性確認、ステークホルダーミーティングのデモ、エンジニアリングリソース投入前のプロトタイプ）、このワークフローは数日かかる作業を数時間に短縮する。エージェントが機械的な作業を処理する。スキャフォールディング、ボイラープレート、基本テスト、ドキュメント。人間は判断を下す。このアーキテクチャが正しいか、UXに意味があるか、そもそもこれを作るべきか。

核心的な洞察は、境界がどこにあるかを知ることである。エージェントチームで最初の80%を生成し、残りの20%には人間の専門性を適用する。センス、コンテキスト、AIがまだ持ち合わせていないドメイン知識が必要な部分である。

## 13. おわりに

このダッシュボードを構築する中で、繰り返し浮上する問いと向き合わざるを得なかった。AIエージェントが実装作業の大部分を処理するとき、ソフトウェア開発はどのような姿になるのか。

従来の開発ワークフロー（仕様策定、チケット割り当て、コードレビュー、QA、デプロイ）はすでに変化しつつある。このプロジェクトでは一人が19人のエージェントをマルチフェーズパイプラインでオーケストレーションした。通常ならクロスファンクショナルチームが必要な規模である。企画、コーディング、レビュー、テスト、ドキュメントのすべてが一つのセッションで、一つの画面上で行われた。

これは開発者が不要になるという意味ではない。むしろ役割が上方へシフトする。コードを書く時間が減り、意思決定に費やす時間が増える。どのアーキテクチャが適切か、どのトレードオフを受け入れるか、出力が十分に良いか。エージェントは速いが判断力がない。人間は遅いが方向性を示す。両者の組み合わせはどちらか単独よりも生産的である。

AnthropicのCEO Dario Amodeiは、AIが[3〜6ヶ月以内にコーディングの大部分を代替する](https://www.finalroundai.com/blog/anthropic-ceo-ai-coding-six-months)と発言した。まったくの絵空事とは思えなくなってきた。しかし現実的な障壁が二つ残っている。第一にコストである。AIエージェントを大規模に運用する費用が人間の開発者の人件費と競合できるかはまだ不明である。第二に品質である。現時点でエージェントが生成するコードは動作するが粗い。細かいバグ、壊れたimport、ブラウザ固有のエッジケース。「直して、あ、それも直して」のサイクルが時間の節約分を削っていく。完全な代替は時期尚早であり強力なアクセラレーターが正確な表現である。

それでも方向性そのものは否定しがたい。この潮流がどこに向かうかについては[[Column] 「開発者がいないから無理」はもう通用しない](/ja/writing/column/the-end-of-developer-scarcity/)に詳しく書いた。要約すると、コードを書ける人材への需要が消えるのではなくコーディングの定義が拡張されつつある。AIエージェントチームを率いることも依然としてソフトウェアエンジニアリングである。ただ我々が慣れ親しんだ姿とは異なるだけである。

興味深い時代である。

# 参考

- <https://docs.anthropic.com/en/docs/claude-code>
- <https://docs.anthropic.com/en/docs/claude-code/hooks>
- <https://www.finalroundai.com/blog/anthropic-ceo-ai-coding-six-months>
