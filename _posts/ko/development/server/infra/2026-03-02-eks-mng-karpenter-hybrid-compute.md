---
title: "[Infra] EKS MNG + Karpenter 하이브리드 컴퓨트 전략"
ref: eks-mng-karpenter-hybrid-compute
excerpt: "EKS의 컴퓨트 옵션(MNG, Fargate, Karpenter)을 비교하고 stateful 서비스에는 MNG, stateless 서비스에는 Karpenter를 조합하는 하이브리드 전략을 정리한다."
date: 2026-03-02T12:00+09:00
last_modified_at: 2026-03-02T12:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/eks-mng-karpenter-hybrid-compute.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/eks-mng-karpenter-hybrid-compute.png"
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
    url: /ko/development/
  - title: "Server"
    url: /ko/development/server/
  - title: "Infra"
    url: /ko/development/server/infra/
---

# 개요

EKS의 컴퓨트 옵션(MNG, Fargate, Karpenter)을 비교하고 stateful 서비스에는 MNG, stateless 서비스에는 Karpenter를 조합하는 하이브리드 전략을 정리한다.

# 정리

## 1. EKS 컴퓨트 옵션 비교

Amazon EKS(Elastic Kubernetes Service)는 컨트롤 플레인(API 서버, etcd 등)을 AWS가 관리하는 완전 관리형 Kubernetes 서비스다. 클러스터당 $0.10/시간의 컨트롤 플레인 고정 비용이 발생하며 워커 노드는 EC2 On-Demand/Spot 요금이 그대로 적용된다.

### 1.1. Managed Node Groups (MNG)

AWS가 EC2 Auto Scaling Group을 관리하는 방식으로 가장 범용적인 옵션이다.

- 예측 가능한 비용과 모든 Kubernetes 기능을 지원한다
- DaemonSet 실행이 가능하고 Spot 인스턴스를 혼합할 수 있다
- 스케일링 속도가 Karpenter 대비 느리고 인스턴스 타입을 노드 그룹 생성 시 고정해야 한다
- Kafka, Milvus 같은 stateful 서비스에 적합하다

### 1.2. AWS Fargate

EC2 노드 없이 Pod 단위로 컴퓨트를 할당하는 서버리스 옵션이다.

- 노드 관리가 불필요하고 자동 격리로 보안이 강화된다
- DaemonSet을 지원하지 않고 Persistent Volume이 EFS만 가능하며 콜드 스타트가 존재한다
- Karpenter 컨트롤러 자체나 단순 배치 작업에 적합하다

### 1.3. Karpenter

Pod 스케줄링 요청을 실시간으로 감지해 최적 EC2 인스턴스를 수 초 내에 프로비저닝하는 오픈소스 오토스케일러다.

- 다양한 인스턴스 타입을 동시 지원하고 Spot 통합이 가능하다
- Cluster Autoscaler 대비 반응 속도가 빠르고 비용 최적화가 내장되어 있다
- 초기 설정이 복잡하며 MNG와 동시 운영 시 NodePool 설계가 필요하다
- 트래픽 변동이 큰 API 서버, 워커 프로세스에 적합하다

### 1.4. EKS Auto Mode

2024년 GA된 Karpenter 기반 완전 자동화 모드로 노드 관리를 완전히 위임한다. SSH 접근이 불가하고 커스터마이징이 제한적이므로 세밀한 제어가 필요한 프로젝트에는 아직 적합하지 않다.

## 2. 하이브리드 구성 — MNG + Karpenter

워크로드의 특성에 따라 MNG와 Karpenter를 조합하는 하이브리드 구성을 선택했다.

| 구성 요소 | 배치 방식 | 이유 |
|---|---|---|
| Karpenter 컨트롤러 | Fargate 또는 소형 On-Demand MNG | 순환 의존 문제 방지 |
| Kafka, Milvus | On-Demand MNG (r7i/m7i 계열) | Stateful, PVC 필요 |
| AI API (FastAPI + workers) | Karpenter Spot | 트래픽 변동이 큼 |
| Service API, Observation API | Karpenter On-Demand/Spot 혼합 | 가용성과 비용 균형 |
| Web Client | Karpenter Spot | Stateless, 수평 확장 용이 |

Karpenter 컨트롤러는 자기 자신이 프로비저닝하는 노드에서 실행되면 순환 의존이 발생한다. 별도 MNG나 Fargate에 배치해야 한다.

## 3. 노드 그룹 설계

```
MNG - system (On-Demand)
  인스턴스: m7i.large × 2 (멀티 AZ)
  용도: CoreDNS, kube-proxy, AWS LBC, Karpenter, 모니터링

MNG - stateful (On-Demand)
  인스턴스: r7i.xlarge × 2 (멀티 AZ)
  용도: Milvus, Kafka
  StorageClass: gp3 (ebs.csi.aws.com)

Karpenter NodePool - app-spot
  인스턴스 패밀리: m7i, m7i-flex, m6i, c7i, c6i + Spot
  용도: AI API, Service API, Observation API, Web Client

Karpenter NodePool - app-ondemand
  인스턴스 패밀리: m7i, m7i-flex, m6i
  용도: 가용성이 중요한 서비스의 일부 레플리카
```

Karpenter NodePool은 `consolidationPolicy: WhenUnderutilized`로 유휴 노드를 자동 축소한다.

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

## 4. 네트워크 설계

```
VPC CIDR: 10.0.0.0/16

퍼블릭 서브넷 (NAT GW, ALB)
  ap-northeast-2a: 10.0.1.0/24
  ap-northeast-2b: 10.0.2.0/24
  ap-northeast-2c: 10.0.3.0/24

프라이빗 서브넷 (워커 노드, Pod)
  ap-northeast-2a: 10.0.11.0/24
  ap-northeast-2b: 10.0.12.0/24
  ap-northeast-2c: 10.0.13.0/24

DB 전용 격리 서브넷
  ap-northeast-2a: 10.0.21.0/24
  ap-northeast-2b: 10.0.22.0/24
  ap-northeast-2c: 10.0.23.0/24
```

서브넷 태그로 `kubernetes.io/role/elb: "1"` (퍼블릭)과 `kubernetes.io/role/internal-elb: "1"` (프라이빗)을 설정해 ALB와 Karpenter가 올바른 서브넷을 인식하도록 한다. Pod IP가 부족해질 수 있는 대규모 클러스터에서는 VPC CNI prefix delegation을 활성화해 노드당 할당 가능한 IP 수를 늘릴 수 있다.

## 5. Auto-scaling 전략

### 5.1. HPA (Horizontal Pod Autoscaler)

CPU/메모리 기반 수평 확장으로 Service API, Observation API, Web Client에 적용한다.

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

### 5.2. KEDA (Kafka 이벤트 기반)

Kafka consumer lag 기반으로 AI API 워커를 스케일링한다.

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

Milvus QueryNode처럼 메모리 예측이 어려운 서비스에 `UpdateMode: "Off"`로 적용해 right-sizing 데이터를 수집한다. 추천값을 기반으로 requests를 수동 조정하는 방식으로 사용한다.

### 5.4. Karpenter 클러스터 레벨 스케일링

Karpenter는 Pod 요청에 따라 노드를 동적으로 프로비저닝하고 `consolidationPolicy: WhenUnderutilized`로 유휴 노드를 자동 축소한다. HPA/KEDA가 Pod 수를 늘리면 Karpenter가 노드를 추가하고 Pod가 줄어들면 노드를 정리하는 2단계 스케일링이 완성된다.

## 6. Ingress 설계

AWS Load Balancer Controller(ALB)를 사용해 외부 트래픽을 처리한다. `alb.ingress.kubernetes.io/group.name`으로 네임스페이스 간 ALB 1개를 공유한다.

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

ACM 인증서를 자동 통합하므로 cert-manager가 필요 없다.

## 7. Milvus on EKS

Milvus Operator로 전체 스택 라이프사이클을 관리한다. MinIO 대신 Amazon S3를 오브젝트 스토리지로 사용해 PVC 관리, HA 설정, 백업 복잡도를 줄인다.

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

IRSA를 사용하면 액세스 키 없이 S3에 접근할 수 있다. Milvus의 주요 컴포넌트(QueryNode, DataNode, IndexNode)는 stateful MNG에 node affinity로 배치하고 anti-affinity로 AZ 간 분산을 보장한다.

## 8. 비용 최적화

Spot 인스턴스와 Karpenter 자동 축소를 결합하면 On-Demand 대비 60-70%의 비용 절감이 가능하다.

| 인스턴스 타입 | 용도 | 가격 참고 |
|---|---|---|
| m7i-flex.large | 범용 API 서버 | m7i 대비 약 5% 저렴 |
| r7i.xlarge | 메모리 집약 (Milvus, Kafka) | 메모리 최적화 |
| c7i.large | CPU 집약 (AI 추론) | 컴퓨팅 최적화 |

```
EKS 컨트롤 플레인:             $73
system MNG (m7i.large × 2):    $147
stateful MNG (r7i.xlarge × 2): $393
Karpenter Spot 노드 (평균 4대): ~$120
ALB (1개):                     $18
NAT Gateway:                   $45
EBS (gp3 2TB):                 $160
총 추정:                       ~$956/월
```

# 참고

- <https://aws.amazon.com/blogs/compute/cost-optimization-and-resilience-eks-with-spot-instances/>
- <https://aws.amazon.com/blogs/containers/a-deeper-look-at-ingress-sharing-and-target-group-binding-in-aws-load-balancer-controller/>
- <https://aws.github.io/aws-eks-best-practices/networking/subnets/>
- <https://docs.aws.amazon.com/eks/latest/best-practices/karpenter.html>
- <https://karpenter.sh/docs/concepts/nodepools/>
- <https://keda.sh/docs/2.16/scalers/apache-kafka/>
- <https://milvus.io/docs/deploy_s3.md>
- <https://milvus.io/docs/eks.md>
