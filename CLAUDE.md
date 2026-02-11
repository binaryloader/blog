# 블로그 규칙

Jekyll 기반 개인 블로그 (Minimal Mistakes 테마 v4.24.0). GitHub Pages로 `blog.binaryloader.io`에 배포.

## 프로젝트

### 빌드

```bash
bundle exec jekyll serve      # 로컬 서버
bundle exec jekyll build      # 사이트 빌드
npm run build:js              # JS 빌드 (uglify + banner)
npm run watch:js              # JS 변경 감시
```

### 아키텍처

- **테마**: Minimal Mistakes (gemspec 기반, `_sass/minimal-mistakes/`에 SCSS 포함)
- **포스트**: `_posts/{lang}/{category}/{subcategory}/YYYY-MM-DD-title.md`
  - 한국어: `/ko/...`, 영어: `/en/...`, 일본어: `/ja/...`
- **드래프트**: `_draft/` 디렉토리에 카테고리별 하위 폴더
- **카테고리 페이지**: `_pages/categories/` (한국어), `_pages/{lang}/categories/` (타 언어)
- **커스텀 JS**: `assets/js/custom/` (예: copy-code-button.js)
- **댓글**: Utterances (별도 repo `binaryloader/blog-comments` 사용)

## 포스트 작성

### Front Matter

```yaml
---
title: "[카테고리] 제목"
ref: unique-slug        # 한/영/일 번역 연결용 (같은 ref끼리 매칭)
excerpt: "포스트 설명"
date: YYYY-MM-DDTHH:MM+09:00
last_modified_at: YYYY-MM-DDTHH:MM+09:00
published: true
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

- `published: true` 명시 필수 (기본값 false)
- `date`/`last_modified_at`: 현재 한국 시간 기준. `date` 명령어로 확인 후 과거 시간 사용 (미래 시간은 빌드 안 됨)
- 영어 포스트: `lang: en` + `permalink: /en/:categories/:title/` 추가
- 일본어 포스트: `lang: ja` + `permalink: /ja/:categories/:title/` 추가

### 글 구조

설정 가이드나 절차를 정리하는 포스트에만 적용. 모든 포스트에 일괄 적용하지 않는다.

```markdown
# 개요
(excerpt과 동일한 한 줄 요약)

# 정리
## 1. 첫 번째 단계
## 2. 두 번째 단계
```

| 섹션 | 한국어 | 영어 | 일본어 |
|---|---|---|---|
| 개요 | `# 개요` | `# Overview` | `# 概要` |
| 정리 (절차/설정 가이드) | `# 정리` | `# Steps` | `# 手順` |
| 정리 (개념 설명) | `# 정리` | `# Summary` | `# まとめ` |

### 작성 규칙

- 이미지에 `max-width`를 지정할 때는 `min(원하는값, 100%)`를 사용한다. (예: `style="max-width: min(400px, 100%);"`)

### 다국어

- 한국어(`/ko/`), 영어(`/en/`), 일본어(`/ja/`) 지원
- **모든 포스트는 반드시 한국어, 영어, 일본어 3개 언어 버전을 함께 생성해야 한다.**
- 번역 연결: `ref` 필드로 매칭 (masthead 토글 버튼이 자동 연결)
- 새 카테고리 추가 시:
  - `_pages/categories/`와 `_pages/{lang}/categories/` 모두에 페이지 추가
  - `_data/navigation.yml`에 `menu`/`menu-en`/`menu-ja` 모두에 항목 추가
- 루트 `/`는 브라우저 언어 감지 후 `/{lang}/`으로 자동 리다이렉트
