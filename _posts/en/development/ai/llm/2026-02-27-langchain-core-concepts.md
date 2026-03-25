---
title: "[LLM] LangChain Core Concepts — LCEL, Prompt Templates, Message Classes"
ref: langchain-core-concepts
excerpt: "An overview of LangChain's LCEL, prompt templates, message classes, MessagesPlaceholder, and RunnableGenerator."
date: 2026-02-27T17:40+09:00
last_modified_at: 2026-02-27T17:40+09:00
published: true
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/langchain-core-concepts.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/langchain-core-concepts.png"
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
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "LLM"
    url: /en/development/ai/llm/
---

# Overview

An overview of LangChain's LCEL, prompt templates, message classes, MessagesPlaceholder, and RunnableGenerator.

# Summary

## 1. Prompt Engineering

LLMs produce vastly different output quality depending on the prompt, even with the same model. Vague questions produce vague answers; specific, structured prompts produce accurate and useful answers.

Here's why prompt engineering matters.

- **Cost efficiency** — Performance can be improved through prompt refinement alone, without fine-tuning or upgrading to a larger model
- **Hallucination reduction** — Role assignment, constraint specification, and output format specification guide the model toward fact-based responses
- **Consistent output** — Specifying formats like JSON or markdown tables yields structured results usable without post-processing
- **Complex reasoning** — Techniques like Chain-of-Thought and Few-shot enable the model to think step-by-step, improving logical accuracy
- **Safety** — System prompts set boundaries to defend against inappropriate responses and prompt injection

Key techniques are summarized below.

| Technique | Description |
|---|---|
| Zero-shot | Perform with instructions only, no examples |
| Few-shot | Provide input/output examples alongside the task |
| Chain-of-Thought | Induce reasoning process with "think step by step" |
| Role prompting | Assign a role with "you are a ~expert" |
| Self-consistency | Try the same question multiple times and take majority vote |

Prompt engineering is the method that creates the biggest performance difference at the lowest cost in LLM usage. Improving prompts comes before changing the model itself, and when building AI agents or RAG pipelines, the quality of prompts at each stage ultimately determines overall system performance.

## 2. LCEL (LangChain Expression Language)

LCEL is a syntax for declaratively composing chains by **connecting LangChain components with the pipe operator (`|`)**. All components implement a common `Runnable` interface, allowing free combination.

```python
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"question": "What is LCEL?"})
```

Data flows through the pipeline in order: prompt → LLM → output parser, expressed in a single line.

### 2.1. Advantages

- **Concise declarative composition** — Even complex chains can be expressed intuitively with the pipe operator
- **Unified interface** — All components implement `Runnable`, so `invoke`, `stream`, `batch`, `ainvoke` etc. can be used consistently
- **Streaming/async built-in** — `.stream()`, `.ainvoke()` work immediately without separate code
- **Composability** — Retriever, prompt, LLM, parser etc. can be assembled like Lego blocks for patterns like RAG
- **Parallel execution** — `RunnableParallel` allows independent tasks to run simultaneously

### 2.2. Disadvantages

- **Debugging difficulty** — When errors occur mid-pipeline, it's hard to trace which step caused the problem
- **Learning curve** — LCEL-specific concepts like `RunnablePassthrough`, `RunnableParallel`, `RunnableLambda` must be learned separately
- **Implicit data flow** — It can be hard to determine what data is passed between steps just by reading the code
- **Complex branching** — Conditional branching and error handling can become more complex than pure Python code
- **Over-abstraction** — Even simple tasks require Runnable wrapping, which can feel like overhead

### 2.3. RAG Example

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

answer = chain.invoke("What is LCEL?")
```

`retriever | format_docs` chains intermediate processing with pipes, and wrapping in a dict enables parallel execution — results are combined and passed to the next step.

## 3. Prompt Templates

A prompt template is a **prompt frame containing variables**. Fixed text with `{variable_name}` placeholders is filled with actual values at runtime to produce completed prompts.

### 3.1. PromptTemplate

A simple string template, used for completion models.

```python
from langchain_core.prompts import PromptTemplate

prompt = PromptTemplate.from_template(
    "Explain {topic}"
)
prompt.invoke({"topic": "prompt engineering"})
```

### 3.2. ChatPromptTemplate

For chat models, structuring system/human/ai messages. The most commonly used type.

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helper that translates {input_language} to {output_language}."),
    ("human", "{input}")
])

prompt.invoke({
    "input_language": "Korean",
    "output_language": "English",
    "input": "안녕하세요"
})
```

The differences between `from_template` and `from_messages` are summarized below.

| | `from_template` | `from_messages` |
|---|---|---|
| Message count | 1 human only | Multiple, freely composed |
| System message | Not possible | Possible |
| Few-shot examples | Not possible | Possible (add human/ai pairs) |
| Use case | Simple queries | Role assignment, conversation structure |

Since system messages for role and constraint setting are almost always needed, `from_messages` is used far more often in practice.

### 3.3. FewShotChatMessagePromptTemplate

A template that includes few-shot examples, providing input/output pairs to guide the model's response pattern.

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

### 3.4. Combining with LCEL Chains

Prompt templates implement `Runnable`, so they connect directly to chains via the pipe operator.

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

The key point is managing prompts as **reusable templates** rather than hardcoding them, allowing different inputs to be handled by simply changing variables.

| Type | Purpose |
|---|---|
| `PromptTemplate` | Simple string completion model |
| `ChatPromptTemplate` | Chat model (system/human/ai message structure) |
| `FewShotChatMessagePromptTemplate` | Including few-shot examples |

## 4. Message Classes

LangChain provides classes that distinguish chat model messages by role. All message classes inherit from `BaseMessage` and share common attributes like `content` and `role`.

### 4.1. Main Classes

| Class | Role | Description |
|---|---|---|
| `BaseMessage` | - | Parent class of all messages. Not used directly; use subclasses instead |
| `SystemMessage` | system | Instructs how the model should behave. Sets role assignment, constraints, output format, etc. |
| `HumanMessage` | human | The user's input message |
| `AIMessage` | ai | The model's response message. Can contain tool call information via the `tool_calls` attribute |
| `AIMessageChunk` | ai | Partial fragment of a response arriving during streaming. Accumulate `content` to build the full response |
| `ToolMessage` | tool | Delivers tool execution results to the model. Links to the call via `tool_call_id` |
| `ChatMessage` | custom | A generic message with an arbitrary `role`. Used when standard roles don't apply |
| `FunctionMessage` | function | For OpenAI's legacy function calling API. **Deprecated** — use `ToolMessage` instead |

### 4.2. Basic Usage

The first element of tuples in `ChatPromptTemplate.from_messages` (`"system"`, `"human"`, `"ai"`) corresponds to these classes.

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

# Tuple style (convenient)
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an assistant."),
    ("human", "{input}"),
])

# Object style (explicit)
prompt = ChatPromptTemplate.from_messages([
    SystemMessage(content="You are an assistant."),
    ("human", "{input}"),
])
```

When building chat history, create `HumanMessage` and `AIMessage` objects directly and append them to the list.

```python
chat_history = []
chat_history.append(HumanMessage(content="Hello"))
chat_history.append(AIMessage(content="Hi there!"))
```

### 4.3. ToolMessage

When an agent calls a tool, the call information is stored in `AIMessage`'s `tool_calls`, and the tool execution result is passed back to the model via `ToolMessage`. The `tool_call_id` matches which call the response belongs to.

```python
from langchain_core.messages import AIMessage, ToolMessage

ai_message = AIMessage(
    content=[],
    tool_calls=[{
        "name": "get_weather",
        "args": {"location": "Seoul"},
        "id": "call_123"
    }]
)

tool_message = ToolMessage(
    content="Sunny, 25°C",
    tool_call_id="call_123"
)
```

### 4.4. AIMessageChunk

When receiving streaming responses, `AIMessageChunk` arrives piece by piece. Concatenating `chunk.content` produces the full response.

### 4.5. ChatMessage

Used when a custom role outside the standard roles (`system`, `human`, `ai`, `tool`) is needed.

```python
from langchain_core.messages import ChatMessage

msg = ChatMessage(
    role="moderator",
    content="This conversation follows safety guidelines."
)
```

## 5. MessagesPlaceholder

`MessagesPlaceholder` is a placeholder for **dynamically inserting a list of messages** into a prompt template. While regular variables (`{input}`) substitute a single string, `MessagesPlaceholder` inserts multiple message objects as a whole.

### 5.1. Why It's Needed

Chat history is a **list** of alternating human/ai messages. Regular string variables cannot represent this structure, so a dedicated message-list placeholder is necessary.

### 5.2. Usage

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a friendly assistant."),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])
```

Pass a message list to `chat_history` when invoking.

```python
from langchain_core.messages import HumanMessage, AIMessage

prompt.invoke({
    "chat_history": [
        HumanMessage(content="My name is Alice"),
        AIMessage(content="Hello Alice!"),
    ],
    "input": "What was my name?"
})
```

The resulting message structure looks like this.

```
SystemMessage:  "You are a friendly assistant."
HumanMessage:   "My name is Alice"              <- chat_history
AIMessage:      "Hello Alice!"                   <- chat_history
HumanMessage:   "What was my name?"              <- input
```

### 5.3. Primary Uses

| Use Case | Description |
|---|---|
| Chat history | Maintain previous conversation for contextual responses |
| Few-shot examples | Dynamically inject example messages |
| Agent scratchpad | Insert agent's intermediate reasoning (tool calls/results) |

### 5.4. Why It's Not Wrapped in `{}`

```python
[
    ("system", "..."),                        # Tuple -> string template
    MessagesPlaceholder("chat_history"),      # Object -> message list placeholder
    ("human", "{question}"),                  # Tuple -> string template
]
```

`{question}` is a **string variable**. `{}` marks the substitution position within a string, using Python's format syntax. On the other hand, `MessagesPlaceholder("chat_history")` is already declared as a separate object, so `"chat_history"` is simply **a constructor argument specifying the variable name**. It's not string substitution; rather, it inserts the message list passed under that name as a whole, so `{}` is unnecessary.

### 5.5. The `optional` Parameter

When chat history is empty (like the first turn), passing an empty list may cause errors. Setting `optional=True` ignores the variable when absent.

```python
MessagesPlaceholder("chat_history", optional=True)
```

## 6. RunnableGenerator and Custom Streaming Parser

LangChain's `StrOutputParser` is a general-purpose parser that converts LLM output to strings. However, if you need to replace or transform specific words during streaming, a custom parser is required. `RunnableGenerator` is a wrapper that allows Python generator functions to be connected to LCEL chains.

### 6.1. yield and Generators

`yield` is a `return` that sends values one at a time. While `return` terminates the function, `yield` **pauses the function** and passes a value. On the next request, execution continues from where it paused.

```python
# return: collects everything and returns at once
def get_all():
    return [1, 2, 3]

# yield: returns one at a time and pauses
def get_one_by_one():
    yield 1  # pauses here
    yield 2  # resumes and pauses here on next request
    yield 3

for n in get_one_by_one():
    print(n)  # 1, 2, 3
```

Functions that use `yield` are called **generators**. The key point is that since the function doesn't terminate, **local variables are preserved**. This property enables maintaining state (like a buffer) while processing streaming data.

### 6.2. Implementing a Custom Streaming Parser

The following example is a parser that replaces the word "태풍" (typhoon) with an emoji in LLM streaming responses.

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

Since replacement must happen at the word level, chunks are **accumulated in a buffer and split by spaces** rather than processed character by character. If emitted character by character, `"태"` and `"풍"` would be separated, making it impossible to recognize `"태풍"`.

### 6.3. Execution Flow

Assume the LLM response `"오늘 태풍이 옵니다"` arrives in the following chunks.

```
chunk1: "오늘"
│ buffer = "오늘"
│ No space → wait for next chunk
│
chunk2: " 태"
│ buffer = "오늘 태"
│ Space found → split → word="오늘", buffer="태"
│ yield "오늘 " → ⏸️ pause (buffer="태" preserved)
│ └→ for loop receives chunk="오늘 " → print
│ ▶️ resume, no space in buffer="태" → wait for next chunk
│
chunk3: "풍"
│ buffer = "태풍"
│ No space → wait for next chunk
│
chunk4: "이 옵"
│ buffer = "태풍이 옵"
│ Space found → split → word="태풍이", buffer="옵"
│ "태풍" → "🌪️ " replacement
│ yield "🌪️ 이 " → ⏸️ pause
│ └→ chunk="🌪️ 이 " received → print
│ ▶️ resume, no space in buffer="옵" → wait for next chunk
│
chunk5: "니다"
│ buffer = "옵니다"
│ No space → for loop ends
│
if buffer: ("옵니다" remaining)
│ yield "옵니다" → process last word
```

The final output is `오늘 🌪️ 이 옵니다`.

### 6.4. Consumer

`yield`ed values are not stored anywhere — they are generated and delivered one at a time whenever the consumer (`for` loop) requests them.

```python
result = ""
for chunk in chain.stream({"chat_history": chat_history}):
    print(chunk, end="", flush=True)  # yielded value arrives as chunk
    result += chunk
chat_history.append(AIMessage(content=result))
```

Each iteration of the `for` loop requests the next value from the generator, `yield` executes to pass the value, and then pauses again. There's no need to hold the entire result in memory — output can be displayed as soon as it arrives.

# Resources

- 올라마와 오픈소스 LLM을 활용한 AI 에이전트 개발 입문

# References

- <https://python.langchain.com/docs/concepts/few_shot_prompting/>
- <https://python.langchain.com/docs/concepts/lcel/>
- <https://python.langchain.com/docs/concepts/prompt_templates/>
