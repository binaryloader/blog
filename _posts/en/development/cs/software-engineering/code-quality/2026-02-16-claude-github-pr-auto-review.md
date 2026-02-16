---
title: "[Code Quality] Building Automated PR Code Review with Claude"
ref: claude-github-pr-auto-review
lang: en
permalink: /en/:categories/:title/
excerpt: "A story of building automated GitHub PR review with Claude Code Action for a side project."
date: 2026-02-16T01:00+09:00
last_modified_at: 2026-02-16T02:17+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/claude-github-pr-auto-review.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/claude-github-pr-auto-review.png"
categories:
  - Development
  - CS
  - Software-Engineering
  - Code-Quality
tags:
  - Development
  - GitHub
  - Claude
  - Code Review
  - GitHub Actions
  - CI/CD
  - Automation
depth:
  - title: "Development"
    url: /en/development/
  - title: "CS"
    url: /en/development/cs/
  - title: "Software Engineering"
    url: /en/development/cs/software-engineering/
  - title: "Code Quality"
    url: /en/development/cs/software-engineering/code-quality/
---

# Overview

A story of building automated GitHub PR review with Claude Code Action for a side project.

# Steps

## 1. Background

I'm working on a side project with my brother to develop an AI agent. Our first task is building a Python backend API, but since we both have full-time jobs, we can only work on weekends or after work.

### 1.1. The Problem

Code review was the bottleneck. We needed to review each other's PRs, but reviews were frequently delayed due to scheduling conflicts, urgent PRs sometimes got merged without review, and reviewing complex code took significant time.

There was a more fundamental issue. My brother works professionally in AI agent development and has extensive domain knowledge and experience, but I work in a different development field and lacked understanding of AI agent architecture and LLM best practices. When I reviewed his code, I could only check basic Python syntax and general code quality, and when he reviewed my code, he could provide deep insights but often didn't have time to do so properly.

"Why don't we let an LLM do this?"

## 2. Exploring Solutions

### 2.1. Considering CodeRabbit

Initially, I considered CodeRabbit, a well-known AI code review tool. However, the free plan only supported public repositories and our project used private repositories. The free version only provided PR summaries, and detailed inline code reviews were only available in paid plans. I was already subscribing to Claude Max and not even using all the monthly tokens, so paying separately for a premium plan seemed inefficient.

### 2.2. Choosing Claude Code Action

I discovered `claude-code-action`, officially provided by Anthropic. It operates as a GitHub Actions workflow and performs automated code reviews using Claude API or OAuth tokens. I could utilize my existing Claude Max subscription at no additional cost, it supported private repositories via OAuth token method, could use the latest high-performance model Claude Opus 4.6, and allowed prompt customization.

## 3. Implementation

### 3.1. Generating OAuth Token

Claude Pro/Max subscribers can use OAuth tokens instead of API keys.

```bash
claude setup-token
```

Important notes are as follows.

- Copy the token as a single line (authentication fails if line breaks are included)
- Register it in Organization Secrets with the name `CLAUDE_CODE_OAUTH_TOKEN`

### 3.2. Creating GitHub App

I created a GitHub App to use a custom bot name instead of the default `github-actions[bot]`. The configuration is as follows.

- App name: Desired bot name (e.g., `myteam-review`)
- Permissions:
  - Contents: Read and write
  - Pull requests: Read and write
  - Issues: Read and write
- After generating private key, register in Organization Secrets:
  - `REVIEW_APP_ID`: GitHub App ID
  - `REVIEW_APP_PRIVATE_KEY`: Full private key content (PEM format)

### 3.3. Writing Workflows

#### claude-review.yml

A workflow that automatically performs reviews when a PR is opened.

```yaml
name: Claude Auto Review
on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

jobs:
  review:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app-id: ${{ secrets.REVIEW_APP_ID }}
          private-key: ${{ secrets.REVIEW_APP_PRIVATE_KEY }}

      - name: Create tracking branch for fork PR
        if: github.event.pull_request.head.repo.fork == true
        run: |
          gh api repos/${{ github.repository }}/git/refs \
            -f ref="refs/heads/${{ github.event.pull_request.head.ref }}" \
            -f sha="${{ github.event.pull_request.head.sha }}"
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          github_token: ${{ steps.app-token.outputs.token }}
          track_progress: false
          prompt: |
            REPO: ${{ github.repository }}
            PR NUMBER: ${{ github.event.pull_request.number }}
            PR TITLE: ${{ github.event.pull_request.title }}

            Please review this PR and perform the following tasks:

            1. Update PR body (use `gh pr edit --body` to preserve existing content):
               Structure as follows:

               ## Information
               - Find issue reference in PR title and write as Related link

               ## Summary
               - Write PR changes as bullet points

               ## Diagram
               - Express main flow as Mermaid sequence diagram (omit if none)

               ## Review Feedback
               - General review feedback not related to specific code lines

            2. For code reviews, use inline comments directly on relevant code lines:
               - Code quality and best practices
               - Potential bugs or issues
               - Security concerns
               - Performance considerations
               - Don't comment on code with no issues

          claude_args: |
            --model claude-opus-4-6
            --system-prompt "Write all responses and comments in English."

      - name: Cleanup tracking branch for fork PR
        if: always() && github.event.pull_request.head.repo.fork == true
        continue-on-error: true
        run: |
          gh api repos/${{ github.repository }}/git/refs/heads/${{ github.event.pull_request.head.ref }} -X DELETE
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}
```

#### claude.yml

A workflow that responds interactively when `@claude` is mentioned in comments.

```yaml
name: Claude Assistant
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  claude-response:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app-id: ${{ secrets.REVIEW_APP_ID }}
          private-key: ${{ secrets.REVIEW_APP_PRIVATE_KEY }}

      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          github_token: ${{ steps.app-token.outputs.token }}
          claude_args: |
            --model claude-opus-4-6
            --system-prompt "Write all responses and comments in English."
```

### 3.4. Supporting fork-based Git Flow

We use a Git Flow where each of us forks the repository and submits PRs, but initially the workflow wasn't triggered on fork PRs. We solved this as follows:

- Enable fork PR workflow permissions in Organization settings:
  - "Send write tokens to workflows from fork pull requests"
  - "Send secrets to workflows from fork pull requests"
- Apply a workaround that temporarily creates the fork PR's branch on the base repository and deletes it afterward

## 4. Results

### 4.1. Automatic PR Body Updates

![PR Body Example]({{site.baseurl}}/assets/image/post/development/cs/software-engineering/code-quality/claude-github-pr-auto-review/pr-body-example.png){: style="max-width: min(800px, 100%);"}

When a PR is opened, Claude automatically adds related issue links, summarizes changes as bullet points, visualizes main flow as a Mermaid sequence diagram, and provides overall architecture and design feedback.

### 4.2. Inline Code Review

![Inline Review Example]({{site.baseurl}}/assets/image/post/development/cs/software-engineering/code-quality/claude-github-pr-auto-review/inline-review-example.png){: style="max-width: min(800px, 100%);"}

For specific code lines, it points out potential bugs, suggests improvements with code examples, and explains problem causes and solutions in detail.

### 4.3. @claude Mentions

You can ask additional questions anytime by mentioning `@claude` in PR comments. Questions like "Recommend refactoring approach for this part", "What's the time complexity of this function?", or "Any security issues?" get answered in real-time.

## 5. Impact

### 5.1. Quantitative Impact

| Metric | Before | After |
|---|---|---|
| Review Wait Time | Average 1-2 days | Average 5 minutes |
| Review Coverage | ~60% | 100% |
| Additional Cost | - | $0 |

### 5.2. Qualitative Impact

Code quality improved. We discovered edge cases and potential bugs we hadn't thought of and learned Python best practices. Domain knowledge gaps were bridged. Even without familiarity with AI agent development, Claude's detailed reviews helped identify domain-specific issues, and basic code quality issues that domain experts might miss were automatically checked. Documentation was automated. PR bodies automatically generated summaries and diagrams, making history tracking easier. Psychological burden decreased. The pressure of "I need to review..." diminished, and we could quickly approve based on Claude's reviews.

## 6. Limitations

### 6.1. Don't Trust Blindly

Claude can be wrong. It may not know project-specific context, fail to reflect latest library API changes, or misunderstand business logic intent. Final judgment must always be made by humans.

### 6.2. Prompt Tuning Required

Initially all reviews came as comments making PRs messy. After continuous prompt modifications, we separated general feedback into PR body and only code-line-specific issues as inline comments, which took several trial and error attempts.

### 6.3. fork PR Issues

If using fork-based Git Flow, Organization settings and workflow workarounds are needed. This wasn't clearly documented and required some trial and error.

## 7. Conclusion

The excuse "quality suffers because there's no time for code reviews" no longer works. With Claude-powered automated code reviews, we can merge PRs faster, maintain higher code quality, and respect each other's time while progressing the project.

Especially if you're already subscribing to Claude Max, it's immediately applicable at no additional cost. Highly recommended for weekend projects and startup teams.

# References

- <https://github.com/anthropics/claude-code-action>
- <https://github.com/anthropics/claude-code-action/issues/821>
- <https://github.com/actions/create-github-app-token>
