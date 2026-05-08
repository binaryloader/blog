---
title: "[Agent] Mollo企画のための既存エージェントフレームワーク中核資産分析"
ref: native-agent-framework-mollo-core-assets
lang: ja
permalink: /ja/:categories/:title/
excerpt: "AppleプラットフォームネイティブのエージェントフレームワークMolloの実装に入る前に、LangGraph、Koog、OpenAI Agents SDK、Pydantic AI、Mastra、MCP、Appleフレームワークの中核資産を整理する。"
date: 2026-04-28T22:00+09:00
last_modified_at: 2026-04-28T22:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/native-agent-framework-mollo-core-assets.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/native-agent-framework-mollo-core-assets.png"
categories:
  - Development
  - AI
  - Agent
tags:
  - Agent
  - Mollo
  - LangGraph
  - LangChain
  - Koog
  - Mastra
  - Pydantic AI
  - MCP
  - Swift
  - Apple Silicon
  - Side Project
depth:
  - title: "Development"
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "Agent"
    url: /ja/development/ai/agent/
credits:
  planning: binaryloader
  research: [binaryloader, Claude]
  drafting: binaryloader
  editing: binaryloader
  review: [binaryloader, Claude]
  translation: Claude
  thumbnail: Claude
  publishing: Claude
---

# 概要

AppleプラットフォームネイティブのエージェントフレームワークMolloの実装に入る前に、LangGraph、Koog、OpenAI Agents SDK、Pydantic AI、Mastra、MCP、Appleフレームワークの中核資産を整理する。

# まとめ

## 1. 背景

先行する記事[[LLM] Apple SiliconでMLXによるローカルLLM環境を構築する](/ja/development/ai/llm/local-agent-on-mlx/)では、MacBook Pro M5 Pro上にMLXとQwen 3.6 27B 6bitを載せ、ローカルLLM環境を構築した。その作業の本当の目的は単なる推論サーバの構築ではなく、その上で動くエージェントフレームワークの事前準備である。本記事はその上で動く本体に当たるMolloの企画ノートである。

MolloはiOS 15+／macOS 12+で動作するSwift 6ベースのエージェントフレームワークであり、外部依存を0に保つ。企画段階で定めた一行の定義は「iOS版LangGraph」である。Python LangGraphの中核抽象であるState Channel + Reducer、Durable Execution、Interrupt／Command、Parallel／Map、SubgraphをSwift 6のtyped throwsとactor並行性の上に正統な形で移植しつつ、AppIntents、CloudKit、Keychain、BackgroundTasks、NaturalLanguage、Vision、SpeechといったAppleネイティブを一等市民として統合するという方向性である。

活用は大きく三つの軸で描いている。一つ目はアプリのサービス機能自体にエージェントを埋め込みユーザーインテントを処理する方向であり、二つ目はプロジェクトに直接連動するQA自動化を含めたアプリ開発プロセス全般のハーネスを構築する基盤であり、三つ目は予定整理、文書要約、検索といったユーティリティエージェントの基盤となるフレームワークである。三つの軸ともに、データを端末の外に出さなくて済むという性質が核である。

実装に入る前に意図的に一段階を空けておいた。すでに市場で地位を築いているフレームワークを精読し、何を取り込み何を空けておくかから整理した。本記事はその整理の結果である。

付け加えておくと、Molloは商用プロダクトの場で誰かと競うためのプロジェクトではない。フレームワークを自分で作ってみたら面白そうだという学術的な好奇心から始めた個人の研究プロジェクトである。正直なところ、これを最後まで磨いて公開する頃には、似たコンセプトのSwiftネイティブフレームワークが先に出ている確率の方が高い。それでも第一の動機は、Swift 6の並行性モデル、モバイル環境のライフサイクル、Appleネイティブ資産を直接扱う経験を最後までやり遂げてみることである。何であれ本当に使いこなすには、それがどう動いているのかを底から掘り下げて見てみる必要があるという日頃の信念も底に敷かれている。したがって本文の分析は、どのフレームワークがより優れているかという比較ではなく、すでに検証済みの抽象をAppleプラットフォーム上にどう丁寧に移植するかという企画ノートに近い。

動機をもう一つ書き添えると、直前に進めた[[Agent] ヤン室長 - サイドプロジェクトで作った不動産法令・判例RAGチャットボット](/ja/development/ai/agent/yangsiljang-real-estate-rag-chatbot/)というサイドプロジェクトが決め手になった。およそ二か月、作業が長引いた日にはヤン室長のRAGパイプラインと韓国語トークナイザのビルド、埋め込み・リランカー比較に夜遅くまで張り付いて1サイクルを終えた直後、自然に「では自分のドメインでは何をやってみられるか」という問いが続いた。整えられた商用のエージェンティックコーディングアシスタントや誰かが書いたエージェントをそのまま使う席に留まることもできた。しかし自分のドメインはモバイル開発であり、その領域で一度は自分の手でフレームワークを書いてみる方が自然だと感じた。ヤン室長が自分の知らない領域であるRAG、ベクトル検索、データ取り込みパイプラインを弟から学んでこなした作業だったとすれば、Molloは逆に最も馴染みのある領域に同じ深さで入っていく作業である。

## 2. 分析対象と観点

分析対象は同時代に活発に動いている7つのフレームワークと、ツールプロトコル1つ、そしてその上に載せるAppleプラットフォームである。具体的にはLangGraph、LangChain、Koog、OpenAI Agents SDK、Pydantic AI、Mastra、CrewAIを見ており、ツール標準としてMCPを併せて扱う。数値とバージョンは別途のファクトシートの2026-04-18基準をそのまま用いる。

分析の観点は7つに据えた。グラフと実行モデル、状態管理方式、HITLとインタラプト、LLMプロバイダー抽象、ツール定義と呼び出し、構造化出力と型安全、そしてプラットフォーム統合である。この7つはMolloのモジュール境界とほぼ1対1で対応する。各フレームワークが整えてきた資産を、対応するモジュールにそのまま落とし込めるかが基準となる。

良い資産を持ち込むことだけで差別化が生まれるわけではない。そのため分析は持ち込むものを選び抜く作業であると同時に、埋めない領域を決める作業でもある。サーバーサイドのフルスタック、分散マルチエージェントランタイム、自前のベクトルDBは、Molloの範囲から意図的に外す。

## 3. LangGraph：正統継承の原型

### 3.1. 中核資産

LangGraphはLangChain Inc.が作ったPythonフレームワークである。2026-04-17に1.1.7がリリースされ、GitHubスターは29.5kである。「iOS版LangGraph」というポジショニングのリファレンスである以上、最も精密に読んだ。

LangGraphのシグネチャは5つである。State Channel + Reducerはノード間のデータ受け渡しをdict共有ではなく、型のあるチャネルと結合規則でモデル化する方式である。Durable Executionは全ノード境界で状態を自動保存し、OSの強制終了後でも`thread_id`で再開できるようにする仕組みであり、MemorySaver、PostgresSaver、AsyncPostgresSaverといったチェックポインターで実装する。Interrupt／Commandはグラフ実行の途中で人の介入を要求し、`Command(resume=...)`で再開するHITL標準である。Parallel／Mapは`Send` APIで動的なマップリデュースを表現し、静的な並列エッジも合わせて支持する。Subgraphはサブグラフを一つのノードとしてカプセル化して再利用する。

### 3.2. Molloがそのまま受け継ぐ理由

この5つはすべてLangGraphが「検証済み」の抽象である。モバイル環境では更に強く要求される。モバイルOSはバックグラウンド遷移とメモリ圧迫でプロセスを強制終了し、その時点で進行中だったツール呼び出しと推論の流れを失わないためにはノード境界のチェックポイントが必要となる。ユーザーに決済承認や権限承認を求めるフローは、すなわちHITLインタラプトである。LangGraphがサーバー向けに整えた5つの資産は、モバイルではむしろ切実さを増す。Molloはこれをそのまま取り込みつつ、チャネルはactorベースのExecutionContextに載せ、reducerはSendable型で強制し、インタラプトはtyped throws経路で伝播させる。

## 4. Koog：JetBrainsのKotlinエージェントフレームワーク

### 4.1. 中核資産

KoogはJetBrainsが2025-05に公開したKotlinフレームワークである。2026-03-26に0.7.3がリリースされ、1.0には未到達である。中核はLangGraphスタイルのグラフDSLをKotlinネイティブで提供する点である。Strategyグラフ、subgraph共有状態、`@Tool` DSL、グラフ内interruptノード、agent persistenceの内蔵、Kotlin Flowベースのストリーミング、OpenTelemetry観測性を備える。マルチプラットフォームのターゲットはJVM、JS、WasmJS、Android、iOSである。

### 4.2. 抽象レベルでそのまま受け継ぐ部分

KoogはLangGraphの抽象をKotlinの上に丁寧に移植した一つの事例である。Strategyグラフ、agent persistence、interruptノードといった席がKotlin Multiplatformの上でどう構成されるかを示してくれ、その構成がそのままSwift 6のactorモデル上に移されたときに、どの部分が自然に収まり、どの部分が別の形になるべきかをあらかじめ見積もりやすくしてくれる。MolloはKoogのグラフDSLとpersistenceモデルを抽象レベルでそのまま学習材料とし、実装だけをSwiftのactorとtyped throwsで新たに書き直す。KoogがKMPを通じてiOSもビルドできるという事実は把握しており、その経路の方が合う人もいる。それでもMolloをSwiftネイティブで書く理由は、第1節で書いた学習の動機にとどまる。Apple生態系と直接向き合いたいという個人的な理由以外には特にない。

## 5. OpenAI Agents SDK：ミニマリズムとHandoff

### 5.1. 中核資産

OpenAI Agents SDKはOpenAI Solution TeamがSwarmを置き換えるために2025-03に公開したフレームワークである。2026-04-09時点でGitHubスター20.7k、コントリビューター241名、コード規模は5k〜10k SLOCと意図的に小さく設計されている。Agentは`Agent(name=, instructions=, tools=, handoffs=, model=)`という一行のクラスで、明示的なStateオブジェクトはない。メッセージ履歴とSessionsメモリ階層、`@function_tool`デコレーターによる一行ツール定義、`handoffs=[...]`に他のAgentを並べると自動的に`transfer_to_<name>`ツールが生成されるパターン、`needs_approval`フラグによるツール単位の承認、そしてRealtime音声ワークフローがシグネチャである。

### 5.2. Molloが部分のみ取り入れる理由

OpenAI Agents SDKは小さなAPI表面から大きな使い勝手を引き出す好例である。二つの側面を取り入れる。一つはAgentコンストラクタの単純さであり、もう一つは`needs_approval`系のツール単位承認フラグである。ただしグラフとチャネルがない点はMolloの方向性と異なる。モバイルはバックグラウンド強制終了とマルチターンのツール呼び出しが同時に発生する環境であり、流れを明示的なグラフで押さえておく方がデバッグと復旧の両面で有利である。よってMolloはOpenAI流の短いコンストラクタを基本のエントリポイントとして残しつつ、その内部でStrategy Graphが自動的に組み立てられるようにする。Handoffも自動ツール生成ではなく、サブグラフ実行 + メッセージフィルタリングで解く。

## 6. Pydantic AI：型安全な構造化出力

### 6.1. 中核資産

Pydantic AIはPydantic Servicesが作ったPythonフレームワークである。2026-04-16に1.84.0がリリースされ、GitHubスターは16.4kである。Agentは`Agent[Deps, Output]`というジェネリッククラスで表現し、`output_type`で出力スキーマを固定し、依存性注入を一等市民として扱う。Toolは`@agent.tool`デコレーターで`RunContext[Deps]`から依存を受け取り、マルチモーダルはImageUrl、AudioUrl、VideoUrl、DocumentUrl、BinaryContentで直接表現する。MCPは公式対応で、Durable ExecutionはTemporal、DBOS、Prefect統合に委譲する。観測性はPydantic Logfireを通じてOpenTelemetryに繋がる。

### 6.2. Agent\<Output\>ジェネリックの取り込み

MolloがPydantic AIから直接取り込む一点は、ジェネリックな出力型である。MolloのAgentは`Agent<Output: Codable & Sendable>`であり、Pydantic AIの`Agent[Deps, Output]`と同じ発想から出発した。Swiftはコンパイル時に出力型を保証するため、ランタイム検証に依存するPydanticより一歩先に進む。Pydantic AIの依存性注入は興味深いアプローチであるが、Molloはactorベースのテクニックを取り、ExecutionContextで同じ問題を解く。Durable ExecutionをTemporalに委譲する選択は追わない。iOSは外部ワークフローエンジンを引き込めない環境であり、チェックポインターをSQLite、インメモリ、暗号化ストレージに直接実装する必要がある。

## 7. Mastra：TSネイティブのポジション

### 7.1. 中核資産

MastraはGatsby創業チームが作ったTypeScriptフレームワークである。2024-10に公開され、2026-01に1.0 GAを迎え、2026-03-24時点でGitHubスター22.3k、月間npmダウンロード180万件を記録している。中核はWorkflowグラフ、Memory(Working／Conversation／Semantic)の3階層、RAG、Deployerを一つのフレームワークに統合した点である。Toolは`createTool({ id, inputSchema: z.object(...), outputSchema, execute })`という形でZodスキーマと結びついて定義され、ワークフローの`.parallel()`と`.branch()`、`.waitForInput()`はグラフとHITLの一等市民である。Vercel AI SDKの上で動作し、Next.jsやCloudflare Workersといったエッジランタイムとの統合が滑らかである。

### 7.2. 同じ「特定プラットフォームの一等市民」アプローチの比較

MastraがMolloにとって興味深いのは、同じ戦略を別のプラットフォームで実行している点である。MastraはVercelとNext.js生態系の一等市民として位置を取ろうとしており、MolloはApple生態系で同じ席を狙う。ワークフローグラフ + ストレージ + メモリを一つのフレームワークに束ねる統合の仕方は、Molloが9つのモジュールに分けた形と異なるが、利用者から見た束の単位は近い。ただしMastraが依存するVercel AI SDKは、Molloが追えない選択である。外部依存0がMolloの約束であり、同じ役割を果たすLLMClientRouter、RateLimitedProvider、CachedProvider、CostTrackedProviderは直接作る。Zodの滑らかなスキーマ開発者体験を、Codableとジェネリックの組み合わせで近い感覚に再現できるかは、実装の中で検証する必要がある。

## 8. MCP：ツールプロトコル標準

### 8.1. 中核資産

MCP(Model Context Protocol)はAnthropicが主導して標準化したツール接続プロトコルである。JSON-RPC 2.0の上に構築され、stdio、HTTP+SSE、WebSocketのトランスポートを定義する。クライアントがサーバーのツールを発見して呼び出す一方向ではなく、サーバーがクライアントにsampling、roots list、logging、progressといった要求を送る双方向であるという点が中核である。プロトコルバージョンは2025-06-18 specが最新である。

### 8.2. Molloの統合方法

MCPはMolloがそのまま取り込む標準である。MolloMCPモジュールはJSON-RPC 2.0クライアントとstdio、HTTP+SSE、WebSocketトランスポートを直接実装し、プロトコルバージョンを2025-06-18に固定する。サーバー発信の要求は`MCPRequestHandler`と`MCPNotificationHandler`で受け、複数サーバーのライフサイクルは`MCPServerManager`で管理する。外部依存0原則のため、MCP公式SDKも引き込まずに、FoundationのURLSessionとNetwork.frameworkのみで3種類のトランスポートを全て実装する。この領域ではLangGraphの`langchain-mcp-adapters`、OpenAI Agents SDKのhosted MCP、Mastraの公式対応と同じラインから出発する。

## 9. Appleプラットフォーム：ネイティブ一等市民

ここからは分析対象のどのフレームワークでも埋められていない領域である。Appleフレームワークを一等市民として扱う事例は見当たらず、モバイルOSと丁寧に整合する部分はSwiftで直接書く必要があるという結論になる。Molloが埋めようとしている席はまさにここである。

### 9.1. AppIntents

`AppIntentsAgent<Output>`はエージェントをそのままSiriとShortcutsに公開する。iOSの音声アプリインテントがすなわちエージェントの呼び出しとなり、ユーザーはSiriに命令するだけでMolloグラフを起動する。

### 9.2. CloudKit

`CloudKitSessionSync`はセッションをユーザーのiCloudに同期する。オプティミスティックロックで同時編集を処理し、1MBを超えるメッセージはCKAssetで送る。iPhoneとMac、iPadが同じ会話の流れを共有するマルチデバイスシナリオの標準経路である。

### 9.3. Keychain

`KeychainCredentialStore`はAPIキーとOAuthトークンをKeychainに保存し、`Accessibility`ポリシーと`SecAccessControl` Biometricフラグを受け取る。Touch IDやFace IDの認証を通過しないとトークンが解放されないように強制できる。

### 9.4. BackgroundTasks

`BackgroundExecution`はBGAppRefreshTaskとBGProcessingTaskの上で動作する。ユーザーがアプリをバックグラウンドに送っても、進行中のグラフはチェックポイントに保存され、OSが許可した時間内で再開されるか、次のフォアグラウンド復帰で続けられる。モバイルOSの強制終了と正面から対峙する領域である。

### 9.5. Vision／Speech

`VisionTool`はVNRecognizeTextRequestベースのOCRをツールとして公開し、`SpeechInputTool`はSFSpeechRecognizerでマイク入力をテキストに変える。`ImageSource`、`AudioSource`、`VideoSource`のenumが、URL、Data、UIImage、CGImage、CVPixelBuffer、AVAudioPCMBuffer、AVAssetを一括で受け止める。マルチモーダルはv1からオプションではなくコア機能である。

### 9.6. MLX Swift／Core ML

`MLXProvider`と`CoreMLProvider`はエンジン用のシムを備える。MolloはMLX SwiftやCore MLの特定モデル一つに強く縛られないようにしつつ、呼び出し側が望む時にどちらでも差し込める設計とする。先行するLLM環境構築記事で立てたmlx_lm.serverはOpenAI互換エンドポイントを提供するため、OpenAICompatibleプロバイダーでもそのまま接続できる。

### 9.7. NLEmbedding

`NLEmbeddingMemory`はAppleのNaturalLanguageフレームワークが提供する単語／文ベクトルをそのまま用いてオンデバイスのセマンティック検索を解く。SQLite FTS5ベースの`SQLiteMemory`と合わせて二系統のメモリバックエンドを構成する。外部のベクトルDBを引き込まず、AppleフレームワークのみでRAGの検索側を埋められるという点に意味がある。

## 10. 総合：Mollo中核モジュールへのマッピング(暫定案)

この領域はまだ確定設計ではなく、現時点での暫定案である。分析した資産を、Molloが計画中のモジュール境界にどうマッピングするかを、いま描いている見取り図として記しておく。モジュール境界と責務は実装を進めるなかで十分に調整される可能性がある。

- `MolloCore`はLangGraphの5シグネチャ(State Channel + Reducer、Durable Executionインターフェース、Interrupt／Command、Parallel／Map、Subgraph)とOpenAI Agents SDKの短いAgentコンストラクタ、Pydantic AIの`Agent<Output>`ジェネリックを集める席として置こうとしている
- `MolloPersistence`はLangGraphのCheckpointerをSwiftに移す席として想定している。SQLiteとInMemory、Encrypted(AES-256-GCM envelope)バックエンドを直接実装し、メモリはNLEmbeddingMemoryとSQLiteMemoryに分ける方向で検討している
- `MolloProviders`はAnthropic、OpenAI、Google Gemini、DeepSeek、OllamaとOpenAI互換エンドポイントを扱うモジュールとして想定している。LLMClientRouterのfallback／roundRobin／priority戦略と、RateLimited／Cached／CostTrackedデコレーターをここに置く構想である。MastraがVercel AI SDKに委譲した領域を直接書く見取り図である
- `MolloMCP`はMCP標準が入る席として置いている。JSON-RPC 2.0クライアントとstdio／HTTP+SSE／WebSocketトランスポート、サーバー発信要求ハンドラを直接実装する計画である
- `MolloTools`はOpenAI Agents SDKの`@function_tool`に相当するツール定義抽象を持ち、FileRead／Write／Edit、GrepSearch、GlobSearch、ShellTool(macOS、Command Injection防御)、WebFetchTool(SSRF防御)を基本提供する想定である
- `MolloMultimodal`はVisionとSpeech、ImageSource／AudioSource／VideoSourceを束ねる席として見ている。Pydantic AIがImageUrl／AudioUrl／VideoUrlで解いた席を、Appleフレームワーク直結で解く方向を考えている
- `MolloApple`はAppIntents、CloudKit、Keychain、HybridRouter、BackgroundExecution、MemoryPressureHandlerを集めるApple一等市民の席として置こうとしている。他のフレームワークには事実上対応するモジュールがない
- `MolloAuth`はOAuth 2.0 PKCEを実装し、`CredentialStore`プロトコルのみを公開し、Keychain実装はMolloApple側から注入する構造で考えている。逆依存が発生しないよう分けようという意図である
- `MolloObservability`は`TraceSpan`と`TraceCollector`、`JSONFileTraceExporter`、`os.Logger`ベースの`AgentLogger`、`RateLimiter`と`CostTracker`を集める席として見ている。Pydantic AIのLogfireの席を、OS標準のツールのみで埋めようという構想である

## 11. おわりに

分析を終えて二つのことが明確になった。一つはLangGraphが整理した5つの資産がもはや一フレームワークの特殊な抽象ではなく、エージェント領域の検証済み標準に近いという点である。Koogが同じ抽象をKotlinに移し、MastraとPydantic AIも近い機能を別の名前で展開している。Molloがこの資産をSwiftに移すのは新しい発明ではなく、検証された席への正統な移植である。

もう一つは、その資産の上にAppleプラットフォーム統合を一等市民として載せる席が空いているように見えたという点である。AppIntentsとCloudKit、Keychain、BackgroundTasks、NLEmbeddingをコアに抱え込んだフレームワークは、目に入る範囲では見当たらなかった。モバイルOSの強制終了とバックグラウンド制約、音声インテント、マルチデバイス同期といったモバイル固有の問題は、Appleフレームワークと整合した時に自然に収まる領域である。その席が個人的に面白く見え、学習の動機で自分で書いてみようとしているのがMolloである。

ここまでが実装に入る前に整理しておく資産のすべてである。次の段階は本格的な実装である。

# 参考

- <https://docs.koog.ai/>
- <https://docs.langchain.com/oss/python/langgraph>
- <https://github.com/JetBrains/koog>
- <https://github.com/langchain-ai/langchain>
- <https://github.com/langchain-ai/langgraph>
- <https://github.com/mastra-ai/mastra>
- <https://github.com/openai/openai-agents-python>
- <https://github.com/pydantic/pydantic-ai>
- <https://mastra.ai/docs>
- <https://modelcontextprotocol.io>
- <https://openai.github.io/openai-agents-python/>
