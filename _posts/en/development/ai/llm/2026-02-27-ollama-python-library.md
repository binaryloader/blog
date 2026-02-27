---
title: "[LLM] Integrating LLMs with the Ollama Python Library"
ref: ollama-python-library
excerpt: "Using the Ollama Python library to connect to a remote LLM server, with generate, chat, and LangChain integration."
date: 2026-02-27T17:20+09:00
last_modified_at: 2026-02-27T17:20+09:00
published: true
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/ollama-python-library.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/ollama-python-library.png"
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
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "LLM"
    url: /en/development/ai/llm/
---

# Overview

Using the Ollama Python library to connect to a remote LLM server, with generate, chat, and LangChain integration.

# Steps

## 1. Remote Server Connection

Specifying `host` and `timeout` on `Client` connects to a remote Ollama server. When using LangChain, set `base_url` on `ChatOllama`.

```python
import ollama

client = ollama.Client(
    host="http://192.168.x.x:11434",
    timeout=300
)
```

## 2. generate and chat

```python
# Single response generation
result = client.generate(
    model="qwen3:8b",
    prompt="Explain what Python is in one sentence"
)
print(result["response"])

# Conversational
reply = client.chat(
    model="qwen3:8b",
    messages=[{"role": "user", "content": "Hello"}]
)
print(reply.message.content)
```

## 3. LangChain Integration

Using LangChain's `ChatOllama` makes it easy to build a conversational interface.

```python
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage

llm = ChatOllama(
    model="qwen3:8b",
    base_url="http://192.168.x.x:11434"
)

while True:
    user_input = input("Enter your question (quit: exit): ")
    if user_input.lower() == "exit":
        break

    messages = [HumanMessage(content=user_input)]
    response = llm.invoke(messages)
    print("Answer:", response.content)
```

## 4. Timeout

Even an 8B model can take time depending on server specs. If the default timeout is too short, a `ConnectionError` occurs. Setting a generous `timeout` value is recommended.

# Resources

- 올라마와 오픈소스 LLM을 활용한 AI 에이전트 개발 입문

# References

- <https://github.com/godstale/ollama-mcp-tutorials>
- <https://github.com/ollama/ollama-python>
