---
paths:
  - "tools/thumbnail/**"
  - "assets/image/thumbnail/**"
  - "_posts/**/*.md"
---

# 썸네일 규칙

## 1. 생성 도구 사용법

`tools/thumbnail/`의 Node.js 도구로 자동 생성한다.

```bash
node tools/thumbnail/generate.js <파일경로>       # 단일 포스트
node tools/thumbnail/generate.js --all            # 전체 (ko/en/ja 3개 언어)
node tools/thumbnail/generate.js --all --lang ko  # 특정 언어만
node tools/thumbnail/generate.js --all --force    # 강제 재생성
```

## 2. 디렉토리별 용도와 크기

| 디렉토리 | 크기 | 용도 |
|---|---|---|
| `instagram/{lang}/` | 1080x1080 | 인스타그램용 (맞춤 일러스트 + 카테고리/제목/태그/푸터) |
| `header/` | 1920x640 | 블로그 헤더 오버레이용 (패턴만, 언어 공통) |
| `teaser/{lang}/` | 600x600 | 관련글 그리드용 (패턴 + 카테고리/제목) |
| `caption/{lang}/` | - | 인스타그램 캡션 텍스트 (.txt) |

## 3. 일러스트 규칙

- Instagram 썸네일은 `lib/illustrations.js`에 정의된 포스트별 맞춤 SVG 일러스트를 사용한다
- 각 포스트의 `ref`를 키로 매핑한다
- 모든 포스트의 Instagram 썸네일은 반드시 커스텀 일러스트를 생성한다. 일러스트 없이 카테고리 기반 데코레이션만으로 생성하지 않는다
- 새 포스트 추가 시 `illustrations.js`에 해당 ref의 일러스트 함수와 `ILLUSTRATION_MAP` 항목을 추가한다

## 4. 테마/패턴 규칙

카테고리 기반 12개 배경 패턴(circuit, hexagon, pipeline, code-flow, branch-tree, network, geometry, dots, connected, blocks, waves, default)이 자동 적용되며 `ref` 해시로 결정적 출력을 보장한다. header와 teaser에는 패턴이, Instagram에는 패턴 + 일러스트가 적용된다.

## 5. header/teaser 언어 구분

- header 이미지는 패턴만 포함하므로 언어 공통이다
- teaser, instagram, caption은 텍스트를 포함하므로 언어별로 분리된다

## 6. 포스트 연동 규칙

- 새 포스트 작성 시 3개 언어 모두 썸네일을 함께 생성한다
- 포스트의 `header` 블록을 생성된 이미지 경로로 설정한다 (teaser는 언어별 경로)
- `tools/thumbnail/update-frontmatter.js`로 전체 포스트의 header 블록을 일괄 갱신할 수 있다
