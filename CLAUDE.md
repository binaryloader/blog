# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jekyll 기반 개인 블로그 (Minimal Mistakes 테마 v4.24.0). 한국어(ko-KR) 블로그이며, GitHub Pages로 `blog.binaryloader.io`에 배포된다.

## Build & Development Commands

```bash
# 로컬 서버 실행
bundle exec jekyll serve

# 사이트 빌드
bundle exec jekyll build

# JavaScript 빌드 (uglify + banner)
npm run build:js

# JavaScript 변경 감시
npm run watch:js
```

## Architecture

- **테마**: Minimal Mistakes (gemspec 기반, `_sass/minimal-mistakes/`에 SCSS 포함)
- **한국어 포스트**: `_posts/{category}/{subcategory}/YYYY-MM-DD-title.md` 구조 (URL: `/ko/...`)
- **영어 포스트**: `_posts/en/{category}/{subcategory}/YYYY-MM-DD-title.md` 구조 (URL: `/en/...`)
- **드래프트**: `_draft/` 디렉토리에 카테고리별 하위 폴더
- **카테고리 페이지**: `_pages/categories/` (한국어), `_pages/en/categories/` (영어)
- **커스텀 JS**: `assets/js/custom/` (예: copy-code-button.js)
- **댓글**: Utterances (별도 repo `binaryloader/blog-comments` 사용)

## Post Front Matter Convention

```yaml
---
title: "[카테고리] 제목"
ref: unique-slug        # 한/영 번역 연결용 (같은 ref끼리 매칭)
last_modified_at: YYYY-MM-DDTHH:MM+09:00
published: true         # 기본값은 false (_config.yml defaults)
header:
  overlay_color: "#202020"
categories:
  - 상위카테고리
  - 하위카테고리
tags:
  - 태그1
  - 태그2
depth:                  # 커스텀 breadcrumb
  - title: "상위카테고리"
    url: /상위카테고리/
  - title: "하위카테고리"
    url: /상위카테고리/하위카테고리/
---
```

영어 포스트는 추가로 `lang: en`과 `permalink: /en/:categories/:title/` 지정 필요.

`published: true`를 명시하지 않으면 포스트가 게시되지 않는다.

## Writing Rules

- 한국어 문장에서 쉼표(,)는 연속된 항목을 나열할 때만 사용한다. 접속 부사나 연결 어미 뒤에는 쉼표를 찍지 않는다.
  - O: "사과, 바나나, 포도를 샀다"
  - O: "좋아하고 알고 있는 지식을"
  - X: "좋아하고, 알고 있는 지식을"

## Multi-language (i18n)

- 한국어, 영어, 일본어, 중국어 지원. URL: 한국어 `/ko/path/`, 영어 `/en/path/`, 일본어 `/ja/path/`, 중국어 `/zh/path/`
- 포스트 간 번역 연결: `ref` 필드로 매칭 (masthead 토글 버튼이 자동 연결)
- 영어 포스트 추가 시: `_posts/en/` 하위에 생성, `lang: en` + `ref` + `permalink: /en/...` 설정
- 새 카테고리 추가 시: `_pages/categories/`와 `_pages/en/categories/` 양쪽에 페이지 추가 + `_data/navigation.yml`에 `menu`/`menu-en` 양쪽에 항목 추가
- permalink 패턴: 한국어 `/ko/:categories/:title/`, 영어 `/en/:categories/:title/`, 일본어 `/ja/:categories/:title/`, 중국어 `/zh/:categories/:title/`
- 루트 `/`는 브라우저 언어 감지 후 `/{lang}/`으로 자동 리다이렉트
