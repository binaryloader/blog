---
paths:
  - "_posts/**/*.md"
  - "_pages/categories/**"
  - "_data/*.yml"
---

# 카테고리 규칙

## 1. 카테고리 네이밍

- 복합 단어 카테고리는 대시로 연결한다 (예: `Software-Engineering`, `Code-Quality`)
- Jekyll이 URL 슬러그 생성에 `categories` 값을 그대로 사용하기 때문이다 (공백은 `%20`이 된다)

## 2. 필드별 대시/공백 구분

대시를 사용하는 필드는 아래와 같다.

- 포스트 `categories`
- 카테고리 페이지 `taxonomy`
- navigation.yml `category`

공백을 사용하는 필드는 아래와 같다.

- 포스트 `title` 프리픽스
- 포스트 `depth` title
- 카테고리 페이지 `title`
- navigation.yml `title`
- `tags`

## 3. category_display_names.yml 매핑

복합 단어 카테고리를 추가할 때 `_data/category_display_names.yml`에 표시명 매핑을 함께 추가한다.

## 4. Writing 카테고리 정렬

Writing 카테고리는 알파벳 순을 무시하고 제일 마지막에 배치한다.
