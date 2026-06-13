---
title: "[LLM] Apple Foundation ModelsでClaudeを使うClaudeForFoundationModelsパッケージ"
ref: claude-for-foundation-models
excerpt: "AnthropicのClaudeForFoundationModelsを使い、Apple Foundation Models frameworkでClaudeをサーバーサイド言語モデルとして連携しオンデバイスモデルと使い分ける方法をまとめる。"
date: 2026-06-13T16:00+09:00
last_modified_at: 2026-06-13T16:00+09:00
published: true
credits:
  planning: binaryloader
  research: Claude
  drafting: Claude
  editing: Claude
  review: [Claude, binaryloader]
  translation: Claude
  thumbnail: Claude
  publishing: Claude
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/claude-for-foundation-models.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/claude-for-foundation-models.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - Claude
  - Foundation Models
  - Swift
  - Apple
  - iOS
  - On-Device
  - Tool-Calling
depth:
  - title: "Development"
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "LLM"
    url: /ja/development/ai/llm/
---

# 概要

AnthropicのClaudeForFoundationModelsを使い、Apple Foundation Models frameworkでClaudeをサーバーサイド言語モデルとして連携しオンデバイスモデルと使い分ける方法をまとめる。

# まとめ

最初に一点、正直に伝えておく。この記事に登場するSwiftコードは、私が実際にビルドして動かした結果ではなく、Anthropicの公式ドキュメントとリポジトリのREADMEに記載されているシグネチャを転記した参考用コードである。このパッケージはサーバーサイド言語モデルAPIを使うOS 27とXcode 27ベータを必要とするが、私の環境ではまだそのベータをセットアップできていない。コードの形と流れは公式資料を根拠にしているので信頼できるが、実際に動かして確認した検証結果ではない。ベータ環境を整えたら、リポジトリの`Examples/ClaudeExample`を直接実行して動作を確認する予定だ。それまでは、以下のコードを動作検証済みのものとしてではなく、公式仕様をまとめた参考資料として見てほしい。

## 1. ClaudeForFoundationModelsとは何か、なぜ登場したのか

ClaudeForFoundationModelsは、Anthropicが2026年6月8日に公開したSwiftパッケージである。同日のブログ発表と同時にGitHubリポジトリの最初のタグ`0.1.0`が公開され、現在の最新タグは6月10日に追加された`0.1.1`だ。このパッケージが何をするかは一文で表せる。Apple Foundation Models frameworkの中でClaudeをサーバーサイド言語モデルとして使えるように接続する。

ここで重要な区別がある。このパッケージは汎用的なMessages APIクライアントではない。Anthropic APIを直接呼び出すSDKが欲しい場合は、別のクライアントライブラリがその役割を担う。ClaudeForFoundationModelsのアイデンティティはFoundation Models frameworkへのprovider conformanceである。つまり、Appleが定義した言語モデルプロトコルにClaudeを適合させ、フレームワークがオンデバイスモデルを扱うのと同じ方法でClaudeを扱えるようにするアダプターだ。パッケージが外部に公開する型もこの目的に合わせて最小限に絞られている。providerの本体である`ClaudeLanguageModel`、モデル識別とcapabilitiesを担う`ClaudeModel`、認証方式を表す`AuthMode`、サーバーサイドツールを設定する`ClaudeServerTool`、そしてtranscriptにツールのアクティビティを公開する`ClaudeServerToolSegment`である。

背景にあるのはOS 27ベータで導入されたサーバーサイド言語モデルAPIだ。Apple Foundation Models frameworkはもともとデバイスに内蔵されたオンデバイスモデルを扱うフレームワークだったが、OS 27ベータからサーバーサイド言語モデルを同じフレームワークの抽象化の下に受け入れる道が開かれた。ClaudeForFoundationModelsはその道を通じてClaudeをフレームワーク内に組み込む実装である。ライセンスはApache 2.0で、ベータ期間中はバグレポートをGitHub issuesで受け付けているが、外部PRは受け付けていない。

### 1.1. LanguageModelプロトコルconformanceという設計

このパッケージの設計を一言で要約すると、ClaudeをフレームワークのLanguageModelプロトコルに適合させたということである。結果として、ClaudeはAppleのオンデバイスモデルと同じ`LanguageModelSession` APIで動く。`respond(to:)`でレスポンスを受け取る処理、ストリーミング、guided generation、ツール呼び出しがすべて同じセッションAPI上で動作する。開発者の視点から見ると、モデルを作るコードの一行だけが異なり、その後に続くセッション使用コードはオンデバイスモデルを使う場合と構造が同じになる。

この設計が与える実質的なメリットは二つある。まず、Foundation Modelsで書いた既存コードがほぼそのまま再利用できる。セッションを作るときに渡すモデルをClaudeに変えるだけで、それ以降の呼び出しコードを書き直す必要がない。次に、オンデバイスモデルとClaudeを同じインターフェースで切り替えられる。この二つ目のメリットが次のセクションで扱うモデル分担の基盤となる。

## 2. オンデバイスモデルとClaudeをどう使い分けるか

このパッケージを導入するかどうかを決める前に、まず答えるべき問いがある。そもそもClaudeをいつ呼び出すのか、という問いだ。Appleのオンデバイスモデル(`SystemLanguageModel`)はデバイス内で推論を完結させるため、高速でプライベートかつオフラインでも動く。ただし、このモデルは軽量なタスク向けにサイジングされている。短い分類、要約、抽出、簡単な変換など、デバイスリソースで十分なタスクがオンデバイスモデルの守備範囲だ。

一方、デバイスモデルでは対処しにくい要求が生じる局面もある。より大きなコンテキストを一度に扱う必要がある場合、フロンティアレベルの推論が必要な場合、またはウェブ検索やコード実行のようなサーバーサイドツールが必要な場合だ。そのときは同じタスクをClaudeにエスカレーションする。判断の軸はつまるところタスクの重さである。デバイスリソースで満足に完結するタスクはオンデバイスに置き、コンテキスト規模、推論の難易度、サーバーツールへの依存によって限界に達するタスクだけをClaudeに送る。

この分担がコードレベルでスムーズに実現できる理由は、双方が同じ`LanguageModelSession` APIを共有しているからだ。セッションを作るときに渡すモデル引数を変えるだけで、同じ呼び出しコードがオンデバイスモデルでもClaudeでも動く。つまり、モデルの選択をセッション単位の決定として扱える。アプリはタスクごとにどのモデルでそのセッションを動かすかを決め、同じプロンプト処理ロジックを両方のモデルに通す。軽いリクエストはデバイスで処理し、重いリクエストだけネットワーク経由でClaudeに送るという構造を、インターフェースの切り替えなしに構築できるのだ。

まとめると、この記事の残りはClaudeサイドの統合を扱うが、統合の前提は常に同じである。オンデバイスで完結できることはオンデバイスに置き、その境界を越えるものだけをClaudeに送る。

## 3. 要件とインストール

要件はOS 27ベータ世代に縛られている。サーバーサイド言語モデルをサポートするOS 27リリースが前提であり、Package.swiftのプラットフォームターゲットはiOS 27、macOS 27、visionOS 27、watchOS 27の四つだ。すべてベータである。iPadOSはiOSターゲットに含まれるため、別途OSとして列挙されていない。ビルドにはXcode 27ベータが必要で、開発段階ではClaude Consoleで発行したAPIキーが必要だ。プロダクション配布ではAPIキーをアプリに直接埋め込まない別の認証方式を使うが、それは§7で個別に説明する。

以下に登場するコードは前述のとおり公式仕様をまとめたものなので、その点を踏まえて見てほしい。パッケージはSwift Package Managerで追加する。Package.swiftのdependenciesにリポジトリを登録する。

```swift
dependencies: [
    .package(url: "https://github.com/anthropics/ClaudeForFoundationModels.git", from: "0.1.0")
]
```

`from: "0.1.0"`はタグベースの指定なので、現在公開されている`0.1.0`と`0.1.1`両方のタグを満たす。公式ドキュメントとREADMEはいずれも`0.1.0`基準で仕様を説明しているので、そのまま従えばよい。

コードでは二つのモジュールを一緒にimportする。セッションとgeneration関連の型はAppleフレームワークから、Claude provider型はパッケージからそれぞれ取り込む。

```swift
import FoundationModels
import ClaudeForFoundationModels
```

## 4. クイックスタート

最小限の統合は三つのステップで完結する。Claude providerを作り、それでセッションを作り、セッションにプロンプトを送る。

```swift
import FoundationModels
import ClaudeForFoundationModels

let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .apiKey("sk-ant-...")
)

let session = LanguageModelSession(model: model)

let response = try await session.respond(to: "Swiftのactorを一段落で説明してください。")
print(response.content)
```

`ClaudeLanguageModel`がproviderの本体だ。最初の二つの引数、`name`と`auth`だけを渡せば残りはデフォルト値で埋まる。セッションを作る`LanguageModelSession(model:)`とレスポンスを受け取る`respond(to:)`はApple Foundation Modelsの標準APIであり、オンデバイスモデルを使う場合と同一だ。レスポンスの本文は`response.content`で取り出す。

イニシャライザはこの二つ以外にさらに四つの引数を受け付ける。全体のシグネチャは以下のとおりである。

```swift
public init(
    name: ClaudeModel,
    auth: AuthMode,
    fixedEffort: ClaudeModel.Effort? = nil,
    serverTools: Set<ClaudeServerTool> = [],
    baseURL: URL = ClaudeLanguageModel.defaultBaseURL,
    timeout: TimeInterval = 60
)
```

`fixedEffort`はすべてのリクエストの推論強度を固定するオプションで§6で説明する。`serverTools`はウェブ検索やコード実行などのサーバーサイドツールの設定で§9で説明する。`baseURL`のデフォルト値はClaude APIエンドポイントで、プロキシ構成では独自バックエンドのアドレスに変更する(§7)。`timeout`はリクエストタイムアウトでデフォルトは60秒だ。クイックスタートの段階では`name`と`auth`だけで十分で、残りは必要になったときに設定する。

## 5. モデルの選択とCapabilities

セッションに渡すモデルは`ClaudeModel`値である。この値を得る方法は二つある。パッケージに事前定義された定数を使うか、capabilitiesを直接宣言してまだ定数として提供されていないモデルIDを構成するかだ。

### 5.1. コンパイル済みモデル定数

現在パッケージには五つの定数がある。各定数には、どのAPIモデルIDにマッピングされるかとどの機能を受け付けるかが一緒に宣言されている。

| 定数 | APIモデルID | effortレベル | adaptive thinking | samplingパラメータ |
|------|------------|-------------|-------------------|------------------|
| `.opus4_8` | `claude-opus-4-8` | low、medium、high、xhigh、max | サポート | 非サポート |
| `.opus4_7` | `claude-opus-4-7` | low、medium、high、xhigh、max | サポート | 非サポート |
| `.opus4_6` | `claude-opus-4-6` | low、medium、high、max | サポート | サポート |
| `.sonnet4_6` | `claude-sonnet-4-6` | low、medium、high、max | サポート | サポート |
| `.haiku4_5` | `claude-haiku-4-5` | 非サポート | 非サポート | サポート |

五つの定数はいずれもstructured outputとimage inputをサポートしている。差があるのはeffortレベル、adaptive thinking、samplingパラメータだ。表で注目すべき点が二つある。まず、`.opus4_8`と`.opus4_7`だけがeffort `.xhigh`まで受け付ける。`.opus4_6`と`.sonnet4_6`は`.max`までサポートするが`.xhigh`は受け付けない。次に、`.haiku4_5`はeffortレベルをまったく受け付けず、adaptive thinkingもfalseだ。推論強度の調整が必要なタスクに`.haiku4_5`を選ぶと、effort関連の設定は意味を持たない。

### 5.2. capabilitiesが決めること

各`ClaudeModel`はどのフィールドを受け付けるかをcapabilitiesとして宣言する。受け付ける項目はsamplingパラメータ、effortレベル、adaptive thinking、structured output、image inputだ。この宣言が単なるメタデータではないという点が核心である。

Claude APIはモデルがサポートしていないフィールドを受け取ると、静かに無視するのではなくhard errorで拒否する。パッケージはこの挙動をcapabilitiesの宣言で防御する。つまり、モデルが受け付けないと宣言したフィールドはリクエストに含めて送らない。どのフィールドをAPIに送信するかをパッケージがモデルのcapabilitiesを参照して決めるということだ。これにより、開発者がモデルごとに許可されるフィールドを逐一覚えなくても、サポートされていないフィールドによってリクエストが拒否される事態を避けられる。

### 5.3. 定数にないモデルを構成する

まだパッケージに定数として含まれていないモデルIDを使う必要がある場合、`ClaudeModel`を直接構成する。IDとcapabilitiesを一緒に渡す。以下の`claude-experimental-x`は説明のための架空のモデルIDであり、capabilitiesの値もそれに合わせた任意の例である。

```swift
let customModel = ClaudeModel(
    id: "claude-experimental-x",
    capabilities: .init(
        samplingParams: false,
        effortLevels: [.low, .medium, .high, .xhigh, .max],
        adaptiveThinking: true,
        structuredOutput: true,
        imageInput: true
    )
)

let model = ClaudeLanguageModel(name: customModel, auth: .apiKey("sk-ant-..."))
```

このとき、capabilitiesはそのモデルが実際にサポートする機能と正確に一致させなければならない。capabilitiesを誤って宣言すると、パッケージが誤った判断でフィールドを送信したり省略したりすることになり、前者の場合は結局APIが拒否する。新しいモデルがリリースされて定数が追加されるまでの暫定手段として、この方法を理解しておくとよい。

## 6. Effort制御

effortはClaudeが応答前にかける推論の強度を調整する軸だ。レベルは五段階で`low`、`medium`、`high`、`xhigh`、`max`の順である。APIはeffortが指定されていない場合、`high`をデフォルト値として使用する。

ここでフレームワークとパッケージの境界を理解しておく必要がある。Foundation Models frameworkはリクエストごとに推論強度を示唆するreasoning hintを持っているが、そのレベルは`high`で止まる。したがって、`.xhigh`と`.max`はフレームワークのper-request hintでは絶対に到達できず、`ClaudeLanguageModel`の`fixedEffort`引数でのみリクエストできる。`fixedEffort`を設定すると、そのproviderで作ったすべてのリクエストのeffortがその値に固定され、フレームワークがリクエストごとに与えるreasoning hintよりも優先される。

```swift
let model = ClaudeLanguageModel(
    name: .opus4_8,
    auth: .apiKey("sk-ant-..."),
    fixedEffort: .xhigh
)
```

ただし§5で確認したように、effortはモデルによって受け付ける範囲が異なる。`.opus4_8`と`.opus4_7`は`.xhigh`まで受け付けるが、`.sonnet4_6`と`.opus4_6`は`.max`までしか受け付けず`.xhigh`は受け付けない。`.haiku4_5`はeffortをまったく受け付けない。そのため、`fixedEffort`でどの値を固定するかは、一緒に使うモデルがそのレベルをサポートしているか確認した上で決める必要がある。上の例で`.xhigh`を固定するには、`.opus4_8`か`.opus4_7`を選べば一貫して動作する。

## 7. 認証で開発キーとプロダクションプロキシを使い分ける

`AuthMode`は二つのケースを持つ。開発用の直接キー方式`apiKey(String)`とプロダクション用のプロキシ方式`proxied(headers: [String: String])`だ。この二つの区別はセキュリティに直結するため、最初から意図を明確にして使う方がよい。

```swift
public enum AuthMode: Hashable, Sendable {
    case apiKey(String)
    case proxied(headers: [String: String])
}
```

### 7.1. 開発用の直接キー

`apiKey`はClaude APIキーをアプリが直接保持してリクエストに含める方式だ。コードが最もシンプルなため、ローカル開発とプロトタイピングに適している。問題は配布の時点で顕在化する。アプリバイナリに埋め込まれた文字列キーは抽出される可能性がある。クライアントに入ったシークレットはもはやシークレットではないというセキュリティの基本前提がそのまま当てはまる。そのため、`apiKey`は開発専用として使い、リリースビルドを作る前にプロキシ方式に切り替えることを前提に導入する必要がある。

```swift
let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .apiKey("sk-ant-...")
)
```

### 7.2. プロダクション用プロキシ

`proxied`はアプリがClaude APIキーをまったく保持しない方式だ。アプリは標準Messages API形式のリクエストを自身のバックエンドに送り、そのバックエンドがサーバーサイドでcredentialを付けてClaude APIにフォワードする。具体的にはプロキシがアプリのリクエストを受け取り、`x-api-key`ヘッダーを追加した上で`api.anthropic.com`に転送する。キーはバックエンドにだけ存在し、アプリバイナリには残らない。

この構成において`headers`は、アプリが自身のバックエンドに対して自分自身を証明するために使う。つまりClaude API認証ではなく、caller認証用のヘッダーだ。プロキシバックエンドが発行したセッショントークンやユーザー認証情報をここに載せ、バックエンドが正当なクライアントのリクエストだけをClaudeに中継するようにする。`baseURL`はデフォルト値の代わりに自身のバックエンドアドレスに変更する。

```swift
let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .proxied(headers: ["Authorization": "Bearer <アプリセッショントークン>"]),
    baseURL: URL(string: "https://api.example.com/claude")!
)
```

まとめると、開発段階では`apiKey`で素早く接続し、プロダクションでは`proxied`と専用プロキシバックエンドでキーをサーバー側に隔離する。この切り替えをリリースチェックリストに明記しておけば、シークレットがアプリに漏れる事故を防げる。

## 8. ストリーミングと構造化出力

### 8.1. ストリーミング

トークンが届くたびにレスポンスを受け取るには`streamResponse(to:)`を使う。ここで一点明確にしておく必要がある。ストリームが出力する各要素は、直前の要素との差分を含むデルタではなく、その時点までに累積された全体のスナップショットだ。

```swift
let session = LanguageModelSession(model: model)

for try await partial in session.streamResponse(to: "長い回答をストリーミングで返してください。") {
    print(partial.content)
}
```

各要素が累積スナップショットであるため、画面に表示する際は受け取った値で既存のテキストを置き換えればよい。デルタを直接連結するコードを書くと同じ内容が重複して蓄積されるので注意が必要だ。UIの更新という観点では、最後に受け取ったスナップショットが常にそれまでの完全なレスポンスであるという性質は、むしろ扱いやすい。

### 8.2. 構造化出力

特定の型の値を直接受け取りたい場合は、Foundation Modelsの構造化出力機能をそのまま使う。返す型を`@Generable`で宣言し、フィールドの説明が必要なら`@Guide(description:)`を付けてから、`respond(to:generating:)`にその型を渡す。

```swift
@Generable
struct Recipe {
    @Guide(description: "料理の名前")
    let name: String

    @Guide(description: "必要な材料のリスト")
    let ingredients: [String]

    @Guide(description: "調理手順を順番に")
    let steps: [String]
}

let response = try await session.respond(
    to: "キムチチャーハンのレシピを教えてください。",
    generating: Recipe.self
)

let recipe = response.content
```

ここでモデル固有の差異が再び登場する。構造化出力をサポートしていないモデルにこの方法を使うと、パッケージは静かにテキストレスポンスにデグレードするのではなく、代わりに`LanguageModelError.unsupportedGenerationGuide`をthrowする。そのため、構造化出力を使うコードパスでは、このエラーを処理するか、そもそも構造化出力をサポートするモデルだけそのパスに通す設計にする必要がある。§5の五つの定数はすべてstructured outputをサポートしているため、定数を使っている限りこのエラーに直接遭遇することは少ない。注意が必要なのは、直接構成した`ClaudeModel`のcapabilitiesでstructured outputをfalseと宣言した場合だ。

### 8.3. 画像入力

画像入力も同じセッションAPIで処理する。image input capabilityを持つモデルはフレームワークのvision capabilityを宣言し、標準セッションAPIで画像を渡すと、パッケージがそれをClaude APIの画像フォーマットに変換して送る。§5の五つの定数はいずれもimage inputをサポートしている。開発者はFoundation Modelsの標準的な画像入力方法をそのまま使い、Claude APIフォーマットへの変換はパッケージに任せればよい。

## 9. ツール使用でクライアントとサーバーのツールを扱う

Claudeを使うセッションでは、ツールは二つに分かれる。デバイス上で実行されるクライアントサイドツールと、Anthropicのインフラで実行されるサーバーサイドツールだ。

### 9.1. クライアントサイドツール

クライアントサイドツールはフレームワークの標準ツールメカニズムをそのまま使う。ツール型を`Tool`に適合させてセッションの`tools:`配列に入れると、モデルがそのツールを呼び出すと判断したときにデバイス上で該当ツールが実行される。位置情報の取得、ローカルデータの検索、デバイス機能の呼び出しなど、アプリがデバイス内で実行するタスクがここに該当する。この部分はオンデバイスモデルを使う場合とコードが同一だ。

### 9.2. サーバーサイドツール

サーバーサイドツールは、ウェブ検索、ウェブfetch、コード実行をAnthropicのインフラでシングルラウンドトリップで処理する。デバイスではなくClaude側でツールが実行されるため、アプリはツール実行結果まで含んだレスポンスを一度の往復で受け取る。種類は`ClaudeServerTool` enumで表現する。

```swift
public enum ClaudeServerTool: Hashable, Sendable {
    case webSearch(domains: DomainFilter = .unrestricted, maxUses: Int? = nil)
    case webFetch(domains: DomainFilter = .unrestricted, maxUses: Int? = nil)
    case codeExecution
}
```

`webSearch`と`webFetch`は二つのオプションを受け付ける。一つ目の`domains`は、検索やfetchを許可または遮断するドメインを指定する`DomainFilter`だ。ケースは特定のドメインだけを許可する`.allowing([String])`、特定のドメインを遮断する`.blocking([String])`、制限を設けない`.unrestricted`の三つで、デフォルト値は`.unrestricted`だ。二つ目の`maxUses`は一つのリクエストでそのツールを最大何回使うかを制限する値で、デフォルト値は`nil`だ。

```swift
let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .apiKey("sk-ant-..."),
    serverTools: [
        .webSearch(domains: .allowing(["developer.apple.com"]), maxUses: 5),
        .codeExecution
    ]
)
```

`domains`は最初のパラメータなので省略するとデフォルト値の`.unrestricted`が適用される。`.webSearch(maxUses: 5)`のように`domains`を省いて`maxUses`だけ渡しても動作するが、正確なシグネチャでは`domains`が先に来ることを覚えておくとよい。

サーバーサイドツールが実行されると、そのアクティビティはtranscriptに`ClaudeServerToolSegment`というcustom segmentとして公開される。この型は`Transcript.CustomSegment`プロトコルに準拠しており、モデルがどのサーバーツールをどのように使ったかをtranscriptで確認できる。

### 9.3. サーバーツールがセッションではなくClaudeLanguageModelに付く理由

ここで設計上の興味深い点がある。クライアントサイドツールはセッションの`tools:`配列に入れるのに対し、サーバーサイドツールはセッションではなく`ClaudeLanguageModel`の`serverTools`引数に設定する。二つがアタッチする場所が異なる。

理由は型の所有権にある。`LanguageModelSession`はAppleが定義したフレームワーク型なので、パッケージが自由に拡張したり新しい設定ポイントを追加したりすることはできない。一方、サーバーサイドツールはAppleフレームワークに対応する概念がないClaude固有の機能だ。フレームワークが知らない機能をフレームワーク所有のセッション型に組み込む方法はないため、パッケージが所有する`ClaudeLanguageModel`側にサーバーツールの設定を置いたのである。そのため、サーバーツールの構成はモデル(provider)を作る時点で決まり、同じサーバーツール設定を共有するセッションはそのproviderから生成される。

## 10. エラー処理とフォールバック

パッケージはClaude APIのエラーを可能な限りAppleの`LanguageModelError`にマッピングする。オンデバイスモデルを扱う際に使っていたエラー処理コードがClaudeにもそのまま適用できるようにするためだ。主なマッピングは以下のとおりだ。

- コンテキスト長を超えた場合は`LanguageModelError.contextSizeExceeded`にマッピングされる
- HTTP 429(rate limit)とHTTP 529(overloaded)はいずれも`LanguageModelError.rateLimited`にマッピングされる
- リクエストタイムアウト(URLErrorのタイムアウト)は`LanguageModelError.timeout`にマッピングされる

`LanguageModelError`にマッピングできる等価物がないClaude固有のエラーは`ClaudeError`としてthrowされる。現在`ClaudeError`に定義されているケースは、認証失敗を示す`missingCredential`の一つだ。

```swift
public enum ClaudeError: LocalizedError, Sendable {
    case missingCredential
}
```

したがってエラー処理コードは、フレームワーク標準エラーとClaude固有エラーを合わせて扱う。以下は、rate limitに達した際にそのターンだけオンデバイスモデルにフォールバックし、認証問題は別途処理するパターンだ。

```swift
do {
    let response = try await claudeSession.respond(to: prompt)
    return response.content
} catch let error as LanguageModelError {
    switch error {
    case .rateLimited:
        // このターンだけオンデバイスモデルにフォールバックする
        let fallback = LanguageModelSession(model: SystemLanguageModel.default)
        return try await fallback.respond(to: prompt).content
    case .contextSizeExceeded:
        // 入力を減らすか要約してからリトライする経路に送る
        throw error
    default:
        throw error
    }
} catch ClaudeError.missingCredential {
    // 認証設定が誤っている。ユーザーメッセージで回復を促す
    throw error
}
```

このフォールバック戦略は§2のエスカレーション判断と対になっている。通常は重いタスクをClaudeに送るが、Claudeが一時的に応答できない状況(rate limitやoverloaded)では、そのターンをオンデバイスモデルに落としてユーザー体験の断絶を減らす。双方が同じセッションAPIを使うため、フォールバックパスのコードが本流のパスとほぼ同じ形になるという点がこの構造の利点だ。状況によっては即座にフォールバックせず、リクエストをキューに入れてリトライする戦略を選ぶことも可能だ。

## 11. データプライバシーと課金

データの経路はシンプルだ。リクエストはアプリからClaude APIへ直接送られる。Appleはこのリクエスト経路に入っておらず、プロンプトもレスポンスも見ない。この点がオンデバイスモデルとの対比になる。オンデバイスモデルはデータがデバイスを離れない代わりにデバイスリソースの制約を受ける。ClaudeはデータがAnthropicのAPIに出る代わりに、より大きなモデルとサーバーツールが使える。どちらの場合も、Appleはデータを途中で見ることはない。

プロキシ構成を使う場合は、リクエストが自身のバックエンドを一度経由するが、その場合もAppleは経路に含まれていない。データを見る主体がAnthropicの一つから、自身のバックエンドとAnthropicの二つに増えるだけで、バックエンドは自分が運営するインフラだ。

課金はAnthropicアカウントで行われる。使用量は標準のClaude API価格ポリシーに従って請求される。つまり、オンデバイスモデルの呼び出しはコストがかからないが、Claudeにエスカレーションしたリクエストはトークン使用量分だけ課金されるということだ。このコスト構造も§2の分担判断に影響する。デバイスで十分なタスクまでClaudeに送ると不必要なコストが発生するため、軽いタスクはオンデバイスに置く方がコスト面でも合理的だ。

## 12. 現在の制約

ベータ段階なので知っておくべき制約がある。まず、Appleのプロトコルで表現できないClaude API機能はこのパッケージを通じては使えない。公式ドキュメントが明示している非サポート項目は以下のとおりだ。

- プロンプトキャッシュ制御：キャッシュ自体は自動で適用されるが、TTLやbreakpointは設定できない
- stop sequences
- batch processing
- Files API
- token counting
- beta headers

ベータ期間であるため、GA前にAPIが変更される可能性がある。バグレポートはGitHub issuesで受け付けているが、外部PRはベータ中は受け付けていない。統合を始める前にこの点を考慮し、プロダクションのスケジュールを立てる際はAPI変更の可能性に余裕を持っておく必要がある。

実際の動作を素早く確認したい場合は、リポジトリの`Examples/ClaudeExample`を参照するとよい。このサンプルは実行可能なCLIターゲットで、チャットのターンをターミナルにストリーミングで出力する。`--search`フラグを渡すと、サーバーサイドのウェブ検索が動作する様子も確認できる。ただし実行にはmacOS 27ホストが必要なので、OS 27ベータ環境を整えてから試すことを勧める。

# 参考

- <https://claude.com/blog/claude-for-foundation-models>
- <https://developer.apple.com/documentation/foundationmodels>
- <https://github.com/anthropics/ClaudeForFoundationModels>
- <https://platform.claude.com/docs/en/cli-sdks-libraries/libraries/apple-foundation-models>
