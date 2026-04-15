---
title: "[Kiro] CLI 설치 및 설정"
ref: kiro-cli-installation-and-settings
excerpt: "Kiro CLI 설치 방법과 cli.json 설정 파일의 주요 항목을 정리했다."
date: 2026-03-13T21:41+09:00
last_modified_at: 2026-03-13T21:41+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-cli-installation-and-settings.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/kiro-cli-installation-and-settings.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Kiro
tags:
  - Kiro
  - CLI
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

Kiro CLI 설치 방법과 cli.json 설정 파일의 주요 항목을 정리했다.

# 정리

## 1. 설치

### 1.1. cURL

```bash
curl -fsSL https://cli.kiro.dev/install | bash
```

### 1.2. Homebrew

```bash
brew install --cask kiro-cli
```

## 2. 설정 파일

### 2.1. 용도

Kiro CLI의 동작을 제어하는 설정 파일이다. 기능 on/off, 기본 모델, UI 옵션 등을 관리한다.

### 2.2. 위치

- 전역 설정(사용자 전체): `~/.kiro/settings/cli.json` - 모든 프로젝트에서 사용 가능
- 워크스페이스 설정(프로젝트별): `.kiro/settings/cli.json` - 해당 프로젝트에서만 사용, 전역 설정보다 우선 적용

### 2.3. 주요 설정 항목

| 설정 키 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `chat.defaultModel` | string | 없음 | 기본 AI 모델 |
| `chat.defaultAgent` | string | 없음 | 기본 에이전트 |
| `chat.enableThinking` | boolean | false | 복잡한 추론 모드 |
| `chat.enableCheckpoint` | boolean | false | 워크스페이스 스냅샷 |
| `chat.enableTodoList` | boolean | false | TODO 리스트 기능 |
| `chat.enableCodeIntelligence` | boolean | false | 코드 인텔리전스(LSP) |
| `chat.disableMarkdownRendering` | boolean | false | 마크다운 렌더링 끄기 |
| `chat.enableNotifications` | boolean | false | 데스크톱 알림 |
| `chat.enableTangentMode` | boolean | false | 탄젠트 모드(대화 분기) |
| `chat.greeting.enabled` | boolean | true | 시작 인사 메시지 |

## 3. CLI로 설정 관리

### 3.1. 설정 목록 확인

```bash
kiro-cli settings list
```

### 3.2. 설정 값 확인

```bash
kiro-cli settings chat.defaultModel
```

### 3.3. 전역 설정 변경

```bash
kiro-cli settings chat.defaultModel "anthropic.claude-opus-4-6-20250610"
```

### 3.4. 워크스페이스 설정 변경

```bash
kiro-cli settings --workspace chat.defaultModel "anthropic.claude-opus-4-6-20250610"
```

### 3.5. 설정 삭제

```bash
kiro-cli settings --delete chat.defaultModel
kiro-cli settings --delete --workspace chat.defaultModel
```

## 4. 설정 예제

```json
{
  "chat.defaultModel": "anthropic.claude-opus-4-6-20250610",
  "chat.defaultAgent": "my-project",
  "chat.enableThinking": true,
  "chat.enableCheckpoint": true,
  "chat.enableTodoList": true,
  "chat.greeting.enabled": false
}
```

## 5. Claude Code와의 비교

| 역할 | Claude Code | Kiro |
|---|---|---|
| 기능/동작 설정 | settings.json | cli.json |
| 프로젝트 컨텍스트/규칙 | CLAUDE.md | Steering(`.kiro/steering/`) |
| 에이전트별 지시사항 | - | 에이전트 설정의 prompt 필드 |
| 자동 컨텍스트 파일 | CLAUDE.md의 파일 참조 | Steering + 에이전트 설정의 resources 필드 |
| 대화 중 기억 | MEMORY.md | 해당 없음 |

# 참고

- <https://kiro.dev/docs/cli/>
- <https://kiro.dev/docs/settings/>
- <https://kiro.dev/docs/steering/>
