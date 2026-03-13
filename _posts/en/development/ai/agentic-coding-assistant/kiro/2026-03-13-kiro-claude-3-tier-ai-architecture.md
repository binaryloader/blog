---
title: "[Kiro] Kiro x Claude: 3-Tier AI Service Architecture"
lang: en
permalink: /en/:categories/:title/
ref: kiro-claude-3-tier-ai-architecture
excerpt: "An analysis of how Kiro calls Claude models through a Client Layer + 3-Tier Service Layer, and why the same model delivers different performance depending on the App Provider."
date: 2026-03-13T21:40+09:00
last_modified_at: 2026-03-13T21:40+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-claude-3-tier-ai-architecture.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/kiro-claude-3-tier-ai-architecture.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Kiro
tags:
  - Kiro
  - Claude
  - AWS Bedrock
  - Agentic Coding
depth:
  - title: "Development"
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "Agentic Coding Assistant"
    url: /en/development/ai/agentic-coding-assistant/
  - title: "Kiro"
    url: /en/development/ai/agentic-coding-assistant/kiro/
---

# Overview

An analysis of how Kiro calls Claude models through a Client Layer + 3-Tier Service Layer, and why the same model delivers different performance depending on the App Provider.

Claude Code hasn't been approved at my company yet, so I've been using Kiro as the standard internal tool. While working with Kiro, I got curious about its internal architecture and put together this analysis based on official documentation and outage reports. Personally, I hope Claude Code gets approved at work soon.

# Summary

## 1. Architecture Overview

It is estimated that Kiro calls Claude models through the path `Kiro → Amazon Bedrock → Claude`. Past incidents where Kiro went down during Bedrock outages and the use of Bedrock model IDs within Kiro support this.

For the purpose of this analysis, I classify this architecture as `Client Layer` + `3-Tier Service Layer` (`App Provider` — `Managed AI Platform` — `Model Provider`). 3-Tier, App Provider, Managed AI Platform, and Model Provider are not official AWS terminology — they are categories I defined for analytical convenience. The actual internal architecture may differ.

![Kiro x Claude: 3-Tier AI Service Architecture](/assets/image/post/development/ai/agentic-coding-assistant/kiro/kiro-claude-3-tier-ai-architecture/kiro-3-tier-architecture.png)

## 2. Client Layer

### 2.1. User

The entry point where developers interact with Kiro through an IDE or terminal.

### 2.2. Kiro IDE / CLI

Kiro IDE is a standalone desktop application forked from Code OSS (VS Code open source). It is compatible with VS Code settings, themes, and Open VSX plugins.

Kiro CLI was rebranded from the Amazon Q Developer CLI. The existing `q` and `q chat` entry points remain backward-compatible, and it continues to read existing settings from the `.amazonq` folder.

Login supports GitHub, Google, AWS Builder ID, and AWS IAM Identity Center, and it can be used without an AWS account.

## 3. 3-Tier Service Layer

### 3.1. App Provider -- Kiro (fka Amazon Q Developer)

The relationship with Amazon Q Developer is as follows (per official AWS documentation).

- Q Developer CLI has been fully rebranded to Kiro CLI
- The Kiro console is also a rebrand of the Q Developer console
- Kiro IDE/CLI access is available through a Q Developer Pro subscription

Key features include the following.

- Spec-driven development (requirements -> design -> tasks -> coding)
- Hooks (event-driven automation)
- Steering (per-project rule markdown files)
- MCP integration
- Powers (one-click extensions -- Aurora, IAM Policy Autopilot, etc.)

### 3.2. Managed AI Platform -- Amazon Bedrock

The intermediate layer between Kiro and Claude models, responsible for inference, scaling, security, and model routing.

Auto mode is Kiro's default model selection, which automatically routes to the optimal model based on task type. While Bedrock itself is a general-purpose platform hosting models from Amazon, Anthropic, Meta, Mistral, and others, Kiro currently uses only Claude models.

### 3.3. Model Provider -- Claude Models (by Anthropic)

The model provider that performs the actual LLM inference. Anthropic develops and provides the models, which are served through Bedrock.

The models supported in Kiro are as follows (as of 2026-03, per kiro.dev/docs).

- Claude Opus 4.6 (Experimental) -- Top-tier model, Pro/Pro+/Power only
- Claude Opus 4.5 -- Pro/Pro+/Power only
- Claude Sonnet 4.6 -- Successor to Sonnet 4.5
- Claude Sonnet 4.5 -- Primary model in Auto mode
- Claude Sonnet 4.0 -- Stable general-purpose model
- Claude Haiku 4.5 -- Fastest lightweight model

Anthropic participates purely as a Model Provider and is not involved in the infrastructure (Bedrock) or the app (Kiro).

### 3.4. Amazon's Dual Role (Vertical Integration)

Amazon owns both the App Provider (Kiro) and the Managed AI Platform (Bedrock) layers. The Q Developer CLI to Kiro CLI rebrand is complete, and Kiro access is also available through Q Dev Pro subscriptions (parallel operation).

Anthropic participates only as a Model Provider, but generates revenue from both the Kiro/Bedrock pathway and its own direct offerings (Claude Code, claude.ai, API).

## 4. Same Model, Different Performance -- The Impact of the App Provider Layer

A notable aspect of this architecture is that even when using the same Claude model, coding performance varies significantly depending on the App Provider layer. For example, using Claude Opus 4.6 through Kiro, Claude Code, and Cursor respectively yields noticeably different quality. This is not due to the model's capabilities but rather the different agent architectures wrapping the model.

### 4.1. System Prompt & Persona

Each app injects different system prompts into the model. The agent's behavioral rules, response format, and role definitions are determined here. Kiro is designed with a spec-driven workflow in mind, while Claude Code is designed for terminal-based agentic execution.

### 4.2. Context Window Management & RAG Strategy

The key factor is what information fills the limited context window. Kiro automatically injects steering files, spec documents, and codebase summaries. Claude Code uses agentic search to autonomously explore the codebase and dynamically retrieves the necessary files. The output quality from the same model varies depending on which chunks are inserted at which point.

### 4.3. Tool Use (Function Calling)

The tool definitions (tool schemas) bound to the model differ across apps. When the available toolsets and invocation permissions differ -- file read/write, shell execution, web search, MCP server integration, etc. -- the action space available to the model is fundamentally different.

### 4.4. Agentic Loop & Orchestration Patterns

This is about differences in multi-step agent loop design rather than single LLM calls. Kiro structures Plan -> Act -> Observe on a per-spec basis (structured orchestration). Claude Code runs a free-form ReAct-style loop. Strategies for self-correction, retry, and sub-agent delegation within the loop also differ across apps.

### 4.5. Planning & Decomposition

This concerns how complex tasks are broken down. Kiro enforces explicit decomposition from requirements to design to task lists. Claude Code delegates plan creation to the model itself. When Agent Teams (sub-agent branching) are supported, parallel execution is also possible.

Ultimately, the Model Provider supplies the foundation model as the engine, and the App Provider builds the agent framework (prompts, RAG, tools, orchestration) as the chassis on top of that engine.

# References

- <https://aws.amazon.com/bedrock/>
- <https://docs.anthropic.com/en/docs/about-claude/models>
- <https://kiro.dev/docs/>
