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
- **한국어 포스트**: `_posts/ko/{category}/{subcategory}/YYYY-MM-DD-title.md` 구조 (URL: `/ko/...`)
- **영어 포스트**: `_posts/en/{category}/{subcategory}/YYYY-MM-DD-title.md` 구조 (URL: `/en/...`)
- **드래프트**: `_draft/` 디렉토리에 카테고리별 하위 폴더
- **카테고리 페이지**: `_pages/categories/` (한국어), `_pages/{lang}/categories/` (타 언어)
- **커스텀 JS**: `assets/js/custom/` (예: copy-code-button.js)
- **댓글**: Utterances (별도 repo `binaryloader/blog-comments` 사용)

## Post Front Matter Convention

```yaml
---
title: "[카테고리] 제목"
ref: unique-slug        # 한/영 번역 연결용 (같은 ref끼리 매칭)
excerpt: "포스트 설명"   # 검색 결과 등에 표시되는 요약
date: YYYY-MM-DDTHH:MM+09:00
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

`date`와 `last_modified_at`은 항상 **현재 한국 시간** 기준으로 설정한다. (예: `2026-02-11T19:37+09:00`) 미래 시간을 넣으면 Jekyll이 포스트를 빌드하지 않는다. 시간을 설정할 때 반드시 `date` 명령어로 현재 시간을 확인한 뒤 그보다 과거 시간을 사용해야 한다.

## Post Structure

설정 가이드나 절차를 정리하는 포스트에 적용한다. 모든 포스트에 일괄 적용하지 않는다.

```markdown
# 개요
(excerpt과 동일한 한 줄 요약)

# 정리
## 1. 첫 번째 단계
## 2. 두 번째 단계
```

`# 정리` 섹션의 번역:

| 유형 | 한국어 | 영어 | 일본어 |
|---|---|---|---|
| 절차/설정 가이드 | `# 정리` | `# Steps` | `# 手順` |
| 개념 설명 | `# 정리` | `# Summary` | `# まとめ` |

`# 개요`의 번역: 영어 `# Overview`, 일본어 `# 概要`

## Writing Rules

- 이미지에 `max-width`를 지정할 때는 `min(원하는값, 100%)`를 사용한다. (예: `style="max-width: min(400px, 100%);"`)

## Multi-language (i18n)

- 한국어, 영어, 일본어 지원. URL: 한국어 `/ko/path/`, 영어 `/en/path/`, 일본어 `/ja/path/`
- **모든 포스트는 반드시 한국어, 영어, 일본어 3개 언어 버전을 함께 생성해야 한다.**
- 포스트 간 번역 연결: `ref` 필드로 매칭 (masthead 토글 버튼이 자동 연결)
- 영어 포스트 추가 시: `_posts/en/` 하위에 생성, `lang: en` + `ref` + `permalink: /en/...` 설정
- 일본어 포스트 추가 시: `_posts/ja/` 하위에 생성, `lang: ja` + `ref` + `permalink: /ja/...` 설정
- 새 카테고리 추가 시: `_pages/categories/`와 `_pages/{lang}/categories/` 모두에 페이지 추가 + `_data/navigation.yml`에 `menu`/`menu-en`/`menu-ja` 모두에 항목 추가
- permalink 패턴: 한국어 `/ko/:categories/:title/`, 영어 `/en/:categories/:title/`, 일본어 `/ja/:categories/:title/`
- 루트 `/`는 브라우저 언어 감지 후 `/{lang}/`으로 자동 리다이렉트
