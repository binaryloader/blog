---
title: "[Synology] L2TP/IPSec VPNサーバーの構築方法"
ref: synology-vpn-server-setup
lang: ja
permalink: /ja/:categories/:title/
excerpt: "Synology NASにL2TP/IPSec VPNサーバーを構築し、外部から接続する方法をまとめる。"
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
    url: /ja/playground/
  - title: "Synology"
    url: /ja/playground/synology/
---

{% assign img_path = "/assets/image/post/playground/synology/synology-vpn-server-setup" %}

# 概要

Synology NASにL2TP/IPSec VPNサーバーを構築し、外部から接続する方法をまとめる。

# 手順

## 1. Synology VPNサーバーの設定

DSMパッケージセンターから**VPN Server**パッケージをインストールした後、VPN Serverを開き左メニューから**L2TP/IPSec**を選択する。

![Synology VPN Server L2TP/IPSec設定画面]({{ img_path }}/vpn-server-l2tp-settings.png)

各設定項目は以下の通りだ。

| 項目 | 説明 |
|---|---|
| **L2TP/IPSec VPNサーバーを有効にする** | L2TP/IPSec VPNサービスを有効にするチェックボックスだ。 |
| **動的IPアドレス** | VPNクライアントに割り当てる仮想IPの範囲を設定する。例えば`192.168.1.0`に設定すると接続したクライアントは`192.168.1.x`帯域のIPが割り当てられる。内部ネットワークと競合しない帯域を使用する必要がある。 |
| **最大接続数** | VPNに同時に接続できる最大クライアント数だ。 |
| **アカウント最大接続数** | 1つのアカウントで同時に接続できる最大数だ。 |
| **認証** | クライアント認証方式を選択する。**MS-CHAP v2**は暗号化された認証を提供するため推奨される。 |
| **MTU** | Maximum Transmission Unitの略で、1回の送信で転送できる最大パケットサイズだ。デフォルト値の`1400`を使用すればよい。 |
| **手動DNS** | VPN接続時に使用するDNSサーバーを手動で指定できる。チェックしなければSynologyのDNS設定に従う。 |
| **カーネルモードで実行** | VPNをカーネルレベルで処理しパフォーマンスを向上させる。有効化を推奨する。 |
| **事前共有キー** | IPSec暗号化に使用される共有キーだ。クライアントからVPN接続時にこのキーを入力する必要がある。十分に複雑な値を設定すること。 |
| **SHA2-256互換モード有効化(96ビット)** | 一部の古いクライアントとの互換性のためのオプションだ。通常は無効のままにしておく。 |

設定完了後**適用**ボタンをクリックする。

## 2. Synologyファイアウォールの設定

**DSMコントロールパネル > セキュリティ > ファイアウォール**でファイアウォールルールを編集する。内蔵アプリケーション選択画面でVPN Server関連ポートを許可する必要がある。

![Synologyファイアウォール内蔵アプリケーション選択画面]({{ img_path }}/firewall-builtin-app-selection.png)

L2TP/IPSec VPNに必要な項目は以下の2つだ。

| 項目 | ポート | 説明 |
|---|---|---|
| **VPN Server (L2TP/IPSec)** | 1701 | L2TPトンネリングポートだ。 |
| **VPN Server (L2TP/IPSec)** | 500, 4500 | IPSecで使用されるIKE(500)とNAT Traversal(4500)ポートだ。 |

この2つの項目にチェックを入れて**確認**をクリックしファイアウォールルールに追加する。

## 3. ルーターのポートフォワーディング

外部からVPNサーバーにアクセスするにはルーターで関連ポートをNASの内部IPにフォワーディングする必要がある。

![ルーターポートフォワーディング設定画面]({{ img_path }}/router-port-forwarding.png)

| 項目 | 値 |
|---|---|
| **サービス名** | L2TP / IPSec VPN Server（識別用の名前） |
| **外部ポート** | 500, 1701, 4500 |
| **内部ポート** | （外部ポートと同じ） |
| **内部IPアドレス** | Synology NASの内部IPアドレス（例：`192.168.x.x`） |
| **プロトコル** | UDP |

L2TP/IPSecはUDPプロトコルを使用するため必ず**UDP**に設定すること。

## 4. ドメイン連携

毎回変わる可能性があるグローバルIPの代わりにドメインを使用すると便利だ。DNS管理画面でVPN接続用のレコードを追加する。

![DNSレコード設定画面]({{ img_path }}/domain-dns-records.png)

| Type | Host | Value | 説明 |
|---|---|---|---|
| **A Record** | vpn | グローバルIPアドレス（例：`210.x.x.x`） | `vpn.yourdomain.com`でVPNサーバーに接続できるようになる。 |

A RecordのHostに`vpn`を入力すると`vpn.yourdomain.com`の形式でアクセスできる。ValueにはルーターのグローバルIPアドレスを入力する。

グローバルIPが動的IPの場合はSynologyのDDNS機能や別途のDDNSサービスを利用してIP変更時に自動更新されるよう設定することを推奨する。

## 5. iPhoneの設定

iPhoneで**設定 > 一般 > VPNとデバイス管理 > VPN > VPN構成を追加**に移動する。

![iPhone L2TP VPN設定画面]({{ img_path }}/iphone-vpn-settings.png){: .align-center style="max-width: min(400px, 100%);"}

タイプを**L2TP**に選択し各項目を入力する。

| 項目 | 説明 |
|---|---|
| **タイプ** | **L2TP**を選択する。 |
| **説明** | VPN接続の名前だ。識別しやすい名前を自由に入力する。（例：Home） |
| **サーバー** | VPNサーバーのアドレスを入力する。ドメインを設定した場合は`vpn.yourdomain.com`を入力する。 |
| **アカウント** | Synology DSMのユーザーアカウント名を入力する。 |
| **RSA SecurID** | 使用しないため無効のままにしておく。 |
| **パスワード** | DSMユーザーアカウントのパスワードを入力する。 |
| **シークレット** | VPNサーバーで設定した**事前共有キー**を入力する。 |
| **すべてのトラフィックを送信** | 有効にするとVPN接続時にすべてのインターネットトラフィックがVPNを経由して送信される。セキュリティのため有効化を推奨する。 |

設定完了後右上のチェックボタンをタップして保存すればVPNに接続できる。
