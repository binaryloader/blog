---
title: "[SmartHome] 現代通信ウォールパッド RS485-WiFi変換器 交換検討"
ref: wallpad-rs485-hardware-setup
lang: ja
permalink: /ja/:categories/:title/
excerpt: "既存のRaspberry Pi + RS485 TO USB構成のメンテナンス問題を改善するため、RS485-WiFi変換器への交換を検討した内容をまとめます。"
date: 2026-02-18T17:34+09:00
last_modified_at: 2026-02-18T17:34+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/wallpad-rs485-hardware-setup.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/wallpad-rs485-hardware-setup.png"
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
    url: /ja/playground/
  - title: "SmartHome"
    url: /ja/playground/smarthome/
gallery_hardware:
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/raspberry-pi-4.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/raspberry-pi-4.jpg
    alt: "Raspberry Pi 4 Model B"
    title: "Raspberry Pi 4 Model B"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-installed.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-installed.jpg
    alt: "壁面に設置された温水コントローラー"
    title: "壁面に設置された温水コントローラー"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-pcb.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-pcb.jpg
    alt: "温水コントローラーPCBボード（MC200N）"
    title: "温水コントローラーPCBボード（MC200N）— 青いスクリューターミナルにRS485および通信線が接続されている"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-terminal.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/water-controller-terminal.jpg
    alt: "温水コントローラースクリューターミナルのクローズアップ"
    title: "温水コントローラースクリューターミナルのクローズアップ — UTPケーブルが接続されている"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/rs485-twisted-pair.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/rs485-twisted-pair.jpg
    alt: "UTPケーブルから分離したRS485ツイストペア"
    title: "UTPケーブルから分離したRS485ツイストペア"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/rpi-rs485-honeywell.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/rpi-rs485-honeywell.jpg
    alt: "ハニウェル温水分配器の上に設置されたRaspberry Pi 4とRS485 TO USB変換器"
    title: "ハニウェル温水分配器の上に設置されたRaspberry Pi 4とRS485 TO USB変換器"
gallery_dashboard:
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/ha-dashboard-living.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/ha-dashboard-living.jpg
    alt: "Home Assistantダッシュボード — リビング"
    title: "Home Assistantダッシュボード — リビング"
  - url: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/ha-dashboard-room.jpg
    image_path: /assets/image/post/playground/smarthome/wallpad-rs485-hardware-setup/ha-dashboard-room.jpg
    alt: "Home Assistantダッシュボード — 部屋"
    title: "Home Assistantダッシュボード — 部屋"
---

# 概要

既存のRaspberry Pi + RS485 TO USB構成のメンテナンス問題を改善するため、RS485-WiFi変換器への交換を検討した内容をまとめます。

# 手順

## 1. 既存構成

既存の構成では、Raspberry Pi 4にHome Assistantをインストールし、RS485 TO USB変換器をUSBで直接接続してウォールパッドを制御していました。

{% include gallery id="gallery_hardware" caption="Raspberry Pi 4にRS485 TO USB変換器を接続し、温水コントローラーのRS485端子から分岐して配線した構成" %}

動作自体は問題ありませんでしたが、メンテナンスが想像以上に大変でした。Home AssistantサーバーとRS485インターフェースが1台のRaspberry Piに紐づいているため、サーバーの交換や配置変更が難しく、SDカードの寿命問題も気にする必要がありました。

{% include gallery id="gallery_dashboard" caption="Home Assistantダッシュボードから照明、暖房、エアコン、カーテン、コンセントの電力モニタリングなどを制御していた" %}

RS485-WiFi変換器に交換すれば、Home Assistantサーバーを別のデバイス（NAS、ミニPCなど）に設置し、変換器だけをウォールパッド近くに置けばよいため、メンテナンスが容易になります。この記事では、交換のためのRS485-WiFi変換器のハードウェア構成と設定方法を検討します。

## 2. システム構成図

現代通信（IMAZU）ウォールパッドをHome Assistantで制御するには、ウォールパッドのRS485バスにRS485-WiFi変換器を接続し、TCP/IPネットワーク経由でパケットを中継する必要があります。システム全体の構成は以下の通りです。

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

ウォールパッドはRS485バスを通じて照明、暖房、ガスバルブ、換気扇、エアコンなどの各種機器を制御します。RS485-WiFi変換器はこのバスに並列接続され、パケットを受信してHome Assistantサーバーに転送します。

## 3. 部品リスト

### 3.1. 必須部品

| 部品 | 用途 |
|---|---|
| **RS485-WiFi変換器** | RS485信号をTCP/IPに変換します。Waveshare RS485 TO WIFI/ETH、Waveshare RS232/485 TO WIFI ETH (B)、Hi-Flying HF2211S、Hi-Flying EW11A-0のいずれかを選択します。 |
| **DCアダプター（5Vまたは12V）** | RS485-WiFi変換器に電源を供給します。変換器の仕様に合った電圧を選択します。 |
| **UTPケーブル（Cat.5e以上）** | RS485 A+/B-信号線の配線に使用します。既存の配線がない場合に必要です。 |
| **Home Assistantサーバー** | ウォールパッドのパケットを受信し、機器を制御するホームオートメーションサーバーです。 |

### 3.2. RS485-WiFi変換器比較

| 項目 | Waveshare RS485 TO WIFI/ETH | Waveshare RS232/485 TO WIFI ETH (B) | Hi-Flying HF2211S | Hi-Flying EW11A-0 |
|---|---|---|---|---|
| **接続方式** | WiFi + Ethernet（RJ45） | WiFi + Ethernet（RJ45） | WiFiのみ | WiFiのみ |
| **電源** | スクリューターミナル（5〜36V）またはPoE | DC 5.5mmジャック + スクリューターミナル（6〜36V）、PoE対応 | スクリューターミナル（5〜36V） | スクリューターミナル（5〜18V）またはDCジャック |
| **RS485接続** | スクリューターミナル（A+、B-、GND） | スクリューターミナル（A+、B-） | スクリューターミナル（A、B、GND） | スクリューターミナル（A+、B-、VCC、GND） |
| **外装** | プラスチック | 金属ケース（84x64x24mm） | プラスチック（79x53x25mm） | プラスチック |
| **設定方式** | Web UI（ブラウザ） | Web UI（ブラウザ） | Web UI（ブラウザ） | Web UI（ブラウザ） |
| **メリット** | Ethernet対応で安定、PoE対応可能 | DCジャックで電源接続が簡単、金属外装、PoE対応可能 | 広い電圧範囲（5〜36V）、RS485 8kV ESD保護 | 小型で狭いスペースに設置しやすい |
| **デメリット** | スクリューターミナル電源接続が面倒 | 価格が比較的高い | WiFiのみ対応、内蔵アンテナで受信感度が低い | WiFiのみ対応のため環境によって不安定 |

有線Ethernetが利用可能な環境ではWaveshareが適しており、設置スペースが狭い場合やWiFiのみ利用可能な環境ではEW11A-0が適しています。広い入力電圧範囲やESD保護が重要な環境ではHF2211Sを選択します。スクリューターミナルへの配線が面倒な場合は、DC 5.5mmジャックに対応したRS232/485 TO WIFI ETH (B) モデルを選択できます。

### 3.3. 補助部品

| 部品 | 用途 |
|---|---|
| **DCジャック-スクリューターミナル変換コネクタ** | EW11A-0にDCアダプターを接続する際に便利です。 |
| **シリコン電線（AWG 22〜24）** | RS485配線の延長が必要な場合に使用します。耐熱性に優れています。 |
| **フェルール端子** | スクリューターミナルに電線を確実に固定します。 |
| **絶縁テープまたは熱収縮チューブ** | 露出した配線接合部を絶縁処理します。 |

## 4. RS485の基礎

### 4.1. RS485通信とは

RS485は産業用途で広く使用されている差動信号ベースのシリアル通信規格です。一つのバスに複数のデバイスを接続できるマルチドロップ方式をサポートし、最大1,200mまでの通信が可能です。マンションのウォールパッドシステムでは、ウォールパッド（マスター）と各種機器（スレーブ）が一つのRS485バスを共有して通信します。

### 4.2. A+/B- 差動信号

RS485は2本の信号線A+とB-の電圧差でデータを伝送します。

```
        A+ -----+     +-----+     +-----
                |     |     |     |
        B- -+   | +---+     +---+ |
            |   | |             | |
            +---+ +-------------+ +-----

        Logic 1: A+ > B- (positive)
        Logic 0: A+ < B- (negative)
```

外部ノイズが両方の信号線に同じように混入しても電圧差は維持されるため、ノイズに強いです。この特性により、マンション内部の長い配線環境でも安定して動作します。

### 4.3. 9600ボー、8N1設定

現代通信ウォールパッドのRS485通信は以下のパラメータを使用します。

| 項目 | 値 | 説明 |
|---|---|---|
| **ボーレート** | 9600 | 毎秒9600ビットを伝送します。 |
| **データビット** | 8 | 1フレームに8ビットのデータを伝送します。 |
| **パリティ** | None（N） | パリティビットを使用しません。 |
| **ストップビット** | 1 | 1ビットのストップビットを使用します。 |

この設定はRS485-WiFi変換器のシリアルパラメータにも同一に適用する必要があります。

## 5. 現代通信ウォールパッド RS485配線

### 5.1. ウォールパッド端子箱の構造

マンションのRS485通信線は通常、玄関付近の通信端子箱（分配ボックス）またはウォールパッドの背面に集中しています。現代通信ウォールパッドシステムの一般的な配線構造は以下の通りです。

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

RS485バスはデイジーチェーン方式で接続されており、A+はA+同士、B-はB-同士が接続されています。

### 5.2. RS485 A+/B-線の見つけ方

通信端子箱の内部でRS485通信線を見つける方法は以下の通りです。

- ウォールパッド背面のコネクタでRS485表示がある端子を確認します
- 通常2線（A+、B-）で構成されており、色は施工業者によって異なる場合があります
- マルチメーターで2本の線間の電圧を測定すると、通信中は0〜5Vの範囲で変動するのが確認できます
- 通信がない状態では約0Vまたは一定のDC電圧が測定されます

### 5.3. Honeywell温水分配器から配線する場合

暖房制御用のHoneywell温水分配器が設置されている場合、温水分配器のRS485端子から分岐して接続できます。

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

温水分配器のOUT端子からRS485-WiFi変換器に分岐します。IN端子にはウォールパッドからの既存配線が接続されています。

### 5.4. サブフォンの背面から配線する場合

リビングや各部屋のサブフォン（インターホン）の背面にもRS485配線が来ている場合があります。サブフォンの背面から配線すれば、通信端子箱にアクセスする必要がありません。

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

既存の配線はそのままにして、A+/B-線に並列でRS485-WiFi変換器を接続します。

### 5.5. ウォールパッドの背面から配線する場合

ウォールパッドの背面から直接配線するのが最も確実な方法です。ウォールパッド本体のRS485端子から直接分岐します。

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

ウォールパッドのRS485端子からA+/B-の2本だけを分岐してRS485-WiFi変換器に接続します。VCCとGNDはウォールパッドの電源なので変換器の電源には使用しません。

## 6. 電源供給

### 6.1. Waveshareの電源供給

Waveshare RS485 TO WIFI/ETHは2つの方法で電源を供給できます。

#### 方法1: DCアダプター（WiFi使用時）

スクリューターミナル（VIN/GND）に5〜36Vアダプターを接続します。最も簡単な方法です。

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

#### 方法2: PoE（有線Ethernet使用時）

PoEスイッチまたはPoEインジェクターを使用すると、Ethernetケーブル1本でデータと電源を同時に供給できます。

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

PoEを使用すれば別途の電源アダプターが不要になり、すっきりとした設置が可能です。

RS232/485 TO WIFI ETH (B) モデルはDC 5.5mmジャックに対応しているため、アダプターを直接接続できます。スクリューターミナルへの配線が不要で設置が簡単です。入力電圧範囲は6〜36Vで、PoEにも対応しています。

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

### 6.2. HF2211Sの電源供給

HF2211Sはスクリューターミナルを通じて電源を受けます。入力電圧範囲が5〜36Vと広く、様々なアダプターが使用できます。

```
+------------------------------+
|          HF2211S             |
|                              |
|   [A] [B] [GND] [V+] [GND]   |
+---+---+----+-----+-----+-----+
    |   |    |     |     |
    |   |    |     |     +---- GND ---- DC Adapter (-)
    |   |    |     +---------- V+  ---- DC Adapter (+) (5~36V)
    |   |    +---------------- GND ---- (RS485 GND、オプション)
    |   +--------------------- B   ---- RS485 B-
    +------------------------- A   ---- RS485 A+
```

### 6.3. EW11A-0の電源供給

EW11A-0はスクリューターミナルを通じて電源を受けます。ピン配置は以下の通りです。

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

DCジャックコネクタ付きのアダプターを使用する場合、DCジャック-スクリューターミナル変換コネクタを活用すると便利です。

```
DC Adapter ---- [DC Jack] ---- [Screw Terminal Adapter] ---- EW11A-0 [VCC/GND]
```

電源供給時の注意事項は以下の通りです。

- 認証済みの電源アダプターを使用します（火災予防）
- アダプターの出力電圧が5〜18Vの範囲内であることを確認します
- VCCとGNDの極性を必ず確認してから接続します（逆極性は故障の原因になります）
- 端子箱内部に設置する場合、耐熱性シリコン電線（AWG 22〜24）を使用します

## 7. Waveshare初期設定

RS232/485 TO WIFI ETH (B) モデルも同じWeb UIを使用するため、同じ手順で設定します。

### 7.1. WiFi接続設定

Waveshareデバイスの初期設定手順は以下の通りです。

1. Waveshareに電源を投入すると内蔵APが有効になります
2. PCまたはスマートフォンから`Waveshare_xxxx` APに接続します
3. ブラウザで`http://10.10.100.254`にアクセスします
4. 左側メニューから**WiFi**設定に移動します
5. **STA Mode**を有効にし、自宅ルーターのSSIDとパスワードを入力します
6. 設定を保存してデバイスを再起動します

### 7.2. TCP Serverモード設定

Home AssistantからTCPソケット経由でパケットを受信するには、TCP Serverモードを設定する必要があります。

| 項目 | 値 |
|---|---|
| **Working Mode** | TCP Server |
| **Local Port** | 8899 |
| **Max Clients** | 4（デフォルト） |

### 7.3. シリアルパラメータ設定

ウォールパッドのRS485通信パラメータに合わせて設定します。

| 項目 | 値 |
|---|---|
| **Baud Rate** | 9600 |
| **Data Bits** | 8 |
| **Parity** | None |
| **Stop Bits** | 1 |
| **Flow Control** | Disable |

### 7.4. 固定IP割り当て

Home Assistantでは変換器のIPが変更されると接続が切断されるため、固定IPを割り当てる必要があります。2つの方法があります。

- **ルーターDHCP固定割り当て**: ルーターの管理ページでWaveshareのMACアドレスに固定IPを割り当てます
- **デバイス内固定IP設定**: Waveshare Web UIでSTA ModeのIPをStaticに設定し、IP、サブネットマスク、ゲートウェイを直接入力します

ルーターでのDHCP固定割り当てを推奨します。デバイス内で直接設定すると、ルーター変更時に再設定が必要になります。

## 8. HF2211S 初期設定

HF2211SはEW11A-0と同じメーカー（Hi-Flying）の製品で、Web UIが同一です。AP名が`HF2211S_xxxx`であること以外は、以下のEW11A-0セクションと同じ手順で設定します。

## 9. EW11A-0 初期設定

### 9.1. WiFi接続設定（APモード → STAモード）

EW11A-0の初期設定手順は以下の通りです。

1. EW11A-0に電源を投入すると内蔵APが有効になります
2. PCまたはスマートフォンから`EW11A-0_xxxx` APに接続します
3. ブラウザで`http://10.10.100.254`にアクセスします
4. **System Settings**でデフォルトパスワード（admin/admin）でログインします
5. **WiFi Settings**で**STA Mode**を選択します
6. **Scan**ボタンを押して周辺のAP一覧を読み込みます
7. 自宅ルーターのSSIDを選択してパスワードを入力します
8. 設定を保存してデバイスを再起動します

再起動後、EW11A-0は自宅ルーターに自動接続されます。ルーターの管理ページで割り当てられたIPを確認し、ブラウザでアクセスして残りの設定を行います。

### 9.2. TCP Serverモード設定

**Communication Settings**で以下のように設定します。

| 項目 | 値 |
|---|---|
| **Protocol** | TCP Server |
| **Local Port** | 8899 |
| **Max Clients** | 4 |

### 9.3. シリアルパラメータ設定

**Serial Port Settings**でウォールパッドのRS485通信パラメータに合わせて設定します。

| 項目 | 値 |
|---|---|
| **Baud Rate** | 9600 |
| **Data Bits** | 8 |
| **Parity** | None |
| **Stop Bits** | 1 |
| **Flow Control** | Disable |

### 9.4. 固定IP割り当て

Waveshareと同様にルーターのDHCP固定割り当てを推奨します。EW11A-0のWeb UIでもStatic IPを設定できますが、ルーター変更時に再設定が必要になります。

## 10. 通信テスト

### 10.1. TCPソケットによるパケット受信確認

RS485-WiFi変換器の設定が完了したら、TCPソケット経由でウォールパッドのパケットが正常に受信されるか確認します。以下のPythonコードでテストできます。

```python
import socket

HOST = "192.168.x.x"   # RS485-WiFi変換器のIPアドレス
PORT = 8899            # TCP Serverポート

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.connect((HOST, PORT))
    print(f"Connected to {HOST}:{PORT}")

    while True:
        data = s.recv(1024)
        if data:
            hex_data = data.hex()
            print(f"Received: {hex_data}")
```

ウォールパッドが正常に通信していれば、定期的にパケットが受信されます。

### 10.2. 現代通信パケット構造

現代通信（IMAZU）ウォールパッドのRS485パケット構造は以下の通りです。

```
+--------+------+--------+------+------+------+------+------+----------+------+
| Header | Len  | 01/1a  | Dev  | Cmd  | Func | Sub  | Val  |   Data   | Tail |
|  0xF7  |      |        |      |      |      |      |      |          | 0xEE |
+--------+------+--------+------+------+------+------+------+----------+------+
```

| フィールド | 説明 |
|---|---|
| **Header** | パケット開始バイト `0xF7` |
| **Len** | パケット全体の長さ（HeaderからTailまで含む） |
| **01/1a** | デバイスプロトコル識別子（`01`: 一般、`1a`: 暖房） |
| **Dev** | デバイスタイプ（照明: `19`、暖房: `18`、ガス: `1b`、エアコン: `1c`、スイッチ: `1f`、換気扇: `2b`など） |
| **Cmd** | コマンドタイプ（スキャン: `01`、制御: `02`、ステータス: `04`） |
| **Func** | 機能コード（On/Off: `40`、温度: `45`、モード: `46`など） |
| **Sub** | 部屋番号とサブデバイスID |
| **Val** | 値（On: `01`、Off: `02`など） |
| **Data** | 追加データ（デバイスにより可変長） |
| **Checksum** | XORチェックサム（HeaderからDataまでのXOR演算） |
| **Tail** | パケット終了バイト `0xEE` |

### 10.3. 正常受信例

パケットが正常に受信されると、以下のようなデータが出力されます。

```
Connected to 192.168.x.x:8899
Received: f7xx0119xxxxxxxxxxxxxxxxee    # 照明ステータス応答
Received: f7xx0118xxxxxxxxxxxxxxxxee    # 暖房ステータス応答
Received: f7xx011bxxxxxxxxxxxxxxxxee    # ガスバルブステータス応答
```

`f7`で始まり`ee`で終わるパケットが定期的に受信されれば、配線と変換器の設定が正常に完了しています。

## 11. 注意事項とトラブルシューティング

### 11.1. RS485極性（A+/B-）逆接続時の症状

A+とB-を逆に接続すると、以下の症状が現れます。

- TCPソケットにデータが一切受信されない
- 断続的に壊れたデータ（不正なバイト）が受信される
- `f7`で始まらない意味のないパケットが受信される

この場合、RS485-WiFi変換器のA+とB-の接続を入れ替えて再試行します。RS485は極性を逆に接続してもデバイスが故障することはないため、安心して交換できます。

### 11.2. 共通GND接続

RS485の規格上はA+/B-の2本だけで通信可能ですが、RS485-WiFi変換器が別電源を使用する場合はGNDも一緒に接続することを推奨します。共通GNDなしで運用すると2つの機器間の基準電位がずれ、間欠的な通信エラーやパケットロスが発生する可能性があります。変換器のGND端子をウォールパッドまたは温水分配器のRS485 GNDに接続すると安定性が向上します。

### 11.3. 電力不足時の症状

RS485-WiFi変換器に十分な電力が供給されない場合、以下の症状が現れます。

- デバイスが繰り返し再起動する
- WiFi接続が頻繁に切断される
- TCP接続はできるがパケットが受信されない

アダプターの出力電流が変換器の仕様を満たしているか確認します。一般的に5V 1A以上あれば十分です。

### 11.4. WiFi切断への対応

WiFi環境でRS485-WiFi変換器が頻繁に切断される場合、以下を確認します。

- **固定IP割り当て**: DHCPリース更新の失敗による接続切断を防止します
- **WiFiチャネル固定**: ルーターのWiFiチャネルを自動ではなく特定のチャネルに固定します。自動チャネル切り替え時に再接続に時間がかかる場合があります
- **2.4GHz使用**: 5GHzと比較して壁の透過力が高く、端子箱内部でも安定しています
- **変換器の設置位置**: 端子箱内部の金属構造物からできるだけ離れた場所に設置します

### 11.5. 火災安全に関する注意事項

通信端子箱の内部に電子機器を設置する際は、火災安全に注意する必要があります。

- 認証済みの電源アダプターのみを使用します
- 露出した配線接合部は絶縁テープまたは熱収縮チューブで必ず絶縁処理します
- 端子箱内部に可燃物（紙、発泡スチロールなど）を入れないようにします
- 電線が折れたり押しつぶされたりしないよう余裕を持って整理します
- 設置後、発熱がないか定期的に確認します

# 参考

- <https://cafe.naver.com/stsmarthome>
- <https://www.waveshare.com/rs232-485-to-wifi-eth-b.htm>
- <https://www.waveshare.com/wiki/RS485_TO_WIFI/ETH>
