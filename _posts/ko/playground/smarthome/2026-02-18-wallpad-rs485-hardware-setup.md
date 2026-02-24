---
title: "[SmartHome] 현대통신 월패드 RS485-WiFi 변환기 교체 검토"
ref: wallpad-rs485-hardware-setup
excerpt: "기존 Raspberry Pi + RS485 TO USB 구성의 유지보수 문제를 개선하기 위해 RS485-WiFi 변환기 교체를 검토한 내용을 정리한다."
date: 2026-02-18T17:34+09:00
last_modified_at: 2026-02-18T17:34+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/wallpad-rs485-hardware-setup.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/wallpad-rs485-hardware-setup.png"
categories:
  - Playground
  - SmartHome
tags:
  - Playground
  - SmartHome
  - RS485
  - Home Assistant
  - IoT
  - Wallpad
depth:
  - title: "Playground"
    url: /ko/playground/
  - title: "SmartHome"
    url: /ko/playground/smarthome/
gallery_hardware:
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/raspberry-pi-4.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/raspberry-pi-4.jpg
    alt: "Raspberry Pi 4 Model B"
    title: "Raspberry Pi 4 Model B"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-installed.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-installed.jpg
    alt: "벽면에 설치된 온수조절기"
    title: "벽면에 설치된 온수조절기"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-pcb.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-pcb.jpg
    alt: "온수조절기 PCB 보드 (MC200N)"
    title: "온수조절기 PCB 보드 (MC200N) — 파란색 스크류 터미널에 RS485 및 통신선이 연결되어 있다"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-terminal.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-terminal.jpg
    alt: "온수조절기 스크류 터미널 클로즈업"
    title: "온수조절기 스크류 터미널 클로즈업 — UTP 케이블이 연결되어 있다"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/rs485-twisted-pair.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/rs485-twisted-pair.jpg
    alt: "UTP 케이블에서 분리한 RS485 트위스티드 페어"
    title: "UTP 케이블에서 분리한 RS485 트위스티드 페어"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/rpi-rs485-honeywell.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/rpi-rs485-honeywell.jpg
    alt: "하니웰 온수분배기 위에 설치된 Raspberry Pi 4와 RS485 TO USB 변환기"
    title: "하니웰 온수분배기 위에 설치된 Raspberry Pi 4와 RS485 TO USB 변환기"
gallery_dashboard:
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/ha-dashboard-living.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/ha-dashboard-living.jpg
    alt: "Home Assistant 대시보드 — 거실"
    title: "Home Assistant 대시보드 — 거실"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/ha-dashboard-room.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/ha-dashboard-room.jpg
    alt: "Home Assistant 대시보드 — 방"
    title: "Home Assistant 대시보드 — 방"
---

# 개요

기존 Raspberry Pi + RS485 TO USB 구성의 유지보수 문제를 개선하기 위해 RS485-WiFi 변환기 교체를 검토한 내용을 정리한다.

# 정리

## 1. 기존 구성

기존에는 Raspberry Pi 4에 Home Assistant를 설치하고 RS485 TO USB 변환기를 USB로 직접 연결하여 월패드를 제어하고 있었다.

{% include gallery id="gallery_hardware" caption="Raspberry Pi 4에 RS485 TO USB 변환기를 연결하고 온수조절기의 RS485 단자에서 분기하여 결선한 구성" %}

동작 자체는 문제가 없었지만 유지보수가 생각보다 힘들었다. Home Assistant 서버와 RS485 인터페이스가 하나의 Raspberry Pi에 묶여 있어서 서버 교체나 위치 변경이 어렵고 SD 카드 수명 문제도 신경 써야 했다.

{% include gallery id="gallery_dashboard" caption="Home Assistant 대시보드에서 조명, 난방, 에어컨, 커튼, 콘센트 전력 모니터링 등을 제어하고 있었다" %}

RS485-WiFi 변환기로 교체하면 Home Assistant 서버를 별도의 기기(NAS, 미니 PC 등)에 설치하고 변환기만 월패드 근처에 두면 되므로 유지보수가 수월해진다. 이 글에서는 교체를 위한 RS485-WiFi 변환기의 하드웨어 구성과 설정 방법을 검토한다.

## 2. 시스템 구성도

현대통신(IMAZU) 월패드를 Home Assistant에서 제어하려면 월패드의 RS485 버스에 RS485-WiFi 변환기를 연결하여 TCP/IP 네트워크로 패킷을 중계해야 한다. 전체 시스템 구성은 다음과 같다.

```
+----------+          +---------------------------+          +--------+          +-----------+
| Wallpad  |  RS485   | RS485-WiFi Converter      |  WiFi    | Router |  LAN     | HA Server |
| (IMAZU)  |==========| (Waveshare/HF2211S/EW11A) |==========|        |==========|           |
+----------+  A+/B-   +---------------------------+  TCP/IP  +--------+          +-----------+
      |
      | RS485 Bus
      |
+----------------+
| Light, Heating |
| Gas, Fan, AC   |
+----------------+
```

월패드는 RS485 버스를 통해 조명, 난방, 가스밸브, 환풍기, 에어컨 등 각종 기기를 제어한다. RS485-WiFi 변환기는 이 버스에 병렬로 연결되어 패킷을 수신하고 Home Assistant 서버로 전달한다.

## 3. 부품 목록

### 3.1. 필수 부품

| 부품 | 용도 |
|---|---|
| **RS485-WiFi 변환기** | RS485 신호를 TCP/IP로 변환한다. Waveshare RS485 TO WIFI/ETH, Waveshare RS232/485 TO WIFI ETH (B), Hi-Flying HF2211S, Hi-Flying EW11A-0 중 하나를 선택한다. |
| **DC 어댑터 (5V 또는 12V)** | RS485-WiFi 변환기의 전원을 공급한다. 변환기 사양에 맞는 전압을 선택한다. |
| **UTP 케이블 (Cat.5e 이상)** | RS485 A+/B- 신호선 연결에 사용한다. 기존 배선이 없는 경우 필요하다. |
| **Home Assistant 서버** | 월패드 패킷을 수신하고 기기를 제어하는 홈 오토메이션 서버다. |

### 3.2. RS485-WiFi 변환기 비교

| 항목 | Waveshare RS485 TO WIFI/ETH | Waveshare RS232/485 TO WIFI ETH (B) | Hi-Flying HF2211S | Hi-Flying EW11A-0 |
|---|---|---|---|---|
| **연결 방식** | WiFi + Ethernet (RJ45) | WiFi + Ethernet (RJ45) | WiFi 전용 | WiFi 전용 |
| **전원** | 스크류 터미널 (5~36V) 또는 PoE | DC 5.5mm 잭 + 스크류 터미널 (6~36V), PoE 가능 | 스크류 터미널 (5~36V) | 스크류 터미널 (5~18V) 또는 DC 잭 |
| **RS485 연결** | 스크류 터미널 (A+, B-, GND) | 스크류 터미널 (A+, B-) | 스크류 터미널 (A, B, GND) | 스크류 터미널 (A+, B-, VCC, GND) |
| **외장** | 플라스틱 | 금속 케이스 (84x64x24mm) | 플라스틱 (79x53x25mm) | 플라스틱 |
| **설정 방식** | 웹 UI (브라우저) | 웹 UI (브라우저) | 웹 UI (브라우저) | 웹 UI (브라우저) |
| **장점** | Ethernet 지원으로 안정적, PoE 가능 | DC 잭으로 전원 연결 간편, 금속 외장, PoE 가능 | 넓은 전압 범위 (5~36V), RS485 8kV ESD 보호 | 소형이라 설치 공간이 적음 |
| **단점** | 스크류 터미널 전원 연결이 번거로움 | 가격이 상대적으로 높음 | WiFi만 지원, 내장 안테나로 수신 감도 낮음 | WiFi만 지원하여 환경에 따라 불안정 |

유선 Ethernet이 가능한 환경이면 Waveshare가 적합하고 설치 공간이 좁거나 WiFi만 사용 가능한 환경이면 EW11A-0이 적합하다. 넓은 입력 전압 범위가 필요하거나 ESD 보호가 중요한 환경이면 HF2211S를 선택한다. 스크류 터미널에 전선을 직접 결선하는 것이 번거롭다면 DC 5.5mm 잭을 지원하는 RS232/485 TO WIFI ETH (B) 모델을 선택하면 된다.

### 3.3. 보조 부품

| 부품 | 용도 |
|---|---|
| **DC 잭-스크류 터미널 변환 커넥터** | EW11A-0에 DC 어댑터를 연결할 때 편리하다. |
| **실리콘 전선 (AWG 22~24)** | RS485 결선 연장이 필요한 경우 사용한다. 내열성이 우수하다. |
| **압착 단자 (페룰 터미널)** | 스크류 터미널에 전선을 안정적으로 고정한다. |
| **절연 테이프 또는 수축 튜브** | 노출된 전선 접합부를 절연 처리한다. |

## 4. RS485 기초

### 4.1. RS485 통신이란

RS485는 산업용으로 널리 사용되는 차동 신호 기반의 직렬 통신 규격이다. 하나의 버스에 여러 장치를 연결할 수 있는 멀티드롭 방식을 지원하며 최대 1,200m까지 통신이 가능하다. 아파트 월패드 시스템에서는 월패드(마스터)와 각종 기기(슬레이브)가 하나의 RS485 버스를 공유하여 통신한다.

### 4.2. A+/B- 차동 신호

RS485는 두 개의 신호선 A+와 B-의 전압 차이로 데이터를 전달한다.

```
        A+ -----+     +-----+     +-----
                |     |     |     |
        B- -+   | +---+     +---+ |
            |   | |             | |
            +---+ +-------------+ +-----

        Logic 1: A+ > B- (positive)
        Logic 0: A+ < B- (negative)
```

외부 노이즈가 두 신호선에 동일하게 유입되더라도 전압 차이는 유지되기 때문에 노이즈에 강하다. 이 특성 덕분에 아파트 내부의 긴 배선 환경에서도 안정적으로 동작한다.

### 4.3. 9600 baud, 8N1 설정

현대통신 월패드의 RS485 통신은 다음 파라미터를 사용한다.

| 항목 | 값 | 설명 |
|---|---|---|
| **Baud Rate** | 9600 | 초당 9600비트를 전송한다. |
| **Data Bits** | 8 | 한 프레임에 8비트의 데이터를 전송한다. |
| **Parity** | None (N) | 패리티 비트를 사용하지 않는다. |
| **Stop Bits** | 1 | 1비트의 정지 비트를 사용한다. |

이 설정은 RS485-WiFi 변환기의 시리얼 파라미터에 동일하게 적용해야 한다.

## 5. 현대통신 월패드 RS485 결선

### 5.1. 월패드 단자함 구조

아파트의 RS485 통신선은 보통 세대 현관 부근의 통신 단자함(분배 박스) 또는 월패드 뒤편에 집중되어 있다. 현대통신 월패드 시스템의 일반적인 결선 구조는 다음과 같다.

```
+----------------------------------------------------+
|                  Junction Box                      |
|                                                    |
|  +-----------+  +-----------+  +--------------+    |
|  | Wallpad   |  | Sub-phone |  | Honeywell    |    |
|  | RS485     |  | RS485     |  | Water Dist.  |    |
|  | A+  B-    |  | A+  B-    |  | A+  B-       |    |
|  +--+---+----+  +--+---+----+  +--+---+-------+    |
|     |   |          |   |          |   |            |
|     +---+----------+---+----------+---+            |
|              RS485 Bus (Daisy Chain)               |
+----------------------------------------------------+
```

RS485 버스는 데이지 체인 방식으로 연결되어 있으며 A+는 A+끼리, B-는 B-끼리 연결된다.

### 5.2. RS485 A+/B- 선 찾기

통신 단자함 내부에서 RS485 통신선을 찾는 방법은 다음과 같다.

- 월패드 뒤편의 커넥터에서 RS485 표시가 있는 단자를 확인한다
- 일반적으로 2선(A+, B-)으로 구성되어 있으며 색상은 시공 업체마다 다를 수 있다
- 멀티미터로 두 선 사이의 전압을 측정하면 통신 중일 때 0~5V 범위에서 변동하는 것을 확인할 수 있다
- 통신이 없는 상태에서는 약 0V 또는 일정한 DC 전압이 측정된다

### 5.3. 하니웰(Honeywell) 온수분배기에서 결선하는 경우

난방 제어용 하니웰 온수분배기가 설치된 경우 온수분배기의 RS485 단자에서 분기하여 연결할 수 있다.

```
+------------------------------+
|   Honeywell Water Dist.      |
|                              |
|   [A+] [B-]    [A+] [B-]     |
|    IN             OUT        |
+---+----+--------+----+-------+
    |    |        |    |
    |    |        |    +---- B- ---- RS485-WiFi Conv. B-
    |    |        +--------- A+ ---- RS485-WiFi Conv. A+
    |    +------------------ B- ---- Wallpad B-
    +----------------------- A+ ---- Wallpad A+
```

온수분배기의 OUT 단자에서 RS485-WiFi 변환기로 분기하면 된다. IN 단자는 월패드에서 오는 기존 배선이 연결되어 있다.

### 5.4. 서브폰 뒤에서 결선하는 경우

거실이나 각 방의 서브폰(인터폰) 뒤에도 RS485 배선이 와 있는 경우가 있다. 서브폰 뒤에서 결선하면 통신 단자함까지 가지 않아도 된다.

```
+----------------------+
|   Behind Sub-phone   |
|                      |
|   [A+] [B-] [etc]    |
+---+----+-------------+
    |    |
    |    |    Existing RS485 Bus (Wallpad)
    |    |
    |    +------- B- ---- RS485-WiFi Conv. B-
    +------------ A+ ---- RS485-WiFi Conv. A+
```

기존 배선은 그대로 두고 A+/B- 선에 병렬로 RS485-WiFi 변환기를 연결한다.

### 5.5. 월패드 뒤에서 결선하는 경우

월패드 뒤편에서 직접 결선하는 것이 가장 확실한 방법이다. 월패드 본체의 RS485 단자에서 바로 분기한다.

```
+------------------------------+
|   Behind Wallpad             |
|                              |
|   [A+] [B-] [VCC] [GND]      |
+---+----+---------------------+
    |    |
    |    |    Existing RS485 Bus (Devices)
    |    |
    |    +------- B- ---- RS485-WiFi Conv. B-
    +------------ A+ ---- RS485-WiFi Conv. A+
```

월패드의 RS485 단자에서 A+/B- 두 선만 분기하여 RS485-WiFi 변환기에 연결하면 된다. VCC와 GND는 월패드 전원이므로 변환기 전원으로 사용하지 않는다.

## 6. 전원 공급

### 6.1. Waveshare 전원 공급

Waveshare RS485 TO WIFI/ETH는 두 가지 방법으로 전원을 공급할 수 있다.

#### 방법 1: DC 어댑터 (WiFi 사용 시)

스크류 터미널(VIN/GND)에 5~36V 어댑터를 연결한다. 가장 간단한 방법이다.

```
+---------------------+
|     Waveshare       |
|                     |
|  [VIN 5~36V] ---------- DC Adapter (+)
|  [GND]       ---------- DC Adapter (-)
|                     |
|  [A+] ----------------- RS485 A+
|  [B-] ----------------- RS485 B-
|                     |
|  [WiFi Antenna]     |
+---------------------+
```

#### 방법 2: PoE (유선 Ethernet 사용 시)

PoE 스위치 또는 PoE 인젝터를 사용하면 Ethernet 케이블 하나로 데이터와 전원을 동시에 공급할 수 있다.

```
+---------------------+              +--------------------+
|     Waveshare       |    Cat.5e    |  PoE Switch        |
|                     |              |  or Injector       |
|  [RJ45] -----------------------------  [RJ45 + PoE]     |
|                     |              +--------------------+
|  [A+] ---- RS485 A+ |
|  [B-] ---- RS485 B- |
+---------------------+
```

PoE를 사용하면 별도의 전원 어댑터가 필요 없어 설치가 깔끔하다.

RS232/485 TO WIFI ETH (B) 모델은 DC 5.5mm 잭을 지원하므로 어댑터를 바로 연결할 수 있다. 스크류 터미널에 전선을 결선할 필요가 없어 설치가 간편하다. 입력 전압 범위는 6~36V이며 PoE도 지원한다.

```
+-----------------------------+
|  RS232/485 TO WIFI ETH (B)  |
|                             |
|  [DC 5.5mm Jack] ------------ DC Adapter (6~36V)
|                             |
|  [A+] ----------------------- RS485 A+
|  [B-] ----------------------- RS485 B-
|                             |
|  [WiFi Antenna]             |
+-----------------------------+
```

### 6.2. HF2211S 전원 공급

HF2211S는 스크류 터미널을 통해 전원을 공급받는다. 입력 전압 범위가 5~36V로 넓어 다양한 어댑터를 사용할 수 있다.

```
+------------------------------+
|          HF2211S             |
|                              |
|   [A] [B] [GND] [V+] [GND]   |
+---+---+----+-----+-----+-----+
    |   |    |     |     |
    |   |    |     |     +---- GND ---- DC Adapter (-)
    |   |    |     +---------- V+  ---- DC Adapter (+) (5~36V)
    |   |    +---------------- GND ---- (RS485 GND, 선택)
    |   +--------------------- B   ---- RS485 B-
    +------------------------- A   ---- RS485 A+
```

### 6.3. EW11A-0 전원 공급

EW11A-0은 스크류 터미널을 통해 전원을 공급받는다. 핀 배치는 다음과 같다.

```
+------------------------------+
|          EW11A-0             |
|                              |
|   [A+] [B-] [VCC] [GND]      |
+---+----+-----+------+--------+
    |    |     |      |
    |    |     |      +---- GND ---- DC Adapter (-)
    |    |     +----------- VCC ---- DC Adapter (+) (5~18V)
    |    +----------------- B-  ---- RS485 B-
    +---------------------- A+  ---- RS485 A+
```

DC 잭 커넥터가 있는 어댑터를 사용하는 경우 DC 잭-스크류 터미널 변환 커넥터를 활용하면 편리하다.

```
DC Adapter ---- [DC Jack] ---- [Screw Terminal Adapter] ---- EW11A-0 [VCC/GND]
```

전원 공급 시 주의사항은 다음과 같다.

- KC 인증 어댑터를 사용한다 (화재 예방)
- 어댑터 출력 전압이 5~18V 범위 내인지 확인한다
- VCC와 GND의 극성을 반드시 확인한 후 연결한다 (역극성 시 고장)
- 단자함 내부에 설치할 경우 내열성 실리콘 전선(AWG 22~24)을 사용한다

## 7. Waveshare 초기 설정

RS232/485 TO WIFI ETH (B) 모델도 동일한 웹 UI를 사용하므로 같은 절차로 설정한다.

### 7.1. WiFi 연결 설정

Waveshare 장치의 초기 설정 절차는 다음과 같다.

1. Waveshare에 전원을 인가하면 자체 AP가 활성화된다
2. PC 또는 스마트폰에서 `Waveshare_xxxx` AP에 연결한다
3. 브라우저에서 `http://10.10.100.254`로 접속한다
4. 좌측 메뉴에서 **WiFi** 설정으로 이동한다
5. **STA Mode**를 활성화하고 집 공유기의 SSID와 비밀번호를 입력한다
6. 설정을 저장하고 장치를 재부팅한다

### 7.2. TCP Server 모드 설정

Home Assistant에서 TCP 소켓으로 패킷을 수신하려면 TCP Server 모드를 설정해야 한다.

| 항목 | 값 |
|---|---|
| **Working Mode** | TCP Server |
| **Local Port** | 8899 |
| **Max Clients** | 4 (기본값) |

### 7.3. 시리얼 파라미터 설정

월패드의 RS485 통신 파라미터에 맞춰 설정한다.

| 항목 | 값 |
|---|---|
| **Baud Rate** | 9600 |
| **Data Bits** | 8 |
| **Parity** | None |
| **Stop Bits** | 1 |
| **Flow Control** | Disable |

### 7.4. 고정 IP 할당

Home Assistant에서 변환기의 IP가 변경되면 연결이 끊기므로 고정 IP를 할당해야 한다. 두 가지 방법이 있다.

- **공유기 DHCP 고정 할당**: 공유기 관리 페이지에서 Waveshare의 MAC 주소에 고정 IP를 할당한다
- **장치 내 고정 IP 설정**: Waveshare 웹 UI에서 STA Mode의 IP를 Static으로 설정하고 IP, 서브넷 마스크, 게이트웨이를 직접 입력한다

공유기에서 DHCP 고정 할당하는 방법을 권장한다. 장치 내에서 직접 설정하면 공유기를 변경할 때 재설정이 필요하다.

## 8. HF2211S 초기 설정

HF2211S는 EW11A-0과 같은 제조사(Hi-Flying)의 제품으로 웹 UI가 동일하다. AP 이름만 `HF2211S_xxxx`로 다르고 나머지 설정 절차는 아래 EW11A-0 섹션과 동일하게 진행하면 된다.

## 9. EW11A-0 초기 설정

### 9.1. WiFi 연결 설정 (AP 모드 → STA 모드)

EW11A-0의 초기 설정 절차는 다음과 같다.

1. EW11A-0에 전원을 인가하면 자체 AP가 활성화된다
2. PC 또는 스마트폰에서 `EW11A-0_xxxx` AP에 연결한다
3. 브라우저에서 `http://10.10.100.254`로 접속한다
4. **System Settings**에서 기본 비밀번호(admin/admin)로 로그인한다
5. **WiFi Settings**에서 **STA Mode**를 선택한다
6. **Scan** 버튼을 눌러 주변 AP 목록을 불러온다
7. 집 공유기의 SSID를 선택하고 비밀번호를 입력한다
8. 설정을 저장하고 장치를 재부팅한다

재부팅 후 EW11A-0은 집 공유기에 자동 연결된다. 공유기 관리 페이지에서 할당된 IP를 확인한 후 브라우저로 접속하여 나머지 설정을 진행한다.

### 9.2. TCP Server 모드 설정

**Communication Settings**에서 다음과 같이 설정한다.

| 항목 | 값 |
|---|---|
| **Protocol** | TCP Server |
| **Local Port** | 8899 |
| **Max Clients** | 4 |

### 9.3. 시리얼 파라미터 설정

**Serial Port Settings**에서 월패드의 RS485 통신 파라미터에 맞춰 설정한다.

| 항목 | 값 |
|---|---|
| **Baud Rate** | 9600 |
| **Data Bits** | 8 |
| **Parity** | None |
| **Stop Bits** | 1 |
| **Flow Control** | Disable |

### 9.4. 고정 IP 할당

Waveshare와 동일하게 공유기 DHCP 고정 할당을 권장한다. EW11A-0 웹 UI에서도 Static IP를 설정할 수 있지만 공유기 변경 시 재설정이 필요하다.

## 10. 통신 테스트

### 10.1. TCP 소켓으로 패킷 수신 확인

RS485-WiFi 변환기의 설정이 완료되면 TCP 소켓을 통해 월패드 패킷이 정상적으로 수신되는지 확인한다. 다음 Python 코드로 테스트할 수 있다.

```python
import socket

HOST = "192.168.x.x"   # RS485-WiFi 변환기의 IP 주소
PORT = 8899            # TCP Server 포트

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.connect((HOST, PORT))
    print(f"Connected to {HOST}:{PORT}")

    while True:
        data = s.recv(1024)
        if data:
            hex_data = data.hex()
            print(f"Received: {hex_data}")
```

월패드가 정상적으로 통신 중이면 주기적으로 패킷이 수신된다.

### 10.2. 현대통신 패킷 구조

현대통신(IMAZU) 월패드의 RS485 패킷 구조는 다음과 같다.

```
+--------+------+--------+------+------+------+------+------+----------+------+
| Header | Len  | 01/1a  | Dev  | Cmd  | Func | Sub  | Val  |   Data   | Tail |
|  0xF7  |      |        |      |      |      |      |      |          | 0xEE |
+--------+------+--------+------+------+------+------+------+----------+------+
```

| 필드 | 설명 |
|---|---|
| **Header** | 패킷 시작 바이트 `0xF7` |
| **Len** | 전체 패킷 길이 (Header~Tail 포함) |
| **01/1a** | 기기 프로토콜 구분 (`01`: 일반, `1a`: 난방) |
| **Dev** | 기기 타입 (조명: `19`, 난방: `18`, 가스: `1b`, 에어컨: `1c`, 스위치: `1f`, 환풍기: `2b` 등) |
| **Cmd** | 명령 타입 (스캔: `01`, 제어: `02`, 상태: `04`) |
| **Func** | 기능 코드 (On/Off: `40`, 온도: `45`, 모드: `46` 등) |
| **Sub** | 방 번호와 서브 ID |
| **Val** | 값 (On: `01`, Off: `02` 등) |
| **Data** | 추가 데이터 (기기에 따라 가변) |
| **Checksum** | XOR 체크섬 (Header부터 Data까지 XOR 연산) |
| **Tail** | 패킷 종료 바이트 `0xEE` |

### 10.3. 정상 수신 예시

정상적으로 패킷이 수신되면 다음과 같은 형태의 데이터가 출력된다.

```
Connected to 192.168.x.x:8899
Received: f7xx0119xxxxxxxxxxxxxxxxee    # 조명 상태 응답
Received: f7xx0118xxxxxxxxxxxxxxxxee    # 난방 상태 응답
Received: f7xx011bxxxxxxxxxxxxxxxxee    # 가스밸브 상태 응답
```

`f7`로 시작하고 `ee`로 끝나는 패킷이 주기적으로 수신되면 결선과 변환기 설정이 정상적으로 완료된 것이다.

## 11. 주의사항 및 트러블슈팅

### 11.1. RS485 극성(A+/B-) 반대 연결 시 증상

A+와 B-를 반대로 연결하면 다음과 같은 증상이 나타난다.

- TCP 소켓에 아무 데이터도 수신되지 않는다
- 간헐적으로 깨진 데이터(잘못된 바이트)가 수신된다
- `f7`로 시작하지 않는 의미 없는 패킷이 수신된다

이 경우 RS485-WiFi 변환기의 A+와 B- 연결을 바꿔서 다시 시도한다. RS485는 극성을 반대로 연결해도 장치가 고장나지 않으므로 안심하고 교체할 수 있다.

### 11.2. GND 공통 연결

RS485 규격상 A+/B- 두 선만 연결해도 통신이 가능하지만 RS485-WiFi 변환기가 별도 전원을 사용하는 경우 GND를 함께 연결하는 것을 권장한다. 공통 GND 없이 운용하면 두 기기 사이의 기준 전위가 달라져 간헐적인 통신 오류나 패킷 손실이 발생할 수 있다. 변환기의 GND 단자를 월패드 또는 온수분배기의 RS485 GND에 연결하면 안정성이 향상된다.

### 11.3. 전원 부족 시 증상

RS485-WiFi 변환기에 충분한 전원이 공급되지 않으면 다음과 같은 증상이 나타난다.

- 장치가 반복적으로 재부팅된다
- WiFi 연결이 자주 끊긴다
- TCP 연결은 되지만 패킷이 수신되지 않는다

어댑터의 출력 전류가 변환기 사양을 충족하는지 확인한다. 일반적으로 5V 1A 이상이면 충분하다.

### 11.4. WiFi 끊김 대응

WiFi 환경에서 RS485-WiFi 변환기가 자주 끊기는 경우 다음을 확인한다.

- **고정 IP 할당**: DHCP 임대 갱신 실패로 인한 연결 끊김을 방지한다
- **WiFi 채널 고정**: 공유기의 WiFi 채널을 자동이 아닌 특정 채널로 고정한다. 자동 채널 전환 시 재접속에 시간이 소요될 수 있다
- **2.4GHz 사용**: 5GHz 대비 벽 투과력이 좋아 단자함 내부에서도 안정적이다
- **변환기 위치**: 단자함 내부의 금속 구조물에서 최대한 떨어진 곳에 설치한다

### 11.5. 화재 안전 주의사항

통신 단자함 내부에 전자 기기를 설치할 때 화재 안전에 주의해야 한다.

- KC 인증을 받은 전원 어댑터만 사용한다
- 전선 접합부는 절연 테이프 또는 수축 튜브로 반드시 절연 처리한다
- 단자함 내부에 가연물(종이, 스티로폼 등)을 넣지 않는다
- 전선이 꺾이거나 눌리지 않도록 여유 있게 정리한다
- 설치 후 발열이 없는지 주기적으로 확인한다

# 참고

- <https://cafe.naver.com/stsmarthome>
- <https://www.waveshare.com/rs232-485-to-wifi-eth-b.htm>
- <https://www.waveshare.com/wiki/RS485_TO_WIFI/ETH>
