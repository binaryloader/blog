---
title: "[macOS] QuickTime Playerでマイクとシステムオーディオを同時に録音する方法"
ref: macos-quicktime-blackhole-audio-recording
lang: ja
permalink: /ja/:categories/:title/
excerpt: "BlackHoleを使ってQuickTime Playerでマイク入力とシステムオーディオを同時に録音する方法をまとめる。"
date: 2026-02-17T17:00+09:00
last_modified_at: 2026-02-17T17:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/macos-quicktime-blackhole-audio-recording.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/macos-quicktime-blackhole-audio-recording.png"
categories:
  - Development
  - Apple
  - macOS
tags:
  - Development
  - Apple
  - macOS
  - QuickTime Player
  - BlackHole
  - Audio MIDI Setup
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Apple"
    url: /ja/development/apple/
  - title: "macOS"
    url: /ja/development/apple/macos/
---

{% assign img_path = "/assets/image/post/development/apple/macos/macos-quicktime-blackhole-audio-recording" %}

# 概要

BlackHoleを使ってQuickTime Playerでマイク入力とシステムオーディオを同時に録音する方法をまとめる。

# 手順

macOSのQuickTime Playerは画面収録時にマイク入力しか録音できずシステムで再生される音（スピーカー出力）はキャプチャできない。マイクとシステムオーディオを一緒に録音するには仮想オーディオドライバーのBlackHoleを使ってシステムオーディオをループバックしマイク入力と組み合わせて一つの入力デバイスにする必要がある。

## 1. BlackHoleのインストール

[BlackHole](https://existential.audio/blackhole/)はmacOS用のオープンソース仮想オーディオドライバーでアプリケーション間のオーディオルーティングを可能にする。公式サイトからインストーラーをダウンロードして実行すればよい。

インストールが完了するとAudio MIDI設定のデバイスリストにBlackHole 16chが表示される。

## 2. 複数出力装置の作成

システムオーディオをスピーカー（またはイヤホン）で聞きながら同時にBlackHoleにも送るには複数出力装置が必要だ。

Audio MIDI設定を開き左下の`+`ボタンをクリックして`複数出力装置を作成`を選択する。

![Audio MIDI設定]({{ img_path }}/audio-midi-setup.png){: .align-center}
*Audio MIDI設定 — 下部の`+`ボタンでデバイスを作成する*
{: .text-center}

右パネルで実際に音を聞く出力デバイス（AirPods、スピーカーなど）とBlackHole 16chの両方にチェックを入れる。BlackHoleのドリフト補正もチェックする。

![複数出力装置]({{ img_path }}/multi-output-device.png){: .align-center}
*複数出力装置 — スピーカーとBlackHoleを同時に選択する*
{: .text-center}

これでシステムオーディオがスピーカーとBlackHoleの両方に同時出力される。

## 3. 機器セットの作成

マイク入力とBlackHole入力を一つのデバイスにまとめるには機器セットが必要だ。

再度`+`ボタンをクリックして`機器セットを作成`を選択する。右パネルでマイク（AirPods Proなど）とBlackHole 16chの両方にチェックを入れる。BlackHoleのドリフト補正をチェックする。

![機器セット]({{ img_path }}/aggregate-device.png){: .align-center}
*機器セット — マイクとBlackHoleを一つの入力デバイスにまとめる*
{: .text-center}

機器セットはマイクの物理入力チャンネルとBlackHoleの仮想入力チャンネルを一つにまとめてQuickTime Playerが両方のソースを同時にキャプチャできるようにする。

## 4. システム出力デバイスの変更

メニューバーのサウンドアイコンをクリックするかシステム設定→サウンドで出力デバイスを先ほど作成した`複数出力装置`に変更する。

![サウンド出力設定]({{ img_path }}/sound-output.png){: .align-center style="max-width: min(400px, 100%);"}
*サウンド出力を複数出力装置に変更する*
{: .text-center}

この状態ではシステムオーディオがスピーカーとBlackHoleに同時に出力される。スピーカーで正常に音を聞きながらBlackHole経由で録音も可能になる。

## 5. QuickTime Playerで録音

QuickTime Playerを開き`⌘⇧5`またはメニューから`ファイル → 新規画面収録`を選択する。下部ツールバーの`オプション`をクリックするとマイク項目が表示される。ここで`機器セット`を選択する。

![QuickTime録音設定]({{ img_path }}/quicktime-recording.png){: .align-center style="max-width: min(400px, 100%);"}
*QuickTime画面収録 — マイクを機器セットに選択する*
{: .text-center}

録画を開始するとマイク入力とシステムオーディオが一緒に録音される。

## 6. 録音後の設定復元

録音が終わったらサウンド出力を元のデバイス（スピーカー、AirPodsなど）に戻す。複数出力装置の状態ではシステム音量の調整ができない場合がある。

## 7. BlackHoleの削除

BlackHoleが不要になった場合は`/Library/Audio/Plug-Ins/HAL/`パスから`BlackHole16ch.driver`を削除すればよい。

![HALパス]({{ img_path }}/hal-path.png){: .align-center style="max-width: min(600px, 100%);"}
*Finderで`/Library/Audio/Plug-Ins/HAL/`に移動*
{: .text-center}

![HALディレクトリ]({{ img_path }}/hal-directory.png){: .align-center}
*BlackHole16ch.driverを削除すればよい*
{: .text-center}

# 参考

- <https://existential.audio/blackhole/>
- <https://support.apple.com/ja-jp/guide/audio-midi-setup/ams11031/mac>
