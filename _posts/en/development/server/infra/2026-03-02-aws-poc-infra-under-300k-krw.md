---
title: "[Infra] Reviewing AWS PoC Infrastructure Design Under 300K KRW"
ref: aws-poc-infra-under-300k-krw
lang: en
permalink: /en/:categories/:title/
excerpt: "Reviewing whether a PoC infrastructure can be built under 300K KRW (~$220) per month while using all the same services: EKS, Karpenter, Secrets Manager, API Gateway, S3 + CloudFront, MongoDB Atlas, and Terraform."
date: 2026-03-02T13:00+09:00
last_modified_at: 2026-03-02T13:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/aws-poc-infra-under-300k-krw.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/aws-poc-infra-under-300k-krw.png"
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
    url: /en/development/
  - title: "Server"
    url: /en/development/server/
  - title: "Infra"
    url: /en/development/server/infra/
---

# Overview

This post reviews whether the EKS-based production infrastructure designed in previous posts can be scaled down to a PoC environment under 300K KRW (~$220) per month while keeping the same service composition. The goal is to achieve an 87% cost reduction while retaining EKS, Karpenter, Secrets Manager, API Gateway, S3 + CloudFront, MongoDB Atlas, and Terraform.

# Details

## 1. Production vs PoC

The estimated cost of the production infrastructure designed in the previous post is ~$1,445 per month (~1.95 million KRW).

| Item | Production | PoC | Savings |
|---|---|---|---|
| EKS Control Plane | $73 | $73 | - |
| MNG system | m7i.large x 2 ($147) | t4g.medium x 1 ($25) | -83% |
| MNG stateful | r7i.xlarge x 2 ($393) | t4g.xlarge x 1 Spot ($39) | -90% |
| Karpenter Nodes | Spot avg. 4 ($120) | Spot avg. 1 ($6) | -95% |
| NAT Gateway | $45 | fck-nat ($5) | -89% |
| ALB | $18 | $18 | - |
| EBS | gp3 2TB ($160) | gp3 80GB ($6) | -96% |
| MongoDB Atlas | M30 ($430) | M0 ($0) | -100% |
| API Gateway + Secrets Manager | $39 | $4 | -90% |
| S3 + CloudFront | $20 | $3 | -85% |
| **Total Estimate** | **~$1,445** | **~$180** | **-87%** |

The PoC is designed to use the same services as production while minimizing node count, instance sizes, and managed service tiers.

## 2. Cost Reduction Strategies

### 2.1. NAT Gateway to fck-nat

NAT Gateway costs $0.045/hour plus data processing fees, totaling $45 or more per month. fck-nat is an open-source solution that replaces NAT Gateway with a t4g.nano Spot instance.

| | NAT Gateway | fck-nat (t4g.nano Spot) |
|---|---|---|
| Monthly Cost | ~$45 | ~$5 (instance + Elastic IP) |
| Availability | AWS Managed HA | Single instance (ASG auto-recovery) |
| Bandwidth | 45Gbps | Up to 5Gbps |

fck-nat is more than sufficient for PoC traffic. Configuring an Auto Scaling Group via a Terraform module enables automatic recovery on instance failure.

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

### 2.2. Graviton (ARM) Instances

t4g (Graviton) instances are approximately 20% cheaper than equivalent x86 (t3) instances while delivering equal or better performance.

| x86 | ARM (Graviton) | Savings |
|---|---|---|
| t3.medium ($30) | t4g.medium ($25) | 19% |
| t3.xlarge ($121) | t4g.xlarge ($97) | 20% |

Building container images as multi-architecture (amd64 + arm64) allows the same image to be used in both production (x86) and PoC (ARM).

### 2.3. Spot Instances

Spot instances are 60-70% cheaper than On-Demand. Since availability requirements are lower in a PoC, Spot is applied to stateful nodes as well.

| Instance | On-Demand | Spot (est.) | Savings |
|---|---|---|---|
| t4g.medium | $25 | ~$10 | 60% |
| t4g.xlarge | $97 | ~$39 | 60% |

Milvus and Kafka may experience temporary interruptions during Spot reclamation, but this is acceptable in a PoC environment.

### 2.4. Single Node + MongoDB Free Tier

- Use 1 node per MNG node group, forgoing multi-AZ HA
- Use MongoDB Atlas M0 (free, 512MB) to limit data scale to PoC levels
- Minimize EBS to gp3 80GB

## 3. Architecture Overview

```
Internet
  |
  +-- CloudFront -> S3 (React SPA)
  |
  +-- API Gateway (HTTP API + WebSocket API)
  |     +-- VPC Link -> ALB
  |
  +-- Route53
        +-- ALB (internet-facing)
              |
        EKS Cluster
        +-- MNG: system (t4g.medium x 1, On-Demand)
        |   +-- CoreDNS, kube-proxy, AWS LBC
        |   +-- Karpenter Controller
        |   +-- External Secrets Operator
        |
        +-- MNG: stateful (t4g.xlarge x 1, Spot)
        |   +-- Milvus standalone (Operator)
        |   +-- Kafka (KRaft)
        |   +-- etcd
        |
        +-- Karpenter NodePool: app-spot (t4g Spot)
            +-- AI API (FastAPI)
            +-- Service API (Spring Boot)
            +-- Observation API (WebFlux)
            +-- Web Client

        Private Subnet -> fck-nat -> Internet

External Services
+-- MongoDB Atlas M0
+-- Secrets Manager
+-- S3 (Milvus storage / Terraform state)
```

The same services as the production design are used, with a structure designed to minimize node count and instance sizes.

## 4. Compute --- Node Group Design

```
MNG - system (On-Demand)
  Instance: t4g.medium x 1
  vCPU: 2, RAM: 4GB
  Purpose: CoreDNS, kube-proxy, AWS LBC, Karpenter, ESO

MNG - stateful (Spot)
  Instance: t4g.xlarge x 1
  vCPU: 4, RAM: 16GB
  Purpose: Milvus, Kafka, etcd
  StorageClass: gp3 (ebs.csi.aws.com)

Karpenter NodePool - app-spot
  Instance families: t4g, m7g, m6g, c7g + Spot
  Purpose: AI API, Service API, Observation API, Web Client
```

The system node's 4GB RAM is sufficient for running system components (CoreDNS ~128MB, kube-proxy ~128MB, AWS LBC ~256MB, Karpenter ~512MB, ESO ~256MB). The stateful node's 16GB RAM accommodates Milvus standalone (~8GB) + Kafka KRaft (~2GB) + etcd (~512MB).

## 5. Network

The same 3-tier subnet structure as production is used, but NAT Gateway is replaced with fck-nat and the setup runs in a single AZ.

```
VPC CIDR: 10.0.0.0/16

Public Subnet (fck-nat, ALB)
  ap-northeast-2a: 10.0.1.0/24

Private Subnet (Worker Nodes, Pods)
  ap-northeast-2a: 10.0.11.0/24

DB Isolated Subnet
  ap-northeast-2a: 10.0.21.0/24
```

Subnet tags `kubernetes.io/role/elb: "1"` (public) and `kubernetes.io/role/internal-elb: "1"` (private) are set so that ALB and Karpenter recognize the correct subnets. When transitioning to production, simply add multi-AZ subnets.

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

The changes compared to production are as follows.

- `kubernetes.io/arch: arm64` restricts to Graviton instances only
- AZ is limited to a single `ap-northeast-2a`
- `limits` are set to cpu 8 and memory 16Gi to cap costs

## 7. Auto-scaling

### 7.1. HPA

The same HPA as production is applied, but with reduced replica ranges.

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

Kafka consumer lag-based scaling is also applied identically.

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

### 7.3. Karpenter Cluster-Level Scaling

The two-stage scaling where HPA/KEDA scales Pods and Karpenter adds nodes is identical to production. The NodePool `limits` cap costs.

## 8. Ingress --- ALB

ALB is managed with the AWS Load Balancer Controller, identical to production. A single ALB is shared across namespaces using `alb.ingress.kubernetes.io/group.name`.

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

The Secrets Manager and External Secrets Operator configuration is identical to production. Costs are minimized in the PoC due to the smaller number of secrets.

| Item | Production | PoC |
|---|---|---|
| Number of Secrets | ~15 | ~5 |
| Monthly Cost | ~$6 | ~$2 |

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

IRSA is used to apply the principle of least privilege, ensuring each service can only access the secrets it needs.

## 10. API Gateway

The HTTP API and WebSocket API configuration is identical to production. Since billing is usage-based, costs are negligible at PoC traffic levels.

| | HTTP API | WebSocket API |
|---|---|---|
| Pricing | $1.00/1M requests | $1.00/1M messages |
| PoC Estimate | ~$1 | ~$1 |

The architecture connecting to the internal ALB via VPC Link is also identical. A Lambda Authorizer handles authentication, and the cache TTL is set to the maximum (3600 seconds) to reduce costs.

## 11. S3 + CloudFront

React SPA hosting uses the same S3 + CloudFront + OAC setup as production. CloudFront provides 1 TB data transfer and 10,000,000 requests per month as Always Free, so costs are negligible for a small SPA. S3 costs less than $1/month for small static files even after the Free Plan (6 months, $200 credits) expires.

## 12. MongoDB Atlas M0

M0 (free) tier is used instead of the production M30.

| Item | M0 (Free) | M30 ($430) |
|---|---|---|
| Storage | 512MB | 40GB |
| RAM | Shared | Dedicated 8GB |
| VPC Peering | Not supported | Supported |
| Connections | 500 | 2,000 |

VPC Peering is not available on M0, so access is via the public endpoint. Access is restricted by registering the fck-nat Elastic IP in the Atlas IP Access List.

## 13. Milvus on EKS

Milvus Operator is used as in production, but in standalone mode.

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

Standalone mode consolidates QueryNode, DataNode, and IndexNode into a single process, reducing resource usage. S3 storage integration uses IRSA, identical to production. Placement on the stateful MNG is controlled via node affinity.

## 14. Terraform

The Terraform module structure and S3 Native State Locking are identical to production. A PoC-specific variable file separates the environments.

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

By sharing the infrastructure code and only changing variables, switching between PoC and production is straightforward. The GitHub Actions CI/CD pipeline and Infracost integration are also used identically.

## 15. Cost Estimate

| Item | Monthly Cost |
|---|---|
| EKS Control Plane | $73.00 |
| MNG system (t4g.medium x 1, On-Demand) | $24.53 |
| MNG stateful (t4g.xlarge x 1, Spot) | ~$39.00 |
| Karpenter Spot (t4g.small x 1 avg.) | ~$6.00 |
| fck-nat (t4g.nano Spot) | ~$1.50 |
| Elastic IP x 1 | $3.75 |
| ALB x 1 | $18.00 |
| EBS gp3 80GB | $6.40 |
| MongoDB Atlas M0 | $0 |
| API Gateway (HTTP + WebSocket) | ~$2.00 |
| Secrets Manager (5) | $2.00 |
| S3 + CloudFront | ~$3.00 |
| Route53 | $0.50 |
| **Total Estimate** | **~$180 (~240K KRW)** |

This represents an 87% cost reduction compared to production and comes in well under 300K KRW (~$220).

## 16. Limitations Compared to Production

| Item | Production | PoC |
|---|---|---|
| Availability | Multi-AZ, 2+ nodes | Single AZ, 1 node |
| Spot Risk | Spot for app only | Spot for stateful too |
| MongoDB | M30 dedicated, VPC Peering | M0 shared, public access |
| Data Scale | Unlimited | MongoDB 512MB |
| NAT | Managed HA | fck-nat single instance |
| Milvus | Distributed mode, multi-replica | Standalone, single process |

## 17. Production Transition

The items to change when transitioning from PoC to production are as follows.

1. **Change Terraform variables**: `environments/poc/terraform.tfvars` to `environments/prod/terraform.tfvars`
2. **Scale up nodes**: t4g.medium x 1 to m7i.large x 2, t4g.xlarge x 1 to r7i.xlarge x 2
3. **Expand to multi-AZ**: Distribute subnets and nodes across 3 AZs
4. **Switch NAT**: fck-nat to NAT Gateway
5. **Upgrade MongoDB**: M0 to M10/M30, configure VPC Peering
6. **Switch Milvus**: Standalone to distributed mode
7. **Adjust Spot policy**: Change stateful nodes to On-Demand

The infrastructure is designed so that only Terraform variables and Kubernetes manifests need to change --- no application code modifications are required.

# References

- <https://fck-nat.dev/>
- <https://aws.amazon.com/ec2/graviton/>
- <https://aws.amazon.com/ec2/spot/>
- <https://aws.amazon.com/ec2/pricing/on-demand/>
- <https://karpenter.sh/docs/concepts/nodepools/>
- <https://docs.aws.amazon.com/eks/latest/best-practices/karpenter.html>
- <https://milvus.io/docs/install_standalone-docker.md>
- <https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/>
