---
title: "[MCP] Scapple 다이어그램 MCP 서버 만들기"
ref: mcp-scapple
excerpt: "AI 어시스턴트가 Scapple 파일을 직접 읽고 쓰고 렌더링할 수 있는 MCP 서버를 만들었다."
date: 2026-02-23T02:00+09:00
last_modified_at: 2026-02-23T02:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/mcp-scapple.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/mcp-scapple.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - MCP
tags:
  - MCP
  - Scapple
  - Node.js
  - TypeScript
depth:
  - title: "Development"
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "Agentic Coding Assistant"
    url: /ko/development/ai/agentic-coding-assistant/
  - title: "MCP"
    url: /ko/development/ai/agentic-coding-assistant/mcp/
---

# 개요

AI 어시스턴트가 Scapple 파일을 직접 읽고 쓰고 렌더링할 수 있는 MCP 서버를 만들었다.

# 배경

Scapple은 Literature & Latte에서 만든 브레인스토밍 도구다. Scrivener와 함께 쓰는 사람이 많지만 단독으로도 아이디어를 자유롭게 배치하고 연결하는 용도로 꽤 유용하다. 특이한 점은 파일 포맷이 XML 기반이라는 것이다. `.scap` 확장자의 파일을 열어보면 노트 좌표, 연결 관계, 스타일 정보가 모두 XML로 기술되어 있다.

AI 어시스턴트와 대화하면서 "이 내용을 다이어그램으로 만들어줘"라고 말하면 바로 Scapple 파일이 생성되거나 PNG 이미지로 렌더링되면 좋겠다는 생각이 출발점이었다. MCP(Model Context Protocol)를 사용하면 AI 어시스턴트에 도구를 제공할 수 있으니 Scapple을 다루는 MCP 서버를 만들기로 했다.

MCP는 Anthropic이 공개한 프로토콜로 AI 어시스턴트에 외부 도구를 연결하는 표준 인터페이스다. Claude Desktop이나 Claude Code 같은 MCP 호스트에 서버를 등록하면 AI가 해당 도구를 호출할 수 있게 된다.

# 기능

## 1. read-scapple

`.scap` 파일을 파싱해서 구조화된 JSON으로 반환한다. 노트의 위치, 크기, 텍스트, 스타일, 연결 관계를 모두 추출한다. 기존 Scapple 파일을 AI에게 분석시키거나 수정 작업의 기반으로 활용할 수 있다.

## 2. write-scapple

구조화된 노트 데이터를 받아 `.scap` 파일을 생성한다. 각 노트에 좌표, 텍스트, 스타일을 지정할 수 있고 노트 간 연결(양방향)과 화살표(단방향)를 모두 지원한다. 양방향 연결은 자동으로 동기화되므로 A에서 B로 연결하면 B에서 A로의 역방향 연결도 자동 추가된다.

## 3. text-to-scapple

들여쓰기 텍스트를 입력하면 자동으로 다이어그램을 생성한다. 불릿 리스트(`-`, `*`, `*`)나 번호 리스트(`1.`, `2.`)를 지원하며 들여쓰기 깊이가 계층 구조를 결정한다. 루트 노트는 구름 모양, 자식 노트는 둥근 사각형으로 렌더링되고 깊이에 따라 8가지 색상이 자동 배정된다.

## 4. scapple-to-image

`.scap` 파일을 PNG 이미지로 변환한다. Retina 디스플레이를 위한 2배 스케일이 기본이며 패딩, 테마를 커스터마이즈할 수 있다.

# 구현

## 1. 아키텍처

전체 파이프라인은 세 단계로 나뉜다.

```
Text/JSON → Parser/Builder → XML(.scap) → Renderer → PNG
```

- **Parser** — XML을 파싱해서 `ScappleDocument` 타입의 객체로 변환한다
- **Builder** — `ScappleDocument` 객체를 XML 문자열로 직렬화한다
- **Renderer** — `ScappleDocument`를 SVG로 변환한 뒤 PNG를 생성한다

프로젝트의 파일 구조는 아래와 같다.

```
src/
├── index.ts                 # MCP 서버 (4개 도구 정의)
├── types.ts                 # 타입 시스템 + DEFAULT_THEME
├── errors.ts                # 에러 클래스 계층
├── tools/
│   ├── read-scapple.ts
│   ├── write-scapple.ts
│   ├── text-to-scapple.ts
│   └── scapple-to-image.ts
└── lib/
    ├── parser.ts            # XML → ScappleDocument
    ├── builder.ts           # ScappleDocument → XML
    ├── layout.ts            # 텍스트 → 자동 배치 노트
    ├── renderer.ts          # ScappleDocument → SVG/PNG
    ├── geometry.ts          # 바운딩 박스, 교차점 계산
    ├── color.ts             # RGB ↔ Hex 변환
    ├── text-metrics.ts      # 텍스트 너비 측정
    ├── id-range.ts          # ID 범위 파싱/직렬화
    └── svg/
        ├── index.ts         # SVG 빌더 메인
        ├── shapes.ts        # 노트 도형 렌더링
        ├── connections.ts   # 연결선/화살표 렌더링
        ├── text.ts          # 텍스트 렌더링
        └── defs.ts          # SVG defs (그림자, 패턴)
```

## 2. XML 파싱과 색상 처리

Scapple의 XML 포맷은 독특한 점이 몇 가지 있다. 먼저 색상을 0~1 범위의 RGB 실수로 표현한다. `"0.5 0.25 0.75"` 같은 형태인데 일반적인 hex 컬러와 다르기 때문에 변환 레이어가 필요하다.

```typescript
export function rgbToHex(color: RGBColor): string {
  const r = Math.round(Math.min(1, Math.max(0, color.r)) * 255);
  const g = Math.round(Math.min(1, Math.max(0, color.g)) * 255);
  const b = Math.round(Math.min(1, Math.max(0, color.b)) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
```

또 하나는 노트 간 연결 관계를 ID 범위 문자열로 표현한다는 것이다. `"1,3-5,7"`이라고 쓰면 `[1, 3, 4, 5, 7]`을 의미한다. 파서에서 이를 확장하고 빌더에서 다시 압축하는 `parseIdRange`/`serializeIdRange` 함수 쌍이 있다.

```typescript
export function parseIdRange(value: string): number[] {
  if (!value.trim()) return [];
  const ids: number[] = [];
  const parts = value.split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          ids.push(i);
        }
      }
    } else {
      const id = parseInt(trimmed, 10);
      if (!isNaN(id)) ids.push(id);
    }
  }
  return ids;
}
```

파서는 fast-xml-parser를 사용하는데 `isArray` 옵션으로 `Note`, `Shape`, `Style` 태그가 항상 배열로 파싱되도록 설정했다. XML에서 요소가 하나일 때 객체로 파싱되는 문제를 방지하기 위해서다. 파싱이 끝나면 노트 ID의 중복 여부와 연결 참조의 무결성을 검증한다.

## 3. 양방향 연결 동기화

Scapple에서 두 노트를 선으로 연결하면 양쪽 노트에 모두 상대의 ID가 기록된다. 하지만 API 사용자가 A에서 B로만 연결을 지정하면 B에서 A로의 역방향이 빠질 수 있다. 이를 자동으로 맞춰주는 `ensureBidirectionalConnections` 함수가 빌더에 있다.

```typescript
function ensureBidirectionalConnections(notes: ScappleNote[]): ScappleNote[] {
  const connectionMap = new Map<number, Set<number>>();

  for (const note of notes) {
    if (!connectionMap.has(note.id)) {
      connectionMap.set(note.id, new Set());
    }
    const set = connectionMap.get(note.id)!;
    for (const connId of note.connectedNoteIDs) {
      set.add(connId);
    }
    for (const ptsId of note.pointsToNoteIDs) {
      set.add(ptsId);
    }
  }

  for (const [noteId, connections] of connectionMap) {
    for (const connId of connections) {
      if (!connectionMap.has(connId)) {
        connectionMap.set(connId, new Set());
      }
      connectionMap.get(connId)!.add(noteId);
    }
  }

  return notes.map((note) => {
    const allConnections = connectionMap.get(note.id) ?? new Set<number>();
    const pointsToSet = new Set(note.pointsToNoteIDs);
    const connectedIds = [...allConnections].sort((a, b) => a - b);
    return { ...note, connectedNoteIDs: connectedIds, pointsToNoteIDs: [...pointsToSet] };
  });
}
```

모든 노트의 연결을 맵에 수집한 뒤 역방향을 자동 추가하고 정렬한다. `connectedNoteIDs`는 양방향 연결 목록이고 `pointsToNoteIDs`는 화살표 방향을 결정하는 단방향 목록이다. 화살표는 `pointsToNoteIDs`에 포함된 연결에만 렌더링된다.

## 4. SVG 렌더링

렌더링은 `ScappleDocument`를 SVG 문자열로 변환하는 것이 핵심이다. `buildSvg` 함수에서 바운딩 박스 계산, 배경 그리기, 배경 패턴, 연결선, 노트 도형, 텍스트를 순서대로 SVG 요소로 쌓아간다.

연결선 렌더링에서 주의할 점은 선이 노트 중심에서 시작하면 안 된다는 것이다. 노트 중심에서 상대 노트 중심으로 향하는 선분과 노트 사각형의 교차점을 계산해서 테두리에서 시작하도록 해야 한다. `lineRectIntersection` 함수가 이 교차점을 계산한다.

```typescript
export function computeConnections(notes: readonly ScappleNote[]): ConnectionLine[] {
  // ...
  const fromCenter = centerOf(noteToRect(note));
  const toCenter = centerOf(noteToRect(target));
  const hasArrow = pointsToSet.has(connId);

  const from = lineRectIntersection(toCenter, fromCenter, noteToRect(note));
  const to = lineRectIntersection(fromCenter, toCenter, noteToRect(target));

  lines.push({ from, to, hasArrow });
  // ...
}
```

화살표가 있는 연결은 SVG marker 요소로 화살촉을 렌더링한다. 이미 그려진 연결은 `drawnPairs` Set으로 중복 방지한다.

노트 테두리는 Rounded, Square, Cloud, None 네 가지 스타일을 지원한다. Cloud 스타일이 가장 복잡한데 2차 베지어 곡선(quadratic Bezier)으로 구름 모양을 프로시저럴하게 생성한다.

```typescript
function buildCloudPath(x: number, y: number, w: number, h: number): string {
  const bumpRadius = 12;
  const hBumps = Math.max(2, Math.round(w / (bumpRadius * 2)));
  const vBumps = Math.max(2, Math.round(h / (bumpRadius * 2)));
  // ...
  for (let i = 0; i < hBumps; i++) {
    const sx = x + i * hStep;
    const ex = x + (i + 1) * hStep;
    const mx = (sx + ex) / 2;
    parts.push(`Q ${mx} ${y - bumpRadius} ${ex} ${y}`);
  }
  // 오른쪽, 아래쪽, 왼쪽도 동일한 방식으로 범프 생성
  // ...
}
```

노트의 가로/세로 길이를 `bumpRadius * 2`로 나누어 범프 수를 계산하므로 큰 노트에는 범프가 더 많이 생기고 작은 노트에는 최소 2개가 보장된다. 상단, 우측, 하단, 좌측 네 변을 순서대로 돌면서 곡선을 이어 붙여 하나의 닫힌 경로를 만든다.

생성된 SVG는 sharp 라이브러리로 PNG로 변환한다. `density` 옵션에 `72 * scale`을 지정해서 Retina 디스플레이용 고해상도 이미지를 생성할 수 있다.

```typescript
const density = 72 * scale;
const result = await sharp(svgBuffer, { density })
  .png()
  .toFile(outputPath);
```

## 5. 테마 시스템

테마는 18개 속성으로 구성된 `RenderTheme` 타입을 사용한다. 캔버스 배경(배경색, 패턴, 패턴 색상), 노트 스타일(테두리 색상/두께, 모서리 반경, 그림자, 기본 채우기/테두리), 텍스트(폰트, 크기, 색상, 정렬, 패딩), 연결선(색상, 두께, 화살표 색상)의 네 그룹으로 나뉜다.

테마 적용에는 캐스케이드가 있다. `resolveTheme` 함수에서 기본 테마 위에 `.scap` 파일의 문서 설정(배경색, 텍스트 색상, 폰트, 패딩)을 덮어쓰고 그 위에 사용자가 전달한 테마를 다시 덮어쓴다. 여기에 더해 `resolveNoteDefaults` 함수에서 개별 노트의 인라인 스타일이 최종 우선순위로 적용된다.

```typescript
function resolveTheme(theme: RenderTheme | undefined, settings: ScappleSettings): Required<RenderTheme> {
  const base: Required<RenderTheme> = {
    ...DEFAULT_THEME,
    backgroundColor: rgbToHex(settings.backgroundColor),
    defaultTextColor: rgbToHex(settings.textColor),
    defaultFont: settings.defaultFont,
    noteXPadding: settings.noteXPadding,
  };
  if (!theme) return base;
  return {
    backgroundColor: theme.backgroundColor ?? base.backgroundColor,
    backgroundPattern: theme.backgroundPattern ?? base.backgroundPattern,
    // ... 나머지 속성도 동일한 패턴
  };
}
```

배경 패턴은 dots, grid, lines 세 종류를 지원하며 SVG `<pattern>` 요소로 20x20px 타일을 만들어 캔버스 전체에 반복한다.

## 6. 자동 레이아웃

`text-to-scapple`의 자동 레이아웃은 두 단계로 이루어진다. 먼저 들여쓰기 텍스트를 트리로 파싱한다. 불릿(`-`, `*`, `•`)이나 번호(`1.`, `2.`)를 제거하고 인덴트 깊이로 부모-자식 관계를 결정한다. 스택 기반 알고리즘으로 현재 줄의 인덴트와 스택의 인덴트를 비교해서 트리를 구성한다.

```typescript
function parseIndentedText(text: string): TreeNode[] {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const roots: TreeNode[] = [];
  const stack: { node: TreeNode; indent: number }[] = [];

  for (const line of lines) {
    const trimmed = line.replace(/^[\s]*[-*•]\s*/, "").replace(/^[\s]*\d+\.\s*/, "");
    const indent = line.search(/\S/);
    const node: TreeNode = { text: trimmed.trim(), children: [], depth: 0 };

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }
    stack.push({ node, indent });
  }
  return roots;
}
```

트리가 완성되면 `layoutTree`에서 좌표를 계산한다. X 좌표는 `depth * (160 + hGap)`으로 깊이에 비례한다. Y 좌표는 리프 노트부터 순서대로 배치한 뒤 부모 노트가 자식들의 수직 중앙에 오도록 계산한다. 텍스트 길이에 따라 노트 너비가 자동 결정되며 최소 80px이 보장된다.

깊이에 따라 8가지 색상(노란색, 하늘색, 초록색, 주황색, 보라색, 분홍색, 청록색, 연노란색)이 순환 배정된다. 루트 노트는 Cloud 테두리를 사용하고 자식 노트는 Rounded 테두리를 사용한다.

# 사용 예시

"모바일 앱 개발 주제로 브레인스토밍 다이어그램을 만들어줘"라고 요청하면 AI가 `text-to-scapple` 도구를 호출해서 다이어그램을 자동 생성한다.

기본 테마 렌더링 결과는 아래와 같다.

![기본 테마 렌더링](/assets/image/post/development/ai/mcp/mcp-scapple/example-default.png)

같은 다이어그램에 다크 테마를 적용한 결과다.

![다크 테마 렌더링](/assets/image/post/development/ai/mcp/mcp-scapple/example-dark.png)

다크 테마 설정 예시는 아래와 같다.

```json
{
  "backgroundColor": "#1a1a2e",
  "backgroundPattern": "dots",
  "patternColor": "#333355",
  "lineColor": "#aaaaaa",
  "arrowColor": "#aaaaaa",
  "shadowEnabled": false
}
```

# 설치

[npm](https://www.npmjs.com/package/@binaryloader/mcp-scapple)에 배포되어 있으므로 npx로 바로 실행할 수 있다.

```bash
npx @binaryloader/mcp-scapple
```

Claude Code에서 MCP 서버로 등록하려면 아래 명령어를 사용한다.

```bash
claude mcp add mcp-scapple -- npx @binaryloader/mcp-scapple
```

소스 코드는 [GitHub](https://github.com/binaryloader/mcp-scapple)에서 확인할 수 있다.

# 참고

- <https://modelcontextprotocol.io>
- <https://www.literatureandlatte.com/scapple/overview>
