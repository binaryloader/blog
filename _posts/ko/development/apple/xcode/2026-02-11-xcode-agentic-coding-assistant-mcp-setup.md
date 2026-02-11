---
title: "[Xcode] Agentic Coding Assistant에 MCP 서버 연동하기"
ref: xcode-agentic-coding-assistant-mcp-setup
excerpt: "Xcode Agentic Coding Assistant에 MCP 서버를 연동하는 방법을 정리한다."
date: 2026-02-11T19:37+09:00
last_modified_at: 2026-02-11T19:37+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Development
  - Apple
  - Xcode
tags:
  - Development
  - Apple
  - Xcode
  - Claude Code
  - MCP
  - Agentic Coding Assistant
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Apple"
    url: /ko/development/apple/
  - title: "Xcode"
    url: /ko/development/apple/xcode/
---

# 개요

Xcode Agentic Coding Assistant에 MCP 서버를 연동하는 방법을 정리한다.

# 정리

## 1. 설정 파일 경로

MCP 서버는 Claude Code의 설정 파일에서 프로젝트별로 구성한다.

```
~/Library/Developer/Xcode/CodingAssistant/ClaudeAgentConfig/.claude.json
```

## 2. 설정 구조

`projects` 내부에 프로젝트 경로를 키로 지정하고 `mcpServers`에 사용할 MCP 서버를 추가한다.

```json
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        // MCP 서버 설정
      }
    }
  }
}
```

## 3. MCP 서버 유형

MCP 서버는 두 가지 유형으로 설정할 수 있다.

### 3.1. stdio

CLI 명령어로 MCP 서버 프로세스를 직접 실행하는 방식이다.

```json
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        "context7": {
          "type": "stdio",
          "command": "/path/to/npx",
          "args": ["-y", "@upstash/context7-mcp@latest"]
        }
      }
    }
  }
}
```

| 항목 | 설명 |
|---|---|
| **type** | `"stdio"`를 지정한다. |
| **command** | 실행할 명령어의 절대 경로를 입력한다. (예: `npx`, `uvx`) |
| **args** | 명령어에 전달할 인자 배열이다. |
| **env** | (선택) 환경 변수를 지정한다. API 토큰 등이 필요한 경우 사용한다. |

### 3.2. SSE (Server-Sent Events)

로컬에서 실행 중인 MCP 서버에 HTTP로 연결하는 방식이다.

```json
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        "Figma Dev Mode MCP": {
          "type": "sse",
          "url": "http://127.0.0.1:3845/sse"
        }
      }
    }
  }
}
```

| 항목 | 설명 |
|---|---|
| **type** | `"sse"`를 지정한다. |
| **url** | MCP 서버의 SSE 엔드포인트 URL을 입력한다. |

## 4. 설정 예시

다양한 MCP 서버를 함께 구성한 예시다.

```json
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        "context7": {
          "type": "stdio",
          "command": "/path/to/npx",
          "args": ["-y", "@upstash/context7-mcp@latest"]
        },
        "sequential-thinking": {
          "type": "stdio",
          "command": "/path/to/npx",
          "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
        },
        "mcp-atlassian": {
          "type": "stdio",
          "command": "/path/to/uvx",
          "args": ["mcp-atlassian"],
          "env": {
            "JIRA_URL": "https://your-domain.atlassian.net",
            "JIRA_USERNAME": "your-email@example.com",
            "JIRA_API_TOKEN": "your-api-token"
          }
        },
        "Figma Dev Mode MCP": {
          "type": "sse",
          "url": "http://127.0.0.1:3845/sse"
        }
      }
    }
  }
}
```

| MCP 서버 | 용도 |
|---|---|
| **context7** | 라이브러리 문서를 컨텍스트로 제공한다. |
| **sequential-thinking** | 복잡한 문제를 단계별로 사고하는 기능을 추가한다. |
| **mcp-atlassian** | Jira 이슈와 Confluence 문서에 접근할 수 있게 한다. |
| **Figma Dev Mode MCP** | Figma 디자인 파일을 코드에서 참조할 수 있게 한다. |

## 5. 주의사항

- `command`에는 바이너리의 **절대 경로**를 입력해야 한다. nvm 등으로 Node.js를 관리하는 경우 `which npx`로 경로를 확인한다.
- `env`에 API 토큰이나 비밀번호를 입력하는 경우 설정 파일이 외부에 노출되지 않도록 주의한다.
- 설정 변경 후 Xcode를 재시작해야 적용된다.

# 참고

- <https://developer.apple.com/documentation/xcode/setting-up-coding-intelligence>
- <https://developer.apple.com/documentation/xcode/giving-agentic-coding-tools-access-to-xcode>
- <https://modelcontextprotocol.io>
- <https://docs.anthropic.com/en/docs/claude-code>
