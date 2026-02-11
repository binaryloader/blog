---
title: "[Synology] L2TP/IPSec VPN 서버 구축하기"
ref: synology-vpn-server-setup
excerpt: "Synology NAS에 L2TP/IPSec VPN 서버를 구축하고 외부에서 접속하는 방법을 정리한다."
date: 2026-02-11T00:00+09:00
last_modified_at: 2026-02-11T00:00+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Playground
  - Synology
tags:
  - Playground
  - Synology
  - VPN
  - L2TP
  - IPSec
depth:
  - title: "Playground"
    url: /ko/playground/
  - title: "Synology"
    url: /ko/playground/synology/
---

{% assign img_path = "/assets/image/post/playground/synology/synology-vpn-server-setup" %}

# 개요

Synology NAS에 L2TP/IPSec VPN 서버를 구축하고 외부에서 접속하는 방법을 정리한다.

# 정리

## 1. Synology VPN 서버 설정

DSM 패키지 센터에서 **VPN Server** 패키지를 설치한 후 VPN Server를 열고 좌측 메뉴에서 **L2TP/IPSec**을 선택한다.

![Synology VPN Server L2TP/IPSec 설정 화면]({{ img_path }}/vpn-server-l2tp-settings.png)

각 설정 항목은 다음과 같다.

| 항목 | 설명 |
|---|---|
| **L2TP/IPSec VPN 서버 활성화** | L2TP/IPSec VPN 서비스를 활성화하는 체크박스다. |
| **동적 IP 주소** | VPN 클라이언트에 할당할 가상 IP 대역을 설정한다. 예를 들어 `192.168.1.0`으로 설정하면 접속한 클라이언트는 `192.168.1.x` 대역의 IP를 할당받는다. 내부 네트워크와 충돌하지 않는 대역을 사용해야 한다. |
| **최대 연결 수** | VPN에 동시에 접속할 수 있는 최대 클라이언트 수다. |
| **계정 최대 연결 수** | 하나의 계정으로 동시에 접속할 수 있는 최대 수다. |
| **인증** | 클라이언트 인증 방식을 선택한다. **MS-CHAP v2**는 암호화된 인증을 제공하므로 권장된다. |
| **MTU** | Maximum Transmission Unit의 약자로 한 번에 전송할 수 있는 최대 패킷 크기다. 기본값 `1400`을 사용하면 된다. |
| **수동 DNS 사용** | VPN 접속 시 사용할 DNS 서버를 수동으로 지정할 수 있다. 체크하지 않으면 Synology의 DNS 설정을 따른다. |
| **커널 모드(kernel)에서 실행** | VPN을 커널 레벨에서 처리하여 성능을 향상시킨다. 활성화를 권장한다. |
| **사전 공유 키** | IPSec 암호화에 사용되는 공유 키다. 클라이언트에서 VPN 접속 시 이 키를 입력해야 한다. 충분히 복잡한 값을 설정해야 한다. |
| **SHA2-256 호환 모드 활성화(96 비트)** | 일부 오래된 클라이언트와의 호환성을 위한 옵션이다. 일반적으로 비활성화 상태로 둔다. |

설정을 완료한 후 **적용** 버튼을 클릭한다.

## 2. Synology 방화벽 설정

DSM **제어판 > 보안 > 방화벽**에서 방화벽 규칙을 편집한다. 내장 응용 프로그램 선택 화면에서 VPN Server 관련 포트를 허용해야 한다.

![Synology 방화벽 내장 응용 프로그램 선택 화면]({{ img_path }}/firewall-builtin-app-selection.png)

L2TP/IPSec VPN에 필요한 항목은 다음 두 가지다.

| 항목 | 포트 | 설명 |
|---|---|---|
| **VPN Server (L2TP/IPSec)** | 1701 | L2TP 터널링 포트다. |
| **VPN Server (L2TP/IPSec)** | 500, 4500 | IPSec에 사용되는 IKE(500)와 NAT Traversal(4500) 포트다. |

이 두 항목을 체크하고 **확인**을 눌러 방화벽 규칙에 추가한다.

## 3. 공유기 포트포워딩

외부에서 VPN 서버에 접속하려면 공유기에서 관련 포트를 NAS의 내부 IP로 포워딩해야 한다.

![공유기 포트포워딩 설정 화면]({{ img_path }}/router-port-forwarding.png)

| 항목 | 값 |
|---|---|
| **서비스 이름** | L2TP / IPSec VPN Server (식별용 이름) |
| **외부 포트** | 500, 1701, 4500 |
| **내부 포트** | (외부 포트와 동일) |
| **내부 IP 주소** | Synology NAS의 내부 IP 주소 (예: `192.168.x.x`) |
| **프로토콜** | UDP |

L2TP/IPSec은 UDP 프로토콜을 사용하므로 반드시 **UDP**로 설정해야 한다.

## 4. 도메인 연동

매번 변경될 수 있는 공인 IP 대신 도메인을 사용하면 편리하다. DNS 관리 화면에서 VPN 접속용 레코드를 추가한다.

![DNS 레코드 설정 화면]({{ img_path }}/domain-dns-records.png)

| Type | Host | Value | 설명 |
|---|---|---|---|
| **A Record** | vpn | 공인 IP 주소 (예: `210.x.x.x`) | `vpn.yourdomain.com`으로 VPN 서버에 접속할 수 있게 된다. |

A Record의 Host에 `vpn`을 입력하면 `vpn.yourdomain.com` 형태로 접속할 수 있다. Value에는 공유기의 공인 IP 주소를 입력한다.

공인 IP가 유동 IP인 경우 Synology의 DDNS 기능이나 별도의 DDNS 서비스를 활용하여 IP가 변경될 때 자동으로 갱신되도록 설정하는 것을 권장한다.

## 5. 아이폰 설정

아이폰에서 **설정 > 일반 > VPN 및 기기 관리 > VPN > VPN 구성 추가**로 이동한다.

![아이폰 L2TP VPN 설정 화면]({{ img_path }}/iphone-vpn-settings.png){: .align-center style="max-width: min(400px, 100%);"}

유형을 **L2TP**로 선택한 후 각 항목을 입력한다.

| 항목 | 설명 |
|---|---|
| **유형** | **L2TP**를 선택한다. |
| **설명** | VPN 연결의 이름이다. 식별하기 쉬운 이름을 자유롭게 입력한다. (예: Home) |
| **서버** | VPN 서버의 주소를 입력한다. 도메인을 설정한 경우 `vpn.yourdomain.com`을 입력한다. |
| **계정** | Synology DSM의 사용자 계정 이름을 입력한다. |
| **RSA SecurID** | 사용하지 않으므로 비활성화 상태로 둔다. |
| **암호** | DSM 사용자 계정의 비밀번호를 입력한다. |
| **비밀** | VPN 서버에서 설정한 **사전 공유 키**를 입력한다. |
| **모든 트래픽 보내기** | 활성화하면 VPN 연결 시 모든 인터넷 트래픽이 VPN을 통해 전송된다. 보안을 위해 활성화를 권장한다. |

설정을 완료한 후 우측 상단의 체크 버튼을 눌러 저장하면 VPN에 접속할 수 있다.
