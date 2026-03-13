---
paths:
  - "_includes/**"
  - "_layouts/**"
  - "*.html"
---

# Liquid 규칙

## 1. 변수 스코프 오염 주의

Liquid에는 블록 스코프가 없다. include 안에서 `assign`한 변수가 호출자의 변수를 덮어쓴다.

- 사례: `page__meta.html`에서 `current_lang = "ko-KR"` → `posts-category.html` 루프의 `current_lang`이 오염되어 첫 포스트만 표시됨
- 해결: include 내부에서는 고유한 변수명을 사용한다 (`current_lang` → `meta_lang`)

## 2. bracket 내 복잡한 표현식 불가

bracket 안에 파이프(`|`)나 배열 인덱싱을 직접 사용할 수 없다. 반드시 `assign`으로 변수를 먼저 생성한 후 bracket에 사용한다.

- `site.data.ui-text[page.lang | default: site.locale]` → 에러
- `site.data.hash[category[0]]` → 조회 실패 (nil 반환)

## 3. 데이터 파일명 대시 불가

데이터 파일명에 대시(`-`)를 사용하면 빼기 연산으로 해석된다. 반드시 언더스코어를 사용한다.

- `_data/category-display-names.yml` → `site.data.category-display-names`가 빼기 연산으로 해석됨
- `_data/category_display_names.yml` → 올바른 접근

## 4. include_cached와 다국어 비호환

`include_cached`는 첫 호출 결과를 캐싱하므로 언어별 다른 출력이 필요한 include에는 사용할 수 없다. masthead, footer 등은 `include`(캐시 없음)로 변경한다.

## 5. 한국어 포스트 필터링

- 한국어 포스트는 `lang` 필드가 없다 (nil)
- 필터링: `where_exp: "p", "p.lang == nil"`
- 빈 문자열("")은 truthy이므로 `unless post.lang`은 nil일 때만 통과한다
