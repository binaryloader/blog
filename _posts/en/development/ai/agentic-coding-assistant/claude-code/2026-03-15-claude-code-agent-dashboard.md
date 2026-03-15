---
title: "[Claude Code] Building an Agent Team Dashboard: Watching 19 AI Coworkers in Real Time"
lang: en
permalink: /en/:categories/:title/
ref: claude-code-agent-dashboard
excerpt: "How I built a real-time dashboard to visualize a 19-agent Claude Code team — from a failed Gather Town experiment to a 3-panel monitoring UI with WebSocket, TTS, and a COO named Yun Si-hyeon."
date: 2026-03-15T09:00+09:00
last_modified_at: 2026-03-15T09:00+09:00
published: true
header:
  overlay_color: "#1a1a2e"
  overlay_filter: "0.6"
  teaser: "/assets/image/thumbnail/teaser/en/claude-code-agent-dashboard.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Claude-Code
tags:
  - Claude Code
  - Subagent
  - Dashboard
  - WebSocket
  - Hono
  - React
  - Agentic Coding
depth:
  - title: "Development"
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "Agentic Coding Assistant"
    url: /en/development/ai/agentic-coding-assistant/
  - title: "Claude Code"
    url: /en/development/ai/agentic-coding-assistant/claude-code/
sidebar:
  nav: "menu-en"
---

# Overview

When you run a 19-agent Claude Code team, you quickly lose track of who is doing what. I built a real-time dashboard to solve that — and the path there involved a full pivot from a Gather Town-style 2D virtual office to a clean 3-panel monitoring UI.

<!--more-->

This post covers what the dashboard does, how the data pipeline works, and the design decisions that made the system feel alive rather than just functional.

# The Problem

My previous post described [how I set up a 15-agent Claude Code team](/en/development/ai/agentic-coding-assistant/claude-code/claude-code-sub-agent-team-design/) with specialized roles — planners, developers, reviewers, QA, and security. Once that team was running, a new problem emerged: I had no visibility into what was actually happening.

Claude Code runs in a terminal. When you invoke a subagent, the main session delegates control and you wait. With 19 agents that can run in parallel, the mental overhead of tracking state in your head becomes real. I wanted to see all of it at a glance — who is working, what they are doing, and what finished.

The organizational structure is:

```
CEO (me)
    │
    ▼
COO — Yun Si-hyeon (main Claude Code session)
    │
    ├── Planning: Kim So-yeon, Lee Jun-hyeok, Han Ye-seul, Jo Min-ji
    ├── Dev: Kang Ha-rin, Yun Seo-jin, Park Do-hyeon, Jeong U-seong
    ├── Review: 6 reviewers (arch + quality per domain)
    ├── QA: Oh Tae-yun
    └── Security: Sin Jae-won
```

Each agent has a Korean name and a defined role. The COO (윤시현, Yun Si-hyeon) orchestrates and reports to me. I can give instructions like "tell Ha-rin to review the PR" and the system routes it correctly.

# The First Attempt: 2D Virtual Office

My first instinct was to make it fun. I started building a Gather Town-style pixel-art office where each agent had a desk, walked to the cafeteria, did idle animations, and physically walked to the CTO's desk to report. There were seasonal decorations, time-of-day lighting, weather sync via the Open-Meteo API, and Friday evening parties in the cafeteria.

It was genuinely entertaining to build. Agents had idle habits — coffee addiction, sofa napping, stretching, wandering. There was a level-up system with desk decorations, an MVP crown for the top performer, and streak fire effects for consecutive completions.

But after running it for a week, I found I was watching the animations instead of working. The information density was low. To see what task an agent was working on I had to click through menus. Status was scattered across a large scrollable map.

I pivoted to a dashboard.

# What the Dashboard Does

The current dashboard is a 3-panel layout:

- **Left sidebar** — all 19 agents grouped by team (Planning, Dev, Review, QA/Security, COO), each showing current status and task description
- **Center panel** — Active Tasks, the working agents with elapsed time and a card that expands to show the full task detail with Markdown rendering
- **Right panel** — split between Completed (recent history) and Errors (with error message)

{% include figure popup=true image_path="/assets/image/post/claude-code-agent-dashboard/dashboard-overview.png" alt="Dashboard overview showing 3-panel layout" caption="3-panel dashboard: agent sidebar, active tasks, completed/error history" %}

Status badges use four states: `idle` (gray), `working` (blue pulse), `completed` (green), `error` (red). The COO gets its own visual treatment since it represents the orchestrating main session.

There is also a dark/light mode toggle and DOMPurify-based XSS protection on all Markdown-rendered content.

# Architecture

The project is a pnpm monorepo with three packages:

```
packages/
  shared/     # Types, agent definitions, shared constants
  server/     # Hono HTTP server + WebSocket broadcaster
  client/     # React 19 SPA (Vite + Tailwind CSS 4 + zustand)
```

The data flow is:

```
Claude Code hooks (HTTP POST)
    → Server (event-processor)
    → WebSocket broadcast
    → Browser (zustand store → React render)
```

## Hook Integration

Claude Code fires HTTP hooks at lifecycle points. I added these to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SubagentStart": [{ "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }] }],
    "SubagentStop":  [{ "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }] }],
    "Stop":          [{ "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }] }],
    "SessionStart":  [{ "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }] }],
    "SessionEnd":    [{ "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }] }],
    "PreToolUse":    [{ "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }] }],
    "PostToolUse":   [{ "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }] }]
  }
}
```

The server receives each event and routes it through `event-processor.ts`. `SubagentStart` transitions an agent to `working`. `SubagentStop` checks for errors and transitions to `completed` or `error`. `PreToolUse` and `PostToolUse` update the `currentTask` field with a human-readable description of what the agent is doing right now.

```typescript
function describeToolUsage(toolName: string, toolInput: Record<string, unknown>): string {
  switch (toolName) {
    case "Write":
    case "Edit":
      return `Editing ${String(toolInput.file_path ?? "file")}`;
    case "Read":
      return `Reading ${String(toolInput.file_path ?? "file")}`;
    case "Bash": {
      const cmd = String(toolInput.command ?? "");
      return `Running: ${cmd}`;
    }
    default:
      return `Using ${toolName}`;
  }
}
```

This gives the sidebar card a live description like "Editing src/components/ChatInput.tsx" rather than just a static task name.

## The task-assign Pattern

One limitation of the hook system is that `SubagentStart` does not carry the task name — Claude Code does not pass that through the hook payload. By the time the hook fires, I do not have a human-readable description of what the agent was asked to do.

The solution is a pre-registration endpoint:

```bash
curl -s -X POST http://localhost:3100/api/v1/task-assign \
  -H 'Content-Type: application/json' \
  -d '{"agent_type":"web-developer","task":"PR #42 리뷰 반영 및 컴포넌트 리팩토링"}' \
  2>/dev/null || true
```

The COO calls this before invoking a subagent. The server stores it in `pendingTaskStore`. When `SubagentStart` arrives (within 5 minutes), the processor matches the agent type and attaches the pre-registered task name. If the hook arrives first, the pending task is applied retroactively on the next update.

The `|| true` at the end means a stopped dashboard never blocks the agent workflow.

## WebSocket Broadcast

The server maintains a set of open WebSocket connections and broadcasts typed messages on state changes. The client subscribes on mount and merges updates into a zustand store.

```typescript
// Server: broadcast on SubagentStop
const cooReport: WsCooReport = {
  type: "coo:report",
  payload: {
    fromAgentId: agentId,
    reportType: "success",
    task: taskForHistory,
    timestamp: now,
  },
};
broadcaster.broadcast(cooReport);
```

Message types include `agent:update`, `coo:report`, `stats:update`, and `event:trigger`. The `event:trigger` type handles special events like `emergency_alert` (multiple errors in 60 seconds) and `tension_mode` (10+ agents working simultaneously).

# TTS: The COO Reads Reports Aloud

One feature that carried over from the 2D office era is voice reporting. When an agent completes a task, the COO (윤시현) reads the report summary aloud using Gemini TTS.

The server proxies the TTS request to avoid exposing API keys to the client:

```
Client (toggle on) → POST /api/v1/tts → Server → Gemini TTS API → audio/mpeg → Client plays
```

The primary voice is Gemini's Chirp 3 HD. If that fails, it falls back to the standard Chirp 3. Users can toggle TTS on or off independently of other audio.

In practice, hearing "강하린이 PR #42 리뷰를 완료했습니다" out loud while working on something else is genuinely useful. It breaks through terminal noise without requiring you to switch windows.

# Special Events

A few behaviors from the 2D office survived the pivot because they provide useful signal:

- **Emergency alert** — triggered when 2+ errors occur within 60 seconds. The UI flashes red. In practice this has been a reliable indicator that something systemic is wrong.
- **Tension mode** — triggered when 10+ agents are simultaneously working. Useful during large parallel deployments.
- **COO report** — when an agent completes a task, a `coo:report` WebSocket message fires, which the UI renders as a notification feed on the right side.

# Auto-Start with launchd

Since the dashboard needs to be running before Claude Code fires hooks, I set it up as a macOS launchd service:

```xml
<!-- ~/Library/LaunchAgents/io.binaryloader.agent-dashboard.plist -->
<key>ProgramArguments</key>
<array>
  <string>/usr/local/bin/node</string>
  <string>/path/to/claude-code-agent-dashboard/packages/server/dist/index.js</string>
</array>
<key>RunAtLoad</key>
<true/>
<key>KeepAlive</key>
<true/>
```

The server starts on login and restarts automatically if it crashes.

# What I Learned

**Information density matters more than novelty.** The 2D office was fun to build but the dashboard is what I actually use. The pivot cost about two days of work but the daily utility is significantly higher.

**Pre-registration solves hook payload gaps.** Claude Code's hook system does not pass task context through `SubagentStart`. The `task-assign` pattern is a simple fix — register intent before invoking, match on arrival. The 5-minute window has never been a problem in practice.

**Naming agents makes the workflow feel real.** Saying "tell Ha-rin to implement this" rather than "invoke web-developer subagent" changes how I think about the work. The COO routing layer makes the organizational metaphor functional, not just decorative.

**The hook system is powerful but requires defensive coding.** Every hook handler must return 200 regardless of what happened internally. Any exception that surfaces to Claude Code can block the agent. Error handling and the `|| true` curl pattern are not optional.

# Source

- Repository: [github.com/binaryloader/claude-code-agent-dashboard](https://github.com/binaryloader/claude-code-agent-dashboard)
- Related: [Designing an Expert Team with Subagents](/en/development/ai/agentic-coding-assistant/claude-code/claude-code-sub-agent-team-design/)
