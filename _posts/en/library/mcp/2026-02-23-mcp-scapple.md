---
title: "[MCP] mcp-scapple"
ref: library-mcp-scapple
excerpt: "MCP server for working with Scapple (.scap) files"
lang: en
permalink: /en/library/mcp/mcp-scapple/
date: 2026-05-01
published: true
categories:
  - Library
  - MCP
app_creator: "binaryloader"
app_summary: "MCP server for working with Scapple (.scap) diagram files"
app_version: "1.0.1"
app_runtime: "Node.js 18+"
app_license: "MIT"
app_github: "https://github.com/binaryloader/mcp-scapple"
app_homepage: "https://www.npmjs.com/package/@binaryloader/mcp-scapple"
depth:
  - title: "Library"
    url: /en/library/
  - title: "MCP"
    url: /en/library/mcp/
---

## 1. Overview

mcp-scapple is an MCP server that lets AI assistants read, write, and render `.scap` files from Scapple, the brainstorming tool by Literature & Latte.

## 2. Info

- Developer: binaryloader
- Version: 1.0.1
- License: MIT
- Requirements: Node.js 18+
- GitHub: [binaryloader/mcp-scapple](https://github.com/binaryloader/mcp-scapple)
- npm: [@binaryloader/mcp-scapple](https://www.npmjs.com/package/@binaryloader/mcp-scapple)

## 3. Features

- read-scapple: Parse a `.scap` file into structured JSON with notes, shapes, styles, and connections
- write-scapple: Create a `.scap` file from structured note data with automatic bidirectional connection management
- text-to-scapple: Convert indented text, bullet lists, or numbered lists into Scapple diagrams with automatic layout
- scapple-to-image: Render a `.scap` file to PNG with full theme support (colors, fonts, shadows, patterns)

## 4. Install

```bash
npx @binaryloader/mcp-scapple
```
