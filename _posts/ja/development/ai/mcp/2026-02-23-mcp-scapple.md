---
title: "[MCP] Scappleダイアグラム用MCPサーバーの作成"
lang: ja
permalink: /ja/:categories/:title/
ref: mcp-scapple
excerpt: "AIアシスタントがScappleファイルを直接読み書きしてレンダリングできるMCPサーバーを作った。"
date: 2026-02-23T02:00+09:00
last_modified_at: 2026-02-23T02:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/mcp-scapple.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/mcp-scapple.png"
categories:
  - Development
  - AI
  - MCP
tags:
  - MCP
  - Scapple
  - Node.js
  - TypeScript
depth:
  - title: "Development"
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "MCP"
    url: /ja/development/ai/mcp/
---

# 概要

AIアシスタントがScappleファイルを直接読み書きしてレンダリングできるMCPサーバーを作った。

# 背景

ScappleはLiterature & Latteが作ったブレインストーミングツールだ。Scrivenerと併用する人が多いが、アイデアを自由に配置して接続する用途で単体でもかなり便利だ。特徴的なのはファイルフォーマットがXMLベースであること。`.scap`拡張子のファイルを開くと、ノートの座標、接続関係、スタイル情報がすべてXMLで記述されている。

AIアシスタントと会話しながら「この内容をダイアグラムにして」と言えばすぐにScappleファイルが生成されたりPNG画像にレンダリングされたりしたら便利だろうという発想が出発点だった。MCP（Model Context Protocol）を使えばAIアシスタントにツールを提供できるので、Scappleを扱うMCPサーバーを作ることにした。

MCPはAnthropicが公開したプロトコルで、AIアシスタントに外部ツールを接続する標準インターフェースだ。Claude DesktopやClaude CodeのようなMCPホストにサーバーを登録すると、AIがそのツールを呼び出せるようになる。

# 機能

## 1. read-scapple

`.scap`ファイルをパースして構造化されたJSONを返す。ノートの位置、サイズ、テキスト、スタイル、接続関係をすべて抽出する。既存のScappleファイルをAIに分析させたり、修正作業のベースとして活用できる。

## 2. write-scapple

構造化されたノートデータを受け取って`.scap`ファイルを生成する。各ノートに座標、テキスト、スタイルを指定でき、ノート間の接続（双方向）と矢印（単方向）の両方をサポートする。双方向接続は自動的に同期されるため、AからBに接続するとBからAへの逆方向接続も自動追加される。

## 3. text-to-scapple

インデント付きテキストを入力するとダイアグラムを自動生成する。ブレットリスト（`-`、`*`、`•`）や番号リスト（`1.`、`2.`）をサポートし、インデントの深さが階層構造を決定する。ルートノートは雲の形、子ノートは角丸四角形でレンダリングされ、深さに応じて8色が自動配色される。

## 4. scapple-to-image

`.scap`ファイルをPNG画像に変換する。Retinaディスプレイ向けの2倍スケールがデフォルトで、パディングやテーマのカスタマイズが可能だ。

# 実装

## 1. アーキテクチャ

全体のパイプラインは3段階に分かれる。

```
Text/JSON → Parser/Builder → XML(.scap) → Renderer → PNG
```

- **Parser** — XMLをパースして`ScappleDocument`型のオブジェクトに変換する
- **Builder** — `ScappleDocument`オブジェクトをXML文字列にシリアライズする
- **Renderer** — `ScappleDocument`をSVGに変換した後、PNGを生成する

プロジェクトのファイル構造は以下の通りだ。

```
src/
├── index.ts                 # MCPサーバー（4つのツール定義）
├── types.ts                 # 型システム + DEFAULT_THEME
├── errors.ts                # エラークラス階層
├── tools/
│   ├── read-scapple.ts
│   ├── write-scapple.ts
│   ├── text-to-scapple.ts
│   └── scapple-to-image.ts
└── lib/
    ├── parser.ts            # XML → ScappleDocument
    ├── builder.ts           # ScappleDocument → XML
    ├── layout.ts            # テキスト → 自動配置ノート
    ├── renderer.ts          # ScappleDocument → SVG/PNG
    ├── geometry.ts          # バウンディングボックス、交点計算
    ├── color.ts             # RGB ↔ Hex変換
    ├── text-metrics.ts      # テキスト幅測定
    ├── id-range.ts          # ID範囲パース/シリアライズ
    └── svg/
        ├── index.ts         # SVGビルダーメイン
        ├── shapes.ts        # ノート図形レンダリング
        ├── connections.ts   # 接続線/矢印レンダリング
        ├── text.ts          # テキストレンダリング
        └── defs.ts          # SVG defs（影、パターン）
```

## 2. XMLパースと色処理

ScappleのXMLフォーマットにはいくつかの独特な点がある。まず色を0〜1範囲のRGB浮動小数点で表現する。`"0.5 0.25 0.75"`のような形式で、一般的なhexカラーとは異なるため変換レイヤーが必要だ。

```typescript
export function rgbToHex(color: RGBColor): string {
  const r = Math.round(Math.min(1, Math.max(0, color.r)) * 255);
  const g = Math.round(Math.min(1, Math.max(0, color.g)) * 255);
  const b = Math.round(Math.min(1, Math.max(0, color.b)) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
```

もう一つはノート間の接続関係をID範囲文字列で表現すること。`"1,3-5,7"`は`[1, 3, 4, 5, 7]`を意味する。パーサーでこれを展開し、ビルダーで再圧縮する`parseIdRange`/`serializeIdRange`関数ペアがある。

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

パーサーはfast-xml-parserを使用しており、`isArray`オプションで`Note`、`Shape`、`Style`タグが常に配列としてパースされるように設定した。XMLで要素が1つの場合にオブジェクトとしてパースされる問題を防ぐためだ。パース完了後はノートIDの重複とコネクション参照の整合性を検証する。

## 3. 双方向接続の同期

Scappleで2つのノートを線で接続すると、両方のノートに相手のIDが記録される。しかしAPIユーザーがAからBへの接続のみを指定すると、BからAへの逆方向が抜ける可能性がある。これを自動的に合わせる`ensureBidirectionalConnections`関数がビルダーにある。

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

すべてのノートの接続をマップに収集した後、逆方向を自動追加してソートする。`connectedNoteIDs`は双方向接続リストで、`pointsToNoteIDs`は矢印の方向を決定する単方向リストだ。矢印は`pointsToNoteIDs`に含まれる接続にのみレンダリングされる。

## 4. SVGレンダリング

レンダリングのコアは`ScappleDocument`をSVG文字列に変換することだ。`buildSvg`関数でバウンディングボックス計算、背景描画、背景パターン、接続線、ノート図形、テキストを順にSVG要素として積み上げていく。

接続線レンダリングで注意すべき点は、線がノート中心から始まってはいけないということだ。一方のノート中心から他方のノート中心へ向かう線分とノート矩形の交点を計算し、境界線から始まるようにする必要がある。`lineRectIntersection`関数がこの交点を計算する。

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

矢印付きの接続はSVG marker要素で矢じりをレンダリングする。すでに描画された接続は`drawnPairs` Setで重複を防止する。

ノートの境界線はRounded、Square、Cloud、Noneの4つのスタイルをサポートする。Cloudスタイルが最も複雑で、2次ベジエ曲線（quadratic Bezier）で雲の形をプロシージャルに生成する。

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
  // 右辺、下辺、左辺も同じパターンでバンプ生成
  // ...
}
```

ノートの幅と高さを`bumpRadius * 2`で割ってバンプ数を計算するため、大きなノートにはバンプが多くなり小さなノートには最小2個が保証される。上辺、右辺、下辺、左辺の4辺を順に巡りながら曲線をつなぎ合わせて1つの閉じたパスを作る。

生成されたSVGはsharpライブラリでPNGに変換する。`density`オプションに`72 * scale`を指定して、Retinaディスプレイ用の高解像度画像を生成できる。

```typescript
const density = 72 * scale;
const result = await sharp(svgBuffer, { density })
  .png()
  .toFile(outputPath);
```

## 5. テーマシステム

テーマは18のプロパティで構成された`RenderTheme`型を使用する。キャンバス背景（背景色、パターン、パターン色）、ノートスタイル（境界線色/太さ、角丸半径、影、デフォルト塗り/境界線）、テキスト（フォント、サイズ、色、配置、パディング）、接続線（色、太さ、矢印色）の4グループに分かれる。

テーマの適用にはカスケードがある。`resolveTheme`関数でデフォルトテーマの上に`.scap`ファイルのドキュメント設定（背景色、テキスト色、フォント、パディング）を上書きし、その上にユーザーが指定したテーマをさらに上書きする。加えて`resolveNoteDefaults`関数で個別ノートのインラインスタイルが最終優先で適用される。

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
    // ... 残りのプロパティも同じパターン
  };
}
```

背景パターンはdots、grid、linesの3種類をサポートし、SVGの`<pattern>`要素で20x20pxのタイルを作成してキャンバス全体に繰り返す。

## 6. 自動レイアウト

`text-to-scapple`の自動レイアウトは2段階で行われる。まずインデント付きテキストをツリーにパースする。ブレット（`-`、`*`、`•`）や番号（`1.`、`2.`）を除去し、インデントの深さで親子関係を決定する。スタックベースのアルゴリズムで現在の行のインデントとスタックのインデントを比較してツリーを構築する。

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

ツリーが完成したら`layoutTree`で座標を計算する。X座標は`depth * (160 + hGap)`で深さに比例する。Y座標はリーフノートから順に配置した後、親ノートが子ノードの垂直中央に来るように計算する。テキスト長に応じてノート幅が自動決定され、最小80pxが保証される。

深さに応じて8色（黄色、水色、緑、オレンジ、紫、ピンク、ティール、薄黄色）が循環的に割り当てられる。ルートノートはCloud境界線を使用し、子ノートはRounded境界線を使用する。

# 使用例

「モバイルアプリ開発のテーマでブレインストーミングダイアグラムを作って」とリクエストすると、AIが`text-to-scapple`ツールを呼び出してダイアグラムを自動生成する。

デフォルトテーマのレンダリング結果は以下の通りだ。

![デフォルトテーマレンダリング](/assets/image/post/development/ai/mcp/mcp-scapple/example-default.png)

同じダイアグラムにダークテーマを適用した結果だ。

![ダークテーマレンダリング](/assets/image/post/development/ai/mcp/mcp-scapple/example-dark.png)

ダークテーマの設定例は以下の通りだ。

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

# インストール

[npm](https://www.npmjs.com/package/@binaryloader/mcp-scapple)に公開されているため、npxで直接実行できる。

```bash
npx @binaryloader/mcp-scapple
```

Claude CodeでMCPサーバーとして登録するには以下のコマンドを使用する。

```bash
claude mcp add mcp-scapple -- npx @binaryloader/mcp-scapple
```

ソースコードは[GitHub](https://github.com/binaryloader/mcp-scapple)で確認できる。

# 参考

- <https://www.literatureandlatte.com/scapple/overview>
- <https://modelcontextprotocol.io>
