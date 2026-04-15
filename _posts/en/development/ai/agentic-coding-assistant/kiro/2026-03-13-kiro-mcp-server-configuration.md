---
title: "[Kiro] MCP Server Configuration"
lang: en
permalink: /en/:categories/:title/
ref: kiro-mcp-server-configuration
excerpt: "A guide on how to configure and manage MCP servers in Kiro, with practical examples."
date: 2026-03-13T21:43+09:00
last_modified_at: 2026-03-13T21:43+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-mcp-server-configuration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/kiro-mcp-server-configuration.png"
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
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "Agentic Coding Assistant"
    url: /en/development/ai/agentic-coding-assistant/
  - title: "Kiro"
    url: /en/development/ai/agentic-coding-assistant/kiro/
---

# Overview

A guide on how to configure and manage MCP servers in Kiro, with practical examples.

# Steps

## 1. Configuration File Location

- Global settings (user-wide): `~/.kiro/settings/mcp.json` - available across all projects
- Workspace settings (per-project): `.kiro/settings/mcp.json` - available only in that project, takes precedence over global settings

## 2. Basic Configuration Structure

```json
{
  "mcpServers": {
    "server-name": {
      "command": "command to execute",
      "args": ["--stdio"],
      "env": {
        "ENV_VAR": "value"
      },
      "timeout": 120000,
      "disabled": false
    }
  }
}
```

## 3. Adding a Server via CLI

### 3.1. Basic Addition

```bash
kiro-cli mcp add --name git --command mcp-server-git --args --stdio
```

### 3.2. With Options

```bash
kiro-cli mcp add \
  --name github \
  --command mcp-server-github \
  --args --stdio \
  --env GITHUB_TOKEN=$GITHUB_TOKEN \
  --scope workspace
```

### 3.3. Key Options

| Option | Description |
|---|---|
| `--name` | Server name (required) |
| `--command` | Execution command (required) |
| `--args` | Command arguments |
| `--env` | Environment variables |
| `--scope` | Scope (default/workspace/global) |
| `--agent` | Add to a specific agent only |
| `--disabled` | Add in disabled state |
| `--force` | Overwrite existing server |

## 4. Server Management Commands

### 4.1. List Servers

```bash
kiro-cli mcp list
kiro-cli mcp list workspace
kiro-cli mcp list global
```

### 4.2. Remove a Server

```bash
kiro-cli mcp remove --name git
```

### 4.3. Check Server Status

```bash
kiro-cli mcp status --name git
```

### 4.4. Import a Configuration File

```bash
kiro-cli mcp import --file servers.json workspace
```

## 5. Checking in Chat

### 5.1. View Server Status

```
/mcp
/mcp list
```

### 5.2. Output Example

```
@git (mcp-server-git)
Status: ✓ Initialized
Tools: git_status, git_commit, git_log
@github (mcp-server-github)
Status: ⚠ Needs authentication
OAuth URL: https://github.com/login/oauth/...
Tools: (not loaded)
```

## 6. MCP Server Examples

### 6.1. Context7 (Documentation Search)

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

Searches programming library/framework documentation and retrieves code examples.

### 6.2. Sequential Thinking (Step-by-Step Reasoning)

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

Analyzes complex problems step by step and tracks the problem-solving process.

### 6.3. Atlassian (Confluence + Jira)

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

Supports reading/writing/searching Confluence pages, creating/viewing/updating Jira issues, and linking documents with issues.

The required environment variables are as follows.

- `CONFLUENCE_URL`: Confluence instance URL
- `CONFLUENCE_USERNAME`: User email
- `CONFLUENCE_API_TOKEN`: API token (generated from Atlassian account settings)
- `JIRA_URL`: Jira instance URL
- `JIRA_USERNAME`: User email
- `JIRA_API_TOKEN`: API token

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

Supports GitLab issue/MR management, code review and commit inspection, and project information retrieval.

The required environment variables are as follows.

- `GITLAB_PERSONAL_ACCESS_TOKEN`: GitLab Personal Access Token
- `GITLAB_API_URL`: GitLab API endpoint
- `GITLAB_PROJECT_ID`: Target project ID

The optional environment variables are as follows.

- `GITLAB_READ_ONLY_MODE`: Read-only mode (true/false)
- `USE_GITLAB_WIKI`: Whether to use the Wiki feature
- `USE_MILESTONE`: Whether to use the Milestone feature
- `USE_PIPELINE`: Whether to use the Pipeline feature

### 6.5. Figma Dev Mode (SSE Method)

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

Extracts development information from Figma design files. It uses `type` and `url` instead of `command`, connecting to a locally running server.

## 7. Per-Agent MCP Configuration

### 7.1. Adding Directly to the Agent Configuration File

Add the `mcpServers` field to `.kiro/agents/my-agent.json`.

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

### 7.2. Adding a Server to a Specific Agent Only

```bash
kiro-cli mcp add --name git --command mcp-server-git --agent my-agent
```

## 8. Troubleshooting

### 8.1. When a Server Won't Start

- Verify the command is in PATH
- Try running it manually: `mcp-server-git --stdio`
- Check logs: `~/.kiro/logs/` or `$TMPDIR/kiro-log/`

### 8.2. When Tools Don't Appear

- Check server status with the `/mcp` command
- Verify whether OAuth authentication is required
- Wait for the server to finish initializing

### 8.3. When a Tool Name Is Too Long or Invalid

Report the issue to the server provider. The tool will be automatically excluded.

### 8.4. Tools with Overly Long Descriptions

A warning message is displayed, but the tool remains usable. Response speed may be slower.

# References

- <https://kiro.dev/docs/mcp/>
- <https://modelcontextprotocol.io/>
