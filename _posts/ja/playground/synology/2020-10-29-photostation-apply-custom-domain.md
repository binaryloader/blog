---
date: 2020-10-29T00:00+09:00
title: "[Synology] Photo Stationにカスタムドメインを接続する方法"
ref: photostation-apply-custom-domain
lang: ja
excerpt: "Synology Photo Stationにカスタムドメインを接続する方法をまとめます。"
last_modified_at: 2020-11-05T21:30+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/photostation-apply-custom-domain.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/photostation-apply-custom-domain.png"
categories:
  - Playground
  - Synology
tags:
  - Playground
  - Synology
  - PhotoStation
  - NAS
  - Nginx
  - Domain
depth:
  - title: "Playground"
    url: /ja/playground/
  - title: "Synology"
    url: /ja/playground/synology/
---

# 概要

Synology Photo Stationにカスタムドメインを接続する方法をまとめます。

# はじめに

個人ドメインを購入してリバースプロキシを通じて各アプリケーションにサブドメインを以下のように問題なく接続しました。

- blog.mydomain.com
- dsm.mydomain.com
- drive.mydomain.com

しかしPhoto Stationへのサブドメイン接続は少し厄介でした。
以前共有されていた方法もDSMのバージョンが上がったためか、あるいは私が正しく適用できていなかったためか動作しませんでした。
何か方法はないかと探していたところ関連するGistを発見し、無事に適用できました。

同じように困っている方がいるかもしれないので共有します。

**注意:** この作業の前提条件として、CNAMEレコードの登録を通じてphoto.mydomain.comというサブドメインが事前にSynologyに接続されている状態であることが必要です。
{: .notice--warning}

# 解決してみよう

## 1. Photo.mustacheの作成

`/usr/syno/share/nginx`パスに`Photo.mustache`というファイルを作成し、以下のように記述します。
`server_name`は接続したいサブドメインに設定します。

```
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name photo.mydomain.com;

    location = / {
        {% raw %}{{#DSM.ssl}}{% endraw %}
        if ($scheme = https) {
            rewrite / https://$host/photo/ redirect;
        }
        {% raw %}{{/DSM.ssl}}{% endraw %}
        rewrite / http://$host/photo/ redirect;
    }

    include /usr/local/etc/nginx/conf.d/www.PhotoStation.conf;
}
```

## 2. nginx.mustacheの修正

`/usr/syno/share/nginx`パスにある`nginx.mustache`ファイルを開いて以下の行を追加します。

```
{% raw %}{{> /usr/syno/share/nginx/Photo}}{% endraw %}
```

上記の手順がすべて完了したらSynologyを再起動して該当のサブドメインにアクセスしてみてください。
Photo Stationにリダイレクトされることを確認できるはずです。

# 参考

- <https://gist.github.com/kalbasit/9cf9b23f2e0f70c285d0>
