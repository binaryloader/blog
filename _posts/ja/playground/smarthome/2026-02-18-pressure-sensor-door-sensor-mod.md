---
title: "[SmartHome] 薄膜接触センサー + Zigbee ドアセンサー改造で在室検知の自動化"
ref: pressure-sensor-door-sensor-mod
lang: ja
permalink: /ja/:categories/:title/
excerpt: "Sonoff SNZB-04 Zigbee ドアセンサーのリードスイッチに薄膜接触センサーを接続し、椅子とキッチンマットで在室検知の自動化を実現した経験をまとめる。"
date: 2026-02-18T19:30+09:00
last_modified_at: 2026-02-18T19:30+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/pressure-sensor-door-sensor-mod.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/pressure-sensor-door-sensor-mod.png"
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
    alt: "Sonoff SNZB-04 開封"
  - url: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/sensor-disassembled.jpg
    image_path: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/sensor-disassembled.jpg
    alt: "ドアセンサー分解（CR2032バッテリー、PCB、ケース）"
  - url: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/pcb-reed-switch.jpg
    image_path: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/pcb-reed-switch.jpg
    alt: "PCB側面から見えるリードスイッチ"
gallery_mod:
  - url: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/drilling-case.jpg
    image_path: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/drilling-case.jpg
    alt: "ドリルでケースにケーブル穴を開ける"
  - url: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/soldered-wires.jpg
    image_path: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/soldered-wires.jpg
    alt: "リードスイッチの接点にワイヤーを巻き付けて結線"
  - url: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/assembled-in-case.jpg
    image_path: /assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/assembled-in-case.jpg
    alt: "基板をケースに戻してワイヤーを引き出した状態"
depth:
  - title: "Playground"
    url: /ja/playground/
  - title: "SmartHome"
    url: /ja/playground/smarthome/
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

# 概要

Sonoff SNZB-04 Zigbee ドアセンサーのリードスイッチに薄膜接触センサーを接続し、椅子とキッチンマットで在室検知の自動化を実現した経験をまとめる。

{% include video id="033_Jb5O1x4" provider="youtube" %}

# 手順

スマートホーム関連のコミュニティで薄膜接触センサーの共同購入の投稿を見かけた。薄膜接触センサーを椅子のクッションの下やキッチンのステップマットの下に敷いておけば、人が座っているか立っているかを検知でき、スマートホーム自動化のトリガーとして使えるというアイデアだった。すぐに購入してZigbeeドアセンサーに接続する作業をしてみることにした。

## 1. 原理

Sonoff SNZB-04はZigbeeベースのドア・窓センサーである。本体の中にリードスイッチがあり、磁石が近づくとリードスイッチが閉じて「閉」状態をハブに報告する。磁石が離れるとリードスイッチが開いて「開」を報告するシンプルな構造である。

このリードスイッチの接点に薄膜接触センサーを接続すれば、磁石の代わりに圧力で回路を開閉できる。薄膜接触センサーの上に人が座ったり立ったりすると回路が閉じ、ドアセンサーは「閉」と認識する。人が立ち上がると回路が開いて「開」になる。これをSmartThingsのようなスマートホームプラットフォームで自動化の条件として使えば在室検知センサーになるわけである。

## 2. 準備物

![準備物全体](/assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/materials-overview.jpg)

作業に必要な道具と部品は以下の通りである。

- 薄膜接触センサー（コミュニティ共同購入）
- Sonoff SNZB-04 Zigbee ドアセンサー
- ドリル（ケースに穴を開ける用）
- 2芯ワイヤー
- ドライバー、はさみなど

薄膜接触センサーは共同購入で安く手に入り、Sonoff SNZB-04も1個数百円で購入できるため、全体のコストは低い。

## 3. 分解

Sonoff SNZB-04を分解する。ケースはドライバーなしで爪でも開けられるほど簡単な構造である。蓋を開けるとCR2032バッテリーと小さなPCBが入っている。

PCBを取り出して側面を見るとリードスイッチが見える。リードスイッチはガラス管の中に2つの金属接点が入った部品で、外部の磁場に反応して接点がくっついたり離れたりする。このリードスイッチの両端子にワイヤーを接続すれば、外部の薄膜接触センサーで回路を制御できるようになる。

{% include gallery id="gallery_disassembly" caption="開封 → 分解 → リードスイッチ確認" %}

## 4. 改造

### 4.1. ケース加工

まずワイヤーが通る穴を開ける必要がある。ドアセンサーのケース側面にドリルで小さな穴を1つ開ける。ワイヤー2本が通る大きさで十分である。プラスチックが薄いので軽く力を入れるだけで貫通するため、ドリルの速度を落としてゆっくり作業するのが良い。

### 4.2. 結線

PCBのリードスイッチ両側の接点に2芯ワイヤーを巻き付けて接続する。家ではんだ付けすると匂いが出るため、はんだごてを使わずにワイヤーを端子にしっかり巻き付けて結線した。リードスイッチ自体が非常に小さいため作業はやや難しいが、接点にワイヤーをしっかり巻き付ければ十分に接触する。極性はないのでどちら側にどのワイヤーを接続しても問題ない。

### 4.3. 組み立て

結線が終わったらワイヤーを開けておいた穴から引き出し、PCBとバッテリーをケースに戻す。ワイヤーが挟まらないように整理しながら蓋を閉じれば改造完了である。

{% include gallery id="gallery_mod" caption="ドリル加工 → 結線 → 組み立て" %}

## 5. 完成と活用

組み立てが終わったらワイヤーの反対側を薄膜接触センサーに接続する。完成した姿はドアセンサー本体からケーブルが出て薄膜接触センサーストリップに繋がった形である。

![完成した薄膜接触センサー + ドアセンサー](/assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/completed-assembly.png)

このセンサーをSmartThingsに登録すればeWeLink連携で開閉状態を確認でき、自動化の設定も簡単である。

- 椅子のクッション下に設置：座ると「閉」→ モニターと照明オン、立つと「開」→ オフ
- キッチンのステップマット下に設置：立つと「閉」→ キッチン照明オン、離れると「開」→ オフ

![SmartThingsアプリ画面](/assets/image/post/playground/smarthome/pressure-sensor-door-sensor-mod/smartthings-app.png){: style="max-width: min(300px, 100%);"}

# 感想

作業自体は30分で終わる簡単な改造である。Sonoff SNZB-04は非常に安価で構造もシンプルなので気軽に試せる。はんだ付けなしでワイヤーを巻き付けるだけでも十分に動作するため、はんだごてがなくても問題ない。ただしリードスイッチの接点が小さいのでワイヤーを巻く際は少し注意が必要で、ケースに穴を開ける際はプラスチックが割れないようにドリルの速度を調整するのが良い。

実際に使ってみると椅子の自動化が特に便利である。席に座ると勝手にモニターと照明が点き、立ち上がると自動で消える。キッチンもマットに立つとすぐに照明が点くのでスイッチを押しに行く必要がない。こうした細かい自動化が積み重なると家が本当に快適になる。
