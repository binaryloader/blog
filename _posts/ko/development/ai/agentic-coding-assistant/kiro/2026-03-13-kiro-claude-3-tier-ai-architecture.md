---
title: "[Kiro] Kiro × Claude: 3-Tier AI 서비스 아키텍처"
ref: kiro-claude-3-tier-ai-architecture
excerpt: "Kiro가 Claude 모델을 호출하는 경로를 Client Layer + 3-Tier Service Layer로 분석하고 같은 모델이 App Provider에 따라 왜 다른 성능을 내는지 정리했다."
date: 2026-03-13T21:40+09:00
last_modified_at: 2026-03-13T21:40+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-claude-3-tier-ai-architecture.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/kiro-claude-3-tier-ai-architecture.png"
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
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "Agentic Coding Assistant"
    url: /ko/development/ai/agentic-coding-assistant/
  - title: "Kiro"
    url: /ko/development/ai/agentic-coding-assistant/kiro/
---

# 개요

Kiro가 Claude 모델을 호출하는 경로를 Client Layer + 3-Tier Service Layer로 추정하여 분석하고 같은 모델이 App Provider에 따라 왜 다른 성능을 내는지 정리했다.

회사에서 원래 Claude Code를 쓰고 있었는데 최근 보안 공지로 미승인 도구로 분류되어 사용 금지가 내려졌다. 그래서 사내 표준 도구인 Kiro로 전환해서 업무를 하고 있는데 역체감이 상당하다. 같은 Claude 모델을 쓰는데 왜 이렇게 체감이 다른지 궁금해져서 공식 문서와 장애 사례를 바탕으로 내부 구조를 나름대로 분석해 봤다.

# 정리

## 1. 구조 요약

Kiro가 Claude 모델을 호출하는 경로는 `Kiro → Amazon Bedrock → Claude`로 추정된다. Bedrock 장애 시 Kiro 서비스가 중단된 사례와 Kiro에서 Bedrock 모델 ID를 사용하는 점이 이를 뒷받침한다.

이 문서에서는 이 구조를 분석의 편의를 위해 `Client Layer` + `3-Tier Service Layer` (`App Provider` — `Managed AI Platform` — `Model Provider`)로 추정하여 분류한다. 3-Tier, App Provider, Managed AI Platform, Model Provider는 AWS 공식 용어가 아니라 필자가 분석 편의를 위해 정의한 분류 체계이다. 실제 내부 아키텍처는 다를 수 있다.

![Kiro × Claude: 3-Tier AI 서비스 아키텍처](/assets/image/post/development/ai/agentic-coding-assistant/kiro/kiro-claude-3-tier-ai-architecture/kiro-3-tier-architecture.png)

## 2. Client Layer

### 2.1. 사용자(User)

개발자가 IDE 또는 터미널을 통해 Kiro와 상호작용하는 진입점이다.

### 2.2. Kiro IDE / CLI

Kiro IDE는 Code OSS(VS Code 오픈소스) 포크 기반의 독립 데스크톱 애플리케이션이다. VS Code 설정, 테마, Open VSX 플러그인과 호환된다.

Kiro CLI는 Amazon Q Developer CLI에서 리브랜딩되었다. 기존 `q`, `q chat` 엔트리포인트는 하위 호환되며 `.amazonq` 폴더의 기존 설정도 계속 읽는다.

로그인은 GitHub, Google, AWS Builder ID, AWS IAM Identity Center를 지원하며 AWS 계정 없이도 사용 가능하다.

## 3. 3-Tier Service Layer

### 3.1. App Provider — Kiro(fka Amazon Q Developer)

Amazon Q Developer와의 관계는 아래와 같다(AWS 공식 문서 기준).

- Q Developer CLI → Kiro CLI로 리브랜딩 완료
- Kiro 콘솔도 Q Developer 콘솔의 리브랜딩
- Q Developer Pro 구독으로 Kiro IDE/CLI 접근 가능

핵심 기능은 아래와 같다.

- Spec-driven development(요구사항 → 설계 → 태스크 → 코딩)
- Hooks(이벤트 기반 자동화)
- Steering(프로젝트별 규칙 마크다운)
- MCP 연동
- Powers(원클릭 확장 — Aurora, IAM Policy Autopilot 등)

### 3.2. Managed AI Platform — Amazon Bedrock

Kiro와 Claude 모델 사이의 중간 레이어로 추론(inference), 스케일링, 보안, 모델 라우팅을 담당한다.

Auto 모드는 Kiro의 기본 모델 선택이며 태스크 유형에 따라 최적 모델을 자동 라우팅한다. Bedrock 자체는 Amazon, Anthropic, Meta, Mistral 등 다수 모델을 호스팅하는 범용 플랫폼이지만 Kiro는 현재 Claude 모델만 사용한다.

### 3.3. Model Provider — Claude Models(by Anthropic)

실제 LLM 추론을 수행하는 모델 제공자이다. Anthropic이 모델을 개발 및 제공하고 Bedrock을 통해 서빙한다.

Kiro에서 지원하는 모델은 아래와 같다(2026-03, kiro.dev/docs 기준).

- Claude Opus 4.6(Experimental) — 최상위 모델, Pro/Pro+/Power 전용
- Claude Opus 4.5 — Pro/Pro+/Power 전용
- Claude Sonnet 4.6 — Sonnet 4.5의 후속 모델
- Claude Sonnet 4.5 — Auto 모드의 주력 모델
- Claude Sonnet 4.0 — 안정적 범용 모델
- Claude Haiku 4.5 — 가장 빠른 경량 모델

Anthropic은 순수 Model Provider로만 참여하며 인프라(Bedrock)나 앱(Kiro)에는 관여하지 않는다.

### 3.4. Amazon 이중 역할(수직통합)

Amazon은 App Provider(Kiro) + Managed AI Platform(Bedrock) 두 레이어를 모두 소유한다. Q Developer CLI → Kiro CLI 리브랜딩이 완료되었고 Q Dev Pro 구독으로도 Kiro에 접근 가능하다(병행 운영).

Anthropic은 Model Provider로만 참여하지만 Kiro/Bedrock 경유와 자사 직접 판매(Claude Code, claude.ai, API) 양쪽에서 수익이 발생한다.

## 4. 같은 모델이지만 다른 성능 — App Provider 레이어의 영향

이 구조에서 주목할 점은 동일한 Claude 모델을 사용하더라도 App Provider 레이어에 따라 코딩 성능이 크게 달라진다는 것이다. 예를 들어 Claude Opus 4.6를 Kiro, Claude Code, Cursor에서 각각 사용하면 체감 품질이 다르다. 이는 모델 자체의 능력이 아니라 모델을 감싸는 에이전트 아키텍처가 다르기 때문이다.

### 4.1. System Prompt & Persona

각 앱이 모델에 주입하는 시스템 프롬프트가 다르다. 에이전트의 행동 규칙, 응답 형식, 역할 정의가 여기서 결정된다. Kiro는 spec-driven 워크플로우를 전제로 설계되었고 Claude Code는 터미널 기반 agentic 실행을 전제로 설계되었다.

### 4.2. Context Window 관리 & RAG 전략

제한된 컨텍스트 윈도우에 어떤 정보를 채우느냐가 핵심이다. Kiro는 steering 파일, spec 문서, 코드베이스 요약을 자동 주입한다. Claude Code는 agentic search로 코드베이스를 자율 탐색하며 필요한 파일을 동적으로 retrieval한다. 어떤 청크를 어떤 시점에 넣느냐에 따라 같은 모델이라도 출력 품질이 달라진다.

### 4.3. Tool Use(Function Calling)

모델에 바인딩되는 도구 정의(tool schema)가 앱마다 다르다. 파일 읽기/쓰기, 셸 실행, 웹 검색, MCP 서버 연동 등 사용 가능한 도구셋과 호출 권한이 다르면 모델이 선택할 수 있는 action space 자체가 달라진다.

### 4.4. Agentic Loop & Orchestration 패턴

단일 LLM 호출이 아닌 multi-step 에이전트 루프의 설계 차이다. Kiro는 Plan → Act → Observe를 spec 단위로 구조화한다(structured orchestration). Claude Code는 ReAct 스타일의 자유형 루프를 돌린다. 루프 내에서 self-correction, retry, sub-agent 위임 등의 전략도 앱마다 다르다.

### 4.5. Planning & Decomposition

복잡한 태스크를 어떻게 분해하느냐의 차이다. Kiro는 요구사항 → 설계 → 태스크 리스트로 명시적 decomposition을 강제한다. Claude Code는 모델이 자체적으로 plan을 세우도록 위임한다. Agent Teams(sub-agent 분기)를 지원하는 경우 병렬 실행도 가능하다.

결국 Model Provider는 foundation model이라는 엔진을 제공하고 App Provider는 그 엔진 위에 에이전트 프레임워크(프롬프트, RAG, 툴, 오케스트레이션)라는 차체를 얹는 구조이다.

# 참고

- <https://aws.amazon.com/bedrock/>
- <https://docs.anthropic.com/en/docs/about-claude/models>
- <https://kiro.dev/docs/>
