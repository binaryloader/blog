---
title: "[MCP] mcp-scapple"
ref: library-mcp-scapple
excerpt: "Scapple(.scap) 파일을 다루는 MCP 서버"
date: 2026-05-01
published: true
categories:
  - Library
  - MCP
app_creator: "binaryloader"
app_summary: "Scapple(.scap) 다이어그램 파일을 다루는 MCP 서버"
app_version: "1.0.1"
app_runtime: "Node.js 18+"
app_license: "MIT"
app_github: "https://github.com/binaryloader/mcp-scapple"
app_homepage: "https://www.npmjs.com/package/@binaryloader/mcp-scapple"
depth:
  - title: "Library"
    url: /ko/library/
  - title: "MCP"
    url: /ko/library/mcp/
---

## 1. 개요

mcp-scapple은 Literature & Latte의 브레인스토밍 도구 Scapple의 `.scap` 파일을 AI 어시스턴트가 직접 읽고 쓰고 PNG로 렌더링할 수 있게 해주는 MCP 서버이다.

## 2. 정보

- 개발: binaryloader
- 버전: 1.0.1
- 라이선스: MIT
- 요구사항: Node.js 18+
- GitHub: [binaryloader/mcp-scapple](https://github.com/binaryloader/mcp-scapple)
- npm: [@binaryloader/mcp-scapple](https://www.npmjs.com/package/@binaryloader/mcp-scapple)

## 3. 주요 기능

- read-scapple: `.scap` 파일을 노트/도형/스타일/연결 정보가 담긴 JSON으로 파싱
- write-scapple: 구조화된 노트 데이터를 양방향 연결 자동 관리와 함께 `.scap` 파일로 작성
- text-to-scapple: 들여쓰기/불렛/번호 리스트 텍스트를 자동 레이아웃의 Scapple 다이어그램으로 변환
- scapple-to-image: `.scap` 파일을 PNG로 렌더링(테마, 색상, 폰트, 그림자, 패턴 지원)

## 4. 설치

```bash
npx @binaryloader/mcp-scapple
```
