---
title: "[SmartHome] 박막 접촉 센서 + Zigbee 도어 센서 개조로 재실 감지 자동화"
ref: pressure-sensor-door-sensor-mod
excerpt: "Sonoff SNZB-04 Zigbee 도어 센서의 리드 스위치에 박막 접촉 센서를 연결하여 의자와 주방 발판에서 재실 감지 자동화를 구현한 경험을 정리한다."
date: 2026-02-18T19:30+09:00
last_modified_at: 2026-02-18T19:30+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/pressure-sensor-door-sensor-mod.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/pressure-sensor-door-sensor-mod.png"
categories:
  - Playground
  - SmartHome
tags:
  - SmartHome
  - Zigbee
  - Sonoff
  - Thin-Film Contact Sensor
  - DIY
  - SmartThings
  - Automation
gallery_disassembly:
  - url: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/sonoff-snzb04-unboxed.jpg
    image_path: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/sonoff-snzb04-unboxed.jpg
    alt: "Sonoff SNZB-04 개봉"
  - url: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/sensor-disassembled.jpg
    image_path: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/sensor-disassembled.jpg
    alt: "도어 센서 분해(CR2032 배터리, PCB, 케이스)"
  - url: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/pcb-reed-switch.jpg
    image_path: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/pcb-reed-switch.jpg
    alt: "PCB 측면에서 보이는 리드 스위치"
gallery_mod:
  - url: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/drilling-case.jpg
    image_path: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/drilling-case.jpg
    alt: "드릴로 케이스에 케이블 통과 구멍 뚫기"
  - url: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/soldered-wires.jpg
    image_path: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/soldered-wires.jpg
    alt: "리드 스위치 접점에 전선 감아서 결선"
  - url: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/assembled-in-case.jpg
    image_path: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/assembled-in-case.jpg
    alt: "기판을 케이스에 넣고 전선 연결 완료"
depth:
  - title: "Playground"
    url: /ko/playground/
  - title: "SmartHome"
    url: /ko/playground/smarthome/
---

# 개요

Sonoff SNZB-04 Zigbee 도어 센서의 리드 스위치에 박막 접촉 센서를 연결하여 의자와 주방 발판에서 재실 감지 자동화를 구현한 경험을 정리한다.

{% include video id="033_Jb5O1x4" provider="youtube" %}

# 정리

스마트홈 관련 네이버 카페를 보다가 박막 접촉 센서를 공동구매하는 글을 발견했다. 박막 접촉 센서를 의자 방석 밑이나 주방 발판 밑에 깔아두면 사람이 앉거나 서 있는 것을 감지할 수 있는데, 이걸 스마트홈 자동화의 트리거로 쓸 수 있다는 아이디어였다. 바로 구매해서 Zigbee 도어 센서에 연결하는 작업을 해보기로 했다.

## 1. 원리

Sonoff SNZB-04는 Zigbee 기반의 도어/창문 센서이다. 본체 안에 리드 스위치가 있고 자석이 가까워지면 리드 스위치가 닫히면서 "닫힘" 상태를 허브에 보고한다. 자석이 멀어지면 리드 스위치가 열리면서 "열림"을 보고하는 단순한 구조이다.

이 리드 스위치의 접점에 박막 접촉 센서를 연결하면 자석 대신 압력으로 회로를 열고 닫을 수 있다. 박막 접촉 센서 위에 사람이 앉거나 서면 회로가 닫히고 도어 센서는 "닫힘"으로 인식한다. 사람이 일어나면 회로가 열리고 "열림"이 된다. 이걸 SmartThings 같은 스마트홈 플랫폼에서 자동화 조건으로 쓰면 재실 감지 센서가 되는 것이다.

## 2. 준비물

![준비물 전체](/assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/materials-overview.jpg)

작업에 필요한 도구와 부품은 아래와 같다.

- 박막 접촉 센서(네이버 스마트홈 카페 공동구매)
- Sonoff SNZB-04 Zigbee 도어 센서
- 드릴(케이스에 구멍 뚫기용)
- 2심 전선
- 드라이버, 가위 등

박막 접촉 센서는 카페 공동구매로 저렴하게 구입했고 Sonoff SNZB-04는 개당 몇천 원 수준으로 구할 수 있어서 전체 비용이 크지 않다.

## 3. 분해

Sonoff SNZB-04를 분해한다. 케이스는 드라이버 없이 손톱으로도 열 수 있을 정도로 간단한 구조이다. 뚜껑을 열면 CR2032 배터리와 작은 PCB가 들어 있다.

PCB를 꺼내서 측면을 보면 리드 스위치가 보인다. 리드 스위치는 유리관 안에 두 개의 금속 접점이 들어 있는 부품으로 외부 자기장에 반응해서 접점이 붙었다 떨어졌다 한다. 이 리드 스위치의 양쪽 단자에 전선을 연결하면 외부 박막 접촉 센서로 회로를 제어할 수 있게 된다.

{% include gallery id="gallery_disassembly" caption="개봉 → 분해 → 리드 스위치 확인" %}

## 4. 개조

### 4.1. 케이스 가공

전선이 지나갈 구멍을 뚫어야 한다. 도어 센서 케이스의 옆면에 드릴로 작은 구멍을 하나 뚫는다. 전선 두 가닥이 통과할 수 있는 크기면 충분하다. 플라스틱이 얇아서 살짝만 힘을 줘도 뚫리니 드릴 속도를 낮추고 천천히 하는 것이 좋다.

### 4.2. 결선

PCB의 리드 스위치 양쪽 접점에 2심 전선을 감아서 연결한다. 집에서 납땜하면 냄새가 나기 때문에 인두기 없이 전선을 단자에 단단히 감아서 결선했다. 리드 스위치 자체가 매우 작아서 작업이 조금 까다롭지만 접점에 전선을 꼼꼼히 감아주면 충분히 접촉이 된다. 극성은 없으므로 어느 쪽에 어느 선을 연결하든 상관없다.

### 4.3. 조립

결선이 끝나면 전선을 뚫어놓은 구멍으로 빼내고 PCB와 배터리를 케이스에 다시 넣는다. 전선이 끼이지 않도록 정리하면서 뚜껑을 닫으면 개조 완료이다.

{% include gallery id="gallery_mod" caption="드릴 가공 → 결선 → 조립" %}

## 5. 완성 및 활용

조립이 끝나면 전선 반대쪽 끝을 박막 접촉 센서에 연결한다. 완성된 모습은 도어 센서 본체에서 케이블이 나와 박막 접촉 센서 스트립에 연결된 형태이다.

![완성된 박막 접촉 센서 + 도어 센서](/assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/completed-assembly.png)

이 센서를 SmartThings에 등록하면 eWeLink 연동을 통해 열림/닫힘 상태를 확인할 수 있고 자동화 설정도 간단하다.

- 의자 방석 밑에 설치: 앉으면 "닫힘" → 모니터와 조명 켜기, 일어나면 "열림" → 끄기
- 주방 발판 밑에 설치: 서면 "닫힘" → 주방 조명 켜기, 떠나면 "열림" → 끄기

![SmartThings 앱 화면](/assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/smartthings-app.png){: style="max-width: min(300px, 100%);"}

# 후기

작업 자체는 30분이면 끝나는 간단한 개조이다. Sonoff SNZB-04가 워낙 저렴하고 구조도 단순해서 부담 없이 시도할 수 있다. 납땜 없이 전선을 감아서 결선하는 것만으로도 충분히 동작하기 때문에 인두기가 없어도 된다. 다만 리드 스위치의 접점이 작아서 전선을 감을 때 조금 신경 써야 하고 케이스에 구멍을 뚫을 때 플라스틱이 갈라지지 않도록 드릴 속도를 조절하는 것이 좋다.

실제로 사용해 보니 의자 자동화가 특히 편하다. 자리에 앉으면 알아서 모니터와 조명이 켜지고 일어나면 자동으로 꺼진다. 주방도 발판에 서면 바로 조명이 들어와서 스위치를 누르러 갈 필요가 없다. 이런 자잘한 자동화가 하나둘 쌓이면 집이 정말 편해진다.
