---
title: "[Kiro] MCP 서버 설정"
ref: kiro-mcp-server-configuration
excerpt: "Kiro에서 MCP 서버를 설정하고 관리하는 방법을 예제와 함께 정리했다."
date: 2026-03-13T21:43+09:00
last_modified_at: 2026-03-13T21:43+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-mcp-server-configuration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/kiro-mcp-server-configuration.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Kiro
tags:
  - Kiro
  - MCP
depth:
  - title: "Development"
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "Agentic Coding Assistant"
    url: /ko/development/ai/agentic-coding-assistant/
  - title: "Kiro"
    url: /ko/development/ai/agentic-coding-assistant/kiro/
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: Claude
---

# 개요

Kiro에서 MCP 서버를 설정하고 관리하는 방법을 예제와 함께 정리했다.

# 정리

## 1. 설정 파일 위치

- 전역 설정(사용자 전체): `~/.kiro/settings/mcp.json` - 모든 프로젝트에서 사용 가능
- 워크스페이스 설정(프로젝트별): `.kiro/settings/mcp.json` - 해당 프로젝트에서만 사용, 전역 설정보다 우선 적용

## 2. 기본 설정 구조

```json
{
  "mcpServers": {
    "서버이름": {
      "command": "실행할 명령어",
      "args": ["--stdio"],
      "env": {
        "환경변수": "값"
      },
      "timeout": 120000,
      "disabled": false
    }
  }
}
```

## 3. CLI로 서버 추가

### 3.1. 기본 추가

```bash
kiro-cli mcp add --name git --command mcp-server-git --args --stdio
```

### 3.2. 옵션 포함

```bash
kiro-cli mcp add \
  --name github \
  --command mcp-server-github \
  --args --stdio \
  --env GITHUB_TOKEN=$GITHUB_TOKEN \
  --scope workspace
```

### 3.3. 주요 옵션

| 옵션 | 설명 |
|---|---|
| `--name` | 서버 이름(필수) |
| `--command` | 실행 명령어(필수) |
| `--args` | 명령어 인자 |
| `--env` | 환경 변수 |
| `--scope` | 적용 범위(default/workspace/global) |
| `--agent` | 특정 에이전트에만 추가 |
| `--disabled` | 비활성화 상태로 추가 |
| `--force` | 기존 서버 덮어쓰기 |

## 4. 서버 관리 명령어

### 4.1. 서버 목록 확인

```bash
kiro-cli mcp list
kiro-cli mcp list workspace
kiro-cli mcp list global
```

### 4.2. 서버 제거

```bash
kiro-cli mcp remove --name git
```

### 4.3. 서버 상태 확인

```bash
kiro-cli mcp status --name git
```

### 4.4. 설정 파일 가져오기

```bash
kiro-cli mcp import --file servers.json workspace
```

## 5. 채팅에서 확인

### 5.1. 서버 상태 보기

```
/mcp
/mcp list
```

### 5.2. 출력 예시

```
@git (mcp-server-git)
Status: ✓ Initialized
Tools: git_status, git_commit, git_log
@github (mcp-server-github)
Status: ⚠ Needs authentication
OAuth URL: https://github.com/login/oauth/...
Tools: (not loaded)
```

## 6. MCP 서버 예제

### 6.1. Context7(문서 검색)

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

프로그래밍 라이브러리/프레임워크 문서 검색 및 코드 예제를 조회한다.

### 6.2. Sequential Thinking(사고 과정 시각화)

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

복잡한 문제를 단계별로 분석하고 해결 과정을 추적한다.

### 6.3. Atlassian(Confluence + Jira)

```json
{
  "mcpServers": {
    "mcp-atlassian": {
      "command": "uvx",
      "args": ["--with", "pydantic==2.11.9", "mcp-atlassian"],
      "env": {
        "CONFLUENCE_URL": "https://your-domain.atlassian.net/wiki",
        "CONFLUENCE_USERNAME": "your-email@company.com",
        "CONFLUENCE_API_TOKEN": "your-confluence-token",
        "JIRA_URL": "https://your-domain.atlassian.net",
        "JIRA_USERNAME": "your-email@company.com",
        "JIRA_API_TOKEN": "your-jira-token"
      }
    }
  }
}
```

Confluence 페이지 읽기/쓰기/검색, Jira 이슈 생성/조회/업데이트, 문서와 이슈 간 연동을 지원한다.

필수 환경 변수는 아래와 같다.

- `CONFLUENCE_URL`: Confluence 인스턴스 URL
- `CONFLUENCE_USERNAME`: 사용자 이메일
- `CONFLUENCE_API_TOKEN`: API 토큰(Atlassian 계정 설정에서 생성)
- `JIRA_URL`: Jira 인스턴스 URL
- `JIRA_USERNAME`: 사용자 이메일
- `JIRA_API_TOKEN`: API 토큰

### 6.4. GitLab

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@zereight/mcp-gitlab"],
      "env": {
        "GITLAB_PERSONAL_ACCESS_TOKEN": "your-gitlab-token",
        "GITLAB_API_URL": "https://your-gitlab.com/api/v4/",
        "GITLAB_PROJECT_ID": "your-project-id",
        "GITLAB_READ_ONLY_MODE": "false",
        "USE_GITLAB_WIKI": "false",
        "USE_MILESTONE": "false",
        "USE_PIPELINE": "false"
      }
    }
  }
}
```

GitLab 이슈/MR 관리, 코드 리뷰 및 커밋 조회, 프로젝트 정보 확인을 지원한다.

필수 환경 변수는 아래와 같다.

- `GITLAB_PERSONAL_ACCESS_TOKEN`: GitLab Personal Access Token
- `GITLAB_API_URL`: GitLab API 엔드포인트
- `GITLAB_PROJECT_ID`: 대상 프로젝트 ID

선택 환경 변수는 아래와 같다.

- `GITLAB_READ_ONLY_MODE`: 읽기 전용 모드(true/false)
- `USE_GITLAB_WIKI`: Wiki 기능 사용 여부
- `USE_MILESTONE`: 마일스톤 기능 사용 여부
- `USE_PIPELINE`: 파이프라인 기능 사용 여부

### 6.5. Figma Dev Mode(SSE 방식)

```json
{
  "mcpServers": {
    "Figma Dev Mode MCP": {
      "type": "sse",
      "url": "http://127.0.0.1:3845/sse"
    }
  }
}
```

Figma 디자인 파일에서 개발 정보를 추출한다. `command` 대신 `type`과 `url`을 사용하며 로컬에서 실행 중인 서버에 연결한다.

## 7. 에이전트별 MCP 설정

### 7.1. 에이전트 설정 파일에 직접 추가

`.kiro/agents/my-agent.json`에 `mcpServers` 필드를 추가한다.

```json
{
  "name": "my-agent",
  "tools": ["fs_read", "fs_write"],
  "mcpServers": {
    "git": {
      "command": "mcp-server-git",
      "args": ["--stdio"]
    }
  }
}
```

### 7.2. 특정 에이전트에만 서버 추가

```bash
kiro-cli mcp add --name git --command mcp-server-git --agent my-agent
```

## 8. 트러블슈팅

### 8.1. 서버가 시작되지 않을 때

- 명령어가 PATH에 있는지 확인
- 수동으로 실행해보기: `mcp-server-git --stdio`
- 로그 확인: `~/.kiro/logs/` 또는 `$TMPDIR/kiro-log/`

### 8.2. 도구가 표시되지 않을 때

- `/mcp` 명령어로 서버 상태 확인
- OAuth 인증이 필요한지 확인
- 서버가 초기화될 때까지 대기

### 8.3. 도구 이름이 너무 길거나 유효하지 않을 때

서버 제공자에게 문제를 보고한다. 해당 도구는 자동으로 제외된다.

### 8.4. 설명이 너무 긴 도구

경고 메시지가 표시되지만 사용 가능하다. 응답 속도가 느려질 수 있다.

# 참고

- <https://kiro.dev/docs/mcp/>
- <https://modelcontextprotocol.io/>
