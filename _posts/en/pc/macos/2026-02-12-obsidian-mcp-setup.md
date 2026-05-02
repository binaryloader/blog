---
date: 2026-02-12T05:00+09:00
title: "[macOS] Setting Up Obsidian MCP Integration"
ref: obsidian-mcp-setup
lang: en
permalink: /en/:categories/:title/
excerpt: "How to set up an MCP server so Claude Code can directly read and write to your Obsidian vault."
last_modified_at: 2026-02-12T05:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/obsidian-mcp-setup.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/obsidian-mcp-setup.png"
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
    url: /en/pc/
  - title: "macOS"
    url: /en/pc/macos/
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: binaryloader
---

# Overview

This post covers how to set up an MCP server so Claude Code can directly read and write to your Obsidian vault.

# Steps

## 1. Install the BRAT Plugin

The Claude Code MCP plugin is not listed in the community plugins directory, so it must be installed via BRAT.

1. Settings > Community Plugins > Browse
2. Search for `BRAT`, install & enable

## 2. Install the Claude Code MCP Plugin

1. Settings > BRAT > Add Beta Plugin
2. Enter `iansinnott/obsidian-claude-code-mcp` and add
3. Enable Claude Code MCP in Settings > Community Plugins
4. The MCP server starts automatically on the default port `22360`

## 3. Register the MCP Server in Claude Code

Navigate to the project directory containing your Obsidian vault in the terminal, then run:

```bash
claude mcp add obsidian -- npx mcp-remote http://localhost:22360/sse
```

## 4. Verify the Integration

- You must start a new conversation in Claude Code for the MCP tools to load
- Once connected, tools with the `mcp__obsidian__` prefix become available:
  - `get_workspace_files` - List vault files
  - `view` - Read note contents
  - `create` - Create a new note
  - `str_replace` - Edit note contents
  - `insert` - Insert text at a specific position

## 5. Notes

- When using multiple vaults simultaneously, each vault must be configured with a different port.

# References

- <https://github.com/iansinnott/obsidian-claude-code-mcp>
