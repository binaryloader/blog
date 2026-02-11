# 블로그 메모리

블로그 개발 중 발견한 이슈와 해결 방법.

## Liquid

### 변수 스코프 오염
- 블록 스코프 없음. include 안에서 `assign`한 변수가 호출자의 변수를 덮어씀
- 사례: `page__meta.html`에서 `current_lang = "ko-KR"` → `posts-category.html` 루프의 `current_lang`이 오염되어 첫 포스트만 표시됨
- 해결: include 내부에서는 고유한 변수명 사용 (`current_lang` → `meta_lang`)

### bracket 내 pipe 필터 불가
- `site.data.ui-text[page.lang | default: site.locale]` → 에러
- 반드시 `assign`으로 변수 먼저 생성 후 bracket에 사용

### include_cached와 다국어
- 첫 호출 결과를 캐싱 → 언어별 다른 출력이 필요한 include에는 사용 불가
- masthead, footer 등은 `include`(캐시 없음)로 변경 필수

### 한국어 포스트 필터링
- 한국어 포스트는 `lang` 필드 없음 (nil)
- 필터링: `where_exp: "p", "p.lang == nil"`
- 빈 문자열("")은 truthy → `unless post.lang`은 nil일 때만 통과

## CSS

### 드롭다운
- `.greedy-nav .visible-links`의 기본 `overflow: hidden`이 드롭다운을 잘라먹음
- `overflow: visible`로 override 필요
