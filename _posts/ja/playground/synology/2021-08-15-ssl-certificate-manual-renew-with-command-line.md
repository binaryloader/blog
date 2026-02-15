---
date: 2021-08-15T00:00+09:00
title: "[Synology] コマンドラインでSSL証明書を手動更新する方法"
ref: ssl-certificate-manual-renew-with-command-line
lang: ja
excerpt: "Synology NASでSSL証明書を手動で更新する方法をまとめます。"
last_modified_at: 2021-08-15T14:50+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/ssl-certificate-manual-renew-with-command-line.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ssl-certificate-manual-renew-with-command-line.png"
categories:
  - Playground
  - Synology
tags:
  - Playground
  - Synology
  - SSL
  - Certificate
  - NAS
  - Let's Encrypt
  - SSH
depth:
  - title: "Playground"
    url: /ja/playground/
  - title: "Synology"
    url: /ja/playground/synology/
---

# 概要

Synology NASでSSL証明書を手動で更新する方法をまとめます。

# はじめに

リバースプロキシを使用している場合や特定の環境ではLet's Encrypt SSL証明書の自動更新が失敗することがあります。
このような場合DSMのコントロールパネルを通じて手動で更新を行いますが、証明書の更新に失敗しても失敗した理由を詳しく教えてくれません。

このような時はSSHでSynologyに接続して証明書を手動で更新すれば解決できます。コマンドラインで証明書の更新作業を行う場合、`-v`や`-vv`などのデバッグオプションを使用でき、証明書の更新がなぜ失敗したのかを確認できます。2つのオプションの違いは`-v`よりも`-vv`の方がより詳細なログを出力するという点です。

# 解決してみよう

## 1. 更新

```bash
/usr/syno/sbin/syno-letsencrypt renew-all -vv
```
