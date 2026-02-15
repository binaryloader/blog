---
title: "[Xcode] Setting Up MCP Servers for the Agentic Coding Assistant"
ref: xcode-agentic-coding-assistant-mcp-setup
lang: en
permalink: /en/:categories/:title/
excerpt: "A guide to connecting MCP servers to the Xcode agentic coding assistant."
date: 2026-02-11T19:37+09:00
last_modified_at: 2026-02-11T19:37+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/xcode-agentic-coding-assistant-mcp-setup.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/xcode-agentic-coding-assistant-mcp-setup.png"
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
    url: /en/development/
  - title: "Apple"
    url: /en/development/apple/
  - title: "Xcode"
    url: /en/development/apple/xcode/
---

# Overview

A guide to connecting MCP servers to the Xcode agentic coding assistant.

# Steps

## 1. Settings File Path

MCP servers are configured per project in the Claude Code settings file.

```
~/Library/Developer/Xcode/CodingAssistant/ClaudeAgentConfig/.claude.json
```

## 2. Configuration Structure

Specify the project path as a key inside `projects` and add the MCP servers under `mcpServers`.

```json
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        // MCP server configurations
      }
    }
  }
}
```

## 3. MCP Server Types

MCP servers can be configured in two types.

### 3.1. stdio

Launches the MCP server process directly via a CLI command.

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

| Field | Description |
|---|---|
| **type** | Set to `"stdio"`. |
| **command** | The absolute path to the executable. (e.g., `npx`, `uvx`) |
| **args** | An array of arguments to pass to the command. |
| **env** | (Optional) Environment variables. Used when API tokens are required. |

### 3.2. SSE (Server-Sent Events)

Connects to a locally running MCP server via HTTP.

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

| Field | Description |
|---|---|
| **type** | Set to `"sse"`. |
| **url** | The SSE endpoint URL of the MCP server. |

## 4. Configuration Example

An example with multiple MCP servers configured together.

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
            "CONFLUENCE_URL": "https://your-domain.atlassian.net/wiki",
            "CONFLUENCE_USERNAME": "your-email@example.com",
            "CONFLUENCE_API_TOKEN": "your-api-token",
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

| MCP Server | Purpose |
|---|---|
| **context7** | Provides library documentation as context. |
| **sequential-thinking** | Adds step-by-step reasoning for complex problems. |
| **mcp-atlassian** | Enables access to Jira issues and Confluence documents. |
| **Figma Dev Mode MCP** | Allows referencing Figma design files from code. |

## 5. Notes

- The `command` field requires the **absolute path** to the binary. If you manage Node.js with nvm, check the path with `which npx`.
- Be careful not to expose the settings file externally when it contains API tokens or passwords in `env`.
- Restart Xcode after changing the configuration for it to take effect.

# References

- <https://developer.apple.com/documentation/xcode/setting-up-coding-intelligence>
- <https://developer.apple.com/documentation/xcode/giving-agentic-coding-tools-access-to-xcode>
- <https://modelcontextprotocol.io>
- <https://docs.anthropic.com/en/docs/claude-code>
