---
date: 2022-02-02T00:00+09:00
title: "[Jekyll] Changing Word Break Properties in the Minimal Mistakes Theme"
ref: minimal-mistakes-change-word-break-and-overflow-wrap
excerpt: "How to change word break properties in the Minimal Mistakes theme to fix horizontal scrolling on mobile."
lang: en
last_modified_at: 2022-02-02T15:08+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/minimal-mistakes-change-word-break-and-overflow-wrap.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/minimal-mistakes-change-word-break-and-overflow-wrap.png"
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
    url: /en/development/
  - title: "Blog"
    url: /en/development/blog/
  - title: "Jekyll"
    url: /en/development/blog/jekyll/
gallery_result:
  - url: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/before.png
    image_path: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/before.png
    title: "Before applying word-break and overflow-wrap properties"
  - url: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/after.png
    image_path: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/after.png
    title: "After applying word-break and overflow-wrap properties"
---

# Overview

This post covers how to change word break properties in the Minimal Mistakes theme to fix horizontal scrolling on mobile.

# Introduction

I'm using [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/) as the theme for my Jekyll blog. Depending on the words or sentences in the post body, some content renders beyond the device screen width. This causes horizontal scrolling on mobile, which is very annoying, so I looked for a solution.

# Steps

## 1. Add word-break and overflow-wrap Properties to \_base.scss

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

## 2. Verify the Result

{% include gallery caption="Before and after applying word-break and overflow-wrap properties" id="gallery_result" %}

# References

- <https://wit.nts-corp.com/2017/07/25/4675>
