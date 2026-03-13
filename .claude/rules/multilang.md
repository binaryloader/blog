---
paths:
  - "_posts/**/*.md"
  - "_pages/**/*.md"
  - "_data/navigation.yml"
---

# 다국어 규칙

## 1. 3개 언어 필수 생성

- 모든 포스트는 반드시 한국어, 영어, 일본어 3개 언어 버전을 함께 생성한다
- 한국어: `_posts/ko/`, 영어: `_posts/en/`, 일본어: `_posts/ja/`

## 2. ref 기반 번역 연결

- `ref` 필드로 같은 포스트의 3개 언어 버전을 연결한다
- masthead 토글 버튼이 ref를 기준으로 자동 매칭한다

## 3. 언어별 Front Matter 차이

- 한국어 포스트는 `lang` 필드 없이 작성한다 (nil)
- 영어 포스트는 `lang: en`과 `permalink: /en/:categories/:title/`을 추가한다
- 일본어 포스트는 `lang: ja`와 `permalink: /ja/:categories/:title/`을 추가한다

## 4. 새 카테고리 추가 시 다국어 페이지 동시 생성

- `_pages/categories/`에 한국어 페이지를 추가한다
- `_pages/en/categories/`에 영어 페이지를 추가한다
- `_pages/ja/categories/`에 일본어 페이지를 추가한다
- `_data/navigation.yml`에 `menu`/`menu-en`/`menu-ja` 모두에 항목을 추가한다

## 5. 루트 리다이렉트

루트 `/`는 브라우저 언어 감지 후 `/{lang}/`으로 자동 리다이렉트된다.
