---
title: "[SmartHome] 引っ越し後のLAN配線工事とテレビ周りのケーブル整理"
ref: diy-lan-wiring-cable-management
lang: ja
permalink: /ja/:categories/:title/
excerpt: "両親の引っ越し後に切られたLANポートの復旧、RJ45コネクタの圧着、テレビ裏のケーブル整理をDIYで行った経験をまとめる。"
date: 2026-02-18T19:00+09:00
last_modified_at: 2026-02-18T19:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/diy-lan-wiring-cable-management.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/diy-lan-wiring-cable-management.png"
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
    alt: "UTPケーブルストリッパーで被覆を剥く"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/wire-arrangement.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/wire-arrangement.jpg
    alt: "T568B順に芯線を配列"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/rj45-connector.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/rj45-connector.jpg
    alt: "RJ45コネクタの圧着完了"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/cable-tester.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/cable-tester.jpg
    alt: "LANstar XT-468テスターで全8ピン通過を確認"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/floor-outlet-box.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/floor-outlet-box.jpg
    alt: "床埋め込みコンセントでの作業"
gallery_result:
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/tv-mount-power-strip.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/tv-mount-power-strip.jpg
    alt: "テレビ壁掛けブラケットに電源タップをケーブルタイで固定"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/router-behind-tv.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/router-behind-tv.jpg
    alt: "テレビの裏にルーターを隠して整理"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/final-result.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/final-result.jpg
    alt: "完成したリビングの様子"
gallery_aftermath:
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/tools-overview.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/tools-overview.jpg
    alt: "作業後の散らかった現場"
  - url: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/battle-scars.jpg
    image_path: /assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/battle-scars.jpg
    alt: "作業中に負った手の傷"
depth:
  - title: "Playground"
    url: /ja/playground/
  - title: "SmartHome"
    url: /ja/playground/smarthome/
---

# 概要

両親の引っ越し後に切られたLANポートの復旧、RJ45コネクタの圧着、テレビ裏のケーブル整理をDIYで行った経験をまとめる。

# 手順

両親が引っ越した新しいマンションで、以前お住まいだった方がLANポートのケーブルを何本か切って出て行ったことがわかった。業者を呼ぶと出張費だけでも無駄だし道具さえあればできる作業なので、LAN配線の復旧とテレビ裏のケーブル整理を自分でやることにした。

## 1. LANポートの復旧

### 1.1. 床埋め込みコンセントの確認

テレビ付近の床埋め込みコンセントを開けてみると、LANポートのケーブルが切られていた。きれいに切られたのではなく引きちぎられたような状態で、既存のケーブルでは復旧が不可能だった。キーストーンジャックとRJ45コネクタをすべて新しく作り直すことにした。

![切られたキーストーンジャック](/assets/image/post/playground/smarthome/diy-lan-wiring-cable-management/keystone-jack-wiring.jpg){: style="max-width: min(400px, 100%);"}

### 1.2. 必要な道具と部品

作業に必要な道具と部品は以下の通りである。

- CAT.5Eキーストーンジャック（壁埋め込みコンセント用）
- RJ45コネクタ + コネクタブーツ
- UTPケーブルストリッパー（被覆剥き用）
- 圧着工具（かしめ工具）
- LANケーブルテスター（LANstar XT-468）
- パンチダウン工具（キーストーンジャック結線用）
- ドライバー、ハサミ、手袋など

キーストーンジャックとRJ45コネクタはオンラインで安く購入でき、圧着工具とテスターも一度買えば何度でも使えるのでコストパフォーマンスが良い。

### 1.3. 結線作業

まずUTPケーブルストリッパーで外被を剥く。ストリッパーにケーブルを挟んで一回転させるときれいに剥ける。被覆を剥くと4ペア8芯のツイストペアが出てくるので、これを1本ずつほどいて分離する。

分離した芯線をT568B順に配列する。T568Bの配線順序は白橙-橙-白緑-青-白青-緑-白茶-茶である。片側は新しいCAT.5Eキーストーンジャックに結線し、もう片側はRJ45コネクタを圧着する。キーストーンジャックの背面にはT568AとT568B両方のカラーガイドが印刷されているので、B側に従えばよい。

{% include gallery id="gallery_wiring" caption="被覆剥き → 芯線配列 → RJ45圧着 → テスター通過 → コンセント作業" %}

圧着は8本の芯線をRJ45コネクタに正しい順番で差し込み、圧着工具で圧着する作業である。芯線が細いため順番が入れ替わりやすく、奥まできちんと差し込まないと接触不良が起きる。初めての場合はコネクタを何個か無駄にする可能性があるので、予備を多めに用意しておくとよい。

結線が終わったらテスターで確認する。MasterとRemoteユニットにケーブルの両端をそれぞれ差し込み、電源を入れると1番から8番とGまでLEDが順番に点灯する。すべて緑色なら成功で、1つでも欠けたり順番がずれている場合は接触不良なので再度作業が必要になる。

## 2. テレビ裏のケーブル整理

LANポートの復旧ついでに、壁掛けテレビの裏側のケーブル整理も行った。壁掛けテレビの裏は電源ケーブル、HDMI、サウンドバーの光ケーブル、LANケーブルなどが絡み合い、放置するとすぐに散らかる。特にブラケットの下にケーブルが垂れるとテレビの下から丸見えになり、壁掛けにした意味がなくなる。

電源タップをケーブルタイで壁掛けブラケットの上部に固定した。こうすることで電源ケーブルが下に垂れずにテレビの裏で直接接続できる。ルーターもテレビの裏のスペースに置いて前から見えないようにした。ルーターをテレビの裏に隠してもWiFi信号にはほとんど影響がなかった。残りのケーブルはできるだけブラケットの裏側に通して、外からはすっきり見えるように整理した。

{% include gallery id="gallery_result" caption="電源タップをブラケットに固定 → ルーターを隠す → 完成" %}

# 感想

作業自体は難しくなかったが、床埋め込みコンセントの中で作業するのは狭くて手が大変だった。コンセントボックスに手を入れると金属フレームで引っかき傷ができるし、狭い空間でドライバーを回すと指が痛くなる。圧着工具も初めて使ったため芯線がうまく入らず、何度か失敗してコネクタを無駄にしてしまった。

{% include gallery id="gallery_aftermath" caption="戦いの痕跡" %}

それでも道具さえあれば誰でもできる作業である。業者に頼むと出張費込みで数万ウォンかかるが、道具を一度買えば何度でも使える。他の部屋のLANポートが故障した時やLANケーブルの長さを合わせたい時にもすぐ対応できるので便利である。

会社の先輩に作業写真を自慢したら通信兵出身かと聞かれたが、残念ながら憲兵出身である。ただし、自分も今年の8月に引っ越しを控えているが、その時は自分でやらず業者に頼むつもりだというオチがある。
