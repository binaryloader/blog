---
title: "[Jekyll] Auto-Apply Lightbox (Magnific Popup) to Markdown Images"
ref: jekyll-markdown-image-lightbox
excerpt: "Fix the issue where clicking markdown images in Minimal Mistakes theme doesn't trigger lightbox, using jQuery auto-wrapping."
date: 2026-02-22T23:40+09:00
last_modified_at: 2026-02-22T23:40+09:00
published: true
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/jekyll-markdown-image-lightbox.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/jekyll-markdown-image-lightbox.png"
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
    url: /en/development/
  - title: "Blog"
    url: /en/development/blog/
  - title: "Jekyll"
    url: /en/development/blog/jekyll/
---

# Overview

Fix the issue where clicking markdown images in Minimal Mistakes theme doesn't trigger lightbox, using jQuery auto-wrapping.

# Steps

## 1. Problem

The Minimal Mistakes theme ships with Magnific Popup, a lightbox library that enlarges images in an overlay when clicked.

However, images inserted with the markdown `![alt](url)` syntax don't respond to clicks at all. Only images manually wrapped in `<a>` tags in raw HTML trigger the lightbox.

```markdown
<!-- Lightbox does NOT work -->
![screenshot](/assets/image/post/screenshot.png)

<!-- Lightbox works -->
<a href="/assets/image/post/screenshot.png" class="image-popup">
  <img src="/assets/image/post/screenshot.png" alt="screenshot">
</a>
```

Having to write raw HTML every time you insert an image defeats the purpose of using markdown.

## 2. Cause

The markdown `![alt](url)` syntax produces only a bare `<img>` tag when Jekyll renders it to HTML.

```html
<!-- Markdown rendering result -->
<img src="/assets/image/post/screenshot.png" alt="screenshot">
```

Magnific Popup targets elements with the `image-popup` class on an `<a>` tag. A standalone `<img>` tag is not a target for Magnific Popup initialization, so no click event is registered.

## 3. Solution

Add jQuery code to `assets/js/_main.js` to automatically wrap standalone `<img>` tags in `<a>` tags.

```javascript
// Wrap standalone images in anchor tags
$(".page__content img").each(function() {
  var $img = $(this);
  if (!$img.parent("a").length) {
    $img.wrap('<a href="' + $img.attr("src") + '"></a>');
  }
});

// Add lightbox class to image links
$(
  "a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif'],a[href$='.webp']"
).has("> img").addClass("image-popup");
```

The first block iterates over all `<img>` elements inside `.page__content` and wraps only those whose parent is not already an `<a>` tag. Images that already have a link wrapper are left untouched.

The second block finds all `<a>` tags whose `href` ends with an image file extension and that have a direct `<img>` child, then adds the `image-popup` class. This class is what Magnific Popup uses for initialization.

## 4. How It Works

Here's the complete flow.

```
+-------------------------------+
| Markdown                      |
| ![alt](url)                   |
+-------------------------------+
               |
               v
+-------------------------------+
| Jekyll Rendering              |
| <img src="url" alt="alt">     |
+-------------------------------+
               |
               v
+-------------------------------+
| jQuery Auto-Wrap              |
| <a href="url"><img ...></a>   |
+-------------------------------+
               |
               v
+-------------------------------+
| CSS Class Assignment          |
| .image-popup added            |
+-------------------------------+
               |
               v
+-------------------------------+
| Magnific Popup Init           |
| Click triggers lightbox       |
+-------------------------------+
```

The existing Magnific Popup initialization code requires no modification. It targets elements with the `image-popup` class, so adding the wrapping and class assignment is all that's needed.

## 5. Deployment

Since the JS was modified, a build step is required.

```bash
npm run build:js
```

This command uglifies `_main.js` into `main.min.js`. Commit the built file and deploy — all markdown images will automatically get lightbox support.

# References

- <https://dimsemenov.com/plugins/magnific-popup/>
- <https://api.jquery.com/wrap/>
- <https://mmistakes.github.io/minimal-mistakes/docs/helpers/#gallery>
