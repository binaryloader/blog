---
title: "[Swagger] 韓国法制処 Open API の Swagger UI 構築と Vercel デプロイ"
ref: swagger-ui-vercel-korean-law-open-api
lang: ja
permalink: /ja/:categories/:title/
excerpt: "韓国法制処 Open API の OpenAPI Spec を作成し、Swagger UI でドキュメント化した後、Vercel にデプロイして Mixed Content 問題を Rewrites プロキシで解決した手順を整理する。"
date: 2026-02-26T02:15+09:00
last_modified_at: 2026-02-26T02:15+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/swagger-ui-vercel-korean-law-open-api.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/swagger-ui-vercel-korean-law-open-api.png"
categories:
  - Development
  - Server
  - Swagger
tags:
  - Swagger UI
  - OpenAPI
  - Vercel
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Server"
    url: /ja/development/server/
  - title: "Swagger"
    url: /ja/development/server/swagger/
---

# 概要

韓国法制処 Open API の OpenAPI Spec を作成し、Swagger UI でドキュメント化した後、Vercel にデプロイして Mixed Content 問題を Rewrites プロキシで解決した手順を整理する。

# 手順

## 1. OpenAPI Spec の作成

韓国法制処（법제처）Open API はさまざまな法令情報を提供しており、そのうち判例と法令の一覧検索・本文照会の4つのエンドポイントを Swagger UI でドキュメント化する。

| エンドポイント | 説明 |
|---|---|
| `lawSearch.do?target=prec` | 判例一覧検索 |
| `lawService.do?target=prec` | 判例本文照会 |
| `lawSearch.do?target=eflaw` | 現行法令（施行日）一覧検索 |
| `lawService.do?target=eflaw` | 現行法令本文照会 |

これらのエンドポイントを OpenAPI 3.0 スペックとして定義する。`openapi.yaml` ファイルを作成し、各エンドポイントのパラメータとレスポンススキーマを記述する。

```yaml
openapi: 3.0.3
info:
  title: 법제처 Open API
  description: |
    국가법령정보 공동활용 Open API.
    법제처 사이트에서 제공되는 검색에 대한 결과를 XML/JSON으로 받아볼 수 있는 대화형 서비스이다.

    - [국가법령정보 공동활용](https://open.law.go.kr/LSO/index.html)
  version: 1.0.0

servers:
  - url: /api
    description: 법제처 Open API
```

`servers.url` を絶対パス（`http://www.law.go.kr/DRF/`）ではなく相対パス（`/api`）に設定した理由は、後述する Mixed Content 問題のためである。

YAML 記述時の注意点がある。description の値にコロン（`:`）とスペースが含まれると、YAML パーサーがマッピングとして解釈し、パースエラーが発生する。このような場合は値を引用符で囲む必要がある。

```yaml
# エラー発生
description: 사용자 이메일의 ID (예: g4c@korea.kr일 경우 OC값=g4c)

# 正常
description: "사용자 이메일의 ID (예: g4c@korea.kr일 경우 OC값=g4c)"
```

## 2. Swagger UI の構成

Swagger UI は CDN から直接ロードし、ビルド不要で静的 HTML ファイル1つだけで構成する。

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>법제처 Open API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    .swagger-ui .info .main .url { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "./openapi.yaml",
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: "BaseLayout"
    });
  </script>
</body>
</html>
```

`.swagger-ui .info .main .url { display: none; }` ルールは、Swagger UI 上部に表示されるスペックファイルの URL リンクを非表示にする。`layout` を `BaseLayout` に設定すると、上部ナビゲーションバーなしのすっきりしたレイアウトが適用される。

## 3. Vercel へのデプロイ

`index.html` と `openapi.yaml` の2ファイルのみで構成された静的サイトなので、Vercel に簡単にデプロイできる。`vercel.json` を作成し、ビルドなしで現在のディレクトリをそのまま配信する設定にする。

```json
{
  "buildCommand": null,
  "outputDirectory": ".",
  "cleanUrls": true
}
```

GitHub リポジトリを Vercel に接続すれば、`main` ブランチへのプッシュのたびに自動デプロイされる。

- リポジトリ: <https://github.com/wookbros/open-law-api-docs>
- ライブ: <https://open-law-api-docs-wookbros.vercel.app>

## 4. Mixed Content の解決

Swagger UI の Try it out 機能を使うと、ブラウザから直接 API を呼び出せる。しかし Vercel にデプロイされたサイトは HTTPS で配信される一方、法制処 API の Base URL（`http://www.law.go.kr/DRF/`）は HTTP のみをサポートしている。HTTPS ページから HTTP API を呼び出すと、ブラウザが Mixed Content ポリシーによりリクエストをブロックする。

この問題を解決するために Vercel Rewrites を使用する。クライアントのリクエストを Vercel サーバーが受け取り、法制処 API に転送するサーバーサイドプロキシ方式である。

```json
{
  "buildCommand": null,
  "outputDirectory": ".",
  "cleanUrls": true,
  "rewrites": [
    { "source": "/api/:path*", "destination": "http://www.law.go.kr/DRF/:path*" }
  ],
  "headers": [
    {
      "source": "/openapi.yaml",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Content-Type", "value": "text/yaml; charset=utf-8" }
      ]
    }
  ]
}
```

`/api/*` へのリクエストを `http://www.law.go.kr/DRF/*` にリライトする。ブラウザの観点では同じドメインの HTTPS エンドポイントを呼び出すことになるため、Mixed Content 問題は発生しない。先ほど OpenAPI Spec の `servers.url` を `/api` に設定したのも、このプロキシを経由してリクエストが転送されるようにするためである。

`headers` 設定は `openapi.yaml` ファイルに CORS 許可と適切な Content-Type を指定し、Swagger UI がスペックファイルを正常にロードできるようにする。

# 参考

- <https://open.law.go.kr/LSO/index.html>
- <https://swagger.io/tools/swagger-ui/>
- <https://vercel.com/docs/projects/project-configuration#rewrites>
