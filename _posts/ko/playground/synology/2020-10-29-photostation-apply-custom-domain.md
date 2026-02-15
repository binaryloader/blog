---
date: 2020-10-29T00:00+09:00
title: "[Synology] Photo Station 커스텀 도메인 연결하기"
ref: photostation-apply-custom-domain
excerpt: "Synology Photo Station에 커스텀 도메인을 연결하는 방법을 정리한다."
last_modified_at: 2020-11-05T21:30+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/photostation-apply-custom-domain.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/photostation-apply-custom-domain.png"
categories:
  - Playground
  - Synology
tags:
  - Playground
  - Synology
  - PhotoStation
  - NAS
  - Nginx
  - Domain
depth:
  - title: "Playground"
    url: /ko/playground/
  - title: "Synology"
    url: /ko/playground/synology/
---

# 개요

Synology Photo Station에 커스텀 도메인을 연결하는 방법을 정리한다.

# 들어가며

개인 도메인을 구매하고 리버스 프록시를 통해서 각 응용 프로그램별로 서브 도메인을 아래와 같이 무난히 연결했다.

- blog.mydomain.com
- dsm.mydomain.com
- drive.mydomain.com

그런데 포토 스테이션은 서브 도메인을 연결하기가 조금 까다로웠다.
기존에 공유된 내용들도 DSM 버전이 올라가서인지 아니면 내가 잘못 적용해서인지 작동을 안 하고 해서
방법이 없을까 찾아보다가 관련된 Gist를 발견하고 잘 적용했다.

혹시나 나 같이 헤매는 사람이 있을까봐 공유해본다.

**경고:** 해당 작업의 선행 과정으로 CNAME 레코드 등록을 통해 photo.mydomain.com이라는 서브 도메인을 시놀로지에 미리 연결해둔 상태이다.
{: .notice--warning}

# 해결을 해보자

## 1. Photo.mustache 생성

`/usr/syno/share/nginx` 경로에 `Photo.mustache` 라는 파일을 생성하고 아래와 같이 작성한다.
`server_name`은 연결할 서브 도메인으로 설정한다.

```
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name photo.mydomain.com;

    location = / {
        {% raw %}{{#DSM.ssl}}{% endraw %}
        if ($scheme = https) {
            rewrite / https://$host/photo/ redirect;
        }
        {% raw %}{{/DSM.ssl}}{% endraw %}
        rewrite / http://$host/photo/ redirect;
    }

    include /usr/local/etc/nginx/conf.d/www.PhotoStation.conf;
}
```

## 2. nginx.mustache 수정

`/usr/syno/share/nginx` 경로에 `nginx.mustache`라는 파일을 열어서 아래 라인을 추가한다.

```
{% raw %}{{> /usr/syno/share/nginx/Photo}}{% endraw %}
```

위 과정이 모두 끝났다면 시놀로지를 재부팅한 뒤 해당 서브 도메인으로 접속해보면
포토 스테이션으로 리디렉션되는 것을 확인할 수 있다.

# 참고

- <https://gist.github.com/kalbasit/9cf9b23f2e0f70c285d0>
