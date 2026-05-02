---
date: 2022-02-02T00:00+09:00
title: "[Jekyll] Minimal Mistakes 테마에서 줄바꿈 속성 변경하기"
ref: minimal-mistakes-change-word-break-and-overflow-wrap
excerpt: "Minimal Mistakes 테마에서 모바일 환경의 가로 스크롤 문제를 해결하기 위한 줄바꿈 속성 변경 방법을 정리한다."
last_modified_at: 2022-02-02T15:08+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/minimal-mistakes-change-word-break-and-overflow-wrap.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/minimal-mistakes-change-word-break-and-overflow-wrap.png"
categories:
  - Development
  - Blog
  - Jekyll
tags:
  - Development
  - Blog
  - Jekyll
  - Minimal Mistakes
  - CSS
  - Responsive
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Blog"
    url: /ko/development/blog/
  - title: "Jekyll"
    url: /ko/development/blog/jekyll/
gallery_result:
  - url: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/before.png
    image_path: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/before.png
    title: "word-break 속성 및 overflow-wrap 속성 지정 전"
  - url: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/after.png
    image_path: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/after.png
    title: "word-break 속성 및 overflow-wrap 속성 지정 후"
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: binaryloader
---

# 개요

Minimal Mistakes 테마에서 모바일 환경의 가로 스크롤 문제를 해결하기 위한 줄바꿈 속성 변경 방법을 정리한다.

# 들어가며

Jekyll 블로그의 테마로 [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/)를 사용하고 있는데 포스트 본문의 단어나 문장에 따라 단말 화면을 벗어나서 렌더링 되는 경우가 있다. 이로 인하여 모바일 환경에서는 포스트 본문에 가로 스크롤이 생기게 되는데 너무 거슬려서 해결 방법을 찾아보았다.

# 정리

## 1. \_base.scss에 word-break 속성과 overflow-wrap 속성 지정

```css
h1,
h2,
h3,
h4,
h5,
h6,
nav,
ul {
  word-break: break-all;
  overflow-wrap: break-word;
}
```

## 2. 결과 확인

{% include gallery caption="word-break 속성 및 overflow-wrap 속성 지정 전과 지정 후" id="gallery_result" %}

# 참고

- <https://wit.nts-corp.com/2017/07/25/4675>
