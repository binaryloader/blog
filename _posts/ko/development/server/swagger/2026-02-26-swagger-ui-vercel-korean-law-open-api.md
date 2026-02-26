---
title: "[Swagger] 법제처 Open API Swagger UI 구축 및 Vercel 배포"
ref: swagger-ui-vercel-korean-law-open-api
excerpt: "법제처 Open API의 OpenAPI Spec을 작성하고 Swagger UI로 문서화한 뒤 Vercel에 배포하면서 Mixed Content 문제를 Rewrites 프록시로 해결한 과정을 정리한다."
date: 2026-02-26T02:15+09:00
last_modified_at: 2026-02-26T02:15+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/swagger-ui-vercel-korean-law-open-api.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/swagger-ui-vercel-korean-law-open-api.png"
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
    url: /ko/development/
  - title: "Server"
    url: /ko/development/server/
  - title: "Swagger"
    url: /ko/development/server/swagger/
---

# 개요

법제처 Open API의 OpenAPI Spec을 작성하고 Swagger UI로 문서화한 뒤 Vercel에 배포하면서 Mixed Content 문제를 Rewrites 프록시로 해결한 과정을 정리한다.

# 정리

## 1. OpenAPI Spec 작성

법제처 Open API는 다양한 법령 정보를 제공하며 이 중 판례와 법령의 목록 조회, 본문 조회 4개 엔드포인트를 Swagger UI로 문서화한다.

| 엔드포인트 | 설명 |
|---|---|
| `lawSearch.do?target=prec` | 판례 목록 조회 |
| `lawService.do?target=prec` | 판례 본문 조회 |
| `lawSearch.do?target=eflaw` | 현행법령(시행일) 목록 조회 |
| `lawService.do?target=eflaw` | 현행법령 본문 조회 |

이 엔드포인트들을 OpenAPI 3.0 스펙으로 정의한다. `openapi.yaml` 파일을 생성하고 각 엔드포인트의 파라미터와 응답 스키마를 작성한다.

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

`servers.url`을 절대 경로(`http://www.law.go.kr/DRF/`)가 아닌 상대 경로(`/api`)로 설정한 이유는 뒤에서 설명하는 Mixed Content 문제 때문이다.

YAML 작성 시 주의할 점이 있다. description 값에 콜론(`:`)과 공백이 포함되면 YAML 파서가 매핑으로 해석하여 파싱 에러가 발생한다. 이런 경우 값을 따옴표로 감싸야 한다.

```yaml
# 에러 발생
description: 사용자 이메일의 ID (예: g4c@korea.kr일 경우 OC값=g4c)

# 정상
description: "사용자 이메일의 ID (예: g4c@korea.kr일 경우 OC값=g4c)"
```

## 2. Swagger UI 구성

Swagger UI는 CDN에서 직접 로드하여 별도 빌드 없이 정적 HTML 파일 하나로 구성한다.

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

`.swagger-ui .info .main .url { display: none; }` 규칙은 Swagger UI 상단에 표시되는 스펙 파일 URL 링크를 숨기는 역할을 한다. `layout`을 `BaseLayout`으로 설정하면 상단 네비게이션 바 없이 깔끔한 레이아웃이 적용된다.

## 3. Vercel 배포

`index.html`과 `openapi.yaml` 두 파일만으로 구성된 정적 사이트이므로 Vercel에 간단히 배포할 수 있다. `vercel.json`을 작성하여 빌드 없이 현재 디렉토리를 그대로 서빙하도록 설정한다.

```json
{
  "buildCommand": null,
  "outputDirectory": ".",
  "cleanUrls": true
}
```

GitHub 저장소를 Vercel에 연결하면 `main` 브랜치에 푸시할 때마다 자동으로 배포된다.

## 4. Mixed Content 해결

Swagger UI의 Try it out 기능을 사용하면 브라우저에서 직접 API를 호출할 수 있다. 그런데 Vercel에 배포된 사이트는 HTTPS로 서빙되고 법제처 API의 Base URL은 `http://www.law.go.kr/DRF/`로 HTTP만 지원한다. HTTPS 페이지에서 HTTP API를 호출하면 브라우저가 Mixed Content 정책으로 요청을 차단한다.

이 문제를 해결하기 위해 Vercel Rewrites를 사용한다. 클라이언트의 요청을 Vercel 서버가 대신 받아서 법제처 API로 전달하는 서버사이드 프록시 방식이다.

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

`/api/*`로 들어오는 요청을 `http://www.law.go.kr/DRF/*`로 리라이트한다. 브라우저 입장에서는 같은 도메인의 HTTPS 엔드포인트를 호출하는 것이므로 Mixed Content 문제가 발생하지 않는다. 앞서 OpenAPI Spec의 `servers.url`을 `/api`로 설정한 것도 이 프록시를 통해 요청이 전달되도록 하기 위함이다.

`headers` 설정은 `openapi.yaml` 파일에 CORS 허용과 올바른 Content-Type을 지정하여 Swagger UI가 스펙 파일을 정상적으로 로드하도록 한다.

위 과정을 거쳐 완성된 결과물은 아래에서 확인할 수 있다.

- 저장소: <https://github.com/wookbros/open-law-api-docs>
- 라이브: <https://open-law-api-docs-wookbros.vercel.app>

# 참고

- <https://open.law.go.kr/LSO/index.html>
- <https://swagger.io/tools/swagger-ui/>
- <https://vercel.com/docs/projects/project-configuration#rewrites>
