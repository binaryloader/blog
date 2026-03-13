---
paths:
  - "_posts/**/*.md"
---

# Front Matter 규칙

## 1. 기본 템플릿

```yaml
---
title: "[카테고리] 제목"
ref: unique-slug
excerpt: "포스트 설명"
date: YYYY-MM-DDTHH:MM+09:00
last_modified_at: YYYY-MM-DDTHH:MM+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/{ref}.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/{lang}/{ref}.png"
categories:
  - 상위카테고리
  - 하위카테고리
tags:
  - 태그1
  - 태그2
depth:
  - title: "상위카테고리"
    url: /상위카테고리/
  - title: "하위카테고리"
    url: /상위카테고리/하위카테고리/
---
```

## 2. 필수 규칙

- `published: true`를 명시한다 (기본값 false)
- `ref` 필드는 한/영/일 번역 연결용이다 (같은 ref끼리 매칭)
- `depth` 필드는 커스텀 breadcrumb용이다

## 3. 날짜/시간 규칙

- `date`/`last_modified_at`는 현재 한국 시간(KST, +09:00) 기준이다
- `date` 명령어로 확인 후 과거 시간을 사용한다 (미래 시간은 빌드되지 않는다)

## 4. 영어/일본어 포스트 추가 필드

- 영어 포스트는 `lang: en`과 `permalink: /en/:categories/:title/`을 추가한다
- 일본어 포스트는 `lang: ja`와 `permalink: /ja/:categories/:title/`을 추가한다
- 한국어 포스트는 `lang` 필드 없이 작성한다 (nil로 필터링)
