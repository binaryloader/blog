---
title: "[Code Quality] Building Automated PR Code Review with Claude"
ref: claude-github-pr-auto-review
lang: en
permalink: /en/:categories/:title/
excerpt: "A story of building automated GitHub PR review with Claude Code Action for a side project."
date: 2026-02-16T01:00+09:00
last_modified_at: 2026-02-16T19:16+09:00
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
      actions: read
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app-id: ${{ secrets.REVIEW_APP_ID }}
          private-key: ${{ secrets.REVIEW_APP_PRIVATE_KEY }}

      - name: Add eyes reaction to PR
        run: |
          gh api repos/${{ github.repository }}/issues/${{ github.event.pull_request.number }}/reactions \
            -f content=eyes
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - name: Create or update tracking branch for fork PR
        if: github.event.pull_request.head.repo.fork == true
        run: |
          gh api repos/${{ github.repository }}/git/refs \
            -f ref="refs/heads/${{ github.event.pull_request.head.ref }}" \
            -f sha="${{ github.event.pull_request.head.sha }}" 2>/dev/null || \
          gh api repos/${{ github.repository }}/git/refs/heads/${{ github.event.pull_request.head.ref }} \
            -X PATCH -f sha="${{ github.event.pull_request.head.sha }}" -F force=true
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

            Review this PR and perform the following tasks:

            1. Update PR body (use `gh pr edit --body` to preserve existing content):
               Structure as follows:

               ## Information
               - Find issue references in PR title and write as Related links (don't add duplicates)

               ## Summary
               - Write PR changes as bullet points

               ## Diagram
               - Express main flow as Mermaid sequence diagram (omit if none)

               ## Review Feedback
               - General review feedback not related to specific code lines (architecture, design direction, overall improvements, etc.)

            2. For code reviews, use `mcp__github_inline_comment__create_inline_comment` to add comments directly on relevant code lines:
               - Code quality and best practices
               - Potential bugs or issues
               - Security concerns
               - Performance considerations
               - Don't comment on code with no issues
               - Write feedback not specific to code lines in the PR body, not as inline comments

          claude_args: |
            --model claude-opus-4-6
            --system-prompt "Write all responses and comments in Korean."
            --allowedTools "mcp__github_inline_comment__create_inline_comment,Bash(gh pr comment:*),Bash(gh pr diff:*),Bash(gh pr view:*),Bash(gh pr edit:*)"

      - name: Cleanup tracking branch for fork PR
        if: always() && github.event.pull_request.head.repo.fork == true
        continue-on-error: true
        run: |
          gh api repos/${{ github.repository }}/git/refs/heads/${{ github.event.pull_request.head.ref }} -X DELETE
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}
```

#### claude.yml

A workflow that responds interactively when a trigger phrase is mentioned in comments.

```yaml
name: Claude Assistant
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  pull_request_review:
    types: [submitted]

jobs:
  claude-response:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@myteam/review')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@myteam/review')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@myteam/review'))
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - uses: actions/create-github-app-token@v1
        id: app-token
        with:
          app-id: ${{ secrets.REVIEW_APP_ID }}
          private-key: ${{ secrets.REVIEW_APP_PRIVATE_KEY }}

      - name: Add eyes reaction
        run: |
          if [ "${{ github.event_name }}" = "issue_comment" ]; then
            gh api repos/${{ github.repository }}/issues/comments/${{ github.event.comment.id }}/reactions \
              -f content=eyes
          elif [ "${{ github.event_name }}" = "pull_request_review_comment" ]; then
            gh api repos/${{ github.repository }}/pulls/comments/${{ github.event.comment.id }}/reactions \
              -f content=eyes
          elif [ "${{ github.event_name }}" = "pull_request_review" ]; then
            gh api repos/${{ github.repository }}/issues/${{ github.event.pull_request.number }}/reactions \
              -f content=eyes
          fi
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - name: Get fork PR info
        id: fork-check
        run: |
          if [ "${{ github.event_name }}" = "issue_comment" ]; then
            PR_NUMBER="${{ github.event.issue.number }}"
            PR_DATA=$(gh api repos/${{ github.repository }}/pulls/$PR_NUMBER 2>/dev/null) || {
              echo "is_fork=false" >> $GITHUB_OUTPUT
              exit 0
            }
          elif [ "${{ github.event_name }}" = "pull_request_review_comment" ] || [ "${{ github.event_name }}" = "pull_request_review" ]; then
            PR_NUMBER="${{ github.event.pull_request.number }}"
            PR_DATA=$(gh api repos/${{ github.repository }}/pulls/$PR_NUMBER)
          else
            echo "is_fork=false" >> $GITHUB_OUTPUT
            exit 0
          fi
          IS_FORK=$(echo "$PR_DATA" | jq -r '.head.repo.fork')
          HEAD_REF=$(echo "$PR_DATA" | jq -r '.head.ref')
          HEAD_SHA=$(echo "$PR_DATA" | jq -r '.head.sha')
          echo "is_fork=$IS_FORK" >> $GITHUB_OUTPUT
          echo "head_ref=$HEAD_REF" >> $GITHUB_OUTPUT
          echo "head_sha=$HEAD_SHA" >> $GITHUB_OUTPUT
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - name: Create or update tracking branch for fork PR
        if: steps.fork-check.outputs.is_fork == 'true'
        run: |
          gh api repos/${{ github.repository }}/git/refs \
            -f ref="refs/heads/${{ steps.fork-check.outputs.head_ref }}" \
            -f sha="${{ steps.fork-check.outputs.head_sha }}" 2>/dev/null || \
          gh api repos/${{ github.repository }}/git/refs/heads/${{ steps.fork-check.outputs.head_ref }} \
            -X PATCH -f sha="${{ steps.fork-check.outputs.head_sha }}" -F force=true
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          github_token: ${{ steps.app-token.outputs.token }}
          trigger_phrase: "@myteam/review"
          claude_args: |
            --model claude-opus-4-6
            --system-prompt "Write all responses and comments in Korean. Do not create progress checklists or step lists. Write only the answer content. Always start your response by tagging the questioner with a newline before writing the answer. Example: @username,\n\nAnswer content"

      - name: Cleanup comment
        if: success()
        run: |
          NUMBER="${{ github.event.issue.number || github.event.pull_request.number }}"
          COMMENT=$(gh api "repos/${{ github.repository }}/issues/${NUMBER}/comments?per_page=100" \
            --jq '[.[] | select(.body | test("\\*\\*Claude finished"))] | last')
          COMMENT_ID=$(echo "$COMMENT" | jq -r '.id // empty')
          ENDPOINT="issues/comments"
          if [ -z "$COMMENT_ID" ]; then
            COMMENT=$(gh api "repos/${{ github.repository }}/pulls/${NUMBER}/comments?per_page=100" \
              --jq '[.[] | select(.body | test("\\*\\*Claude finished"))] | last')
            COMMENT_ID=$(echo "$COMMENT" | jq -r '.id // empty')
            ENDPOINT="pulls/comments"
          fi
          if [ -z "$COMMENT_ID" ]; then
            echo "No Claude comment found"
            exit 0
          fi
          export BODY
          BODY=$(echo "$COMMENT" | jq -r '.body')
          CLEANED=$(python3 << 'PYEOF'
          import os, re
          body = os.environ.get('BODY', '')
          body = re.sub(r'\*\*Claude finished.*?\n', '', body)
          body = re.sub(r'^---\s*\n', '', body.strip())
          body = re.sub(r'^(- \[[ x]\] .+\n)+', '', body.strip())
          body = re.sub(r'\[View job\s*(?:run)?\]\(https?://[^\)]+\)\s*', '', body)
          print(body.strip())
          PYEOF
          )
          gh api "repos/${{ github.repository }}/${ENDPOINT}/${COMMENT_ID}" \
            -X PATCH -f body="$CLEANED"
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}

      - name: Cleanup tracking branch for fork PR
        if: always() && steps.fork-check.outputs.is_fork == 'true'
        continue-on-error: true
        run: |
          gh api repos/${{ github.repository }}/git/refs/heads/${{ steps.fork-check.outputs.head_ref }} -X DELETE
        env:
          GH_TOKEN: ${{ steps.app-token.outputs.token }}
```

### 3.4. Supporting fork-based Git Flow

We use a Git Flow where each of us forks the repository and submits PRs, but initially the workflow wasn't triggered on fork PRs. We solved this as follows.

- Enable fork PR workflow permissions in Organization settings:
  - "Send write tokens to workflows from fork pull requests"
  - "Send secrets to workflows from fork pull requests"
- Apply a workaround that temporarily creates the fork PR's branch on the base repository and deletes it afterward

### 3.5. UX Improvements

#### Custom Trigger Phrase

The default trigger is `@claude`, but we changed it to a custom trigger using a GitHub Organization team. Since we were already on GitHub's Team paid plan with per-seat billing, we could leverage the Organization team feature. By creating a team called `review` in the Organization, mentioning `@myteam/review` gets autocomplete support for convenient input. The `trigger_phrase` parameter specifies the trigger phrase, and the `if` condition uses `contains()` to filter events containing that phrase.

#### Reaction

When a workflow is triggered, a 👀 emoji reaction is added to the comment. This visually indicates that the request has been received while Claude generates a response.

#### Response Cleanup

claude-code-action automatically appends a "Claude finished @user's task in Xs" header, separator, checklist, and "View job" link when completing in tag mode. Since these UI elements mixed with the response content reduce readability, we added a cleanup step that uses Python regex to parse and remove unnecessary parts after completion.

#### Questioner Tagging

The system prompt instructs the response to start by tagging the questioner in the format `@username,`. This allows the questioner to receive GitHub notifications and makes it clear who the response is directed to.

## 4. Results

### 4.1. Automatic PR Body Updates

![PR Body Example]({{site.baseurl}}/assets/image/post/development/cs/software-engineering/code-quality/claude-github-pr-auto-review/pr-body-example.png){: style="max-width: min(800px, 100%);"}

When a PR is opened, Claude automatically adds related issue links, summarizes changes as bullet points, visualizes main flow as a Mermaid sequence diagram, and provides overall architecture and design feedback.

### 4.2. Inline Code Review

![Inline Review Example]({{site.baseurl}}/assets/image/post/development/cs/software-engineering/code-quality/claude-github-pr-auto-review/inline-review-example.png){: style="max-width: min(800px, 100%);"}

For specific code lines, it points out potential bugs, suggests improvements with code examples, and explains problem causes and solutions in detail.

### 4.3. @myteam/review Mentions

![Mention Example]({{site.baseurl}}/assets/image/post/development/cs/software-engineering/code-quality/claude-github-pr-auto-review/mention-example.png){: style="max-width: min(800px, 100%);"}

When `@myteam/review` is mentioned in a PR comment, a 👀 reaction is added and Claude generates a response. The response starts by tagging the questioner, and unnecessary UI elements like the "Claude finished" header are automatically removed. Questions like "Recommend a refactoring approach for this part", "What's the time complexity of this function?", or "Any security issues?" get answered in real-time.

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
