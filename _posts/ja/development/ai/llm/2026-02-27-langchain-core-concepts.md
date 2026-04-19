---
title: "[LLM] LangChain核心概念：LCEL、プロンプトテンプレート、メッセージクラス"
ref: langchain-core-concepts
excerpt: "LangChainのLCEL、プロンプトテンプレート、メッセージクラス、MessagesPlaceholder、RunnableGeneratorを整理する。"
date: 2026-02-27T17:40+09:00
last_modified_at: 2026-02-27T17:40+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/langchain-core-concepts.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/langchain-core-concepts.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - LangChain
  - LCEL
  - Prompt Engineering
  - Python
depth:
  - title: "Development"
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "LLM"
    url: /ja/development/ai/llm/
---

# 概要

LangChainのLCEL、プロンプトテンプレート、メッセージクラス、MessagesPlaceholder、RunnableGeneratorを整理する。

# まとめ

## 1. プロンプトエンジニアリング

LLMは同じモデルでもプロンプトによって全く異なる品質の結果を出す。曖昧な質問には曖昧な答えが返り、具体的で構造化されたプロンプトには正確で有用な答えが返る。

プロンプトエンジニアリングが重要な理由は以下のとおりである。

- コスト効率：ファインチューニングやより大きなモデルへのアップグレードなしに、プロンプトの改善だけでパフォーマンスを向上できる
- ハルシネーション削減：役割付与、制約条件の明示、出力形式の指定などでモデルが事実ベースの応答をするよう誘導できる
- 一貫した出力：JSONやマークダウンテーブルなどの形式を指定すれば、後処理なしにそのまま使える構造化された結果を得られる
- 複雑な推論：Chain-of-ThoughtやFew-shotなどの手法でモデルに段階的に思考させれば、論理的な正確度が上がる
- 安全性：システムプロンプトで境界を設定し、不適切な応答やプロンプトインジェクションを防御できる

主要な手法をまとめると以下のとおりである。

| 手法 | 説明 |
|---|---|
| Zero-shot | 例示なしに指示だけで実行 |
| Few-shot | 入出力の例をタスクとともに提供 |
| Chain-of-Thought | 「ステップごとに考えて」で推論過程を誘導 |
| Role prompting | 「あなたは〜の専門家です」で役割を付与 |
| Self-consistency | 同じ質問を複数回試行して多数決をとる |

プロンプトエンジニアリングはLLM活用において最も少ないコストで最も大きなパフォーマンス差を生む方法である。モデルを変える前にまずプロンプトを改善するのが先であり、AIエージェントやRAGパイプラインを構築する際も各段階のプロンプト品質が全体のシステムパフォーマンスを決定する。

## 2. LCEL(LangChain Expression Language)

LCELはLangChainコンポーネントをパイプ演算子(`|`)で接続してチェーンを宣言的に構成する構文である。すべてのコンポーネントが共通の`Runnable`インターフェースを実装しているため、自由に組み合わせることができる。

```python
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"question": "LCELとは？"})
```

データがパイプラインを順に流れる。prompt → LLM → output parserの順で1行に表現できる。

### 2.1. メリット

- 簡潔な宣言的構成：複雑なチェーンもパイプ演算子で直感的に表現できる
- 統一されたインターフェース：すべてのコンポーネントが`Runnable`を実装しているため、`invoke`、`stream`、`batch`、`ainvoke`などを一貫して使用できる
- ストリーミング/非同期の標準サポート：`.stream()`、`.ainvoke()`などを追加コードなしにすぐ使用できる
- 組み合わせ可能性：retriever、prompt、LLM、parserなどをレゴブロックのように組み立ててRAGなどのパターンを簡単に実装できる
- 並列実行：`RunnableParallel`で独立したタスクを同時に実行できる

### 2.2. デメリット

- デバッグの困難さ：パイプライン途中でエラーが発生した場合、どのステップで問題が起きたか追跡しにくい
- 学習コスト：`RunnablePassthrough`、`RunnableParallel`、`RunnableLambda`などLCEL固有の概念を別途学ぶ必要がある
- 暗黙的なデータフロー：コードだけ見てステップ間でどのデータが渡されているか把握しにくいことがある
- 複雑な分岐：条件分岐やエラーハンドリングが純粋なPythonコードより複雑になることがある
- 過度な抽象化：単純なタスクでもRunnableラッピングが必要で、オーバーヘッドに感じることがある

### 2.3. RAGの例

```python
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

prompt = ChatPromptTemplate.from_template(
    "Context: {context}\n\nQuestion: {question}"
)

chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

answer = chain.invoke("LCELとは？")
```

`retriever | format_docs`で中間処理をパイプで繋ぎ、辞書で囲むと並列実行になる。結果が統合されて次のステップに渡される。

## 3. プロンプトテンプレート

プロンプトテンプレートは変数を含むプロンプトの型である。`{変数名}`プレースホルダを含む固定テキストに実行時に実際の値を埋めて完成されたプロンプトを作る。

### 3.1. PromptTemplate

シンプルな文字列テンプレートで、completionモデルに使用する。

```python
from langchain_core.prompts import PromptTemplate

prompt = PromptTemplate.from_template(
    "{topic}について説明して"
)
prompt.invoke({"topic": "プロンプトエンジニアリング"})
```

### 3.2. ChatPromptTemplate

チャットモデル用のテンプレートで、system/human/aiメッセージを構造化する。最もよく使われるタイプである。

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "あなたは{input_language}を{output_language}に翻訳するアシスタントです。"),
    ("human", "{input}")
])

prompt.invoke({
    "input_language": "韓国語",
    "output_language": "英語",
    "input": "안녕하세요"
})
```

`from_template`と`from_messages`の違いは以下のとおりである。

| | `from_template` | `from_messages` |
|---|---|---|
| メッセージ数 | humanのみ1つ | 複数を自由に構成 |
| システムメッセージ | 不可 | 可能 |
| Few-shot例 | 不可 | 可能（human/aiペアを追加） |
| 用途 | シンプルなクエリ | 役割付与、会話構造 |

役割や制約条件を設定するシステムメッセージがほぼ常に必要なため、実務では`from_messages`がはるかに多く使われる。

### 3.3. FewShotChatMessagePromptTemplate

Few-shot例を含むテンプレートである。入出力ペアを提供してモデルの応答パターンを誘導する。

```python
from langchain_core.prompts import (
    ChatPromptTemplate,
    FewShotChatMessagePromptTemplate,
)

examples = [
    {"input": "2+2", "output": "4"},
    {"input": "2+3", "output": "5"},
]

example_prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}"),
])

few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    examples=examples,
)

final_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a wondrous wizard of math."),
    few_shot_prompt,
    ("human", "{input}"),
])
```

### 3.4. LCELチェーンとの結合

プロンプトテンプレートは`Runnable`を実装しているため、パイプ演算子でチェーンに直接接続できる。

```python
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful AI assistant named Fred."),
    ("user", "{input}")
])

chain = prompt | llm | StrOutputParser()

for txt in chain.stream({"input": "What's your name?"}):
    print(txt, end="")
```

核心はプロンプトをハードコーディングせず再利用可能なテンプレートとして管理することである。変数を変えるだけで様々な入力に対応できる。

| タイプ | 用途 |
|---|---|
| `PromptTemplate` | シンプルな文字列completionモデル |
| `ChatPromptTemplate` | チャットモデル（system/human/aiメッセージ構造） |
| `FewShotChatMessagePromptTemplate` | Few-shot例を含む |

## 4. メッセージクラス

LangChainはチャットモデルのメッセージを役割別に区別するクラスを提供する。すべてのメッセージクラスは`BaseMessage`を継承し、`content`（内容）と`role`（役割）属性を共通で持つ。

### 4.1. 主要クラス

| クラス | 役割 | 説明 |
|---|---|---|
| `BaseMessage` | - | すべてのメッセージの親クラス。直接使用せずサブクラスを使用する |
| `SystemMessage` | system | モデルの動作方式を指示する。役割付与、制約条件、出力形式などを設定する |
| `HumanMessage` | human | ユーザーの入力メッセージ |
| `AIMessage` | ai | モデルの応答メッセージ。`tool_calls`属性でツール呼び出し情報を含むことができる |
| `AIMessageChunk` | ai | ストリーミング中に到着する応答の部分的な断片。`content`を蓄積して全体の応答を構成する |
| `ToolMessage` | tool | ツール実行結果をモデルに伝達する。`tool_call_id`でどの呼び出しの結果かを紐づける |
| `ChatMessage` | カスタム | `role`を任意に指定できる汎用メッセージ。標準の役割に合わない場合に使用する |
| `FunctionMessage` | function | OpenAIのレガシーfunction calling API用。deprecated（`ToolMessage`を使用する） |

### 4.2. 基本的な使い方

`ChatPromptTemplate.from_messages`のタプルの最初の要素（`"system"`、`"human"`、`"ai"`）がメッセージクラスに対応する。

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

# タプル方式（簡便）
prompt = ChatPromptTemplate.from_messages([
    ("system", "あなたはアシスタントです。"),
    ("human", "{input}"),
])

# オブジェクト方式（明示的）
prompt = ChatPromptTemplate.from_messages([
    SystemMessage(content="あなたはアシスタントです。"),
    ("human", "{input}"),
])
```

チャット履歴を構成する際は`HumanMessage`と`AIMessage`オブジェクトを直接生成してリストに追加する。

```python
chat_history = []
chat_history.append(HumanMessage(content="こんにちは"))
chat_history.append(AIMessage(content="こんにちは！"))
```

### 4.3. ToolMessage

エージェントがツールを呼び出すと`AIMessage`の`tool_calls`に呼び出し情報が格納され、ツール実行結果は`ToolMessage`でモデルに再び伝達する。`tool_call_id`でどの呼び出しに対する応答かをマッチングする。

```python
from langchain_core.messages import AIMessage, ToolMessage

ai_message = AIMessage(
    content=[],
    tool_calls=[{
        "name": "get_weather",
        "args": {"location": "ソウル"},
        "id": "call_123"
    }]
)

tool_message = ToolMessage(
    content="晴れ、25°C",
    tool_call_id="call_123"
)
```

### 4.4. AIMessageChunk

ストリーミング応答を受ける際は`AIMessageChunk`が断片単位で到着する。`chunk.content`を繋ぎ合わせると全体の応答になる。

### 4.5. ChatMessage

標準の役割（`system`、`human`、`ai`、`tool`）に該当しないカスタム役割が必要な場合に使用する。

```python
from langchain_core.messages import ChatMessage

msg = ChatMessage(
    role="moderator",
    content="この会話は安全ガイドラインに従います。"
)
```

## 5. MessagesPlaceholder

`MessagesPlaceholder`はプロンプトテンプレートにメッセージのリストを動的に挿入するプレースホルダである。通常の変数（`{input}`）は単一の文字列を代入するが、`MessagesPlaceholder`は複数のメッセージオブジェクトをまるごと挿入する。

### 5.1. なぜ必要か

チャット履歴はhuman/aiメッセージが交互に並ぶリストである。通常の文字列変数ではこの構造を表現できないため、メッセージリスト専用のプレースホルダが必要である。

### 5.2. 使い方

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

prompt = ChatPromptTemplate.from_messages([
    ("system", "あなたは親切なアシスタントです。"),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])
```

呼び出し時に`chat_history`にメッセージリストを渡す。

```python
from langchain_core.messages import HumanMessage, AIMessage

prompt.invoke({
    "chat_history": [
        HumanMessage(content="私の名前はミンスです"),
        AIMessage(content="こんにちはミンスさん！"),
    ],
    "input": "私の名前は何でしたっけ？"
})
```

結果のメッセージ構造は以下のとおりである。

```
SystemMessage:  "あなたは親切なアシスタントです。"
HumanMessage:   "私の名前はミンスです"          <- chat_history
AIMessage:      "こんにちはミンスさん！"         <- chat_history
HumanMessage:   "私の名前は何でしたっけ？"       <- input
```

### 5.3. 主な用途

| 用途 | 説明 |
|---|---|
| チャット履歴 | 前の会話を保持してコンテキストのある応答 |
| Few-shot例 | 例示メッセージを動的に注入 |
| Agent scratchpad | エージェントの中間推論過程（ツール呼び出し/結果）を挿入 |

### 5.4. `{}`で囲まない理由

```python
[
    ("system", "..."),                        # タプル -> 文字列テンプレート
    MessagesPlaceholder("chat_history"),      # オブジェクト -> メッセージリストプレースホルダ
    ("human", "{question}"),                  # タプル -> 文字列テンプレート
]
```

`{question}`は文字列変数である。文字列内で代入位置を示すPythonのformat構文である。一方、`MessagesPlaceholder("chat_history")`はすでに別のオブジェクトとして宣言されているため、`"chat_history"`は単に変数名を指定するコンストラクタ引数である。文字列の代入ではなく、その名前で渡されたメッセージリストをまるごと挿入するものなので`{}`は不要である。

### 5.5. `optional`パラメータ

会話の最初のターンのようにチャット履歴が空の場合、空のリストを渡すとエラーが発生することがある。`optional=True`に設定すると変数がない場合は無視される。

```python
MessagesPlaceholder("chat_history", optional=True)
```

## 6. RunnableGeneratorとカスタムストリーミングパーサー

LangChainの`StrOutputParser`はLLM出力を文字列に変換する汎用パーサーである。しかしストリーミング中に特定の単語を置換・加工するにはカスタムパーサーが必要である。`RunnableGenerator`はPythonのジェネレータ関数をLCELチェーンに接続できるようにするラッパーである。

### 6.1. yieldとジェネレータ

`yield`は値を1つずつ送り出す`return`である。`return`は関数を終了するが、`yield`は関数を一時停止させて値を渡す。次のリクエストが来ると停止した地点から実行を再開する。

```python
# return: すべてまとめて一度に返す
def get_all():
    return [1, 2, 3]

# yield: 1つずつ返して一時停止
def get_one_by_one():
    yield 1  # ここで一時停止
    yield 2  # 次のリクエストでここで一時停止
    yield 3

for n in get_one_by_one():
    print(n)  # 1, 2, 3
```

`yield`を使う関数をジェネレータ（generator）と呼ぶ。重要な点は関数が終了しないためローカル変数が保持されることである。この特性により、ストリーミング中に状態（bufferなど）を維持しながらデータを処理できる。

### 6.2. カスタムストリーミングパーサーの実装

以下の例はLLMストリーミング応答で「태풍」（台風）という単語を絵文字に置換するパーサーである。

```python
from typing import Iterable

from langchain_core.messages import AIMessageChunk
from langchain_core.runnables import RunnableGenerator


def replace_word_with_emoji(text: str) -> str:
    return text.replace("태풍", "🌪️ ")


def streaming_parse(chunks: Iterable[AIMessageChunk]) -> Iterable[str]:
    buffer = ""
    for text_chunk in chunks:
        buffer += text_chunk.content
        while " " in buffer:
            word, buffer = buffer.split(" ", 1)
            yield replace_word_with_emoji(word) + " "
    if buffer:
        yield replace_word_with_emoji(buffer)


streaming_parser = RunnableGenerator(streaming_parse)
chain = prompt | llm | streaming_parser
```

単語単位で置換する必要があるため、文字単位ではなくスペース単位でbufferに蓄積して処理する。文字単位で送り出すと`"태"`と`"풍"`が分離されて`"태풍"`を認識できないためである。

### 6.3. 動作フロー

LLM応答`"오늘 태풍이 옵니다"`が以下のチャンクで到着すると仮定する。

```
チャンク1: "오늘"
│ buffer = "오늘"
│ スペースなし → 次のチャンクを待つ
│
チャンク2: " 태"
│ buffer = "오늘 태"
│ スペース発見 → split → word="오늘", buffer="태"
│ yield "오늘 " → ⏸️ 一時停止（buffer="태"が保持）
│ └→ forループでchunk="오늘 "を受信 → print
│ ▶️ 再開、buffer="태"にスペースなし → 次のチャンクを待つ
│
チャンク3: "풍"
│ buffer = "태풍"
│ スペースなし → 次のチャンクを待つ
│
チャンク4: "이 옵"
│ buffer = "태풍이 옵"
│ スペース発見 → split → word="태풍이", buffer="옵"
│ "태풍" → "🌪️ " 置換
│ yield "🌪️ 이 " → ⏸️ 一時停止
│ └→ chunk="🌪️ 이 "を受信 → print
│ ▶️ 再開、buffer="옵"にスペースなし → 次のチャンクを待つ
│
チャンク5: "니다"
│ buffer = "옵니다"
│ スペースなし → forループ終了
│
if buffer:（"옵니다"が残っている）
│ yield "옵니다" → 最後の単語を処理
```

最終出力は`오늘 🌪️ 이 옵니다`となる。

### 6.4. Consumer

`yield`された値はどこかに保存されるのではなく、consumer（`for`ループ）がリクエストするたびに1つずつ生成されて渡される。

```python
result = ""
for chunk in chain.stream({"chat_history": chat_history}):
    print(chunk, end="", flush=True)  # yieldされた値がchunkに入る
    result += chunk
chat_history.append(AIMessage(content=result))
```

`for`ループが1回まわるたびにジェネレータに次の値をリクエストし、`yield`が実行されて値を渡した後再び一時停止する。結果全体をメモリに保持する必要がなく、到着するたびに画面に出力できる。

# リソース

- 올라마와 오픈소스 LLM을 활용한 AI 에이전트 개발 입문

# 参考

- <https://python.langchain.com/docs/concepts/few_shot_prompting/>
- <https://python.langchain.com/docs/concepts/lcel/>
- <https://python.langchain.com/docs/concepts/prompt_templates/>
