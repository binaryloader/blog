---
title: "[Infra] 월 30만원 미만 AWS PoC 인프라 설계 검토"
ref: aws-poc-infra-under-300k-krw
excerpt: "EKS, Karpenter, Secrets Manager, API Gateway, S3 + CloudFront, MongoDB Atlas, Terraform을 모두 사용하면서 월 30만원 미만으로 PoC 인프라를 구성할 수 있는지 설계를 검토한다."
date: 2026-03-02T13:00+09:00
last_modified_at: 2026-03-02T13:00+09:00
published: false
header:
  overlay_image: "/assets/image/thumbnail/header/aws-poc-infra-under-300k-krw.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/aws-poc-infra-under-300k-krw.png"
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
    url: /ko/development/
  - title: "Server"
    url: /ko/development/server/
  - title: "Infra"
    url: /ko/development/server/infra/
---

# 개요

이전 포스트들에서 설계한 EKS 기반 프로덕션 인프라를 동일한 서비스 구성으로 월 30만원(~$220) 미만의 PoC 환경으로 축소할 수 있는지 검토한다. EKS, Karpenter, Secrets Manager, API Gateway, S3 + CloudFront, MongoDB Atlas, Terraform을 모두 유지하면서 비용을 87% 절감하는 것이 목표다.

# 정리

## 1. 프로덕션 vs PoC

이전 포스트에서 설계한 프로덕션 인프라의 예상 비용은 월 ~$1,445(약 195만원)이다.

| 항목 | 프로덕션 | PoC | 절감 |
|---|---|---|---|
| EKS 컨트롤 플레인 | $73 | $73 | - |
| MNG system | m7i.large × 2 ($147) | t4g.medium × 1 ($25) | -83% |
| MNG stateful | r7i.xlarge × 2 ($393) | t4g.xlarge × 1 Spot ($39) | -90% |
| Karpenter 노드 | Spot 평균 4대 ($120) | Spot 평균 1대 ($6) | -95% |
| NAT Gateway | $45 | fck-nat ($5) | -89% |
| ALB | $18 | $18 | - |
| EBS | gp3 2TB ($160) | gp3 80GB ($6) | -96% |
| MongoDB Atlas | M30 ($430) | M0 ($0) | -100% |
| API Gateway + Secrets Manager | $39 | $4 | -90% |
| S3 + CloudFront | $20 | $3 | -85% |
| **총 추정** | **~$1,445** | **~$180** | **-87%** |

PoC에서도 프로덕션과 동일한 서비스를 사용하되 노드 수, 인스턴스 크기, 관리형 서비스 티어를 최소화하는 방향으로 설계한다.

## 2. 비용 절감 전략

### 2.1. NAT Gateway → fck-nat

NAT Gateway는 $0.045/시간 + 데이터 처리 비용으로 월 $45 이상이다. fck-nat은 NAT Gateway를 t4g.nano Spot 인스턴스로 대체하는 오픈소스 솔루션이다.

| | NAT Gateway | fck-nat (t4g.nano Spot) |
|---|---|---|
| 월 비용 | ~$45 | ~$5 (인스턴스 + Elastic IP) |
| 가용성 | AWS 관리형 HA | 단일 인스턴스 (ASG 자동 복구) |
| 대역폭 | 45Gbps | 최대 5Gbps |

PoC 트래픽에는 fck-nat으로 충분하다. Terraform 모듈로 Auto Scaling Group을 구성하면 인스턴스 장애 시 자동 복구된다.

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

### 2.2. Graviton(ARM) 인스턴스

t4g(Graviton) 인스턴스는 동급 x86(t3) 대비 약 20% 저렴하면서 성능이 동등하거나 우수하다.

| x86 | ARM (Graviton) | 절감율 |
|---|---|---|
| t3.medium ($30) | t4g.medium ($25) | 19% |
| t3.xlarge ($121) | t4g.xlarge ($97) | 20% |

컨테이너 이미지를 멀티 아키텍처(amd64 + arm64)로 빌드하면 프로덕션(x86)과 PoC(ARM)에서 동일한 이미지를 사용할 수 있다.

### 2.3. Spot 인스턴스

Spot 인스턴스는 On-Demand 대비 60~70% 저렴하다. PoC에서는 가용성 요구가 낮으므로 stateful 노드에도 Spot을 적용한다.

| 인스턴스 | On-Demand | Spot (예상) | 절감율 |
|---|---|---|---|
| t4g.medium | $25 | ~$10 | 60% |
| t4g.xlarge | $97 | ~$39 | 60% |

Spot 중단 시 Milvus, Kafka가 일시적으로 중단될 수 있지만 PoC 환경에서는 허용 가능하다.

### 2.4. 단일 노드 + MongoDB 무료 티어

- MNG 노드 그룹당 1대로 멀티 AZ HA를 포기한다
- MongoDB Atlas M0(무료, 512MB)로 데이터 규모를 PoC 수준으로 제한한다
- EBS를 gp3 80GB로 최소화한다

## 3. 아키텍처 개요

```
인터넷
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

        프라이빗 서브넷 → fck-nat → 인터넷

외부 서비스
├── MongoDB Atlas M0
├── Secrets Manager
└── S3 (Milvus 스토리지 / Terraform state)
```

프로덕션 설계와 동일한 서비스를 사용하되 노드 수와 인스턴스 크기를 최소화하는 구조다.

## 4. 컴퓨트 — 노드 그룹 설계

```
MNG - system (On-Demand)
  인스턴스: t4g.medium × 1
  vCPU: 2, RAM: 4GB
  용도: CoreDNS, kube-proxy, AWS LBC, Karpenter, ESO

MNG - stateful (Spot)
  인스턴스: t4g.xlarge × 1
  vCPU: 4, RAM: 16GB
  용도: Milvus, Kafka, etcd
  StorageClass: gp3 (ebs.csi.aws.com)

Karpenter NodePool - app-spot
  인스턴스 패밀리: t4g, m7g, m6g, c7g + Spot
  용도: AI API, Service API, Observation API, Web Client
```

system 노드의 4GB RAM은 시스템 컴포넌트(CoreDNS ~128MB, kube-proxy ~128MB, AWS LBC ~256MB, Karpenter ~512MB, ESO ~256MB)를 실행하기에 충분하다. stateful 노드의 16GB RAM은 Milvus standalone(~8GB) + Kafka KRaft(~2GB) + etcd(~512MB)를 수용한다.

## 5. 네트워크

프로덕션과 동일한 3-tier 서브넷 구조를 사용하되 NAT Gateway를 fck-nat으로 대체하고 단일 AZ로 운영한다.

```
VPC CIDR: 10.0.0.0/16

퍼블릭 서브넷 (fck-nat, ALB)
  ap-northeast-2a: 10.0.1.0/24

프라이빗 서브넷 (워커 노드, Pod)
  ap-northeast-2a: 10.0.11.0/24

DB 전용 격리 서브넷
  ap-northeast-2a: 10.0.21.0/24
```

서브넷 태그로 `kubernetes.io/role/elb: "1"` (퍼블릭)과 `kubernetes.io/role/internal-elb: "1"` (프라이빗)을 설정해 ALB와 Karpenter가 올바른 서브넷을 인식하도록 한다. 프로덕션 전환 시 멀티 AZ 서브넷을 추가하면 된다.

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

프로덕션 대비 변경점은 아래와 같다.

- `kubernetes.io/arch: arm64`로 Graviton 인스턴스만 사용한다
- AZ를 `ap-northeast-2a` 1개로 제한한다
- `limits`를 cpu 8, memory 16Gi로 제한해 비용 상한을 설정한다

## 7. Auto-scaling

### 7.1. HPA

프로덕션과 동일한 HPA를 적용하되 레플리카 범위를 축소한다.

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

Kafka consumer lag 기반 스케일링도 동일하게 적용한다.

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

### 7.3. Karpenter 클러스터 레벨 스케일링

HPA/KEDA가 Pod를 늘리면 Karpenter가 노드를 추가하는 2단계 스케일링은 프로덕션과 동일하다. NodePool의 `limits`로 비용 상한을 제한한다.

## 8. Ingress — ALB

프로덕션과 동일하게 AWS Load Balancer Controller로 ALB를 관리한다. `alb.ingress.kubernetes.io/group.name`으로 네임스페이스 간 ALB 1개를 공유한다.

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

Secrets Manager와 External Secrets Operator 구성은 프로덕션과 동일하다. PoC에서는 시크릿 수가 적어 비용이 최소화된다.

| 항목 | 프로덕션 | PoC |
|---|---|---|
| 시크릿 수 | ~15개 | ~5개 |
| 월 비용 | ~$6 | ~$2 |

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

IRSA를 사용해 서비스별로 필요한 시크릿에만 접근하도록 최소 권한 원칙을 적용한다.

## 10. API Gateway

HTTP API와 WebSocket API 구성은 프로덕션과 동일하다. 사용량 기반 과금이므로 PoC 트래픽에서는 비용이 거의 발생하지 않는다.

| | HTTP API | WebSocket API |
|---|---|---|
| 요금 | $1.00/100만 요청 | $1.00/100만 메시지 |
| PoC 예상 | ~$1 | ~$1 |

VPC Link를 통해 내부 ALB와 연결하는 구조도 동일하다. Lambda Authorizer로 인증을 처리하고 캐시 TTL을 최대값(3600초)으로 설정해 비용을 절감한다.

## 11. S3 + CloudFront

React SPA 호스팅은 프로덕션과 동일하게 S3 + CloudFront + OAC를 사용한다. CloudFront는 매월 1TB 전송, 10,000,000 요청이 Always Free로 제공되므로 소규모 SPA에서는 비용이 거의 발생하지 않는다. S3는 프리 플랜(6개월, $200 크레딧) 만료 후에도 소규모 정적 파일 기준 월 $1 미만이다.

## 12. MongoDB Atlas M0

프로덕션의 M30 대신 M0(무료) 티어를 사용한다.

| 항목 | M0 (무료) | M30 ($430) |
|---|---|---|
| 스토리지 | 512MB | 40GB |
| RAM | 공유 | 전용 8GB |
| VPC Peering | 미지원 | 지원 |
| 연결 수 | 500 | 2,000 |

M0에서는 VPC Peering이 불가하므로 퍼블릭 엔드포인트로 접근한다. Atlas IP Access List에 fck-nat의 Elastic IP를 등록해 접근을 제한한다.

## 13. Milvus on EKS

프로덕션과 동일하게 Milvus Operator를 사용하되 standalone 모드로 운영한다.

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

standalone 모드는 QueryNode, DataNode, IndexNode를 단일 프로세스로 통합해 리소스 사용량이 줄어든다. S3 스토리지 연동은 프로덕션과 동일하게 IRSA를 사용한다. stateful MNG에 node affinity로 배치한다.

## 14. Terraform

Terraform 모듈 구조와 S3 Native State Locking은 프로덕션과 동일하다. PoC 전용 변수 파일로 환경을 분리한다.

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

인프라 코드를 공유하고 변수만 변경하면 PoC ↔ 프로덕션 전환이 간단하다. GitHub Actions CI/CD 파이프라인과 Infracost 연동도 동일하게 사용한다.

## 15. 비용 견적

| 항목 | 월 비용 |
|---|---|
| EKS 컨트롤 플레인 | $73.00 |
| MNG system (t4g.medium × 1, On-Demand) | $24.53 |
| MNG stateful (t4g.xlarge × 1, Spot) | ~$39.00 |
| Karpenter Spot (t4g.small × 1 평균) | ~$6.00 |
| fck-nat (t4g.nano Spot) | ~$1.50 |
| Elastic IP × 1 | $3.75 |
| ALB × 1 | $18.00 |
| EBS gp3 80GB | $6.40 |
| MongoDB Atlas M0 | $0 |
| API Gateway (HTTP + WebSocket) | ~$2.00 |
| Secrets Manager (5개) | $2.00 |
| S3 + CloudFront | ~$3.00 |
| Route53 | $0.50 |
| **총 추정** | **~$180 (약 24만원)** |

프로덕션 대비 87% 비용 절감이며 30만원(~$220)을 크게 밑돈다.

## 16. 프로덕션 대비 제약사항

| 항목 | 프로덕션 | PoC |
|---|---|---|
| 가용성 | 멀티 AZ, 노드 2+ | 단일 AZ, 노드 1 |
| Spot 리스크 | app만 Spot | stateful도 Spot |
| MongoDB | M30 전용, VPC Peering | M0 공유, 퍼블릭 접근 |
| 데이터 규모 | 제한 없음 | MongoDB 512MB |
| NAT | 관리형 HA | fck-nat 단일 인스턴스 |
| Milvus | 분산 모드, 멀티 레플리카 | standalone, 단일 프로세스 |

## 17. 프로덕션 전환

PoC에서 프로덕션으로 전환할 때 변경하는 항목은 아래와 같다.

1. **Terraform 변수 변경**: `environments/poc/terraform.tfvars` → `environments/prod/terraform.tfvars`
2. **노드 스케일업**: t4g.medium × 1 → m7i.large × 2, t4g.xlarge × 1 → r7i.xlarge × 2
3. **멀티 AZ 확장**: 서브넷과 노드를 3개 AZ로 분산
4. **NAT 전환**: fck-nat → NAT Gateway
5. **MongoDB 업그레이드**: M0 → M10/M30, VPC Peering 설정
6. **Milvus 전환**: standalone → distributed 모드
7. **Spot 정책 조정**: stateful 노드를 On-Demand로 변경

Terraform 변수와 Kubernetes 매니페스트만 변경하면 애플리케이션 코드 수정 없이 전환할 수 있도록 설계한다.

# 참고

- <https://fck-nat.dev/>
- <https://aws.amazon.com/ec2/graviton/>
- <https://aws.amazon.com/ec2/spot/>
- <https://aws.amazon.com/ec2/pricing/on-demand/>
- <https://karpenter.sh/docs/concepts/nodepools/>
- <https://docs.aws.amazon.com/eks/latest/best-practices/karpenter.html>
- <https://milvus.io/docs/install_standalone-docker.md>
- <https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/>
