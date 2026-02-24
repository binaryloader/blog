---
title: "[Jekyll] Markdown 이미지에 라이트박스(Magnific Popup) 자동 적용하기"
ref: jekyll-markdown-image-lightbox
excerpt: "Minimal Mistakes 테마에서 마크다운 이미지 클릭 시 라이트박스가 동작하지 않는 문제를 jQuery 자동 래핑으로 해결한다."
date: 2026-02-22T23:40+09:00
last_modified_at: 2026-02-22T23:40+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/jekyll-markdown-image-lightbox.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/jekyll-markdown-image-lightbox.png"
categories:
  - Development
  - Blog
  - Jekyll
tags:
  - Jekyll
  - Minimal Mistakes
  - Magnific Popup
  - JavaScript
  - jQuery
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Blog"
    url: /ko/development/blog/
  - title: "Jekyll"
    url: /ko/development/blog/jekyll/
---

# 개요

Minimal Mistakes 테마에서 마크다운 이미지 클릭 시 라이트박스가 동작하지 않는 문제를 jQuery 자동 래핑으로 해결한다.

# 정리

## 1. 문제

Minimal Mistakes 테마에는 Magnific Popup이라는 라이트박스 라이브러리가 내장되어 있다. 이미지를 클릭하면 오버레이로 확대해서 보여주는 기능이다.

그런데 마크다운에서 `![alt](url)` 문법으로 삽입한 이미지는 클릭해도 아무 반응이 없다. HTML로 직접 `<a>` 태그를 감싸서 작성한 이미지만 라이트박스가 동작한다.

```markdown
<!-- 라이트박스 동작 안 함 -->
![스크린샷](/assets/image/post/screenshot.png)

<!-- 라이트박스 동작 -->
<a href="/assets/image/post/screenshot.png" class="image-popup">
  <img src="/assets/image/post/screenshot.png" alt="스크린샷">
</a>
```

매번 이미지를 삽입할 때마다 HTML을 직접 써야 한다면 마크다운을 쓰는 의미가 없다.

## 2. 원인

마크다운의 `![alt](url)` 문법은 Jekyll이 HTML로 변환할 때 `<img>` 태그만 생성한다.

```html
<!-- 마크다운 렌더링 결과 -->
<img src="/assets/image/post/screenshot.png" alt="스크린샷">
```

Magnific Popup은 `<a>` 태그에 `image-popup` 클래스가 있는 요소를 대상으로 동작한다. 단독 `<img>` 태그는 Magnific Popup의 초기화 대상이 아니기 때문에 클릭 이벤트가 등록되지 않는다.

## 3. 해결

`assets/js/_main.js`에 jQuery 코드를 추가해서 단독 `<img>` 태그를 자동으로 `<a>` 태그로 래핑한다.

```javascript
// 단독 이미지를 앵커 태그로 래핑
$(".page__content img").each(function() {
  var $img = $(this);
  if (!$img.parent("a").length) {
    $img.wrap('<a href="' + $img.attr("src") + '"></a>');
  }
});

// 이미지 링크에 라이트박스 클래스 부여
$(
  "a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif'],a[href$='.webp']"
).has("> img").addClass("image-popup");
```

첫 번째 블록은 `.page__content` 안의 모든 `<img>`를 순회하면서 부모가 `<a>`가 아닌 경우에만 래핑한다. 이미 `<a>`로 감싸진 이미지(링크가 걸린 이미지)는 건드리지 않는다.

두 번째 블록은 이미지 파일 확장자로 끝나는 `<a>` 태그 중 직접 자식으로 `<img>`를 가진 것에 `image-popup` 클래스를 부여한다. 이 클래스가 있어야 Magnific Popup이 초기화된다.

## 4. 동작 흐름

전체 흐름을 정리하면 다음과 같다.

```
+-------------------------------+
| 마크다운                      |
| ![alt](url)                   |
+-------------------------------+
               |
               v
+-------------------------------+
| Jekyll 렌더링                 |
| <img src="url" alt="alt">     |
+-------------------------------+
               |
               v
+-------------------------------+
| jQuery 자동 래핑              |
| <a href="url"><img ...></a>   |
+-------------------------------+
               |
               v
+-------------------------------+
| CSS 클래스 부여               |
| .image-popup 추가             |
+-------------------------------+
               |
               v
+-------------------------------+
| Magnific Popup 초기화         |
| 클릭 시 라이트박스 오버레이   |
+-------------------------------+
```

기존에 있던 Magnific Popup 초기화 코드는 수정할 필요가 없다. `image-popup` 클래스가 부여된 요소를 대상으로 동작하기 때문에 래핑과 클래스 부여만 추가하면 된다.

## 5. 적용

JS를 수정했으므로 빌드가 필요하다.

```bash
npm run build:js
```

이 명령은 `_main.js`를 uglify해서 `main.min.js`로 출력한다. 빌드된 파일을 커밋하고 배포하면 모든 마크다운 이미지에 라이트박스가 자동 적용된다.

# 참고

- <https://api.jquery.com/wrap/>
- <https://dimsemenov.com/plugins/magnific-popup/>
- <https://mmistakes.github.io/minimal-mistakes/docs/helpers/#gallery>
