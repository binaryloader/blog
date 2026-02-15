---
date: 2021-10-17T00:00+09:00
title: "[Router] ASUSルーター設定ページのHTTPSを有効化する方法"
ref: setting-asus-router-enable-https
lang: ja
excerpt: "ASUSルーター設定ページのHTTPSを有効化する方法をまとめます。"
last_modified_at: 2021-10-17T08:15+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/setting-asus-router-enable-https.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/setting-asus-router-enable-https.png"
categories:
  - Playground
  - Router
tags:
  - Playground
  - Router
  - ASUS
  - RT-AX3000
  - HTTPS
  - Certificate
  - Network
  - Security
depth:
  - title: "Playground"
    url: /ja/playground/
  - title: "Router"
    url: /ja/playground/router/
gallery_local_access_settings:
  - url: /assets/image/post/playground/router/asus-router-settings-page-enable-https/local-access-settings.png
    image_path: /assets/image/post/playground/router/asus-router-settings-page-enable-https/local-access-settings.png
gallery_trust_certificate:
  - url: /assets/image/post/playground/router/asus-router-settings-page-enable-https/trust-certificate.png
    image_path: /assets/image/post/playground/router/asus-router-settings-page-enable-https/trust-certificate.png
---

# 概要

ASUSルーター設定ページのHTTPSを有効化する方法をまとめます。

# 手順

## 1. ASUS設定ページにアクセス

- http://192.168.50.1
- http://router.asus.com

## 2. 詳細設定 - 管理 - システム

### 2.1. ローカルアクセス設定を以下のように構成

{% include gallery id="gallery_local_access_settings" %}

- 認証方式：BOTH または HTTPS
- HTTPS LANポート：8443
- Download Certificateのエクスポートボタンをクリックして`*.crt`ファイルをダウンロードします。
- ダウンロードしたファイルをダブルクリックしてキーチェーンのログイン項目に登録します。

## 3. 証明書のキーチェーン登録と信頼設定

{% include gallery id="gallery_trust_certificate" %}

- キーチェーンの項目から`router.asus.com`という名前の証明書を右クリックし「情報を見る」をクリックします。
- 上の画像のようにSSL（Secure Sockets Layer）の項目を「常に信頼」に変更します。

## 4. HTTPSアクセスの確認

- ブラウザに https://router.asus.com:8443 を入力して接続を確認します。

# 参考

- <https://www.asus.com/kr/support/FAQ/1034294/>
