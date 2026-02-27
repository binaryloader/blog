---
title: "[LLM] Ollama PythonライブラリでLLMと連携する"
ref: ollama-python-library
excerpt: "Ollama Pythonライブラリでリモートサーバーに接続し、generate、chat、LangChain連携まで使用する方法を整理する。"
date: 2026-02-27T17:20+09:00
last_modified_at: 2026-02-27T17:20+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/ollama-python-library.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/ollama-python-library.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - Ollama
  - Python
  - LangChain
  - LLM
depth:
  - title: "Development"
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "LLM"
    url: /ja/development/ai/llm/
---

# 概要

Ollama Pythonライブラリでリモートサーバーに接続し、generate、chat、LangChain連携まで使用する方法を整理する。

# 手順

## 1. リモートサーバー接続

`Client`に`host`と`timeout`を指定するとリモートOllamaサーバーに接続できる。LangChainを使う場合は`ChatOllama`に`base_url`を指定する。

```python
import ollama

client = ollama.Client(
    host="http://192.168.x.x:11434",
    timeout=300
)
```

## 2. generateとchat

```python
# 単一レスポンス生成
result = client.generate(
    model="qwen3:8b",
    prompt="Pythonとは何かを一文で説明して"
)
print(result["response"])

# 対話形式
reply = client.chat(
    model="qwen3:8b",
    messages=[{"role": "user", "content": "こんにちは"}]
)
print(reply.message.content)
```

## 3. LangChain連携

LangChainの`ChatOllama`を使えば対話型インターフェースを簡単に実装できる。

```python
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage

llm = ChatOllama(
    model="qwen3:8b",
    base_url="http://192.168.x.x:11434"
)

while True:
    user_input = input("質問を入力してください (終了: exit): ")
    if user_input.lower() == "exit":
        break

    messages = [HumanMessage(content=user_input)]
    response = llm.invoke(messages)
    print("回答:", response.content)
```

## 4. タイムアウト

8Bモデルでもサーバーのスペックによってはレスポンスに時間がかかることがある。デフォルトのタイムアウトが短いと`ConnectionError`が発生するため、`timeout`を余裕を持って設定するのが良い。

# リソース

- 올라마와 오픈소스 LLM을 활용한 AI 에이전트 개발 입문

# 参考

- <https://github.com/godstale/ollama-mcp-tutorials>
- <https://github.com/ollama/ollama-python>
