---
title: "[Kiro] Agent Configuration"
lang: en
permalink: /en/:categories/:title/
ref: kiro-agent-configuration
excerpt: "A guide covering agent creation, configuration, prompt modularization, and sub-agent usage in Kiro."
date: 2026-03-13T21:42+09:00
last_modified_at: 2026-03-13T21:42+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/kiro-agent-configuration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/kiro-agent-configuration.png"
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
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "Agentic Coding Assistant"
    url: /en/development/ai/agentic-coding-assistant/
  - title: "Kiro"
    url: /en/development/ai/agentic-coding-assistant/kiro/
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

# Overview

A guide covering agent creation, configuration, prompt modularization, and sub-agent usage in Kiro.

# Steps

## 1. Configuration File

### 1.1. Purpose

A configuration file that defines the agent's behavioral rules, available tools, context files, MCP servers, and more.

### 1.2. Location

- Global agent (user-wide): `~/.kiro/agents/<name>.json` - available across all projects
- Workspace agent (per-project): `.kiro/agents/<name>.json` - available only in that project, takes precedence over global agents

### 1.3. Basic Structure

```json
{
  "name": "agent-name",
  "description": "Agent description",
  "prompt": "System prompt or file:///path/to/prompt.txt",
  "tools": ["fs_read", "fs_write", "execute_bash", "grep", "glob", "code"],
  "allowedTools": ["fs_read", "grep", "glob"],
  "resources": ["file://README.md", "file://src/**/*.swift"],
  "hooks": {},
  "mcpServers": {}
}
```

### 1.4. Key Fields

| Field | Description |
|---|---|
| `name` | Agent name |
| `description` | Agent description |
| `prompt` | System prompt (inline text or `file://` URI) |
| `tools` | List of available tools |
| `allowedTools` | Auto-approved tools (run without confirmation) |
| `resources` | Context files auto-loaded with every conversation |
| `hooks` | Event-driven auto-execution commands |
| `mcpServers` | Agent-specific MCP servers |
| `model` | Agent-specific model |
| `keyboardShortcut` | Agent switching shortcut |

## 2. Creating an Agent

### 2.1. Slash Command

```
/agent generate
```

### 2.2. CLI Command

```bash
kiro-cli agent create --name my-project
```

### 2.3. Manual Creation

Create the file `.kiro/agents/my-project.json` directly.

## 3. Managing Agents

### 3.1. List Agents

```bash
kiro-cli agent list
```

### 3.2. Validate an Agent

```bash
kiro-cli agent validate --path .kiro/agents/my-project.json
```

### 3.3. Set Default Agent

```bash
kiro-cli agent set-default my-project
```

### 3.4. Switch in Chat

```
/agent my-project
```

## 4. Configuration Examples

### 4.1. iOS Development Agent

```json
{
  "name": "my-project",
  "description": "iOS development agent",
  "prompt": "file:///Users/username/.kiro/prompts/my-project.txt",
  "tools": ["fs_read", "fs_write", "execute_bash", "grep", "glob", "code"],
  "allowedTools": ["fs_read", "grep", "glob", "code"],
  "resources": [
    "file://README.md"
  ]
}
```

### 4.2. Reusing an Existing CLAUDE.md

You can directly use a CLAUDE.md from Claude Code as a Kiro agent's prompt.

```json
{
  "name": "my-project",
  "prompt": "file:///Users/username/.claude/CLAUDE.md",
  "resources": ["file://README.md"]
}
```

## 5. Modularized Prompt Structure

Prompts can be split into modules for better reusability and maintainability.

### 5.1. Directory Structure

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

### 5.2. Module File Example

`common-rules.md` (common rules)

```markdown
# Common Rules

## 1. Language

### 1.1. Korean

- Use commas only when listing consecutive items
- Do not use commas after conjunctive adverbs or connective endings

## 2. Tools

### 2.1. GitLab

- Use GitLab MCP for GitLab operations
- The host is `gitlab.example.com`
```

`developer-ios-rules.md` (iOS development rules)

```markdown
# iOS Development Rules

## 1. Swift Style Convention

- Add a blank line after type declarations
- Put each parameter on a new line when there are 2 or more
- Always add a blank line after guard statements
- Always write return explicitly; do not omit it
```

### 5.3. Integrated Prompt

`developer-ios.md` (module references)

```markdown
# iOS Developer Agent

You are a senior iOS developer with over 10 years of experience. You are proficient in Swift and iOS frameworks, and skilled in clean code and architecture design.

Follow these rules.

- Common rules are defined in `~/.kiro/prompts/modules/common-rules.md`
- iOS development rules are defined in `~/.kiro/prompts/modules/developer-ios-rules.md`
```

### 5.4. Agent Configuration

```json
{
  "name": "developer-ios",
  "description": "iOS development agent",
  "prompt": "file:///Users/username/.kiro/prompts/agents/developer-ios.md",
  "tools": ["fs_read", "fs_write", "execute_bash", "grep", "glob", "code"],
  "allowedTools": ["fs_read", "grep", "glob", "code"],
  "resources": ["file://README.md"]
}
```

### 5.5. Benefits of Modularization

- Reusability: share common rules across multiple agents
- Maintainability: update a module file to change rules everywhere
- Clarity: rules are separated by role for easier management

## 6. Sub-Agents

Multiple agents can run in parallel to share the workload for complex tasks.

### 6.1. Activation

```bash
kiro-cli settings chat.enableSubagent true
```

### 6.2. Usage Example

Request:

```
Review the changes on the current branch using the reviewer-ios agent
```

The execution flow is as follows.

1. The main agent calls the `use_subagent` tool
2. The reviewer-ios sub-agent starts
3. The sub-agent checks the git diff and performs a code review
4. The results are returned to the main agent

### 6.3. Characteristics

- Up to 4 sub-agents can run simultaneously
- Each sub-agent has an independent context
- Parallel processing for faster execution
- Enables usage of specialized agents

### 6.4. Use Cases

- Development + review: write code with developer-ios, then review with reviewer-ios
- Multi-platform: run iOS and Android agents simultaneously
- Role division: backend, frontend, and infra agents working in parallel

## 7. Adding Temporary Context During a Session

In addition to agent configuration, files can be temporarily added to the context during a conversation (cleared when the session ends).

```
/context add README.md docs/**/*.md
/context show
/context remove README.md
/context clear
```

# References

- <https://kiro.dev/docs/agents/>
- <https://kiro.dev/docs/context/>
