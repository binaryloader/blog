---
date: 2021-10-17T00:00+09:00
title: "[Router] ASUS 라우터 설정 페이지 HTTPS 활성화하기"
ref: setting-asus-router-enable-https
excerpt: "ASUS 공유기 설정 페이지의 HTTPS를 활성화하는 방법을 정리한다."
last_modified_at: 2021-10-17T08:15+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Playground
  - Router
tags:
  - Playground
  - Router
  - ASUS
  - RT-AX3000
  - HTTPS
  - Certificate
  - Network
  - Security
depth:
  - title: "Playground"
    url: /ko/playground/
  - title: "Router"
    url: /ko/playground/router/
gallery_local_access_settings:
  - url: /assets/image/post/playground/router/asus-router-settings-page-enable-https/local-access-settings.png
    image_path: /assets/image/post/playground/router/asus-router-settings-page-enable-https/local-access-settings.png
gallery_trust_certificate:
  - url: /assets/image/post/playground/router/asus-router-settings-page-enable-https/trust-certificate.png
    image_path: /assets/image/post/playground/router/asus-router-settings-page-enable-https/trust-certificate.png
---

# 개요

ASUS 공유기 설정 페이지의 HTTPS를 활성화하는 방법을 정리한다.

# 정리

## 1. ASUS 설정 페이지 접속

- http://192.168.50.1
- http://router.asus.com

## 2. 고급 설정 - 관리 - 시스템

### 2.1. 로컬 액세스 구성에서 아래와 같이 설정

{% include gallery id="gallery_local_access_settings" %}

- 인증 방법 : BOTH 혹은 HTTPS
- HTTPS LAN 포트 : 8443
- Download Certificate의 내보내기 버튼을 눌러서 `*.crt` 파일을 다운로드한다.
- 다운로드 받은 파일을 더블 클릭하여 키체인의 로그인 항목으로 등록한다.

## 3. 인증서 키체인 등록 및 신뢰 설정

{% include gallery id="gallery_trust_certificate" %}

- 키체인 항목에서 `router.asus.com`이라는 이름의 인증서를 우클릭 한 후에 정보 가져오기를 클릭한다.
- 위 사진과 같이 SSL(Secure Sockets Layer) 항목을 항상 신뢰로 변경한다.

## 4. HTTPS 접속 확인

- 브라우저에 https://router.asus.com:8443 입력 후 접속 확인

# 참고

- <https://www.asus.com/kr/support/FAQ/1034294/>
