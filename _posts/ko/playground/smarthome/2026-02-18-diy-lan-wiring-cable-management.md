---
title: "[SmartHome] 부모님 집 이사 후 LAN 배선 및 TV 선 정리"
ref: diy-lan-wiring-cable-management
excerpt: "부모님 이사 후 끊어진 랜 포트 복구, RJ45 크림핑, TV 뒤 선 정리까지 직접 해본 경험을 정리한다."
date: 2026-02-18T19:00+09:00
last_modified_at: 2026-02-18T19:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/diy-lan-wiring-cable-management.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/diy-lan-wiring-cable-management.png"
categories:
  - Playground
  - SmartHome
tags:
  - DIY
  - LAN
  - Ethernet
  - Cable Management
  - SmartHome
gallery_wiring:
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/cable-stripping.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/cable-stripping.jpg
    alt: "UTP 케이블 스트리퍼로 피복 벗기기"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/wire-arrangement.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/wire-arrangement.jpg
    alt: "T568B 순서로 심선 정렬"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/rj45-connector.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/rj45-connector.jpg
    alt: "RJ45 커넥터 크림핑 완료"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/cable-tester.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/cable-tester.jpg
    alt: "LANstar XT-468 테스터로 8핀 전부 통과 확인"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/floor-outlet-box.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/floor-outlet-box.jpg
    alt: "바닥 매립 콘센트에서 결선 작업"
gallery_result:
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/tv-mount-power-strip.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/tv-mount-power-strip.jpg
    alt: "TV 벽걸이 브라켓 위에 멀티탭 케이블타이로 고정"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/router-behind-tv.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/router-behind-tv.jpg
    alt: "TV 뒤에 공유기를 숨겨 깔끔하게 정리"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/final-result.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/final-result.jpg
    alt: "완성된 거실 모습"
gallery_aftermath:
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/tools-overview.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/tools-overview.jpg
    alt: "작업 후 어지럽혀진 현장"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/battle-scars.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/battle-scars.jpg
    alt: "작업 중 다친 손"
depth:
  - title: "Playground"
    url: /ko/playground/
  - title: "SmartHome"
    url: /ko/playground/smarthome/
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

# 개요

부모님 이사 후 끊어진 랜 포트 복구, RJ45 크림핑, TV 뒤 선 정리까지 직접 해본 경험을 정리한다.

# 정리

부모님께서 이사를 하셨는데 이전에 거주하시던 분이 랜 포트 몇 개의 선을 끊어 놓고 간 것을 발견했다. 업체를 부르자니 간단한 작업에 출장비까지 내기 아깝고 어차피 도구만 있으면 되는 일이라 직접 LAN 배선과 TV 뒤 선 정리를 해보기로 했다.

## 1. 랜 포트 복구

### 1.1. 바닥 매립 콘센트 확인

TV 쪽 바닥 매립 콘센트를 열어 보니 랜 포트의 선이 끊어져 있었다. 깔끔하게 잘린 게 아니라 뜯기듯이 끊어져 있어서 기존 선으로는 복구가 불가능한 상태였다. 키스톤잭과 반대쪽 RJ45 커넥터를 전부 새로 달기로 했다.

![끊어진 키스톤잭](/assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/keystone-jack-wiring.jpg){: style="max-width: min(400px, 100%);"}

### 1.2. 준비물

작업에 필요한 도구와 부품은 아래와 같다.

- CAT.5E 키스톤잭(벽면 매립 콘센트용)
- RJ45 커넥터 + 커넥터 부츠
- UTP 케이블 스트리퍼(피복 벗기기용)
- 랜툴(크림핑 툴)
- 랜 케이블 테스터(LANstar XT-468)
- 타격 공구(펀치다운 툴, 키스톤잭 결선용)
- 드라이버, 가위, 장갑 등

키스톤잭과 RJ45 커넥터는 온라인에서 저렴하게 구할 수 있고 크림핑 툴과 테스터도 한 번 사면 두고두고 쓸 수 있어서 투자 대비 효율이 좋다.

### 1.3. 결선 작업

먼저 UTP 케이블 스트리퍼로 외피를 벗긴다. 스트리퍼에 케이블을 물리고 한 바퀴 돌리면 깔끔하게 벗겨진다. 피복을 벗기면 4쌍 8심의 꼬인 선(twisted pair)이 나오는데 이것을 하나씩 풀어서 분리한다.

분리한 심선을 T568B 순서대로 정렬한다. T568B 배선 순서는 흰주-주황-흰녹-파랑-흰파-초록-흰갈-갈색이다. 한쪽은 CAT.5E 키스톤잭에 결선하고 반대쪽은 RJ45 커넥터로 크림핑한다. 키스톤잭 뒷면에 T568A와 T568B 색상 가이드가 모두 인쇄되어 있으니 B 쪽을 따라 넣으면 된다.

{% include gallery id="gallery_wiring" caption="피복 벗기기 → 심선 정렬 → RJ45 크림핑 → 테스터 통과 → 콘센트 작업" %}

크림핑은 심선 8가닥을 RJ45 커넥터 안에 정확한 순서로 밀어 넣고 크림핑 툴로 압착하는 작업이다. 심선이 가늘어서 순서가 꼬이기 쉽고 끝까지 제대로 들어가지 않으면 접촉 불량이 생긴다. 처음 해보면 몇 개 커넥터를 날릴 수 있으니 여유분을 넉넉히 준비하는 게 좋다.

결선이 끝나면 테스터로 확인한다. Master와 Remote 유닛에 케이블 양 끝을 각각 꽂고 전원을 켜면 1~8번 + G까지 LED가 순서대로 점등된다. 전부 초록불이면 성공이고 하나라도 빠지거나 순서가 어긋나면 해당 핀의 접촉 불량이니 다시 작업해야 한다.

## 2. TV 뒤 선 정리

랜 포트를 복구한 김에 TV 뒤쪽 선 정리도 같이 했다. 벽걸이 TV 뒤는 전원 케이블, HDMI, 사운드바 광케이블, 랜선 등이 뒤엉켜 있어서 정리하지 않으면 금방 지저분해진다. 특히 벽걸이 브라켓 아래로 선이 늘어지면 TV 아래쪽에서 다 보여서 벽걸이의 의미가 없어진다.

멀티탭을 케이블타이로 벽걸이 브라켓 위쪽에 고정했다. 이렇게 하면 전원 케이블이 아래로 늘어지지 않고 TV 뒤에서 바로 연결된다. 공유기도 TV 뒤 공간에 놓아 앞에서 보이지 않게 했다. 공유기는 TV 뒤에 숨겨도 WiFi 신호에는 큰 영향이 없었다. 나머지 선들은 최대한 브라켓 뒤쪽으로 감춰서 밖에서는 깔끔하게 보이도록 정리했다.

{% include gallery id="gallery_result" caption="멀티탭 브라켓 고정 → 공유기 숨기기 → 완성" %}

# 후기

작업 자체는 어렵지 않았지만 바닥 매립 콘센트 안에서 작업하다 보니 공간이 좁아서 손이 좀 고생했다. 콘센트 박스 안에 손을 넣고 작업하면 금속 프레임에 긁히기도 하고 좁은 공간에서 드라이버를 돌리느라 손가락이 아프다. 크림핑 툴도 처음 써보는 거라 심선이 제대로 안 들어가서 몇 번 실패하고 커넥터를 날리기도 했다.

{% include gallery id="gallery_aftermath" caption="전투 흔적" %}

그래도 도구만 있으면 누구나 할 수 있는 작업이다. 업체에 맡기면 출장비 포함 몇만 원이 드는데 도구 한 번 사두면 두고두고 쓸 수 있으니 직접 해보는 것도 나쁘지 않다. 나중에 다른 방의 랜 포트가 고장 나거나 랜 케이블 길이를 맞춰야 할 때도 바로 대응할 수 있어서 편하다.

회사 선배한테 작업 사진을 자랑했더니 가설병 출신이냐고 물어보시길래 아쉽게도 헌병 출신이라고 답했다. 다만 나도 올해 8월에 이사를 앞두고 있는데 그때는 직접 안 하고 업체를 부를 예정이라는 반전이 있긴 하다.
