---
title: "[Infra] MongoDB Atlas vs DocumentDB 비교와 EKS 연동"
ref: mongodb-atlas-vs-documentdb
excerpt: "DocumentDB의 호환성 한계를 분석하고 MongoDB Atlas를 선택한 이유, Atlas Search 한국어 검색, VPC Peering/PrivateLink를 통한 EKS 연동 방법을 정리한다."
date: 2026-03-02T12:40+09:00
last_modified_at: 2026-03-02T12:40+09:00
published: false
header:
  overlay_image: "/assets/image/thumbnail/header/mongodb-atlas-vs-documentdb.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/mongodb-atlas-vs-documentdb.png"
categories:
  - Development
  - Server
  - Infra
tags:
  - AWS
  - MongoDB Atlas
  - DocumentDB
  - Atlas Search
  - VPC Peering
  - Terraform
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Server"
    url: /ko/development/server/
  - title: "Infra"
    url: /ko/development/server/infra/
---

# 개요

DocumentDB의 호환성 한계를 분석하고 MongoDB Atlas를 선택한 이유, Atlas Search 한국어 검색, VPC Peering/PrivateLink를 통한 EKS 연동 방법을 정리한다.

# 정리

## 1. DocumentDB의 호환성 문제

Amazon DocumentDB는 MongoDB 와이어 프로토콜을 에뮬레이션하는 별도 엔진이다. MongoDB와 100% 호환되지 않으며 실제 호환성은 약 34% 수준이다.

| 항목 | DocumentDB | MongoDB Atlas |
|---|---|---|
| MongoDB 호환성 | ~34% (에뮬레이션) | 100% |
| retryWrites | 미지원 (`retryWrites=false` 강제) | 지원 |
| 트랜잭션 | 부분 지원 | 완전 지원 |
| 샤딩 | 미지원 | 지원 |
| Change Streams | 부분 지원 | 완전 지원 |
| Atlas Search | 미지원 | 지원 |
| 한국어 전문 검색 | 미지원 | `lucene.korean` 지원 |
| Atlas Vector Search | 미지원 | 지원 |
| Auto-Scaling | 수동 | 자동 (컴퓨트 + 스토리지) |
| 멀티 클라우드 | AWS만 | AWS, GCP, Azure |

DocumentDB를 사용하면 연결 문자열에 `retryWrites=false`를 강제해야 하고 Spring Data MongoDB의 `ReactiveMongoRepository` 등에서 예상치 못한 동작이 발생할 수 있다. MongoDB Atlas는 이런 제한이 없다.

## 2. Atlas Search — 한국어 전문 검색

Atlas Search는 Apache Lucene의 Nori 형태소 분석기를 `lucene.korean`으로 공식 지원한다. 별도 검색 엔진(Elasticsearch 등) 없이 MongoDB 내부에서 한국어 전문 검색이 가능하다.

```json
{
  "mappings": {
    "fields": {
      "title": { "type": "string", "analyzer": "lucene.korean" },
      "content": { "type": "string", "analyzer": "lucene.korean" }
    }
  }
}
```

검색 쿼리는 `$search` aggregation stage를 사용한다.

```kotlin
val pipeline = listOf(
    Document("\$search", Document("index", "default")
        .append("text", Document("query", searchTerm)
            .append("path", listOf("title", "content")))),
    Document("\$limit", 20),
    Document("\$project", Document("title", 1)
        .append("content", 1)
        .append("score", Document("\$meta", "searchScore")))
)

collection.aggregate(pipeline)
```

## 3. Atlas Vector Search

Atlas Vector Search를 사용하면 동일 컬렉션에서 전문 검색과 벡터 검색을 함께 수행할 수 있다. 대규모 벡터 워크로드는 Milvus에서 처리하고 메타데이터 수준의 벡터 검색은 Atlas에서 처리하는 역할 분담이 가능하다.

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "category"
    }
  ]
}
```

## 4. EKS 네트워크 연동

### 4.1. VPC Peering (개발/스테이징 추천)

VPC Peering은 무료이며 프라이빗 네트워크를 통해 Atlas에 접근한다. M10 이상 티어에서 지원된다.

설정 절차는 아래와 같다.

1. Atlas에서 VPC Peering 요청 생성
2. AWS에서 Peering 요청 수락
3. 라우트 테이블에 Atlas VPC CIDR 추가
4. Atlas IP Access List에 EKS VPC CIDR 추가

### 4.2. AWS PrivateLink (프로덕션 추천)

PrivateLink는 단방향 연결로 최고 수준의 보안을 제공한다. Atlas에서 생성한 Private Endpoint를 AWS VPC에 연결하는 방식이다.

VPC Peering과 달리 CIDR 충돌 문제가 없고 트래픽이 AWS 네트워크 내에서만 이동한다.

### 4.3. IP Access List

M10 미만 티어(M0/M2/M5)는 VPC Peering과 PrivateLink를 지원하지 않는다. NAT Gateway의 고정 IP를 Atlas IP Access List에 등록하는 방식으로 연결하지만 보안이 약하므로 개발 용도로만 사용한다.

## 5. 환경별 구성

| 환경 | 티어 | 백업 | Auto-Scaling | 예상 비용 |
|---|---|---|---|---|
| dev | M10 | 비활성화 | 미적용 | ~$57/월 |
| staging | M20 | Cloud Backup (일일) | 미적용 | ~$144/월 |
| prod | M30 | PITR + 스냅샷 | M30 → M40 | ~$389+/월 |

리전은 모든 환경에서 서울(`AP_NORTHEAST_2`)을 사용한다. 개발 환경은 Atlas의 Pause 기능으로 비사용 시 비용을 절감할 수 있다.

## 6. 백업과 복구

### 6.1. Cloud Backup

시간별, 일별, 주별, 월별 스냅샷 정책을 설정할 수 있다.

### 6.2. PITR (Point-in-Time Recovery)

연속적인 oplog 백업으로 특정 시점 복원이 가능하다. 프로덕션에서는 1분 단위 복원 정밀도를 제공하는 PITR을 권장한다.

## 7. 모니터링

Atlas는 내장 모니터링 도구를 제공한다.

- **Metrics**: Operations/s, Connections, Query Targeting 비율
- **Performance Advisor**: 느린 쿼리를 분석하고 인덱스를 자동 추천
- **Real-Time Performance Panel**: 실시간 쿼리 성능 모니터링
- **Alert Integration**: Slack, PagerDuty와 연동

## 8. 보안

- TLS 1.2/1.3이 기본 적용된다
- Encryption at Rest를 AWS KMS CMK로 활성화할 수 있다
- 데이터베이스 사용자별 역할을 분리한다 (서비스별 별도 사용자)
- IP Access List로 접근을 제한한다

## 9. Terraform 구성

`mongodbatlas` 프로바이더로 Atlas 리소스를 관리한다.

```hcl
resource "mongodbatlas_cluster" "main" {
  project_id = var.atlas_project_id
  name       = "my-project-${var.environment}"

  provider_name               = "AWS"
  provider_region_name        = "AP_NORTHEAST_2"
  provider_instance_size_name = var.cluster_tier

  auto_scaling_compute_enabled                    = var.environment == "prod"
  auto_scaling_compute_scale_down_enabled         = var.environment == "prod"
  provider_auto_scaling_compute_max_instance_size = var.environment == "prod" ? "M40" : null

  cloud_backup = var.environment != "dev"
}

resource "mongodbatlas_network_peering" "eks" {
  project_id             = var.atlas_project_id
  container_id           = mongodbatlas_cluster.main.container_id
  provider_name          = "AWS"
  accepter_region_name   = "ap-northeast-2"
  aws_account_id         = var.aws_account_id
  route_table_cidr_block = var.vpc_cidr
  vpc_id                 = var.vpc_id
}
```

# 참고

- <https://www.mongodb.com/docs/atlas/>
- <https://www.mongodb.com/docs/atlas/atlas-search/analyzers/>
- <https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/>
- <https://www.mongodb.com/docs/atlas/security-vpc-peering/>
- <https://www.mongodb.com/docs/atlas/security-private-endpoint/>
