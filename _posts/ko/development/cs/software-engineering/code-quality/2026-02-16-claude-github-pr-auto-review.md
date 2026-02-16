---
title: "[Code Quality] Claude를 활용한 PR 자동 코드 리뷰 구축기"
ref: claude-github-pr-auto-review
excerpt: "사이드 프로젝트에서 Claude Code Action으로 GitHub PR 자동 리뷰를 구축한 경험을 정리한다."
date: 2026-02-16T01:00+09:00
last_modified_at: 2026-02-16T19:16+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/claude-github-pr-auto-review.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/claude-github-pr-auto-review.png"
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
    url: /ko/development/
  - title: "CS"
    url: /ko/development/cs/
  - title: "Software Engineering"
    url: /ko/development/cs/software-engineering/
  - title: "Code Quality"
    url: /ko/development/cs/software-engineering/code-quality/
---

# 개요

사이드 프로젝트에서 Claude Code Action으로 GitHub PR 자동 리뷰를 구축한 경험을 정리한다.

# 정리

## 1. 배경

동생과 함께 AI 에이전트를 개발하는 사이드 프로젝트를 진행하고 있다. 첫 번째 작업으로 Python 백엔드 API를 구축 중인데 둘 다 회사를 다니다 보니 주말이나 퇴근 후 시간을 내서 작업하는 상황이다.

### 1.1. 문제 상황

코드 리뷰가 병목이었다. 서로의 PR을 리뷰해야 하는데 시간이 맞지 않아 리뷰가 늦어지는 경우가 빈번했고 급한 PR은 리뷰 없이 머지하기도 했으며 복잡한 코드는 리뷰하는 데만 상당한 시간이 소요되었다.

더 근본적인 문제도 있었다. 동생은 AI 에이전트 개발이 현업이라 관련 도메인 지식과 경험이 풍부하지만 나는 다른 개발 분야에서 일하다 보니 AI 에이전트 아키텍처나 LLM 관련 베스트 프랙티스에 대한 이해가 부족했다. 내가 동생 코드를 리뷰할 때는 기본적인 Python 문법이나 일반적인 코드 품질 정도만 확인 가능했고 동생이 내 코드를 리뷰할 때는 깊이 있게 봐줄 수 있지만 시간이 없어 제대로 못 보는 경우가 많았다.

"이거 LLM한테 시키면 안 될까?"

## 2. 해결책 탐색

### 2.1. CodeRabbit 검토

처음엔 AI 코드 리뷰 도구로 유명한 CodeRabbit을 고려했다. 하지만 무료 플랜은 Public 저장소만 지원했고 우리 프로젝트는 Private 저장소를 사용 중이었다. 무료 버전에서는 PR 요약 정도만 제공되고 상세한 인라인 코드 리뷰는 유료 플랜에서만 가능했다. 이미 Claude Max 플랜을 구독하고 있었고 매달 토큰을 다 쓰지도 못하는 상황에서 별도로 유료 플랜을 결제하는 건 비효율적이었다.

### 2.2. Claude Code Action 선택

Anthropic에서 공식 제공하는 `claude-code-action`을 발견했다. GitHub Actions 워크플로우로 동작하며 Claude API나 OAuth 토큰을 사용해 자동 코드 리뷰를 수행한다. 이미 구독 중인 Claude Max를 활용하면 추가 비용이 들지 않고 Private 저장소도 OAuth 토큰 방식으로 지원되며 최신 고성능 모델인 Claude Opus 4.6을 사용할 수 있고 프롬프트도 원하는 대로 커스터마이징 가능했다.

## 3. 구현

### 3.1. OAuth 토큰 생성

Claude Pro/Max 구독자는 API 키 대신 OAuth 토큰을 사용할 수 있다.

```bash
claude setup-token
```

주의사항은 아래와 같다.

- 토큰은 반드시 한 줄로 복사한다 (줄바꿈 포함 시 인증 실패)
- Organization Secrets에 `CLAUDE_CODE_OAUTH_TOKEN` 이름으로 등록한다

### 3.2. GitHub App 생성

기본 `github-actions[bot]` 대신 커스텀 봇 이름을 사용하기 위해 GitHub App을 생성했다. 설정은 아래와 같다.

- App name: 원하는 봇 이름 (예: `myteam-review`)
- Permissions:
  - Contents: Read and write
  - Pull requests: Read and write
  - Issues: Read and write
- Private key 생성 후 Organization Secrets 등록:
  - `REVIEW_APP_ID`: GitHub App ID
  - `REVIEW_APP_PRIVATE_KEY`: Private key 전체 내용 (PEM 형식)

### 3.3. 워크플로우 작성

#### claude-review.yml

PR이 열리면 자동으로 리뷰를 수행하는 워크플로우다.

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

            이 PR을 리뷰하고 다음 작업을 수행해주세요:

            1. PR 본문 업데이트 (`gh pr edit --body`로 기존 본문을 유지하면서 추가):
               다음과 같은 구조로 작성해주세요:

               ## 정보
               - PR 타이틀에서 이슈 참조를 찾아 Related 링크로 작성 (이미 있으면 중복 추가하지 마세요)

               ## 요약
               - PR 변경 사항을 bullet point로 작성

               ## 다이어그램
               - 주요 흐름이 있다면 Mermaid 시퀀스 다이어그램으로 표현 (없으면 이 섹션 생략)

               ## 리뷰 피드백
               - 특정 코드 라인과 관련 없는 일반적인 리뷰 피드백 (아키텍처, 설계 방향, 전반적인 개선 사항 등)

            2. 코드 리뷰는 `mcp__github_inline_comment__create_inline_comment`를 사용하여 해당 코드 라인에 직접 달아주세요:
               - 코드 품질 및 모범 사례
               - 잠재적 버그 또는 이슈
               - 보안 관련 사항
               - 성능 고려 사항
               - 문제가 없는 코드에는 코멘트를 달지 마세요
               - 특정 코드 라인에 해당하지 않는 피드백은 인라인 코멘트가 아닌 PR 본문에 작성하세요

          claude_args: |
            --model claude-opus-4-6
            --system-prompt "모든 응답과 코멘트는 한국어로 작성해주세요."
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

코멘트에 트리거 문구를 멘션하면 인터랙티브하게 응답하는 워크플로우다.

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
            --system-prompt "모든 응답과 코멘트는 한국어로 작성해주세요. 진행 상황 체크리스트나 단계 목록을 작성하지 마세요. 답변 내용만 작성하세요. 답변 시작은 반드시 질문자를 태깅하고 개행한 후 답변을 작성하세요. 예: @username님,\n\n답변 내용"

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

### 3.4. fork 기반 Git Flow 대응

우리는 각자 fork한 저장소에서 PR을 올리는 Git Flow를 사용하는데 초기에는 fork PR에서 워크플로우가 트리거되지 않았다. 우리는 아래와 같이 해결했다.

- Organization 설정에서 fork PR 워크플로우 권한 활성화:
  - "Send write tokens to workflows from fork pull requests"
  - "Send secrets to workflows from fork pull requests"
- fork PR의 브랜치를 base 저장소에 임시로 생성했다가 삭제하는 workaround 적용

### 3.5. UX 개선

#### 커스텀 트리거 문구

기본 트리거는 `@claude`인데 GitHub Organization 팀을 활용해 커스텀 트리거로 변경했다. GitHub Team 유료 플랜은 시트당 비용을 지불하는데 이미 사용 중이라면 Organization 팀 기능을 활용할 수 있다. `review`라는 팀을 생성하면 `@myteam/review`로 멘션할 때 자동완성이 지원되어 입력이 편리하다. `trigger_phrase` 파라미터로 트리거 문구를 지정하고 `if` 조건에서 `contains()`로 해당 문구가 포함된 이벤트만 필터링한다.

#### 리액션

워크플로우가 트리거되면 해당 코멘트에 👀 이모지 리액션을 추가한다. Claude가 응답을 생성하는 동안 요청이 접수되었다는 것을 시각적으로 보여준다.

#### 응답 정리

claude-code-action은 tag 모드에서 응답 완료 시 "Claude finished @user's task in Xs"라는 헤더와 구분선, 체크리스트, "View job" 링크를 자동으로 추가한다. 이런 UI 요소가 응답 내용과 섞이면 가독성이 떨어지므로 완료 후 Python regex로 파싱하여 불필요한 부분을 제거하는 cleanup 단계를 추가했다.

#### 질문자 태깅

시스템 프롬프트에서 응답 시작 시 질문자를 `@username님,` 형식으로 태깅하도록 지시했다. 이렇게 하면 질문자가 GitHub 알림을 받을 수 있고 누구에게 답변하는 것인지 명확해진다.

## 4. 결과

### 4.1. PR 본문 자동 업데이트

![PR 본문 예시]({{site.baseurl}}/assets/image/post/development/cs/software-engineering/code-quality/claude-github-pr-auto-review/pr-body-example.png){: style="max-width: min(800px, 100%);"}

PR이 열리면 Claude가 자동으로 관련 이슈 링크를 추가하고 변경 사항을 bullet point로 요약하며 Mermaid 시퀀스 다이어그램으로 주요 흐름을 시각화하고 전반적인 아키텍처와 설계에 대한 피드백을 제공한다.

### 4.2. 인라인 코드 리뷰

![인라인 리뷰 예시]({{site.baseurl}}/assets/image/post/development/cs/software-engineering/code-quality/claude-github-pr-auto-review/inline-review-example.png){: style="max-width: min(800px, 100%);"}

특정 코드 라인에 대해 잠재적 버그를 지적하고 코드 예시와 함께 개선 방안을 제시하며 문제 원인과 해결 방법을 상세히 설명한다.

### 4.3. @myteam/review 멘션

![멘션 예시]({{site.baseurl}}/assets/image/post/development/cs/software-engineering/code-quality/claude-github-pr-auto-review/mention-example.png){: style="max-width: min(800px, 100%);"}

PR 코멘트에 `@myteam/review`를 멘션하면 👀 리액션이 달리고 Claude가 응답을 생성한다. 응답은 질문자를 태깅하면서 시작되고 "Claude finished" 헤더 같은 불필요한 UI 요소는 자동으로 제거된다. "이 부분 리팩토링 방법 추천해줘", "이 함수의 시간 복잡도는?", "보안 이슈 없을까?" 같은 질문에 실시간으로 답변을 받을 수 있다.

## 5. 효과

### 5.1. 정량적 효과

| 지표 | Before | After |
|---|---|---|
| 리뷰 대기 시간 | 평균 1~2일 | 평균 5분 |
| 리뷰 커버리지 | ~60% | 100% |
| 추가 비용 | - | 0원 |

### 5.2. 정성적 효과

코드 품질이 개선되었다. 미처 생각하지 못한 엣지 케이스나 잠재적 버그를 발견하고 Python 베스트 프랙티스를 학습할 수 있었다. 도메인 지식 격차도 해소되었다. 나처럼 AI 에이전트 개발에 익숙하지 않아도 Claude의 상세한 리뷰를 통해 도메인 특화 이슈를 파악할 수 있고 현업 전문가가 놓칠 수 있는 기본적인 코드 품질 이슈도 자동으로 체크된다. 문서화도 자동화되었다. PR 본문에 자동으로 요약과 다이어그램이 생성되어 히스토리 추적이 용이해졌다. 심리적 부담도 감소했다. "리뷰해야 하는데..."하는 부담이 줄어들었고 Claude 리뷰를 기반으로 빠르게 승인할 수 있게 되었다.

## 6. 한계점

### 6.1. 맹목적으로 신뢰하면 안 됨

Claude도 틀릴 수 있다. 프로젝트 특수한 컨텍스트를 모르거나 최신 라이브러리 API 변경사항을 반영하지 못할 때가 있고 비즈니스 로직의 의도를 오해하기도 한다. 최종 판단은 항상 사람이 해야 한다.

### 6.2. 프롬프트 튜닝 필요

처음엔 모든 리뷰가 코멘트로 달려서 PR이 지저분했다. 프롬프트를 계속 수정하면서 일반적인 피드백은 PR 본문에, 코드 라인별 구체적인 이슈만 인라인 코멘트로 분리하는 데 여러 번의 시행착오가 있었다.

### 6.3. fork PR 이슈

fork 기반 Git Flow를 쓴다면 Organization 설정과 워크플로우 workaround가 필요하다. 이 부분은 공식 문서에 명확히 나와 있지 않아서 삽질을 좀 했다.

## 7. 마치며

"코드 리뷰할 시간이 없어서 품질이 떨어진다"는 핑계는 이제 통하지 않는다. Claude를 활용한 자동 코드 리뷰로 더 빠르게 PR을 머지하고 더 높은 코드 품질을 유지하며 서로의 시간을 존중하면서 프로젝트를 진행할 수 있게 되었다.

특히 이미 Claude Max를 구독하고 있다면 추가 비용 없이 바로 적용 가능하다. 주말 프로젝트나 스타트업 팀에게 강력히 추천한다.

# 참고

- <https://github.com/anthropics/claude-code-action>
- <https://github.com/anthropics/claude-code-action/issues/821>
- <https://github.com/actions/create-github-app-token>
