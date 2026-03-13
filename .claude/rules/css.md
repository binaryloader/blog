---
paths:
  - "_sass/**/*.scss"
  - "assets/css/**"
---

# CSS 규칙

## 1. 드롭다운 overflow 이슈

`.greedy-nav .visible-links`의 기본 `overflow: hidden`이 드롭다운을 잘라먹는다. `overflow: visible`로 override해야 한다.
