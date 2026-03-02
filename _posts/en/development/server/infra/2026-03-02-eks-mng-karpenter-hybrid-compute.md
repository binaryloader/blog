---
title: "[Infra] EKS MNG + Karpenter Hybrid Compute Strategy"
ref: eks-mng-karpenter-hybrid-compute
lang: en
permalink: /en/:categories/:title/
excerpt: "Compare EKS compute options (MNG, Fargate, Karpenter) and outline a hybrid strategy that combines MNG for stateful services with Karpenter for stateless services."
date: 2026-03-02T12:00+09:00
last_modified_at: 2026-03-02T12:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/eks-mng-karpenter-hybrid-compute.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/eks-mng-karpenter-hybrid-compute.png"
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
    url: /en/development/
  - title: "Server"
    url: /en/development/server/
  - title: "Infra"
    url: /en/development/server/infra/
---

# Overview

Compare EKS compute options (MNG, Fargate, Karpenter) and outline a hybrid strategy that combines MNG for stateful services with Karpenter for stateless services.

# Summary

## 1. EKS Compute Option Comparison

Amazon EKS (Elastic Kubernetes Service) is a fully managed Kubernetes service where AWS manages the control plane (API server, etcd, etc.). There is a fixed control plane cost of $0.10/hour per cluster, and worker nodes are billed at standard EC2 On-Demand/Spot rates.

### 1.1. Managed Node Groups (MNG)

This is the most general-purpose option where AWS manages EC2 Auto Scaling Groups.

- Provides predictable costs and supports all Kubernetes features
- DaemonSet execution is possible and Spot instances can be mixed in
- Scaling speed is slower compared to Karpenter and instance types must be fixed at node group creation time
- Suitable for stateful services like Kafka and Milvus

### 1.2. AWS Fargate

A serverless option that allocates compute per Pod without EC2 nodes.

- No node management required and security is enhanced through automatic isolation
- Does not support DaemonSets, Persistent Volumes are limited to EFS only, and cold starts exist
- Suitable for the Karpenter controller itself or simple batch jobs

### 1.3. Karpenter

An open-source autoscaler that detects Pod scheduling requests in real time and provisions optimal EC2 instances within seconds.

- Supports multiple instance types simultaneously and enables Spot integration
- Faster response time compared to Cluster Autoscaler with built-in cost optimization
- Initial setup is complex and NodePool design is required when running alongside MNG
- Suitable for API servers and worker processes with high traffic variability

### 1.4. EKS Auto Mode

A fully automated mode based on Karpenter that became GA in 2024, delegating node management entirely. SSH access is not available and customization is limited, so it is not yet suitable for projects requiring fine-grained control.

## 2. Hybrid Configuration — MNG + Karpenter

A hybrid configuration combining MNG and Karpenter was chosen based on workload characteristics.

| Component | Placement | Reason |
|---|---|---|
| Karpenter Controller | Fargate or small On-Demand MNG | Prevents circular dependency |
| Kafka, Milvus | On-Demand MNG (r7i/m7i family) | Stateful, requires PVC |
| AI API (FastAPI + workers) | Karpenter Spot | High traffic variability |
| Service API, Observation API | Karpenter On-Demand/Spot mix | Balance between availability and cost |
| Web Client | Karpenter Spot | Stateless, easy horizontal scaling |

If the Karpenter controller runs on nodes it provisions itself, a circular dependency occurs. It must be placed on a separate MNG or Fargate.

## 3. Node Group Design

```
MNG - system (On-Demand)
  Instances: m7i.large x 2 (multi-AZ)
  Purpose: CoreDNS, kube-proxy, AWS LBC, Karpenter, monitoring

MNG - stateful (On-Demand)
  Instances: r7i.xlarge x 2 (multi-AZ)
  Purpose: Milvus, Kafka
  StorageClass: gp3 (ebs.csi.aws.com)

Karpenter NodePool - app-spot
  Instance families: m7i, m7i-flex, m6i, c7i, c6i + Spot
  Purpose: AI API, Service API, Observation API, Web Client

Karpenter NodePool - app-ondemand
  Instance families: m7i, m7i-flex, m6i
  Purpose: Some replicas of services requiring high availability
```

Karpenter NodePool automatically scales down idle nodes with `consolidationPolicy: WhenUnderutilized`.

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

## 4. Network Design

```
VPC CIDR: 10.0.0.0/16

Public Subnets (NAT GW, ALB)
  ap-northeast-2a: 10.0.1.0/24
  ap-northeast-2b: 10.0.2.0/24
  ap-northeast-2c: 10.0.3.0/24

Private Subnets (Worker Nodes, Pods)
  ap-northeast-2a: 10.0.11.0/24
  ap-northeast-2b: 10.0.12.0/24
  ap-northeast-2c: 10.0.13.0/24

DB Isolated Subnets
  ap-northeast-2a: 10.0.21.0/24
  ap-northeast-2b: 10.0.22.0/24
  ap-northeast-2c: 10.0.23.0/24
```

Subnet tags `kubernetes.io/role/elb: "1"` (public) and `kubernetes.io/role/internal-elb: "1"` (private) are set so that ALB and Karpenter can identify the correct subnets. For large-scale clusters where Pod IPs may become insufficient, VPC CNI prefix delegation can be enabled to increase the number of allocatable IPs per node.

## 5. Auto-scaling Strategy

### 5.1. HPA (Horizontal Pod Autoscaler)

CPU/memory-based horizontal scaling applied to Service API, Observation API, and Web Client.

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

### 5.2. KEDA (Kafka Event-Driven)

Scales AI API workers based on Kafka consumer lag.

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

Applied with `UpdateMode: "Off"` to services like Milvus QueryNode where memory prediction is difficult, collecting right-sizing data. Requests are manually adjusted based on the recommended values.

### 5.4. Karpenter Cluster-Level Scaling

Karpenter dynamically provisions nodes based on Pod requests and automatically scales down idle nodes with `consolidationPolicy: WhenUnderutilized`. When HPA/KEDA increases the number of Pods, Karpenter adds nodes, and when Pods decrease, it cleans up nodes, completing a two-stage scaling system.

## 6. Ingress Design

AWS Load Balancer Controller (ALB) is used to handle external traffic. A single ALB is shared across namespaces using `alb.ingress.kubernetes.io/group.name`.

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

ACM certificates are automatically integrated, so cert-manager is not needed.

## 7. Milvus on EKS

Milvus Operator manages the full stack lifecycle. Amazon S3 is used as object storage instead of MinIO, reducing PVC management, HA configuration, and backup complexity.

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

IRSA allows access to S3 without access keys. The main Milvus components (QueryNode, DataNode, IndexNode) are placed on stateful MNG with node affinity, and anti-affinity ensures distribution across AZs.

## 8. Cost Optimization

Combining Spot instances with Karpenter automatic scale-down can achieve 60-70% cost savings compared to On-Demand.

| Instance Type | Purpose | Price Reference |
|---|---|---|
| m7i-flex.large | General-purpose API server | ~5% cheaper than m7i |
| r7i.xlarge | Memory-intensive (Milvus, Kafka) | Memory optimized |
| c7i.large | CPU-intensive (AI inference) | Compute optimized |

```
EKS Control Plane:              $73
system MNG (m7i.large x 2):     $147
stateful MNG (r7i.xlarge x 2):  $393
Karpenter Spot nodes (avg 4):   ~$120
ALB (1):                        $18
NAT Gateway:                    $45
EBS (gp3 2TB):                  $160
Estimated total:                ~$956/month
```

# References

- <https://aws.amazon.com/blogs/compute/cost-optimization-and-resilience-eks-with-spot-instances/>
- <https://aws.amazon.com/blogs/containers/a-deeper-look-at-ingress-sharing-and-target-group-binding-in-aws-load-balancer-controller/>
- <https://aws.github.io/aws-eks-best-practices/networking/subnets/>
- <https://docs.aws.amazon.com/eks/latest/best-practices/karpenter.html>
- <https://karpenter.sh/docs/concepts/nodepools/>
- <https://keda.sh/docs/2.16/scalers/apache-kafka/>
- <https://milvus.io/docs/deploy_s3.md>
- <https://milvus.io/docs/eks.md>
