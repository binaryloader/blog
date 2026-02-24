---
title: "[Jekyll] Markdown画像にライトボックス（Magnific Popup）を自動適用する"
ref: jekyll-markdown-image-lightbox
excerpt: "Minimal Mistakesテーマでマークダウン画像クリック時にライトボックスが動作しない問題をjQuery自動ラップで解決する。"
date: 2026-02-22T23:40+09:00
last_modified_at: 2026-02-22T23:40+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/jekyll-markdown-image-lightbox.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/jekyll-markdown-image-lightbox.png"
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
    url: /ja/development/
  - title: "Blog"
    url: /ja/development/blog/
  - title: "Jekyll"
    url: /ja/development/blog/jekyll/
---

# 概要

Minimal Mistakesテーマでマークダウン画像クリック時にライトボックスが動作しない問題をjQuery自動ラップで解決する。

# 手順

## 1. 問題

Minimal Mistakesテーマにはライトボックスライブラリ「Magnific Popup」が内蔵されている。画像をクリックするとオーバーレイで拡大表示してくれる機能だ。

しかしマークダウンの`![alt](url)`構文で挿入した画像はクリックしても何も反応しない。HTMLで直接`<a>`タグを書いた画像だけがライトボックスが動作する。

```markdown
<!-- ライトボックス動作しない -->
![スクリーンショット](/assets/image/post/screenshot.png)

<!-- ライトボックス動作する -->
<a href="/assets/image/post/screenshot.png" class="image-popup">
  <img src="/assets/image/post/screenshot.png" alt="スクリーンショット">
</a>
```

画像を挿入するたびにHTMLを直接書かなければならないなら、マークダウンを使う意味がない。

## 2. 原因

マークダウンの`![alt](url)`構文はJekyllがHTMLに変換する時`<img>`タグだけを生成する。

```html
<!-- マークダウンレンダリング結果 -->
<img src="/assets/image/post/screenshot.png" alt="スクリーンショット">
```

Magnific Popupは`<a>`タグに`image-popup`クラスがある要素を対象に動作する。単独の`<img>`タグはMagnific Popupの初期化対象ではないためクリックイベントが登録されない。

## 3. 解決

`assets/js/_main.js`にjQueryコードを追加して単独の`<img>`タグを自動的に`<a>`タグでラップする。

```javascript
// 単独画像をアンカータグでラップ
$(".page__content img").each(function() {
  var $img = $(this);
  if (!$img.parent("a").length) {
    $img.wrap('<a href="' + $img.attr("src") + '"></a>');
  }
});

// 画像リンクにライトボックスクラスを付与
$(
  "a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif'],a[href$='.webp']"
).has("> img").addClass("image-popup");
```

最初のブロックは`.page__content`内の全`<img>`を巡回し親が`<a>`でないものだけをラップする。すでに`<a>`で囲まれた画像（リンク付き画像）はそのままにする。

2番目のブロックは画像ファイル拡張子で終わる`<a>`タグのうち直接の子要素として`<img>`を持つものに`image-popup`クラスを付与する。このクラスがあってこそMagnific Popupが初期化される。

## 4. 動作フロー

全体の流れを整理すると以下の通りだ。

```
+-------------------------------+
| マークダウン                  |
| ![alt](url)                   |
+-------------------------------+
               |
               v
+-------------------------------+
| Jekyllレンダリング            |
| <img src="url" alt="alt">     |
+-------------------------------+
               |
               v
+-------------------------------+
| jQuery自動ラップ              |
| <a href="url"><img ...></a>   |
+-------------------------------+
               |
               v
+-------------------------------+
| CSSクラス付与                 |
| .image-popup追加              |
+-------------------------------+
               |
               v
+-------------------------------+
| Magnific Popup初期化          |
| クリックでライトボックス表示  |
+-------------------------------+
```

既存のMagnific Popup初期化コードは修正不要だ。`image-popup`クラスが付与された要素を対象に動作するのでラップとクラス付与を追加するだけで済む。

## 5. 適用

JSを修正したのでビルドが必要だ。

```bash
npm run build:js
```

このコマンドは`_main.js`をuglifyして`main.min.js`に出力する。ビルドされたファイルをコミットしてデプロイすれば全てのマークダウン画像にライトボックスが自動適用される。

# 参考

- <https://api.jquery.com/wrap/>
- <https://dimsemenov.com/plugins/magnific-popup/>
- <https://mmistakes.github.io/minimal-mistakes/docs/helpers/#gallery>
