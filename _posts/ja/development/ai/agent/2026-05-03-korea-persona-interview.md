---
title: "[Agent] CLI / MCPで動く韓国人合成ペルソナインタビューツールkorea-persona-interview"
ref: korea-persona-interview
excerpt: "サイドプロジェクトとして作った韓国人合成ペルソナインタビュー自動化ツールkorea-persona-interviewをまとめる。NVIDIA Nemotron-Personas-Koreaデータセットの上にマルチターンインタビューと自動follow-up、ペルソナ崩れ検出を載せて事業仮説を素早く検証する。CLI / MCP server / MCP orchestratorの3つの入口が同じコアを共有するよう設計したパターンも併せて扱う。"
date: 2026-05-03T00:00+09:00
last_modified_at: 2026-05-04T19:26+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/korea-persona-interview.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/korea-persona-interview.png"
categories:
  - Development
  - AI
  - Agent
tags:
  - Agent
  - LLM
  - MCP
  - OpenAI
  - Anthropic
  - MLX
  - Korean Persona
  - Nemotron
  - User Research
  - Side Project
  - Python
depth:
  - title: "開発"
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "エージェント"
    url: /ja/development/ai/agent/
credits:
  planning: Claude
  research: Claude
  drafting: Claude
  editing: Claude
  review: [Claude, binaryloader]
  translation: Claude
  thumbnail: Claude
  publishing: Claude
---

# 概要

サイドプロジェクトとして作った韓国人合成ペルソナインタビュー自動化ツールkorea-persona-interviewをまとめる。NVIDIA Nemotron-Personas-Koreaデータセットの上にマルチターンインタビューと自動follow-up、ペルソナ崩れ検出を載せて事業仮説を素早く検証する。CLI / MCP server / MCP orchestratorの3つの入口が同じコアを共有するよう設計したパターンも併せて扱う。

# まとめ

## 1. サイドプロジェクトのきっかけ

事業アイデアの仮説を検証するときに最も負担が大きい工程はユーザーインタビューである。募集と日程調整、インタビュー自体に費やす時間、回答を意思決定に使える形に整える後処理まで合わせると、一つの仮説に数日が消える。だから本格的なインタビューに入る前の一次仮説フィルタとして使える合成ペルソナツールが必要だった。実際の人間を置き換える意図はない。本当のインタビューに連れて行く仮説を絞り込むための道具である。

LLM一つにペルソナを描いたsystem promptを差し込んでN人に同じ質問を投げるトイスクリプトはGitHubでもよく見かける。ただし本ツールは仮説検証が目的なので、ペルソナの多様性と回答品質を定量・定性の両面で抑える仕組みが必要だった。ペルソナの分布は統計的に均衡を取り、回答はペルソナ崩れと曖昧な回答を自動検出してfollow-upを投げる構造にしている。

## 2. ツールの一行定義と全体フロー

一行で書くと、韓国人合成ペルソナN人に事業アイデアの質問を投げて定量・定性レポートを受け取るツールである。ユーザーはyamlに事業アイデアを一行と質問を5つほど書き、CLIの一コマンドでインタビューとレポート生成をまとめて実行する。

全体の流れは次のとおりである。

- ペルソナデータセットをフィルタDSLで絞り、シード固定でN人をサンプリングする
- 各ペルソナに対してマルチターンで5つの質問を投げ、短い回答や曖昧な回答には自動follow-upを1回追加する
- インタビュー終了後に別途の単発呼び出しで回答を構造化要約のJSONに変換する
- 全ペルソナの応答を集計して定量スコア、価格意向、コホート別分布をmarkdownレポートとして出力する

成果物は`outputs/interview_{slug}_{timestamp}.json`にペルソナごとのmessagesとraw応答がそのまま残り、同じディレクトリに人間が読むためのmarkdownレポートが生成される。JSONにはインタビュー1件分の全turnとretry、トークン使用量まで含まれており、中間結果を別の解析スクリプトに再利用しやすい。

## 3. ペルソナデータ - NVIDIA Nemotron-Personas-Korea

### 3.1. データセットの構成とカラム

ペルソナの原本はNVIDIAが2026-04-20に公開したNemotron-Personas-Koreaデータセットである。ライセンスはCC BY 4.0なので、attributionさえ守れば自由に活用できる。規模はよく100万ペルソナと略されるが、正確には100万レコード規模である。1レコードあたり7種の自由記述ペルソナカラム(professional, sports, arts, travel, culinary, family, persona)が入っており、合算するとおよそ700万ペルソナに相当する。本ツールは1レコードを1人の合成人物として扱う。

中核となるカラムは人口統計約11種に自由記述ペルソナ7種を加えた束である。人口統計の軸は性別、年齢(19〜99)、結婚有無、兵役、世帯形態(`family_type`は39種のバリエーション)、住居形態(6種)、学歴(7種)、専攻、職業、市郡区(252種以上)、市道(17種)が一次資料となる。countryカラムも含まれているが、本データセットでは韓国の単一値なのでフィルタリングには使わない。自由記述カラムである`persona`は一人の人物の傾向と日常のトーンを自然言語で記述しており、system promptにそのまま注入するのに適した形である。

### 3.2. コホートフィルタリングとサンプリング

ツールはデータセット全体をメモリに載せても問題ないが、ほとんどの仮説は特定のコホート(例：30代ソウルの一人暮らし会社員)に限定される。そこでフィルタDSLを導入し、`--filter "age:25-39,region:서울특별시,gender:F,occupation_keyword:개발자"`のような一行で標本を絞る。`src/load_personas.py`の`parse_filter`が同一キーOR、異なるキーAND結合のルールでパースし、`load_and_sample`がシード固定の`random.Random(seed).sample`でN人を選択する。

シード固定は同じ仮説を再実行したときに同じペルソナが選ばれ、結果比較が意味を持つようにするためである。providerをOpenAIからAnthropicに切り替えたときにペルソナが違っていれば、回答差がモデル差なのかペルソナ差なのか切り分けられない。

## 4. インタビューフロー設計

### 4.1. マルチターン+インタビュー終了後の単発構造化要約

質問をどう束ねて送るかがツール設計で最も重く扱った決定である。ADR-001に候補3つをトレードオフ表で比較した。

- 候補Aはマルチターンである。質問を1ターンずつ送り、messages履歴に蓄積する。インタビューが終わると別のsystem promptで同じモデルにmessages全体を入力し、JSONの構造化要約を単発で生成する
- 候補Bは単発バンドルである。質問N個を一度に束ねて送り、モデルが一つの応答に全回答を自由記述+JSONで返す
- 候補Cは候補Bと同様に一度で回答を受け取りつつ、定性インサイトだけ別の単発で生成する

候補Aはトークンと時間が約1.8〜2.5倍高くつくが、自動follow-upとペルソナ崩れ検出を回答単位で隔離できる。一つの回答が汚染されても残り4つは生かせるという点が決め手だった。候補B/Cは一つの応答に回答が混在しているため、回答ごとの隔離が本質的に難しい。本ツールの中核ガードレールがfollow-upとdrift検出である以上、両者とは両立しない。

詳細なポリシーはsystemメッセージを`messages[0]`にtruncateなしで保存し、累積トークンが`llm.context_budget`の基準値(デフォルト32000)を超えたらsystemを除いた最古のuser/assistantペアから順に削除する。truncationが発火するとrecordの`flags.truncated=true`が立つ。トークン推定は韓国語1文字=1、英文1文字=0.25、その他0.5のヒューリスティックなので、実際のトークナイザを使わずに標準ライブラリのみで一貫したトリガーを作っている。

### 4.2. 自動follow-up - 短い回答と曖昧キーワードの検出

`src/interview.py`の`should_auto_follow_up`は回答長と曖昧キーワードの2軸でfollow-upの要否を判定する。空白を除いた文字数が閾値(`heuristics.short_answer_threshold`、デフォルト20文字)未満ならTrueになる。そうでなければ`heuristics.ambiguous_keywords`に定義された回避表現6種(「글쎄요」(さあ)、「잘 모르겠습니다」/「잘 모르겠어요」(よく分かりません)、「딱히」(特に)、「별로 생각 안 해봤」(あまり考えたことがない)、「모르겠」(分からない))が部分文字列として含まれるかを見る。どちらかでも発火すれば、同じターン流れで追跡質問をもう1回投げる。

follow-upを1回に制限した理由は二つである。一つ目は、追跡質問を無限に投げるとペルソナがインタビューの途中で次第にモデル本体のトーンに近づいていくことだ。二つ目は、トークンと時間がペルソナごとに均等にかからないと費用見積もりが崩れることだ。1回のfollow-upであれば短い回答を補強する効果は十分でありつつ、コスト変動も予測可能な範囲に収まる。

### 4.3. ペルソナ崩れ検出 - driftとrefusalのヒューリスティック

`detect_persona_drift`は応答がペルソナの人口統計と正面から矛盾するかを見る。検出軸は英語比率、年齢帯矛盾、性別矛盾、地域矛盾、居住形態矛盾の5つである。英語比率の閾値(デフォルト0.30)は単語単位の比率で取る。文字単位で取ると韓国語の一文に混ざった4文字の英単語が閾値を超えにくく、false negativeが増えた。単語単位で見ると「I think this is solo」のような英語中心の応答を安定して捉えられる。

偽陽性を減らすことに費やした時間のほうが長かった。人口統計の矛盾は「저는」(私は)、「나는」(私は)、「제가」(私が)、「내가」(私が)などの自己断定コンテキストの30文字ウィンドウ内でのみ検査する。居住形態の軸は同じ文単位で1人称主語+居住動詞の精密な正規表現のみマッチする。「혼자 사시는 분들」(一人暮らしの方々)のような3人称の一般化、「혼자서 끼니를 해결」(一人で食事を済ませる)のような行動表現、応答に偶然出てきたproductキーワード「1인 가구용」(一人世帯向け)のような表記はトリガーから除外される。家族同居ペルソナが「1인 가구가 아니라서」(一人世帯ではないので)と答える否定断定も整合した回答なので、driftとして捉えない。

英文の職業名に対するホワイトリストも入っている。「IT 컨설턴트」(ITコンサルタント)や「UX 디자이너」(UXデザイナー)のようなペルソナが自分の職業名を自然に言及するとき、英語比率の分母・分子から同時に外してfalse positiveを遮断する。`_occupation_english_tokens`がペルソナの`occupation`フィールドから英文トークンをlower-caseで抽出し、frozensetで返す。

### 4.4. システムプロンプトの単一ビルダー

3つの入口が同じペルソナ1人称ガードレールを共有するよう、システムプロンプトは単一ビルダーで強制している。`src/interview.py:399`の`build_system_prompt`がその入口である。人口統計7フィールドと自由記述`persona`要約を常に注入し、トグルキーワードであるprofessional, sports, arts, travel, culinary, familyが有効ならその自由記述カラムをrawから取り出して追記する。

テンプレート自体は`prompts/system_prompt.txt`に別ファイルで分離している。`{persona_json}`と`{product}`の2つのplaceholderだけ`str.format`で置換し、静的なprefixはそのまま維持する。この構造はOpenAIの自動prompt cachingと相性がよい。同じテンプレートを反復呼び出すとprefixが繰り返されるので、入力トークン単価の一部が割り戻される。詳しい数値は§5.2でまとめる。

`family_type`と`housing_type`をシステムプロンプトに明示的に露出した理由は、回帰一件を遮断するためである。この2つのフィールドを抜くとモデルが一人世帯か否かと住居形態を推論で埋める傾向があり、ペルソナがランダムに揺れた。rawに値があればそのまま埋め、なければpromptで省略する。

## 5. multi-providerなLLMバックエンド

### 5.1. OpenAI / Anthropic / ローカルOpenAI互換サーバ

LLMバックエンドは`LLMBackend` Protocolで抽象化されている。実装は`OpenAIBackend`と`AnthropicBackend`の2つである。providerトグルは`LlmConfig.provider`で決まる。`provider=openai`(デフォルト)はOpenAI Chat CompletionsとOpenAI互換エンドポイントであるmlx_lm.server, vLLM, llama.cppを扱う。`base_url`を`http://localhost:PORT/v1`に変えればそのままローカルサーバに接続できる。`provider=anthropic`はAnthropic Messages APIを直接呼び出す。

公式の`openai`と`anthropic`パッケージはどちらも依存関係から外し、httpxで直接呼び出している。retry/timeout/loggingのポリシーを一つのモジュールで統一しやすく、トランジティブ依存ツリーも小さくなる。Anthropic Messages APIはOpenAI Chat Completionsとは形が違う。top-levelの`system`フィールドを使い、`x-api-key`ヘッダが必要で`max_tokens`が必須である。base_urlのマッチングだけで分岐するのは安定しないので、別アダプタに分離した。

### 5.2. prompt cachingの活用

OpenAIのprompt cachingは自動である。クライアントコードに別途annotationを差し込まなくてよい。ただしprefixが1024トークン以上でなければキャッシュが有効化されず、それ以上は128トークン刻みでcache prefixが伸びる。マッチはexact prefix matchのみhitなので、`messages[0]`のsystem prompt+ペルソナ補強が可変部分(質問や回答の蓄積)よりも前に来る必要がある。本ツールはsystemを常にmessages[0]に置くので、一人のペルソナ内のマルチターン呼び出しは自然にprefixの繰り返しが発生する。

Anthropicのprompt cachingは自動ではなく`cache_control`の明示が必要である。block単位またはrequest単位で表記し、1リクエストあたり最大4個のbreakpointを置ける。モデル別の最小prefix長も異なる。Sonnet 4.5 / Opus 4.1 / Sonnet 3.7は1024 tokens、Sonnet 4.6は2048、Opus 4.7 / 4.6 / 4.5とHaiku 4.5は4096 tokensである。TTLはデフォルトで5分、`cache_control.ttl: "1h"`で1時間を選択できる。価格倍率は5分のcache writeがbase inputの1.25倍、1時間writeが2倍、cache readが0.1倍である。本ツールの`AnthropicBackend`はsystemブロックに`cache_control: ephemeral`マーカーを差し込む構造になっている。

両providerの挙動が異なるため、本ツールでの適用結果も違ってくる。OpenAI側はprefixを分離しておけば別作業なしに効果が出る。Anthropic側は`cache_control`マーカーが正確に置かれている必要があり、5分TTLの内に次の呼び出しが来てこそreadが活性化する。100人を同時実行数4でバッチすると同じprefixが5分以内に繰り返され、readのヒット頻度が十分に上がる。

### 5.3. コストと時間のトレードオフ

処理性能のSLOは100人インタビュー1回をv1.x基準で5〜10分以内に終えることである。質問5つ、同時実行数4を仮定した数値である。初期のv1.0はローカルMLX時代を基準に30分のSLOを置いていたが、OpenAIバックエンドに切り替えると1ターン応答が1〜3秒水準に落ち、5〜10分に更新した。PRDにも2つのSLOの変更経緯はそのまま残している。

同時実行数の上限とretryポリシーは保守的に取った。asyncio.Semaphoreで同時呼び出し数を制限し、retryはデフォルト3回、timeoutとjitterの幅はyamlで調整可能である。truncationは`llm.context_budget`基準値の累積が閾値なので、マルチターン5ターン+ペルソナ補強が入っても余裕がある方である。実使用ではtruncation発火事例はfollow-upが長くなったペルソナの一部に限られた。

## 6. 決定の変遷

このツールの中核となる決定は一度で定まったものではなく、運用データと利用環境の変化に追従して5回にわたって更新された。ADR5件とPRDのSLO更新の流れを時系列でまとめる。回顧的なトーンを生かす意味で、各節は何を決めたかよりも、なぜその決定を再び見直すことになったのかに焦点を置く。

### 6.1. マルチターン戦略の決定

最初に定める必要があったのは、N個の質問をモデルにどう束ねて送るかだった。同じ質問の束でも束ね方によってペルソナの一貫性、トークン使用量、処理時間、後処理の複雑さがすべて変わる。ADR-001には候補3つがトレードオフ表として比較されている。

候補Aはマルチターンインタビュー+インタビュー終了後の単発構造化要約である。質問を1ターンずつ送ってmessages履歴に蓄積し、別途のsystemプロンプトでmessages全体を入力してJSONの構造化要約を単発で生成する。候補Bは単発バンドルなので、質問N個を一度に束ねて送りモデルが一つの応答に回答をすべて返す。候補Cは候補Bと同様に一度で回答を受け取りつつ、定性インサイトだけ別の単発で生成する。

表では候補Aがトークン使用量と処理時間の面で約1.8〜2.5倍高くつくものの、ペルソナの一貫性、自動follow-upの統合、drift / refusalの隔離、デバッグの容易さの4軸ですべて最も優位に立つ。このツールの中核ガードレールが自動follow-upとペルソナ崩れ検出なので、回答単位の隔離が本質的に必要である。一つの回答が汚染されても残り4つを生かせるかが決定基準であり、候補B/Cは一つの応答に回答が混在していてこのガードレールと両立しない。

そこで候補Aを採用し、詳細ポリシー3つを併せて固定した。systemメッセージはmessages[0]にtruncateなしで保存し、累積トークンの閾値超過時に最古のuser/assistantペアから順に削除する。トークン推定は韓国語1文字=1、英文1文字=0.25、その他0.5のヒューリスティックで、標準ライブラリのみで一貫したトリガーを作る。単発モードは`--single-turn`フラグでのみdry-run / トークン節約用に開いておき、v1のデフォルトはマルチターンとした。

### 6.2. ローカルMLXからOpenAIバックエンドへ

v1初稿段階の推論バックエンドはローカルMLXだった。Apple Silicon+`mlx_lm.server`の組み合わせで外部API費用を0に置き、事業アイデアの情報がローカルだけを流れるようにして、セキュリティと費用の両面で優位を取るという設計だった。

GATE-1通過後の運用検証とメインセッションのdry-runを経て、限界が積み重なった。35B-A3B 4bitのMLXビルドはトークナイザのEOS認識が不安定で、特定の入力でトークンループ(`券后`のような漢字の繰り返し)が再現された。27B Dense 6bitはより深刻なトークンループで既に候補から外れていた状態だった。Qwen3のthinkingトグルは`enable_thinking=true`で呼ぶと英文reasoningがmax_tokensをすべて消費し、contentが空文字列になる分岐ができた。35B-A3B 4bitが8〜10GBを占有するので16GBマシンでは同時実行数4以上はOOMリスクとなり、同時実行数を1〜3に絞らざるを得なかった。最初のモデルダウンロード12〜20GBと、ユーザーが別ターミナルで`mlx_lm.server`を立ち上げる外部依存も参入摩擦を高めた。

ADR-002はこの限界の束を整理した上で、OpenAI Chat Completions APIへの切り替えを決定した。デフォルトモデルは`gpt-4o-mini`、base_urlは`https://api.openai.com/v1`、認証は標準の`OPENAI_API_KEY`とfallbackの`KPI_OPENAI_API_KEY`だった(このfallbackはv1.2.0で削除された)。HTTPクライアントはhttpxをそのまま維持し、`openai`公式SDKは導入しない。Qwen専用の`chat_template_kwargs`のようなOSS推論サーバ専用パラメータも併せて削除された。費用は0ではなくなった(100人インタビュー1回あたり約$0.50-$2.00)が、ペルソナの一貫性、EOS認識の安定性、応答遅延、OS制約の解消まで4軸ですべて改善した。

最も目立つ効果はSLOの更新だった。PRD §6.1 line 268は「100人インタビュー1回を5〜10分以内に完了する(質問5つ、同時実行数4を仮定)。gpt-4o-mini基準で1ターン応答が約1〜3秒と推定され(...)v1.0の30分SLOはローカルMLX時代の保守的推定値であり、v1.x OpenAIバックエンドでは5〜10分のSLOに更新する」に更新された。PRD §10成功指標line 389も「処理性能：100人インタビュー1回を5〜10分以内に完了する(質問5つ、同時実行数4基準。v1.0の30分SLOをOpenAIバックエンドに合わせて更新)」と同じ流れを反映する。

同時実行数のデフォルトも1〜3から4へと上がり、上限は1〜10の範囲に緩和された。1ターン応答の平均が4〜10秒から1〜3秒へと縮まり、同時実行数ガードの意味がメモリ保護からOpenAI rate limit保護へと変わった形である。ユーザー環境の多様性も同時に吸収された。macOS、Linux、Windowsのすべてで動作するので、Apple Silicon前提も消える。

### 6.3. multi-providerの抽象化

OpenAI単一バックエンド決定の直後に2つのユーザー要求が積み重なった。一つはAnthropicクレジットを保有するユーザーやClaudeの韓国語トーンを評価したいユーザーがClaudeをインタビューバックエンドとして直接使いたいという要求だった。もう一つはセキュリティドメインや社内LLMを使う環境で、ローカルLLM(mlx_lm.server, vLLM, llama.cpp)でオフラインで回したいという要求だった。

ADR-003はこの2つの要求を吸収するため、`LLMBackend` Protocolを導入し入口を`LlmConfig.provider`で分岐させた。`provider=openai`(デフォルト)は`OpenAIBackend`であり、OpenAI Chat Completions APIとOpenAI互換ローカルサーバの両方を扱う。base_urlを`http://localhost:PORT/v1`に変えればそのままローカルサーバに接続できる。`provider=anthropic`は`AnthropicBackend`であり、Anthropic Messages APIに直接httpxで呼び出す。anthropic SDK依存は追加していない。

base_urlマッチングだけで分岐するヒューリスティックは安定しないので却下された。AnthropicはOpenAI Chat Completionsと互換のないMessages APIスキーマを使う。top-levelの`system`フィールド、`x-api-key`ヘッダ、必須の`max_tokens`まで差が積み重なれば、base_urlパターンマッチで分岐するコードが頻繁に壊れる。別アダプタに分離しておくほうがよい。anthropic SDK導入も却下された。dependency.md §1のleftpad回避原則とトランジティブツリー最小化の観点から、httpx直接呼び出しでretry / timeout / loggingを単一モジュールに統一するほうが制御コストが低い。

このラウンドでtoken使用量の追跡も正規化された。OpenAIは`cached_tokens`、Anthropicは`cache_read_input_tokens`とフィールド名は異なるが、両方とも`TokenUsage.cached_tokens`にまとめてツール全体が同じインターフェースで集計する。Anthropic側はprompt cachingが自動ではなく`cache_control`マーカーが明示的に置かれる必要があり、OpenAIとは異なる。systemブロックに`cache_control: ephemeral`マーカーを差し込む構造で持っていった。

ADR-002のOpenAI単一バックエンド決定はADR-003でsupersedeされた。ただしADR-003自体も、ADR-003 §2(決定セクション)に置かれていたMCP入口に関する一つの決定が次のラウンドで部分的にsupersedeされる経緯を抱えていた。その部分が§6.4で扱うMCP mode導入の出発点である。

### 6.4. MCP modeの導入(server / sampling)

ADR-003でMCPサーバの入口はsampling専用として単純化していた。推論は常にホストエージェントの`sampling/createMessage`に委任し、server-sideにはOpenAI / Anthropicの鍵を置かないというポリシーだった。MCPが本質的にホストLLMを活用するためのプロトコルであるという観点から見れば、清潔な決定である。

ただし運用上の摩擦が二方向に積み重なった。一つ目は、2026年4月時点でsampling capabilityを標準で公開するMCPクライアントが極めて少なかった点である。cmuxビルドはsampling非対応、Claude Code Desktopの正式ビルドもsampling公開が未確定の状態、Cursorの一部ビルドだけ部分対応という状況だった。二つ目は、結果として一般ユーザーがmcp.jsonにこのツールを登録して自然言語で呼び出すとConfigErrorが必ず発生したことである。ツールが起動すらしないので実用価値が消えた。

ADR-004はこの運用摩擦を解消するために`mcp.mode`トグルを導入した。自動fallbackは置かない。ユーザーが明示トグルで動作経路を選ぶという原則が中核である。

`mcp.mode: "server"`(当時のデフォルト)はMCPツール呼び出しがserver-sideの`OpenAIBackend`または`AnthropicBackend`を使う。CLIと同じ`LlmConfig`フィールド(provider, base_url, model, api_key, timeout, retry, anthropic_cache_control, extra_chat_kwargs, streaming)をそのまま活用し、mcp.jsonの`env`に`OPENAI_API_KEY`または`ANTHROPIC_API_KEY`を差し込まなければならない。応答には`"backend": "mcp_server"`ラベルが付く。`mcp.mode: "sampling"`は明示opt-inでホストエージェントの`sampling/createMessage`に委任し、server-side鍵が不要である。ホストがsampling capabilityを公開しなければConfigErrorとCLI fallback案内で遮断される。応答ラベルは`"mcp_sampling"`である。

自動fallbackを却下した理由はsurprise動作とデバッグの難しさである。serverモードを試して鍵がなければsamplingに自動切り替えするフローは、応答がどの経路を通ったかをユーザーが追跡しにくくする。費用請求主体が不明確になる点が最大の問題である。serverの鍵で請求されたと思っていたのにホストsamplingに行っていた、あるいはその逆の事例が混ざれば、運用者が費用急増を即座に検知できない。結局、明示トグル+応答ラベル付与で整理された。

### 6.5. samplingの削除とorchestratorモードの導入

server / samplingの2モードトグルでonboarding摩擦は解消されたが、v1.1.1の運用データでsamplingモードは事実上使われていないという事実が明らかになった。ADR-004に置いていたsupersede閾値はsampling互換クライアントの普及率50%以上であり、2026-05現在の推定は10%未満で、近い時期に閾値に到達する兆しはない。

一方、ホストsub-agentツール(Claude CodeのTask tool、Cursorのsub-agentパターン)はmainstreamで安定的にサポートされており、ホストが直接sub-agentを起動して自分のLLMでインタビューを行えば、sampling依存なしに同じ価値(server-side鍵不要+ホストLLMの活用)を提供できるという迂回路が見えた。普及率の数値は公式統計ではなくADR-005 §1の自前推定であることを併記しておく。

ADR-005は2つの決定を一度にまとめた。一つ目は、`mcp.mode: "sampling"`をホワイトリストとコードの両方から削除した。`McpSamplingBackend`クラス、sampling capabilityチェック、`_convert_to_sampling_messages`、`_extract_sampling_text`ヘルパーも併せて整理された。二つ目は、`mcp.mode: "orchestrator"`を新規デフォルトとして導入した。server-sideではLLMを呼び出さず、ホストsub-agentが自分のLLMでインタビューを行い、このツールはデータ / プロンプトhelperのみ公開する。応答ラベルは`"mcp_orchestrator"`である。ADR-004のserver-default決定もこのラウンドで併せてsupersedeされた。鍵設定なしで即時動作する点が新規ユーザーの摩擦を最小にするという判断である。

この変更はBREAKINGなので、`mcp.mode: "sampling"`を使っていたユーザーはyamlを`"orchestrator"`または`"server"`にマイグレーションする必要がある。orchestratorモードはヒューリスティックの自動適用が抜けるので、ホストがhelperツール(`detect_persona_drift`、`should_auto_follow_up`、`parse_structured_summary`、`interview_record_schema`)を明示的に呼ばなければserverモードと同じ閾値でdrift / follow-upを判定できない。ヒューリスティックをホスト側で再実装する必要がないように同じ閾値とキーワードをhelperツールとして公開したのが、このラウンドの副次的決定である。自動fallbackはADR-004と同じ理由で置かない。ユーザーがmodeを明示トグルで選び、動作経路と費用主体を明確にする。

5回の決定を経て、ツールの推論経路は単一のローカルMLXからmulti-provider+2つの入口モードへと進化した。決定の流れ自体を回顧的に見れば一つのパターンに従う。最初に定めた清潔なポリシーが運用データで摩擦を起こすと、明示トグルで経路を分離し、自動fallbackの代わりに応答ラベルで追跡性を確保した上で、普及率や価値が0に収束したオプションをsupersede ADRで整理する流れである。このパターンは§7と§8の静的設計の説明で動作の結果としてもう一度確認できる。

## 7. 一つのコアでCLI / MCP server / MCP orchestratorを同時にサポート

### 7.1. 入口別の責務分離

入口は3つである。CLIである`main.py`は`click`サブコマンドを4つ公開し、終了コードと対応付ける。サブコマンドはhealthcheck, list-personas, interview, reportである。MCP serverである`src/mcp_handlers/server.py`はserverモード専用で、`interview`ツールが追加で公開される。このツールはserver-sideで直接OpenAI/Anthropicを呼び出す。MCP orchestratorである`src/mcp_handlers/orchestrator.py`はserver-sideのLLMを呼ばず、プロンプトhelperのみ公開する。`healthcheck`、`list_personas`、`report`、`should_auto_follow_up`、`detect_persona_drift`、`parse_structured_summary`、`interview_record_schema`などは2つのモードが共通して公開するツールである。

各入口は入出力とdispatchのみ担当し、ビジネスロジックは持たない。CLIはclickのオプションパースと終了コードのマッピングに、MCPの入口はMCPツールの引数検証と応答エンベロープ生成のみに集中する。実際のインタビューフローは共通モジュールに置く。

### 7.2. 共通モジュール - load_personas / build_system_prompt / run_batch / report

CLIとMCP serverは両方とも`from src.batch import run_batch`、`from src.llm_backend import build_cli_backend`、`from src.load_personas import load_and_sample`をimportする。`run_batch`は`from .interview import run_interview`で進入し、`run_interview`は`build_system_prompt`でシステムプロンプトを作ったあとマルチターン呼び出しを実行する。つまりCLIとMCP serverは同じ関数コールグラフを通る。

MCP orchestratorは`build_system_prompt`を直接呼び、ホストsub-agentに渡すプロンプトのみ作る。インタビュー自体はホストLLMが実行するので、`run_batch`/`run_interview`の経路は通らない。ただしペルソナ読み込み関数の`load_and_sample`とレポート生成関数の`report.generate_report`は同一モジュールをそのまま使う。ペルソナ決定とコホート集計のロジックが入口ごとに違う理由はないからである。

| 入口 | LLM呼び出し経路 | 共通コアの呼び出し |
| --- | --- | --- |
| CLI | server-sideの`LLMBackend` | `load_and_sample` -> `run_batch` -> `run_interview` -> `build_system_prompt` |
| MCP server | server-sideの`LLMBackend` | `load_and_sample` -> `run_batch` -> `run_interview` -> `build_system_prompt` |
| MCP orchestrator | ホストsub-agent | `load_and_sample` -> `build_system_prompt`の直接呼び出し -> ホストがインタビュー実行 -> `aggregate_results` -> `generate_report` |

### 7.3. mode分岐dispatchパターン

MCPの入口はmodeが2種類(`server`, `orchestrator`)あるので、同じ名前のツールでもmodeごとに動作が違わなければならない。`src/mcp_handlers/__init__.py:24`の`TOOLS_BY_MODE`がmode別の公開ツール名リストを持ち、`src/mcp_handlers/__init__.py:51`の`HANDLERS`が`(mode, tool_name)`タプルキーをcoroutineにdispatchする。`mcp_server.dispatch_tool`が両方のマッピングをそのまま活用してlist_tools応答が現modeに合わせて切り詰められるようにし、現modeで公開されていないツールを呼び出すとキーがないのでdispatch失敗が案内される。

この構造の長所はfallthroughがない点である。orchestratorモードで`interview`ツールを呼ぶと`("orchestrator", "interview")`キーがマッピングにないので即座に遮断される。自動的にserverモードに落ちることはない。ツール呼び出し結果がどのバックエンドを通ったかは応答ラベルである`backend: "mcp_server"`または`"mcp_orchestrator"`で明示されるので、デバッグコストが低い。別のmodeへの自動fallbackも検討したが、コスト請求主体とデータフローが不明確になるという理由で却下した。

## 8. MCP orchestratorモードの現在の動作構造

### 8.1. samplingとsub-agent fan-outの位置整理

この節は§6.5でまとめた意思決定の流れの結果として、現在ツールがどのような構造で動作しているかを静的設計の観点から整理する。変更の経緯は§6.5に置き、ここでは動作の形と道具の分担だけを扱う。

MCPにはサーバがホストLLMに推論を委任するsampling機能が定義されている。サーバは`sampling/createMessage`でリクエストを送り、ホストが自分のLLMで生成して返す。公式ドキュメントの表現そのままに「no server API keys necessary」が中心的な価値である。本ツールはsamplingモードをv1.2.0で削除し、同じ価値をホストsub-agent fan-outで提供する。Claude CodeのTask tool、Cursorのsub-agentのようなパターンはmainstreamで安定的にサポートされているので、ホストが直接sub-agentを起動して自分のLLMでインタビューを行う流れがツール呼び出しの正常経路となる。

### 8.2. orchestratorモードの道具分担

現在のorchestratorモードは3つの道具でホストsub-agent流れの責務を分担する。

- `build_persona_prompt`は単一ペルソナのシステムプロンプトとペルソナdictを返す。ホストは受け取った`system_prompt`をsub-agentのsystemメッセージにそのまま入れてインタビューを行う
- `build_batch_prompts`はN人分のシステムプロンプトとペルソナdictを一度に返す。ホストはこの応答を受けてsub-agent fan-outでN件のインタビューを並列実行する
- `aggregate_results`はホストが集めたrecordを受け取って定量集計とmarkdownレポートを生成する

このツールはプロンプトのビルドと集計だけ責任を持ち、推論はホストが担う。helperツールである`detect_persona_drift`、`should_auto_follow_up`、`parse_structured_summary`、`interview_record_schema`も同じmodeに公開されており、ホストが明示的に呼べばserverモードと同じ閾値・キーワードを適用できる。ヒューリスティックをホスト側で再実装する必要がない。

### 8.3. 費用分担構造の違い

serverモードとorchestratorモードは費用請求主体が違う。serverモードはmcp.jsonの`env`に`OPENAI_API_KEY`または`ANTHROPIC_API_KEY`を差し込まなければならず、インタビュー費用もその鍵の所有者に請求される。応答ラベルは`"mcp_server"`である。orchestratorモードはserver-side鍵なしで動作し、インタビュー費用はホストのLLMサブスクリプション(Claude Codeサブスクリプション、Cursor pro等)の中で処理される。応答ラベルは`"mcp_orchestrator"`である。

ツール呼び出しの応答ラベルがmodeごとに明示されるので、費用請求主体とデータフローが一目で追跡できる。自動fallbackがない点もこの追跡性を支える。応答ラベルがそのまま「この呼び出しがどの鍵を通ったか」を示すので、運用者が費用急増のシグナルを即座に検知できる。

## 9. 結果の解釈 - 定量レポートと定性レポート

### 9.1. quantスコアとwillingness_to_payシグナル

定量レポートはペルソナごとの`StructuredSummary`を集めて算出される。中核フィールドは5つである。`intent`はpositive/neutral/negativeのいずれか、`acceptable_price_signal`はcheap/fair/expensive/nullのいずれか、`willingness_to_pay`は整数またはnull、`rejection_reasons`は拒否理由のリスト、`one_line`は80文字以内の一行要約である。

スキーマv2(`SCHEMA_VERSION = 2`、`src/models.py`)で価格意向を2フィールドに分離したことが最大の変化である。v1では`willingness_to_pay`一つのフィールドで定性シグナルと明示の数字を両方受けていた。応答本文に「월 5만원 정도면 쓸 만하다」(月5万ウォンくらいなら使えそう)のような明示の数字がなければ、定量分布に空値が多くなり分析が難しかった。v2からは`acceptable_price_signal`が定性シグナルである「비싸다」(高い)、「적당하다」(適当)、「저렴하다」(安い)系の表現を分類してすべてのrecordに可能な限り埋め、`willingness_to_pay`には明示の整数のみが入る。両分布を併せて見れば、価格受容度と絶対金額意向を切り分けて解釈できる。

v1のJSONは`acceptable_price_signal`をNoneで埋めて互換ロードされるので、過去の結果ファイルもそのまま再読み込みできる。

### 9.2. 定性インサイトの単発要約

定性インサイトはインタビュー終了後に別の単発呼び出しで生成する。同じモデルにmessages全体を入力し、JSONスキーマを強制してカテゴリ別インサイトを抽出する。マルチターンインタビューとは別の呼び出しなので、インタビュー本文のトーンと要約のトーンが混ざらない。

orchestratorモードはこの段階自体がserver-sideにない。fallbackではなく、ホストが自分のLLMで定性要約を作って`aggregate_results`の`insights`引数に渡すフローが正常経路である。同じhelperツールでヒューリスティックを先に適用してから、その結果まで束ねてホストが単発要約を生成する。本物のfallbackはホストがインサイトを渡さない場合で、このときはレポートの定性セクションが案内文で埋まり、ホスト側で定性分析を追加するよう知らせる。

### 9.3. drift比率と信頼度フラグ

JSONの各`raw_responses[i]`にはturn別の応答、遅延、retry、トークン使用量が分離されており、record単位で`flags.persona_drift`、`flags.refusal_detected`、`flags.truncated`、`flags.parse_failed`、`flags.auto_follow_up_used`が立つ。レポートではdrift比率、refusal比率、truncated比率を併せて見せ、データ信頼度を判断する根拠を提供する。

drift比率が5%を超えればペルソナ補強(各turnでsystemを再注入)導入を検討するトリガーである(ADR-001 §3.3)。実使用では居住形態の精密な正規表現とself-introウィンドウ30文字のガードを導入してから、5%閾値の内で安定した。truncated比率が0でなければ、質問数を減らすか`llm.context_budget`を増やす合図と見る。

## 10. 限界と次の課題

合成ペルソナはあくまで合成である。本ツールが返す定量スコアと定性要約は仮説を絞る一次フィルタとして使うべきものであり、実ユーザーインタビューを置き換える資料ではない。回答は結局LLMがペルソナカラムを1人称で書き起こした結果なので、ペルソナが持つ本物の文脈(家族関係、職場の同僚、直近1ヶ月の出来事)が抜け落ちている。実インタビューの募集コストを下げる補助ツールとして位置づけを明確にしておくのが安全である。

次の課題は二方向に分かれる。一つはコホート拡張である。現在のデータセットは韓国の単一countryなので、他市場の検証にはそのまま使えない。同じNVIDIAシリーズの他言語データセットを同じ抽象化に差し込む作業が控えている。もう一つは産業別プロンプトテンプレートである。`prompts/system_prompt.txt`が一つだけなので、すべての事業アイデアに同じ1人称ガードレールが適用されるが、B2B SaaSとD2Cフードはインタビューのトーン自体が異なるので、テンプレートを分離する余地がある。

# 参考

- <https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching>
- <https://github.com/binaryloader/korea-persona-interview>
- <https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea>
- <https://modelcontextprotocol.io/docs/concepts/sampling>
- <https://platform.openai.com/docs/guides/prompt-caching>
