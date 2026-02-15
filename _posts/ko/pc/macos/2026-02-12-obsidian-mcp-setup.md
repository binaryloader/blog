---
date: 2026-02-12T05:00+09:00
title: "[macOS] Obsidian MCP 연동하기"
ref: obsidian-mcp-setup
excerpt: "Claude Code에서 Obsidian 볼트를 직접 읽고 쓸 수 있도록 MCP 서버를 연동하는 과정을 정리한다."
last_modified_at: 2026-02-12T05:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/obsidian-mcp-setup.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/obsidian-mcp-setup.png"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - Obsidian
  - MCP
  - Claude Code
depth:
  - title: "PC"
    url: /ko/pc/
  - title: "macOS"
    url: /ko/pc/macos/
---

# 개요

Claude Code에서 Obsidian 볼트를 직접 읽고 쓸 수 있도록 MCP 서버를 연동하는 과정을 정리한다.

# 정리

## 1. BRAT 플러그인 설치

Claude Code MCP 플러그인은 커뮤니티 플러그인 목록에 등록되어 있지 않아 BRAT을 통해 설치해야 한다.

1. **설정** > **커뮤니티 플러그인** > **탐색**
2. `BRAT` 검색 후 설치 & 활성화

## 2. Claude Code MCP 플러그인 설치

1. **설정** > **BRAT** > **Add Beta Plugin**
2. `iansinnott/obsidian-claude-code-mcp` 입력 후 추가
3. **설정** > **커뮤니티 플러그인**에서 **Claude Code MCP** 활성화
4. 기본 포트 `22360`으로 MCP 서버가 자동 실행됨

## 3. Claude Code에 MCP 서버 등록

터미널에서 Obsidian 볼트가 있는 프로젝트 디렉토리로 이동 후:

```bash
claude mcp add obsidian -- npx mcp-remote http://localhost:22360/sse
```

## 4. 연동 확인

- Claude Code를 **새 대화로 시작**해야 MCP 도구가 로드됨
- 연동되면 `mcp__obsidian__` 접두사의 도구들이 활성화됨
  - `get_workspace_files` - 볼트 파일 목록 조회
  - `view` - 노트 내용 읽기
  - `create` - 새 노트 생성
  - `str_replace` - 노트 내용 수정
  - `insert` - 특정 위치에 텍스트 삽입

## 5. 주의사항

- 여러 볼트에서 동시에 사용할 경우 각 볼트마다 포트를 다르게 설정해야 한다.

# 참고

- <https://github.com/iansinnott/obsidian-claude-code-mcp>
