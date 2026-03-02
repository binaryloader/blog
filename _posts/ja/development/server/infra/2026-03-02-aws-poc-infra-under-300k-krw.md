---
title: "[Infra] 月30万ウォン未満のAWS PoCインフラ設計検討"
ref: aws-poc-infra-under-300k-krw
excerpt: "EKS、Karpenter、Secrets Manager、API Gateway、S3 + CloudFront、MongoDB Atlas、Terraformをすべて使用しながら月30万ウォン未満でPoCインフラを構成できるか設計を検討する。"
date: 2026-03-02T13:00+09:00
last_modified_at: 2026-03-02T13:00+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/aws-poc-infra-under-300k-krw.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/aws-poc-infra-under-300k-krw.png"
categories:
  - Development
  - Server
  - Infra
tags:
  - AWS
  - EKS
  - PoC
  - Karpenter
  - Spot
  - Graviton
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Server"
    url: /ja/development/server/
  - title: "Infra"
    url: /ja/development/server/infra/
---

# 概要

以前の記事で設計したEKSベースのプロダクションインフラを同一のサービス構成のまま月30万ウォン（約3万円、~$220）未満のPoC環境に縮小できるかを検討する。EKS、Karpenter、Secrets Manager、API Gateway、S3 + CloudFront、MongoDB Atlas、Terraformをすべて維持しながらコストを87%削減することが目標である。

# 整理

## 1. プロダクション vs PoC

以前の記事で設計したプロダクションインフラの予想コストは月~$1,445（約195万ウォン）である。

| 項目 | プロダクション | PoC | 削減 |
|---|---|---|---|
| EKSコントロールプレーン | $73 | $73 | - |
| MNG system | m7i.large × 2 ($147) | t4g.medium × 1 ($25) | -83% |
| MNG stateful | r7i.xlarge × 2 ($393) | t4g.xlarge × 1 Spot ($39) | -90% |
| Karpenterノード | Spot 平均4台 ($120) | Spot 平均1台 ($6) | -95% |
| NAT Gateway | $45 | fck-nat ($5) | -89% |
| ALB | $18 | $18 | - |
| EBS | gp3 2TB ($160) | gp3 80GB ($6) | -96% |
| MongoDB Atlas | M30 ($430) | M0 ($0) | -100% |
| API Gateway + Secrets Manager | $39 | $4 | -90% |
| S3 + CloudFront | $20 | $3 | -85% |
| **合計推定** | **~$1,445** | **~$180** | **-87%** |

PoCでもプロダクションと同一のサービスを使用しつつノード数、インスタンスサイズ、マネージドサービスのティアを最小化する方向で設計する。

## 2. コスト削減戦略

### 2.1. NAT Gateway → fck-nat

NAT Gatewayは$0.045/時間 + データ処理コストで月$45以上になる。fck-natはNAT Gatewayをt4g.nano Spotインスタンスで代替するオープンソースソリューションである。

| | NAT Gateway | fck-nat (t4g.nano Spot) |
|---|---|---|
| 月額コスト | ~$45 | ~$5（インスタンス + Elastic IP） |
| 可用性 | AWSマネージドHA | 単一インスタンス（ASG自動復旧） |
| 帯域幅 | 45Gbps | 最大5Gbps |

PoCトラフィックにはfck-natで十分である。TerraformモジュールでAuto Scaling Groupを構成すればインスタンス障害時に自動復旧される。

```hcl
module "fck-nat" {
  source        = "RoboJackets/nat/aws"
  version       = "2.2.0"
  instance_type = "t4g.nano"
  use_spot      = true
  subnet_id     = aws_subnet.public_a.id
  vpc_id        = aws_vpc.main.id

  routes = [
    {
      route_table_id = aws_route_table.private.id
      cidr_block     = "0.0.0.0/0"
    }
  ]
}
```

### 2.2. Graviton（ARM）インスタンス

t4g（Graviton）インスタンスは同等のx86（t3）と比べて約20%安価でありながら性能は同等かそれ以上である。

| x86 | ARM (Graviton) | 削減率 |
|---|---|---|
| t3.medium ($30) | t4g.medium ($25) | 19% |
| t3.xlarge ($121) | t4g.xlarge ($97) | 20% |

コンテナイメージをマルチアーキテクチャ（amd64 + arm64）でビルドすればプロダクション（x86）とPoC（ARM）で同一のイメージを使用できる。

### 2.3. Spotインスタンス

SpotインスタンスはOn-Demand比で60〜70%安価である。PoCでは可用性要件が低いためstatefulノードにもSpotを適用する。

| インスタンス | On-Demand | Spot（予想） | 削減率 |
|---|---|---|---|
| t4g.medium | $25 | ~$10 | 60% |
| t4g.xlarge | $97 | ~$39 | 60% |

Spot中断時にMilvus、Kafkaが一時的に停止する可能性があるがPoC環境では許容範囲である。

### 2.4. 単一ノード + MongoDB無料ティア

- MNGノードグループあたり1台としマルチAZ HAを放棄する
- MongoDB Atlas M0（無料、512MB）でデータ規模をPoC水準に制限する
- EBSをgp3 80GBに最小化する

## 3. アーキテクチャ概要

```
インターネット
  │
  ├── CloudFront → S3 (React SPA)
  │
  ├── API Gateway (HTTP API + WebSocket API)
  │     └── VPC Link → ALB
  │
  └── Route53
        └── ALB (internet-facing)
              │
        EKS Cluster
        ├── MNG: system (t4g.medium × 1, On-Demand)
        │   ├── CoreDNS, kube-proxy, AWS LBC
        │   ├── Karpenter Controller
        │   └── External Secrets Operator
        │
        ├── MNG: stateful (t4g.xlarge × 1, Spot)
        │   ├── Milvus standalone (Operator)
        │   ├── Kafka (KRaft)
        │   └── etcd
        │
        └── Karpenter NodePool: app-spot (t4g Spot)
            ├── AI API (FastAPI)
            ├── Service API (Spring Boot)
            ├── Observation API (WebFlux)
            └── Web Client

        プライベートサブネット → fck-nat → インターネット

外部サービス
├── MongoDB Atlas M0
├── Secrets Manager
└── S3 (Milvusストレージ / Terraform state)
```

プロダクション設計と同一のサービスを使用しつつノード数とインスタンスサイズを最小化する構造である。

## 4. コンピュート — ノードグループ設計

```
MNG - system (On-Demand)
  インスタンス: t4g.medium × 1
  vCPU: 2, RAM: 4GB
  用途: CoreDNS, kube-proxy, AWS LBC, Karpenter, ESO

MNG - stateful (Spot)
  インスタンス: t4g.xlarge × 1
  vCPU: 4, RAM: 16GB
  用途: Milvus, Kafka, etcd
  StorageClass: gp3 (ebs.csi.aws.com)

Karpenter NodePool - app-spot
  インスタンスファミリー: t4g, m7g, m6g, c7g + Spot
  用途: AI API, Service API, Observation API, Web Client
```

systemノードの4GB RAMはシステムコンポーネント（CoreDNS ~128MB、kube-proxy ~128MB、AWS LBC ~256MB、Karpenter ~512MB、ESO ~256MB）を実行するのに十分である。statefulノードの16GB RAMはMilvus standalone（~8GB）+ Kafka KRaft（~2GB）+ etcd（~512MB）を収容する。

## 5. ネットワーク

プロダクションと同一の3-tierサブネット構造を使用するがNAT Gatewayをfck-natに置き換え単一AZで運用する。

```
VPC CIDR: 10.0.0.0/16

パブリックサブネット（fck-nat、ALB）
  ap-northeast-2a: 10.0.1.0/24

プライベートサブネット（ワーカーノード、Pod）
  ap-northeast-2a: 10.0.11.0/24

DB専用隔離サブネット
  ap-northeast-2a: 10.0.21.0/24
```

サブネットタグで`kubernetes.io/role/elb: "1"`（パブリック）と`kubernetes.io/role/internal-elb: "1"`（プライベート）を設定しALBとKarpenterが正しいサブネットを認識できるようにする。プロダクション移行時にマルチAZサブネットを追加すればよい。

## 6. Karpenter NodePool

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: app-spot
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot"]
        - key: kubernetes.io/arch
          operator: In
          values: ["arm64"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["t4g.small", "t4g.medium", "m7g.medium",
                   "m6g.medium", "c7g.medium"]
        - key: topology.kubernetes.io/zone
          operator: In
          values: ["ap-northeast-2a"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
  disruption:
    consolidationPolicy: WhenUnderutilized
    expireAfter: 720h
  limits:
    cpu: "8"
    memory: 16Gi
```

プロダクション比での変更点は以下のとおりである。

- `kubernetes.io/arch: arm64`でGravitonインスタンスのみ使用する
- AZを`ap-northeast-2a` 1つに制限する
- `limits`をcpu 8、memory 16Giに制限しコスト上限を設定する

## 7. Auto-scaling

### 7.1. HPA

プロダクションと同一のHPAを適用するがレプリカ範囲を縮小する。

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: service-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: service-api
  minReplicas: 1
  maxReplicas: 3
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### 7.2. KEDA

Kafka consumer lagベースのスケーリングも同様に適用する。

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: worker-scaledobject
spec:
  scaleTargetRef:
    name: worker-deployment
  minReplicaCount: 1
  maxReplicaCount: 3
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka.infra.svc.cluster.local:9092
        consumerGroup: consumer-group
        topic: target-topic
        lagThreshold: "50"
```

### 7.3. Karpenterクラスターレベルスケーリング

HPA/KEDAがPodを増やすとKarpenterがノードを追加する2段階スケーリングはプロダクションと同一である。NodePoolの`limits`でコスト上限を制限する。

## 8. Ingress — ALB

プロダクションと同様にAWS Load Balancer ControllerでALBを管理する。`alb.ingress.kubernetes.io/group.name`でネームスペース間でALB 1つを共有する。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: service-api-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/group.name: my-project
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: service-api
                port:
                  number: 8080
```

## 9. Secrets Manager + ESO

Secrets ManagerとExternal Secrets Operatorの構成はプロダクションと同一である。PoCではシークレット数が少ないためコストが最小化される。

| 項目 | プロダクション | PoC |
|---|---|---|
| シークレット数 | ~15個 | ~5個 |
| 月額コスト | ~$6 | ~$2 |

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: api-secrets
  data:
    - secretKey: OPENAI_API_KEY
      remoteRef:
        key: project/poc/openai-api-key
    - secretKey: MONGODB_ATLAS_URI
      remoteRef:
        key: project/poc/mongodb-atlas-uri
```

IRSAを使用しサービスごとに必要なシークレットにのみアクセスできるよう最小権限の原則を適用する。

## 10. API Gateway

HTTP APIとWebSocket APIの構成はプロダクションと同一である。使用量ベースの課金であるためPoCトラフィックではコストがほとんど発生しない。

| | HTTP API | WebSocket API |
|---|---|---|
| 料金 | $1.00/100万リクエスト | $1.00/100万メッセージ |
| PoC予想 | ~$1 | ~$1 |

VPC Linkを通じて内部ALBと接続する構造も同一である。Lambda Authorizerで認証を処理しキャッシュTTLを最大値（3600秒）に設定してコストを削減する。

## 11. S3 + CloudFront

React SPAホスティングはプロダクションと同じくS3 + CloudFront + OACを使用する。CloudFrontは毎月1TBの転送量と10,000,000リクエストがAlways Freeで提供されるため、小規模SPAではコストがほとんど発生しない。S3はフリープラン（6ヶ月、$200クレジット）終了後も小規模な静的ファイルであれば月$1未満である。

## 12. MongoDB Atlas M0

プロダクションのM30の代わりにM0（無料）ティアを使用する。

| 項目 | M0（無料） | M30 ($430) |
|---|---|---|
| ストレージ | 512MB | 40GB |
| RAM | 共有 | 専用8GB |
| VPC Peering | 非対応 | 対応 |
| 接続数 | 500 | 2,000 |

M0ではVPC Peeringが不可であるためパブリックエンドポイントでアクセスする。Atlas IP Access Listにfck-natのElastic IPを登録してアクセスを制限する。

## 13. Milvus on EKS

プロダクションと同様にMilvus Operatorを使用するがstandaloneモードで運用する。

```yaml
apiVersion: milvus.io/v1beta1
kind: Milvus
metadata:
  name: milvus
spec:
  mode: standalone
  dependencies:
    storage:
      external: true
      type: S3
      endpoint: s3.ap-northeast-2.amazonaws.com
      rootPath: milvus/data
      bucketName: my-project-milvus-storage
      useIAM: true
```

standaloneモードはQueryNode、DataNode、IndexNodeを単一プロセスに統合しリソース使用量が削減される。S3ストレージ連携はプロダクションと同様にIRSAを使用する。stateful MNGにnode affinityで配置する。

## 14. Terraform

Terraformモジュール構造とS3 Native State Lockingはプロダクションと同一である。PoC専用の変数ファイルで環境を分離する。

```hcl
# environments/poc/terraform.tfvars
environment           = "poc"
eks_system_instance   = "t4g.medium"
eks_system_count      = 1
eks_stateful_instance = "t4g.xlarge"
eks_stateful_count    = 1
use_spot_stateful     = true
use_nat_gateway       = false
use_fck_nat           = true
mongodb_atlas_tier    = "M0"
single_az             = true
```

インフラコードを共有し変数のみ変更すればPoC ↔ プロダクションの切り替えが簡単である。GitHub Actions CI/CDパイプラインとInfracost連携も同様に使用する。

## 15. コスト見積もり

| 項目 | 月額コスト |
|---|---|
| EKSコントロールプレーン | $73.00 |
| MNG system (t4g.medium × 1, On-Demand) | $24.53 |
| MNG stateful (t4g.xlarge × 1, Spot) | ~$39.00 |
| Karpenter Spot (t4g.small × 1 平均) | ~$6.00 |
| fck-nat (t4g.nano Spot) | ~$1.50 |
| Elastic IP × 1 | $3.75 |
| ALB × 1 | $18.00 |
| EBS gp3 80GB | $6.40 |
| MongoDB Atlas M0 | $0 |
| API Gateway (HTTP + WebSocket) | ~$2.00 |
| Secrets Manager (5個) | $2.00 |
| S3 + CloudFront | ~$3.00 |
| Route53 | $0.50 |
| **合計推定** | **~$180（約24万ウォン、約2.5万円）** |

プロダクション比で87%のコスト削減であり30万ウォン（約3万円、~$220）を大きく下回る。

## 16. プロダクション比の制約事項

| 項目 | プロダクション | PoC |
|---|---|---|
| 可用性 | マルチAZ、ノード2+ | 単一AZ、ノード1 |
| Spotリスク | appのみSpot | statefulもSpot |
| MongoDB | M30専用、VPC Peering | M0共有、パブリックアクセス |
| データ規模 | 制限なし | MongoDB 512MB |
| NAT | マネージドHA | fck-nat単一インスタンス |
| Milvus | 分散モード、マルチレプリカ | standalone、単一プロセス |

## 17. プロダクション移行

PoCからプロダクションへ移行する際に変更する項目は以下のとおりである。

1. **Terraform変数変更**: `environments/poc/terraform.tfvars` → `environments/prod/terraform.tfvars`
2. **ノードスケールアップ**: t4g.medium × 1 → m7i.large × 2、t4g.xlarge × 1 → r7i.xlarge × 2
3. **マルチAZ拡張**: サブネットとノードを3つのAZに分散
4. **NAT切り替え**: fck-nat → NAT Gateway
5. **MongoDBアップグレード**: M0 → M10/M30、VPC Peering設定
6. **Milvus切り替え**: standalone → distributedモード
7. **Spotポリシー調整**: statefulノードをOn-Demandに変更

Terraform変数とKubernetesマニフェストのみ変更すればアプリケーションコードの修正なしに移行できるよう設計する。

# 参考

- <https://fck-nat.dev/>
- <https://aws.amazon.com/ec2/graviton/>
- <https://aws.amazon.com/ec2/spot/>
- <https://aws.amazon.com/ec2/pricing/on-demand/>
- <https://karpenter.sh/docs/concepts/nodepools/>
- <https://docs.aws.amazon.com/eks/latest/best-practices/karpenter.html>
- <https://milvus.io/docs/install_standalone-docker.md>
- <https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/>
