---
title: "[LLM] HyDE - Hypothetical Document Embeddings"
ref: hyde-hypothetical-document-embeddings
excerpt: "RAG에서 검색 품질을 높이기 위한 HyDE(Hypothetical Document Embeddings) 기법을 정리한다."
date: 2026-02-27T18:00+09:00
last_modified_at: 2026-02-27T18:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/hyde-hypothetical-document-embeddings.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/hyde-hypothetical-document-embeddings.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - HyDE
  - RAG
  - LLM
  - Embeddings
  - Information Retrieval
depth:
  - title: "Development"
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "LLM"
    url: /ko/development/ai/llm/
---

# 개요

RAG에서 검색 품질을 높이기 위한 HyDE(Hypothetical Document Embeddings) 기법을 정리한다.

# 정리

## 1. 기존 RAG의 검색 한계

RAG(Retrieval-Augmented Generation)는 질문을 임베딩으로 변환한 뒤 벡터 DB에서 유사한 문서를 검색하고 그 문서를 컨텍스트로 LLM에 전달하는 방식이다.

문제는 사용자 질문과 문서 사이의 의미적 거리다. 사용자 질문은 보통 짧고 추상적인 반면 문서는 길고 구체적인 설명을 담고 있다. 예를 들어 "Python에서 비동기 처리는 어떻게 해?"라는 질문과 asyncio 라이브러리를 상세하게 설명하는 문서는 같은 주제를 다루지만 임베딩 공간에서 거리가 멀 수 있다.

이런 불일치 때문에 정확한 문서가 존재하더라도 검색 결과의 상위에 오지 못하는 경우가 발생한다.

## 2. HyDE란

HyDE(Hypothetical Document Embeddings)는 이 문제를 해결하기 위한 기법이다. 핵심 아이디어는 사용자 질문을 바로 임베딩하는 대신 LLM이 가상의 답변을 먼저 생성하고 그 답변을 임베딩하여 검색에 사용하는 것이다.

LLM이 생성한 가상 답변은 사실적으로 정확하지 않을 수 있지만 실제 문서와 비슷한 어조, 구조, 용어를 사용하기 때문에 임베딩 공간에서 실제 문서와 더 가까운 위치에 놓인다. 짧은 질문보다 문서와 유사한 형태의 텍스트가 검색에 더 효과적이라는 점을 활용한 것이다.

## 3. HyDE 파이프라인

기존 RAG와 HyDE의 흐름을 비교하면 아래와 같다.

기존 RAG는 아래와 같다.

```
Query → Encoder → Vector Search → 관련 문서 → LLM → 최종 답변
```

HyDE는 아래와 같다.

```
Query → LLM (가상 답변 생성) → Encoder → Vector Search → 관련 문서 → LLM → 최종 답변
```

차이점은 검색 전에 LLM이 가상 답변을 먼저 생성하는 단계가 추가된 것이다. 이 가상 답변이 검색 쿼리 역할을 대신한다.

LangChain에서는 아래와 같이 구현할 수 있다.

```python
from langchain.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama
from langchain_core.output_parsers import StrOutputParser

# 가상 답변 생성용 프롬프트
hyde_prompt = ChatPromptTemplate.from_template(
    "Please write a passage to answer the question.\n"
    "Question: {question}\n"
    "Passage:"
)

llm = ChatOllama(model="qwen3:8b")

# 가상 답변 생성 체인
hyde_chain = hyde_prompt | llm | StrOutputParser()

# 가상 답변 생성
hypothetical_doc = hyde_chain.invoke({"question": "Python에서 비동기 처리는 어떻게 해?"})

# 이 가상 답변을 임베딩하여 벡터 검색에 사용
# embeddings.embed_query(hypothetical_doc)
```

## 4. 장단점

장점은 아래와 같다.

- Zero-shot 환경에서 검색 정확도가 향상된다. 라벨링된 학습 데이터 없이도 동작한다
- 기존 retriever와 임베딩 모델을 그대로 사용할 수 있다. 검색 인프라를 변경할 필요가 없다
- 구현이 간단하다. 검색 전에 LLM 호출 한 번만 추가하면 된다

단점은 아래와 같다.

- LLM 호출이 추가되므로 응답 지연이 증가한다
- LLM이 부정확한 가상 답변을 생성하면(환각) 오히려 검색 품질이 떨어질 수 있다
- 토큰 사용량이 증가하여 비용이 올라간다
- 모든 종류의 질문에 효과적인 것은 아니다. 사실 확인형 질문보다 설명형 질문에서 효과가 크다

## 5. 논문

HyDE는 아래 논문에서 제안되었다.

- 제목: Precise Zero-Shot Dense Retrieval without Relevance Labels
- 저자: Luyu Gao, Xueguang Ma, Jimmy Lin, Jamie Callan
- 학회: ACL 2023
- arXiv: [2212.10496](https://arxiv.org/abs/2212.10496)

논문의 핵심 기여는 relevance label(정답 문서 라벨) 없이도 dense retrieval의 성능을 높일 수 있음을 보인 것이다. InstructGPT로 가상 문서를 생성하고 Contriever로 임베딩한 실험에서 기존 zero-shot 방법 대비 큰 성능 향상을 달성했다.

# 참고

- <https://arxiv.org/abs/2212.10496>
- <https://python.langchain.com/docs/tutorials/query_analysis/>
