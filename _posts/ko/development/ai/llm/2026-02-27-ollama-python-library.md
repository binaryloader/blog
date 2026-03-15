---
title: "[LLM] Ollama Python 라이브러리로 LLM 연동하기"
ref: ollama-python-library
excerpt: "Ollama Python 라이브러리로 원격 LLM 서버에 연결하고 generate, chat, LangChain 연동까지 사용하는 방법을 정리한다."
date: 2026-02-27T17:20+09:00
last_modified_at: 2026-02-27T17:20+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/ollama-python-library.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/ollama-python-library.png"
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
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "LLM"
    url: /ko/development/ai/llm/
---

# 개요

Ollama Python 라이브러리로 원격 LLM 서버에 연결하고 generate, chat, LangChain 연동까지 사용하는 방법을 정리한다.

# 정리

## 1. 원격 서버 연결

`Client`에 `host`와 `timeout`을 지정하면 원격 Ollama 서버에 연결할 수 있다. LangChain을 사용하는 경우 `ChatOllama`에 `base_url`을 지정한다.

```python
import ollama

client = ollama.Client(
    host="http://192.168.x.x:11434",
    timeout=300
)
```

## 2. generate와 chat

```python
# 단일 응답 생성
result = client.generate(
    model="qwen3:8b",
    prompt="Python이 뭔지 한 줄로 설명해"
)
print(result["response"])

# 대화형
reply = client.chat(
    model="qwen3:8b",
    messages=[{"role": "user", "content": "안녕"}]
)
print(reply.message.content)
```

## 3. LangChain 연동

LangChain의 `ChatOllama`를 사용하면 대화형 인터페이스를 간단하게 구현할 수 있다.

```python
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage

llm = ChatOllama(
    model="qwen3:8b",
    base_url="http://192.168.x.x:11434"
)

while True:
    user_input = input("질문을 입력하세요(종료: exit): ")
    if user_input.lower() == "exit":
        break

    messages = [HumanMessage(content=user_input)]
    response = llm.invoke(messages)
    print("답변:", response.content)
```

## 4. 타임아웃

8B 모델이라도 서버 사양에 따라 응답에 시간이 걸릴 수 있다. 기본 타임아웃이 짧으면 `ConnectionError`가 발생하므로 `timeout`을 넉넉하게 설정하는 것이 좋다.

# 리소스

- 올라마와 오픈소스 LLM을 활용한 AI 에이전트 개발 입문

# 참고

- <https://github.com/godstale/ollama-mcp-tutorials>
- <https://github.com/ollama/ollama-python>
