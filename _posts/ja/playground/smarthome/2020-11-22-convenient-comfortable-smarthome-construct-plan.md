---
date: 2020-11-22T00:00+09:00
title: "[SmartHome] 便利で快適なスマートホーム構築計画"
ref: smarthome-construct-plan
lang: ja
excerpt: "便利で快適なスマートホームインフラの構築計画をまとめます。"
last_modified_at: 2020-11-22T18:12+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/smarthome-construct-plan.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/smarthome-construct-plan.png"
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
    url: /ja/playground/
  - title: "SmartHome"
    url: /ja/playground/smarthome/
gallery_infra:
  - url: /assets/image/post/playground/smarthome/convenient-comfortable-smarthome-construct-plan/infra.png
    image_path: /assets/image/post/playground/smarthome/convenient-comfortable-smarthome-construct-plan/infra.png
---

# 概要

便利で快適なスマートホームインフラの構築計画をまとめます。

# はじめに

ある日偶然YouTubeでスマートホーム関連の動画を見かけました。その動画に出てくる家は照明やカーテン、様々な家具や家電をスマートフォンのアプリで操作したり、条件ベースの自動化環境が構築されていました。見た瞬間の感想は「すごい、これめちゃくちゃ楽しそう」でした。

会社の業務でスマートホーム機器を操作できるモバイルアプリベースのコントローラーパネルを実装していた時はあまり興味が湧かなかったのに、今回は見た瞬間にハマってしまいました。

# 事前準備

## 1. 構築の目的を考えよう

- IoT技術を活用してより便利で快適な生活を送るため。
- すべての電子製品や機器、家具などを一つの通信ネットワークに統合し、アプリケーションを通じてタッチや音声コマンド、自動化で家を制御するため。
- 正直なところ他の目的や理由よりも単純に楽しそうだから。

## 2. 情報を調べよう

### 2.1. スマートホーム関連YouTubeチャンネル

私はAppleのほぼすべてのデバイスを使用しているためHomeKitとApple公式認証製品でスマートホームを構築しようと考えていました。しかし少し調べてみると認証デバイスの種類が少ないだけでなく価格も非常に高いことがわかりました。
妥協可能な金額内でYouTube動画のようなスマートホームを構築するにはどうすればいいか、しばらくの間関連するYouTubeチャンネルを探し回りました。

- [Onaldoのスマートホーム構築](https://www.youtube.com/c/Onaldo7)
- [賢い家庭生活](https://www.youtube.com/c/HomeIoT)
- [クルガイのスマートホーム構築](https://www.youtube.com/channel/UCm0uQ1mIl_QW1XOFVCmK4dA)
- [Ray's スマートホーム with HA](https://www.youtube.com/c/HAsmarthome)

### 2.2. スマートホーム関連コミュニティ

YouTubeよりも詳しい情報を探すためにウェブサーフィンをしていたところ、SmartThingsを中心にスマートホームを運用している方々が集まるNaverカフェ（韓国のオンラインコミュニティ）を発見しました。

- [Smartthings & IoT home Community](https://cafe.naver.com/stsmarthome)

スマートホームという険しい道を先に歩んだ先輩たちが共有した情報と奮闘記を見てから決断しようと思い、入門者向けガイドや様々な投稿を見てみました。なんと、上記のYouTubeチャンネルの方々が全員このコミュニティにいらっしゃいました。

### 2.3. メイン通信プロトコルの選択

YouTubeチャンネルの動画やコミュニティの投稿を見た結果、まずHomeKitを除外してメインで使用するスマートホームプラットフォームと通信プロトコルを決めることが最優先だと感じました。
通信プロトコルを先に決めることにしましたが、調べてみると`Wi-Fi`、`Bluetooth`、`ZigBee`、`Z-Wave`など様々な通信規格を採用したスマートホーム機器やプラットフォームが存在していました。

スマートホームエコシステムで主に使用される低消費電力通信プロトコルは`ZigBee`と`Z-Wave`のようですが、`Z-Wave`は国ごとに周波数帯域が異なるためパスすることにしました。
最終的に`ZigBee`をメイン通信プロトコルとして選択しました。他の通信プロトコルを採用した機器はクラウドやブリッジを通じてプラットフォームに統合することもできそうだったのであまり悩みませんでした。

### 2.4. ZigBeeハブの選択

`ZigBee`を採用した機器と連動可能なハブの種類はかなりありました。その中でSmartThingsハブを選んだ理由は以下の通りです。

- Samsung Electronicsはスマートホームハードウェア分野から手を引こうとしていますが、わずかながらもSamsungのブランド力が残っているためアフターサポートはそれなりに期待できると思います。
- コントローラークライアントや自動化のためのWebCoREなどのソフトウェアの開発と改善は依然としてSamsungが担当しています。
- ミニアプリ形式のプラグイン（SmartApp）やデバイスドライバー（DTH）の開発を通じて、ハブに直接接続できない機器のクラウド連携や他のプラットフォーム間の統合をサポートしています。
- 開発者ドキュメントと開発者コミュニティが充実しています。

## 3. スマートホームインフラ構築計画図

これまで調べて決定した内容をもとにスマートホームインフラの構築計画をざっくりと描いてみました。
まだ初期バージョンであり、誤った情報をもとに描いている可能性もあるため参考程度にご覧ください。
実際に一つずつ構築しながら描き直していきます。

{% include gallery id="gallery_infra" %}

スマートホームは2月に引っ越す新居に構築する予定です。家族と一緒に住む家なので自分の部屋から始めて徐々にエリアを広げていくつもりです。
重要なのはスマートホームは快適で心地よい環境のためのものであり、あれこれ機能を実装した上で不便な部分は少し我慢しようという状態になってはいけないということです。家族の中で一人でもスマートホームに不便さや不満を感じた場合、該当機器は即座に修理または撤去するようにします。
