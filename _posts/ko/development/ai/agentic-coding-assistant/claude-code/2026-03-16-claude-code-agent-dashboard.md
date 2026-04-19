---
title: "[Claude Code] 실시간 에이전트 대시보드 만들기"
ref: claude-code-agent-dashboard
excerpt: "19명의 Claude Code 서브에이전트가 무엇을 하고 있는지 실시간으로 보여주는 모니터링 대시보드를 만든 과정 - Gather Town 실험 실패부터 WebSocket 기반 컨트롤 센터까지."
date: 2026-03-16T01:00+09:00
last_modified_at: 2026-03-16T01:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/claude-code-agent-dashboard.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/claude-code-agent-dashboard.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Claude-Code
tags:
  - Claude Code
  - Dashboard
  - WebSocket
  - Agentic Coding
depth:
  - title: "Development"
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "Agentic Coding Assistant"
    url: /ko/development/ai/agentic-coding-assistant/
  - title: "Claude Code"
    url: /ko/development/ai/agentic-coding-assistant/claude-code/
---

# 개요

19명의 Claude Code 서브에이전트가 무엇을 하고 있는지 실시간으로 보여주는 모니터링 대시보드를 만든 과정 - Gather Town 실험 실패부터 WebSocket 기반 컨트롤 센터까지.

이 글은 [[Claude Code] Subagent로 전문가 팀 설계하기](/ko/development/ai/agentic-coding-assistant/claude-code/claude-code-sub-agent-team-design/)의 후속편이다. 이전 글에서 15명의 AI 에이전트 팀을 설계했다. 그 이후 도메인별 전담 리뷰어를 추가하고 인프라 역할을 분리하여 19명으로 확장했다. Claude Code의 서브에이전트 시스템으로 오케스트레이션하고 스킬과 훅을 연결하는 것까지 완료했다. 하지만 핵심적인 문제 하나가 남아 있었다. 19명의 에이전트가 동시에 일할 때 실제로 무슨 일이 벌어지고 있는지 어떻게 알 수 있을까?

# 정리

## 1. 문제 - 19명의 에이전트를 눈 감고 운영하기

Claude Code 세션 하나를 쓰는 건 괜찮다. 출력이 스크롤되고 도구 호출을 읽고 승인하거나 거절하면 된다. 그런데 서브에이전트를 병렬로 오케스트레이션하기 시작하면 그 단순함이 사라진다.

COO 윤시현님(메인 세션)이 3명의 기획자에게 동시에 작업을 맡긴다. 기획이 끝나면 개발자 2명이 투입된다. 그 다음 리뷰어 4명이 병렬로 실행된다. 보안 감사자가 QA 엔지니어와 함께 돌아간다. 이 모든 게 Claude Code의 훅 시스템을 통해 일어나는데 에이전트가 시작되고 종료되고 도구를 사용하고 작업을 완료할 때마다 HTTP 이벤트가 발생한다.

그런데 사용자 입장에서는? 터미널 하나만 보인다. COO가 단계가 끝날 때마다 요약을 보고하긴 하지만 보고 사이에는 완전히 깜깜하다. 지금 어떤 에이전트가 작업 중인지 알 수 없다. 어떤 에이전트가 10분째 멈춰 있는 건지 곧 끝나려는 건지 구분이 안 된다. 보안 감사자가 치명적인 취약점을 발견해도 전체 단계가 끝나고 COO가 보고할 때까지 알 수 없다.

19명의 에이전트와 다단계 파이프라인을 돌리면서 이건 더 이상 감당할 수 없었다. 가시성이 필요했다.

## 2. 첫 번째 시도 - Gather Town 스타일 2D 오피스

첫 번째 아이디어는 야심 찼다. 아마 너무 야심 찼다. Gather Town 스타일의 2D 가상 오피스를 만들고 싶었다. 각 에이전트에게 책상을 주고 픽셀 아트 스프라이트로 돌아다니게 하고 성격에 따른 대기 행동을 구현하는 것이었다. 제품 기획자 김소연님은 카페테리아에서 수다를 떠는 사교적인 캐릭터로 설정했다. 백엔드 개발자 박도현님은 자리에서 간식을 먹는다. COO 캐릭터가 CEO 사무실로 걸어가서 보고하고 에이전트들이 COO 자리 앞에 줄을 서고 작업을 마친 에이전트는 컨페티 파티클로 축하하는 식이었다.

실제로 이걸 만들었다. 초기 버전의 README에 전체 내용이 설명되어 있다. 개발팀, 기획팀, QA & 보안팀, 리뷰팀 팀존. 쉬는 에이전트가 커피를 가지러 가는 카페테리아. 레벨업 시스템과 책상 꾸미기. Open-Meteo API로 실제 날씨를 동기화하는 기능. 아침 따뜻함에서 야간 작업 모드까지 바뀌는 시간대별 조명. Google Gemini나 Chirp 음성으로 COO가 요약을 읽어주는 TTS 보고. "격려하기" 버튼을 누르면 에이전트에게 하트 파티클을 보내서 애니메이션 속도를 높이는 기능까지.

진짜 재미있었다. 픽셀 아트 에이전트가 카페테리아로 걸어가고 에러에서 머리를 긁적거리고 긴 작업을 완료한 뒤 하이파이브하는 걸 보는 건 혼자 개발할 때 의외로 큰 즐거움이었다.

하지만 비실용적이기도 했다. 2D 오피스가 시각적으로 매력적이긴 했지만 정작 가장 필요한 정보를 가렸다. 지금 어떤 에이전트가 활성 상태인지, 무슨 작업을 하고 있는지, 얼마나 오래 돌아가고 있는지, 실패한 건 없는지. 픽셀 아트 스프라이트와 걸어다니는 애니메이션이 개발 시간과 화면 공간을 잡아먹었지만 상황 인식 능력은 전혀 개선하지 못했다. 재미 요소들은 모니터링 도구로서 명확성을 우선해야 하는 것에 대한 즐거운 방해물이었다.

그래서 방향을 전환했다. 서버와 WebSocket 인프라 그리고 훅 연동은 그대로 유지했다. 아키텍처의 핵심은 탄탄했으니까. 대신 2D 오피스 클라이언트를 한 가지 목적에 충실한 대시보드로 교체했다. 에이전트 활동을 한눈에 볼 수 있게 만드는 것이 목표였다.

## 3. 대시보드 아키텍처

프로젝트는 pnpm workspace 모노레포로 3개 패키지를 사용한다.

```
claude-code-agent-dashboard/
  packages/
    shared/     # 타입, 상수, 에이전트 정의
    server/     # Hono HTTP 서버 + WebSocket 브로드캐스터
    client/     # React 19 SPA (Vite + Tailwind CSS 4 + zustand)
```

기술 스택은 의도적으로 단순하게 구성했다. Hono가 REST API와 WebSocket 업그레이드를 단일 포트(3100)에서 처리한다. 클라이언트는 React 19 + Vite + Tailwind CSS 4 SPA에 zustand로 상태를 관리한다. shared 패키지에는 TypeScript 타입과 에이전트 정의 레지스트리가 들어있는데 COO를 포함한 19명의 에이전트에 대한 단일 진실 공급원(single source of truth)이다.

### 3.1. 데이터 흐름

핵심 아키텍처는 단방향 이벤트 파이프라인이다.

```
┌──────────────────┐     HTTP POST     ┌──────────────────┐
│ Claude Code      │──────────────────▶│                  │
│ (Hooks)          │                   │  Hono Server     │
├──────────────────┤     HTTP POST     │  (:3100)         │
│ COO              │──────────────────▶│                  │
│ (task-assign)    │                   │  ┌────────────┐  │
└──────────────────┘                   │  │Agent Store │  │
                                       │  └─────┬──────┘  │
┌──────────────────┐    WebSocket      │        │         │
│ Browser          │◀──────────────────│  State Change    │
│ Dashboard        │                   │                  │
│                  │──REST (init)─────▶│                  │
└──────────────────┘                   └──────────────────┘
```

Claude Code가 훅 이벤트(SubagentStart, SubagentStop, PreToolUse, PostToolUse 등)를 HTTP POST로 `http://localhost:3100/api/v1/events`에 보낸다. 서버가 각 이벤트를 처리하고 인메모리 에이전트 스토어를 업데이트한 뒤 WebSocket으로 연결된 모든 브라우저 클라이언트에 상태 변경을 브로드캐스트한다. 브라우저도 초기 로드 시 REST 호출로 전체 상태를 가져온다.

### 3.2. 왜 Polling이 아닌가

WebSocket이 당연한 선택이었다. 훅 이벤트는 빠르게 발생한다. 에이전트 세션 하나가 분당 수십 개의 PreToolUse/PostToolUse 이벤트를 생성할 수 있다. Polling으로는 이벤트를 놓치거나 대역폭을 낭비하게 된다. WebSocket 푸시로 에이전트 상태 변경 후 밀리초 단위로 대시보드가 업데이트된다.

## 4. 훅 시스템 연동

Claude Code는 11개의 훅 이벤트 타입을 제공한다. 대시보드 서버는 이를 전부 수용한다.

```typescript
const KNOWN_EVENTS: HookEventName[] = [
  "SessionStart",
  "SessionEnd",
  "SubagentStart",
  "SubagentStop",
  "Stop",
  "TaskCompleted",
  "TeammateIdle",
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "UserPromptSubmit",
  "Notification",
];
```

Claude Code를 대시보드에 연결하려면 `~/.claude/settings.json`에 HTTP 훅을 추가한다.

```json
{
  "hooks": {
    "SubagentStart": [{
      "matcher": "",
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }],
    "SubagentStop": [{
      "matcher": "",
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }],
    "Stop": [{
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }],
    "TaskCompleted": [{
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }],
    "SessionStart": [{
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }],
    "SessionEnd": [{
      "hooks": [{ "type": "http", "url": "http://localhost:3100/api/v1/events" }]
    }]
  }
}
```

각 훅은 `hook_event_name`, `session_id`, `agent_type` 그리고 `last_assistant_message`나 `tool_name` 같은 컨텍스트 필드를 담은 JSON 페이로드를 HTTP POST로 보낸다. 서버는 이 페이로드를 정규화하고 어떤 에이전트의 이벤트인지 식별한 뒤 스토어를 업데이트한다.

이벤트 처리 흐름은 아래와 같다.

- **SubagentStart** - 에이전트가 생성되었다. 서버가 해당 에이전트의 상태를 "working"으로 생성 또는 업데이트하고 시작 시간을 기록한다
- **SubagentStop** - 에이전트가 종료되었다. `reason` 필드가 `"error"` 또는 `"failure"`이면 에러로 판별하고 상태를 "error"로 설정한다. 그 외에는 "completed"이다. 초기에는 `last_assistant_message`에서 "error" 키워드를 검색하는 방식이었는데 "ErrorHistory.tsx" 같은 파일명이 매칭되어 false positive가 발생해서 `reason` 필드 기반으로 변경했다
- **Stop** - 응답이 완료될 때마다 발생한다. 서브에이전트에 대해서는 상태를 업데이트하지만 COO는 건드리지 않는다. COO를 여기서 idle로 바꾸면 다음 에이전트를 호출하기 전에 잠깐 깜빡이는 문제가 생긴다. COO는 `SessionEnd`에서만 idle로 전환한다
- **PreToolUse / PostToolUse** - 에이전트가 도구를 사용 중이다. 에이전트가 아직 살아서 작업하고 있음을 확인하는 이벤트이다
- **TaskCompleted** - 팀 작업이 끝났다. Agent Teams 조율에 사용한다
- **UserPromptSubmit** - 사용자가 프롬프트를 입력했다. 이 이벤트가 올 때마다 COO의 기본 작업명을 "대표님 지시 수행"으로 설정한다. 이후 task-assign 요청이 오면 작업명을 덮어쓴다
- **SessionStart / SessionEnd** - 메인 Claude Code 세션의 생명 주기이다. `SessionEnd`에서 COO를 idle로 전환한다

에이전트가 완료되면 10초 후 자동으로 idle 상태로 전환한다. 즉시 전환하면 완료 카드를 확인하기도 전에 사이드바가 바뀌어서 혼란스럽다. 10초 지연이 "방금 끝났구나"를 인식할 여유를 주면서도 대시보드가 지저분해지지 않게 유지한다.

서버는 파싱 에러가 발생해도 항상 HTTP 200을 반환한다. 이게 중요한데 대시보드 훅이 실패해서 Claude Code의 에이전트 실행을 막는 일은 절대 있어서는 안 되기 때문이다.

## 5. task-assign 패턴

여기서 흥미로운 제약을 만났다. Claude Code가 `SubagentStart` 훅을 발생시킬 때 페이로드에 `agent_type`(예: "product-planner")은 있지만 에이전트에게 무엇을 요청했는지에 대한 설명은 없다. 훅 시스템은 누가 시작했는지는 알려주지만 왜 시작했는지는 알려주지 않는다.

대시보드에서 이건 중요하다. "product-planner: working"이라고 보여주는 것보다 "product-planner: 음성 메모 기능 시장 조사 및 PRD 작성"이라고 보여주는 게 훨씬 유용하다.

해결책은 **task-assign** 패턴이다. COO 윤시현님(메인 세션)이 서브에이전트를 호출하기 전에 대시보드 서버에 사전 등록 요청을 보낸다.

```bash
curl -s -X POST http://localhost:3100/api/v1/task-assign \
  -H 'Content-Type: application/json' \
  -d '{"agent_type":"product-planner","task":"음성 메모 기능 시장 조사 및 PRD 작성"}' \
  2>/dev/null || true
```

서버가 이걸 `pendingTaskStore`에 저장한다. 잠시 뒤 `SubagentStart` 이벤트가 도착하면 서버가 `agent_type`으로 매칭하여 사전 등록된 작업 설명을 붙인다. 5분 내에 `SubagentStart`와 매칭되지 않은 항목은 자동 삭제된다. COO가 작업을 등록했지만 에이전트 호출이 취소되거나 실패한 경우 `pendingTaskStore`에 찌꺼기가 남지 않도록 하는 안전장치이다. 끝의 `|| true`는 대시보드 서버가 다운되어 있어도 COO의 워크플로우가 중단되지 않도록 보장한다.

task-assign 엔드포인트는 에이전트의 상태를 대시보드에서 즉시 "working"으로 전환하기도 한다. Claude Code의 훅이 발생하기 전에도 사용자에게 시각적 피드백을 준다. COO 자체도 같은 패턴을 `agent_type: "coo"`로 사용하여 오케스트레이터가 현재 무엇을 하고 있는지 보여준다.

```typescript
// 서버 측: task-assign 라우트
taskAssignRoute.post("/", async (c) => {
  const body = await c.req.json<{ agent_type?: string; task?: string }>();

  if (body.agent_type !== "coo") {
    pendingTaskStore.set(body.agent_type, body.task);
  }

  if (body.agent_type === "coo" || AGENT_MAP.has(body.agent_type)) {
    const agent = agentStore.get(body.agent_type);
    if (agent) {
      const updates: Partial<AgentState> = { originalTask: body.task };
      if (agent.status !== "working" && agent.status !== "reporting") {
        updates.status = "working";
        updates.startedAt = new Date().toISOString();
      }
      agentStore.update(body.agent_type, updates);
      broadcaster.broadcast(buildAgentUpdatePayload(agent));
    }
  }

  return c.json({ ok: true });
});
```

시스템 이벤트가 발생하기 전에 의도를 미리 등록하는 이 패턴은 훅 시스템의 제한된 컨텍스트에 대한 깔끔한 우회책이 되었다. COO의 워크플로우 규칙인 `~/.claude/rules/workflow.md`가 이 동작을 자동으로 만든다. 모든 에이전트 호출 전에 task-assign 호출이 선행되도록 지시되어 있기 때문이다.

이 방식에는 문제가 하나 있었다. COO가 task-assign 호출을 종종 까먹었다. 워크플로우 규칙에 "절대로 빠뜨리지 말 것"이라고 강조해 놨지만 그래도 누락이 발생했다. 규칙은 LLM에게 제안이지 보장이 아니다.

해결책은 지시가 아니라 구조였다. PreToolUse 훅은 Agent 도구를 포함한 모든 도구 호출 시 발생한다. 서버가 PreToolUse 이벤트에서 tool_name이 "Agent"인 것을 감지하면 tool_input에서 subagent_type과 description을 추출하여 자동으로 작업을 등록한다. 수동 curl 호출 대신 훅 시스템이 트리거하는 것이다. COO가 기억할 필요가 없다. 시스템이 처리한다.

## 6. 에이전트 레지스트리

COO를 포함한 19명의 에이전트 전원이 shared 상수 파일에 정의되어 있다. 각 에이전트는 고유 ID, 한국어 이름, 소속 팀, 역할 설명 그리고 2D 오피스 시절부터 남아 있는 성격 특성을 가지고 있다.

```typescript
export const AGENTS: AgentDefinition[] = [
  // 기획팀
  {
    id: "product-planner",
    name: "김소연",
    team: "planning",
    role: "제품 기획자",
  },
  {
    id: "dev-planner",
    name: "이준혁",
    team: "planning",
    role: "기술 설계자",
  },
  // ... 16명 더
  {
    id: "coo",
    name: "윤시현",
    team: "coo",
    role: "최고운영책임자",
  },
];
```

한국어 이름을 사용한 것은 의도적인 선택이다. COO가 오케스트레이션 메시지에서 "제품 기획자 김소연님"을 언급하면 실제 팀과 협업하는 느낌이 난다. 대시보드 사이드바에서도 "product-planner"나 "server-reviewer-quality" 같은 ID 목록보다 훨씬 읽기 좋다.

## 7. 조직 구조

전체 시스템은 회사 조직 구조 메타포를 따른다.

**CEO(사용자)** → **COO 윤시현님(오케스트레이터)**

| 기획팀 | 개발팀 | 리뷰팀 | QA & 보안팀 |
|--------|--------|--------|-----------|
| 제품 기획자 김소연님 | 웹 개발자 강하린님 | 웹 아키텍처 최유진님 | QA 엔지니어 오태윤님 |
| 기술 설계자 이준혁님 | iOS 개발자 윤서진님 | 웹 품질 임수빈님 | 보안 감사관 신재원님 |
| UI/UX 디자이너 한예슬님 | 백엔드 개발자 박도현님 | iOS 아키텍처 배지훈님 | |
| 테크니컬 라이터 조민지님 | 인프라 엔지니어 정우성님 | iOS 품질 송다은님 | |
| | | 서버 아키텍처 황민호님 | |
| | | 서버 품질 전지수님 | |
| | | 인프라 보안 권도윤님 | |
| | | 인프라 운영 나영준님 | |

CEO(사용자)가 고수준 지시를 내린다. COO(Claude Code 메인 세션)가 이를 분해하고 에이전트를 배정하고 단계를 조율하고 에러를 처리하고 보고한다. 각 에이전트는 정의된 역할, 모델 배정(Opus는 창의적/중요 작업, Sonnet은 패턴화된 작업), 권한 수준을 가진 서브에이전트이다.

## 8. 대시보드 UI

대시보드는 2D 오피스를 깔끔하고 정보 밀도가 높은 레이아웃으로 대체했다. 모니터링에 최적화된 구조이다.

### 8.1. 사이드바 - 에이전트 명단

왼쪽 사이드바에 모든 에이전트가 팀별로 나열된다. 스태프, 기획팀, 개발팀, 리뷰팀, QA, 보안팀. 각 에이전트 옆에 상태를 나타내는 색상 점이 표시된다.

- 회색 - 대기(idle, 작업 가능)
- 파랑(펄스) - 작업 중(working, 처리 중)

완료나 에러 상태는 초록 또는 빨간색으로 10초간 표시된 후 회색(idle)으로 돌아간다. 상태 변화를 인식할 여유를 주면서도 사이드바가 지저분해지지 않게 한다.

에이전트를 클릭하면 **Agent Detail** 사이드 시트가 열린다.

### 8.2. 3단 메인 영역

메인 콘텐츠 영역은 3개 컬럼으로 나뉜다.

![대시보드 대기 상태](/assets/image/post/claude-code-agent-dashboard/00-idle.png)

**Active Tasks**는 현재 실행 중인 에이전트의 작업 설명과 경과 시간을 보여준다. 각 카드에 에이전트의 한국어 이름, 역할, 팀, 배정된 작업 그리고 실시간 타이머가 표시된다.

**Completed**는 완료된 작업을 역순으로 나열한다. 각 카드는 펼칠 수 있다. 클릭하면 Tailwind Typography로 렌더링된 마크다운 전문이 표시된다. PRD 문서, 코드 리뷰 요약, 테스트 결과 등 실제 산출물을 여기서 확인할 수 있다.

**Errors**는 문제가 발생한 에이전트를 보여준다. 에이전트의 `last_assistant_message`에서 가져온 에러 메시지가 표시되어 Claude Code의 트랜스크립트 파일을 뒤지지 않아도 무엇이 잘못됐는지 바로 파악할 수 있다.

### 8.3. 요약 카운터

상단의 3개 요약 카드가 현재 세션의 합계를 보여준다. 활성 수, 완료 수, 에러 수. 에이전트가 상태를 전환할 때마다 실시간으로 업데이트된다.

### 8.4. Agent Detail 사이드 시트

사이드바에서 에이전트를 클릭하면 디테일 패널이 열린다. 현재 상태, 작업 중이거나 완료한 작업, 연속 완료 횟수(streak, 에러 없이 연속 성공), 총 완료 작업 수, 타임스탬프를 보여준다.

![Agent Detail 사이드 시트](/assets/image/post/claude-code-agent-dashboard/14-agent-detail.png)

연속 완료 시스템은 2D 오피스에서 가져온 것이다. 에이전트가 에러 없이 연속으로 작업을 완료하면 streak이 쌓인다. 작은 요소지만 모니터링을 좀 더 흥미롭게 만든다.

## 9. 실전 예제 - 에이전트 팀으로 음성 메모 PoC 만들기

대시보드를 이해하는 가장 좋은 방법은 실제 다단계 파이프라인을 처리하는 과정을 보는 것이다. Claude Code에게 음성 메모 PoC를 처음부터 만들라고 시키면 이런 모습이 된다.

프롬프트는 간단하다.

> "음성 메모 시장 조사하고 PoC 만들어줘."

COO가 이 요청을 분석하고 다단계 계획을 세운 뒤 오케스트레이션을 시작한다.

### 9.1. Phase 1 - 기획(3명 병렬)

COO가 task-assign 호출을 3번 보낸 뒤 3명의 기획자를 병렬 서브에이전트로 호출한다.

![Phase 1 - 기획 진행 중](/assets/image/post/claude-code-agent-dashboard/01-phase1-active.png)

대시보드의 Active Tasks에 즉시 4개의 카드가 나타난다. COO와 기획자 3명이다. 제품 기획자 김소연님은 음성 메모 시장을 조사하고 있다. 기술 설계자 이준혁님은 기술 아키텍처를 설계하고 있다. UI/UX 디자이너 한예슬님은 UI 와이어프레임을 만들고 있다. 각 카드에 실시간으로 경과 시간이 올라간다.

3명이 전부 끝나면 카드가 Active에서 Completed로 이동한다. 사이드바 점이 초록으로 바뀐다.

![Phase 1 - 기획 완료](/assets/image/post/claude-code-agent-dashboard/02-phase1-done.png)

기획 에이전트들은 `docs/` 디렉토리에 설계 문서를 생성한다. 제품 기획자 김소연님의 PRD에는 핵심 기능 우선순위 테이블과 사용자 스토리가 담겨 있고 UI/UX 디자이너 한예슬님의 UI 설계서에는 컬러 팔레트, 와이어프레임, 인터랙션 플로우가 정리되어 있다.

![PRD 문서 - 제품 기획자가 생성한 요구사항 정의서](/assets/image/post/claude-code-agent-dashboard/20-prd-doc.png)

![UI/UX 설계서 - 디자이너가 생성한 화면 설계 문서](/assets/image/post/claude-code-agent-dashboard/21-ui-design-doc.png)

### 9.2. Phase 2 - 개발(1명)

COO가 기획자들의 산출물을 읽고 웹 개발자를 투입한다. 웹 개발자 강하린님이 Web Speech API로 실시간 음성 인식을 구현하고 localStorage로 메모를 저장하는 React 프론트엔드를 만든다. 브라우저 네이티브 PoC이므로 백엔드 서버는 필요 없다.

![Phase 2 - 개발 진행 중](/assets/image/post/claude-code-agent-dashboard/03-phase2-active.png)

대시보드에 개발 카드가 Active Tasks에 표시된다. 기획팀의 항목들은 Completed 컬럼에 있다. 사이드바도 이를 반영한다. 기획 에이전트들은 초록이고 개발 에이전트는 파란색이다.

![Phase 2 - 개발 완료](/assets/image/post/claude-code-agent-dashboard/04-phase2-done.png)

### 9.3. CEO 피드백 - 테스트와 반복

여기서부터 실전이다. PoC가 첫 시도에 완벽하게 나오지는 않는다. 앱을 열어서 테스트해 보니 바로 문제가 보인다. Web Speech API가 Chrome에서는 작동하지만 Safari에서는 아무 피드백 없이 실패한다. 녹음 버튼이 너무 작다. 키보드 단축키가 없다.

Claude Code에 이렇게 입력한다.

> "Safari에서 음성 인식이 안 되는데? 폴백 처리해줘. 그리고 녹음 버튼 좀 키우고 Space 키로도 녹음 되게 해."

COO가 피드백을 받아서 작업을 "대표님 피드백 반영"으로 업데이트하고 웹 개발자 강하린님을 다시 투입하여 수정을 구현한다.

![CEO 피드백 - 웹 개발자 재투입](/assets/image/post/claude-code-agent-dashboard/17-ceo-feedback.png)

이 사이클 - 만들고 테스트하고 피드백 주고 고치는 것 - 은 실제 프로젝트에서 여러 번 반복된다. 대시보드가 이 과정을 가시화한다. COO가 새로운 지시를 처리하고 개발자가 재배정되는 것을 볼 수 있다. Completed 컬럼에 각 반복이 쌓이면서 피드백을 통해 제품이 어떻게 발전했는지 이력이 남는다.

핵심 포인트는 이것이다. 에이전틱 코딩은 프롬프트 하나 입력하면 완벽한 앱이 나오는 것이 아니다. 대화이다. 에이전트가 무거운 작업을 하지만 인간이 방향을 잡는다.

### 9.4. Phase 3 - 리뷰(3명 병렬)

3명의 에이전트가 동시에 실행된다. 리뷰어 2명이 아키텍처와 품질 관점에서 코드를 검토하고 보안 감사자가 전체 감사를 수행한다.

![Phase 3 - 검증 진행 중](/assets/image/post/claude-code-agent-dashboard/05-phase3-active.png)

그런데 상황이 발생한다. 보안 감사관 신재원님이 2가지 이슈를 발견한다. 트랜스크립트 뷰의 XSS 취약점과 localStorage의 암호화되지 않은 메모 데이터. 카드가 빨간색으로 바뀌면서 Errors 컬럼으로 이동한다.

![Phase 3 - 보안 에러 감지](/assets/image/post/claude-code-agent-dashboard/06-phase3-error.png)

터미널만 보는 워크플로우에서라면 쉽게 놓칠 수 있는 이벤트이다. 대시보드는 이걸 무시할 수 없게 만든다. 에러 카운터가 올라가고 카드가 빨간 Errors 컬럼에 나타나고 사이드바 점이 빨간색이 된다.

COO가 에러를 읽고 웹 개발자 강하린님을 투입하여 수정한다. DOMPurify로 XSS를 방지하고 Web Crypto API로 localStorage 데이터를 암호화한다. 수정이 완료되고 Completed 컬럼에 표시된다.

![Phase 3 - 보안 수정 적용](/assets/image/post/claude-code-agent-dashboard/07-security-fixed.png)

### 9.5. Phase 4 - QA & 재검증(2명 병렬)

보안 이슈가 해결되자 COO가 QA 테스트와 보안 재감사를 실행하여 수정을 확인한다. QA 엔지니어 오태윤님이 전체 테스트 스위트를 돌리는 동안 보안 감사관 신재원님이 패치된 코드를 재감사한다.

![Phase 4 - QA & 재검증 진행 중](/assets/image/post/claude-code-agent-dashboard/08-phase4-active.png)

둘 다 통과한다. QA 엔지니어가 12개 테스트 전부 통과를 확인하고 보안 감사자가 XSS 취약점과 localStorage 암호화가 제대로 수정되었음을 검증한다.

![전 단계 완료](/assets/image/post/claude-code-agent-dashboard/09-all-done.png)

### 9.6. 버그 리포트 - CEO가 이슈를 발견하다

QA가 통과한 후에도 직접 앱을 테스트한다. 녹음 중에 다른 브라우저 탭으로 갔다가 돌아오면 파형 시각화가 멈추는 걸 발견한다. 녹음은 계속 되지만 파형만 안 움직인다. Claude Code에 이렇게 보고한다.

> "녹음 중에 다른 탭 갔다오면 파형이 멈추는데? 녹음은 되는데 파형만 안 움직여."

COO는 바로 개발자를 투입하지 않는다. 먼저 QA 엔지니어 오태윤님에게 버그를 재현하고 확인하도록 한다.

![버그 리포트 - QA 재현 중](/assets/image/post/claude-code-agent-dashboard/18-bug-report.png)

QA 엔지니어가 확인한다. `requestAnimationFrame`이 비활성 탭에서 멈추고 돌아왔을 때 재시작하지 않는 것이 원인이다. 버그가 확인되고 원인이 파악되자 COO가 웹 개발자 강하린님을 투입하여 수정한다.

![버그 수정 - 개발자 패치 중](/assets/image/post/claude-code-agent-dashboard/19-bug-fix.png)

`visibilitychange` 이벤트 리스너를 추가하여 탭이 다시 활성화되면 애니메이션 루프를 재시작하도록 한다. 파일 하나 수정으로 3분 이내에 완료된다.

이것이 실제 워크플로우이다. CEO가 보고하고 QA가 재현하고 개발자가 수정한다. 프롬프트 하나로 마법처럼 완성품이 나오는 게 아니다.

### 9.7. Phase 5 - 문서화(1명)

모든 검증이 끝나고 COO가 마지막 작업을 배정한다. 테크니컬 라이터 조민지님이 전체 개발 과정을 문서화한다.

모든 단계의 산출물을 검토한다. PRD, 기술 설계, 코드 변경, 리뷰 결과, 보안 수정, QA 결과. 이를 바탕으로 블로그 포스트, README 업데이트, CHANGELOG 항목, 훅 설정 가이드를 작성한다.

![Phase 5 - 문서화 진행 중](/assets/image/post/claude-code-agent-dashboard/10-techwriter-documenting.png)

문서화가 완료되면 카드가 Completed로 이동하고 작성한 모든 산출물의 마크다운 요약이 표시된다.

![Phase 5 - 문서화 완료](/assets/image/post/claude-code-agent-dashboard/11-techwriter-done.png)

생성된 기술 설계 문서의 모습이다. 목차, 아키텍처 개요, 데이터 플로우 다이어그램, API 스펙을 갖춘 Confluence 스타일 페이지이다.

![테크니컬 라이터가 생성한 기술 설계 문서](/assets/image/post/claude-code-agent-dashboard/16-techwriter-doc.png)

### 9.8. 완료 카드 펼치기

완료된 카드를 클릭하면 Tailwind Typography로 렌더링된 마크다운 전문이 펼쳐진다. 웹 개발자의 완료 카드를 보면 구현 요약, 변경된 파일, 테스트 커버리지를 확인할 수 있다.

![마크다운이 포함된 완료 카드 펼침](/assets/image/post/claude-code-agent-dashboard/12-completed-expanded.png)

에러 카드를 펼치면 보안 감사자가 발견한 내용을 정확히 볼 수 있다.

![에러 카드 펼침](/assets/image/post/claude-code-agent-dashboard/13-error-expanded.png)

### 9.9. 최종 결과물

에이전트들이 실제로 만든 음성 메모 앱이다. 실시간 음성-텍스트 변환, 파형 시각화, 메모 관리 기능을 갖춘 완전히 작동하는 PoC이다.

![음성 메모 PoC 앱](/assets/image/post/claude-code-agent-dashboard/15-voice-memo-app.png)

프롬프트 하나에서 동작하는 애플리케이션까지 도달하는 과정이 대시보드에서 실시간으로 보였다.

### 9.10. 전체 파이프라인 요약

5개 단계에 걸친 전체 오케스트레이션 흐름이다.

**CEO**: "음성 메모 PoC 개발" → **COO 윤시현님**: 분석 및 계획

| 단계 | 에이전트 |
|------|---------|
| **1단계: 기획** | 김소연님(PRD), 이준혁님(기술 설계), 한예슬님(와이어프레임) |
| **2단계: 개발** | 강하린님(React SPA) |
| **CEO 피드백** | 강하린님(Safari 폴백 + UI) |
| **3단계: 리뷰** | 최유진님(아키텍처 리뷰), 임수빈님(품질 리뷰), 신재원님(보안 감사) → **오류** |
| **보안 수정** | 강하린님(XSS + 암호화 수정) |
| **4단계: QA 및 재검증** | 오태윤님(QA), 신재원님(보안 재감사) |
| **버그 수정**(CEO 리포트) | 오태윤님(재현 확인), 강하린님(파형 버그 수정) |
| **5단계: 문서화** | 조민지님(블로그, README, CHANGELOG) |

## 10. macOS launchd 자동 시작

대시보드 서버가 Claude Code 세션이 시작되기 전에 실행 중이어야 하므로 macOS 부팅 시 자동으로 시작되는 launchd 서비스로 설정했다.

프로젝트에 `install-launchd.sh` 스크립트가 포함되어 있다.

```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PLIST_NAME="com.binaryloader.agent-dashboard"
PLIST_SRC="$PROJECT_DIR/$PLIST_NAME.plist"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

# 전체 패키지 빌드
cd "$PROJECT_DIR"
pnpm build

# pnpm 경로를 치환하여 plist 복사
PNPM_PATH=$(which pnpm)
sed "s|/path/to/pnpm|$PNPM_PATH|g" "$PLIST_SRC" > "$PLIST_DST"

# 서비스 로드
launchctl unload "$PLIST_DST" 2>/dev/null || true
launchctl load "$PLIST_DST"
```

`scripts/install-launchd.sh`를 실행하면 매 로그인 시 대시보드 서버가 시작된다. 로그는 `/tmp/agent-dashboard.log`에 저장된다. 서버가 클라이언트를 정적 파일로 빌드하여 같은 포트에서 서빙하므로 `http://localhost:3100`에서 API와 대시보드 UI를 모두 사용할 수 있다.

제거는 명령어 하나로 된다.

```bash
launchctl unload ~/Library/LaunchAgents/com.binaryloader.agent-dashboard.plist \
  && rm ~/Library/LaunchAgents/com.binaryloader.agent-dashboard.plist
```

## 11. 배운 점

### 11.1. 피봇할 때를 아는 것

2D 가상 오피스는 창의적인 탐구였다. 진짜 매력이 있었다. 에이전트가 카페테리아로 걸어가고 에러에서 머리를 긁적이고 완료 후 컨페티로 축하하는 건 모두 만족스러웠다. 하지만 매력과 효용은 다르다. 픽셀 스프라이트를 눈을 가늘게 뜨고 들여다보며 어떤 에이전트가 활성인지 파악하려는 순간 이 컨셉이 용도에 맞지 않는다는 걸 깨달았다.

Gather Town 스타일 모니터링 구현부터 대시보드 완성까지 전체 과정은 토요일 밤부터 약 9시간 만에 완료됐다. 서버 아키텍처가 이미 탄탄해서 프레젠테이션 레이어 교체는 빠르게 진행됐다. 교훈은 이것이다. 인프라를 충분히 범용적으로 만들어 놓으면 프레젠테이션 레이어를 바꿔도 데이터 파이프라인을 다시 작성할 필요가 없다.

### 11.2. 훅 시스템의 한계와 우회

Claude Code의 훅 시스템은 강력하지만 모니터링 대시보드를 위해 설계된 건 아니다. 핵심 격차는 컨텍스트이다. 훅은 무슨 일이 일어났는지(에이전트가 시작됐다, 도구를 사용했다)는 알려주지만 왜 일어났는지(에이전트에게 무엇을 요청했는지)는 알려주지 않는다. task-assign 패턴이 이 격차를 깔끔하게 메운다. 다만 오케스트레이션 레이어에서 규율이 필요하다. 모든 에이전트 호출 전에 task-assign 호출이 선행되어야 한다.

이것을 `~/.claude/rules/workflow.md`에 규칙으로 인코딩하면 자동이 된다. COO가 항상 작업을 사전 등록하는 이유는 지시 사항에 그렇게 적혀 있기 때문이다. 수동 규율이 필요 없다.

이후 개선에서 수동 단계를 완전히 제거했다. 서버가 Agent 도구의 PreToolUse 이벤트를 가로채서 작업명을 자동 등록하므로 워크플로우 규칙 자체가 불필요해졌다.

### 11.3. 실시간 WebSocket이 모든 걸 바꾼다

Polling 기반 모니터링과 WebSocket 푸시의 차이는 단순히 기술적인 게 아니다. 시스템과 상호작용하는 방식 자체를 바꾼다. 실시간 업데이트가 있으면 에이전트가 작업하는 동안 대시보드를 볼 수 있다. 에러가 발생하는 정확한 순간을 본다. 에이전트가 working에서 completed로 전환되는 걸 실시간으로 본다. "주기적으로 확인하기"에서 "한 번 쳐다보면 바로 아는 것"으로 경험이 바뀐다.

### 11.4. 한국어 이름이 더하는 개성

이건 주관적이지만 에이전트에게 한국어 이름을 붙이니 전체 경험이 훨씬 몰입감 있어졌다. "보안 감사관 신재원님이 XSS 취약점을 발견했다"가 "security-auditor가 XSS 취약점을 발견했다"보다 기억에 남는다. 추상적인 도구 사용이 팀 협업 같은 느낌으로 바뀐다.

이름은 Claude Code와의 대화에서도 도움이 된다. COO가 "제품 기획자 김소연님에게 시장 조사를 맡깁니다"라고 하면 함수 호출이 아니라 자연스러운 업무 위임처럼 읽힌다.

## 12. 솔직한 평가 - 프로덕션 수준인가?

아니다. 분명히 해 두겠다.

멀티 에이전트 파이프라인의 산출물은 거칠다. 코드가 동작하긴 하지만 다듬어지지 않았다. 일관성 없는 네이밍, 빠진 엣지 케이스, 인간 개발자라면 한 번 더 보지 않고는 출시하지 않을 UI 디테일이 발견될 것이다. 보안 감사자가 명확한 취약점은 잡아내지만 미묘한 아키텍처 이슈는 빠질 수 있다. QA 엔지니어가 테스트를 돌리지만 커버리지가 포괄적이지는 않다.

에이전트가 생성한 코드는 한 번에 깔끔하게 동작하지 않는다. 실행해 보면 import 경로가 틀려 있거나 타입이 맞지 않거나 특정 브라우저에서 에러가 발생한다. 이런 자잘한 버그를 잡고 다듬는 과정은 아직 사람의 몫이다. 에이전트에게 "이거 안 되는데?" 하고 다시 보내면 고쳐주지만 그 반복 자체가 시간이다. 현 시점에서 에이전트 파이프라인은 완성품 자동 생성기가 아니라 초안 작성기에 가깝다.

그래도 PoC 도구로서는 탁월하다. 아이디어를 빠르게 탐색해야 할 때 - 컨셉 검증, 이해관계자 미팅 데모, 엔지니어링 리소스를 투입하기 전 프로토타입 - 이 워크플로우는 며칠 걸릴 일을 몇 시간으로 줄여준다. 에이전트가 기계적인 작업을 처리한다. 스캐폴딩, 보일러플레이트, 기본 테스트, 문서화. 사용자는 판단을 내린다. 이 아키텍처가 맞는지, UX가 말이 되는지, 이걸 만들어야 하는 건지.

핵심 통찰은 경계가 어디인지 아는 것이다. 에이전트 팀으로 처음 80%를 생성하고 나머지 20%는 인간의 전문성을 적용한다. 취향, 맥락, AI가 아직 갖추지 못한 도메인 지식이 필요한 부분이다.

## 13. 마치며

이 대시보드를 만들면서 계속 떠오르는 질문과 마주해야 했다. AI 에이전트가 대부분의 구현 작업을 처리하면 소프트웨어 개발은 어떤 모습이 될까?

전통적인 개발 워크플로우 - 스펙 작성, 티켓 배정, 코드 리뷰, QA, 배포 - 는 이미 변하고 있다. 이 프로젝트에서 한 명이 19명의 에이전트를 다단계 파이프라인으로 오케스트레이션했다. 원래라면 크로스 펑셔널 팀이 필요한 규모이다. 기획, 코딩, 리뷰, 테스팅, 문서화가 모두 하나의 세션에서 하나의 화면 위에서 이루어졌다.

이것이 개발자가 필요 없어진다는 뜻은 아니다. 오히려 역할이 위로 이동한다. 코드를 작성하는 시간은 줄고 의사결정에 쏟는 시간이 늘어난다. 어떤 아키텍처가 맞는지, 어떤 트레이드오프를 수용할지, 산출물이 충분히 좋은지. 에이전트는 빠르지만 판단력이 없다. 인간은 느리지만 방향을 제시한다. 둘의 조합이 어느 쪽 단독보다 생산적이다.

Anthropic의 CEO Dario Amodei는 AI가 [3~6개월 내에 코딩의 대부분을 대체할 것](https://www.finalroundai.com/blog/anthropic-ceo-ai-coding-six-months)이라고 발언했다. 마냥 허황된 소리는 아닌 것 같다. 하지만 현실적인 장벽이 두 가지 남아 있다. 첫째는 비용이다. AI 에이전트를 대규모로 운영하는 비용이 인간 개발자 인건비와 경쟁할 수 있는지는 아직 불분명하다. 둘째는 품질이다. 현재 에이전트가 생성하는 코드는 작동하지만 거칠다. 자잘한 버그, 깨진 import, 브라우저별 엣지 케이스. "고쳐줘, 아 그것도 고쳐줘" 사이클이 시간 절약분을 깎아먹는다. 완전한 대체는 시기상조이고 강력한 가속기가 정확한 표현이다.

그럼에도 방향성 자체는 부정하기 어렵다. 이 흐름이 어디로 향하는지에 대해서는 [[Column] 더 이상 개발자 없이는 안 된다는 말은 통하지 않는다](/ko/writing/column/the-end-of-developer-scarcity/)에 더 자세히 썼다. 요약하면 코딩할 수 있는 사람에 대한 수요가 사라지는 게 아니라 코딩의 정의가 확장되고 있다. AI 에이전트 팀을 이끄는 것도 여전히 소프트웨어 엔지니어링이다. 다만 우리가 익숙한 모습과 다를 뿐이다.

흥미로운 시대이다.

# 참고

- <https://docs.anthropic.com/en/docs/claude-code>
- <https://docs.anthropic.com/en/docs/claude-code/hooks>
- <https://www.finalroundai.com/blog/anthropic-ceo-ai-coding-six-months>
