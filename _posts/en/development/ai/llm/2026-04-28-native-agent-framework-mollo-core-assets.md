---
title: "[LLM] Planning a Native Agent Framework Mollo - Analyzing Core Assets of Existing Frameworks"
ref: native-agent-framework-mollo-core-assets
lang: en
permalink: /en/:categories/:title/
excerpt: "Before implementing Mollo, an Apple-platform-native agent framework, I summarize the core assets of LangGraph, Koog, OpenAI Agents SDK, Pydantic AI, Mastra, MCP, and Apple frameworks."
date: 2026-04-28T20:35+09:00
last_modified_at: 2026-04-28T20:35+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/native-agent-framework-mollo-core-assets.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/native-agent-framework-mollo-core-assets.png"
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
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "LLM"
    url: /en/development/ai/llm/
---

# Overview

Before implementing Mollo, an Apple-platform-native agent framework, I summarize the core assets of LangGraph, Koog, OpenAI Agents SDK, Pydantic AI, Mastra, MCP, and Apple frameworks.

# Summary

## 1. Background

The previous post built a local LLM environment on a MacBook Pro M5 Pro with MLX and Qwen 3.6 27B 6bit. The real goal of that work was not just an inference server but the groundwork for an agent framework that would run on top of it. This post is a planning note for that body of work, Mollo.

Mollo is a Swift 6 agent framework that targets iOS 15+ / macOS 12+ and keeps zero external dependencies. The one-line definition I settled on during planning is "iOS-equivalent of LangGraph". The plan is to port the core abstractions of Python LangGraph - State Channel + Reducer, Durable Execution, Interrupt/Command, Parallel/Map, and Subgraph - onto Swift 6 typed throws and actor concurrency in a faithful way, while treating Apple-native services such as AppIntents, CloudKit, Keychain, BackgroundTasks, NaturalLanguage, Vision, and Speech as first-class citizens.

I picture three usage tracks. The first embeds an agent inside an app's service features to handle user intents. The second uses agents as in-app QA automation that walks through screen flows. The third positions schedule organization, document summarization, and search as utility agent modules. All three share a property: data does not have to leave the device.

I deliberately left a step empty before implementation. I read through the frameworks already established in the market and decided what to bring in and what to leave out first. This post is the result of that triage.

To add some context, Mollo is not a project I am building to compete with anyone in the commercial product space. It is a personal research project that started from academic curiosity, simply because building the framework myself sounded like it would be fun. To be honest, by the time I finish polishing this and put it out, another Swift-native framework with a similar concept will likely have appeared first. Even so, the primary motivation is to see the experience of directly handling Swift 6's concurrency model, the mobile lifecycle, and Apple-native assets all the way through to completion. Underneath sits a long-standing conviction that to really use something well you have to dig into how it actually works from the ground up. So the analysis that follows reads less as a comparison of who is better and more as a planning note on how to carefully port already-validated abstractions onto the Apple platform.

## 2. Targets and Perspective of the Analysis

The analysis covers seven frameworks, one tool protocol, and the Apple platform that sits underneath. Specifically I looked at LangGraph, LangChain, Koog, OpenAI Agents SDK, Pydantic AI, Mastra, and CrewAI, with MCP covered as the tool standard. Numbers and versions follow a separate fact sheet dated 2026-04-18.

I framed the analysis around seven perspectives. Graph and execution model, state management, HITL and interrupts, LLM provider abstraction, tool definition and invocation, structured output and type safety, and platform integration. These seven map almost one-to-one to Mollo's module boundaries. The criterion is whether the assets each framework has refined can drop into the corresponding module as-is.

Bringing in good assets does not by itself create a differentiator. So the analysis was simultaneously about choosing what to fill and what to deliberately leave out. Server-side full stack, distributed multi-agent runtimes, and a homegrown vector DB are out of Mollo's scope on purpose.

## 3. LangGraph - The Original of Faithful Inheritance

### 3.1. Core Assets

LangGraph is a Python framework built by LangChain Inc. Version 1.1.7 was released on 2026-04-17 and the GitHub star count is 29.5k. As the reference for the "iOS-equivalent of LangGraph" positioning, I read it the most carefully.

LangGraph has five signatures. State Channel + Reducer models data flow between nodes not as a shared dict but as typed channels with combination rules. Durable Execution auto-saves state at every node boundary so the graph can resume by `thread_id` even after an OS-forced termination, implemented through checkpointers like MemorySaver, PostgresSaver, and AsyncPostgresSaver. Interrupt/Command is the HITL standard that requests human intervention mid-graph and resumes through `Command(resume=...)`. Parallel/Map expresses dynamic map-reduce through the `Send` API while also supporting static parallel edges. Subgraph encapsulates a sub-graph as a single reusable node.

### 3.2. Why Mollo Inherits Them As-Is

These five are abstractions that LangGraph has already validated. In the mobile environment they are demanded even more strongly. Mobile OSes terminate processes on background entry and memory pressure, and node-boundary checkpoints are the only way to preserve in-flight tool calls and reasoning across that termination. Flows that need user approval for payment or permission are HITL interrupts in disguise. The five assets LangGraph organized for the server become more urgent on mobile, not less. Mollo inherits them as-is, but channels live on an actor-based ExecutionContext, reducers are forced through Sendable types, and interrupts propagate along typed throws paths.

## 4. Koog - JetBrains' Kotlin Agent Framework

### 4.1. Core Assets

Koog is a Kotlin framework released by JetBrains in 2025-05. Version 0.7.3 was released on 2026-03-26 and 1.0 has not yet shipped. Its core is providing a LangGraph-style graph DSL natively in Kotlin. It has Strategy graphs, subgraph shared state, a `@Tool` DSL, in-graph interrupt nodes, built-in agent persistence, Kotlin Flow streaming, and OpenTelemetry observability. Multiplatform targets are JVM, JS, WasmJS, Android, and iOS.

### 4.2. What Carries Over at the Abstraction Level

Koog is one example of porting LangGraph's abstractions onto Kotlin with care. It shows how Strategy graphs, agent persistence, and interrupt nodes get arranged on top of Kotlin Multiplatform, which makes it easier to anticipate which parts translate naturally onto a Swift 6 actor model and which parts need a different shape. Mollo studies Koog's graph DSL and persistence model at the abstraction level as-is, and rewrites only the implementation in Swift's actors and typed throws. The fact that Koog can also build for iOS through KMP is acknowledged, and that path may suit some people better. The reason Mollo is being written Swift-native anyway is the learning motivation noted in the first section: there is no other reason beyond the personal one of wanting to engage with the Apple ecosystem directly.

## 5. OpenAI Agents SDK - Minimalism and Handoff

### 5.1. Core Assets

OpenAI Agents SDK is the framework that the OpenAI Solution Team released in 2025-03 to replace Swarm. As of 2026-04-09 it has 20.7k GitHub stars and 241 contributors, and the codebase is intentionally small at 5k-10k SLOC. An Agent is a single-line `Agent(name=, instructions=, tools=, handoffs=, model=)` class with no explicit State object. Its signatures are the message-history-plus-Sessions memory tier, one-line tools through the `@function_tool` decorator, automatic generation of `transfer_to_<name>` tools when other agents are listed in `handoffs=[...]`, tool-level approval through the `needs_approval` flag, and Realtime voice workflows.

### 5.2. Why Mollo Borrows Only Parts

OpenAI Agents SDK is a strong example of how to extract large usability out of a small API surface. Mollo brings in two aspects. One is the simplicity of the Agent constructor and the other is the tool-level approval flag in the `needs_approval` family. The absence of a graph and channels, however, runs against Mollo's direction. Mobile is an environment where forced background termination and multi-turn tool calls happen at the same time, and pinning the flow down in an explicit graph helps both debugging and recovery. So Mollo keeps the OpenAI-style short constructor as the default entry point but lets a Strategy Graph be assembled automatically inside it. Handoff is solved not by auto-generated tools but by subgraph execution plus message filtering.

## 6. Pydantic AI - Type-Safe Structured Output

### 6.1. Core Assets

Pydantic AI is a Python framework built by Pydantic Services. Version 1.84.0 was released on 2026-04-16 and the GitHub star count is 16.4k. An Agent is expressed as the generic class `Agent[Deps, Output]`, the output schema is fixed through `output_type`, and dependency injection is treated as a first-class citizen. Tools are the `@agent.tool` decorator that receives dependencies through `RunContext[Deps]`, and multimodal is expressed directly through ImageUrl, AudioUrl, VideoUrl, DocumentUrl, and BinaryContent. MCP is officially supported and Durable Execution is delegated through Temporal, DBOS, and Prefect integrations. Observability is bound together by Pydantic Logfire on top of OpenTelemetry.

### 6.2. Adopting the Agent\<Output\> Generic

The one thing Mollo brings in directly from Pydantic AI is the generic output type. Mollo's Agent is `Agent<Output: Codable & Sendable>`, which started from the same idea as Pydantic AI's `Agent[Deps, Output]`. Swift guarantees the output type at compile time, which goes one step further than Pydantic's runtime validation. Pydantic AI's dependency injection is an interesting approach, but Mollo solves the same problem through an actor-based ExecutionContext. The choice to delegate Durable Execution to Temporal is not followed. iOS is an environment that cannot pull in external workflow engines, so checkpointers must be implemented directly against SQLite, in-memory, and encrypted storage.

## 7. Mastra - The TypeScript-Native Position

### 7.1. Core Assets

Mastra is a TypeScript framework built by the Gatsby founding team. It went public in 2024-10, hit 1.0 GA in 2026-01, and as of 2026-03-24 it has 22.3k GitHub stars and 1.8 million monthly npm downloads. The core is integrating Workflow graphs, a three-tier Memory (Working/Conversation/Semantic), RAG, and Deployer into a single framework. Tools are defined as `createTool({ id, inputSchema: z.object(...), outputSchema, execute })`, tightly coupled to Zod schemas, and `.parallel()`, `.branch()`, and `.waitForInput()` on workflows are first-class citizens for graph and HITL. It runs on top of the Vercel AI SDK and integrates smoothly with edge runtimes such as Next.js and Cloudflare Workers.

### 7.2. Comparing the Same "First-Class Citizen on a Specific Platform" Approach

Mastra is interesting to Mollo because it is executing the same strategy on a different platform. Mastra is positioning itself as a first-class citizen of the Vercel and Next.js ecosystem, and Mollo aims at the same seat in the Apple ecosystem. Bundling workflow graphs, storage, and memory into a single framework differs in shape from Mollo's nine-module split, but the bundle as the user sees it feels similar. The Vercel AI SDK that Mastra depends on, however, is a choice Mollo cannot follow. Zero external dependencies is Mollo's promise, so equivalents like LLMClientRouter, RateLimitedProvider, CachedProvider, and CostTrackedProvider have to be built directly. Whether the smooth schema developer experience of Zod can be reproduced through a combination of Codable and generics is something I will have to validate during implementation.

## 8. MCP - Tool Protocol Standard

### 8.1. Core Assets

MCP (Model Context Protocol) is a tool-connection protocol standardized under Anthropic's lead. It is built on top of JSON-RPC 2.0 and defines stdio, HTTP+SSE, and WebSocket transports. The core is that it is bidirectional rather than one-way: the server sends requests back to the client for sampling, roots list, logging, and progress, in addition to the client discovering and invoking server tools. The latest protocol version is the 2025-06-18 spec.

### 8.2. How Mollo Integrates It

MCP is a standard Mollo brings in directly. The MolloMCP module implements the JSON-RPC 2.0 client and the stdio, HTTP+SSE, and WebSocket transports directly, and pins the protocol version to 2025-06-18. Server-initiated requests are received through `MCPRequestHandler` and `MCPNotificationHandler`, and multi-server lifecycle is managed through `MCPServerManager`. Because of the zero-external-dependency rule, the official MCP SDK is not pulled in either, so all three transports are implemented using only Foundation's URLSession and Network.framework. In this area Mollo starts on the same line as LangGraph's `langchain-mcp-adapters`, OpenAI Agents SDK's hosted MCP, and Mastra's official support.

## 9. Apple Platform - Native First-Class Citizens

This is where none of the analyzed frameworks fill the gap. None of them treat Apple frameworks as first-class citizens, so the parts that integrate carefully with the mobile OS have to be written directly in Swift. That gap is exactly the seat Mollo is trying to fill on its own.

### 9.1. AppIntents

`AppIntentsAgent<Output>` exposes an agent directly to Siri and Shortcuts. iOS voice app intents become agent invocations, and the user triggers a Mollo graph just by issuing a Siri command.

### 9.2. CloudKit

`CloudKitSessionSync` syncs sessions to the user's iCloud. It handles concurrent edits through optimistic locking and ships messages over 1 MB through CKAsset. It is the standard path for the multi-device scenario in which an iPhone, Mac, and iPad share the same conversation flow.

### 9.3. Keychain

`KeychainCredentialStore` stores API keys and OAuth tokens in Keychain and accepts an `Accessibility` policy and a `SecAccessControl` Biometric flag. It can enforce that tokens unlock only after Touch ID or Face ID authentication passes.

### 9.4. BackgroundTasks

`BackgroundExecution` runs on top of BGAppRefreshTask and BGProcessingTask. Even when the user backgrounds the app, the running graph is saved to a checkpoint and either resumes inside the OS-granted window or continues on the next foreground entry. This is the area that goes head-to-head with the mobile OS's forced termination.

### 9.5. Vision/Speech

`VisionTool` exposes VNRecognizeTextRequest-based OCR as a tool, and `SpeechInputTool` turns microphone input into text through SFSpeechRecognizer. The `ImageSource`, `AudioSource`, and `VideoSource` enums accept URL, Data, UIImage, CGImage, CVPixelBuffer, AVAudioPCMBuffer, and AVAsset all at once. Multimodal is a core feature from v1, not an option.

### 9.6. MLX Swift / Core ML

`MLXProvider` and `CoreMLProvider` ship with an engine seam. Mollo is designed not to be tightly bound to one specific MLX Swift or Core ML model while still letting callers plug in either side when they want to. The mlx_lm.server built in the previous post exposes an OpenAI-compatible endpoint, so it also connects directly through the OpenAICompatible provider.

### 9.7. NLEmbedding

`NLEmbeddingMemory` uses the word/sentence embeddings provided by Apple's NaturalLanguage framework to solve on-device semantic search. Together with `SQLiteMemory` based on SQLite FTS5 it forms a two-track memory backend. The point is that the search side of RAG can be filled using only Apple frameworks without pulling in an external vector DB.

## 10. Synthesis - Mapping to Mollo's Core Modules

Here is a single-pass mapping of the analyzed assets onto Mollo's planned module boundaries.

- `MolloCore` is where LangGraph's five signatures (State Channel + Reducer, Durable Execution interface, Interrupt/Command, Parallel/Map, Subgraph), OpenAI Agents SDK's short Agent constructor, and Pydantic AI's `Agent<Output>` generic come together
- `MolloPersistence` is where LangGraph's Checkpointer is ported into Swift. SQLite, InMemory, and Encrypted (AES-256-GCM envelope) backends are implemented directly, and memory is split between NLEmbeddingMemory and SQLiteMemory
- `MolloProviders` is the module that handles Anthropic, OpenAI, Google Gemini, DeepSeek, Ollama, and OpenAI-compatible endpoints. It contains LLMClientRouter's fallback / roundRobin / priority strategies and RateLimited / Cached / CostTracked decorators. The area Mastra delegates to the Vercel AI SDK is written directly here
- `MolloMCP` is where the MCP standard lands. It implements the JSON-RPC 2.0 client, the stdio / HTTP+SSE / WebSocket transports, and server-initiated request handlers directly
- `MolloTools` carries a tool-definition abstraction equivalent to OpenAI Agents SDK's `@function_tool` and ships FileRead/Write/Edit, GrepSearch, GlobSearch, ShellTool (macOS, with Command Injection defense), and WebFetchTool (with SSRF defense) as built-ins
- `MolloMultimodal` bundles Vision, Speech, and ImageSource/AudioSource/VideoSource. The territory Pydantic AI covers through ImageUrl/AudioUrl/VideoUrl is solved here through direct Apple framework wiring
- `MolloApple` is the Apple first-class-citizen module where AppIntents, CloudKit, Keychain, HybridRouter, BackgroundExecution, and MemoryPressureHandler come together. Other frameworks effectively have no equivalent module
- `MolloAuth` implements OAuth 2.0 PKCE, exposes only the `CredentialStore` protocol, and receives the Keychain implementation injected from the MolloApple side. It is split this way to avoid reverse dependency
- `MolloObservability` carries `TraceSpan`, `TraceCollector`, `JSONFileTraceExporter`, `AgentLogger` on top of `os.Logger`, `RateLimiter`, and `CostTracker`. The seat Pydantic AI fills with Logfire is filled here using only OS standard tools

## 11. Closing

Two things became clear after the analysis. One is that the five assets LangGraph organized are no longer one framework's peculiar abstractions but something close to a validated standard for the agent space. Koog ported the same abstractions to Kotlin, and Mastra and Pydantic AI also unfold similar functionality under different names. Mollo porting these assets into Swift is not a new invention but a faithful re-implementation in a place that has already been validated.

The other is that the seat for putting Apple-platform integration on top of those assets as a first-class citizen looked open. No framework I came across pulled AppIntents, CloudKit, Keychain, BackgroundTasks, and NLEmbedding into the core. Mobile-specific problems such as forced OS termination, background restrictions, voice intents, and multi-device sync land naturally when the framework lines up with Apple frameworks. That space looked personally interesting, and Mollo is the attempt to walk through it on my own as a learning exercise.

That covers all the assets I wanted to organize before implementation. The next step is the implementation itself.

# References

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
