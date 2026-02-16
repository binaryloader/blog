---
title: "[Jekyll] 플러그인 없이 Jekyll 블로그 다국어(한/영/일) 구현하기"
ref: jekyll-multilingual-blog-implementation
excerpt: "Jekyll과 Minimal Mistakes 테마에서 플러그인 없이 한국어, 영어, 일본어 3개 국어를 지원하는 블로그를 구현한 경험을 공유한다."
date: 2026-02-15T00:30+09:00
last_modified_at: 2026-02-15T00:30+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/jekyll-multilingual-blog-implementation.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/jekyll-multilingual-blog-implementation.png"
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
    url: /ko/development/
  - title: "Blog"
    url: /ko/development/blog/
  - title: "Jekyll"
    url: /ko/development/blog/jekyll/
---

# 개요

Jekyll과 Minimal Mistakes 테마에서 플러그인 없이 한국어, 영어, 일본어 3개 국어를 지원하는 블로그를 구현한 경험을 공유한다.

# 배경

블로그를 운영하면서 한국어로만 쓰기에는 아쉬웠다. 기술 블로그 특성상 해외 독자도 읽을 수 있으면 좋겠다는 생각이 있었고 AI 번역의 품질이 충분히 올라온 만큼 3개 국어로 운영하기로 했다.

Jekyll 다국어 플러그인으로 `jekyll-polyglot`이나 `jekyll-multiple-languages-plugin` 같은 것들이 있지만 GitHub Pages에서 지원하지 않는 플러그인이 대부분이고 테마와의 호환성 문제도 걱정이었다. 결국 Liquid 템플릿과 `_config.yml` 설정만으로 직접 구현하기로 했다.

# 전체 구조

## 1. 디렉토리 레이아웃

포스트와 페이지를 언어별 디렉토리로 분리하는 것이 핵심이다.

```
_posts/
├── ko/          # 한국어 (기본 언어)
│   ├── development/
│   ├── pc/
│   └── ...
├── en/          # 영어
│   ├── development/
│   ├── pc/
│   └── ...
└── ja/          # 일본어
    ├── development/
    ├── pc/
    └── ...

_pages/
├── categories/        # 한국어 카테고리 페이지
├── en/categories/     # 영어 카테고리 페이지
└── ja/categories/     # 일본어 카테고리 페이지
```

## 2. URL 구조

모든 URL 앞에 언어 접두사를 붙인다.

| 언어 | URL 패턴 | 예시 |
|------|----------|------|
| 한국어 | `/ko/카테고리/제목/` | `/ko/development/blog/jekyll/post-title/` |
| 영어 | `/en/categories/title/` | `/en/development/blog/jekyll/post-title/` |
| 일본어 | `/ja/カテゴリ/タイトル/` | `/ja/development/blog/jekyll/post-title/` |

# 주요 구현

## 1. _config.yml 스코프 설정

`_config.yml`의 `defaults` 섹션에서 디렉토리 경로 기반으로 언어별 기본값을 설정한다. 이것이 전체 다국어 시스템의 기반이다.

```yaml
defaults:
  # 한국어 포스트
  - scope:
      path: "_posts/ko"
      type: posts
    values:
      permalink: /ko/:categories/:title/
      sidebar:
        nav: "menu"

  # 영어 포스트
  - scope:
      path: "_posts/en"
      type: posts
    values:
      lang: en
      permalink: /en/:categories/:title/
      sidebar:
        nav: "menu-en"

  # 일본어 포스트
  - scope:
      path: "_posts/ja"
      type: posts
    values:
      lang: ja
      permalink: /ja/:categories/:title/
      sidebar:
        nav: "menu-ja"
```

여기서 중요한 설계 결정이 있다. 한국어 포스트에는 `lang` 필드를 설정하지 않는다. 한국어가 기본 언어이므로 `lang`이 없으면 한국어로 간주하는 방식이다. 영어와 일본어 포스트만 명시적으로 `lang: en`, `lang: ja`를 가진다. 이 비대칭 구조가 이후 Liquid 필터링에서 계속 영향을 미친다.

## 2. ref 필드로 번역 연결

같은 글의 한/영/일 버전을 연결하는 데 `ref` 필드를 사용한다. Front Matter에 동일한 `ref` 값을 넣으면 Liquid에서 번역 버전을 찾을 수 있다.

```yaml
# 한국어 포스트
---
title: "SSH 키 생성하기"
ref: generating-ssh-keys
---

# 영어 포스트
---
title: "Generating SSH Keys"
ref: generating-ssh-keys
lang: en
---

# 일본어 포스트
---
title: "SSH鍵の生成"
ref: generating-ssh-keys
lang: ja
---
```

masthead의 언어 전환 드롭다운에서 이 `ref`를 기반으로 번역 버전의 URL을 찾는다.

```liquid
{% raw %}{% assign ref_posts = site.posts | where: "ref", page.ref %}
{% for p in ref_posts %}
  {% if p.lang == target_lang %}
    <a href="{{ p.url }}">{{ lang_name }}</a>
  {% endif %}
{% endfor %}{% endraw %}
```

번역이 없는 경우에는 해당 언어의 홈 페이지로 폴백한다.

## 3. 언어 감지 및 리다이렉트

루트 URL(`/`)에 접속하면 브라우저 언어를 감지해 적절한 언어 페이지로 리다이렉트한다.

```javascript
function detectLang() {
  var supported = ['ko', 'en', 'ja'];
  // 1. localStorage에 저장된 선호 언어 확인
  var stored = localStorage.getItem('preferred_lang');
  if (stored && supported.indexOf(stored) !== -1) return stored;

  // 2. 브라우저 언어 감지
  var bl = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (bl.indexOf('ko') === 0) return 'ko';
  if (bl.indexOf('ja') === 0) return 'ja';
  if (bl.indexOf('en') === 0) return 'en';

  // 3. 기본값
  return 'en';
}
window.location.replace('/' + detectLang() + '/');
```

사용자가 언어를 직접 선택하면 localStorage에 저장하고 이후 방문 시 그 설정을 우선한다.

## 4. 뒤로가기 시 언어 유지

브라우저에서 뒤로가기를 했을 때 언어가 뒤섞이는 문제가 있었다. 예를 들어 영어로 보다가 한국어로 전환한 후 뒤로가기를 누르면 다시 영어 페이지가 나온다. 이를 해결하기 위해 `performance.getEntriesByType('navigation')`으로 뒤로가기/앞으로가기를 감지하고 localStorage의 선호 언어로 리다이렉트한다.

```javascript
var nav = performance.getEntriesByType('navigation')[0];
if (nav && nav.type === 'back_forward') {
  var pref = localStorage.getItem('preferred_lang');
  if (pref && pref !== currentLang) {
    // 현재 페이지의 pref 언어 버전 URL로 리다이렉트
    location.replace(translatedUrl);
  }
}
```

`pageshow` 이벤트의 `persisted` 속성도 함께 체크해서 bfcache에서 복원된 페이지도 처리한다.

## 5. 네비게이션 메뉴 분리

`_data/navigation.yml`에 언어별로 별도의 메뉴 트리를 정의한다.

```yaml
menu:      # 한국어 사이드바
  - title: "Development"
    url: /ko/development/
    children:
      - title: "Apple"
        url: /ko/development/apple/
        # ...

menu-en:   # 영어 사이드바
  - title: "Development"
    url: /en/development/
    children:
      - title: "Apple"
        url: /en/development/apple/
        # ...

menu-ja:   # 일본어 사이드바
  - title: "Development"
    url: /ja/development/
    children:
      - title: "Apple"
        url: /ja/development/apple/
        # ...
```

같은 구조를 3번 반복하는 것이 비효율적으로 보이지만 각 언어별로 카테고리 이름이나 URL을 다르게 설정할 수 있는 유연성을 제공한다. `_config.yml`의 scope에서 언어별로 어떤 메뉴를 사용할지 지정해두었기 때문에 포스트나 페이지에서 별도로 신경 쓸 필요가 없다.

## 6. Liquid 필터링 패턴

언어별로 포스트를 필터링하는 패턴이 전체 레이아웃에 반복된다. 한국어에는 `lang` 필드가 없으므로 비대칭적인 조건이 필요하다.

```liquid
{% raw %}{% assign current_lang = page.lang | default: "ko" %}

{% for post in site.categories[taxonomy] %}
  {% if current_lang == "ko" %}
    {% unless post.lang %}
      <!-- 한국어: lang 필드가 없는 포스트만 표시 -->
      {% include archive-single.html %}
    {% endunless %}
  {% else %}
    {% if post.lang == current_lang %}
      <!-- 영어/일본어: lang 필드가 일치하는 포스트만 표시 -->
      {% include archive-single.html %}
    {% endif %}
  {% endif %}
{% endfor %}{% endraw %}
```

이 패턴이 카테고리 페이지, 태그 페이지, 홈 레이아웃, 포스트 페이지네이션 등 여러 곳에서 사용된다.

## 7. i18n UI 텍스트

레이아웃에서 사용하는 UI 텍스트(이전 글, 다음 글 등)를 `_data/i18n.yml`에 정의한다.

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

레이아웃에서는 이렇게 사용한다.

```liquid
{% raw %}{% assign current_lang = page.lang | default: "ko" %}
{% assign i18n = site.data.i18n[current_lang] %}
{{ i18n.prev_post }}{% endraw %}
```

## 8. SEO hreflang 태그

검색엔진에 번역 버전의 존재를 알리기 위해 `<head>`에 hreflang 태그를 자동 생성한다.

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

이렇게 하면 Google이 같은 콘텐츠의 다른 언어 버전을 인식하고 사용자의 언어에 맞는 버전을 검색 결과에 보여준다.

# 시행착오

## 1. 한국어 lang 필드 미설정

처음에는 한국어 포스트에도 `lang: ko`를 넣으려고 했지만 Minimal Mistakes 테마의 기본 동작과 충돌이 생겼다. 테마가 `lang` 필드가 없는 포스트를 기본 언어로 취급하는 로직이 곳곳에 있었다. 결국 한국어만 `lang` 필드 없이 두고 나머지 언어에만 명시적으로 설정하는 비대칭 구조를 채택했다.

이 결정 때문에 Liquid 필터링이 항상 두 갈래로 나뉜다. 한국어는 `unless post.lang`으로 영어/일본어는 `if post.lang == current_lang`으로. 코드가 약간 지저분해지지만 테마 호환성을 유지할 수 있었다.

## 2. 카테고리 페이지 3배 관리

카테고리 페이지를 3개 언어 모두에 만들어야 한다. 카테고리가 하나 추가될 때마다 3개의 페이지 파일을 만들어야 하고 `navigation.yml`의 3개 메뉴에도 각각 추가해야 한다. 자동화할 수 있으면 좋겠지만 GitHub Pages 환경에서는 커스텀 플러그인을 쓸 수 없으므로 수작업이 불가피하다.

## 3. 뒤로가기 언어 혼선

영어 포스트를 보다가 한국어로 전환하면 브라우저 히스토리에 영어 URL이 남는다. 뒤로가기를 누르면 영어 페이지가 나오는데 사용자는 이미 한국어 모드라고 생각하고 있어서 혼란스럽다. `back_forward` 감지 + localStorage 조합으로 해결했지만 구현할 때 bfcache 처리까지 고려해야 해서 예상보다 까다로웠다.

# 정리

Jekyll에서 플러그인 없이 다국어를 구현하려면 결국 수작업과 반복이 많아진다. 하지만 그만큼 GitHub Pages와의 호환성이 보장되고 테마 업데이트에도 유연하게 대응할 수 있다.

핵심 요소를 정리하면 다음과 같다.

| 요소 | 구현 방식 |
|------|-----------|
| URL 라우팅 | `_config.yml` defaults scope |
| 번역 연결 | `ref` 필드 매칭 |
| 언어 감지 | JavaScript `navigator.language` + localStorage |
| 메뉴 분리 | `navigation.yml`에 언어별 메뉴 트리 |
| 포스트 필터링 | Liquid `lang` 필드 조건 분기 |
| UI 텍스트 | `_data/i18n.yml` |
| SEO | hreflang alternate 태그 |

# 참고

- <https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#rel_alternate>
- <https://developers.google.com/search/docs/specialty/international/localized-versions>
