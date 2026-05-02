---
title: "[Docker] Docker Compose GHCRの認証とMilvusボリューム初期化"
ref: docker-compose-ghcr-auth-milvus-volume
excerpt: "Docker ComposeでMilvusスタックを実行する際に発生したGHCRプライベートイメージの認証エラーとRocksDB WALボリューム競合の解決方法をまとめる。"
date: 2026-02-21T16:00+09:00
last_modified_at: 2026-02-21T16:00+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/docker-compose-ghcr-auth-milvus-volume.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/docker-compose-ghcr-auth-milvus-volume.png"
categories:
  - Development
  - Server
  - Docker
tags:
  - Docker
  - Docker Compose
  - GHCR
  - Milvus
  - GitHub Container Registry
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Server"
    url: /ja/development/server/
  - title: "Docker"
    url: /ja/development/server/docker/
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

Docker ComposeでMilvusスタックを実行する際に発生したGHCRプライベートイメージの認証エラーとRocksDB WALボリューム競合の解決方法をまとめる。

# 手順

## 1. GHCRプライベートイメージの認証

`docker-compose.yml`でGitHub Container Registry（GHCR）のプライベートイメージを使用する場合、認証なしでpullしようとすると以下のエラーが発生する。

```
Error response from daemon: unknown: failed to resolve reference
"ghcr.io/wookbros/milvus/milvus-ko:v2.5.27-r1-arm64":
unexpected status from HEAD request to
https://ghcr.io/v2/wookbros/milvus/milvus-ko/manifests/v2.5.27-r1-arm64:
403 Forbidden
```

GHCRのプライベートイメージをpullするには、GitHub Personal Access Token（PAT）で認証する必要がある。以下のコマンドでログインする。

```bash
echo YOUR_PAT_TOKEN | docker login ghcr.io -u GITHUB_USERNAME --password-stdin
```

PATを作成する際、`read:packages`権限を必ず含める必要がある。GitHubのSettings > Developer settings > Personal access tokensから作成できる。

ログインに成功すると`Login Succeeded`が表示され、以降は`docker-compose up -d`コマンドで正常にイメージをpullできる。

## 2. Milvusボリュームの初期化

GHCR認証問題を解決した後、`docker-compose up -d`を実行するとmilvus-standaloneコンテナがクラッシュする場合がある。ログを確認すると以下のエラーが表示される。

```
FATAL: fail to init rocksmq
error="Corruption: While creating a new Db,
wal_dir contains existing log file: 000011.log"
```

以前使用していたボリュームデータに残っているRocksDB WALファイルが新しいMilvusインスタンスと競合して発生する問題である。ボリュームを削除してコンテナを再起動すれば解決する。

```bash
docker-compose down
rm -rf ./volumes/milvus
docker-compose up -d
```

ボリュームを削除すると既存データがすべて失われるため、開発環境でのみこの方法を使用するべきである。本番環境ではデータをバックアップしてから進める必要がある。

# 参考

- <https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry>
- <https://milvus.io/docs>
