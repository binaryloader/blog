---
title: "[Infra] MongoDB Atlas vs DocumentDB Comparison and EKS Integration"
ref: mongodb-atlas-vs-documentdb
lang: en
permalink: /en/:categories/:title/
excerpt: "Analyze the compatibility limitations of DocumentDB, explain why MongoDB Atlas was chosen, cover Atlas Search Korean full-text search, and outline EKS integration via VPC Peering/PrivateLink."
date: 2026-03-02T12:40+09:00
last_modified_at: 2026-03-02T12:40+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/mongodb-atlas-vs-documentdb.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/mongodb-atlas-vs-documentdb.png"
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
    url: /en/development/
  - title: "Server"
    url: /en/development/server/
  - title: "Infra"
    url: /en/development/server/infra/
---

# Overview

Analyze the compatibility limitations of DocumentDB, explain why MongoDB Atlas was chosen, cover Atlas Search Korean full-text search, and outline EKS integration via VPC Peering/PrivateLink.

# Summary

## 1. DocumentDB Compatibility Issues

Amazon DocumentDB is a separate engine that emulates the MongoDB wire protocol. It is not 100% compatible with MongoDB, with actual compatibility at approximately 34%.

| Item | DocumentDB | MongoDB Atlas |
|---|---|---|
| MongoDB Compatibility | ~34% (emulation) | 100% |
| retryWrites | Not supported (`retryWrites=false` forced) | Supported |
| Transactions | Partial support | Full support |
| Sharding | Not supported | Supported |
| Change Streams | Partial support | Full support |
| Atlas Search | Not supported | Supported |
| Korean Full-Text Search | Not supported | `lucene.korean` supported |
| Atlas Vector Search | Not supported | Supported |
| Auto-Scaling | Manual | Automatic (compute + storage) |
| Multi-Cloud | AWS only | AWS, GCP, Azure |

Using DocumentDB requires forcing `retryWrites=false` in the connection string, and unexpected behavior may occur with Spring Data MongoDB's `ReactiveMongoRepository` and similar components. MongoDB Atlas has no such limitations.

## 2. Atlas Search — Korean Full-Text Search

Atlas Search officially supports Apache Lucene's Nori morphological analyzer as `lucene.korean`. This enables Korean full-text search within MongoDB without a separate search engine (such as Elasticsearch).

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

Search queries use the `$search` aggregation stage.

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

Atlas Vector Search enables performing full-text search and vector search together within the same collection. Large-scale vector workloads are handled by Milvus while metadata-level vector search is handled by Atlas, allowing role separation.

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

## 4. EKS Network Integration

### 4.1. VPC Peering (Recommended for Dev/Staging)

VPC Peering is free and provides access to Atlas through a private network. It is supported on M10 tier and above.

The setup procedure is as follows.

1. Create a VPC Peering request in Atlas
2. Accept the Peering request in AWS
3. Add the Atlas VPC CIDR to the route table
4. Add the EKS VPC CIDR to the Atlas IP Access List

### 4.2. AWS PrivateLink (Recommended for Production)

PrivateLink is a unidirectional connection that provides the highest level of security. It works by connecting a Private Endpoint created in Atlas to the AWS VPC.

Unlike VPC Peering, there are no CIDR conflict issues and traffic stays within the AWS network.

### 4.3. IP Access List

Tiers below M10 (M0/M2/M5) do not support VPC Peering or PrivateLink. They connect by registering the NAT Gateway's static IP in the Atlas IP Access List, but this is less secure and should only be used for development purposes.

## 5. Per-Environment Configuration

| Environment | Tier | Backup | Auto-Scaling | Estimated Cost |
|---|---|---|---|---|
| dev | M10 | Disabled | Not applied | ~$57/month |
| staging | M20 | Cloud Backup (daily) | Not applied | ~$144/month |
| prod | M30 | PITR + Snapshots | M30 -> M40 | ~$389+/month |

The Seoul region (`AP_NORTHEAST_2`) is used for all environments. The development environment can reduce costs during non-use with Atlas's Pause feature.

## 6. Backup and Recovery

### 6.1. Cloud Backup

Hourly, daily, weekly, and monthly snapshot policies can be configured.

### 6.2. PITR (Point-in-Time Recovery)

Continuous oplog backup enables point-in-time recovery. PITR is recommended for production, providing 1-minute recovery granularity.

## 7. Monitoring

Atlas provides built-in monitoring tools.

- **Metrics**: Operations/s, Connections, Query Targeting ratio
- **Performance Advisor**: Analyzes slow queries and automatically recommends indexes
- **Real-Time Performance Panel**: Real-time query performance monitoring
- **Alert Integration**: Integration with Slack, PagerDuty

## 8. Security

- TLS 1.2/1.3 is applied by default
- Encryption at Rest can be enabled with AWS KMS CMK
- Database user roles are separated per service (separate user per service)
- Access is restricted via IP Access List

## 9. Terraform Configuration

Atlas resources are managed with the `mongodbatlas` provider.

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

# References

- <https://www.mongodb.com/docs/atlas/>
- <https://www.mongodb.com/docs/atlas/atlas-search/analyzers/>
- <https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/>
- <https://www.mongodb.com/docs/atlas/security-vpc-peering/>
- <https://www.mongodb.com/docs/atlas/security-private-endpoint/>
