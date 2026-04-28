---
title: "[LLM] 네이티브 에이전트 프레임워크 Mollo 기획 - 기존 프레임워크 핵심 자산 분석"
ref: native-agent-framework-mollo-core-assets
excerpt: "Apple 플랫폼 네이티브 에이전트 프레임워크 Mollo 구현에 들어가기 전에 LangGraph, Koog, OpenAI Agents SDK, Pydantic AI, Mastra, MCP, Apple 프레임워크의 핵심 자산을 정리한다."
date: 2026-04-28T20:35+09:00
last_modified_at: 2026-04-28T20:35+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/native-agent-framework-mollo-core-assets.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/native-agent-framework-mollo-core-assets.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - Agent
  - Mollo
  - LangGraph
  - LangChain
  - Koog
  - MCP
  - Swift
  - Apple-Silicon
depth:
  - title: "Development"
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "LLM"
    url: /ko/development/ai/llm/
---

# 개요

Apple 플랫폼 네이티브 에이전트 프레임워크 Mollo 구현에 들어가기 전에 LangGraph, Koog, OpenAI Agents SDK, Pydantic AI, Mastra, MCP, Apple 프레임워크의 핵심 자산을 정리한다.

# 정리

## 1. 배경

직전 글에서는 MacBook Pro M5 Pro 위에 MLX와 Qwen 3.6 27B 6bit를 올려 로컬 LLM 환경을 만들었다. 그 작업의 진짜 목표는 단순한 추론 서버 구축이 아니라 그 위에서 굴릴 에이전트 프레임워크의 사전 준비다. 이번 글은 그 위에서 동작할 본체에 해당하는 Mollo의 기획 노트다.

Mollo는 iOS 15+/macOS 12+에서 동작하는 Swift 6 기반 에이전트 프레임워크이며 외부 의존성을 0으로 유지한다. 기획 단계에서 잡은 한 줄 정의는 iOS판 LangGraph다. Python LangGraph의 핵심 추상인 State Channel + Reducer, Durable Execution, Interrupt/Command, Parallel/Map, Subgraph를 Swift 6의 typed throws와 actor 동시성 위에 정통성 있게 이식하되 AppIntents, CloudKit, Keychain, BackgroundTasks, NaturalLanguage, Vision, Speech 같은 Apple 네이티브를 1등 시민으로 통합한다는 방향이다.

활용은 크게 세 갈래로 그리고 있다. 첫째는 앱 서비스 기능 자체에 에이전트를 심어 사용자 인텐트를 처리하는 방향이고 둘째는 앱 내 QA 자동화 도구로 화면 흐름을 점검하는 방향이며 셋째는 일정 정리, 문서 요약, 검색 같은 유틸리티 에이전트를 모듈로 두는 방향이다. 세 갈래 모두 데이터를 기기 밖으로 내보내지 않아도 되는 형태가 핵심이다.

구현 들어가기 전에 의도적으로 한 단계를 비워뒀다. 이미 시장에 자리 잡은 프레임워크들을 정독하고 무엇을 가져오고 무엇을 비워둘지부터 정리했다. 이 글은 그 정리의 결과다.

## 2. 분석 대상과 관점

분석 대상은 동시대에 활발히 움직이는 7개 프레임워크와 도구 프로토콜 1개, 그리고 그 위에 얹을 Apple 플랫폼이다. 구체적으로는 LangGraph, LangChain, Koog, OpenAI Agents SDK, Pydantic AI, Mastra, CrewAI를 살펴봤고 도구 표준으로 MCP를 함께 다뤘다. 수치와 버전은 별도 팩트시트의 2026-04-18 기준을 그대로 사용한다.

분석 관점은 일곱 가지로 잡았다. 그래프와 실행 모델, 상태 관리 방식, HITL과 인터럽트, LLM 프로바이더 추상, 도구 정의와 호출, 구조화 출력과 타입 안전, 그리고 플랫폼 통합이다. 이 일곱 가지는 Mollo의 모듈 경계와 거의 1:1로 대응한다. 각 프레임워크가 잘 풀어둔 자산을 그 자리에 그대로 떨어뜨릴 수 있는지를 기준으로 본다.

좋은 자산을 가져온다고 곧바로 차별점이 만들어지는 것은 아니다. 그래서 분석은 가져올 것을 추리는 작업과 동시에 채우지 않을 영역을 정하는 작업이기도 했다. 서버 사이드 풀스택, 분산 멀티 에이전트 런타임, 자체 벡터 DB는 Mollo 범위에서 의도적으로 뺀다.

## 3. LangGraph - 정통 계승의 원형

### 3.1. 핵심 자산

LangGraph는 LangChain Inc.가 만든 Python 프레임워크다. 2026-04-17에 1.1.7이 릴리스됐고 GitHub 스타는 29.5k다. iOS판 LangGraph 포지셔닝의 레퍼런스인 만큼 가장 정밀하게 봤다.

LangGraph의 시그니처는 다섯 가지다. State Channel + Reducer는 노드 간 데이터 전달을 dict 공유가 아니라 타입 있는 채널과 결합 규칙으로 모델링하는 방식이다. Durable Execution은 모든 노드 경계에서 상태를 자동 저장해 OS가 강제 종료시키더라도 thread_id로 재개할 수 있게 해주며 MemorySaver, PostgresSaver, AsyncPostgresSaver 같은 체크포인터로 구현한다. Interrupt/Command는 그래프 중간에서 사람의 개입을 요청하고 `Command(resume=...)`로 재개하는 HITL 표준이다. Parallel/Map은 `Send` API로 동적 맵-리듀스를 표현하고 정적 병렬 엣지도 함께 지원한다. Subgraph는 서브 그래프를 하나의 노드로 캡슐화해 재사용한다.

### 3.2. Mollo가 그대로 가져오는 이유

이 다섯 가지는 모두 LangGraph가 "검증한" 추상이다. 모바일 환경에서는 오히려 더 강하게 요구된다. 모바일 OS는 백그라운드 진입과 메모리 압박으로 프로세스를 강제 종료시키며 그 시점에 진행 중이던 도구 호출과 에이전트 사고 흐름을 잃지 않으려면 노드 경계 체크포인트가 필요하다. 사용자에게 결제 승인이나 권한 승인을 받아야 하는 흐름은 곧 HITL 인터럽트다. 즉 LangGraph가 서버용으로 정리해 둔 다섯 자산은 모바일에서 더 절실해진다. Mollo는 이를 그대로 가져오되 채널은 actor 기반 ExecutionContext에 올리고 reducer는 Sendable 타입으로 강제하며 인터럽트는 typed throws 경로로 전파한다.

## 4. Koog - JVM 진영의 동일 포지션

### 4.1. 핵심 자산

Koog는 JetBrains가 2025-05에 공개한 Kotlin 프레임워크다. 2026-03-26에 0.7.3이 릴리스됐고 1.0 미도달이다. 핵심은 LangGraph 스타일의 그래프 DSL을 Kotlin 네이티브로 제공한다는 점이다. Strategy 그래프, subgraph 공유 상태, `@Tool` DSL, 그래프 내 interrupt 노드, agent persistence 내장, Kotlin Flow 기반 스트리밍, OpenTelemetry 관측성을 갖췄다. 멀티플랫폼 타깃은 JVM, JS, WasmJS, Android, iOS다.

### 4.2. Mollo와의 직접 경쟁 구도

Koog는 Mollo와 가장 직접적으로 비교되는 프레임워크다. 둘 다 LangGraph 스타일 그래프와 iOS 타깃을 동시에 추구한다. 차이는 런타임과 DX다. Koog는 Kotlin Multiplatform이며 iOS 타깃은 Kotlin/Native 빌드와 네트워크 구성 조정을 거쳐 Swift에서 브리징해서 사용한다. iOS 지원은 가능하지만 Swift 네이티브 1등 시민 DX는 아니다. Mollo는 Swift 런타임 위에서 동작하고 App Intents, CloudKit, Keychain, NLEmbedding을 직접 다룬다. JetBrains의 엔지니어링 표준은 인정하되 Apple 생태계에 깊이 들어갈수록 Swift 네이티브의 가치가 커진다는 판단이다. Koog의 그래프 DSL과 persistence 모델은 추상 수준에서 참고하되 구현은 Swift의 actor와 typed throws로 새로 짠다.

## 5. OpenAI Agents SDK - 미니멀리즘과 Handoff

### 5.1. 핵심 자산

OpenAI Agents SDK는 OpenAI Solution Team이 Swarm을 대체해 2025-03에 공개한 프레임워크다. 2026-04-09 기준 GitHub 스타 20.7k에 기여자 241명, 코드 규모는 5k-10k SLOC로 의도적으로 작게 설계됐다. Agent는 `Agent(name=, instructions=, tools=, handoffs=, model=)` 한 줄 클래스이며 명시적인 State 객체가 없다. 메시지 히스토리와 Sessions 메모리 계층, `@function_tool` 데코레이터 한 줄 정의, `handoffs=[...]`에 다른 Agent를 나열하면 자동으로 `transfer_to_<name>` 도구가 생성되는 패턴, `needs_approval` 플래그 기반 툴 단위 승인, 그리고 Realtime 음성 워크플로우가 시그니처다.

### 5.2. Mollo가 부분만 가져온 이유

OpenAI Agents SDK는 작은 API 표면에서 큰 사용성을 끌어내는 좋은 예다. 두 측면을 가져온다. 하나는 Agent 생성자의 단순함이며 다른 하나는 `needs_approval` 류의 도구 단위 승인 플래그다. 다만 그래프와 채널이 없는 점은 Mollo의 방향과 다르다. 모바일은 백그라운드 강제 종료와 멀티턴 도구 호출이 동시에 발생하는 환경이라 흐름을 명시적인 그래프로 잡아두는 편이 디버깅과 복구 모두에 유리하다. 그래서 Mollo는 OpenAI 식의 짧은 생성자를 기본 진입점으로 두면서도 그 안에서 Strategy Graph가 자동으로 짜이게 한다. Handoff도 자동 도구 생성이 아니라 서브그래프 실행 + 메시지 필터링으로 풀어낸다.

## 6. Pydantic AI - 타입 안전 구조화 출력

### 6.1. 핵심 자산

Pydantic AI는 Pydantic Services가 만든 Python 프레임워크다. 2026-04-16에 1.84.0이 릴리스됐고 GitHub 스타는 16.4k다. Agent를 `Agent[Deps, Output]` 제네릭 클래스로 표현하고 `output_type`으로 출력 스키마를 고정하며 의존성 주입을 1급 시민으로 둔다. Tool은 `@agent.tool` 데코레이터에서 `RunContext[Deps]`로 의존을 받고 멀티모달은 ImageUrl, AudioUrl, VideoUrl, DocumentUrl, BinaryContent로 직접 표현한다. MCP는 공식 지원이고 Durable Execution은 Temporal과 DBOS, Prefect 통합으로 위임한다. 관측성은 Pydantic Logfire를 통한 OpenTelemetry로 묶인다.

### 6.2. Agent\<Output\> 제네릭의 차용

Mollo가 Pydantic AI에서 곧장 가져오는 한 가지는 제네릭 출력 타입이다. Mollo의 Agent는 `Agent<Output: Codable & Sendable>`이며 Pydantic AI의 `Agent[Deps, Output]`과 같은 발상으로 출발했다. Swift는 컴파일 타임에 출력 타입을 보장하기 때문에 런타임 검증에 의존하는 Pydantic보다 한 발 더 나간다. Pydantic AI의 의존성 주입은 흥미로운 접근이지만 Mollo는 actor 기반 ExecutionContext로 같은 문제를 푼다. Durable Execution을 Temporal에 위임하는 선택은 따라가지 않는다. iOS는 외부 워크플로우 엔진을 끌어들일 수 없는 환경이라 체크포인터를 SQLite와 인메모리, 암호화 저장소에 직접 구현해야 한다.

## 7. Mastra - TS 네이티브 포지션

### 7.1. 핵심 자산

Mastra는 Gatsby 창업 팀이 만든 TypeScript 프레임워크다. 2024-10에 공개됐고 2026-01에 1.0 GA를 찍었으며 2026-03-24 기준 GitHub 스타 22.3k에 월간 npm 다운로드 180만 건을 기록 중이다. 핵심은 Workflow 그래프, Memory(Working/Conversation/Semantic) 3계층, RAG, Deployer를 한 프레임워크에 통합한 점이다. Tool은 `createTool({ id, inputSchema: z.object(...), outputSchema, execute })`로 Zod 스키마와 묶여 정의되고 워크플로우의 `.parallel()`과 `.branch()`, `.waitForInput()`이 그래프와 HITL의 1급 시민이다. Vercel AI SDK 위에서 동작하며 Next.js와 Cloudflare Workers 같은 엣지 런타임과의 통합이 매끄럽다.

### 7.2. 같은 "특정 플랫폼 1등 시민" 접근의 비교

Mastra가 Mollo에게 흥미로운 이유는 같은 전략을 다른 플랫폼에서 실행하고 있어서다. Mastra는 Vercel과 Next.js 생태계의 1등 시민으로 자리 잡으려 하고 Mollo는 Apple 생태계에서 같은 자리를 노린다. 워크플로우 그래프 + 스토리지 + 메모리를 한 프레임워크에 묶어주는 통합 방식은 Mollo가 9개 모듈로 분리한 형태와 다르지만 사용자 입장의 묶음 단위는 비슷하다. 다만 Mastra가 의존하는 Vercel AI SDK는 Mollo가 따라갈 수 없는 선택이다. 외부 의존 0이 Mollo의 약속이라 같은 역할을 하는 LLMClientRouter와 RateLimitedProvider, CachedProvider, CostTrackedProvider를 직접 만든다. Zod의 매끄러운 스키마 DX는 Codable과 제네릭 조합으로 비슷한 감각을 만들 수 있는지 검증해봐야 한다.

## 8. MCP - 도구 프로토콜 표준

### 8.1. 핵심 자산

MCP(Model Context Protocol)는 Anthropic이 주도해 표준화한 도구 연결 프로토콜이다. JSON-RPC 2.0 위에 구축되며 stdio, HTTP+SSE, WebSocket 트랜스포트를 정의한다. 클라이언트가 서버의 도구를 발견하고 호출하는 단방향이 아니라 서버가 클라이언트에 sampling, roots list, logging, progress 같은 요청을 보내는 양방향이라는 점이 핵심이다. 프로토콜 버전은 2025-06-18 spec이 최신이다.

### 8.2. Mollo의 통합 방식

MCP는 Mollo가 그대로 가져오는 표준이다. MolloMCP 모듈은 JSON-RPC 2.0 클라이언트와 stdio, HTTP+SSE, WebSocket 트랜스포트를 직접 구현하고 프로토콜 버전을 2025-06-18로 설정한다. 서버 발신 요청은 `MCPRequestHandler`와 `MCPNotificationHandler`로 받고 멀티 서버 라이프사이클은 `MCPServerManager`로 관리한다. 외부 의존 0 원칙 때문에 mcp 공식 SDK도 끌어들이지 않고 Foundation의 URLSession과 Network.framework만으로 트랜스포트 세 종류를 모두 구현한다. 이 영역에서는 LangGraph의 `langchain-mcp-adapters`, OpenAI Agents SDK의 hosted MCP, Mastra의 공식 지원과 동일선에서 출발한다.

## 9. Apple 플랫폼 - 네이티브 1등 시민

여기서부터가 Mollo의 진짜 차별점이다. 다른 어떤 프레임워크도 Apple 프레임워크를 일등 시민으로 다루지 않는다. Koog가 KMP를 통해 iOS 타깃을 지원하긴 하지만 Apple 프레임워크 통합은 사용자 책임으로 남긴다.

### 9.1. AppIntents

`AppIntentsAgent<Output>`은 에이전트를 그대로 Siri와 Shortcuts에 노출시킨다. iOS의 음성 앱 인텐트가 곧 에이전트 호출이 되며 사용자는 Siri에 명령을 내리는 것만으로 Mollo 그래프를 트리거한다.

### 9.2. CloudKit

`CloudKitSessionSync`는 세션을 사용자 iCloud에 동기화한다. 옵티미스틱 락으로 동시 편집을 처리하며 1MB를 넘는 메시지는 CKAsset으로 보낸다. iPhone과 Mac, iPad가 같은 대화 흐름을 공유하는 멀티 디바이스 시나리오의 표준 경로다.

### 9.3. Keychain

`KeychainCredentialStore`는 API 키와 OAuth 토큰을 Keychain에 저장하고 `Accessibility` 정책과 `SecAccessControl` Biometric 플래그를 받는다. Touch ID나 Face ID 인증을 통과해야만 토큰이 풀리도록 강제할 수 있다.

### 9.4. BackgroundTasks

`BackgroundExecution`은 BGAppRefreshTask와 BGProcessingTask 위에서 동작한다. 사용자가 앱을 백그라운드로 보내도 진행 중이던 그래프는 체크포인트에 저장되고 OS가 허락한 시간 안에 재개되거나 다음 포그라운드 진입에서 이어진다. 모바일 OS의 강제 종료와 정면으로 맞붙는 영역이다.

### 9.5. Vision/Speech

`VisionTool`은 VNRecognizeTextRequest 기반 OCR을 도구로 노출하고 `SpeechInputTool`은 SFSpeechRecognizer로 마이크 입력을 텍스트로 바꾼다. `ImageSource`와 `AudioSource`, `VideoSource` enum이 URL, Data, UIImage, CGImage, CVPixelBuffer, AVAudioPCMBuffer, AVAsset을 한 번에 받아준다. 멀티모달은 v1부터 옵션이 아니라 코어 기능이다.

### 9.6. MLX Swift / Core ML

`MLXProvider`와 `CoreMLProvider`는 엔진을 외부에서 주입할 수 있는 이음매를 갖는다. Mollo는 MLX Swift나 Core ML 모델 하나에 강하게 묶이지 않으면서도 호출자가 원할 때 둘 중 어느 쪽이든 끼워 넣을 수 있도록 설계한다. 직전 글에서 만든 mlx_lm.server는 OpenAI 호환 엔드포인트를 제공하므로 OpenAICompatible 프로바이더로도 그대로 붙는다.

### 9.7. NLEmbedding

`NLEmbeddingMemory`는 Apple의 NaturalLanguage 프레임워크가 제공하는 단어/문장 임베딩을 그대로 사용해 온디바이스 시맨틱 검색을 푼다. SQLite FTS5 기반의 `SQLiteMemory`와 함께 두 갈래의 메모리 백엔드를 구성한다. 외부 벡터 DB를 끌어들이지 않고 Apple 프레임워크만으로 RAG의 검색 측을 채울 수 있다는 점이 의미다.

## 10. 종합 - Mollo 핵심 모듈 매핑

분석한 자산을 Mollo v2.0.2의 9개 모듈에 어떻게 떨어뜨리는지 한 번에 정리한다.

- `MolloCore`는 LangGraph의 다섯 시그니처(State Channel + Reducer, Durable Execution 인터페이스, Interrupt/Command, Parallel/Map, Subgraph)와 OpenAI Agents SDK의 짧은 Agent 생성자, Pydantic AI의 `Agent<Output>` 제네릭이 모이는 모듈이다
- `MolloPersistence`는 LangGraph의 Checkpointer를 Swift로 옮긴 자리다. SQLite와 InMemory, Encrypted(AES-256-GCM envelope) 백엔드를 직접 구현하며 메모리는 NLEmbeddingMemory와 SQLiteMemory로 가른다
- `MolloProviders`는 Anthropic, OpenAI, Google Gemini, DeepSeek, Ollama와 OpenAI 호환 엔드포인트를 다루는 모듈이다. LLMClientRouter의 fallback/roundRobin/priority 전략과 RateLimited/Cached/CostTracked 데코레이터가 들어간다. Mastra가 Vercel AI SDK에 위임한 영역을 직접 짠다
- `MolloMCP`는 MCP 표준이 들어오는 자리다. JSON-RPC 2.0 클라이언트와 stdio/HTTP+SSE/WebSocket 트랜스포트, 서버 발신 요청 핸들러를 직접 구현한다
- `MolloTools`는 OpenAI Agents SDK의 `@function_tool`과 같은 도구 정의 추상을 두고 FileRead/Write/Edit, GrepSearch, GlobSearch, ShellTool(macOS, Command Injection 방어), WebFetchTool(SSRF 방어)을 기본 제공한다
- `MolloMultimodal`은 Vision과 Speech, ImageSource/AudioSource/VideoSource를 묶는다. Pydantic AI가 ImageUrl/AudioUrl/VideoUrl로 풀어둔 자리를 Apple 프레임워크 직결로 푼다
- `MolloApple`은 AppIntents, CloudKit, Keychain, HybridRouter, BackgroundExecution, MemoryPressureHandler가 모이는 Apple 1등 시민 모듈이다. 다른 프레임워크에는 사실상 대응되는 모듈이 없다
- `MolloAuth`는 OAuth 2.0 PKCE를 구현하며 `CredentialStore` 프로토콜만 노출하고 Keychain 구현은 MolloApple 쪽에서 주입받는다. 역의존이 발생하지 않도록 가른 결과다
- `MolloObservability`는 `TraceSpan`과 `TraceCollector`, `JSONFileTraceExporter`, `os.Logger` 기반 `AgentLogger`, `RateLimiter`와 `CostTracker`가 들어간다. Pydantic AI의 Logfire 자리를 OS 표준 도구만으로 채운다

## 11. 마치며

분석을 마치고 두 가지가 분명해졌다. 하나는 LangGraph가 정리한 다섯 자산이 더 이상 한 프레임워크의 특이한 추상이 아니라 에이전트 영역의 검증된 표준에 가깝다는 점이다. Koog가 같은 추상을 Kotlin으로 옮겼고 Mastra와 Pydantic AI도 비슷한 기능을 다른 이름으로 풀어내고 있다. Mollo가 이 자산을 Swift로 옮기는 것은 새로운 발명이 아니라 검증된 자리의 정통 이식이다.

다른 하나는 그 자산 위에 Apple 플랫폼 통합을 1등 시민으로 올리는 자리는 여전히 비어 있다는 점이다. Koog가 KMP로 iOS를 지원해도 AppIntents와 CloudKit, Keychain, BackgroundTasks, NLEmbedding을 코어로 끌어안은 프레임워크는 아직 없다. 모바일 OS의 강제 종료와 백그라운드 제약, 음성 인텐트, 멀티 디바이스 동기화 같은 모바일 고유 문제는 Apple 프레임워크와 정합성을 가질 때 비로소 깔끔하게 풀린다. Mollo가 채울 자리는 그 공백이다.

여기까지가 구현 들어가기 전에 정리해 둘 자산의 전부다. 다음 단계는 본격 구현이다.

# 참고

- <https://docs.koog.ai/>
- <https://docs.langchain.com/oss/python/langgraph>
- <https://github.com/JetBrains/koog>
- <https://github.com/langchain-ai/langchain>
- <https://github.com/langchain-ai/langgraph>
- <https://github.com/mastra-ai/mastra>
- <https://github.com/openai/openai-agents-python>
- <https://github.com/pydantic/pydantic-ai>
- <https://mastra.ai/docs>
- <https://modelcontextprotocol.io>
- <https://openai.github.io/openai-agents-python/>
