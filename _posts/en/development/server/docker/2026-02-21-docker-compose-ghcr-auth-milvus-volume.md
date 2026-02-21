---
title: "[Docker] Docker Compose GHCR Auth and Milvus Volume Initialization"
ref: docker-compose-ghcr-auth-milvus-volume
excerpt: "Resolving GHCR private image authentication errors and RocksDB WAL volume conflicts when running a Milvus stack with Docker Compose."
date: 2026-02-21T16:00+09:00
last_modified_at: 2026-02-21T16:00+09:00
published: true
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/docker-compose-ghcr-auth-milvus-volume.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/docker-compose-ghcr-auth-milvus-volume.png"
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
    url: /en/development/
  - title: "Server"
    url: /en/development/server/
  - title: "Docker"
    url: /en/development/server/docker/
---

# Overview

This post covers resolving two issues encountered when running a Milvus stack with Docker Compose: GHCR private image authentication errors and RocksDB WAL volume conflicts.

# Notes

## 1. GHCR Private Image Authentication

When using a private image from GitHub Container Registry (GHCR) in `docker-compose.yml`, attempting to pull without authentication results in the following error.

```
Error response from daemon: unknown: failed to resolve reference
"ghcr.io/wookbros/milvus/milvus-ko:v2.5.27-r1-arm64":
unexpected status from HEAD request to
https://ghcr.io/v2/wookbros/milvus/milvus-ko/manifests/v2.5.27-r1-arm64:
403 Forbidden
```

To pull private images from GHCR, you need to authenticate with a GitHub Personal Access Token (PAT). Log in with the following command.

```bash
echo YOUR_PAT_TOKEN | docker login ghcr.io -u GITHUB_USERNAME --password-stdin
```

The PAT must include the `read:packages` scope. You can create one from GitHub under Settings > Developer settings > Personal access tokens.

Once login succeeds with `Login Succeeded`, you can pull images normally with `docker-compose up -d`.

## 2. Milvus Volume Initialization

After resolving the GHCR authentication issue, running `docker-compose up -d` may cause the milvus-standalone container to crash. Checking the logs reveals the following error.

```
FATAL: fail to init rocksmq
error="Corruption: While creating a new Db,
wal_dir contains existing log file: 000011.log"
```

This occurs when leftover RocksDB WAL files in the existing volume conflict with a new Milvus instance. Removing the volume and restarting the containers resolves the issue.

```bash
docker-compose down
rm -rf ./volumes/milvus
docker-compose up -d
```

Removing the volume deletes all existing data, so this approach should only be used in development environments. In production, back up your data before proceeding.

# References

- <https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry>
- <https://milvus.io/docs>
