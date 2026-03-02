---
title: "[Infra] EKS MNG + Karpenterハイブリッドコンピュート戦略"
ref: eks-mng-karpenter-hybrid-compute
excerpt: "EKSのコンピュートオプション(MNG、Fargate、Karpenter)を比較し、statefulサービスにはMNG、statelessサービスにはKarpenterを組み合わせるハイブリッド戦略を整理する。"
date: 2026-03-02T12:00+09:00
last_modified_at: 2026-03-02T12:00+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/eks-mng-karpenter-hybrid-compute.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/eks-mng-karpenter-hybrid-compute.png"
categories:
  - Development
  - Server
  - Infra
tags:
  - AWS
  - EKS
  - Kubernetes
  - Karpenter
  - HPA
  - KEDA
  - Milvus
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Server"
    url: /ja/development/server/
  - title: "Infra"
    url: /ja/development/server/infra/
---

# 概要

EKSのコンピュートオプション(MNG、Fargate、Karpenter)を比較し、statefulサービスにはMNG、statelessサービスにはKarpenterを組み合わせるハイブリッド戦略を整理する。

# まとめ

## 1. EKSコンピュートオプション比較

Amazon EKS(Elastic Kubernetes Service)はコントロールプレーン(APIサーバー、etcdなど)をAWSが管理するフルマネージドKubernetesサービスである。クラスターあたり$0.10/時間のコントロールプレーン固定費用が発生し、ワーカーノードはEC2 On-Demand/Spot料金がそのまま適用される。

### 1.1. Managed Node Groups (MNG)

AWSがEC2 Auto Scaling Groupを管理する方式で、最も汎用的なオプションである。

- 予測可能なコストとすべてのKubernetes機能をサポートする
- DaemonSet実行が可能でSpotインスタンスを混在させることができる
- スケーリング速度がKarpenter対比で遅く、インスタンスタイプをノードグループ作成時に固定する必要がある
- Kafka、Milvusなどのstatefulサービスに適している

### 1.2. AWS Fargate

EC2ノードなしでPod単位でコンピュートを割り当てるサーバーレスオプションである。

- ノード管理が不要で自動隔離によりセキュリティが強化される
- DaemonSetをサポートせず、Persistent VolumeはEFSのみ対応し、コールドスタートが存在する
- Karpenterコントローラー自体や単純なバッチジョブに適している

### 1.3. Karpenter

Podスケジューリングリクエストをリアルタイムで検知し、最適なEC2インスタンスを数秒以内にプロビジョニングするオープンソースオートスケーラーである。

- 多様なインスタンスタイプを同時にサポートし、Spot統合が可能である
- Cluster Autoscaler対比で反応速度が速く、コスト最適化が組み込まれている
- 初期設定が複雑で、MNGとの同時運用時にはNodePool設計が必要である
- トラフィック変動が大きいAPIサーバー、ワーカープロセスに適している

### 1.4. EKS Auto Mode

2024年にGAとなったKarpenterベースの完全自動化モードで、ノード管理を完全に委任する。SSHアクセスが不可で、カスタマイズが制限されるため、細かい制御が必要なプロジェクトにはまだ適していない。

## 2. ハイブリッド構成 — MNG + Karpenter

ワークロードの特性に応じてMNGとKarpenterを組み合わせるハイブリッド構成を選択した。

| 構成要素 | 配置方式 | 理由 |
|---|---|---|
| Karpenterコントローラー | Fargateまたは小型On-Demand MNG | 循環依存問題の防止 |
| Kafka、Milvus | On-Demand MNG (r7i/m7i系) | Stateful、PVC必要 |
| AI API (FastAPI + workers) | Karpenter Spot | トラフィック変動が大きい |
| Service API、Observation API | Karpenter On-Demand/Spot混合 | 可用性とコストのバランス |
| Web Client | Karpenter Spot | Stateless、水平スケーリング容易 |

Karpenterコントローラーは自身がプロビジョニングするノードで実行すると循環依存が発生する。別途MNGまたはFargateに配置する必要がある。

## 3. ノードグループ設計

```
MNG - system (On-Demand)
  インスタンス: m7i.large × 2 (マルチAZ)
  用途: CoreDNS、kube-proxy、AWS LBC、Karpenter、モニタリング

MNG - stateful (On-Demand)
  インスタンス: r7i.xlarge × 2 (マルチAZ)
  用途: Milvus、Kafka
  StorageClass: gp3 (ebs.csi.aws.com)

Karpenter NodePool - app-spot
  インスタンスファミリー: m7i、m7i-flex、m6i、c7i、c6i + Spot
  用途: AI API、Service API、Observation API、Web Client

Karpenter NodePool - app-ondemand
  インスタンスファミリー: m7i、m7i-flex、m6i
  用途: 可用性が重要なサービスの一部レプリカ
```

Karpenter NodePoolは`consolidationPolicy: WhenUnderutilized`でアイドルノードを自動縮小する。

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
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["m7i.large", "m7i.xlarge", "m7i-flex.large",
                   "m6i.large", "m6i.xlarge", "c7i.large", "c6i.large"]
        - key: topology.kubernetes.io/zone
          operator: In
          values: ["ap-northeast-2a", "ap-northeast-2b", "ap-northeast-2c"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
  disruption:
    consolidationPolicy: WhenUnderutilized
    expireAfter: 720h
  limits:
    cpu: "80"
    memory: 160Gi
```

## 4. ネットワーク設計

```
VPC CIDR: 10.0.0.0/16

パブリックサブネット (NAT GW、ALB)
  ap-northeast-2a: 10.0.1.0/24
  ap-northeast-2b: 10.0.2.0/24
  ap-northeast-2c: 10.0.3.0/24

プライベートサブネット (ワーカーノード、Pod)
  ap-northeast-2a: 10.0.11.0/24
  ap-northeast-2b: 10.0.12.0/24
  ap-northeast-2c: 10.0.13.0/24

DB専用隔離サブネット
  ap-northeast-2a: 10.0.21.0/24
  ap-northeast-2b: 10.0.22.0/24
  ap-northeast-2c: 10.0.23.0/24
```

サブネットタグで`kubernetes.io/role/elb: "1"`(パブリック)と`kubernetes.io/role/internal-elb: "1"`(プライベート)を設定し、ALBとKarpenterが正しいサブネットを認識できるようにする。Pod IPが不足する大規模クラスターではVPC CNI prefix delegationを有効化してノードあたりの割り当て可能なIP数を増やすことができる。

## 5. Auto-scaling戦略

### 5.1. HPA (Horizontal Pod Autoscaler)

CPU/メモリベースの水平スケーリングで、Service API、Observation API、Web Clientに適用する。

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
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### 5.2. KEDA (Kafkaイベントベース)

Kafka consumer lagベースでAI APIワーカーをスケーリングする。

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: worker-scaledobject
spec:
  scaleTargetRef:
    name: worker-deployment
  minReplicaCount: 1
  maxReplicaCount: 10
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka.infra.svc.cluster.local:9092
        consumerGroup: consumer-group
        topic: target-topic
        lagThreshold: "50"
```

### 5.3. VPA (Vertical Pod Autoscaler)

Milvus QueryNodeのようにメモリ予測が難しいサービスに`UpdateMode: "Off"`で適用し、right-sizingデータを収集する。推奨値をもとにrequestsを手動調整する方式で使用する。

### 5.4. Karpenterクラスターレベルスケーリング

KarpenterはPodリクエストに応じてノードを動的にプロビジョニングし、`consolidationPolicy: WhenUnderutilized`でアイドルノードを自動縮小する。HPA/KEDAがPod数を増やすとKarpenterがノードを追加し、Podが減るとノードを整理する2段階スケーリングが完成する。

## 6. Ingress設計

AWS Load Balancer Controller(ALB)を使用して外部トラフィックを処理する。`alb.ingress.kubernetes.io/group.name`でネームスペース間でALB 1つを共有する。

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

ACM証明書を自動統合するためcert-managerは不要である。

## 7. Milvus on EKS

Milvus Operatorでスタック全体のライフサイクルを管理する。MinIOの代わりにAmazon S3をオブジェクトストレージとして使用し、PVC管理、HA設定、バックアップの複雑さを軽減する。

```yaml
apiVersion: milvus.io/v1beta1
kind: Milvus
metadata:
  name: milvus
spec:
  dependencies:
    storage:
      external: true
      type: S3
      endpoint: s3.ap-northeast-2.amazonaws.com
      rootPath: milvus/data
      bucketName: my-project-milvus-storage
      useIAM: true
```

IRSAを使用すればアクセスキーなしでS3にアクセスできる。Milvusの主要コンポーネント(QueryNode、DataNode、IndexNode)はstateful MNGにnode affinityで配置し、anti-affinityでAZ間分散を保証する。

## 8. コスト最適化

SpotインスタンスとKarpenter自動縮小を組み合わせると、On-Demand対比で60-70%のコスト削減が可能である。

| インスタンスタイプ | 用途 | 価格参考 |
|---|---|---|
| m7i-flex.large | 汎用APIサーバー | m7i対比で約5%安価 |
| r7i.xlarge | メモリ集約型 (Milvus、Kafka) | メモリ最適化 |
| c7i.large | CPU集約型 (AI推論) | コンピュート最適化 |

```
EKSコントロールプレーン:             $73
system MNG (m7i.large × 2):          $147
stateful MNG (r7i.xlarge × 2):       $393
Karpenter Spotノード (平均4台):      ~$120
ALB (1つ):                           $18
NAT Gateway:                         $45
EBS (gp3 2TB):                       $160
合計推定:                            ~$956/月
```

# 参考

- <https://aws.amazon.com/blogs/compute/cost-optimization-and-resilience-eks-with-spot-instances/>
- <https://aws.amazon.com/blogs/containers/a-deeper-look-at-ingress-sharing-and-target-group-binding-in-aws-load-balancer-controller/>
- <https://aws.github.io/aws-eks-best-practices/networking/subnets/>
- <https://docs.aws.amazon.com/eks/latest/best-practices/karpenter.html>
- <https://karpenter.sh/docs/concepts/nodepools/>
- <https://keda.sh/docs/2.16/scalers/apache-kafka/>
- <https://milvus.io/docs/deploy_s3.md>
- <https://milvus.io/docs/eks.md>
