---
title: "[Swagger] Building Swagger UI for Korean Law Open API with Vercel Deployment"
ref: swagger-ui-vercel-korean-law-open-api
lang: en
permalink: /en/:categories/:title/
excerpt: "Writing an OpenAPI Spec for Korea's Legislative Service Open API, building Swagger UI documentation, deploying it to Vercel, and resolving Mixed Content issues with a Rewrites proxy."
date: 2026-02-26T02:15+09:00
last_modified_at: 2026-02-26T02:15+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/swagger-ui-vercel-korean-law-open-api.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/swagger-ui-vercel-korean-law-open-api.png"
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
    url: /en/development/
  - title: "Server"
    url: /en/development/server/
  - title: "Swagger"
    url: /en/development/server/swagger/
---

# Overview

Writing an OpenAPI Spec for Korea's Legislative Service Open API, building Swagger UI documentation, deploying it to Vercel, and resolving Mixed Content issues with a Rewrites proxy.

# Steps

## 1. Writing the OpenAPI Spec

Korea's Legislative Service (법제처) Open API provides various legal information services. This project documents 4 endpoints for case law and legislation — list search and detail retrieval for each.

| Endpoint | Description |
|---|---|
| `lawSearch.do?target=prec` | Search case law list |
| `lawService.do?target=prec` | Get case law detail |
| `lawSearch.do?target=eflaw` | Search legislation list by enforcement date |
| `lawService.do?target=eflaw` | Get legislation detail |

These endpoints are defined as an OpenAPI 3.0 spec. Create an `openapi.yaml` file and define the parameters and response schemas for each endpoint.

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

The `servers.url` is set to a relative path (`/api`) instead of the absolute URL (`http://www.law.go.kr/DRF/`) due to the Mixed Content issue explained later.

One thing to watch out for when writing YAML is that if a description value contains a colon (`:`) followed by a space, the YAML parser interprets it as a mapping and throws a parsing error. In such cases, the value must be wrapped in quotes.

```yaml
# Error
description: 사용자 이메일의 ID (예: g4c@korea.kr일 경우 OC값=g4c)

# OK
description: "사용자 이메일의 ID (예: g4c@korea.kr일 경우 OC값=g4c)"
```

## 2. Setting Up Swagger UI

Swagger UI is loaded directly from a CDN, requiring only a single static HTML file with no build step.

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

The `.swagger-ui .info .main .url { display: none; }` rule hides the spec file URL link shown at the top of Swagger UI. Setting `layout` to `BaseLayout` applies a clean layout without the top navigation bar.

## 3. Deploying to Vercel

Since the site consists of just `index.html` and `openapi.yaml`, it can be easily deployed to Vercel as a static site. Create a `vercel.json` to serve the current directory without any build step.

```json
{
  "buildCommand": null,
  "outputDirectory": ".",
  "cleanUrls": true
}
```

Connecting the GitHub repository to Vercel enables automatic deployments on every push to the `main` branch.

## 4. Resolving Mixed Content

Swagger UI's Try it out feature allows sending API requests directly from the browser. However, the Vercel-hosted site is served over HTTPS, while the Legislative Service API's Base URL (`http://www.law.go.kr/DRF/`) only supports HTTP. When an HTTPS page calls an HTTP API, the browser blocks the request due to the Mixed Content policy.

To resolve this, Vercel Rewrites are used as a server-side proxy. The client's request is received by the Vercel server and forwarded to the Legislative Service API.

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

Requests to `/api/*` are rewritten to `http://www.law.go.kr/DRF/*`. From the browser's perspective, it is calling an HTTPS endpoint on the same domain, so no Mixed Content issue occurs. This is also why the OpenAPI Spec's `servers.url` was set to `/api` — so that requests are routed through this proxy.

The `headers` configuration sets CORS allowance and the correct Content-Type for `openapi.yaml` to ensure Swagger UI can load the spec file properly.

The final result from the steps above can be found here.

- Repository: <https://github.com/wookbros/open-law-api-docs>
- Live: <https://open-law-api-docs-wookbros.vercel.app>

# References

- <https://open.law.go.kr/LSO/index.html>
- <https://swagger.io/tools/swagger-ui/>
- <https://vercel.com/docs/projects/project-configuration#rewrites>
