---
title: "[Docker] Docker Compose GHCR 인증 및 Milvus 볼륨 초기화"
ref: docker-compose-ghcr-auth-milvus-volume
excerpt: "Docker Compose로 Milvus 스택을 실행할 때 발생한 GHCR private 이미지 인증 오류와 RocksDB WAL 볼륨 충돌 문제를 해결한 과정을 정리한다."
date: 2026-02-21T16:00+09:00
last_modified_at: 2026-02-21T16:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/docker-compose-ghcr-auth-milvus-volume.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/docker-compose-ghcr-auth-milvus-volume.png"
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
    url: /ko/development/
  - title: "Server"
    url: /ko/development/server/
  - title: "Docker"
    url: /ko/development/server/docker/
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

# 개요

Docker Compose로 Milvus 스택을 실행할 때 발생한 GHCR private 이미지 인증 오류와 RocksDB WAL 볼륨 충돌 문제를 해결한 과정을 정리한다.

# 정리

## 1. GHCR Private 이미지 인증

`docker-compose.yml`에서 GitHub Container Registry(GHCR)의 private 이미지를 사용하는 경우 인증 없이 pull을 시도하면 아래와 같은 에러가 발생한다.

```
Error response from daemon: unknown: failed to resolve reference
"ghcr.io/wookbros/milvus/milvus-ko:v2.5.27-r1-arm64":
unexpected status from HEAD request to
https://ghcr.io/v2/wookbros/milvus/milvus-ko/manifests/v2.5.27-r1-arm64:
403 Forbidden
```

GHCR private 이미지를 pull하려면 GitHub Personal Access Token(PAT)으로 인증해야 한다. 아래 명령어로 로그인한다.

```bash
echo YOUR_PAT_TOKEN | docker login ghcr.io -u GITHUB_USERNAME --password-stdin
```

PAT를 생성할 때 `read:packages` 권한이 반드시 포함되어야 한다. GitHub에서 Settings > Developer settings > Personal access tokens에서 생성할 수 있다.

로그인에 성공하면 `Login Succeeded`가 출력되고 이후부터는 `docker-compose up -d` 명령어로 정상적으로 이미지를 pull할 수 있다.

## 2. Milvus 볼륨 초기화

GHCR 인증 문제를 해결한 후 `docker-compose up -d`를 실행하면 milvus-standalone 컨테이너가 크래시하는 경우가 있다. 로그를 확인하면 아래와 같은 에러가 나타난다.

```
FATAL: fail to init rocksmq
error="Corruption: While creating a new Db,
wal_dir contains existing log file: 000011.log"
```

이전에 사용하던 볼륨 데이터에 남아있는 RocksDB WAL 파일이 새로운 Milvus 인스턴스와 충돌하여 발생하는 문제다. 볼륨을 삭제하고 컨테이너를 재시작하면 해결된다.

```bash
docker-compose down
rm -rf ./volumes/milvus
docker-compose up -d
```

볼륨을 삭제하면 기존 데이터가 모두 사라지므로 개발 환경에서만 이 방법을 사용해야 한다. 운영 환경에서는 데이터 백업 후 진행해야 한다.

# 참고

- <https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry>
- <https://milvus.io/docs>
