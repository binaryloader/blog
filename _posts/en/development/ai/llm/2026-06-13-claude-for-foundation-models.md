---
title: "[LLM] ClaudeForFoundationModels for using Claude inside Apple Foundation Models"
ref: claude-for-foundation-models
excerpt: "A walkthrough of Anthropic's ClaudeForFoundationModels package that connects Claude as a server-side language model inside Apple Foundation Models framework and shares it with the on-device model."
date: 2026-06-13T16:00+09:00
last_modified_at: 2026-06-13T16:00+09:00
published: true
credits:
  planning: binaryloader
  research: Claude
  drafting: Claude
  editing: Claude
  review: [Claude, binaryloader]
  translation: Claude
  thumbnail: Claude
  publishing: Claude
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/claude-for-foundation-models.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/claude-for-foundation-models.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - Claude
  - Foundation Models
  - Swift
  - Apple
  - iOS
  - On-Device
  - Tool-Calling
depth:
  - title: "Development"
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "LLM"
    url: /en/development/ai/llm/
---

# Overview

A walkthrough of Anthropic's ClaudeForFoundationModels package that connects Claude as a server-side language model inside Apple Foundation Models framework and shares it with the on-device model.

# Summary

One thing to be upfront about before going further: the Swift code in this post is not the result of me building and running it myself. It is reference code transcribed from signatures documented in Anthropic's official docs and the repository README. The package requires OS 27 and Xcode 27 beta, which support the server-side language model API, and my current environment does not have that beta set up yet. The shape and flow of the code is trustworthy as it comes from official materials, but this is not verified output from actually running it. Once I have the beta environment ready, I plan to run `Examples/ClaudeExample` from the repository directly and confirm the behavior. Until then, please treat the code below as reference material summarizing the official spec rather than verified working output.

## 1. What ClaudeForFoundationModels is and why it exists

ClaudeForFoundationModels is a Swift package that Anthropic released on June 8, 2026. The first tag `0.1.0` went up on GitHub the same day as the blog announcement, and the latest tag as of now is `0.1.1`, added on June 10. What it does can be summarized in one sentence: it connects Claude for use as a server-side language model inside Apple Foundation Models framework.

There is an important distinction to make here. This package is not a general-purpose Messages API client. If you are looking for an SDK that calls the Anthropic API directly, a separate client library handles that role. The identity of ClaudeForFoundationModels is its provider conformance to Foundation Models framework. In other words, it is an adapter that plugs Claude into the language model protocol Apple has defined, making the framework handle Claude the same way it handles the on-device model. The types the package exposes externally are narrowed down to exactly this purpose: `ClaudeLanguageModel` as the provider itself, `ClaudeModel` for model identity and capabilities, `AuthMode` for authentication mode, `ClaudeServerTool` for server-side tool configuration, and `ClaudeServerToolSegment` for exposing tool activity in the transcript.

The context is the server-side language model API introduced in OS 27 beta. Apple Foundation Models framework was originally a framework for handling the on-device model built into the device, but starting with OS 27 beta, a path opened up to bring server-side language models under the same framework abstraction. ClaudeForFoundationModels is the implementation that brings Claude through that path into the framework. The license is Apache 2.0, and during the beta period bug reports go to GitHub issues, though external PRs are not accepted.

### 1.1. The design of conforming to the LanguageModel protocol

The design of this package in a single phrase is that it conforms Claude to the framework's language model protocol. As a result, Claude is driven by the same `LanguageModelSession` API as Apple's on-device model. Receiving a response with `respond(to:)`, streaming, guided generation, and tool calling all operate on top of the same session API. From a developer's perspective, only the one line of code that creates the model differs, and the session usage code that follows has the same structure as when using the on-device model.

This design offers two concrete benefits. First, existing code written with Foundation Models is reused almost as-is. You only change the model argument passed when creating a session, and there is no need to rewrite the rest of the call code. Second, you can move between the on-device model and Claude through the same interface. This second benefit forms the foundation for the model-sharing discussed in the next section.

## 2. When to use the on-device model and when to use Claude

Before deciding whether to adopt this package, the first question to answer is when you intend to call Claude at all. Apple's on-device model (`SystemLanguageModel`) finishes inference on the device, so it is fast, private, and works offline. However, this model is sized for lightweight tasks. Short classification, summarization, extraction, and simple transformations - tasks that fit within device resources - are the right domain for the on-device model.

Conversely, there are points where on-device capacity falls short. Cases where you need to handle a larger context in one shot, where frontier-level reasoning is required, or where server-side tools like web search or code execution are needed. That is when you escalate the same task to Claude. The decision axis comes down to the weight of the task. Keep tasks that the device handles satisfactorily on-device, and send only those that run into limits from context size, reasoning difficulty, or server tool dependencies up to Claude.

The reason this split works smoothly at the code level is that both sides share the same `LanguageModelSession` API. Change only the model argument passed when creating a session, and the same call code works with either the on-device model or Claude. This means model selection can be treated as a per-session decision. The app decides which model to run a given session on and sends the same prompt-handling logic through both models. It is possible to build a structure where lightweight requests are handled on-device and only heavy requests travel over the network to Claude, all without swapping interfaces.

To summarize: the rest of this post covers the Claude side of the integration, but the premise of the integration is always the same. Keep tasks that can finish on-device on the device, and send only those that cross that boundary up to Claude.

## 3. Requirements and installation

Requirements are tied to the OS 27 beta generation. The prerequisite is an OS 27 release that supports the server-side language model, and the platform targets in Package.swift are iOS 27, macOS 27, visionOS 27, and watchOS 27 - all beta. iPadOS is included under the iOS target, so it is not listed as a separate OS. Building requires Xcode 27 beta, and during development an API key issued from Claude Console is needed. In production deployment, a separate authentication method that does not embed the API key directly in the app is used; that is covered in §7.

As noted earlier, the code below is organized from the official spec, so keep that in mind. The package is added via Swift Package Manager. Register the repository in the dependencies of Package.swift.

```swift
dependencies: [
    .package(url: "https://github.com/anthropics/ClaudeForFoundationModels.git", from: "0.1.0")
]
```

`from: "0.1.0"` is a tag-based spec that satisfies both the `0.1.0` and `0.1.1` tags currently available. Both the official docs and README present the spec against `0.1.0`, so following that directly works fine.

In code, two modules are imported together. Session and generation-related types come from the Apple framework, and Claude provider types come from the package.

```swift
import FoundationModels
import ClaudeForFoundationModels
```

## 4. Quick start

The smallest integration takes three steps: create a Claude provider, create a session with it, and send a prompt to the session.

```swift
import FoundationModels
import ClaudeForFoundationModels

let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .apiKey("sk-ant-...")
)

let session = LanguageModelSession(model: model)

let response = try await session.respond(to: "Explain Swift's actor in one paragraph.")
print(response.content)
```

`ClaudeLanguageModel` is the provider itself. Passing just the first two arguments, `name` and `auth`, fills in the rest with defaults. `LanguageModelSession(model:)` for creating a session and `respond(to:)` for receiving a response are standard Foundation Models API, identical to when using the on-device model. The response body is retrieved with `response.content`.

The initializer accepts four more arguments beyond those two. The full signature is shown below.

```swift
public init(
    name: ClaudeModel,
    auth: AuthMode,
    fixedEffort: ClaudeModel.Effort? = nil,
    serverTools: Set<ClaudeServerTool> = [],
    baseURL: URL = ClaudeLanguageModel.defaultBaseURL,
    timeout: TimeInterval = 60
)
```

`fixedEffort` is an option for pinning the reasoning intensity of all requests to a fixed level, covered in §6. `serverTools` is for configuring server-side tools like web search and code execution, covered in §9. `baseURL` defaults to the Claude API endpoint and is changed to a custom backend address in a proxy setup (§7). `timeout` is the request timeout, defaulting to 60 seconds. For the quick start, `name` and `auth` alone are sufficient, and the rest can be filled in as needed.

## 5. Model selection and Capabilities

The model passed to a session is a `ClaudeModel` value. There are two ways to obtain one: use precompiled constants in the package, or declare capabilities directly to construct a model ID that is not yet provided as a constant.

### 5.1. Precompiled model constants

The package currently has five constants. Each constant is declared alongside which API model ID it maps to and which features it accepts.

| Constant | API Model ID | Effort levels | Adaptive thinking | Sampling params |
|----------|--------------|---------------|-------------------|-----------------|
| `.opus4_8` | `claude-opus-4-8` | low, medium, high, xhigh, max | Supported | Not supported |
| `.opus4_7` | `claude-opus-4-7` | low, medium, high, xhigh, max | Supported | Not supported |
| `.opus4_6` | `claude-opus-4-6` | low, medium, high, max | Supported | Supported |
| `.sonnet4_6` | `claude-sonnet-4-6` | low, medium, high, max | Supported | Supported |
| `.haiku4_5` | `claude-haiku-4-5` | Not supported | Not supported | Supported |

All five constants support structured output and image input. The differences are in effort levels, adaptive thinking, and sampling parameters. Two things in the table are worth noting. First, only `.opus4_8` and `.opus4_7` accept effort up to `.xhigh`. `.opus4_6` and `.sonnet4_6` support up to `.max` but do not accept `.xhigh`. Second, `.haiku4_5` does not accept effort levels at all and adaptive thinking is false. If you choose `.haiku4_5` for a task that requires effort-level control, effort-related settings have no effect.

### 5.2. What capabilities decide

Each `ClaudeModel` declares what fields it accepts through its capabilities. The accepted items are sampling parameters, effort levels, adaptive thinking, structured output, and image input. The key point is that this declaration is not just metadata.

The Claude API rejects fields that a model does not support with a hard error rather than silently ignoring them. The package defends against this behavior with the capabilities declaration. That means fields declared as not accepted by the model are not sent in the request. The package looks at a model's capabilities to decide which fields to transmit to the API. This means developers do not need to memorize which fields are allowed for each model, avoiding request rejections from sending unsupported fields.

### 5.3. Constructing a model not in the constants

If you need to use a model ID that is not yet included as a constant in the package, construct a `ClaudeModel` directly. Pass the ID and capabilities together. In the example below, `claude-experimental-x` is a hypothetical model ID used for illustration, and the capabilities values are arbitrary examples to match it.

```swift
let customModel = ClaudeModel(
    id: "claude-experimental-x",
    capabilities: .init(
        samplingParams: false,
        effortLevels: [.low, .medium, .high, .xhigh, .max],
        adaptiveThinking: true,
        structuredOutput: true,
        imageInput: true
    )
)

let model = ClaudeLanguageModel(name: customModel, auth: .apiKey("sk-ant-..."))
```

The capabilities must exactly match what the model actually supports. Declaring capabilities incorrectly causes the package to make wrong decisions about which fields to send or omit, and in the former case the API will ultimately reject the request. Think of this approach as a temporary measure until a new model ships and its constant is added to the package.

## 6. Effort control

Effort is the axis that controls the intensity of reasoning Claude applies before responding. The levels are five steps in order: `low`, `medium`, `high`, `xhigh`, and `max`. The API uses `high` as the default when effort is not specified.

There is a boundary between the framework and the package worth knowing here. Foundation Models framework has a reasoning hint per request that implies reasoning intensity, but that hint tops out at `high`. As a result, `.xhigh` and `.max` can never be reached through the framework's per-request hint - they are only requestable via the `fixedEffort` argument on `ClaudeLanguageModel`. Setting `fixedEffort` pins the effort of every request made through that provider to that value and takes precedence over the per-request reasoning hint the framework provides.

```swift
let model = ClaudeLanguageModel(
    name: .opus4_8,
    auth: .apiKey("sk-ant-..."),
    fixedEffort: .xhigh
)
```

As seen in §5, however, the range of effort a model accepts varies. `.opus4_8` and `.opus4_7` accept up to `.xhigh`, while `.sonnet4_6` and `.opus4_6` support only up to `.max` and do not accept `.xhigh`. `.haiku4_5` does not accept effort at all. Therefore, what value to pin with `fixedEffort` needs to be decided after confirming that the model you are pairing it with supports that level. To reliably fix `.xhigh` as in the example above, choose `.opus4_8` or `.opus4_7`.

## 7. Separating dev keys and production proxy with authentication

`AuthMode` has two cases: `apiKey(String)` for direct key authentication in development, and `proxied(headers: [String: String])` for proxy-based authentication in production. The distinction between the two is directly tied to security, so it is better to be deliberate about which one to use from the start.

```swift
public enum AuthMode: Hashable, Sendable {
    case apiKey(String)
    case proxied(headers: [String: String])
}
```

### 7.1. Direct key for development

`apiKey` is the mode where the app carries the Claude API key directly and attaches it to requests. The code is simplest, which makes it well suited for local development and prototyping. The problem surfaces at deployment time. A string key embedded in an app binary can be extracted. The basic security premise that a secret in the client is no longer a secret applies directly here. Therefore, `apiKey` must be treated as development-only, adopted with the understanding that it will be switched to the proxy mode before creating a release build.

```swift
let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .apiKey("sk-ant-...")
)
```

### 7.2. Proxy for production

`proxied` is the mode where the app carries no Claude API key at all. The app sends a request in standard Messages API format to its own backend, and that backend attaches credentials server-side and forwards the request to the Claude API. Concretely, the proxy receives the app's request, adds an `x-api-key` header, and passes it on to `api.anthropic.com`. The key exists only in the backend and leaves no trace in the app binary.

In this configuration, `headers` is used by the app to identify itself to its own backend - it is for caller authentication, not for Claude API authentication. Load it with a session token or user authentication credential issued by the proxy backend so the backend relays only requests from legitimate clients to Claude. `baseURL` is changed from the default to the custom backend address.

```swift
let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .proxied(headers: ["Authorization": "Bearer <app session token>"]),
    baseURL: URL(string: "https://api.example.com/claude")!
)
```

To summarize: use `apiKey` for fast iteration during development, and in production isolate the key to the server side with `proxied` and a dedicated proxy backend. Locking this transition into a release checklist prevents secrets from leaking into the app.

## 8. Streaming and structured output

### 8.1. Streaming

To receive responses as tokens arrive, use `streamResponse(to:)`. One thing to be clear about here: each element the stream emits is not a delta containing only the difference from the previous element - it is a full snapshot accumulated up to that point.

```swift
let session = LanguageModelSession(model: model)

for try await partial in session.streamResponse(to: "Give me a long response as a stream.") {
    print(partial.content)
}
```

Since each element is an accumulated snapshot, when displaying on screen you replace the existing text with the received value. Writing code that appends deltas directly causes the same content to accumulate in duplicate, so watch out for that. From a UI update perspective, the fact that the last received snapshot is always the complete response so far is actually easier to work with.

### 8.2. Structured output

To receive a value of a specific type directly, use Foundation Models' structured output feature as-is. Declare the type to return with `@Generable`, attach `@Guide(description:)` on fields where description is needed, and pass that type to `respond(to:generating:)`.

```swift
@Generable
struct Recipe {
    @Guide(description: "name of the dish")
    let name: String

    @Guide(description: "list of required ingredients")
    let ingredients: [String]

    @Guide(description: "cooking steps in order")
    let steps: [String]
}

let response = try await session.respond(
    to: "Give me a recipe for kimchi fried rice.",
    generating: Recipe.self
)

let recipe = response.content
```

Model-specific differences surface here again. If you use this approach with a model that does not support structured output, the package does not silently degrade to a text response. Instead, it throws `LanguageModelError.unsupportedGenerationGuide`. Code paths that use structured output therefore need to either handle this error or be designed to only route models that support structured output through that path. All five constants in §5 support structured output, so running into this error is unlikely when using the constants. The case to watch out for is when you have declared structured output as false in the capabilities of a directly constructed `ClaudeModel`.

### 8.3. Image input

Image input is handled through the same session API. A model with the image input capability declares the framework's vision capability, and passing an image through the standard session API causes the package to convert it to Claude API's image format and send it. All five constants in §5 support image input. Developers use Foundation Models' standard image input method as-is, and the package handles the conversion to Claude API format.

## 9. Handling client and server tools

In a session using Claude, tools divide into two branches: client-side tools that run on the device, and server-side tools that run on Anthropic's infrastructure.

### 9.1. Client-side tools

Client-side tools use the framework's standard tool mechanism as-is. Conform a tool type to `Tool` and add it to the session's `tools:` array, and when the model decides to call that tool, it is invoked on the device. Tasks the app performs within the device - location lookup, local data search, device feature calls - belong here. This code is identical to when using the on-device model.

### 9.2. Server-side tools

Server-side tools handle web search, web fetch, and code execution on Anthropic's infrastructure in a single round trip. Since the tools run on the Claude side rather than on the device, the app receives a response that already includes the tool execution results in one round trip. The types are expressed through the `ClaudeServerTool` enum.

```swift
public enum ClaudeServerTool: Hashable, Sendable {
    case webSearch(domains: DomainFilter = .unrestricted, maxUses: Int? = nil)
    case webFetch(domains: DomainFilter = .unrestricted, maxUses: Int? = nil)
    case codeExecution
}
```

`webSearch` and `webFetch` accept two options. The first, `domains`, is a `DomainFilter` specifying which domains to allow or block for search and fetch. The cases are `.allowing([String])` to permit only specific domains, `.blocking([String])` to block specific domains, and `.unrestricted` for no restrictions, with `.unrestricted` as the default. The second, `maxUses`, limits how many times that tool can be used in a single request, defaulting to `nil`.

```swift
let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .apiKey("sk-ant-..."),
    serverTools: [
        .webSearch(domains: .allowing(["developer.apple.com"]), maxUses: 5),
        .codeExecution
    ]
)
```

Since `domains` is the first parameter, omitting it applies the default `.unrestricted`. Writing `.webSearch(maxUses: 5)` with `domains` omitted and only `maxUses` passed works, but it is worth remembering that `domains` comes first in the accurate signature.

When server-side tools execute, their activity is exposed in the transcript as a custom segment called `ClaudeServerToolSegment`. This type conforms to the `Transcript.CustomSegment` protocol, making it possible to inspect from the transcript what server tools the model used and how.

### 9.3. Why server tools attach to ClaudeLanguageModel rather than the session

There is a noticeable design point here. Client-side tools go in the session's `tools:` array, but server-side tools are configured in `ClaudeLanguageModel`'s `serverTools` argument rather than in the session. The two attach at different points.

The reason lies in type ownership. `LanguageModelSession` is a framework type defined by Apple, so the package cannot freely extend it or add new configuration points. Server-side tools, on the other hand, are a Claude-specific feature with no corresponding concept in the Apple framework. There is no way to inject a feature the framework does not know about into a session type owned by the framework, so server tool configuration lives in `ClaudeLanguageModel`, which the package owns. Server tool configuration is therefore decided at the time the model (provider) is created, and sessions that share the same server tool configuration are created from that provider.

## 10. Error handling and fallback

The package maps Claude API errors to Apple `LanguageModelError` wherever possible. This is so that error-handling code written when working with the on-device model applies to Claude without modification. The key mappings are as follows.

- Exceeding context length maps to `LanguageModelError.contextSizeExceeded`
- HTTP 429 (rate limit) and HTTP 529 (overloaded) both map to `LanguageModelError.rateLimited`
- Request timeout (URLError timeout) maps to `LanguageModelError.timeout`

Claude-specific errors that have no equivalent to map to `LanguageModelError` are thrown as `ClaudeError`. Currently `ClaudeError` defines one case: `missingCredential`, indicating an authentication failure.

```swift
public enum ClaudeError: LocalizedError, Sendable {
    case missingCredential
}
```

Error-handling code therefore handles both standard framework errors and Claude-specific errors together. Below is a pattern for falling back to the on-device model for just that turn when hitting a rate limit, while handling authentication issues separately.

```swift
do {
    let response = try await claudeSession.respond(to: prompt)
    return response.content
} catch let error as LanguageModelError {
    switch error {
    case .rateLimited:
        // Fall back to the on-device model for this turn only
        let fallback = LanguageModelSession(model: SystemLanguageModel.default)
        return try await fallback.respond(to: prompt).content
    case .contextSizeExceeded:
        // Route to the path that reduces input or retries after summarizing
        throw error
    default:
        throw error
    }
} catch ClaudeError.missingCredential {
    // Auth configuration is wrong - surface a user-facing message to guide recovery
    throw error
}
```

This fallback strategy pairs with the escalation logic in §2. In normal operation heavy tasks are sent up to Claude, but when Claude is temporarily unable to respond (rate limited or overloaded), that turn drops down to the on-device model, reducing disruption to the user experience. Because both sides use the same session API, the fallback path code looks nearly identical to the primary path, and that is a key strength of this structure. Depending on circumstances, queuing the request for retry rather than falling back immediately is also a viable strategy.

## 11. Data privacy and billing

The data path is straightforward. Requests go directly from the app to the Claude API. Apple is not in that request path and sees neither prompts nor responses. This is the contrast with the on-device model. The on-device model keeps data on the device but is bound by device resource limits. Claude sends data to the Anthropic API but provides access to a larger model and server tools. Either way, Apple does not see data in the middle.

With a proxy configuration, requests pass through a custom backend once, but Apple is still not in the path there. The only difference is that the parties seeing the data go from Anthropic alone to the custom backend plus Anthropic, and the backend is your own infrastructure.

Billing goes through an Anthropic account. Usage is charged according to standard Claude API pricing. On-device model calls incur no cost, but requests escalated to Claude are billed for token usage. This cost structure also factors into the sharing decision in §2. Sending tasks to Claude that the device handles fine incurs unnecessary cost, so keeping lightweight tasks on-device is the rational choice from a cost perspective as well.

## 12. Current limitations

Being in beta, there are limitations worth knowing. First, Claude API features that cannot be expressed through Apple protocols are not accessible through this package. Unsupported items explicitly noted in the official docs are as follows.

- Prompt caching control: caching itself is applied automatically, but TTL and breakpoints cannot be configured
- Stop sequences
- Batch processing
- Files API
- Token counting
- Beta headers

Because this is beta, the API may change before GA. Bug reports go to GitHub issues, but external PRs are not accepted during beta. Take this into account before starting integration, and leave room for potential API changes when setting production timelines.

To quickly confirm actual behavior, refer to `Examples/ClaudeExample` in the repository. This example is a runnable CLI target that streams chat turns to the terminal. Pass the `--search` flag to see server-side web search in action as well. Running it requires a macOS 27 host, so try it out after setting up the OS 27 beta environment.

# References

- <https://claude.com/blog/claude-for-foundation-models>
- <https://developer.apple.com/documentation/foundationmodels>
- <https://github.com/anthropics/ClaudeForFoundationModels>
- <https://platform.claude.com/docs/en/cli-sdks-libraries/libraries/apple-foundation-models>
