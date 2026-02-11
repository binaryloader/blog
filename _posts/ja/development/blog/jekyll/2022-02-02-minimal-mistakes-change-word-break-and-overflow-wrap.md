---
date: 2022-02-02T00:00+09:00
title: "[Jekyll] Minimal Mistakesテーマで改行プロパティを変更する"
ref: minimal-mistakes-change-word-break-and-overflow-wrap
excerpt: "Minimal Mistakesテーマでモバイル環境の横スクロール問題を解決するための改行プロパティの変更方法をまとめる。"
lang: ja
last_modified_at: 2022-02-02T15:08+09:00
published: true
header:
  overlay_color: "#202020"
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
    url: /ja/development/
  - title: "Blog"
    url: /ja/development/blog/
  - title: "Jekyll"
    url: /ja/development/blog/jekyll/
gallery_result:
  - url: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/before.png
    image_path: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/before.png
    title: "word-breakプロパティおよびoverflow-wrapプロパティ指定前"
  - url: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/after.png
    image_path: /assets/image/post/development/blog/jekyll/minimal-mistakes-change-word-break-and-overflow-wrap/after.png
    title: "word-breakプロパティおよびoverflow-wrapプロパティ指定後"
---

# 概要

Minimal Mistakesテーマでモバイル環境の横スクロール問題を解決するための改行プロパティの変更方法をまとめる。

# はじめに

Jekyllブログのテーマとして[Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/)を使用しているが、記事本文の単語や文章によっては端末の画面をはみ出してレンダリングされる場合がある。これによりモバイル環境では記事本文に横スクロールが発生してしまい、非常に気になるので解決方法を調べた。

# 手順

## 1. \_base.scssにword-breakプロパティとoverflow-wrapプロパティを指定

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

## 2. 結果の確認

{% include gallery caption="word-breakプロパティおよびoverflow-wrapプロパティ指定前と指定後" id="gallery_result" %}

# 参考

- <https://wit.nts-corp.com/2017/07/25/4675>
