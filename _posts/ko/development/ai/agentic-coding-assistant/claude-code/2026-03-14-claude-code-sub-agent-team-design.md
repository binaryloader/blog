---
title: "[Claude Code] Subagent로 전문가 팀 설계하기"
ref: claude-code-sub-agent-team-design
excerpt: "Claude Code의 Subagent, Skill, Rule, Hook, MCP Server를 조합하여 기획부터 배포까지 전문가 팀을 구성하는 방법을 정리했다."
date: 2026-03-14T00:40+09:00
last_modified_at: 2026-03-14T00:40+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/claude-code-sub-agent-team-design.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/claude-code-sub-agent-team-design.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Claude-Code
tags:
  - Claude Code
  - Subagent
  - MCP
  - Agentic Coding
depth:
  - title: "Development"
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "Agentic Coding Assistant"
    url: /ko/development/ai/agentic-coding-assistant/
  - title: "Claude Code"
    url: /ko/development/ai/agentic-coding-assistant/claude-code/
---

# 개요

Claude Code의 Subagent, Skill, Rule, Hook, MCP Server를 조합하여 기획부터 배포까지 전문가 팀을 구성하는 방법을 정리했다.

# 정리

## 1. 아키텍처 개요

Claude Code는 메인 에이전트가 사용자와 대화하며 필요에 따라 Subagent를 호출하는 구조이다. `.claude/` 디렉토리 아래에 에이전트, 스킬, 룰을 배치하면 하나의 CLI 도구로 전체 개발 팀을 운영할 수 있다.

```
CEO (사용자)
    │
    ▼
Claude Code 메인 세션 (CTO / 오케스트레이터)
    │
    ├── 기획팀 ─── product-planner, ui-designer, tech-writer
    ├── 개발팀 ─── dev-planner, ios-developer, server-developer, infra-developer
    ├── 리뷰팀 ─── ios-reviewer-arch/quality, server-reviewer-arch/quality, infra-reviewer-security/ops
    └── 품질팀 ─── qa-engineer, security-auditor
```

| 팀 | 에이전트 | 역할 | 모델 | 모드 | 격리 |
|---|---|---|---|---|---|
| 기획 | `product-planner` | 기획자 | opus | plan | - |
| 기획 | `ui-designer` | 디자이너 | sonnet | plan | - |
| 기획 | `tech-writer` | 테크니컬 라이터 | sonnet | acceptEdits | - |
| 개발 | `dev-planner` | 개발 플래너 | opus | plan | - |
| 개발 | `ios-developer` | iOS 개발자 | opus | default | worktree |
| 개발 | `server-developer` | 서버 개발자 | opus | default | worktree |
| 개발 | `infra-developer` | 인프라 개발자 | opus | default | worktree |
| 리뷰 | `ios-reviewer-arch` | iOS 아키텍처 | sonnet | plan | - |
| 리뷰 | `ios-reviewer-quality` | iOS 품질 | sonnet | plan | - |
| 리뷰 | `server-reviewer-arch` | 서버 아키텍처 | sonnet | plan | - |
| 리뷰 | `server-reviewer-quality` | 서버 품질 | sonnet | plan | - |
| 리뷰 | `infra-reviewer-security` | 인프라 보안 | sonnet | plan | - |
| 리뷰 | `infra-reviewer-ops` | 인프라 운영 | sonnet | plan | - |
| 품질 | `qa-engineer` | QA 엔지니어 | sonnet | default | - |
| 품질 | `security-auditor` | 보안 감사자 | opus | plan | - |

핵심 제약사항은 아래와 같다.

- 서브 에이전트는 다른 서브 에이전트를 생성할 수 없다. 메인 세션이 모든 조율을 담당한다
- 에이전트 팀(Agent Teams)은 실험적 기능이다. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 환경 변수가 필요하다
- 에이전트 팀의 팀원은 서로 직접 통신하지만 중첩 팀은 불가하다

서브 에이전트와 에이전트 팀의 사용 기준은 아래와 같다.

- **서브 에이전트**: 단일 작업 위임 후 결과 반환 (리뷰, 분석, 단일 기능 구현)
- **에이전트 팀**: 여러 에이전트가 장시간 독립적으로 병렬 작업 (iOS + 서버 동시 개발)

## 2. 파일 맵

### 2.1. 전역 설정 (~/.claude/)

모든 프로젝트에 공통 적용되는 사용자 레벨 설정이다. 어떤 디렉토리에서 Claude Code를 실행해도 항상 로드된다.

```
~/.claude/
├── CLAUDE.md                       # 전역 규칙 (CLAUDE.md/MEMORY.md 포맷, rules/ 참조)
├── settings.json                   # 전역 권한, 플러그인, 환경 변수, hooks
├── .mcp.json                       # MCP 서버 설정 (9개)
│
├── rules/                          # 전역 규칙 (10개)
│   ├── markdown.md                 # Markdown 헤딩/불렛/개행 규칙 (항상 로드)
│   ├── korean.md                   # 한국어 쉼표/문체 규칙 (항상 로드)
│   ├── git.md                      # Git 커밋/GitHub 저장소 규칙 (항상 로드)
│   ├── security.md                 # 보안 규칙 (항상 로드)
│   ├── swift.md                    # Swift 스타일/TCA (paths: **/*.swift)
│   ├── xcode.md                    # Xcode 헤더/프로젝트 (paths: **/*.swift, **/Package.swift, **/Project.swift)
│   ├── kotlin.md                   # Kotlin 서버 규칙 (paths: server/**/*.kt)
│   ├── terraform.md                # Terraform 규칙 (paths: infra/**/*.tf)
│   ├── api-design.md               # REST API 설계 (paths: **/api/**, **/controller/**, **/Controller/**, **/routes/**)
│   └── image-metadata.md           # 이미지 메타데이터 (paths: **/*.jpg 등)
│
├── agents/                         # 서브 에이전트 (15개)
│   ├── product-planner.md          # 기획자 (opus, plan, memory:project)
│   ├── ui-designer.md              # 디자이너 (sonnet, plan, MCP:figma)
│   ├── tech-writer.md              # 테크니컬 라이터 (sonnet, acceptEdits)
│   ├── dev-planner.md              # 개발 플래너 (opus, plan, memory:project)
│   ├── ios-developer.md            # iOS 개발자 (opus, worktree, memory:project, hooks)
│   ├── server-developer.md         # 서버 개발자 (opus, worktree, memory:project, hooks)
│   ├── infra-developer.md          # 인프라 개발자 (opus, worktree, memory:project, hooks)
│   ├── ios-reviewer-arch.md        # iOS 아키텍처 리뷰어 (sonnet, plan)
│   ├── ios-reviewer-quality.md     # iOS 품질 리뷰어 (sonnet, plan)
│   ├── server-reviewer-arch.md     # 서버 아키텍처 리뷰어 (sonnet, plan)
│   ├── server-reviewer-quality.md  # 서버 품질 리뷰어 (sonnet, plan)
│   ├── infra-reviewer-security.md  # 인프라 보안 리뷰어 (sonnet, plan)
│   ├── infra-reviewer-ops.md       # 인프라 운영 리뷰어 (sonnet, plan)
│   ├── qa-engineer.md              # QA 엔지니어 (sonnet, default)
│   └── security-auditor.md         # 보안 감사자 (opus, plan)
│
├── skills/                         # 워크플로우 (5개)
│   ├── plan-feature/SKILL.md       # /plan-feature <기능>
│   ├── develop/SKILL.md            # /develop <작업>
│   ├── review-all/SKILL.md         # /review-all [브랜치]
│   ├── release/SKILL.md            # /release <버전>
│   └── standup/SKILL.md            # /standup
│
└── hooks/                          # hooks 스크립트 (3개)
    ├── lint-swift.sh               # Swift 파일 수정 전 린트 확인
    ├── lint-kotlin.sh              # Kotlin 파일 수정 전 린트 확인
    └── notify.sh                   # 서브 에이전트 완료 알림
```

### 2.2. 프로젝트 설정

모든 에이전트, 스킬, 규칙, hooks는 전역(`~/.claude/`)에서 관리한다. 개별 프로젝트에는 프로젝트 고유 설정만 둔다.

```
my-project/
├── CLAUDE.md                       # 프로젝트 루트 규칙 (기술 스택, 빌드, @import)
├── .mcp.json                       # MCP 서버 설정 (프로젝트별)
│
├── .claude/
│   ├── settings.json               # 프로젝트 권한, 환경 변수 (팀 공유)
│   ├── settings.local.json         # 로컬 전용 시크릿 (.gitignore)
│   └── rules/                      # 프로젝트 특화 규칙 (선택사항)
│       ├── frontmatter.md          # 블로그 Front Matter 규칙 등
│       └── writing.md              # 프로젝트 고유 작성 규칙 등
│
├── ios/                            # iOS 앱 소스 (Swift/SwiftUI)
├── server/                         # 백엔드 서버 (Spring Boot/Kotlin)
├── infra/                          # 인프라 코드 (Terraform)
└── docs/                           # 프로젝트 문서
```

전역 에이전트/스킬이 모든 프로젝트에서 동작하는 원리는 아래와 같다.

- `~/.claude/agents/*.md`에 정의된 에이전트는 어떤 디렉토리에서 Claude Code를 실행해도 자동으로 사용 가능하다
- `~/.claude/skills/*/SKILL.md`에 정의된 스킬도 마찬가지로 전역으로 호출 가능하다
- `~/.claude/rules/*.md`의 `paths` 매칭은 현재 작업 중인 프로젝트의 파일 경로에 대해 적용된다
- `~/.claude/settings.json`의 hooks도 모든 프로젝트에서 실행된다

## 3. 에이전트 설계 (15명)

에이전트는 `.claude/agents/` 디렉토리에 Markdown 파일로 정의한다. YAML Frontmatter로 메타데이터를 설정하고 본문에 역할 지시사항을 작성한다.

### 3.1. 기획 팀

**product-planner** — 제품 기획, 사용자 스토리, PRD 작성. WebSearch로 시장 조사까지 수행한다.

- 모델: opus / 권한: plan
- 도구: Read, Glob, Grep, Write, Edit, WebSearch, WebFetch
- 메모리: project (프로젝트별 기획 이력 기억)
- 역할: 사용자 스토리 정의, MoSCoW/RICE 우선순위, MVP 범위 정의
- 출력: PRD 문서 (배경, 목표, 수용 기준, 제외 범위)

**ui-designer** — UI/UX 설계, 화면 흐름 정의, 디자인 시스템 관리. Figma MCP와 연동한다.

- 모델: sonnet / 권한: plan
- 도구: Read, Glob, Grep, Write, Edit, WebSearch, WebFetch
- MCP: figma (디자인 파일 참조)
- 역할: 화면 흐름, 와이어프레임 명세, 디자인 시스템 정의
- 원칙: 모바일 퍼스트, HIG 준수, VoiceOver/Dynamic Type 지원

**tech-writer** — 티켓, 위키, API 문서, README 작성. MCP로 외부 도구에 직접 작성한다.

- 모델: sonnet / 권한: acceptEdits
- 도구: Read, Write, Edit, Glob, Grep, WebFetch
- MCP: jira (티켓), confluence (위키), github (PR/README)
- 출력: 티켓, 위키, OpenAPI 문서, CHANGELOG, 릴리즈 노트
- 형식: Mermaid 다이어그램 활용

### 3.2. 개발 팀

**dev-planner** — PRD 기반 기술 설계(TDD), 작업 분해, API 인터페이스 설계. 코드베이스를 읽고 분석한다.

- 모델: opus / 권한: plan
- 도구: Read, Glob, Grep, Write, Edit, WebSearch, WebFetch
- 메모리: project (설계 이력 기억)
- MCP: sequential-thinking (복잡한 설계 의사결정), jira (요구사항 참조), confluence (설계 문서 참조)
- 역할: API 인터페이스, DB 스키마, iOS/서버/인프라 작업 분해, 의존성 그래프
- 원칙: YAGNI, 작업 단위 1일 이내, API 계약 우선

모든 개발자 에이전트는 `isolation: worktree`로 격리된 Git worktree에서 작업하여 서로 충돌 없이 병렬 개발이 가능하다.

**ios-developer** — Swift/SwiftUI iOS 앱 개발. 격리된 worktree에서 작업한다.

- 모델: opus / 권한: default / 격리: worktree
- 도구: Read, Write, Edit, Glob, Grep, Bash, LSP
- 메모리: project
- MCP: github, figma, context7, jira, confluence
- 스킬: develop
- hooks: PostToolUse — Write/Edit 시 `swift-format` + `swiftlint --fix` 자동 실행
- 스택: Swift 6, SwiftUI, TCA, SPM, SwiftData, async/await
- 브랜치: `feature/ios-*`

**server-developer** — Spring Boot/Kotlin 서버 개발. API 구현, DB 설계.

- 모델: opus / 권한: default / 격리: worktree
- 도구: Read, Write, Edit, Glob, Grep, Bash, LSP
- 메모리: project
- MCP: github, postgres, context7, jira, confluence
- 스킬: develop
- hooks: PostToolUse — Write/Edit 시 `ktlint --format` 자동 실행
- 스택: Spring Boot 3, Kotlin, PostgreSQL, Redis, Flyway
- 브랜치: `feature/server-*`

**infra-developer** — AWS 인프라 구축, Terraform IaC, CI/CD 파이프라인.

- 모델: opus / 권한: default / 격리: worktree
- 도구: Read, Write, Edit, Glob, Grep, Bash
- 메모리: project
- MCP: github, context7, jira, confluence
- 스킬: develop
- hooks: PostToolUse — Write/Edit 시 `terraform fmt` 자동 실행
- 스택: AWS (ECS, RDS, S3, CloudFront, ALB), Terraform, GitHub Actions, Docker
- 브랜치: `feature/infra-*`

### 3.3. 리뷰 팀

개발자당 2명으로 아키텍처 관점과 품질 관점을 분리하여 다각적으로 리뷰한다. 모든 리뷰어는 `permissionMode: plan`으로 읽기 전용이다.

**iOS 리뷰**

| 에이전트 | 관점 | 필수(🔴) | 권장(🟡) |
|---|---|---|---|
| `ios-reviewer-arch` | TCA 패턴 준수, 모듈 의존성 방향, 책임 분리, SOLID 원칙 | 아키텍처 위반, 순환 의존성, 계층 침범 | 구조 개선 제안 |
| `ios-reviewer-quality` | 옵셔널 처리, 순환 참조, 불필요한 렌더링, MainActor/Sendable | 크래시, 메모리 누수, 데이터 레이스 | 성능 개선, 가독성 |

**서버 리뷰**

| 에이전트 | 관점 | 필수(🔴) | 권장(🟡) |
|---|---|---|---|
| `server-reviewer-arch` | REST 원칙, 정규화, Controller/Service/Repository 분리, 확장성 | API 계약 위반, 데이터 정합성 위험 | 설계 개선, 성능 최적화 |
| `server-reviewer-quality` | SQL Injection, XSS, CSRF, N+1, Bean Validation, 로깅 | 보안 취약점, 데이터 유실, 리소스 누수 | 에러 처리 보강 |

**인프라 리뷰**

| 에이전트 | 관점 | 필수(🔴) | 권장(🟡) |
|---|---|---|---|
| `infra-reviewer-security` | 최소 권한, 보안 그룹, Secrets Manager, TLS/KMS, CloudTrail | 퍼블릭 노출, 시크릿 하드코딩, 과도한 권한 | 보안 강화, 감사 로그 |
| `infra-reviewer-ops` | 다중 AZ, 오토 스케일링, CloudWatch, 백업/복원, 태깅 전략 | 단일 장애점, 백업 없음, 비용 폭탄 | 비용 절감, 모니터링 강화 |

### 3.4. QA/보안 팀

**qa-engineer** — 유닛/통합 테스트 작성, 테스트 시나리오 설계, 엣지 케이스 탐색

- 모델: sonnet / 권한: default
- 도구: Read, Write, Edit, Glob, Grep, Bash
- 패턴: Given-When-Then, 팩토리 패턴으로 테스트 데이터 생성
- iOS: XCTest, Swift Testing
- 서버: JUnit 5, MockK, Testcontainers
- 원칙: Mock보다 실제 구현 우선, 경계값/null/예외 필수

**security-auditor** — OWASP Top 10, 인증/인가, 민감 정보 노출, 의존성 취약점 감사

- 모델: opus / 권한: plan
- 도구: Read, Glob, Grep, Bash
- MCP: sequential-thinking (체계적 보안 분석)
- 점검: OWASP A01~A10 전체, JWT/세션, SQL/NoSQL Injection, CVE
- iOS 보안: 키체인 사용, ATS, 인증서 고정
- 심각도: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low (4단계)

### 3.5. 에이전트 설정 상세

#### 3.5.1. Frontmatter 필드

```yaml
---
name: ios-developer
description: iOS 앱 개발 전문가. Swift/UIKit/SwiftUI 코드 작성을 요청할 때 사용한다.
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - LSP
model: opus
isolation: worktree
memory: project
permissionMode: default
mcpServers:
  - github
  - figma
  - context7
  - jira
  - confluence
skills:
  - develop
hooks:
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: >-
            file="$TOOL_INPUT_file_path";
            [[ "$file" == *.swift ]] &&
            swift-format format --in-place "$file" 2>/dev/null &&
            swiftlint --fix --quiet --path "$file" 2>/dev/null; true
          timeout: 10
---
```

| 필드 | 설명 | 예시 |
|---|---|---|
| `name` | 에이전트 고유 이름 | `ios-developer` |
| `description` | Claude가 자동으로 적합한 에이전트를 선택하는 데 사용 | "iOS 앱 개발 전문가..." |
| `model` | 사용할 모델 (`opus`, `sonnet`) | `opus` |
| `tools` | 접근 가능한 도구 목록 | Read, Write, Bash, LSP |
| `permissionMode` | `plan`=읽기 전용, `default`=쓰기, `acceptEdits`=자동 승인 | `plan` |
| `isolation` | `worktree`로 격리된 Git worktree에서 실행 | `worktree` |
| `memory` | 메모리 범위 (`user`, `project`, `local`) | `project` |
| `mcpServers` | 접근 가능한 MCP 서버 제한 | github, figma |
| `skills` | 이 에이전트에서 사용 가능한 스킬 | develop |
| `hooks` | 이 에이전트에서만 실행되는 훅 | PostToolUse → swift-format |

#### 3.5.2. 모델 배분

| 모델 | 에이전트 수 | 에이전트 목록 | 용도 |
|---|---|---|---|
| `opus` | 6명 | product-planner, dev-planner, ios-developer, server-developer, infra-developer, security-auditor | 창의적 사고, 정확한 코드 생성, 깊은 분석 |
| `sonnet` | 9명 | ui-designer, 리뷰어 6명, qa-engineer, tech-writer | 패턴화된 작업, 읽기 전용 분석, 문서 작성 — 비용 효율적 |

#### 3.5.3. 권한 모드

| 모드 | 설명 | 에이전트 |
|---|---|---|
| `plan` (읽기 전용) | 코드 수정 불가, 분석/리뷰만 가능 | 기획팀 2명, dev-planner, 리뷰어 6명, security-auditor |
| `default` (기본) | 수정 시 사용자 승인 필요 | ios-developer, server-developer, infra-developer, qa-engineer |
| `acceptEdits` | 파일 수정 자동 승인 | tech-writer |

## 4. 에이전트 팀 (실험적)

### 4.1. 서브 에이전트 vs 에이전트 팀

에이전트 팀은 여러 Claude Code 인스턴스가 독립적으로 병렬 실행되며 서로 직접 통신하는 기능이다. 서브 에이전트와 달리 각 팀원이 자신의 컨텍스트를 유지하며 공유 작업 목록으로 자체 조율한다.

| | 서브 에이전트 | 에이전트 팀 |
|---|---|---|
| 통신 | 메인에게만 보고 | 팀원 간 직접 메시지 |
| 조율 | 메인이 모든 작업 관리 | 공유 작업 목록으로 자체 조율 |
| 컨텍스트 | 결과만 반환 | 완전 독립 유지 |
| 비용 | 낮음 | 높음 (독립 인스턴스) |
| 적합한 작업 | 단일 작업 위임 | 장시간 병렬 개발 |

### 4.2. 활성화

`~/.claude/settings.json`에 환경 변수를 설정한다.

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### 4.3. 팀 구성 시나리오

큰 기능을 iOS + 서버 + 인프라 동시 개발할 때 에이전트 팀을 사용한다.

```
팀 리더 (메인 세션 = CTO)
    │
    ├── 팀원 1: iOS 개발     ← ios-developer 에이전트 설정으로 실행
    │   └── feature/ios-social-login 브랜치
    │
    ├── 팀원 2: 서버 개발    ← server-developer 에이전트 설정으로 실행
    │   └── feature/server-social-login 브랜치
    │
    └── 팀원 3: 인프라       ← infra-developer 에이전트 설정으로 실행
        └── feature/infra-oauth-provider 브랜치

    통신: 공유 작업 목록 + 메일박스 시스템
    표시: tmux 분할 창 또는 in-process (Shift+Down으로 순환)
```

에이전트 팀을 사용하는 기준은 아래와 같다.

- iOS + 서버 + 인프라를 **동시에 장시간** 개발할 때
- 팀원끼리 **API 계약을 조율**해야 할 때
- 작업이 **30분 이상** 걸릴 것으로 예상될 때

서브 에이전트를 사용하는 기준은 아래와 같다.

- 단일 리뷰, 단일 분석, 단일 기능 구현
- 결과만 받으면 되는 짧은 작업
- 비용을 절약하고 싶을 때

## 5. 스킬 설계

Skills는 반복되는 워크플로우를 `/skill-name`으로 호출하는 자동화 단위이다. `context: fork`로 격리된 서브 에이전트에서 실행하거나 메인 세션에서 직접 실행할 수 있다.

### 5.1. Frontmatter 필드

| 필드 | 설명 |
|---|---|
| `name` | 호출 이름 (`/name`) |
| `description` | Claude가 자동 호출 시기를 판단하는 데 사용 |
| `argument-hint` | 인자 힌트 (사용자에게 표시) |
| `context: fork` | 격리된 서브 에이전트 컨텍스트에서 실행 |
| `agent` | `context: fork` 시 사용할 에이전트 |
| `disable-model-invocation` | `true`면 수동 호출만 (자동 호출 안 함) |
| `allowed-tools` | 승인 없이 사용 가능한 도구 |

### 5.2. 동적 컨텍스트 주입

`` !`command` `` 구문으로 skill 로드 시 셸 명령을 실행하여 결과를 주입한다. 실시간 프로젝트 상태를 skill에 전달하는 핵심 메커니즘이다.

```bash
# 예시: skill 본문에서 아래처럼 작성하면
!`git diff --stat`
!`git log --oneline -5`
!`gh pr list --state open`

# → skill 로드 시 자동 실행되어 결과가 컨텍스트에 주입된다
```

### 5.3. 스킬 상세

#### 5.3.1. /plan-feature <기능>

새 기능의 기획부터 기술 설계, 작업 분해, 문서화까지 전체 플로우를 실행한다. "기능 기획", "PRD", "새 기능 플래닝"을 요청할 때 자동 호출된다.

- 동적 주입: `git log --oneline -10`, `ls -la docs/`
- 1단계: **product-planner** — PRD 작성 (사용자 스토리, 수용 기준, 우선순위, 제외 범위)
- 2단계: **dev-planner** — 기술 설계 (API 인터페이스, DB 스키마, 작업 분해, 의존성 그래프)
- 3단계: **ui-designer** — UI/UX 설계 (화면 흐름, UI 명세)
- 4단계: **tech-writer** — 문서화 (MCP로 티켓 생성, 위키 등록, docs/ 저장)
- 5단계: **메인 세션** — 최종 보고 (기능 요약, 예상 작업량, 리스크, 다음 단계)

#### 5.3.2. /develop <작업>

개발, 테스트, 코드 리뷰를 순차적으로 실행한다. "개발해줘", "구현해줘", "코딩해줘"를 요청할 때 자동 호출된다.

- 동적 주입: `git branch --show-current`, `git status -s`
- 1단계: **작업 분석** — 파일 유형별 개발자 에이전트 결정 (*.swift→ios-developer, server/**→server-developer, infra/**→infra-developer)
- 2단계: **컨텍스트 수집** — 티켓 번호나 외부 문서 참조가 있으면 Jira 티켓, Confluence 설계 문서, API 스펙 등 관련 정보를 수집하여 이후 단계에 전달
- 3단계: **\*-developer 에이전트** — 기능 브랜치에서 코드 작성, Conventional Commits
- 4단계: **qa-engineer** — 유닛 테스트 작성 및 실행
- 5단계: **리뷰어 2명** — 변경 파일 유형에 따른 병렬 리뷰
- 6단계: **PR 생성** — 리뷰 결과에 🔴 항목이 없으면 GitHub에 PR을 생성한다. PR 제목과 본문을 자동 작성하며 리뷰 결과 요약을 포함한다
- 7단계: **결과 보고** — 구현 요약, 테스트 결과, 리뷰 결과 (심각도별)

#### 5.3.3. /review-all [대상]

현재 브랜치의 변경 사항에 대해 아키텍처, 품질, 보안 리뷰를 병렬로 실행한다. "리뷰해줘", "코드 리뷰", "PR 리뷰"를 요청할 때 자동 호출된다.

- 동적 주입: `git diff --name-only main...HEAD`, `git diff --stat main...HEAD`
- 1단계: **변경 파일 분류** — *.swift → iOS, *.kt → 서버, *.tf → 인프라
- 2단계: **도메인별 리뷰어 2명** — 병렬 호출 (아키텍처 + 품질)
- 3단계: **security-auditor** — 전체 변경에 대한 보안 감사
- 4단계: **종합 리포트** — 🔴 필수 수정 / 🟡 권장 / 🟢 참고 분류, 머지 go/no-go 판단

#### 5.3.4. /release <버전>

릴리즈 체크리스트를 실행한다. `disable-model-invocation: true`로 수동 호출만 가능하다.

- 동적 주입: `git log --oneline main..HEAD`, `git tag --list --sort=-version:refname | head -5`
- 1단계: **qa-engineer** — 전체 테스트 + 커버리지 확인
- 2단계: **security-auditor** — 최종 보안 감사, 의존성 CVE 스캔
- 3단계: **infra-developer** — 배포 스크립트, 환경 변수, 롤백 계획, DB 마이그레이션 확인
- 4단계: **tech-writer** — CHANGELOG, 릴리즈 노트, API 문서 확인
- 5단계: **Go/No-Go 판단** — 체크리스트 종합 (테스트, 보안, 배포, 문서)

#### 5.3.5. /standup

일일 현황 보고서를 생성한다. `context: fork`로 격리 실행하며 `disable-model-invocation: true`로 수동 호출만 가능하다.

- 동적 주입: `git log --since="24 hours ago"`, `git branch -a`, `git status -s`, `gh pr list`, `gh run list --status failure`
- 출력: 어제 완료 / 오늘 진행 예정 / 블로커 / 수치 (커밋, PR, CI)

## 6. 룰 설계

`rules/` 디렉토리에 마크다운 파일을 두면 `paths` frontmatter로 특정 파일 작업 시에만 자동 로드된다. CLAUDE.md에서 import할 필요 없이 해당 파일을 다룰 때 자동으로 규칙이 적용된다.

### 6.1. 전역 룰 (~/.claude/rules/)

10개 파일을 관리한다. 모든 프로젝트에 공통 적용된다.

#### 6.1.1. 항상 로드 (paths 없음)

| 파일 | 내용 |
|---|---|
| `markdown.md` | H2~H4 헤딩 번호 부여, 불렛 포인트 규칙 (콜론 금지, 완전한 문장), 개행 규칙 |
| `korean.md` | 쉼표는 나열에만 사용 (접속 부사 뒤 금지), 종결어미 `~한다` 체 통일 |
| `git.md` | Conventional Commits, Co-Authored-By 금지, MCP GitHub 도구 활용, 저장소 네이밍 |
| `security.md` | 시크릿 하드코딩 금지, JWT 만료/Refresh Token 관리, SQL Injection/XSS 방지 |

#### 6.1.2. 경로 기반 로드

| 파일 | paths | 내용 |
|---|---|---|
| `swift.md` | `**/*.swift` | Airbnb Style Guide, TCA 패턴, 파라미터 개행 규칙 |
| `xcode.md` | `**/*.swift`, `**/Package.swift`, `**/Project.swift` | Xcode 파일 헤더 주석, Swift Package 우선, 최소 iOS 16 |
| `kotlin.md` | `server/**/*.kt` | Kotlin 공식 컨벤션, Spring Boot 계층 분리, N+1 방지 |
| `terraform.md` | `infra/**/*.tf` | 환경별 분리, 모듈화, S3+DynamoDB 상태 관리, 최소 권한 |
| `api-design.md` | `**/api/**`, `**/controller/**`, `**/Controller/**`, `**/routes/**` | REST 원칙, 통일 응답 포맷 (`data/error/meta`), Cursor 페이지네이션 |
| `image-metadata.md` | `**/*.jpg`, `**/*.png` 등 | ICC 프로파일 보존, 개인정보만 제거, HEIC→JPG 변환 |

### 6.2. 프로젝트 룰 (.claude/rules/)

개별 프로젝트에서만 적용되는 특화 규칙이다. 전역 Rules로 충분하지 않은 프로젝트 고유 요구사항이 있을 때 추가한다.

| 프로젝트 | 파일 | paths | 내용 |
|---|---|---|---|
| 블로그 | `frontmatter.md` | `**/*.md` | Jekyll Front Matter 형식, 카테고리/태그 규칙 |
| 블로그 | `writing.md` | (항상 로드) | 글쓰기 스타일, 포스트 구조 규칙 |
| iOS 앱 | `testing.md` | `**/*Test*.swift` | XCTest/Swift Testing 작성 규칙 |

전역 vs 프로젝트 Rules 운영 원칙은 아래와 같다.

- 모든 프로젝트에 공통 적용되는 규칙은 전역 Rules에서 관리한다
- 프로젝트 Rules는 해당 프로젝트에만 필요한 고유 규칙에만 사용한다
- 전역 Rules와 프로젝트 Rules에 같은 주제가 있으면 둘 다 로드되어 합산 적용된다

### 6.3. 에이전트와 룰의 분리

에이전트 본문에 코딩 규칙을 작성하면 아래 문제가 생긴다.

- 여러 에이전트에서 같은 규칙이 중복된다
- 규칙을 수정할 때 모든 에이전트를 찾아 변경해야 한다
- 에이전트의 컨텍스트 윈도우를 불필요하게 소모한다

룰의 `paths` 자동 로딩을 활용하면 에이전트는 역할 설명만 간결하게 유지할 수 있다.

## 7. 훅 설정

Claude Code 수명 주기의 특정 지점에서 자동 실행되는 핸들러이다.

### 7.1. 훅 타입

| 타입 | 설명 | 차단 가능 |
|---|---|---|
| `command` | 셸 명령 실행 | exit 2로 차단 |
| `http` | HTTP POST 전송 | JSON `decision: "block"` |
| `prompt` | LLM 단일 턴 평가 | `ok: false` |
| `agent` | 도구 사용 가능한 서브 에이전트 | `ok: false` |

### 7.2. 전역 훅

`~/.claude/settings.json`에 설정하며 모든 에이전트에 적용된다.

#### 7.2.1. SessionStart — 프로젝트 상태 대시보드

세션 시작 시 현재 브랜치, 최근 커밋 5개, 파일 변경 상태를 자동 표시한다.

```json
"SessionStart": [{
  "hooks": [{
    "type": "command",
    "command": "echo '프로젝트 상태' && git branch --show-current && echo '---' && git log --oneline -5 && echo '---' && git status -s",
    "statusMessage": "프로젝트 상태 로딩..."
  }]
}]
```

#### 7.2.2. PreToolUse — 코드 작성 전 검증

Swift/Kotlin 파일 수정 전 린트를 확인한다. error level 위반이 있으면 수정을 차단한다.

```bash
#!/bin/bash
# ~/.claude/hooks/lint-swift.sh
# exit 0 = 통과, exit 2 = 차단 (stderr를 Claude에 피드백)

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c \
  "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

[[ "$FILE" != *.swift ]] && exit 0

if ! command -v swiftlint &>/dev/null; then
  exit 0
fi

RESULT=$(swiftlint lint --quiet --path "$FILE" 2>&1)
if echo "$RESULT" | grep -q "error:"; then
  echo "$RESULT" >&2
  exit 2
fi

exit 0
```

위험 명령어도 사전 차단한다. `rm -rf /`, `drop database`, `DROP TABLE` 등 파괴적 명령어를 Bash 매처로 감지한다.

#### 7.2.3. PostToolUse — 코드 작성 후 자동 포맷팅

Write/Edit 도구 실행 후 파일 확장자에 따라 자동 포맷터를 실행한다.

```json
"PostToolUse": [{
  "matcher": "Write|Edit",
  "hooks": [{
    "type": "command",
    "command": "file=\"$TOOL_INPUT_file_path\"; case \"$file\" in *.swift) swift-format format --in-place \"$file\" 2>/dev/null; swiftlint --fix --quiet --path \"$file\" 2>/dev/null ;; *.kt) ktlint --format \"$file\" 2>/dev/null ;; *.tf) terraform fmt \"$file\" 2>/dev/null ;; esac; true",
    "timeout": 15,
    "statusMessage": "자동 포맷팅..."
  }]
}]
```

| 확장자 | 포맷터 |
|---|---|
| `*.swift` | `swift-format format --in-place` + `swiftlint --fix` |
| `*.kt` | `ktlint --format` |
| `*.tf` | `terraform fmt` |

#### 7.2.4. SubagentStop / TaskCompleted — 완료 알림

서브 에이전트 또는 팀 작업 완료 시 macOS 데스크톱 알림을 보낸다. `async: true`로 비동기 실행하여 메인 흐름을 차단하지 않는다.

```bash
#!/bin/bash
# ~/.claude/hooks/notify.sh

INPUT=$(cat)
AGENT_TYPE=$(echo "$INPUT" | python3 -c \
  "import sys,json; print(json.load(sys.stdin).get('agent_type','작업'))" 2>/dev/null || echo "작업")

if [[ "$(uname)" == "Darwin" ]]; then
  osascript -e "display notification \"${AGENT_TYPE} 에이전트가 작업을 완료했습니다\" \
    with title \"Claude Code\" sound name \"Glass\""
fi

exit 0
```

### 7.3. 에이전트별 훅

개발자 에이전트(ios-developer, server-developer, infra-developer)는 자체 `hooks` frontmatter로 에이전트별 포맷터를 정의한다. 전역 hooks와 별개로 해당 에이전트 실행 중에만 작동한다.

| 에이전트 | 이벤트 | 동작 |
|---|---|---|
| ios-developer | PostToolUse (Write\|Edit) | `swift-format` + `swiftlint --fix` (*.swift만) |
| server-developer | PostToolUse (Write\|Edit) | `ktlint --format` (*.kt만) |
| infra-developer | PostToolUse (Write\|Edit) | `terraform fmt` (*.tf만) |

### 7.4. 훅 이벤트 종류

| 이벤트 | 시점 | 주요 용도 |
|---|---|---|
| `SessionStart` | 세션 시작 시 | 프로젝트 상태 표시, 환경 확인 |
| `PreToolUse` | 도구 실행 전 | 린트 확인, 위험 명령어 차단 |
| `PostToolUse` | 도구 실행 후 | 자동 포맷팅, 후처리 |
| `Stop` | 응답 완료 후 | 자동 테스트, 검증 |
| `SubagentStop` | 서브 에이전트 완료 | 알림, 후속 작업 트리거 |
| `TaskCompleted` | 팀 작업 완료 | 알림, 자동 리뷰 호출 |

## 8. Settings (권한/환경)

### 8.1. 전역 설정

`~/.claude/settings.json`에서 모든 권한, hooks, 환경 변수, 플러그인을 전역으로 관리한다.

**권한 (permissions)**

| 구분 | 내용 |
|---|---|
| allow (자동 승인) | `Bash(git *)`, `Bash(swift-format *)`, `Bash(swiftlint *)`, `Bash(ktlint *)`, `Bash(terraform fmt *)`, `Bash(gh *)` |
| deny (차단) | `Bash(rm -rf /)`, `Bash(git push --force *)`, `Bash(git reset --hard *)`, `Bash(terraform destroy *)` |

**기타 설정**

| 항목 | 내용 |
|---|---|
| includeCoAuthoredBy | `false` — 커밋에 Co-Authored-By 트레일러를 포함하지 않는다 |
| plugins | `swift-lsp`, `clangd-lsp` (LSP), `figma` (디자인 연동) |
| language | 한국어 |
| env | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

### 8.2. 프로젝트 / 로컬 설정

| 파일 | 범위 | 용도 |
|---|---|---|
| `.claude/settings.json` | 프로젝트 (팀 공유, git 커밋) | 프로젝트별 추가 권한, 환경 변수 |
| `.claude/settings.local.json` | 로컬 전용 (.gitignore) | API 키, DB URL 등 시크릿 |

```json
// .claude/settings.local.json (커밋하지 않음)
{
  "env": {
    "JIRA_API_TOKEN": "",
    "JIRA_USERNAME": "",
    "CONFLUENCE_API_TOKEN": "",
    "CONFLUENCE_USERNAME": "",
    "DATABASE_URL": "",
    "FIGMA_ACCESS_TOKEN": ""
  }
}
```

## 9. MCP 서버 (외부 연동)

### 9.1. 전역 설정

MCP 서버 설정은 전역(`~/.claude/.mcp.json`)에서 관리한다. 프로젝트별 추가 서버가 필요하면 프로젝트 루트에 `.mcp.json`을 생성한다.

### 9.2. 서버 목록 (9개)

| 서버 | 타입 | 용도 | 사용 에이전트 | 인증 |
|---|---|---|---|---|
| GitHub | stdio | PR, Issue, 코드 리뷰, 파일 조회 | ios-developer, server-developer, infra-developer, tech-writer | `gh` CLI |
| Figma | http | 디자인 파일 참조, 컴포넌트 조회 | ios-developer, ui-designer | `FIGMA_ACCESS_TOKEN` |
| Jira | stdio | 티켓 관리, 스프린트, 프로젝트 관리 | dev-planner, ios-developer, server-developer, infra-developer, tech-writer | `JIRA_API_TOKEN` |
| Confluence | stdio | 위키, 문서 관리 | dev-planner, ios-developer, server-developer, infra-developer, tech-writer | `CONFLUENCE_API_TOKEN` |
| Context7 | http | 라이브러리 문서 조회 | ios-developer, server-developer, infra-developer | 없음 |
| Sequential Thinking | stdio | 복잡한 의사결정, 체계적 분석 | dev-planner, security-auditor | 없음 |
| Obsidian | sse | 노트, 지식 베이스 관리 | (전역 접근) | 없음 |
| PDF Reader | stdio | PDF 문서 읽기, 검색 | (전역 접근) | 없음 |
| Scapple | stdio | 마인드맵, 아이디어 시각화 | (전역 접근) | 없음 |

일부 MCP 서버는 전역 `.mcp.json`이 아닌 에이전트의 frontmatter에서 개별 설정한다. 예를 들어 postgres는 server-developer 에이전트의 `mcpServers` 필드에서 참조한다.

### 9.3. 에이전트별 MCP 접근

에이전트의 `mcpServers` 필드로 접근 가능한 MCP 서버를 제한한다. 명시하지 않으면 모든 MCP에 접근 가능하다.

| 에이전트 | 접근 가능 MCP |
|---|---|
| ios-developer | github, figma, context7, jira, confluence |
| server-developer | github, postgres, context7, jira, confluence |
| infra-developer | github, context7, jira, confluence |
| ui-designer | figma |
| tech-writer | jira, confluence, github |
| dev-planner | sequential-thinking, jira, confluence |
| security-auditor | sequential-thinking |

### 9.4. 시크릿 관리

API 키는 `.mcp.json`에 직접 넣지 않는다.

- `.mcp.json`에서는 `$ENV_VAR` 형식으로 환경 변수 참조
- 실제 값은 프로젝트의 `.claude/settings.local.json`의 `env` 섹션에 저장
- `settings.local.json`은 `.gitignore`에 추가하여 커밋하지 않는다

## 10. CLAUDE.md 체계

### 10.1. 계층 구조

```
~/.claude/CLAUDE.md                        ← 전역 개인 규칙
    │
    ▼
~/.claude/rules/*.md (10개)                ← 전역 자동 로드 규칙
    │
    ▼
프로젝트/CLAUDE.md                         ← 프로젝트 규칙
    │  @docs/architecture.md               ← @import로 문서 자동 참조
    │  @docs/api-contract.md
    │
    ▼
.claude/rules/*.md (선택사항)              ← 프로젝트 특화 규칙
    ├── frontmatter.md → **/*.md
    ├── writing.md     → (항상 로드)
    └── testing.md     → **/*Test*.swift
```

### 10.2. Rules와의 차이

| | CLAUDE.md | .claude/rules/*.md |
|---|---|---|
| 로드 시점 | 세션 시작 시 항상 | 해당 경로 파일 작업 시 |
| 경로 제한 | 불가 | `paths` frontmatter |
| 컨텍스트 비용 | 항상 소비 | 필요할 때만 |
| 적합한 용도 | 프로젝트 전체 규칙 | 언어/도메인별 규칙 |

### 10.3. @import 구문

CLAUDE.md에서 `@파일경로`로 다른 파일을 가져온다. 최대 5홉 깊이로 재귀 가능하다.

```markdown
# MyProject 규칙

## 1. 프로젝트

### 1.1. 아키텍처

프로젝트 아키텍처는 @docs/architecture.md를 참조한다.
API 계약은 @docs/api-contract.md를 참조한다.
```

## 11. 통합 워크플로우

### 11.1. 새 기능 개발 전체 플로우

#### Phase 1: 기획 (`/plan-feature`)

```
/plan-feature 소셜 로그인 (Apple, Google, Kakao)
```

1. **product-planner** — PRD 작성 (사용자 스토리, 수용 기준, 우선순위)
2. **dev-planner** — 기술 설계 (API 인터페이스, DB 스키마, 작업 분해)
3. **ui-designer** — UI/UX 설계 (화면 흐름, 컴포넌트 명세)
4. **tech-writer** — 티켓 생성 + 위키 작성 (Jira/Confluence MCP 연동)
5. **메인 세션(CTO)** — 기획 결과 종합, 사용자에게 보고

#### Phase 2: 개발 (`/develop`)

```
/develop PROJ-123
```

1. **메인 세션** — 작업 분석 (어떤 개발자 에이전트를 사용할지 결정)
2. **메인 세션** — 컨텍스트 수집 (Jira 티켓, Confluence 설계 문서, API 스펙)
3. **ios-developer + server-developer + infra-developer** — 병렬 개발 (에이전트 팀 또는 worktree 격리)
4. **qa-engineer** — 테스트 작성 및 실행
5. **메인 세션** — PR 생성 (리뷰 통과 시 자동)
6. **메인 세션(CTO)** — 개발 결과 종합, 사용자에게 보고

#### Phase 3: 리뷰 (`/review-all`)

```
/review-all
```

1. **리뷰어 6명** — 아키텍처 + 품질 병렬 리뷰 (각 개발자당 2명)
2. **security-auditor** — 보안 감사
3. **메인 세션(CTO)** — 최종 결과 종합, 머지 판단, 사용자에게 보고

### 11.2. 코드 리뷰 플로우

```
/review-all feature/social-login
```

```
변경 파일 분석 (git diff)
    │
    ├── *.swift 변경 → ios-reviewer-arch + ios-reviewer-quality (병렬)
    ├── *.kt 변경   → server-reviewer-arch + server-reviewer-quality (병렬)
    ├── *.tf 변경   → infra-reviewer-security + infra-reviewer-ops (병렬)
    │
    └── 전체        → security-auditor
    │
    ▼
종합 리포트 (심각도별 분류)
  🔴 필수 수정 → 머지 차단 권고
  🟡 권장     → 선택적 수정
  🟢 참고     → 정보 제공
```

### 11.3. 릴리즈 플로우

```
/release 1.0.0
```

1. **qa-engineer** — 전체 테스트 스위트 실행, 커버리지 확인
2. **security-auditor** — 최종 보안 감사, 의존성 취약점 스캔
3. **infra-developer** — 배포 스크립트 확인, 롤백 계획 검증
4. **tech-writer** — CHANGELOG 작성, 릴리즈 노트 생성
5. **메인 세션** — 체크리스트 종합, go/no-go 판단 보고

### 11.4. 일일 스탠드업

```
/standup
```

동적 컨텍스트 주입(`` !`command` ``)으로 git 로그, PR 상태, CI 결과를 자동 수집하여 현황 보고서를 생성한다. `context: fork`로 메인 컨텍스트 오염 없이 격리 실행한다.

## 12. 비용 최적화

### 12.1. 모델 배분 전략

- **Opus** (비쌈): 기획, 개발, 보안 감사 — 정확성과 창의성이 중요한 작업에만
- **Sonnet** (저렴): 리뷰, QA, 문서 작성 — 패턴화된 작업은 Sonnet으로 충분

### 12.2. 컨텍스트 절약

- `~/.claude/rules/`의 `paths` 매칭으로 필요한 규칙만 로드
- 리뷰어는 `permissionMode: plan`으로 읽기 전용 — 도구 호출 최소화
- `context: fork` skill로 격리 실행 — 메인 컨텍스트 오염 방지
- 서브 에이전트 결과는 요약되어 반환 — 상세 결과가 메인 컨텍스트를 소비하지 않음

### 12.3. 에이전트 팀 vs 서브 에이전트 비용

- 에이전트 팀은 **독립 인스턴스**라서 비용이 높다 — 대규모 병렬 작업에만 사용
- 단일 리뷰, 분석 등은 **서브 에이전트**로 충분 — 비용 효율적

## 13. 사용 가이드

### 13.1. 초기 설정

모든 설정은 `~/.claude/`에 구성되어 있다. 새 프로젝트에서 바로 사용할 수 있다.

```bash
# 전역 설정 구조 확인
ls ~/.claude/agents/     # 15개 에이전트 파일
ls ~/.claude/skills/     # 5개 스킬 디렉토리
ls ~/.claude/rules/      # 10개 규칙 파일
ls ~/.claude/hooks/      # 3개 훅 스크립트

# 훅 스크립트 실행 권한 확인
chmod +x ~/.claude/hooks/*.sh

# 필요한 도구 설치
brew install swift-format swiftlint ktlint terraform gh
```

새 프로젝트에 적용하는 방법은 아래와 같다.

```bash
# 1. 프로젝트 생성
mkdir my-app && cd my-app
git init

# 2. CLAUDE.md 작성
cat > CLAUDE.md << 'EOF'
# my-app 규칙

iOS + Spring Boot 프로젝트이다.

## 1. 프로젝트

### 1.1. 기술 스택

- iOS: Swift 6, SwiftUI, TCA, SPM
- 서버: Spring Boot 3, Kotlin, PostgreSQL
- 인프라: AWS, Terraform, GitHub Actions

### 1.2. 빌드

- iOS: cd ios && tuist generate && xcodebuild
- 서버: cd server && ./gradlew build
- 인프라: cd infra && terraform plan
EOF

# 3. Claude Code 실행
claude
```

### 13.2. 에이전트 사용

Claude Code가 `description`을 기반으로 적합한 에이전트를 자동 선택한다. 자연어로 요청하면 된다.

```bash
# 자동 호출 — Claude가 적절한 에이전트를 판단
"소셜 로그인 기능을 기획해줘"           → product-planner 자동 호출
"로그인 API를 구현해줘"                 → server-developer 자동 호출
"현재 코드를 리뷰해줘"                  → review-all 스킬 → 리뷰어 병렬 호출
"iOS 앱에서 로그인 화면을 만들어줘"     → ios-developer 자동 호출

# 명시적 호출 — 에이전트를 직접 지정
"product-planner 에이전트로 소셜 로그인 PRD를 작성해줘"
"security-auditor로 현재 코드를 감사해줘"
```

### 13.3. 스킬 사용

```bash
# 슬래시 커맨드로 호출
/plan-feature 소셜 로그인 (Apple, Google, Kakao)
/develop 서버 소셜 로그인 API 구현
/review-all
/release 1.0.0
/standup

# 자연어 호출 (disable-model-invocation이 false인 스킬만)
"이 기능 기획해줘"    → /plan-feature 자동 호출
"개발해줘"           → /develop 자동 호출
"리뷰해줘"           → /review-all 자동 호출
```

`/release`와 `/standup`은 `disable-model-invocation: true`라서 반드시 슬래시 커맨드로만 호출 가능하다.

### 13.4. 커스텀 스킬 추가

새로운 워크플로우가 필요하면 `~/.claude/skills/{name}/SKILL.md`를 만든다.

```markdown
# ~/.claude/skills/hotfix/SKILL.md
---
name: hotfix
description: 긴급 핫픽스 플로우. 버그 분석, 수정, 테스트, 배포를 빠르게 실행한다.
argument-hint: "[버그 설명 또는 이슈 번호]"
---

긴급 핫픽스를 진행한다.

## 현재 상태

!`git log --oneline -5`
!`git branch --show-current`

## 진행 단계

### 1단계: 버그 분석

코드를 분석하여 원인을 파악한다.

### 2단계: 수정 (해당 *-developer 에이전트)

최소한의 변경으로 수정한다.

### 3단계: 테스트 (qa-engineer)

해당 부분의 테스트만 실행한다.

### 4단계: 배포 (infra-developer)

핫픽스 배포를 준비한다.

버그: $ARGUMENTS
```

### 13.5. 커스텀 룰 추가

```bash
# 프로젝트 규칙 추가 (해당 프로젝트에만 적용)
cat > .claude/rules/testing.md << 'EOF'
---
paths:
  - "**/*Test*.swift"
  - "**/*Test*.kt"
  - "**/test/**"
---

# 테스트 작성 규칙

## 1. 구조

- Given-When-Then 패턴을 따른다
- 테스트 이름: `test_상황_기대결과`

## 2. 원칙

- Mock보다 실제 구현을 우선한다
- 경계값, null, 예외를 반드시 포함한다
EOF
```

### 13.6. MCP 서버 추가

```json
// .mcp.json에 새 서버 추가
{
  "mcpServers": {
    "figma": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/figma-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "$FIGMA_ACCESS_TOKEN"
      }
    }
  }
}
```

에이전트의 frontmatter에 `mcpServers`를 명시하면 해당 서버만 접근 가능하다.

```yaml
# ~/.claude/agents/server-developer.md
---
mcpServers:
  - github
  - postgres
  - context7
  - jira
  - confluence
---
# → 이 에이전트는 github, postgres, context7, jira, confluence MCP만 사용 가능
# → figma 등에는 접근 불가
```

# 참고

- <https://docs.anthropic.com/en/docs/claude-code>
