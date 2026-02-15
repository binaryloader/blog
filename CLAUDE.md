# blog 규칙

Jekyll 기반 개인 블로그 — Minimal Mistakes 테마 v4.24.0, GitHub Pages로 blog.binaryloader.io에 배포

## 프로젝트

### 빌드

```bash
bundle exec jekyll serve      # 로컬 서버
bundle exec jekyll build      # 사이트 빌드
npm run build:js              # JS 빌드 (uglify + banner)
npm run watch:js              # JS 변경 감시
```

### 구조

- **댓글**: Utterances (별도 repo `binaryloader/blog-comments` 사용)
- **드래프트**: `_draft/` 디렉토리에 카테고리별 하위 폴더
- **카테고리 페이지**: `_pages/categories/` (한국어), `_pages/{lang}/categories/` (타 언어)
- **커스텀 JS**: `assets/js/custom/` (예: copy-code-button.js)
- **테마**: Minimal Mistakes (gemspec 기반, `_sass/minimal-mistakes/`에 SCSS 포함)
- **포스트**: `_posts/{lang}/{category}/{subcategory}/YYYY-MM-DD-title.md`
  - 한국어: `/ko/...`, 영어: `/en/...`, 일본어: `/ja/...`
- **포스트 에셋**: `assets/image/post/{categories}/{slug}/` — 포스트의 카테고리 뎁스와 동일한 경로 (예: `assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/`)
- **썸네일**: `assets/image/thumbnail/` — 용도별·언어별 하위 폴더로 분리
  - `instagram/{lang}/` — 1080x1080 인스타그램용 (다크 배경 + 시안 액센트 + 카테고리/제목/태그/푸터)
  - `header/` — 1920x640 블로그 헤더 오버레이용 (패턴만, 텍스트 없음, 언어 공통)
  - `teaser/{lang}/` — 600x600 관련글 그리드용 (패턴 + 카테고리/제목)
  - `caption/{lang}/` — 인스타그램 캡션 텍스트 (.txt)

## 규칙

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
  overlay_image: "/assets/image/thumbnail/header/{ref}.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/{lang}/{ref}.png"
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

- `published: true`를 명시한다 (기본값 false)
- `date`/`last_modified_at`는 현재 한국 시간 기준이다. `date` 명령어로 확인 후 과거 시간을 사용한다 (미래 시간은 빌드되지 않는다)
- 영어 포스트는 `lang: en`과 `permalink: /en/:categories/:title/`를 추가한다
- 일본어 포스트는 `lang: ja`와 `permalink: /ja/:categories/:title/`를 추가한다

### 글 구조

설정 가이드나 절차를 정리하는 포스트에만 적용한다. 모든 포스트에 일괄 적용하지 않는다.

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

### 다국어

- 한국어(`/ko/`), 영어(`/en/`), 일본어(`/ja/`)를 지원한다
- **모든 포스트는 반드시 한국어, 영어, 일본어 3개 언어 버전을 함께 생성해야 한다.**
- 번역은 `ref` 필드로 연결한다 (masthead 토글 버튼이 자동 매칭)
- 새 카테고리 추가 시:
  - `_pages/categories/`와 `_pages/{lang}/categories/` 모두에 페이지를 추가한다
  - `_data/navigation.yml`에 `menu`/`menu-en`/`menu-ja` 모두에 항목을 추가한다
- 루트 `/`는 브라우저 언어 감지 후 `/{lang}/`으로 자동 리다이렉트된다

### 썸네일

`tools/thumbnail/`의 Node.js 도구로 자동 생성한다. 카테고리 기반 12개 테마(circuit, hexagon, pipeline, code-flow, branch-tree, network, geometry, dots, connected, blocks, waves, default)가 자동 적용되며 `ref` 해시로 결정적 출력을 보장한다.

```bash
node tools/thumbnail/generate.js <파일경로>       # 단일 포스트
node tools/thumbnail/generate.js --all            # 전체 (ko/en/ja 3개 언어)
node tools/thumbnail/generate.js --all --lang ko  # 특정 언어만
node tools/thumbnail/generate.js --all --force    # 강제 재생성
```

- 새 포스트 작성 시 3개 언어 모두 썸네일을 함께 생성한다
- 포스트의 `header` 블록을 생성된 이미지 경로로 설정한다 (teaser는 언어별 경로)
- `tools/thumbnail/update-frontmatter.js`로 전체 포스트의 header 블록을 일괄 갱신할 수 있다
- header 이미지는 패턴만 포함하므로 언어 공통이고 teaser/instagram/caption은 언어별로 분리된다

### 작성

- Writing 카테고리는 알파벳 순을 무시하고 제일 마지막에 배치한다
- 수학 관련 태그는 `Mathematics`를 사용한다 (`Math` 아님)
- 이미지에 `max-width`를 지정할 때는 `min(원하는값, 100%)`를 사용한다 (예: `style="max-width: min(400px, 100%);"`)
- 참고 섹션의 링크는 타이틀 없이 URL만 표기한다 (예: `- <https://example.com>`)
- 코드 예제가 실제 저장소의 소스 코드를 참조하는 경우 개행과 버전을 실제 소스와 일치시킨다
