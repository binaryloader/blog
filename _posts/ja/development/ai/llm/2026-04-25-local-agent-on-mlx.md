---
title: "[LLM] Apple SiliconでMLXを使ってローカルLLM環境を構築する"
ref: local-agent-on-mlx
excerpt: "Apple Silicon MacBook Pro M5 Pro環境でMLXとQwen 3.6モデルを使ってローカルLLM環境を構築し、エージェントフレームワーク学習のための事前準備を整理する。"
date: 2026-04-25T15:00+09:00
last_modified_at: 2026-04-25T15:00+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/local-agent-on-mlx.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/local-agent-on-mlx.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - MLX
  - Qwen
  - Apple-Silicon
  - Agent
  - LLM
  - Tool-Calling
  - Quantization
depth:
  - title: "Development"
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "LLM"
    url: /ja/development/ai/llm/
---

# 概要

Apple Silicon MacBook Pro M5 Pro環境でMLXとQwen 3.6モデルを使ってローカルLLM環境を構築し、エージェントフレームワーク学習のための事前準備を整理する。

# 手順

## 1. 学習目的と環境

学習目的は以下のとおりである。

- エージェントフレームワークの自作(ReAct、Reflection、Plan-and-Execute)
- ツール呼び出し(Tool calling)のrawフォーマット理解とパーサー作成
- DenseとMoEモデルの挙動差の比較学習
- Qwenの`<think>`ブロックを活用したreasoningパターン観察

環境の概要は以下のとおりである。

- MacBook Pro M5 Pro
- ユニファイドメモリ48GB
- macOS 26.4.1
- mlx-lm v0.31.3(uv toolで隔離インストール)

主要な決定事項は以下のとおりである。

- メインモデルは`unsloth/Qwen3.6-27B-UD-MLX-6bit`(Dense、約22GB)である
- サブモデルは`unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit`(MoE、約19GB)である
- サーバーはビルトインの`mlx_lm.server`から始め、学習が進んでから`mlx-openai-server`で検証する
- 量子化は6bitを基本とする。8bitはメモリマージン不足、4bitはノイズリスクがある

## 2. ハードウェアとユニファイドメモリの分析

ローカルLLMモデル選択の第一の制約はユニファイドメモリである。利用可能なメモリを正確に見積もり、モデル重み＋KVキャッシュがその中に収まるかを検証する必要がある。

### 2.1. システム仕様

- Model Identifier：Mac17,8(MacBook Pro)
- Chip：Apple M5 Pro
- CPU：18コア(efficiency 6＋performance 12)
- GPU：20コア
- ユニファイドメモリ：48GB
- ディスク空き容量：約790GB
- macOS：26.4.1

### 2.2. ユニファイドメモリの意味

Apple SiliconはCPUとGPUが同じRAMを共有する。NVIDIA環境のようにシステムRAMとVRAMを別々に管理する必要がない。MLXはこの構造をそのまま活用し、量子化された重みをディスクからメモリにそのままロードする。したがってディスクのダウンロードサイズとメモリ上の重みサイズは同一である。

### 2.3. メモリ予算(48GBの配分)

- macOS＋システムバックグラウンド：約10〜12GB
- IDE(Cursor / VSCode)、ブラウザ、Claude Codeなどの作業環境：約8〜10GB
- モデル重み＋KVキャッシュ用に確保できる枠：約26〜30GB

### 2.4. KVキャッシュの推定値

| コンテキスト | 27B Dense | 35B-A3B(MoE) |
|--------------|-----------|--------------|
| 8K | ＋2〜3GB | ＋1〜2GB |
| 16K | ＋4〜6GB | ＋3〜4GB |
| 32K | ＋8〜10GB | ＋5〜6GB |
| 64K | ＋15〜18GB | ＋10〜12GB |

### 2.5. 結論

モデル重みは20〜22GB以下に抑える必要がある。そうすればマルチターンエージェント(8K〜32Kコンテキスト)でもKVキャッシュまで安定して収まる。28GBを超える8bit量子化はswap発生のリスクがあり、学習段階では推奨しない。

## 3. MLXのインストール(mlx-lm＋uv tool)

MLX環境をシステムPythonから分離して隔離インストールし、CLIをグローバルから呼び出せるようにする。

### 3.1. MLXとmlx-lmの違い

PyTorchとHugging Face transformersの関係と同じである。

MLXは以下の特徴を持つ。

- Appleが直接開発した低レベルMLフレームワーク(2023年12月公開)である
- テンソル演算、自動微分、Metal GPUアクセラレーションを提供する
- PyTorch / JAXと同じレイヤーのツールである
- モデルを学習させたり新しいアーキテクチャを実装する際に使用する

mlx-lmは以下の特徴を持つ。

- MLXの上に載せたLLM専用ライブラリである
- モデルダウンロード、量子化、推論、サービングのツールを含む
- transformers / vLLMと同じレイヤーのツールである
- すでに学習済みのLLMを動かす際に使用する

`uv tool install mlx-lm`を実行すると、依存関係としてmlxも自動でインストールされる。

### 3.2. インストール

`uv tool install`はpipxと同じ概念で、隔離されたvenvにCLIツールをインストールし、エントリポイントだけをPATHに公開する。

```bash
uv tool install mlx-lm --python 3.12
```

インストール先は以下のとおりである。

- 隔離venv：`~/.local/share/uv/tools/mlx-lm/`
- CLIシンボリックリンク：`~/.local/bin/mlx_lm.*`

### 3.3. Pythonバージョンの扱い

- システムPython(3.9.6)はMLXをサポートしない
- `--python 3.12`を指定するとuvがcpython 3.12.13を自動ダウンロードする
- 指定しない場合は利用可能な最新の互換バージョンが自動選択される

### 3.4. インストール検証

```bash
mlx_lm.server --help
uv tool list
```

Metal GPUの認識確認は以下のコマンドで行う。

```bash
uv tool run --from mlx-lm python -c \
  "import mlx.core as mx; print('Metal:', mx.metal.is_available()); print('Device:', mx.default_device())"
```

`Metal: True`と`Device: Device(gpu, 0)`が出力されるはずである。

### 3.5. 利用可能なCLI(mlx-lm v0.31.3、17個)

- `mlx_lm.generate`：単発テキスト生成
- `mlx_lm.server`：OpenAI互換HTTPサーバー
- `mlx_lm.chat`：対話型REPL
- `mlx_lm.convert`：モデル量子化変換
- `mlx_lm.lora`：LoRAファインチューニング
- `mlx_lm.evaluate`：ベンチマーク評価
- その他：awq、dwq、gptq、fuse、manage、perplexity、share、upload、cache_prompt、benchmark、dynamic_quant

### 3.6. uv tool方式の利点

- 他のMLツール(vllm、llama-cpp-pythonなど)とのtransformersバージョン衝突を回避できる
- 削除時に依存関係まできれいに整理される(`uv tool uninstall mlx-lm`)
- mlx-lmのバージョンアップが他のツールに影響しない

## 4. Qwen 3.6モデルの選定(Dense vs MoE)

学習とエージェントフレームワーク実装の目的に合わせ、DenseとMoEの2種類を併用する。

### 4.1. Qwen 3.6ラインナップ(2026年4月時点)

- Qwen3.6-Max-Preview(2026-04-20)：クローズドAPI、6つのコーディングベンチで1位、260Kコンテキスト
- Qwen3.6-27B(2026-04-22)：オープンウェイトDense、Apache 2.0、262Kネイティブ／1M拡張
- Qwen3.6-35B-A3B：オープンウェイトMoE(アクティブ3B)、262Kネイティブ／1M拡張

### 4.2. メインモデル：unsloth/Qwen3.6-27B-UD-MLX-6bit

- タイプ：Dense 27B
- 量子化：Unsloth Dynamic 6bit
- ディスク／メモリ重み：約22GB
- 用途：本格的な動作検証、ReActの判断トレース、品質比較の基準点

### 4.3. サブモデル：unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit

- タイプ：MoE(合計35B、アクティブ3B)
- 量子化：Unsloth Dynamic 4bit
- ディスク／メモリ重み：約19GB
- 用途：高速反復デバッグ、プロンプトチューニング、大量テスト

### 4.4. Dense vs MoE比較

| 項目 | 27B Dense 6bit | 35B-A3B 4bit |
|------|----------------|---------------|
| アクティブパラメータ | 27B全体 | 3Bのみ |
| トークン生成速度 | 15〜25 tok/s | 50〜80 tok/s |
| 挙動の一貫性 | 高い(決定的) | ルーティングの非決定性あり |
| デバッグの容易さ | 優秀 | 追跡困難 |
| コーディングベンチ | より強い | やや低い |

Denseをメインに選んだ理由は次のとおりである。MoEはexpert routingにより同じ入力でも微妙に異なる応答が出る。エージェントデバッグで「なぜこの判断をしたのか」を追跡する際に、ルーティングの非決定性がノイズとして作用する。

MoEをサブとして残す理由は、同じエージェントコードを2つのモデルで交互に動かすことで、Dense vs MoEの挙動差が最大の学習ポイントになるからである。

### 4.5. Qwen 3.6の学習価値

- Thinking Preservation：マルチターン対話で`<think>`ブロックのreasoning traceを保持する
- Tool callingの安定性：Hermes-style tool useで学習されており、OpenAI互換の関数呼び出しが安定している
- Agenticコーディング強化：SWE-bench Verifiedで73.4%を記録する

### 4.6. 2モデル同時運用

48GBユニファイドメモリで2つのモデル(22GB＋19GB＝41GB)を同時にロードすることは不可能である。ディスクには両方を置いておき、サーバーを再起動してメモリスワップする方式で比較する。

## 5. 量子化比較

量子化ビット数と量子化方式の2軸でトレードオフを分析する。

### 5.1. ビット数別メモリ(Qwen 3.6 27B基準)

| 量子化 | 重みメモリ | KV込み(8K) | KV込み(32K) | 48GB適合度 |
| ---- | ------- | --------- | ---------- | ----------- |
| 4bit | 15GB | 18〜22GB | 23〜27GB | 余裕あり |
| 6bit | 22GB | 24〜25GB | 30〜32GB | ベスト |
| 8bit | 28GB | 32〜38GB | 40GB＋ | ギリギリ、swapリスク |

### 5.2. ビット数選択ガイド

- 8bitはフル精度と事実上同等の品質だが、macOS swapが始まるリスクがあり学習サイクルに致命的である
- 4bitは量子化ノイズが計測可能なレベルである。メインで使うと応答品質の低下をモデルの限界と誤解する恐れがある
- 6bitが最適点である。メモリ22GBで、Unsloth UD 6bitは8bitと事実上意味のない品質差にとどまる

### 5.3. 均一量子化 vs Dynamic量子化

mlx-community(均一量子化)は以下の特性を持つ。

- すべてのレイヤーを同じビット幅に変換する
- mlx-lm内蔵ツール(`mlx_lm.convert`)で生成する
- 最も標準的で検証された方式である

unsloth UD(Dynamic量子化)は以下の特性を持つ。

- レイヤー重要度に応じて異なるビット幅を適用する
- アテンションやembeddingなど中核レイヤーは高ビット(8bit)で維持する
- 重要度の低いレイヤーは低ビット(4〜5bit)で適用する
- 平均ビット数は同じだが品質損失はより小さい

Dynamic量子化の利点が大きい組み合わせは以下のとおりである。

- Denseモデル＋低ビット(4〜6bit)で大きな利点がある
- MoEモデル＋低ビットでは部分的な利点がある(そもそも一部のexpertしか活性化されない)
- 8bit以上では差は微小である

### 5.4. 2つの提供元の比較(Qwen3.6-27B 6bit)

| ビルド | 量子化方式 | 品質 | メモリ |
|--------|------------|------|--------|
| `mlx-community/Qwen3.6-27B-6bit` | 均一6bit | 標準 | 22GB |
| `unsloth/Qwen3.6-27B-UD-MLX-6bit` | Dynamic 6bit | より良い | 22GB |

### 5.5. 結論

学習とエージェントフレームワーク実装の目的において、最もバランスの取れた選択はunsloth UD-MLX-6bitである。

- メモリマージンを確保する(22GBでKVキャッシュに余裕がある)
- 8bitレベルの品質を維持する(Dynamic量子化)
- モデル本来のcapabilityを学習材料として活用できる

## 6. 推論サーバーの選択肢

OpenAI互換HTTPサーバーでモデルを起動し、自作エージェントフレームワークをクライアントとして接続する。

### 6.1. ビルトインサーバー(mlx-lm v0.31.3に同梱)

実行方法は以下のとおりである。

```bash
mlx_lm.server \
  --model unsloth/Qwen3.6-27B-UD-MLX-6bit \
  --port 8080
```

サポートエンドポイントは以下のとおりである。

- `POST /v1/chat/completions`(ストリーミング含む)
- `POST /v1/completions`
- `GET /v1/models`

サポート機能は以下のとおりである。

- OpenAI Chat Completions API互換
- Streaming(SSE)
- Function calling／tool use
- Chat templateの自動適用(Qwen Hermes-style認識)

呼び出し例は以下のとおりである。

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="unsloth/Qwen3.6-27B-UD-MLX-6bit",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### 6.2. サードパーティサーバー：mlx-openai-server(cubist38、FastAPIベース)

ビルトイン比で追加される機能は以下のとおりである。

- マルチモデル同時サービング(YAML config)
- モデル別の標準化されたtool callパーサー(qwen3、qwen3_5、qwen3_coder、gemma4など)
- Reasoningパーサーの分離(Qwenの`<think>`ブロックを`reasoning_content`フィールドに自動分離)
- ビジョン＋テキストのマルチモーダル対応

インストールは以下のとおりである。

```bash
uv tool install mlx-openai-server
```

### 6.3. 学習段階別の選択

- 初期はビルトインサーバーを使用する。tool callのraw出力が学習材料になる
- 中期はビルトインサーバーのraw tool callを使って自作パーサーを書く。ReAct、Reflectionパターンの実装を学習する
- 後期はmlx-openai-serverを使い、自作パーサーが標準と一致するかを検証する

### 6.4. その他の選択肢

| ツール | 特徴 | 学習用適合度 |
|--------|------|---------------|
| `mlx_lm.server`(ビルトイン) | OpenAI互換、単一モデル、標準 | 出発点 |
| mlx-openai-server | マルチモデル、標準化パーサー、reasoning分離 | 検証用 |
| LM Studio | GUIアプリ、モデルマネージャ | GUI志向の場合 |
| FastMLX | 軽量FastAPIラッパー | シンプルさ重視 |
| vllm-mlx | 連続バッチング、400＋ tok/s、MCPサポート | プロダクション |

### 6.5. 結論ルート

- ステップ1：ビルトイン`mlx_lm.server`から始める
- ステップ2：curl／OpenAI SDKで単一tool callを検証する
- ステップ3：Hermes raw出力を分析し、自作tool callパーサーを書く
- ステップ4：ReActなどのエージェントパターンを実装する
- ステップ5：mlx-openai-serverで自作パーサーを検証する

## 7. 実行ガイド(インストール検証からトラブルシューティングまで)

mlx-lmのインストールから2モデルのAPI呼び出しまで、ステップごとのコマンドを整理する。

### 7.1. 環境検証

```bash
mlx_lm.server --help
uv tool run --from mlx-lm python -c "import mlx.core as mx; print(mx.metal.is_available(), mx.default_device())"
uv tool list
```

### 7.2. メインモデルのダウンロード(Qwen 3.6 27B Dense 6bit、約22GB)

```bash
mlx_lm.generate --model unsloth/Qwen3.6-27B-UD-MLX-6bit --prompt "こんにちは、あなたは誰ですか？" --max-tokens 100
```

進捗モニタリングは以下のコマンドで行う。

```bash
du -sh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-27B-UD-MLX-6bit
```

完了確認は以下のコマンドで行う。

```bash
ls -lh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-27B-UD-MLX-6bit/snapshots/*/
```

### 7.3. サブモデルのダウンロード(Qwen 3.6 35B-A3B MoE 4bit、約19GB)

```bash
mlx_lm.generate --model unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit --prompt "こんにちは、あなたは誰ですか？" --max-tokens 100
du -sh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-35B-A3B-UD-MLX-4bit
```

### 7.4. サーバー実行(同時に1つのみ)

```bash
# メインモデル
mlx_lm.server --model unsloth/Qwen3.6-27B-UD-MLX-6bit --port 8080

# サブモデル(メイン終了後)
mlx_lm.server --model unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit --port 8080
```

`Starting server on 127.0.0.1:8080`が出力されれば成功である。モデルのスワップはCtrl+Cでメモリを解放してから別モデルで同じコマンドを実行する。

### 7.5. API呼び出しテスト(curl)

サーバーが実行中の状態で別ターミナルから呼び出す。以下の例はメインモデル基準であり、サブモデルに切り替えた場合は`model`値を`unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit`に変更する。パスは完全一致比較なので末尾のスラッシュやクエリストリングが付くと404になる。

基本のchat completionは以下のとおりである。

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [{"role": "user", "content": "Hello"}],
  "max_tokens": 50
}'
```

モデル一覧は以下のとおりである。

```bash
curl http://localhost:8080/v1/models
```

ストリーミングは以下のとおりである。

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [{"role": "user", "content": "1から10まで数えて"}],
  "stream": true,
  "max_tokens": 100
}'
```

### 7.6. Tool Callingテスト

単一tool callは以下のとおりである。

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [{"role": "user", "content": "ソウルの天気を教えて"}],
  "tools": [{
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "Get weather for a city",
      "parameters": {
        "type": "object",
        "properties": {
          "city": {"type": "string", "description": "City name"}
        },
        "required": ["city"]
      }
    }
  }],
  "max_tokens": 200
}'
```

レスポンスに`tool_calls`フィールドが含まれているはずである。

マルチターンtool call(結果を返した後の最終応答)は以下のとおりである。

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [
    {"role": "user", "content": "ソウルの天気を教えて"},
    {"role": "assistant", "content": null, "tool_calls": [{
      "id": "call_001",
      "type": "function",
      "function": {"name": "get_weather", "arguments": "{\"city\": \"Seoul\"}"}
    }]},
    {"role": "tool", "tool_call_id": "call_001", "content": "{\"temp\": 18, \"condition\": \"晴れ\"}"}
  ],
  "max_tokens": 200
}'
```

### 7.7. OpenAI SDK呼び出し(Python)

```bash
uv tool run --from openai python -c "
from openai import OpenAI
client = OpenAI(base_url='http://localhost:8080/v1', api_key='not-needed')
response = client.chat.completions.create(
    model='unsloth/Qwen3.6-27B-UD-MLX-6bit',
    messages=[{'role': 'user', 'content': 'こんにちは'}],
    max_tokens=50
)
print(response.choices[0].message.content)
"
```

### 7.8. ディスク使用量／モデルの削除

2つのモデルをダウンロードした後の合計使用量は約41GBである。

```bash
du -sh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-*
rm -rf ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-27B-UD-MLX-6bit
rm -rf ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-35B-A3B-UD-MLX-4bit
```

### 7.9. トラブルシューティング

`command not found: mlx_lm.server`エラーは、PATHに`~/.local/bin`が登録されていない場合に発生する。

```bash
uv tool update-shell
source ~/.zshrc
```

ダウンロード中断後の再開は、`mlx_lm.generate`または`mlx_lm.server`を再実行すれば自動で続きから再開される(huggingface_hubのresume)。

メモリ不足(OOM)時は他のアプリを終了するか、コンテキストを短くする。8Kコンテキストから始めることを推奨する。

サーバーポート競合は以下のコマンドで対処する。

```bash
lsof -i :8080
kill -9 <PID>
```

POSTリクエストに404が返ったらまずパスを確認する。mlx_lm.serverはパスを完全一致で比較するため、末尾のスラッシュ(`/v1/chat/completions/`)、クエリストリング(`?...`)、タイポがあると404になる。サポートされているパスは`/v1/chat/completions`、`/chat/completions`、`/v1/completions`(text completion)のみである。

POSTリクエストに411が返ったら`Content-Length`ヘッダーが欠落している。curlは自動で付与するが、生のソケットを扱う場合は明示する。

## 8. 総合ベンチマーク(Qwen3.6 27B 6bit)

`mlx_lm.server`に`unsloth/Qwen3.6-27B-UD-MLX-6bit`モデルを乗せた状態で、6つのシナリオ(長さストレス、マルチターン、ツールコール、ディープリーズニング、一般能力、GPUスループット)によりメモリ限界と性能を測定する。測定マシンはApple Silicon、統合メモリ48GBである。

### 8.1. 環境

測定環境は以下のとおりである。

- モデル：`unsloth/Qwen3.6-27B-UD-MLX-6bit`(Dense 27B、6bit量子化)
- 重みのディスクサイズ：約22GB
- サーバー：`mlx_lm.server` v0.31.3、port 8080
- システム：Apple Silicon、統合メモリ48GB、macOS Darwin 25.4

測定ツールは以下のとおりである。

- プロセスRSS：`ps -o rss=`
- システムメモリ：`vm_stat`(Pages free / inactive / wired / Swapouts)
- HTTP呼び出し：標準ライブラリ`urllib.request`
- 測定スクリプト：`/tmp/mlx_stress.py`、`/tmp/mlx_extra.py`、`/tmp/mlx_gpu.py`

### 8.2. RSSとwiredメモリの違い

測定開始時にRSSが2.8GBと表示されて疑問に思ったが、原因はmacOSのmmap＋メモリ圧縮の動作である。

- `mlx_lm`は重みを`mmap`でロードする。ページが実際にアクセスされて初めて物理メモリに乗る。
- macOSはアイドルページを圧縮して保持する。RSSは圧縮されたメモリを反映しない場合がある。
- 実際のGPU占有は`Pages wired down`(wired)の方が正確である。MLXはMetalテンソルをwiredページとして確保する。
- 測定結果：アイドル時wired 3.23GB → モデル活性時wired 32.71GBに増加し、約29.5GB追加される。この値が実際のGPUメモリ占有量である。

以上の理由から、本測定ではwiredメモリを主なメモリ指標として使用する。

### 8.3. 長さストレス(promptトークン漸増)

単一呼び出しでpromptと`max_tokens`を段階的に増やして長さ限界を測定する。

| target prompt | actual prompt | output | elapsed | RSS peak | swap Δ | min free+inactive | finish |
|---------------|---------------|--------|---------|----------|--------|-------------------|--------|
| 128 | 222 | 128 | 15.7s | 2.80GB | 0.0GB | 7.87GB | length |
| 512 | 796 | 422 | 50.8s | 2.84GB | 0.0GB | 7.51GB | stop |
| 2048 | 3089 | 420 | 55.9s | 2.84GB | 0.0GB | 7.58GB | stop |
| 4096 | 6147 | 597 | 83.2s | 2.86GB | 0.0GB | 5.65GB | stop |
| 8192 | 12264 | 339 | 69.5s | 2.86GB | 0.0GB | 4.96GB | stop |
| 16384 | 24492 | 376 | 200.6s | 1.94GB | 2.34GB | 3.11GB | stop |
| 24576 | - | - | - | - | thrashing | <1GB | (中断) |

主な観察点は以下のとおりである。

- 12K promptまでは1呼び出しあたり50〜90秒で安定している(アイドル後の初回呼び出しは重みのpaging-inにより時間がかかる)。
- 実際のpromptが24K(target 16384)に達すると、elapsedが200秒に急増しswap 2.3GBが発生する。処理限界のシグナルである。
- target 24576の時点でシステムfreeが0.5GB、wiredが25GB、swapが5秒ごとに1.5〜2GB積み上がりthrashingが発生する。事実上処理不可能である。

### 8.4. マルチターン(5ターン累積会話)

TCAパターンを題材にした5ターンの会話で測定する。各ターンは累積されたコンテキストで呼び出す。

| turn | prompt | completion | total | elapsed | RSS peak | swap Δ |
|------|--------|------------|-------|---------|----------|--------|
| 1 | 28 | 400 | 428 | 46.1s | 18.00GB | 0.00GB |
| 2 | 191 | 400 | 591 | 44.5s | 18.02GB | 0.03GB |
| 3 | 615 | 400 | 1015 | 45.5s | 18.02GB | 0.00GB |
| 4 | 1036 | 400 | 1436 | 46.2s | 18.02GB | 0.00GB |
| 5 | 1457 | 400 | 1857 | 45.4s | 18.02GB | 0.00GB |

主な観察点は以下のとおりである。

- 5ターン累積1857トークンの時点でRSSが18GBと非常に安定している。
- ターン間のelapsedがほぼ同一である(44〜46s)。コンテキスト1500トークン水準ではprefillの負荷が軽微である。
- 5ターン累積のswapは0.03GBで事実上ゼロである。

### 8.5. ツールコール(function calling)

`get_weather`関数を登録し、ソウルと東京の天気比較をリクエストする。ツール呼び出し → 結果返却 → 最終応答までの全サイクルを測定する。

| step | stage | elapsed | RSS peak |
|------|-------|---------|----------|
| 1 | tool_call_request | 37.0s | 18.02GB |
| 2 | final_answer | 17.9s | 18.02GB |

主な観察点は以下のとおりである。

- ステップ1でモデルが2都市を並列`tool_call`として一度に呼び出す(parallel function callingをサポート)。単一レスポンスに2つの`tool_calls`がまとめて返ってくる。
- ステップ2でtool結果を2つmessagesに追加して呼び出すと、自然な比較応答が生成される。
- 応答：「ソウル18度晴れ、東京22度晴れ、東京の方が4度暖かい」
- `mlx_lm.server` v0.31.3においてQwen3.6のツールコールは正常に動作する。

### 8.6. ディープリーズニング(thinking mode)

座席推論パズル(「母親の向かいに座っている人は誰か?」)で測定する。`chat_template_kwargs`によりthinkingモードを制御する。

| mode | elapsed | RSS peak | reasoningフィールド |
|------|---------|----------|---------------------|
| default | 113.5s | 18.10GB | あり |
| `enable_thinking=True` | 112.5s | 18.10GB | あり |
| `enable_thinking=False` | 26.3s | 18.09GB | なし |

主な観察点は以下のとおりである。

- Qwen3.6はデフォルトがすでにthinking on状態である(reasoningフィールドが自動で埋まる)。
- thinking_offに切り替えると4.3倍速くなる。単純な応答や即答が必要な場合に推奨する。
- thinking_onの応答はreasoningフィールドに思考過程が入り、contentフィールドに最終答えが分離して返ってくる。
- メモリ使用量はモードに依存しない。

### 8.7. 一般能力(コード／数学／韓国語／翻訳)

4つの短いケースでモデルの一般能力を素早く確認する。

| case | elapsed | RSS peak | 備考 |
|------|---------|----------|------|
| code(Python deep merge) | 67.1s | 18.10GB | thinking process含む応答 |
| math(1から100までの7の倍数の和) | 67.4s | 18.10GB | 正常な解法 |
| korean_reasoning(非文法的文の修正) | 68.4s | 18.10GB | 自然な修正 |
| translation(韓→英/日) | 67.1s | 18.10GB | 自然な翻訳 |

主な観察点は以下のとおりである。

- 4ケースすべてのelapsedが67〜68秒で一定である。max_tokens 600基準の約9 tok/sデコード速度と一致する。
- 応答品質は基本合格ラインを満たしている。別途定量評価は行っていない。
- 韓国語推論と翻訳において明らかな誤りは見られない。

### 8.8. GPU／スループット

prefillとdecodeの速度を分離して測定する。

| label | prompt | completion | elapsed | total tok/s | decode tok/s | wired before | wired after |
|-------|--------|------------|---------|-------------|--------------|--------------|-------------|
| baseline | 13 | 50 | 6.4s | 9.9 | 7.9 | 3.23GB | 32.71GB |
| medium | 24 | 400 | 44.5s | 9.5 | 9.0 | 32.71GB | 32.44GB |
| long_decode | 25 | 1500 | 163.7s | 9.3 | 9.2 | 32.44GB | 32.72GB |
| long_prompt | 1222 | 800 | 90.4s | 22.4 | 8.8 | 32.72GB | 32.79GB |

主な観察点は以下のとおりである。

- デコードスループットが一貫して8〜9 tok/sで出ている(Mシリーズ27B 6bit期待値)。
- baselineの初回呼び出しでwiredが3.23GB → 32.71GBにジャンプする。モデル重み＋Metalバッファがwiredに確保される。
- 以降の呼び出しはwired 32.4〜32.8GBで安定する。コンテキスト長に応じてKVキャッシュが0.2〜0.3GB変動する。
- long_promptのtotal 22.4 tok/sはprefill 1222トークンを非常に速く処理した効果である。prefillは30〜40 tok/s水準と推定される(decode比4〜5倍速い)。
- ユーザー体感速度(初回トークンlatency、デコード速度)の観点で8〜9 tok/sがこのマシンの安定運用点である。

### 8.9. ストリーミング(TTFT, ITL)

SSEストリーミング応答を直接パースして、最初のトークンまでの時間(TTFT)とトークン間遅延(ITL)を測定する。

| label | tokens | elapsed | TTFT | ITL avg | ITL p50 | ITL p95 | ITL max |
|-------|--------|---------|------|---------|---------|---------|---------|
| short(cold) | 100 | 15.7s | 4.77s | 110.6ms | 110.1ms | 114.2ms | 121.9ms |
| medium(warm) | 392 | 44.8s | 0.68s | 112.8ms | 110.4ms | 114.0ms | 332.0ms |
| long(warm) | 786 | 88.8s | 0.71s | 112.2ms | 109.7ms | 115.4ms | 329.9ms |

主な観察点は以下のとおりである。

- TTFTはcoldで約4.77秒(重みのpage-in直後)、warmで約0.7秒と差が大きい。
- ITL p50が約110msで非常に一定している。デコード9 tok/sと一致する。
- ITL p95も115ms以内で分布が狭い。
- まれに330msのスパイクが発生する。UIで一拍途切れる程度である。
- ユーザー体感応答性はwarm状態では良好である。最初の呼び出しだけ5秒近くかかる点は、チャットUXでは事前ウォーミングが必要である。

### 8.10. 結論

#### 8.10.1. メモリ限界

- モデル活性時のwiredは約33GBが基本占有量である。統合メモリ48GBのうち15GBが余裕として残る。
- 安全運用のコンテキストは実際のpromptトークン約12Kである。それを超えるとKVキャッシュの圧迫によりelapsedが急増する。
- 絶対限界は実際のprompt約24K付近である。それを超えるとthrashingにより事実上処理不可能になる。
- マルチターン5ターン(累積約1.8Kトークン)はメモリ負荷がほぼない。

#### 8.10.2. 性能

- デコードスループットは8〜9 tok/sで安定している。ITL p50は110msで分布が狭い。
- prefillは30〜40 tok/sと推定される。短いプロンプトではprefillの割合が小さく、応答時間はデコード長に比例する。
- TTFTはcoldで約4.8秒(重みのpage-in)、warmで約0.7秒である。
- 初回呼び出しは重みのpaging-inにより約30秒余分にかかる。頻繁に呼び出されるワークロードでは無視できる。

#### 8.10.3. 機能

- ツールコールは正常に動作し、parallel function callingをサポートする。
- Reasoningはデフォルトでthinking on状態である。明示的に`enable_thinking=False`を設定すると4.3倍加速する。
- 韓国語・英語・日本語の基本品質は合格ラインを満たしている。

### 8.11. 推奨使用ガイドライン

- 一般チャットボット/QA(2〜4Kコンテキスト)は問題なく動作する。デコード9 tok/s水準で応答する。
- マルチターン会話(累積約10Kまで)は安定している。
- 長文書の要約(prompt 8〜12K)は可能である。応答に60〜90秒かかる。
- 長文書の分析(prompt 16K+)は可能だが、応答が200秒以上かかりswapが発生し始める。
- 超長文(20K+)は推奨しない。thrashingの危険がある。
- 即答型ワークロードは`chat_template_kwargs.enable_thinking=False`で4倍加速できる。
- 他の重いアプリ(Xcodeビルド、仮想マシンなど)を同時実行する場合は、より狭いコンテキストで運用することを推奨する。

### 8.12. 測定の限界と今後の測定項目

- 同時リクエスト(concurrent inference)は未測定である。`mlx_lm.server`は単一キューで処理するため、大きな意味はない可能性がある。
- `powermetrics`ベースのGPU使用率・消費電力・温度はsudoが必要なため未測定である。別セッションで実施できる。
- 量子化比較(4bit vs 6bit vs 8bit)は量子化比較ノートで扱う。
- 35B-A3B MoE 4bitモデルの同一シナリオ比較は後続として測定予定である。

## 9. 学習ロードマップ

### 9.1. ステップ別ロードマップ

エージェントフレームワーク学習と実装のためのステップ別ロードマップは以下のとおりである。

1. 環境構築
   - uv tool install mlx-lm完了
   - Metal GPUの動作確認完了
   - Qwen 3.6 27B Dense 6bitのダウンロード
2. 単一モデルの検証
   - mlx_lm.generateで初回応答を確認
   - mlx_lm.serverを起動
   - curlまたはOpenAI SDKで互換APIを呼び出し
3. Tool callingの学習
   - 単一tool callの動作確認
   - Hermesフォーマットのraw応答分析
   - 自作tool callパーサーの作成
4. エージェントパターンの実装
   - ReActループの実装
   - Reflectionパターンの適用
   - Plan-and-Executeパターンの適用
5. 比較学習
   - 35B-A3Bで同じコードを動かして挙動を確認
   - Dense vs MoEの挙動差を観察
   - mlx-openai-serverで自作パーサーを検証

### 9.2. 学習ポイント

学習ポイントは以下のとおりである。

- Qwenの`<think>`ブロックを活用したreasoningの可視化
- Denseの決定性とMoEのルーティング差の体感
- Tool callフォーマット(Hermesスタイル)の手動パース経験
- KVキャッシュの動作とマルチターンのコスト理解

### 9.3. 自作フレームワークMollo - 設計完了

学習ロードマップ完了後の次のステップとして、Swift 6ベースのmacOS/iOS/visionOSネイティブエージェントフレームワークMolloを設計した。外部依存ゼロでAppleプラットフォームサービスを第一級市民として扱う。実装予定の核心要素は以下のとおりである。

- StateChannel + Reducerベースのストラテジーグラフ(10種以上のノードタイプ、DFSサイクル検出、`@StrategyBuilder` DSL)
- 持続実行(Checkpointerプロトコル、`ChannelSnapshot`状態キャプチャ、OS終了復帰用resume API)
- インタラプト/コマンドベースのヒューマンインザループ(`Interrupt` enumのuserDecision/approval/custom、`Command`再開セマンティクス)
- Parallel/Mapノード(Swift 6 TaskGroup並行実行、`maxConcurrency`バックプレッシャ)
- サブグラフノード(既存`Agent<Output>`の再利用、ガードレール/フック/プラグイン/権限/メモリの保持)
- マルチプロバイダーLLM(Anthropic、OpenAI、Google Gemini、DeepSeek、Ollama、OpenAI互換エンドポイント)とルーター(fallback/roundRobin/priority)、デコレーター(レートリミッター、キャッシュ、コストトラッカー)
- MCPクライアント(JSON-RPC 2.0、stdio/HTTP+SSE/WebSocketトランスポート、サーバー発行リクエスト処理、マルチサーバーライフサイクル)
- マルチモーダル(Image/Audio/Videoソース抽象化、`SpeechInputTool`、`VisionTool`)
- ビルトインツール(FileRead/Write/Edit、Grep、Glob、Shell、WebFetchとSSRF/Command Injection防御)
- Appleプラットフォームサービス統合(AppIntentsベースのSiri/Shortcuts、CloudKitセッション同期、Keychain資格情報ストア、オンライン/オフラインハイブリッドルーター)
- OAuth 2.0 PKCE(SHA256チャレンジ、CSRFガード、自動リフレッシュ)
- 永続化(InMemory/SQLite/Encryptedセッション、NLEmbedding/SQLite-FTS5メモリ、5種類の圧縮戦略)
- 可観測性(`TraceSpan` + JSONファイルエクスポーター、`os.Logger`統合ロガー、レートリミッター、コストトラッカー)
- 権限/ガードレール/プラグイン(3-tier権限モデル、入出力ガードレール、11のライフサイクルフック)
- Swift 6型付きスロー(`throws(AgentError)`、`@Sendable`クロージャ、アクターベース並行性)
- 応用(コードレビュー、ドキュメント作成などドメイン特化エージェント構築の支援)

### 9.4. 比較学習 - 参照フレームワーク

Mollo設計過程で参照したフレームワークと自作実装のトレードオフを比較する。参照対象は以下のとおりである。

- LangGraph(Python) - State Channel + Reducer、Durable Execution、Interrupt/Command、Parallel/Map抽象化の原型
- LangChain - BaseChatModel、BaseToolインターフェースパターン
- OpenAI Agents SDK - Handoff、AgentExecutorパターン
- Pydantic AI - `Agent[Output]`ジェネリック構造化出力パターン
- MCP(Model Context Protocol) - JSON-RPC 2.0ベースのツールプロトコル
- Appleプラットフォーム - AppIntents、CloudKit、Keychain、BackgroundTasks、Vision、Speech、MLX Swift、Core ML、NLEmbedding

# 参考

- <https://github.com/ml-explore/mlx>
- <https://github.com/ml-explore/mlx-lm>
- <https://huggingface.co/Qwen>
- <https://huggingface.co/unsloth>
