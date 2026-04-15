---
title: "[Claude Code] Designing an Expert Team with Subagents"
lang: en
permalink: /en/:categories/:title/
ref: claude-code-sub-agent-team-design
excerpt: "How to build an expert team from planning to deployment by combining Claude Code's Subagents, Skills, Rules, Hooks, and MCP Servers."
date: 2026-03-14T00:40+09:00
last_modified_at: 2026-03-14T00:40+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/claude-code-sub-agent-team-design.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/claude-code-sub-agent-team-design.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Claude-Code
tags:
  - Claude Code
  - Subagent
  - MCP
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

How to build an expert team from planning to deployment by combining Claude Code's Subagents, Skills, Rules, Hooks, and MCP Servers.

# Steps

## 1. Architecture Overview

Claude Code operates with a main agent that converses with the user and invokes Subagents as needed. By placing agents, skills, and rules under the `.claude/` directory, you can run an entire development team from a single CLI tool.

```
CEO (User)
    │
    ▼
Claude Code Main Session (CTO / Orchestrator)
    │
    ├── Planning Team ─── product-planner, ui-designer, tech-writer
    ├── Development Team ─── dev-planner, ios-developer, server-developer, infra-developer
    ├── Review Team ─── ios-reviewer-arch/quality, server-reviewer-arch/quality, infra-reviewer-security/ops
    └── Quality Team ─── qa-engineer, security-auditor
```

| Team | Agent | Role | Model | Mode | Isolation |
|---|---|---|---|---|---|
| Planning | `product-planner` | Planner | opus | plan | - |
| Planning | `ui-designer` | Designer | sonnet | plan | - |
| Planning | `tech-writer` | Technical Writer | sonnet | acceptEdits | - |
| Development | `dev-planner` | Dev Planner | opus | plan | - |
| Development | `ios-developer` | iOS Developer | opus | default | worktree |
| Development | `server-developer` | Server Developer | opus | default | worktree |
| Development | `infra-developer` | Infra Developer | opus | default | worktree |
| Review | `ios-reviewer-arch` | iOS Architecture | sonnet | plan | - |
| Review | `ios-reviewer-quality` | iOS Quality | sonnet | plan | - |
| Review | `server-reviewer-arch` | Server Architecture | sonnet | plan | - |
| Review | `server-reviewer-quality` | Server Quality | sonnet | plan | - |
| Review | `infra-reviewer-security` | Infra Security | sonnet | plan | - |
| Review | `infra-reviewer-ops` | Infra Operations | sonnet | plan | - |
| Quality | `qa-engineer` | QA Engineer | sonnet | default | - |
| Quality | `security-auditor` | Security Auditor | opus | plan | - |

The key constraints are as follows.

- Subagents cannot create other subagents. The main session handles all orchestration
- Agent Teams is an experimental feature. The `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable is required
- Team members in Agent Teams communicate directly with each other but nested teams are not supported

The criteria for choosing between subagents and agent teams are as follows.

- **Subagent**: Delegate a single task and receive results (review, analysis, single feature implementation)
- **Agent Team**: Multiple agents work independently in parallel over extended periods (iOS + server simultaneous development)

## 2. File Map

### 2.1. Global Configuration (~/.claude/)

User-level settings applied globally to all projects. These are always loaded regardless of which directory Claude Code is run from.

```
~/.claude/
├── CLAUDE.md                       # Global rules (CLAUDE.md/MEMORY.md format, rules/ reference)
├── settings.json                   # Global permissions, plugins, env vars, hooks
│
├── rules/                          # Global rules (10 files)
│   ├── markdown.md                 # Markdown heading/bullet/line break rules (always loaded)
│   ├── korean.md                   # Korean comma/style rules (always loaded)
│   ├── git.md                      # Git commit/GitHub repo rules (always loaded)
│   ├── security.md                 # Security rules (always loaded)
│   ├── swift.md                    # Swift style/TCA (paths: **/*.swift)
│   ├── xcode.md                    # Xcode header/project (paths: **/*.swift, **/Package.swift, **/Project.swift)
│   ├── kotlin.md                   # Kotlin server rules (paths: server/**/*.kt)
│   ├── terraform.md                # Terraform rules (paths: infra/**/*.tf)
│   ├── api-design.md               # REST API design (paths: **/api/**, **/controller/**, **/Controller/**, **/routes/**)
│   └── image-metadata.md           # Image metadata (paths: **/*.jpg etc.)
│
├── agents/                         # Subagents (15 agents)
│   ├── product-planner.md          # Planner (opus, plan, memory:project)
│   ├── ui-designer.md              # Designer (sonnet, plan)
│   ├── tech-writer.md              # Technical Writer (sonnet, acceptEdits)
│   ├── dev-planner.md              # Dev Planner (opus, plan, memory:project)
│   ├── ios-developer.md                  # iOS Developer (opus, worktree, memory:project, hooks)
│   ├── server-developer.md               # Server Developer (opus, worktree, memory:project, hooks)
│   ├── infra-developer.md                # Infra Developer (opus, worktree, memory:project, hooks)
│   ├── ios-reviewer-arch.md        # iOS Architecture Reviewer (sonnet, plan)
│   ├── ios-reviewer-quality.md     # iOS Quality Reviewer (sonnet, plan)
│   ├── server-reviewer-arch.md     # Server Architecture Reviewer (sonnet, plan)
│   ├── server-reviewer-quality.md  # Server Quality Reviewer (sonnet, plan)
│   ├── infra-reviewer-security.md  # Infra Security Reviewer (sonnet, plan)
│   ├── infra-reviewer-ops.md       # Infra Operations Reviewer (sonnet, plan)
│   ├── qa-engineer.md              # QA Engineer (sonnet, default)
│   └── security-auditor.md         # Security Auditor (opus, plan)
│
├── skills/                         # Workflows (5 skills)
│   ├── planning/SKILL.md           # /planning <feature>
│   ├── develop/SKILL.md            # /develop <task>
│   ├── review-all/SKILL.md         # /review-all [branch]
│   ├── release/SKILL.md            # /release <version>
│   └── standup/SKILL.md            # /standup
│
└── hooks/                          # Hook scripts (3 scripts)
    ├── lint-swift.sh               # Lint check before Swift file modification
    ├── lint-kotlin.sh              # Lint check before Kotlin file modification
    └── notify.sh                   # Subagent completion notification
```

### 2.2. Project Configuration

All agents, skills, rules, and hooks are managed globally (`~/.claude/`). Individual projects contain only project-specific settings.

```
my-project/
├── CLAUDE.md                       # Project root rules (tech stack, build, @import)
│
├── .claude/
│   ├── settings.json               # Project permissions, env vars (team shared)
│   ├── settings.local.json         # Local-only secrets (.gitignore)
│   └── rules/                      # Project-specific rules (optional)
│       ├── frontmatter.md          # Blog Front Matter rules etc.
│       └── writing.md              # Project-specific writing rules etc.
│
├── ios/                            # iOS app source (Swift/SwiftUI)
├── server/                         # Backend server (Spring Boot/Kotlin)
├── infra/                          # Infrastructure code (Terraform)
└── docs/                           # Project documentation
```

How global agents/skills work across all projects is as follows.

- Agents defined in `~/.claude/agents/*.md` are automatically available regardless of which directory Claude Code is run from
- Skills defined in `~/.claude/skills/*/SKILL.md` are likewise globally callable
- `paths` matching in `~/.claude/rules/*.md` applies to file paths in the current working project
- Hooks in `~/.claude/settings.json` run across all projects

## 3. Agent Design (15 Agents)

Agents are defined as Markdown files in the `.claude/agents/` directory. Metadata is configured via YAML Frontmatter and role instructions are written in the body.

### 3.1. Planning Team

**product-planner** - Product planning, user stories, PRD writing. Conducts market research using WebSearch.

- Model: opus / Permission: plan
- Tools: Read, Glob, Grep, Write, Edit, WebSearch, WebFetch
- Memory: project (remembers planning history per project)
- Role: User story definition, MoSCoW/RICE prioritization, MVP scope definition
- Output: PRD document (background, goals, acceptance criteria, exclusions)

**ui-designer** - UI/UX design, screen flow definition, design system management. Uses built-in Figma integration.

- Model: sonnet / Permission: plan
- Tools: Read, Glob, Grep, Write, Edit, WebSearch, WebFetch
- Role: Screen flows, wireframe specs, design system definition
- Principles: Mobile first, HIG compliance, VoiceOver/Dynamic Type support

**tech-writer** - Tickets, wiki, API docs, README writing. Writes directly to external tools via MCP.

- Model: sonnet / Permission: acceptEdits
- Tools: Read, Write, Edit, Glob, Grep, WebFetch
- MCP: jira (tickets), confluence (wiki), github (PR/README)
- Output: Tickets, wiki, OpenAPI docs, CHANGELOG, release notes
- Format: Utilizes Mermaid diagrams

### 3.2. Development Team

**dev-planner** - PRD-based technical design (TDD), task decomposition, API interface design. Reads and analyzes the codebase.

- Model: opus / Permission: plan
- Tools: Read, Glob, Grep, Write, Edit, WebSearch, WebFetch
- Memory: project (remembers design history)
- MCP: sequential-thinking (complex design decisions), jira (requirements reference), confluence (design docs reference)
- Role: API interfaces, DB schema, iOS/server/infra task decomposition, dependency graph
- Principles: YAGNI, task units within 1 day, API contract first

All developer agents work in isolated Git worktrees with `isolation: worktree`, enabling parallel development without conflicts.

**ios-developer** - Swift/SwiftUI iOS app development. Works in an isolated worktree.

- Model: opus / Permission: default / Isolation: worktree
- Tools: Read, Write, Edit, Glob, Grep, Bash, LSP
- Memory: project
- MCP: github, context7, jira, confluence
- Skills: develop
- Hooks: PostToolUse - auto-runs `swift-format` + `swiftlint --fix` on Write/Edit
- Stack: Swift 6, SwiftUI, TCA, SPM, SwiftData, async/await
- Branch: `feature/ios-*`

**server-developer** - Spring Boot/Kotlin server development. API implementation, DB design.

- Model: opus / Permission: default / Isolation: worktree
- Tools: Read, Write, Edit, Glob, Grep, Bash, LSP
- Memory: project
- MCP: github, postgres, context7, jira, confluence
- Skills: develop
- Hooks: PostToolUse - auto-runs `ktlint --format` on Write/Edit
- Stack: Spring Boot 3, Kotlin, PostgreSQL, Redis, Flyway
- Branch: `feature/server-*`

**infra-developer** - AWS infrastructure provisioning, Terraform IaC, CI/CD pipelines.

- Model: opus / Permission: default / Isolation: worktree
- Tools: Read, Write, Edit, Glob, Grep, Bash
- Memory: project
- MCP: github, context7, jira, confluence
- Skills: develop
- Hooks: PostToolUse - auto-runs `terraform fmt` on Write/Edit
- Stack: AWS (ECS, RDS, S3, CloudFront, ALB), Terraform, GitHub Actions, Docker
- Branch: `feature/infra-*`

### 3.3. Review Team

Two reviewers per developer separate architecture and quality perspectives for multi-angle reviews. All reviewers are read-only with `permissionMode: plan`.

**iOS Review**

| Agent | Perspective | Required (🔴) | Recommended (🟡) |
|---|---|---|---|
| `ios-reviewer-arch` | TCA pattern compliance, module dependency direction, separation of concerns, SOLID principles | Architecture violations, circular dependencies, layer breaches | Structural improvement suggestions |
| `ios-reviewer-quality` | Optional handling, retain cycles, unnecessary re-renders, MainActor/Sendable | Crashes, memory leaks, data races | Performance improvements, readability |

**Server Review**

| Agent | Perspective | Required (🔴) | Recommended (🟡) |
|---|---|---|---|
| `server-reviewer-arch` | REST principles, normalization, Controller/Service/Repository separation, scalability | API contract violations, data integrity risks | Design improvements, performance optimization |
| `server-reviewer-quality` | SQL Injection, XSS, CSRF, N+1, Bean Validation, logging | Security vulnerabilities, data loss, resource leaks | Error handling improvements |

**Infra Review**

| Agent | Perspective | Required (🔴) | Recommended (🟡) |
|---|---|---|---|
| `infra-reviewer-security` | Least privilege, security groups, Secrets Manager, TLS/KMS, CloudTrail | Public exposure, hardcoded secrets, excessive permissions | Security hardening, audit logs |
| `infra-reviewer-ops` | Multi-AZ, auto scaling, CloudWatch, backup/restore, tagging strategy | Single points of failure, no backups, cost explosions | Cost reduction, monitoring improvements |

### 3.4. QA/Security Team

**qa-engineer** - Unit/integration test writing, test scenario design, edge case exploration

- Model: sonnet / Permission: default
- Tools: Read, Write, Edit, Glob, Grep, Bash
- Patterns: Given-When-Then, factory pattern for test data generation
- iOS: XCTest, Swift Testing
- Server: JUnit 5, MockK, Testcontainers
- Principles: Prefer real implementations over mocks, boundary values/null/exceptions required

**security-auditor** - OWASP Top 10, authentication/authorization, sensitive data exposure, dependency vulnerability audit

- Model: opus / Permission: plan
- Tools: Read, Glob, Grep, Bash
- MCP: sequential-thinking (systematic security analysis)
- Checks: Full OWASP A01-A10, JWT/session, SQL/NoSQL Injection, CVE
- iOS security: Keychain usage, ATS, certificate pinning
- Severity: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low (4 levels)

### 3.5. Agent Configuration Details

#### 3.5.1. Frontmatter Fields

```yaml
---
name: ios-developer
description: iOS app development expert. Use when requesting Swift/UIKit/SwiftUI code.
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - LSP
model: opus
isolation: worktree
memory: project
permissionMode: default
mcpServers:
  - github
  - context7
  - jira
  - confluence
skills:
  - develop
hooks:
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: >-
            file="$TOOL_INPUT_file_path";
            [[ "$file" == *.swift ]] &&
            swift-format format --in-place "$file" 2>/dev/null &&
            swiftlint --fix --quiet --path "$file" 2>/dev/null; true
          timeout: 10
---
```

| Field | Description | Example |
|---|---|---|
| `name` | Unique agent name | `ios-developer` |
| `description` | Used by Claude to automatically select the appropriate agent | "iOS app development expert..." |
| `model` | Model to use (`opus`, `sonnet`) | `opus` |
| `tools` | List of accessible tools | Read, Write, Bash, LSP |
| `permissionMode` | `plan`=read-only, `default`=write, `acceptEdits`=auto-approve | `plan` |
| `isolation` | Runs in an isolated Git worktree when set to `worktree` | `worktree` |
| `memory` | Memory scope (`user`, `project`, `local`) | `project` |
| `mcpServers` | Restricts accessible MCP servers | github, context7 |
| `skills` | Skills available to this agent | develop |
| `hooks` | Hooks that run only during this agent's execution | PostToolUse → swift-format |

#### 3.5.2. Model Distribution

| Model | Agent Count | Agent List | Purpose |
|---|---|---|---|
| `opus` | 6 | product-planner, dev-planner, ios-developer, server-developer, infra-developer, security-auditor | Creative thinking, accurate code generation, deep analysis |
| `sonnet` | 9 | ui-designer, 6 reviewers, qa-engineer, tech-writer | Patterned tasks, read-only analysis, documentation - cost-efficient |

#### 3.5.3. Permission Modes

| Mode | Description | Agents |
|---|---|---|
| `plan` (read-only) | Cannot modify code, analysis/review only | Planning team (2), dev-planner, reviewers (6), security-auditor |
| `default` (standard) | Requires user approval for modifications | ios-developer, server-developer, infra-developer, qa-engineer |
| `acceptEdits` | Auto-approves file modifications | tech-writer |

## 4. Agent Teams (Experimental)

### 4.1. Subagents vs Agent Teams

Agent Teams is a feature where multiple Claude Code instances run independently in parallel and communicate directly with each other. Unlike subagents, each team member maintains its own context and self-coordinates through a shared task list.

| | Subagent | Agent Team |
|---|---|---|
| Communication | Reports only to main | Direct messages between team members |
| Coordination | Main manages all tasks | Self-coordinates via shared task list |
| Context | Returns only results | Maintains full independence |
| Cost | Low | High (independent instances) |
| Suitable tasks | Single task delegation | Extended parallel development |

### 4.2. Activation

Set the environment variable in `~/.claude/settings.json`.

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### 4.3. Team Composition Scenario

Use Agent Teams when developing a large feature across iOS + server + infra simultaneously.

```
Team Leader (Main Session = CTO)
    │
    ├── Member 1: iOS Development     ← Runs with ios-developer agent config
    │   └── feature/ios-social-login branch
    │
    ├── Member 2: Server Development  ← Runs with server-developer agent config
    │   └── feature/server-social-login branch
    │
    └── Member 3: Infrastructure      ← Runs with infra-developer agent config
        └── feature/infra-oauth-provider branch

    Communication: Shared task list + mailbox system
    Display: tmux split panes or in-process (cycle with Shift+Down)
```

The criteria for using Agent Teams are as follows.

- When developing iOS + server + infra **simultaneously over an extended period**
- When team members need to **coordinate API contracts**
- When the work is expected to take **more than 30 minutes**

The criteria for using subagents are as follows.

- Single review, single analysis, single feature implementation
- Short tasks where only the result is needed
- When you want to save costs

## 5. Skill Design

Skills are automation units that invoke repeatable workflows via `/skill-name`. They can run in an isolated subagent with `context: fork` or execute directly in the main session.

### 5.1. Frontmatter Fields

| Field | Description |
|---|---|
| `name` | Invocation name (`/name`) |
| `description` | Used by Claude to determine when to auto-invoke |
| `argument-hint` | Argument hint (displayed to the user) |
| `context: fork` | Runs in an isolated subagent context |
| `agent` | Agent to use when `context: fork` is set |
| `disable-model-invocation` | When `true`, manual invocation only (no auto-invocation) |
| `allowed-tools` | Tools usable without approval |

### 5.2. Dynamic Context Injection

The `` !`command` `` syntax executes a shell command when a skill is loaded and injects the result. This is the key mechanism for passing real-time project state to skills.

```bash
# Example: write the following in the skill body
!`git diff --stat`
!`git log --oneline -5`
!`gh pr list --state open`

# → Automatically executed on skill load and results are injected into the context
```

### 5.3. Skill Details

#### 5.3.1. /planning <feature>

Executes the full flow from new feature planning to technical design, task decomposition, and documentation. Auto-invoked when requesting "feature planning", "PRD", or "new feature planning".

- Dynamic injection: `git log --oneline -10`, `ls -la docs/`
- Step 1: **product-planner** - Write PRD (user stories, acceptance criteria, priorities, exclusions)
- Step 2: **dev-planner** - Technical design (API interfaces, DB schema, task decomposition, dependency graph)
- Step 3: **ui-designer** - UI/UX design (screen flows, UI specs)
- Step 4: **tech-writer** - Documentation (create tickets via MCP, register wiki, save to docs/)
- Step 5: **Main session** - Final report (feature summary, estimated effort, risks, next steps)

#### 5.3.2. /develop <task>

Executes development, testing, and code review sequentially. Auto-invoked when requesting "develop", "implement", or "code".

- Dynamic injection: `git branch --show-current`, `git status -s`
- Step 1: **Task analysis** - Determine developer agent by file type (*.swift→ios-developer, server/**→server-developer, infra/**→infra-developer)
- Step 2: **Context gathering** - If the task includes ticket numbers or external document references, gather Jira tickets, Confluence design docs, API specs, and pass the context to subsequent steps
- Step 3: **\*-developer agent** - Write code on feature branch, Conventional Commits
- Step 4: **qa-engineer** - Write and run unit tests
- Step 5: **2 reviewers** - Parallel review based on changed file types
- Step 6: **PR Creation** - If no 🔴 items exist in the review results, create a PR on GitHub. Auto-generate the PR title and body, including a summary of review results
- Step 7: **Results report** - Implementation summary, test results, review results (by severity)

#### 5.3.3. /review-all [target]

Runs architecture, quality, and security reviews in parallel for the current branch's changes. Auto-invoked when requesting "review", "code review", or "PR review".

- Dynamic injection: `git diff --name-only main...HEAD`, `git diff --stat main...HEAD`
- Step 1: **Classify changed files** - *.swift → iOS, *.kt → Server, *.tf → Infra
- Step 2: **2 reviewers per domain** - Parallel invocation (architecture + quality)
- Step 3: **security-auditor** - Security audit on all changes
- Step 4: **Comprehensive report** - Classified as 🔴 Required fix / 🟡 Recommended / 🟢 Informational, merge go/no-go decision

#### 5.3.4. /release <version>

Executes the release checklist. Only manual invocation is available with `disable-model-invocation: true`.

- Dynamic injection: `git log --oneline main..HEAD`, `git tag --list --sort=-version:refname | head -5`
- Step 1: **qa-engineer** - Full test suite + coverage check
- Step 2: **security-auditor** - Final security audit, dependency CVE scan
- Step 3: **infra-developer** - Deployment scripts, environment variables, rollback plan, DB migration check
- Step 4: **tech-writer** - CHANGELOG, release notes, API docs check
- Step 5: **Go/No-Go decision** - Comprehensive checklist (tests, security, deployment, documentation)

#### 5.3.5. /standup

Generates a daily status report. Runs in isolation with `context: fork` and only allows manual invocation with `disable-model-invocation: true`.

- Dynamic injection: `git log --since="24 hours ago"`, `git branch -a`, `git status -s`, `gh pr list`, `gh run list --status failure`
- Output: Completed yesterday / Planned for today / Blockers / Metrics (commits, PRs, CI)

## 6. Rule Design

Placing markdown files in the `rules/` directory with `paths` frontmatter causes them to auto-load only when working on matching files. Rules are automatically applied when handling those files without needing to import from CLAUDE.md.

### 6.1. Global Rules (~/.claude/rules/)

10 files are managed. Applied globally to all projects.

#### 6.1.1. Always Loaded (no paths)

| File | Content |
|---|---|
| `markdown.md` | H2-H4 heading numbering, bullet point rules (no colons, complete sentences), line break rules |
| `korean.md` | Commas only for enumeration (no comma after conjunctive adverbs), unified `~handa` sentence ending |
| `git.md` | Conventional Commits, no Co-Authored-By, use MCP GitHub tools, repo naming |
| `security.md` | No hardcoded secrets, JWT expiration/Refresh Token management, SQL Injection/XSS prevention |

#### 6.1.2. Path-Based Loading

| File | paths | Content |
|---|---|---|
| `swift.md` | `**/*.swift` | Airbnb Style Guide, TCA pattern, parameter line break rules |
| `xcode.md` | `**/*.swift`, `**/Package.swift`, `**/Project.swift` | Xcode file header comments, Swift Package preferred, minimum iOS 16 |
| `kotlin.md` | `server/**/*.kt` | Kotlin official conventions, Spring Boot layer separation, N+1 prevention |
| `terraform.md` | `infra/**/*.tf` | Environment separation, modularization, S3+DynamoDB state management, least privilege |
| `api-design.md` | `**/api/**`, `**/controller/**`, `**/Controller/**`, `**/routes/**` | REST principles, unified response format (`data/error/meta`), Cursor pagination |
| `image-metadata.md` | `**/*.jpg`, `**/*.png` etc. | Preserve ICC profiles, remove only personal info, HEIC→JPG conversion |

### 6.2. Project Rules (.claude/rules/)

Rules that apply only to individual projects. Added when project-specific requirements are not sufficiently covered by global Rules.

| Project | File | paths | Content |
|---|---|---|---|
| Blog | `frontmatter.md` | `**/*.md` | Jekyll Front Matter format, category/tag rules |
| Blog | `writing.md` | (always loaded) | Writing style, post structure rules |
| iOS App | `testing.md` | `**/*Test*.swift` | XCTest/Swift Testing writing rules |

The operating principles for global vs project Rules are as follows.

- Rules that apply commonly across all projects are managed in global Rules
- Project Rules are used only for rules unique to that specific project
- When the same topic exists in both global and project Rules, both are loaded and applied together

### 6.3. Separating Agents and Rules

Writing coding rules in agent bodies causes the following problems.

- Same rules are duplicated across multiple agents
- When modifying a rule, you have to find and update every agent
- Unnecessarily consumes the agent's context window

By leveraging the `paths` auto-loading of Rules, agents can stay concise with just their role descriptions.

## 7. Hook Configuration

Hooks are handlers that auto-execute at specific points in the Claude Code lifecycle.

### 7.1. Hook Types

| Type | Description | Can Block |
|---|---|---|
| `command` | Execute shell command | Block with exit 2 |
| `http` | Send HTTP POST | JSON `decision: "block"` |
| `prompt` | LLM single-turn evaluation | `ok: false` |
| `agent` | Subagent with tool access | `ok: false` |

### 7.2. Global Hooks

Configured in `~/.claude/settings.json` and applied to all agents.

#### 7.2.1. SessionStart - Project Status Dashboard

Automatically displays the current branch, last 5 commits, and file change status at session start.

```json
"SessionStart": [{
  "hooks": [{
    "type": "command",
    "command": "echo 'Project Status' && git branch --show-current && echo '---' && git log --oneline -5 && echo '---' && git status -s",
    "statusMessage": "Loading project status..."
  }]
}]
```

#### 7.2.2. PreToolUse - Pre-Write Validation

Checks lint before modifying Swift/Kotlin files. Blocks modifications if error-level violations are found.

```bash
#!/bin/bash
# ~/.claude/hooks/lint-swift.sh
# exit 0 = pass, exit 2 = block (stderr fed back to Claude)

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c \
  "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

[[ "$FILE" != *.swift ]] && exit 0

if ! command -v swiftlint &>/dev/null; then
  exit 0
fi

RESULT=$(swiftlint lint --quiet --path "$FILE" 2>&1)
if echo "$RESULT" | grep -q "error:"; then
  echo "$RESULT" >&2
  exit 2
fi

exit 0
```

Dangerous commands are also blocked preemptively. Destructive commands like `rm -rf /`, `drop database`, and `DROP TABLE` are detected via the Bash matcher.

#### 7.2.3. PostToolUse - Auto-Formatting After Write

Runs the appropriate auto-formatter based on file extension after Write/Edit tool execution.

```json
"PostToolUse": [{
  "matcher": "Write|Edit",
  "hooks": [{
    "type": "command",
    "command": "file=\"$TOOL_INPUT_file_path\"; case \"$file\" in *.swift) swift-format format --in-place \"$file\" 2>/dev/null; swiftlint --fix --quiet --path \"$file\" 2>/dev/null ;; *.kt) ktlint --format \"$file\" 2>/dev/null ;; *.tf) terraform fmt \"$file\" 2>/dev/null ;; esac; true",
    "timeout": 15,
    "statusMessage": "Auto-formatting..."
  }]
}]
```

| Extension | Formatter |
|---|---|
| `*.swift` | `swift-format format --in-place` + `swiftlint --fix` |
| `*.kt` | `ktlint --format` |
| `*.tf` | `terraform fmt` |

#### 7.2.4. SubagentStop / TaskCompleted - Completion Notification

Sends a macOS desktop notification when a subagent or team task completes. Runs asynchronously with `async: true` to avoid blocking the main flow.

```bash
#!/bin/bash
# ~/.claude/hooks/notify.sh

INPUT=$(cat)
AGENT_TYPE=$(echo "$INPUT" | python3 -c \
  "import sys,json; print(json.load(sys.stdin).get('agent_type','task'))" 2>/dev/null || echo "task")

if [[ "$(uname)" == "Darwin" ]]; then
  osascript -e "display notification \"${AGENT_TYPE} agent has completed its work\" \
    with title \"Claude Code\" sound name \"Glass\""
fi

exit 0
```

### 7.3. Agent-Specific Hooks

Developer agents (ios-developer, server-developer, infra-developer) define agent-specific formatters via their own `hooks` frontmatter. These operate only during that agent's execution, independently of global hooks.

| Agent | Event | Action |
|---|---|---|
| ios-developer | PostToolUse (Write\|Edit) | `swift-format` + `swiftlint --fix` (*.swift only) |
| server-developer | PostToolUse (Write\|Edit) | `ktlint --format` (*.kt only) |
| infra-developer | PostToolUse (Write\|Edit) | `terraform fmt` (*.tf only) |

### 7.4. Hook Event Types

| Event | Timing | Primary Use |
|---|---|---|
| `SessionStart` | At session start | Display project status, check environment |
| `PreToolUse` | Before tool execution | Lint check, block dangerous commands |
| `PostToolUse` | After tool execution | Auto-formatting, post-processing |
| `Stop` | After response completion | Auto-testing, validation |
| `SubagentStop` | Subagent completion | Notifications, trigger follow-up tasks |
| `TaskCompleted` | Team task completion | Notifications, auto-invoke reviews |

## 8. Settings (Permissions/Environment)

### 8.1. Global Settings

All permissions, hooks, environment variables, and plugins are managed globally in `~/.claude/settings.json`.

**Permissions**

| Category | Content |
|---|---|
| allow (auto-approve) | `Bash(git *)`, `Bash(swift-format *)`, `Bash(swiftlint *)`, `Bash(ktlint *)`, `Bash(terraform fmt *)`, `Bash(gh *)` |
| deny (block) | `Bash(rm -rf /)`, `Bash(git push --force *)`, `Bash(git reset --hard *)`, `Bash(terraform destroy *)` |

**Other Settings**

| Item | Content |
|---|---|
| includeCoAuthoredBy | `false` - Does not include Co-Authored-By trailer in commits |
| plugins | `swift-lsp`, `clangd-lsp` (LSP) |
| language | Korean |
| env | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

### 8.2. Project / Local Settings

| File | Scope | Purpose |
|---|---|---|
| `.claude/settings.json` | Project (team shared, git committed) | Project-specific additional permissions, env vars |
| `.claude/settings.local.json` | Local only (.gitignore) | API keys, DB URLs, and other secrets |

```json
// .claude/settings.local.json (not committed)
{
  "env": {
    "JIRA_API_TOKEN": "",
    "JIRA_USERNAME": "",
    "CONFLUENCE_API_TOKEN": "",
    "CONFLUENCE_USERNAME": "",
    "DATABASE_URL": "",
  }
}
```

## 9. MCP Servers (External Integration)

### 9.1. How to Configure

MCP servers are registered using the `claude mcp add` CLI command. Writing directly to `.mcp.json` may cause servers to fail to load, so always use the CLI. Settings are saved in the `mcpServers` section of `~/.claude.json`.

```bash
# Global registration (-s user → ~/.claude.json)
claude mcp add github -s user -- gh mcp
claude mcp add context7 -s user -t http https://mcp.context7.com/mcp

# Per-project registration (-s project)
claude mcp add sentry -s project -- npx -y @sentry/mcp-server
```

### 9.2. Server List (9 Servers)

| Server | Type | Purpose | Agents | Auth |
|---|---|---|---|---|
| GitHub | stdio | PRs, Issues, code review, file inspection | ios-developer, server-developer, infra-developer, tech-writer | `gh` CLI |
| Jira | stdio | Ticket management, sprints, project management | dev-planner, ios-developer, server-developer, infra-developer, tech-writer | `JIRA_API_TOKEN` |
| Confluence | stdio | Wiki, document management | dev-planner, ios-developer, server-developer, infra-developer, tech-writer | `CONFLUENCE_API_TOKEN` |
| Context7 | http | Library documentation lookup | ios-developer, server-developer, infra-developer | None |
| Sequential Thinking | stdio | Complex decision making, systematic analysis | dev-planner, security-auditor | None |
| Obsidian | sse | Notes, knowledge base management | (global access) | None |
| PDF Reader | stdio | PDF document reading, search | (global access) | None |
| Scapple | stdio | Mind maps, idea visualization | (global access) | None |

Some MCP servers are configured per-agent in their frontmatter rather than globally. For example, postgres is referenced in the server-developer agent's `mcpServers` field.

### 9.3. Per-Agent MCP Access

The `mcpServers` field in agents restricts accessible MCP servers. If not specified, all MCP servers are accessible.

| Agent | Accessible MCP |
|---|---|
| ios-developer | github, context7, jira, confluence |
| server-developer | github, postgres, context7, jira, confluence |
| infra-developer | github, context7, jira, confluence |
| tech-writer | jira, confluence, github |
| dev-planner | sequential-thinking, jira, confluence |
| security-auditor | sequential-thinking |

### 9.4. Secret Management

API keys are passed via the `-e` option of the `claude mcp add` command.

```bash
claude mcp add jira -s user -e JIRA_API_TOKEN=xxx -- uvx mcp-atlassian --jira-url https://...
```

- Using `-e KEY=VALUE` stores the environment variable in the `env` section of the corresponding server entry in `~/.claude.json`
- Per-project secrets are stored in the `env` section of `.claude/settings.local.json` and added to `.gitignore`

## 10. CLAUDE.md Hierarchy

### 10.1. Layered Structure

```
~/.claude/CLAUDE.md                        ← Global personal rules
    │
    ▼
~/.claude/rules/*.md (10 files)            ← Global auto-loaded rules
    │
    ▼
project/CLAUDE.md                          ← Project rules
    │  @docs/architecture.md               ← Auto-reference docs via @import
    │  @docs/api-contract.md
    │
    ▼
.claude/rules/*.md (optional)              ← Project-specific rules
    ├── frontmatter.md → **/*.md
    ├── writing.md     → (always loaded)
    └── testing.md     → **/*Test*.swift
```

### 10.2. Differences from Rules

| | CLAUDE.md | .claude/rules/*.md |
|---|---|---|
| Load timing | Always at session start | When working on matching path files |
| Path restriction | Not available | `paths` frontmatter |
| Context cost | Always consumed | Only when needed |
| Suitable for | Project-wide rules | Language/domain-specific rules |

### 10.3. @import Syntax

Import other files from CLAUDE.md using `@filepath`. Recursive up to 5 hops deep.

```markdown
# MyProject Rules

## 1. Project

### 1.1. Architecture

See @docs/architecture.md for the project architecture.
See @docs/api-contract.md for the API contract.
```

## 11. Integrated Workflows

### 11.1. Full Flow for New Feature Development

#### Phase 1: Planning (`/planning`)

```
/planning Social Login (Apple, Google, Kakao)
```

1. **product-planner** - Write PRD (user stories, acceptance criteria, priorities)
2. **dev-planner** - Technical design (API interfaces, DB schema, task breakdown)
3. **ui-designer** - UI/UX design (screen flows, component specs)
4. **tech-writer** - Create tickets + wiki docs (Jira/Confluence MCP integration)
5. **Main session (CTO)** - Consolidate planning results, report to user

#### Phase 2: Development (`/develop`)

```
/develop PROJ-123
```

1. **Main session** - Task analysis (determine which developer agent to use)
2. **Main session** - Context gathering (Jira tickets, Confluence design docs, API specs)
3. **ios-developer + server-developer + infra-developer** - Parallel development (Agent Teams or worktree isolation)
4. **qa-engineer** - Write and run tests
5. **Main session** - Create PR (automatic if review passes)
6. **Main session (CTO)** - Consolidate development results, report to user

#### Phase 3: Review (`/review-all`)

```
/review-all
```

1. **6 reviewers** - Architecture + quality parallel review (2 per developer)
2. **security-auditor** - Security audit
3. **Main session (CTO)** - Final consolidation, merge decision, report to user

### 11.2. Code Review Flow

```
/review-all feature/social-login
```

```
Analyze changed files (git diff)
    │
    ├── *.swift changes → ios-reviewer-arch + ios-reviewer-quality (parallel)
    ├── *.kt changes   → server-reviewer-arch + server-reviewer-quality (parallel)
    ├── *.tf changes   → infra-reviewer-security + infra-reviewer-ops (parallel)
    │
    └── All            → security-auditor
    │
    ▼
Comprehensive report (classified by severity)
  🔴 Required fix → Recommend blocking merge
  🟡 Recommended  → Optional fix
  🟢 Informational → For reference
```

### 11.3. Release Flow

```
/release 1.0.0
```

1. **qa-engineer** - Run full test suite, check coverage
2. **security-auditor** - Final security audit, dependency vulnerability scan
3. **infra-developer** - Verify deployment scripts, validate rollback plan
4. **tech-writer** - Write CHANGELOG, generate release notes
5. **Main session** - Consolidate checklist, report go/no-go decision

### 11.4. Daily Standup

```
/standup
```

Automatically collects git logs, PR status, and CI results via dynamic context injection (`` !`command` ``) to generate a status report. Runs in isolation with `context: fork` to avoid polluting the main context.

## 12. Cost Optimization

### 12.1. Model Distribution Strategy

- **Opus** (expensive): Planning, development, security audit - only for tasks where accuracy and creativity matter
- **Sonnet** (affordable): Review, QA, documentation - Sonnet is sufficient for patterned tasks

### 12.2. Context Savings

- Load only necessary rules via `paths` matching in `~/.claude/rules/`
- Reviewers are read-only with `permissionMode: plan` - minimizes tool calls
- Isolated execution with `context: fork` skills - prevents main context pollution
- Subagent results are returned summarized - detailed results do not consume main context

### 12.3. Agent Teams vs Subagent Cost

- Agent Teams use **independent instances** so costs are high - use only for large-scale parallel tasks
- Single reviews, analysis, etc. are sufficient with **subagents** - cost-efficient

## 13. Usage Guide

### 13.1. Initial Setup

All settings are configured in `~/.claude/`. Ready to use immediately in any new project.

```bash
# Verify global configuration structure
ls ~/.claude/agents/     # 15 agent files
ls ~/.claude/skills/     # 5 skill directories
ls ~/.claude/rules/      # 10 rule files
ls ~/.claude/hooks/      # 3 hook scripts

# Verify hook script execution permissions
chmod +x ~/.claude/hooks/*.sh

# Install required tools
brew install swift-format swiftlint ktlint terraform gh
```

How to apply to a new project is as follows.

```bash
# 1. Create project
mkdir my-app && cd my-app
git init

# 2. Write CLAUDE.md
cat > CLAUDE.md << 'EOF'
# my-app Rules

iOS + Spring Boot project.

## 1. Project

### 1.1. Tech Stack

- iOS: Swift 6, SwiftUI, TCA, SPM
- Server: Spring Boot 3, Kotlin, PostgreSQL
- Infra: AWS, Terraform, GitHub Actions

### 1.2. Build

- iOS: cd ios && tuist generate && xcodebuild
- Server: cd server && ./gradlew build
- Infra: cd infra && terraform plan
EOF

# 3. Run Claude Code
claude
```

### 13.2. Using Agents

Claude Code automatically selects the appropriate agent based on the `description`. Simply make requests in natural language.

```bash
# Auto-invocation - Claude determines the appropriate agent
"Plan a social login feature"                → product-planner auto-invoked
"Implement the login API"                    → server-developer auto-invoked
"Review the current code"                    → review-all skill → reviewers invoked in parallel
"Create a login screen in the iOS app"       → ios-developer auto-invoked

# Explicit invocation - directly specify the agent
"Write a social login PRD with the product-planner agent"
"Audit the current code with security-auditor"
```

### 13.3. Using Skills

```bash
# Invoke via slash command
/planning Social login (Apple, Google, Kakao)
/develop Implement server social login API
/review-all
/release 1.0.0
/standup

# Natural language invocation (only for skills with disable-model-invocation set to false)
"Plan this feature"      → /planning auto-invoked
"Develop this"           → /develop auto-invoked
"Review this"            → /review-all auto-invoked
```

`/release` and `/standup` have `disable-model-invocation: true` and can only be invoked via slash commands.

### 13.4. Adding Custom Skills

Create `~/.claude/skills/{name}/SKILL.md` when a new workflow is needed.

```markdown
# ~/.claude/skills/hotfix/SKILL.md
---
name: hotfix
description: Emergency hotfix flow. Quickly executes bug analysis, fix, test, and deployment.
argument-hint: "[bug description or issue number]"
---

Proceed with an emergency hotfix.

## Current Status

!`git log --oneline -5`
!`git branch --show-current`

## Steps

### Step 1: Bug Analysis

Analyze the code to identify the root cause.

### Step 2: Fix (relevant *-developer agent)

Apply the minimum change to fix the issue.

### Step 3: Test (qa-engineer)

Run only the tests for the affected area.

### Step 4: Deploy (infra-developer)

Prepare the hotfix deployment.

Bug: $ARGUMENTS
```

### 13.5. Adding Custom Rules

```bash
# Add project rule (applies only to this project)
cat > .claude/rules/testing.md << 'EOF'
---
paths:
  - "**/*Test*.swift"
  - "**/*Test*.kt"
  - "**/test/**"
---

# Test Writing Rules

## 1. Structure

- Follow the Given-When-Then pattern
- Test naming: `test_scenario_expectedResult`

## 2. Principles

- Prefer real implementations over mocks
- Always include boundary values, null, and exceptions
EOF
```

### 13.6. Adding MCP Servers

Register using the `claude mcp add` CLI command. Writing directly to `.mcp.json` may cause servers to fail to load.

```bash
# Add a stdio server (global)
claude mcp add sentry -s user -e SENTRY_AUTH_TOKEN=xxx -- npx -y @sentry/mcp-server

# Add an HTTP server (global)
claude mcp add context7 -s user -t http https://mcp.context7.com/mcp

# Add with project scope
claude mcp add my-db -s project -- npx -y @my/db-mcp-server

# List registered servers
claude mcp list
```

Specifying `mcpServers` in the agent's frontmatter restricts access to only those servers.

```yaml
# ~/.claude/agents/server-developer.md
---
mcpServers:
  - github
  - postgres
  - context7
  - jira
  - confluence
---
# → This agent can only use github, postgres, context7, jira, and confluence MCP
# → Cannot access obsidian, etc.
```

# References

- <https://docs.anthropic.com/en/docs/claude-code>
