# blog 규칙

Jekyll 기반 개인 블로그이다. Minimal Mistakes 테마 v4.24.0을 사용하며 GitHub Pages로 blog.binaryloader.io에 배포한다.

## 1. 프로젝트

### 1.1. 기술 스택

- Jekyll (Ruby) + Minimal Mistakes 테마 v4.24.0
- GitHub Pages 배포
- SCSS (Minimal Mistakes 커스텀)
- Node.js (썸네일 생성 도구, JS 빌드)
- Utterances (댓글, 별도 repo `binaryloader/blog-comments`)

### 1.2. 빌드

```bash
bundle exec jekyll serve      # 로컬 서버
bundle exec jekyll build      # 사이트 빌드
npm run build:js              # JS 빌드 (uglify + banner)
npm run watch:js              # JS 변경 감시
```

### 1.3. 다국어 지원

- 한국어(`/ko/`), 영어(`/en/`), 일본어(`/ja/`) 3개 언어를 지원한다
- 모든 포스트는 반드시 3개 언어 버전을 함께 생성한다
- 번역은 `ref` 필드로 연결한다 (masthead 토글 버튼이 자동 매칭)
- 루트 `/`는 브라우저 언어 감지 후 `/{lang}/`으로 자동 리다이렉트된다

### 1.4. 구조

- 포스트는 `_posts/{lang}/{category}/{subcategory}/YYYY-MM-DD-title.md`에 작성한다
- 포스트 에셋은 `assets/image/post/{categories}/{slug}/`에 저장한다
- 썸네일은 `assets/image/thumbnail/`에 저장한다 (header, teaser, instagram, caption)
- 카테고리 페이지는 `_pages/categories/` (한국어)와 `_pages/{lang}/categories/` (타 언어)에 작성한다
- 드래프트는 `_draft/` 디렉토리에 카테고리별 하위 폴더로 관리한다
- 커스텀 JS는 `assets/js/custom/`에 작성한다
- 테마 SCSS는 `_sass/minimal-mistakes/`에 있다
- 썸네일 도구는 `tools/thumbnail/`에 있다

## 2. 규칙

세부 규칙은 `.claude/rules/`에 주제별로 분리되어 있다.

- `frontmatter.md`는 Front Matter 규칙을 정의한다
- `writing.md`는 글 구조와 작성 스타일을 정의한다
- `multilang.md`는 다국어 생성/번역 규칙을 정의한다
- `thumbnail.md`는 썸네일 생성 도구와 규칙을 정의한다
- `category.md`는 카테고리 네이밍과 설정을 정의한다
- `liquid.md`는 Liquid 템플릿 주의사항을 정의한다
- `css.md`는 SCSS/CSS 이슈를 정의한다

## 3. Agents 구조

에이전트 파일은 `.claude/agents/`에 역할별로 분리되어 있다.

- `blog-writer.md`는 3개 언어 포스트 동시 작성을 담당한다
- `blog-translator.md`는 한국어 원본의 영어/일본어 번역을 담당한다
- `blog-thumbnail.md`는 포스트별 커스텀 일러스트와 썸네일 생성을 담당한다

## 4. Skills 구조

스킬 파일은 `.claude/skills/`에 워크플로우별로 분리되어 있다.

- `write-post`는 포스트 작성 → 번역 검수 → 썸네일 생성 전체 플로우를 실행한다
- `translate`는 기존 한국어 포스트를 영어/일본어로 번역한다
