---
title: "[Kiro] 에이전트 설정"
ref: kiro-agent-configuration
excerpt: "Kiro 에이전트의 생성, 설정, 프롬프트 모듈화, 서브 에이전트 활용까지 정리했다."
date: 2026-03-13T21:42+09:00
last_modified_at: 2026-03-13T21:42+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-agent-configuration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/kiro-agent-configuration.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Kiro
tags:
  - Kiro
  - Agent
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

Kiro 에이전트의 생성, 설정, 프롬프트 모듈화, 서브 에이전트 활용까지 정리했다.

# 정리

## 1. 설정 파일

### 1.1. 용도

에이전트의 행동 규칙, 사용 도구, 컨텍스트 파일, MCP 서버 등을 정의하는 설정 파일이다.

### 1.2. 위치

- 전역 에이전트 (사용자 전체): `~/.kiro/agents/<name>.json` — 모든 프로젝트에서 사용 가능
- 워크스페이스 에이전트 (프로젝트별): `.kiro/agents/<name>.json` — 해당 프로젝트에서만 사용, 전역 에이전트보다 우선 적용

### 1.3. 기본 구조

```json
{
  "name": "에이전트-이름",
  "description": "에이전트 설명",
  "prompt": "시스템 프롬프트 또는 file:///경로/프롬프트.txt",
  "tools": ["fs_read", "fs_write", "execute_bash", "grep", "glob", "code"],
  "allowedTools": ["fs_read", "grep", "glob"],
  "resources": ["file://README.md", "file://src/**/*.swift"],
  "hooks": {},
  "mcpServers": {}
}
```

### 1.4. 주요 필드

| 필드 | 설명 |
|---|---|
| `name` | 에이전트 이름 |
| `description` | 에이전트 설명 |
| `prompt` | 시스템 프롬프트 (인라인 텍스트 또는 `file://` URI) |
| `tools` | 사용 가능한 도구 목록 |
| `allowedTools` | 자동 승인 도구 (확인 없이 실행) |
| `resources` | 매 대화마다 자동 로드할 컨텍스트 파일 |
| `hooks` | 이벤트 기반 자동 실행 명령어 |
| `mcpServers` | 에이전트 전용 MCP 서버 |
| `model` | 에이전트 전용 모델 |
| `keyboardShortcut` | 에이전트 전환 단축키 |

## 2. 에이전트 생성

### 2.1. 슬래시 명령어

```
/agent generate
```

### 2.2. CLI 명령어

```bash
kiro-cli agent create --name my-project
```

### 2.3. 수동 생성

`.kiro/agents/my-project.json` 파일을 직접 작성한다.

## 3. 에이전트 관리

### 3.1. 에이전트 목록

```bash
kiro-cli agent list
```

### 3.2. 에이전트 검증

```bash
kiro-cli agent validate --path .kiro/agents/my-project.json
```

### 3.3. 기본 에이전트 설정

```bash
kiro-cli agent set-default my-project
```

### 3.4. 채팅에서 전환

```
/agent my-project
```

## 4. 설정 예제

### 4.1. iOS 개발 에이전트

```json
{
  "name": "my-project",
  "description": "iOS 개발 에이전트",
  "prompt": "file:///Users/username/.kiro/prompts/my-project.txt",
  "tools": ["fs_read", "fs_write", "execute_bash", "grep", "glob", "code"],
  "allowedTools": ["fs_read", "grep", "glob", "code"],
  "resources": [
    "file://README.md"
  ]
}
```

### 4.2. 기존 CLAUDE.md 재활용

Claude Code에서 사용하던 CLAUDE.md를 Kiro 에이전트의 prompt로 그대로 활용할 수 있다.

```json
{
  "name": "my-project",
  "prompt": "file:///Users/username/.claude/CLAUDE.md",
  "resources": ["file://README.md"]
}
```

## 5. 모듈화된 프롬프트 구조

프롬프트를 모듈로 분리하여 재사용성과 유지보수성을 높일 수 있다.

### 5.1. 디렉토리 구조

```
~/.kiro/
├── agents/
│   ├── developer-ios.json
│   └── reviewer-ios.json
└── prompts/
    ├── modules/
    │   ├── common-rules.md
    │   ├── developer-ios-rules.md
    │   └── reviewer-ios-rules.md
    └── agents/
        ├── developer-ios.md
        └── reviewer-ios.md
```

### 5.2. 모듈 파일 예시

`common-rules.md` (공통 규칙)

```markdown
# 공통 규칙

## 1. 언어

### 1.1. 한국어

- 연속된 항목을 나열할 때만 쉼표를 사용한다
- 접속 부사나 연결 어미 뒤에는 쉼표를 찍지 않는다

## 2. 도구

### 2.1. GitLab

- GitLab 작업은 GitLab MCP를 사용한다
- 호스트는 `gitlab.example.com`이다
```

`developer-ios-rules.md` (iOS 개발 규칙)

```markdown
# iOS 개발 규칙

## 1. Swift 스타일 컨벤션

- 타입 선언 후 빈 줄을 추가한다
- 파라미터가 2개 이상이면 각 파라미터를 개행한다
- guard 문 뒤에는 반드시 빈 줄을 추가한다
- return은 생략하지 않고 항상 명시한다
```

### 5.3. 통합 프롬프트

`developer-ios.md` (모듈 참조)

```markdown
# iOS 개발자 에이전트

당신은 10년 이상 경력의 시니어 iOS 개발자다. Swift와 iOS 프레임워크에 정통하며 클린 코드와 아키텍처 설계에 능숙하다.

다음 규칙을 따른다.

- 공통 규칙은 `~/.kiro/prompts/modules/common-rules.md`에 정의되어 있다
- iOS 개발 규칙은 `~/.kiro/prompts/modules/developer-ios-rules.md`에 정의되어 있다
```

### 5.4. 에이전트 설정

```json
{
  "name": "developer-ios",
  "description": "iOS 개발 에이전트",
  "prompt": "file:///Users/username/.kiro/prompts/agents/developer-ios.md",
  "tools": ["fs_read", "fs_write", "execute_bash", "grep", "glob", "code"],
  "allowedTools": ["fs_read", "grep", "glob", "code"],
  "resources": ["file://README.md"]
}
```

### 5.5. 모듈화의 장점

- 재사용성: 공통 규칙을 여러 에이전트에서 공유
- 유지보수: 규칙 변경 시 모듈 파일만 수정
- 명확성: 역할별로 규칙이 분리되어 관리 용이

## 6. 서브 에이전트

여러 에이전트를 병렬로 실행하여 복잡한 작업을 분담할 수 있다.

### 6.1. 활성화

```bash
kiro-cli settings chat.enableSubagent true
```

### 6.2. 사용 예시

요청:

```
reviewer-ios 에이전트로 현재 브랜치의 변경사항 리뷰해줘
```

동작 흐름은 아래와 같다.

1. 메인 에이전트가 `use_subagent` 도구 호출
2. reviewer-ios 서브 에이전트 실행
3. 서브 에이전트가 git diff 확인 및 코드 리뷰 수행
4. 결과를 메인 에이전트에 반환

### 6.3. 특징

- 최대 4개 서브 에이전트 동시 실행
- 각 서브 에이전트는 독립된 컨텍스트
- 병렬 처리로 빠른 실행
- 전문화된 에이전트 활용 가능

### 6.4. 활용 시나리오

- 개발 + 리뷰: developer-ios로 코드 작성 후 reviewer-ios로 리뷰
- 멀티 플랫폼: iOS와 Android 에이전트 동시 실행
- 역할 분담: 백엔드, 프론트엔드, 인프라 에이전트 병렬 작업

## 7. 세션 중 임시 컨텍스트 추가

에이전트 설정 외에 대화 중 임시로 파일을 컨텍스트에 추가할 수 있다 (세션 종료 시 사라짐).

```
/context add README.md docs/**/*.md
/context show
/context remove README.md
/context clear
```

# 참고

- <https://kiro.dev/docs/agents/>
- <https://kiro.dev/docs/context/>
