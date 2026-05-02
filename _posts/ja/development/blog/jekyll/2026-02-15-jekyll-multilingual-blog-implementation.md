---
title: "[Jekyll] プラグインなしでJekyllブログの多言語（韓/英/日）を実装する"
ref: jekyll-multilingual-blog-implementation
excerpt: "JekyllとMinimal Mistakesテーマでプラグインなしに韓国語、英語、日本語の3言語をサポートするブログを実装した経験を共有する。"
date: 2026-02-15T00:30+09:00
last_modified_at: 2026-02-15T00:30+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/jekyll-multilingual-blog-implementation.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/jekyll-multilingual-blog-implementation.png"
categories:
  - Development
  - Blog
  - Jekyll
tags:
  - Development
  - Blog
  - Jekyll
  - i18n
  - Multilingual
  - Minimal Mistakes
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Blog"
    url: /ja/development/blog/
  - title: "Jekyll"
    url: /ja/development/blog/jekyll/
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: Claude
---

# 概要

JekyllとMinimal Mistakesテーマでプラグインなしに韓国語、英語、日本語の3言語をサポートするブログを実装した経験を共有する。

# 背景

ブログを韓国語だけで運営するのはもったいなかった。技術ブログの特性上海外の読者もアクセスできれば良いと思ったしAI翻訳の品質が十分に上がってきたので3言語で運営することにした。

Jekyll多言語プラグインとして`jekyll-polyglot`や`jekyll-multiple-languages-plugin`などがあるがGitHub Pagesで対応していないプラグインがほとんどでテーマとの互換性問題も懸念だった。結局Liquidテンプレートと`_config.yml`の設定だけで直接実装することにした。

# 全体構造

## 1. ディレクトリレイアウト

ポストとページを言語別ディレクトリに分離するのが核心だ。

```
_posts/
├── ko/          # 韓国語（デフォルト言語）
│   ├── development/
│   ├── pc/
│   └── ...
├── en/          # 英語
│   ├── development/
│   ├── pc/
│   └── ...
└── ja/          # 日本語
    ├── development/
    ├── pc/
    └── ...

_pages/
├── categories/        # 韓国語カテゴリページ
├── en/categories/     # 英語カテゴリページ
└── ja/categories/     # 日本語カテゴリページ
```

## 2. URL構造

すべてのURLの前に言語プレフィックスを付ける。

| 言語 | URLパターン | 例 |
|------|------------|-----|
| 韓国語 | `/ko/カテゴリ/タイトル/` | `/ko/development/blog/jekyll/post-title/` |
| 英語 | `/en/categories/title/` | `/en/development/blog/jekyll/post-title/` |
| 日本語 | `/ja/カテゴリ/タイトル/` | `/ja/development/blog/jekyll/post-title/` |

# 主要な実装

## 1. _config.ymlスコープ設定

`_config.yml`の`defaults`セクションでディレクトリパスに基づいて言語別のデフォルト値を設定する。これが多言語システム全体の基盤となる。

```yaml
defaults:
  # 韓国語ポスト
  - scope:
      path: "_posts/ko"
      type: posts
    values:
      permalink: /ko/:categories/:title/
      sidebar:
        nav: "menu"

  # 英語ポスト
  - scope:
      path: "_posts/en"
      type: posts
    values:
      lang: en
      permalink: /en/:categories/:title/
      sidebar:
        nav: "menu-en"

  # 日本語ポスト
  - scope:
      path: "_posts/ja"
      type: posts
    values:
      lang: ja
      permalink: /ja/:categories/:title/
      sidebar:
        nav: "menu-ja"
```

ここで重要な設計判断がある。韓国語ポストには`lang`フィールドを設定しない。韓国語がデフォルト言語なので`lang`がなければ韓国語として扱う方式だ。英語と日本語のポストだけが明示的に`lang: en`、`lang: ja`を持つ。この非対称構造がその後のLiquidフィルタリング全体に影響する。

## 2. refフィールドで翻訳連結

同じ記事の韓/英/日バージョンを連結するために`ref`フィールドを使用する。Front Matterに同じ`ref`値を入れるとLiquidで翻訳バージョンを見つけることができる。

```yaml
# 韓国語ポスト
---
title: "SSH 키 생성하기"
ref: generating-ssh-keys
---

# 英語ポスト
---
title: "Generating SSH Keys"
ref: generating-ssh-keys
lang: en
---

# 日本語ポスト
---
title: "SSH鍵の生成"
ref: generating-ssh-keys
lang: ja
---
```

mastheadの言語切り替えドロップダウンでこの`ref`をもとに翻訳バージョンのURLを探す。

```liquid
{% raw %}{% assign ref_posts = site.posts | where: "ref", page.ref %}
{% for p in ref_posts %}
  {% if p.lang == target_lang %}
    <a href="{{ p.url }}">{{ lang_name }}</a>
  {% endif %}
{% endfor %}{% endraw %}
```

翻訳がない場合は該当言語のホームページにフォールバックする。

## 3. 言語検出とリダイレクト

ルートURL（`/`）にアクセスするとブラウザの言語を検出して適切な言語ページにリダイレクトする。

```javascript
function detectLang() {
  var supported = ['ko', 'en', 'ja'];
  // 1. localStorageに保存された言語設定を確認
  var stored = localStorage.getItem('preferred_lang');
  if (stored && supported.indexOf(stored) !== -1) return stored;

  // 2. ブラウザ言語を検出
  var bl = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (bl.indexOf('ko') === 0) return 'ko';
  if (bl.indexOf('ja') === 0) return 'ja';
  if (bl.indexOf('en') === 0) return 'en';

  // 3. デフォルト
  return 'en';
}
window.location.replace('/' + detectLang() + '/');
```

ユーザーが言語を直接選択するとlocalStorageに保存され以降のアクセス時にその設定が優先される。

## 4. 戻るボタン時の言語維持

ブラウザの戻るボタンを押した時に言語が混在する問題があった。例えば英語で閲覧中に韓国語に切り替えた後戻るボタンを押すと再び英語ページが表示される。`performance.getEntriesByType('navigation')`で戻る/進むナビゲーションを検出しlocalStorageの設定言語にリダイレクトすることで解決した。

```javascript
var nav = performance.getEntriesByType('navigation')[0];
if (nav && nav.type === 'back_forward') {
  var pref = localStorage.getItem('preferred_lang');
  if (pref && pref !== currentLang) {
    location.replace(translatedUrl);
  }
}
```

`pageshow`イベントの`persisted`プロパティもチェックしてbfcacheから復元されたページも処理する。

## 5. ナビゲーションメニューの分離

`_data/navigation.yml`に言語別に個別のメニューツリーを定義する。

```yaml
menu:      # 韓国語サイドバー
  - title: "Development"
    url: /ko/development/
    children:
      - title: "Apple"
        url: /ko/development/apple/

menu-en:   # 英語サイドバー
  - title: "Development"
    url: /en/development/
    children:
      - title: "Apple"
        url: /en/development/apple/

menu-ja:   # 日本語サイドバー
  - title: "Development"
    url: /ja/development/
    children:
      - title: "Apple"
        url: /ja/development/apple/
```

同じ構造を3回繰り返すのは非効率に見えるが各言語別にカテゴリ名やURLを異なる設定にできる柔軟性を提供する。`_config.yml`のscopeで言語別にどのメニューを使うか指定してあるのでポストやページで個別に気にする必要はない。

## 6. Liquidフィルタリングパターン

言語別にポストをフィルタリングするパターンが全レイアウトで繰り返される。韓国語には`lang`フィールドがないため非対称的な条件分岐が必要だ。

```liquid
{% raw %}{% assign current_lang = page.lang | default: "ko" %}

{% for post in site.categories[taxonomy] %}
  {% if current_lang == "ko" %}
    {% unless post.lang %}
      <!-- 韓国語: langフィールドがないポストのみ表示 -->
      {% include archive-single.html %}
    {% endunless %}
  {% else %}
    {% if post.lang == current_lang %}
      <!-- 英語/日本語: langフィールドが一致するポストのみ表示 -->
      {% include archive-single.html %}
    {% endif %}
  {% endif %}
{% endfor %}{% endraw %}
```

このパターンがカテゴリページ、タグページ、ホームレイアウト、ポストページネーションなど複数の箇所で使用される。

## 7. i18n UIテキスト

レイアウトで使用するUIテキスト（前の記事、次の記事など）を`_data/i18n.yml`に定義する。

```yaml
ko:
  prev_post: "이전 글"
  next_post: "다음 글"
  no_prev_post: "이전 글 없음"
  no_next_post: "다음 글 없음"

en:
  prev_post: "Previous"
  next_post: "Next"
  no_prev_post: "No previous post"
  no_next_post: "No next post"

ja:
  prev_post: "前の記事"
  next_post: "次の記事"
  no_prev_post: "前の記事なし"
  no_next_post: "次の記事なし"
```

レイアウトではこのように使用する。

```liquid
{% raw %}{% assign current_lang = page.lang | default: "ko" %}
{% assign i18n = site.data.i18n[current_lang] %}
{{ i18n.prev_post }}{% endraw %}
```

## 8. SEO hreflangタグ

検索エンジンに翻訳バージョンの存在を知らせるために`<head>`にhreflangタグを自動生成する。

```html
{% raw %}{% if page.ref %}
  {% assign ref_posts = site.posts | where: "ref", page.ref %}
  {% assign ref_pages = site.pages | where: "ref", page.ref %}
  {% assign ref_all = ref_posts | concat: ref_pages %}
  {% for item in ref_all %}
    <link rel="alternate" hreflang="{{ item.lang | default: 'ko' }}"
          href="{{ item.url | absolute_url }}">
  {% endfor %}
{% endif %}{% endraw %}
```

これによりGoogleが同じコンテンツの異なる言語バージョンを認識しユーザーの言語に合ったバージョンを検索結果に表示する。

# 試行錯誤

## 1. 韓国語のlangフィールド未設定

当初は韓国語ポストにも`lang: ko`を設定しようとしたがMinimal Mistakesテーマのデフォルト動作と競合が発生した。テーマが`lang`フィールドのないポストをデフォルト言語として扱うロジックがあちこちにあった。結局韓国語だけ`lang`フィールドなしにして残りの言語にのみ明示的に設定する非対称構造を採用した。

この判断のためLiquidフィルタリングが常に2つに分岐する。韓国語は`unless post.lang`で英語/日本語は`if post.lang == current_lang`で処理する。コードが若干煩雑になるがテーマとの互換性を維持できた。

## 2. カテゴリページの3倍管理

カテゴリページを3言語すべてに作成する必要がある。カテゴリが1つ追加されるたびに3つのページファイルを作成し`navigation.yml`の3つのメニューにもそれぞれ追加しなければならない。自動化できればいいがGitHub Pages環境ではカスタムプラグインが使えないため手作業が避けられない。

## 3. 戻るボタンの言語混乱

英語ポストを閲覧中に韓国語に切り替えるとブラウザ履歴に英語URLが残る。戻るボタンを押すと英語ページが表示されるがユーザーはすでに韓国語モードだと思っているため混乱する。`back_forward`検出 + localStorageの組み合わせで解決したがbfcacheの処理まで考慮する必要があり予想以上に手間がかかった。

# まとめ

Jekyllでプラグインなしに多言語を実装しようとすると結局手作業と繰り返しが多くなる。しかしその分GitHub Pagesとの互換性が保証されテーマのアップデートにも柔軟に対応できる。

核心要素をまとめると以下の通りだ。

| 要素 | 実装方式 |
|------|----------|
| URLルーティング | `_config.yml` defaults scope |
| 翻訳連結 | `ref`フィールドマッチング |
| 言語検出 | JavaScript `navigator.language` + localStorage |
| メニュー分離 | `navigation.yml`に言語別メニューツリー |
| ポストフィルタリング | Liquid `lang`フィールド条件分岐 |
| UIテキスト | `_data/i18n.yml` |
| SEO | hreflang alternateタグ |

# 参考

- <https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#rel_alternate>
- <https://developers.google.com/search/docs/specialty/international/localized-versions>
