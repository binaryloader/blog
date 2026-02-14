---
title: "[Jekyll] Implementing Multilingual Support (KO/EN/JA) Without Plugins"
ref: jekyll-multilingual-blog-implementation
excerpt: "Sharing the experience of implementing Korean, English, and Japanese support in a Jekyll blog with the Minimal Mistakes theme — without any plugins."
date: 2026-02-15T00:30+09:00
last_modified_at: 2026-02-15T00:30+09:00
published: true
lang: en
permalink: /en/:categories/:title/
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
  - i18n
  - Multilingual
  - Minimal Mistakes
depth:
  - title: "Development"
    url: /en/development/
  - title: "Blog"
    url: /en/development/blog/
  - title: "Jekyll"
    url: /en/development/blog/jekyll/
---

# Overview

Sharing the experience of implementing Korean, English, and Japanese support in a Jekyll blog with the Minimal Mistakes theme — without any plugins.

# Background

Running the blog in Korean only felt limiting. Since it's a tech blog, having it accessible to international readers seemed worthwhile. With AI translation quality being good enough these days, I decided to go with three languages.

There are Jekyll multilingual plugins like `jekyll-polyglot` and `jekyll-multiple-languages-plugin`, but most aren't supported on GitHub Pages and theme compatibility was a concern. I ended up implementing everything with just Liquid templates and `_config.yml` settings.

# Overall Architecture

## Directory Layout

The core idea is separating posts and pages into language-specific directories.

```
_posts/
├── ko/          # Korean (default language)
│   ├── development/
│   ├── pc/
│   └── ...
├── en/          # English
│   ├── development/
│   ├── pc/
│   └── ...
└── ja/          # Japanese
    ├── development/
    ├── pc/
    └── ...

_pages/
├── categories/        # Korean category pages
├── en/categories/     # English category pages
└── ja/categories/     # Japanese category pages
```

## URL Structure

Every URL is prefixed with a language code.

| Language | URL Pattern | Example |
|----------|-------------|--------|
| Korean | `/ko/categories/title/` | `/ko/development/blog/jekyll/post-title/` |
| English | `/en/categories/title/` | `/en/development/blog/jekyll/post-title/` |
| Japanese | `/ja/categories/title/` | `/ja/development/blog/jekyll/post-title/` |

# Key Implementation Details

## 1. _config.yml Scope Settings

The `defaults` section in `_config.yml` sets language-specific defaults based on directory paths. This is the foundation of the entire multilingual system.

```yaml
defaults:
  # Korean posts
  - scope:
      path: "_posts/ko"
      type: posts
    values:
      permalink: /ko/:categories/:title/
      sidebar:
        nav: "menu"

  # English posts
  - scope:
      path: "_posts/en"
      type: posts
    values:
      lang: en
      permalink: /en/:categories/:title/
      sidebar:
        nav: "menu-en"

  # Japanese posts
  - scope:
      path: "_posts/ja"
      type: posts
    values:
      lang: ja
      permalink: /ja/:categories/:title/
      sidebar:
        nav: "menu-ja"
```

There's an important design decision here. Korean posts don't get a `lang` field. Since Korean is the default language, posts without `lang` are treated as Korean. Only English and Japanese posts explicitly have `lang: en` or `lang: ja`. This asymmetric structure affects Liquid filtering throughout the site.

## 2. Translation Linking via ref Field

The `ref` field connects Korean, English, and Japanese versions of the same post. Posts with the same `ref` value are treated as translations of each other.

```yaml
# Korean post
---
title: "SSH 키 생성하기"
ref: generating-ssh-keys
---

# English post
---
title: "Generating SSH Keys"
ref: generating-ssh-keys
lang: en
---

# Japanese post
---
title: "SSH鍵の生成"
ref: generating-ssh-keys
lang: ja
---
```

The language dropdown in the masthead uses this `ref` to find translated URLs.

```liquid
{% raw %}{% assign ref_posts = site.posts | where: "ref", page.ref %}
{% for p in ref_posts %}
  {% if p.lang == target_lang %}
    <a href="{{ p.url }}">{{ lang_name }}</a>
  {% endif %}
{% endfor %}{% endraw %}
```

When a translation doesn't exist, it falls back to the target language's home page.

## 3. Language Detection and Redirect

When a user visits the root URL (`/`), the site detects the browser language and redirects to the appropriate language page.

```javascript
function detectLang() {
  var supported = ['ko', 'en', 'ja'];
  // 1. Check localStorage for saved preference
  var stored = localStorage.getItem('preferred_lang');
  if (stored && supported.indexOf(stored) !== -1) return stored;

  // 2. Detect browser language
  var bl = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (bl.indexOf('ko') === 0) return 'ko';
  if (bl.indexOf('ja') === 0) return 'ja';
  if (bl.indexOf('en') === 0) return 'en';

  // 3. Default
  return 'en';
}
window.location.replace('/' + detectLang() + '/');
```

When a user manually selects a language, the choice is saved to localStorage and takes priority on subsequent visits.

## 4. Maintaining Language on Back Navigation

There was an issue where pressing the browser's back button would break the language context. For example, if you were reading in English, switched to Korean, then pressed back — you'd see the English page again. This was solved by detecting back/forward navigation via `performance.getEntriesByType('navigation')` and redirecting to the preferred language version.

```javascript
var nav = performance.getEntriesByType('navigation')[0];
if (nav && nav.type === 'back_forward') {
  var pref = localStorage.getItem('preferred_lang');
  if (pref && pref !== currentLang) {
    location.replace(translatedUrl);
  }
}
```

The `pageshow` event's `persisted` property is also checked to handle pages restored from the bfcache.

## 5. Separate Navigation Menus

Three separate menu trees are defined in `_data/navigation.yml`.

```yaml
menu:      # Korean sidebar
  - title: "Development"
    url: /ko/development/
    children:
      - title: "Apple"
        url: /ko/development/apple/

menu-en:   # English sidebar
  - title: "Development"
    url: /en/development/
    children:
      - title: "Apple"
        url: /en/development/apple/

menu-ja:   # Japanese sidebar
  - title: "Development"
    url: /ja/development/
    children:
      - title: "Apple"
        url: /ja/development/apple/
```

Repeating the same structure three times may seem inefficient, but it provides the flexibility to customize category names and URLs per language. Since `_config.yml` scopes already specify which menu each language uses, individual posts and pages don't need to worry about it.

## 6. Liquid Filtering Pattern

A consistent pattern for filtering posts by language is used across all layouts. The asymmetric `lang` field handling requires two-branch conditions.

```liquid
{% raw %}{% assign current_lang = page.lang | default: "ko" %}

{% for post in site.categories[taxonomy] %}
  {% if current_lang == "ko" %}
    {% unless post.lang %}
      <!-- Korean: show only posts WITHOUT lang field -->
      {% include archive-single.html %}
    {% endunless %}
  {% else %}
    {% if post.lang == current_lang %}
      <!-- EN/JA: show only posts with matching lang -->
      {% include archive-single.html %}
    {% endif %}
  {% endif %}
{% endfor %}{% endraw %}
```

This pattern appears in category pages, tag pages, the home layout, and post pagination.

## 7. i18n UI Text

UI strings used in layouts (previous post, next post, etc.) are defined in `_data/i18n.yml`.

```yaml
ko:
  prev_post: "이전 글"
  next_post: "다음 글"

en:
  prev_post: "Previous"
  next_post: "Next"

ja:
  prev_post: "前の記事"
  next_post: "次の記事"
```

Used in layouts like this:

```liquid
{% raw %}{% assign current_lang = page.lang | default: "ko" %}
{% assign i18n = site.data.i18n[current_lang] %}
{{ i18n.prev_post }}{% endraw %}
```

## 8. SEO hreflang Tags

To inform search engines about translated versions, hreflang tags are automatically generated in the `<head>`.

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

This tells Google about alternate language versions so it can serve the right one in search results.

# Lessons Learned

## No lang Field for Korean

I initially wanted to set `lang: ko` on Korean posts, but this conflicted with the Minimal Mistakes theme's default behavior. The theme treats posts without a `lang` field as the default language in many places. I adopted an asymmetric structure where only non-default languages get explicit `lang` fields.

This decision means Liquid filtering always splits into two branches: `unless post.lang` for Korean, `if post.lang == current_lang` for others. The code is slightly messier but maintains theme compatibility.

## Triple Category Page Maintenance

Every category page must exist in all three languages. Each new category means creating three page files and adding entries to three menus in `navigation.yml`. Automation would be nice, but custom plugins aren't available on GitHub Pages, so manual work is unavoidable.

## Back Navigation Language Confusion

When switching from English to Korean, the browser history retains the English URL. Pressing back shows the English page while the user assumes they're in Korean mode. The `back_forward` detection + localStorage combination solved this, but the implementation required handling bfcache edge cases, making it more involved than expected.

# Summary

Implementing multilingual support in Jekyll without plugins involves significant manual work and repetition. The trade-off is guaranteed compatibility with GitHub Pages and flexibility when updating themes.

Here's a summary of the key components:

| Component | Implementation |
|-----------|---------------|
| URL routing | `_config.yml` defaults scope |
| Translation linking | `ref` field matching |
| Language detection | JavaScript `navigator.language` + localStorage |
| Menu separation | Language-specific menu trees in `navigation.yml` |
| Post filtering | Liquid `lang` field conditional branching |
| UI text | `_data/i18n.yml` |
| SEO | hreflang alternate tags |

# References

- <https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#rel_alternate>
- <https://developers.google.com/search/docs/specialty/international/localized-versions>
