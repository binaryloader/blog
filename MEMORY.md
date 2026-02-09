# Blog Project Memory

## Liquid 버그 패턴 (주의)

### 변수 스코프 오염
- Liquid에는 블록 스코프가 없음. include 안에서 `assign`한 변수가 호출자의 변수를 덮어씀
- 사례: `page__meta.html`에서 `current_lang = "ko-KR"` 설정 → `posts-category.html` 루프의 `current_lang`이 오염되어 첫 포스트만 표시됨
- 해결: include 내부에서는 고유한 변수명 사용 (`current_lang` → `meta_lang`)

### bracket 내 pipe 필터 불가
- `site.data.ui-text[page.lang | default: site.locale]` → 에러
- 반드시 `assign`으로 변수 먼저 생성 후 bracket에 사용

### include_cached와 다국어
- `include_cached`는 첫 호출 결과를 캐싱하므로 언어별 다른 출력이 필요한 include에는 사용 불가
- masthead, footer 등은 `include` (캐시 없음)로 변경 필수

## 한국어 포스트 언어 필터링
- 한국어 포스트는 `lang` 필드가 없음 (nil)
- 필터링: `where_exp: "p", "p.lang == nil"` 사용
- Liquid에서 빈 문자열("")은 truthy → `unless post.lang`은 nil일 때만 통과

## 드롭다운 CSS
- `.greedy-nav .visible-links`의 기본 `overflow: hidden`이 드롭다운을 잘라먹음
- `overflow: visible`로 override 필요

## 다국어 필수 규칙
- **모든 포스트는 반드시 한국어(ko), 영어(en), 일본어(ja) 3개 언어로 생성해야 함**
- 새 포스트 생성 시 3개 언어 모두 만들고 `ref` 동일하게 설정
- 새 카테고리 추가 시 `_pages/categories/` + `_pages/{lang}/categories/` + `navigation.yml`의 `menu`/`menu-en`/`menu-ja` 모두 수정

## 기타 참고
- `_config.yml`에서 `published: false`가 기본값 → 새 포스트에 `published: true` 필수
