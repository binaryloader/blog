---
title: "[LLM] HyDE：Hypothetical Document Embeddings"
ref: hyde-hypothetical-document-embeddings
excerpt: "RAGにおける検索品質を向上させるHyDE（Hypothetical Document Embeddings）手法を整理する。"
date: 2026-02-27T18:00+09:00
last_modified_at: 2026-02-27T18:00+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/hyde-hypothetical-document-embeddings.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/hyde-hypothetical-document-embeddings.png"
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
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "LLM"
    url: /ja/development/ai/llm/
---

# 概要

RAGにおける検索品質を向上させるHyDE（Hypothetical Document Embeddings）手法を整理する。

# まとめ

## 1. 従来のRAGの検索限界

RAG（Retrieval-Augmented Generation）はクエリをエンベディングに変換し、ベクトルDBから類似した文書を検索し、その文書をコンテキストとしてLLMに渡す方式だ。

問題はユーザーの質問と文書の間の意味的距離だ。ユーザーの質問は通常短くて抽象的だが、文書は長くて具体的な説明を含んでいる。例えば「Pythonで非同期処理はどうやるの？」という質問とasyncioライブラリを詳細に説明する文書は同じトピックを扱っているが、エンベディング空間では距離が遠い場合がある。

このミスマッチにより、正確な文書が存在しても検索結果の上位に表示されないことがある。

## 2. HyDEとは

HyDE（Hypothetical Document Embeddings）はこの問題を解決するための手法だ。核心的なアイデアはユーザーの質問を直接エンベディングするのではなく、LLMが仮想的な回答をまず生成し、その回答をエンベディングして検索に使用することだ。

LLMが生成した仮想回答は事実として正確ではない可能性があるが、実際の文書と似たトーン、構造、用語を使用するため、エンベディング空間で実際の文書により近い位置に配置される。短い質問よりも文書に似た形式のテキストが検索により効果的であるという点を活用したものだ。

## 3. HyDEパイプライン

従来のRAGとHyDEの流れを比較すると以下のようになる。

従来のRAGは以下の通りだ。

```
Query → Encoder → Vector Search → 関連文書 → LLM → 最終回答
```

HyDEは以下の通りだ。

```
Query → LLM（仮想回答生成）→ Encoder → Vector Search → 関連文書 → LLM → 最終回答
```

違いは検索の前にLLMが仮想回答をまず生成するステップが追加されたことだ。この仮想回答が検索クエリの役割を代わりに果たす。

LangChainでは以下のように実装できる。

```python
from langchain.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama
from langchain_core.output_parsers import StrOutputParser

# 仮想回答生成用プロンプト
hyde_prompt = ChatPromptTemplate.from_template(
    "Please write a passage to answer the question.\n"
    "Question: {question}\n"
    "Passage:"
)

llm = ChatOllama(model="qwen3:8b")

# 仮想回答生成チェーン
hyde_chain = hyde_prompt | llm | StrOutputParser()

# 仮想回答生成
hypothetical_doc = hyde_chain.invoke({"question": "Pythonで非同期処理はどうやるの？"})

# この仮想回答をエンベディングしてベクトル検索に使用
# embeddings.embed_query(hypothetical_doc)
```

## 4. メリットとデメリット

メリットは以下の通りだ。

- Zero-shot環境で検索精度が向上する。ラベル付き学習データなしでも動作する
- 既存のretrieverとエンベディングモデルをそのまま使用できる。検索インフラを変更する必要がない
- 実装が簡単だ。検索前にLLM呼び出しを1回追加するだけでよい

デメリットは以下の通りだ。

- LLM呼び出しが追加されるため応答遅延が増加する
- LLMが不正確な仮想回答を生成すると（ハルシネーション）、検索品質がかえって低下する可能性がある
- トークン使用量が増加しコストが上がる
- すべての種類の質問に効果的なわけではない。事実確認型の質問よりも説明型の質問で効果が大きい

## 5. 論文

HyDEは以下の論文で提案された。

- タイトル: Precise Zero-Shot Dense Retrieval without Relevance Labels
- 著者: Luyu Gao, Xueguang Ma, Jimmy Lin, Jamie Callan
- 学会: ACL 2023
- arXiv: [2212.10496](https://arxiv.org/abs/2212.10496)

論文の核心的な貢献はrelevance label（正解文書ラベル）なしでもdense retrievalの性能を向上できることを示したことだ。InstructGPTで仮想文書を生成しContrieverでエンベディングした実験で、既存のzero-shot方法に比べて大幅な性能向上を達成した。

# 参考

- <https://arxiv.org/abs/2212.10496>
- <https://python.langchain.com/docs/tutorials/query_analysis/>
