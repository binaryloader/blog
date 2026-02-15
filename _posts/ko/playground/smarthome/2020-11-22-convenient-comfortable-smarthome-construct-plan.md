---
date: 2020-11-22T00:00+09:00
title: "[SmartHome] 편리하고 안락한 스마트홈 구축 계획"
ref: smarthome-construct-plan
excerpt: "편리하고 안락한 스마트홈 인프라 구축 계획을 정리한다."
last_modified_at: 2020-11-22T18:12+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/smarthome-construct-plan.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/smarthome-construct-plan.png"
categories:
  - Playground
  - SmartHome
tags:
  - Playground
  - SmartHome
  - IoT
  - ZigBee
  - SmartThings
depth:
  - title: "Playground"
    url: /ko/playground/
  - title: "SmartHome"
    url: /ko/playground/smarthome/
gallery_infra:
  - url: /assets/image/post/playground/smarthome/convenient-comfortable-smarthome-construct-plan/infra.png
    image_path: /assets/image/post/playground/smarthome/convenient-comfortable-smarthome-construct-plan/infra.png
---

# 개요

편리하고 안락한 스마트홈 인프라 구축 계획을 정리한다.

# 들어가며

언젠가 우연히 유튜브에서 스마트홈 관련 영상 하나를 보게 되었다. 이 영상 속에 나오는 집은 조명과 커튼, 여러 가구와 가전을
스마트폰의 앱을 통해 컨트롤 하거나 컨디션 기반의 자동화 환경을 구축해놓았다. 보자마자 든 생각은 '와 이거 엄청 재밌겠다'였다.

회사 업무로 스마트홈 기기들을 조작할 수 있는 모바일 앱 기반의 컨트롤러 패널을 구현할 때는 호기심이 별로 생기지 않았는데 이번엔 보자마자 꽂혀버렸다.

# 사전 준비

## 1. 구축 목적을 생각해보자

- IoT 기술을 활용하여 보다 편리하고 안락한 삶을 영위하기 위함.
- 모든 전자 제품과 기기, 가구 등을 하나의 통신망으로 통합하고 응용 프로그램을 통하여 터치와 음성 명령, 자동화로 집을 제어하기 위함.
- 사실 다른 목적과 이유보다도 일단 재밌으니까... ㅋㅋㅋ

## 2. 정보를 탐색해보자

### 2.1. 스마트홈 관련 유튜브 채널

본인은 애플의 거의 모든 기기를 사용하고 있기 때문에 HomeKit과 애플 공식 인증 제품을 통해 스마트홈을 구축하려고 했다. 하지만 조금 찾아보니 인증 기기 종류가 얼마 되지 않음은 물론이거니와 너무 비싸다.
타협 가능한 금액 내에서 유튜브 영상 속의 집처럼 스마트홈을 구축하려면 어떻게 해야 할까 한동안 푹 빠져서 관련 유튜브 채널을 찾아봤다.

- [오날도의 스마트홈 만들기](https://www.youtube.com/c/Onaldo7)
- [슬기로운 가정생활](https://www.youtube.com/c/HomeIoT)
- [쿠루가이의 스마트홈 만들기](https://www.youtube.com/channel/UCm0uQ1mIl_QW1XOFVCmK4dA)
- [Ray's 스마트홈 with HA](https://www.youtube.com/c/HAsmarthome)

### 2.2. 스마트홈 관련 커뮤니티

유튜브 보다 자세한 정보를 찾기 위해 웹서핑 중에 네이버 카페를 하나 발견했는데 스마트싱스를 주축으로 스마트홈을 운용하는 분들이 모인 커뮤니티였다.

- [Smartthings & IoT home Community](https://cafe.naver.com/stsmarthome)

스마트홈이라는 험난한 길을 먼저 떠난 선배들이 공유한 정보와 고군분투기를 보고 결정하자고 마음을 먹고 입문자를 위한 가이드와 여러 게시글을 살펴봤다.
오! 이 커뮤니티에 위 유튜브의 주인 분들이 다 계셨다.

### 2.3. 주력 통신 프로토콜 선택

유튜브 채널에 업로드된 영상과 커뮤니티의 글을 보고 나니까 우선 HomeKit을 제외하고 주력으로 사용할 스마트홈 플랫폼과 통신 프로토콜을 정하는게 우선이라는 생각이 들었다.
통신 프로토콜을 먼저 결정하기로 하였는데 찾아보니 `Wi-Fi`, `Bluetooth`, `ZigBee`, `Z-Wave` 등 여러 통신 규약을 채택한 스마트홈 기기와 플랫폼들이 존재했다.

스마트홈 생태계에서 주로 사용되는 저전력 통신 프로토콜은 `ZigBee`와 `Z-Wave`인 것 같은데 `Z-Wave`는 국가마다 주파수 대역이 달라서 패스하기로 했다.
최종적으로 `ZigBee`를 주력 통신 프로토콜로 선택하였다. 나머지 통신 프로토콜을 채택한 기기들은 직결하지 않고 클라우드와 브릿지를 통하여 플랫폼에 통합할 수도 있을 것 같아서 큰 고민은 없었다.

### 2.4. ZigBee 허브 선택

`ZigBee`를 채택한 기기들과 연동 가능한 허브의 종류는 꽤 많았다. 그 중에서도 스마트싱스 허브를 선택했는데 그 이유는 아래와 같다.

- 비록 삼성전자가 스마트홈 하드웨어 쪽에서는 손을 때려고 하고 있지만 미약하게나마 삼성전자의 네임밸류가 남아있기 때문에 사후 관리가 괜찮을 것으로 생각된다.
- 컨트롤러 클라이언트와 자동화를 위한 웹코어 등과 같은 소프트웨어의 개발과 고도화는 여전히 삼성이 담당한다.
- 미니 앱 형태의 플러그인(SmartApp)과 기기 드라이버(DTH) 개발을 통해 허브에 직결이 불가능한 기기들의 클라우드 연동 및 타 플랫폼 간의 통합을 지원한다.
- 개발자 문서와 개발자 커뮤니티가 잘 되어 있다.

## 3. 스마트홈 인프라 구축 계획도

여태까지 알아보고 결정한 내용을 바탕으로 스마트홈 인프라 구축 계획을 대충 그려보았다.
아직 초기 버전이고 잘못 알고 있는 정보를 토대로 그렸을 수도 있기 때문에 단순 참고용으로 사용하면 될 것 같다.
실제로 하나씩 구축하면서 다시 그려 나가자.

{% include gallery id="gallery_infra" %}

스마트홈은 2월에 새로 이사하는 집에 구축할 계획이다. 가족과 함께 사는 집이기 때문에 내 방부터 시작해서 점점 영역을 넓혀가야겠다.
중요한 것은 스마트홈은 안락하고 편안한 환경을 위한 것이지 이런저런 기능을 구현해두고서 불편한 부분은 조금 참자가 되면 안된다. 가족 구성원 중
한 명이라도 스마트홈에 대해서 불편함을 느끼거나 불만을 가질 경우 해당 기기는 즉시 정비 혹은 철거하도록 하자.
