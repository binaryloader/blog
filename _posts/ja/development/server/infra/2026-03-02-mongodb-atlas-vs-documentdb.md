---
title: "[Infra] MongoDB Atlas vs DocumentDB比較とEKS連携"
ref: mongodb-atlas-vs-documentdb
excerpt: "DocumentDBの互換性の限界を分析し、MongoDB Atlasを選択した理由、Atlas Search日本語検索、VPC Peering/PrivateLinkを通じたEKS連携方法を整理する。"
date: 2026-03-02T12:40+09:00
last_modified_at: 2026-03-02T12:40+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/mongodb-atlas-vs-documentdb.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/mongodb-atlas-vs-documentdb.png"
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
    url: /ja/development/
  - title: "Server"
    url: /ja/development/server/
  - title: "Infra"
    url: /ja/development/server/infra/
---

# 概要

DocumentDBの互換性の限界を分析し、MongoDB Atlasを選択した理由、Atlas Search韓国語検索、VPC Peering/PrivateLinkを通じたEKS連携方法を整理する。

# まとめ

## 1. DocumentDBの互換性問題

Amazon DocumentDBはMongoDBワイヤープロトコルをエミュレーションする別エンジンである。MongoDBと100%互換ではなく、実際の互換性は約34%レベルである。

| 項目 | DocumentDB | MongoDB Atlas |
|---|---|---|
| MongoDB互換性 | ~34% (エミュレーション) | 100% |
| retryWrites | 非対応 (`retryWrites=false`強制) | 対応 |
| トランザクション | 部分対応 | 完全対応 |
| シャーディング | 非対応 | 対応 |
| Change Streams | 部分対応 | 完全対応 |
| Atlas Search | 非対応 | 対応 |
| 韓国語全文検索 | 非対応 | `lucene.korean`対応 |
| Atlas Vector Search | 非対応 | 対応 |
| Auto-Scaling | 手動 | 自動 (コンピュート + ストレージ) |
| マルチクラウド | AWSのみ | AWS、GCP、Azure |

DocumentDBを使用すると接続文字列に`retryWrites=false`を強制する必要があり、Spring Data MongoDBの`ReactiveMongoRepository`などで予期しない動作が発生する可能性がある。MongoDB Atlasにはこのような制限がない。

## 2. Atlas Search — 韓国語全文検索

Atlas SearchはApache LuceneのNori形態素解析器を`lucene.korean`として公式サポートする。別途の検索エンジン(Elasticsearchなど)なしでMongoDB内部で韓国語全文検索が可能である。

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

検索クエリは`$search` aggregation stageを使用する。

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

Atlas Vector Searchを使用すると同一コレクションで全文検索とベクトル検索を同時に実行できる。大規模ベクトルワークロードはMilvusで処理し、メタデータレベルのベクトル検索はAtlasで処理する役割分担が可能である。

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

## 4. EKSネットワーク連携

### 4.1. VPC Peering (開発/ステージング推奨)

VPC Peeringは無料でプライベートネットワークを通じてAtlasにアクセスする。M10以上のティアでサポートされる。

設定手順は以下の通りである。

1. AtlasでVPC Peeringリクエストを作成
2. AWSでPeeringリクエストを承認
3. ルートテーブルにAtlas VPC CIDRを追加
4. Atlas IP Access ListにEKS VPC CIDRを追加

### 4.2. AWS PrivateLink (プロダクション推奨)

PrivateLinkは単方向接続で最高レベルのセキュリティを提供する。Atlasで作成したPrivate EndpointをAWS VPCに接続する方式である。

VPC Peeringと異なりCIDR衝突問題がなく、トラフィックがAWSネットワーク内でのみ移動する。

### 4.3. IP Access List

M10未満のティア(M0/M2/M5)はVPC PeeringとPrivateLinkをサポートしない。NAT Gatewayの固定IPをAtlas IP Access Listに登録する方式で接続するが、セキュリティが弱いため開発用途にのみ使用する。

## 5. 環境別構成

| 環境 | ティア | バックアップ | Auto-Scaling | 予想コスト |
|---|---|---|---|---|
| dev | M10 | 無効 | 未適用 | ~$57/月 |
| staging | M20 | Cloud Backup (日次) | 未適用 | ~$144/月 |
| prod | M30 | PITR + スナップショット | M30 → M40 | ~$389+/月 |

リージョンはすべての環境でソウル(`AP_NORTHEAST_2`)を使用する。開発環境はAtlasのPause機能で未使用時のコストを削減できる。

## 6. バックアップとリカバリ

### 6.1. Cloud Backup

時間別、日別、週別、月別のスナップショットポリシーを設定できる。

### 6.2. PITR (Point-in-Time Recovery)

連続的なoplogバックアップにより特定時点の復元が可能である。プロダクションでは1分単位の復元精度を提供するPITRを推奨する。

## 7. モニタリング

Atlasは内蔵モニタリングツールを提供する。

- **Metrics**: Operations/s、Connections、Query Targeting比率
- **Performance Advisor**: 遅いクエリを分析しインデックスを自動推奨
- **Real-Time Performance Panel**: リアルタイムクエリ性能モニタリング
- **Alert Integration**: Slack、PagerDutyと連携

## 8. セキュリティ

- TLS 1.2/1.3がデフォルトで適用される
- Encryption at RestをAWS KMS CMKで有効化できる
- データベースユーザーごとにロールを分離する(サービスごとに別ユーザー)
- IP Access Listでアクセスを制限する

## 9. Terraform構成

`mongodbatlas`プロバイダーでAtlasリソースを管理する。

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

# 参考

- <https://www.mongodb.com/docs/atlas/>
- <https://www.mongodb.com/docs/atlas/atlas-search/analyzers/>
- <https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/>
- <https://www.mongodb.com/docs/atlas/security-vpc-peering/>
- <https://www.mongodb.com/docs/atlas/security-private-endpoint/>
