---
title: "[LLM] LangChain 핵심 개념 - LCEL, 프롬프트 템플릿, 메시지 클래스"
ref: langchain-core-concepts
excerpt: "LangChain의 LCEL, 프롬프트 템플릿, 메시지 클래스, MessagesPlaceholder, RunnableGenerator를 정리한다."
date: 2026-02-27T17:40+09:00
last_modified_at: 2026-02-27T17:40+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/langchain-core-concepts.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/langchain-core-concepts.png"
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
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "LLM"
    url: /ko/development/ai/llm/
---

# 개요

LangChain의 LCEL, 프롬프트 템플릿, 메시지 클래스, MessagesPlaceholder, RunnableGenerator를 정리한다.

# 정리

## 1. 프롬프트 엔지니어링

LLM은 같은 모델이라도 프롬프트에 따라 완전히 다른 품질의 결과를 내놓는다. 막연한 질문에는 막연한 답이 나오고 구체적이고 구조화된 프롬프트에는 정확하고 유용한 답이 나온다.

프롬프트 엔지니어링이 중요한 이유는 아래와 같다.

- 비용 효율성 - 파인튜닝이나 더 큰 모델로 업그레이드하지 않아도 프롬프트 개선만으로 성능을 높일 수 있다
- 할루시네이션 감소 - 역할 부여, 제약 조건 명시, 출력 형식 지정 등으로 모델이 사실 기반 응답을 하도록 유도할 수 있다
- 일관된 출력 - JSON이나 마크다운 테이블 같은 형식을 지정하면 후처리 없이 바로 사용할 수 있는 구조화된 결과를 얻을 수 있다
- 복잡한 추론 - Chain-of-Thought이나 Few-shot 같은 기법으로 모델이 단계별로 사고하게 하면 논리적 정확도가 올라간다
- 안전성 - 시스템 프롬프트로 경계를 설정하면 부적절한 응답이나 프롬프트 인젝션을 방어할 수 있다

주요 기법을 정리하면 아래와 같다.

| 기법 | 설명 |
|---|---|
| Zero-shot | 예시 없이 지시만으로 수행 |
| Few-shot | 입출력 예시를 함께 제공 |
| Chain-of-Thought | "단계별로 생각해봐"로 추론 과정을 유도 |
| Role prompting | "너는 ~전문가야"로 역할 부여 |
| Self-consistency | 같은 질문을 여러 번 시도해서 다수결 |

프롬프트 엔지니어링은 LLM 활용에서 가장 적은 비용으로 가장 큰 성능 차이를 만드는 방법이다. 모델을 바꾸기 전에 프롬프트를 먼저 개선하는 것이 우선이고 AI 에이전트나 RAG 파이프라인을 구축할 때도 각 단계의 프롬프트 품질이 전체 시스템 성능을 결정한다.

## 2. LCEL(LangChain Expression Language)

LCEL은 LangChain 컴포넌트를 파이프 연산자(`|`)로 연결해서 체인을 선언적으로 구성하는 문법이다. 모든 컴포넌트가 공통 `Runnable` 인터페이스를 구현하므로 자유롭게 조합할 수 있다.

```python
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"question": "LCEL이 뭐야?"})
```

데이터가 파이프라인을 순서대로 흐른다. prompt → LLM → output parser 순으로 한 줄에 표현할 수 있다.

### 2.1. 장점

- 간결한 선언적 구성 - 복잡한 체인도 파이프 연산자로 직관적으로 표현할 수 있다
- 통일된 인터페이스 - 모든 컴포넌트가 `Runnable`을 구현하므로 `invoke`, `stream`, `batch`, `ainvoke` 등을 일관되게 사용할 수 있다
- 스트리밍/비동기 기본 지원 - `.stream()`, `.ainvoke()` 등을 별도 코드 없이 바로 사용할 수 있다
- 조합성 - retriever, prompt, LLM, parser 등을 레고 블록처럼 조립할 수 있어서 RAG 같은 패턴을 쉽게 구현할 수 있다
- 병렬 실행 - `RunnableParallel`로 독립적인 작업을 동시에 실행할 수 있다

### 2.2. 단점

- 디버깅 어려움 - 파이프라인 중간에 오류가 발생하면 어디서 문제가 생겼는지 추적하기 어렵다
- 학습 곡선 - `RunnablePassthrough`, `RunnableParallel`, `RunnableLambda` 등 LCEL 고유 개념을 별도로 익혀야 한다
- 암묵적 데이터 흐름 - 코드만 보고 단계 사이에 어떤 데이터가 전달되는지 파악하기 어려울 수 있다
- 복잡한 분기 - 조건 분기나 에러 핸들링이 순수 Python 코드보다 복잡해질 수 있다
- 과도한 추상화 - 단순한 작업도 Runnable 래핑이 필요해서 오버헤드처럼 느껴질 수 있다

### 2.3. RAG 예시

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

answer = chain.invoke("LCEL이 뭐야?")
```

`retriever | format_docs`로 중간 처리를 파이프로 연결하고 딕셔너리로 감싸면 병렬 실행이 된다. 결과가 합쳐져서 다음 단계로 전달된다.

## 3. 프롬프트 템플릿

프롬프트 템플릿은 변수가 포함된 프롬프트 틀이다. `{변수명}` 자리표시자가 포함된 고정 텍스트에 런타임에 실제 값을 채워서 완성된 프롬프트를 만든다.

### 3.1. PromptTemplate

단순 문자열 템플릿으로 completion 모델에 사용한다.

```python
from langchain_core.prompts import PromptTemplate

prompt = PromptTemplate.from_template(
    "{topic}에 대해 설명해줘"
)
prompt.invoke({"topic": "프롬프트 엔지니어링"})
```

### 3.2. ChatPromptTemplate

채팅 모델용 템플릿으로 system/human/ai 메시지를 구조화한다. 가장 많이 사용되는 타입이다.

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "너는 {input_language}를 {output_language}로 번역하는 도우미야."),
    ("human", "{input}")
])

prompt.invoke({
    "input_language": "한국어",
    "output_language": "영어",
    "input": "안녕하세요"
})
```

`from_template`과 `from_messages`의 차이점은 아래와 같다.

| | `from_template` | `from_messages` |
|---|---|---|
| 메시지 수 | human 1개만 | 여러 개 자유 구성 |
| 시스템 메시지 | 불가능 | 가능 |
| Few-shot 예시 | 불가능 | 가능(human/ai 쌍 추가) |
| 사용처 | 단순 질의 | 역할 부여, 대화 구조 |

역할이나 제약 조건을 설정하는 시스템 메시지가 거의 항상 필요하므로 실무에서는 `from_messages`를 훨씬 많이 사용한다.

### 3.3. FewShotChatMessagePromptTemplate

Few-shot 예시를 포함하는 템플릿이다. 입출력 쌍을 제공해서 모델의 응답 패턴을 유도한다.

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

### 3.4. LCEL 체인과 결합

프롬프트 템플릿은 `Runnable`을 구현하므로 파이프 연산자로 체인에 바로 연결할 수 있다.

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

핵심은 프롬프트를 하드코딩하지 않고 재사용 가능한 템플릿으로 관리하는 것이다. 변수만 바꾸면 다양한 입력에 대응할 수 있다.

| 타입 | 용도 |
|---|---|
| `PromptTemplate` | 단순 문자열 completion 모델 |
| `ChatPromptTemplate` | 채팅 모델(system/human/ai 메시지 구조) |
| `FewShotChatMessagePromptTemplate` | Few-shot 예시 포함 |

## 4. 메시지 클래스

LangChain은 채팅 모델의 메시지를 역할별로 구분하는 클래스를 제공한다. 모든 메시지 클래스는 `BaseMessage`를 상속하며 `content`(내용)와 `role`(역할) 속성을 공통으로 가진다.

### 4.1. 주요 클래스

| 클래스 | 역할 | 설명 |
|---|---|---|
| `BaseMessage` | - | 모든 메시지의 부모 클래스. 직접 사용하지 않고 하위 클래스를 사용한다 |
| `SystemMessage` | system | 모델의 동작 방식을 지시한다. 역할 부여, 제약 조건, 출력 형식 등을 설정한다 |
| `HumanMessage` | human | 사용자의 입력 메시지 |
| `AIMessage` | ai | 모델의 응답 메시지. `tool_calls` 속성으로 도구 호출 정보를 포함할 수 있다 |
| `AIMessageChunk` | ai | 스트리밍 중 도착하는 응답의 부분 조각. `content`를 누적해서 전체 응답을 구성한다 |
| `ToolMessage` | tool | 도구 실행 결과를 모델에 전달한다. `tool_call_id`로 어떤 호출의 결과인지 연결한다 |
| `ChatMessage` | 커스텀 | `role`을 임의로 지정할 수 있는 범용 메시지. 표준 역할에 맞지 않을 때 사용한다 |
| `FunctionMessage` | function | OpenAI의 레거시 function calling API용. deprecated - `ToolMessage`를 사용한다 |

### 4.2. 기본 사용법

`ChatPromptTemplate.from_messages`에서 튜플의 첫 번째 요소(`"system"`, `"human"`, `"ai"`)가 메시지 클래스에 대응한다.

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

# 튜플 방식(간편)
prompt = ChatPromptTemplate.from_messages([
    ("system", "너는 도우미야."),
    ("human", "{input}"),
])

# 객체 방식(명시적)
prompt = ChatPromptTemplate.from_messages([
    SystemMessage(content="너는 도우미야."),
    ("human", "{input}"),
])
```

채팅 히스토리를 구성할 때는 `HumanMessage`와 `AIMessage` 객체를 직접 생성해서 리스트에 추가한다.

```python
chat_history = []
chat_history.append(HumanMessage(content="안녕"))
chat_history.append(AIMessage(content="안녕하세요!"))
```

### 4.3. ToolMessage

에이전트가 도구를 호출하면 `AIMessage`의 `tool_calls`에 호출 정보가 담기고 도구 실행 결과는 `ToolMessage`로 모델에 다시 전달한다. `tool_call_id`로 어떤 호출에 대한 응답인지 매칭한다.

```python
from langchain_core.messages import AIMessage, ToolMessage

ai_message = AIMessage(
    content=[],
    tool_calls=[{
        "name": "get_weather",
        "args": {"location": "서울"},
        "id": "call_123"
    }]
)

tool_message = ToolMessage(
    content="맑음, 25°C",
    tool_call_id="call_123"
)
```

### 4.4. AIMessageChunk

스트리밍 응답을 받을 때는 `AIMessageChunk`가 조각 단위로 도착한다. `chunk.content`를 이어 붙이면 전체 응답이 된다.

### 4.5. ChatMessage

표준 역할(`system`, `human`, `ai`, `tool`)에 해당하지 않는 커스텀 역할이 필요할 때 사용한다.

```python
from langchain_core.messages import ChatMessage

msg = ChatMessage(
    role="moderator",
    content="이 대화는 안전 가이드라인을 따릅니다."
)
```

## 5. MessagesPlaceholder

`MessagesPlaceholder`는 프롬프트 템플릿에 메시지 목록을 동적으로 삽입하는 자리표시자다. 일반 변수(`{input}`)는 단일 문자열을 대입하지만 `MessagesPlaceholder`는 여러 메시지 객체를 통째로 삽입한다.

### 5.1. 왜 필요한가

채팅 히스토리는 human/ai 메시지가 번갈아 나오는 리스트다. 일반 문자열 변수로는 이런 구조를 표현할 수 없으므로 메시지 리스트 전용 자리표시자가 필요하다.

### 5.2. 사용법

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

prompt = ChatPromptTemplate.from_messages([
    ("system", "너는 친절한 도우미야."),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])
```

호출 시 `chat_history`에 메시지 리스트를 전달한다.

```python
from langchain_core.messages import HumanMessage, AIMessage

prompt.invoke({
    "chat_history": [
        HumanMessage(content="내 이름은 민수야"),
        AIMessage(content="안녕하세요 민수님!"),
    ],
    "input": "내 이름이 뭐였지?"
})
```

결과 메시지 구조는 아래와 같다.

```
SystemMessage:  "너는 친절한 도우미야."
HumanMessage:   "내 이름은 민수야"          <- chat_history
AIMessage:      "안녕하세요 민수님!"         <- chat_history
HumanMessage:   "내 이름이 뭐였지?"         <- input
```

### 5.3. 주요 용도

| 용도 | 설명 |
|---|---|
| 채팅 히스토리 | 이전 대화를 유지해서 맥락 있는 응답 |
| Few-shot 예시 | 예시 메시지를 동적으로 주입 |
| Agent scratchpad | 에이전트의 중간 추론 과정(도구 호출/결과)을 삽입 |

### 5.4. `{}`로 감싸지 않는 이유

```python
[
    ("system", "..."),                        # 튜플 -> 문자열 템플릿
    MessagesPlaceholder("chat_history"),      # 객체 -> 메시지 리스트 자리표시자
    ("human", "{question}"),                  # 튜플 -> 문자열 템플릿
]
```

`{question}`은 문자열 변수다. 문자열 안에서 대입 위치를 표시하는 Python의 format 문법이다. 반면 `MessagesPlaceholder("chat_history")`는 이미 별도 객체로 선언되었으므로 `"chat_history"`는 단순히 변수 이름을 지정하는 생성자 인자다. 문자열 대입이 아니라 해당 이름으로 전달된 메시지 리스트를 통째로 삽입하는 것이므로 `{}`가 필요 없다.

### 5.5. `optional` 파라미터

대화 첫 턴처럼 채팅 히스토리가 비어있을 때 빈 리스트를 전달하면 에러가 발생할 수 있다. `optional=True`로 설정하면 변수가 없을 때 무시한다.

```python
MessagesPlaceholder("chat_history", optional=True)
```

## 6. RunnableGenerator와 커스텀 스트리밍 파서

LangChain의 `StrOutputParser`는 LLM 출력을 문자열로 변환하는 범용 파서다. 하지만 스트리밍 중에 특정 단어를 치환하거나 가공하려면 커스텀 파서가 필요하다. `RunnableGenerator`는 Python 제너레이터 함수를 LCEL 체인에 연결할 수 있게 해주는 래퍼다.

### 6.1. yield와 제너레이터

`yield`는 값을 하나씩 내보내는 `return`이다. `return`은 함수를 종료하지만 `yield`는 함수를 일시정지시키고 값을 넘긴다. 다음 요청이 올 때 멈춘 지점에서 이어서 실행한다.

```python
# return: 전부 모아서 한 번에 반환
def get_all():
    return [1, 2, 3]

# yield: 하나씩 반환하고 멈춤
def get_one_by_one():
    yield 1  # 여기서 멈춤
    yield 2  # 다음 요청 시 여기서 멈춤
    yield 3

for n in get_one_by_one():
    print(n)  # 1, 2, 3
```

`yield`를 사용하는 함수를 제너레이터(generator)라고 부른다. 핵심은 함수가 종료되지 않으므로 지역 변수가 유지된다는 것이다. 이 특성 덕분에 스트리밍 중 상태(buffer 등)를 유지하면서 데이터를 처리할 수 있다.

### 6.2. 커스텀 스트리밍 파서 구현

아래 예제는 LLM 스트리밍 응답에서 "태풍"이라는 단어를 이모지로 치환하는 파서다.

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

단어 단위로 치환해야 하므로 글자 단위가 아닌 공백 단위로 buffer에 모아서 처리한다. 글자 단위로 내보내면 `"태"`와 `"풍"`이 분리되어 `"태풍"`을 인식할 수 없기 때문이다.

### 6.3. 동작 흐름

LLM 응답 `"오늘 태풍이 옵니다"`가 아래 청크로 도착한다고 가정한다.

```
청크1: "오늘"
│ buffer = "오늘"
│ 공백 없음 → 다음 청크 기다림
│
청크2: " 태"
│ buffer = "오늘 태"
│ 공백 발견 → split → word="오늘", buffer="태"
│ yield "오늘 " → ⏸️ 멈춤(buffer="태" 유지)
│ └→ for 루프에서 chunk="오늘 " 수신 → print
│ ▶️ 재개, buffer="태"에 공백 없음 → 다음 청크 기다림
│
청크3: "풍"
│ buffer = "태풍"
│ 공백 없음 → 다음 청크 기다림
│
청크4: "이 옵"
│ buffer = "태풍이 옵"
│ 공백 발견 → split → word="태풍이", buffer="옵"
│ "태풍" → "🌪️ " 치환
│ yield "🌪️ 이 " → ⏸️ 멈춤
│ └→ chunk="🌪️ 이 " 수신 → print
│ ▶️ 재개, buffer="옵"에 공백 없음 → 다음 청크 기다림
│
청크5: "니다"
│ buffer = "옵니다"
│ 공백 없음 → for 루프 종료
│
if buffer: ("옵니다" 남아있음)
│ yield "옵니다" → 마지막 단어 처리
```

최종 출력은 `오늘 🌪️ 이 옵니다`가 된다.

### 6.4. Consumer

`yield`된 값은 어딘가에 저장되지 않고 consumer(`for` 루프)가 요청할 때마다 하나씩 생성되어 전달된다.

```python
result = ""
for chunk in chain.stream({"chat_history": chat_history}):
    print(chunk, end="", flush=True)  # yield된 값이 chunk로 들어옴
    result += chunk
chat_history.append(AIMessage(content=result))
```

`for` 루프가 한 바퀴 돌 때마다 제너레이터에 다음 값을 요청하고 `yield`가 실행되어 값을 넘긴 뒤 다시 멈춘다. 전체 결과를 메모리에 들고 있을 필요 없이 도착하는 대로 화면에 출력할 수 있다.

# 리소스

- 올라마와 오픈소스 LLM을 활용한 AI 에이전트 개발 입문

# 참고

- <https://python.langchain.com/docs/concepts/few_shot_prompting/>
- <https://python.langchain.com/docs/concepts/lcel/>
- <https://python.langchain.com/docs/concepts/prompt_templates/>
