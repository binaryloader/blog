---
title: "[Infra] Terraform 모듈 구조와 S3 Native State Locking"
ref: terraform-modules-s3-native-locking
excerpt: "Terraform 모듈 기반 디렉토리 설계, S3 native state locking, GitHub Actions CI/CD 파이프라인을 정리한다."
date: 2026-03-02T12:50+09:00
last_modified_at: 2026-03-02T12:50+09:00
published: false
header:
  overlay_image: "/assets/image/thumbnail/header/terraform-modules-s3-native-locking.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/terraform-modules-s3-native-locking.png"
categories:
  - Development
  - Server
  - Infra
tags:
  - Terraform
  - AWS
  - S3
  - GitHub Actions
  - Infracost
  - IaC
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Server"
    url: /ko/development/server/
  - title: "Infra"
    url: /ko/development/server/infra/
---

# 개요

Terraform 모듈 기반 디렉토리 설계, S3 native state locking, GitHub Actions CI/CD 파이프라인을 정리한다.

# 정리

## 1. Terraform을 사용하는 이유

- 인프라를 코드로 관리해 재현성과 변경 추적이 가능하다
- `terraform plan`으로 변경 사항을 사전 검증할 수 있다
- 리소스 간 의존성을 자동 해결한다
- Remote State로 팀 협업이 가능하다
- Infracost와 연동하면 PR 단계에서 비용 변화를 확인할 수 있다
- Helm 프로바이더로 Milvus 같은 Kubernetes 리소스도 관리할 수 있다

## 2. 디렉토리 구조

modules 기반으로 공통 리소스를 추상화하고 environments 디렉토리에서 환경별로 모듈을 조합한다.

```
terraform/
├── bootstrap/              # State backend 프로비저닝 (1회)
│   ├── main.tf
│   └── variables.tf
├── modules/
│   ├── networking/          # VPC, Subnets, NAT GW, SG
│   ├── eks/                 # EKS + Node Groups
│   ├── kms/                 # KMS 키
│   ├── secrets/             # Secrets Manager
│   ├── database/            # MongoDB Atlas
│   ├── messaging/           # MSK (Kafka)
│   ├── storage/             # S3
│   ├── cdn/                 # CloudFront + S3 Origin
│   ├── api-gateway/         # API Gateway
│   └── milvus/              # Helm release on EKS
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   └── prod/
└── .terraform-version       # tfenv 버전 고정
```

각 모듈은 `variables.tf`, `outputs.tf`, `main.tf`로 구성하고 환경별 `terraform.tfvars`에서 모듈 파라미터를 오버라이드한다.

## 3. S3 State 관리

### 3.1. S3 Native Locking

Terraform 1.10+에서는 S3 native state locking(`use_lockfile = true`)을 지원한다. DynamoDB를 별도로 생성하지 않아도 S3만으로 락을 관리할 수 있다.

```hcl
terraform {
  backend "s3" {
    bucket       = "my-project-terraform-state"
    key          = "dev/terraform.tfstate"
    region       = "ap-northeast-2"
    use_lockfile = true
    encrypt      = true
  }
}
```

`use_lockfile = true`는 S3에 `.terraform.lock.hcl` 파일을 생성해 동시 실행을 방지한다. 기존 DynamoDB 기반 락킹은 deprecated되었으므로 신규 프로젝트에서는 S3 native locking을 사용한다.

### 3.2. Bootstrap

State backend용 S3 버킷은 bootstrap 단계에서 별도로 프로비저닝한다.

```hcl
resource "aws_s3_bucket" "terraform_state" {
  bucket = "my-project-terraform-state"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.terraform.arn
    }
  }
}
```

### 3.3. State 파일 분리

State 파일은 환경별, 컴포넌트별로 분리해 blast radius를 줄인다.

```
my-project-terraform-state/
├── dev/terraform.tfstate
├── staging/terraform.tfstate
└── prod/terraform.tfstate
```

다른 환경의 State를 참조해야 할 때는 `terraform_remote_state` 데이터 소스를 사용한다.

```hcl
data "terraform_remote_state" "networking" {
  backend = "s3"

  config = {
    bucket = "my-project-terraform-state"
    key    = "${var.environment}/networking/terraform.tfstate"
    region = "ap-northeast-2"
  }
}
```

## 4. 주요 모듈

### 4.1. networking

VPC, 서브넷, NAT Gateway, Security Group을 관리한다.

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "my-project-${var.environment}"
  cidr = "10.0.0.0/16"

  azs             = ["ap-northeast-2a", "ap-northeast-2b", "ap-northeast-2c"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment == "dev"
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"            = "1"
    "karpenter.sh/discovery" = "my-project-${var.environment}"
  }
}
```

### 4.2. eks

EKS 클러스터와 Managed Node Groups를 관리한다.

```hcl
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "my-project-${var.environment}"
  cluster_version = "1.31"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    system = {
      instance_types = ["m7i.large"]
      min_size       = 2
      max_size       = 3
      desired_size   = 2
    }
    stateful = {
      instance_types = ["r7i.xlarge"]
      min_size       = 2
      max_size       = 4
      desired_size   = 2

      taints = [{
        key    = "workload"
        value  = "stateful"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}
```

### 4.3. milvus

Helm 프로바이더로 EKS에 Milvus를 배포한다.

```hcl
resource "helm_release" "milvus_operator" {
  name       = "milvus-operator"
  repository = "https://zilliztech.github.io/milvus-operator"
  chart      = "milvus-operator"
  namespace  = "milvus"

  create_namespace = true
}
```

## 5. CI/CD — GitHub Actions

### 5.1. OIDC 인증

GitHub Actions에서 OIDC 인증으로 AWS에 접근한다. Static credentials(Access Key) 대신 임시 자격증명을 사용해 보안을 강화한다.

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/github-actions-terraform
      aws-region: ap-northeast-2
```

### 5.2. PR 워크플로우 — Plan

PR 생성 시 `terraform plan`을 실행하고 결과를 PR 코멘트에 표시한다. Infracost를 연동하면 비용 변화도 함께 확인할 수 있다.

```yaml
name: Terraform Plan
on:
  pull_request:
    paths:
      - 'terraform/**'

jobs:
  plan:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging]

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.10.0"

      - name: Terraform Init
        run: terraform init
        working-directory: terraform/environments/${{ matrix.environment }}

      - name: Terraform Plan
        run: terraform plan -out=tfplan
        working-directory: terraform/environments/${{ matrix.environment }}

      - name: Infracost
        uses: infracost/actions/setup@v3
        with:
          api-key: ${{ secrets.INFRACOST_API_KEY }}
```

### 5.3. Main 워크플로우 — Apply

main 브랜치에 머지되면 `terraform apply`를 실행한다. 프로덕션 환경은 수동 승인 게이트를 추가한다.

```yaml
name: Terraform Apply
on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'

jobs:
  apply:
    runs-on: ubuntu-latest
    environment: production
    concurrency:
      group: terraform-apply
      cancel-in-progress: false

    steps:
      - uses: actions/checkout@v4

      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: terraform/environments/prod
```

`environment: production`으로 설정하면 GitHub에서 수동 승인을 요구한다.

## 6. 프로바이더 버전 관리

```hcl
terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.35"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.17"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.21"
    }
  }
}
```

## 7. 비용 관리

Infracost를 PR 단계에 연동하면 인프라 변경의 비용 영향을 사전에 확인할 수 있다. 환경별로 인스턴스 크기를 차등 적용해 비용을 절감한다.

| 항목 | dev | prod |
|---|---|---|
| EKS 노드 | t3.medium | m7i.large |
| MongoDB Atlas | M10 | M30 |
| NAT Gateway | 단일 | 멀티 AZ |

## 8. 구현 순서

리소스 간 의존성을 고려한 구현 순서는 아래와 같다.

1. bootstrap (S3 state bucket, KMS key)
2. networking (VPC, Subnet, Security Group)
3. eks (EKS 클러스터 + Node Groups)
4. secrets (Secrets Manager)
5. database (MongoDB Atlas)
6. messaging (MSK)
7. storage (S3)
8. milvus (Helm on EKS)
9. cdn (CloudFront + S3)
10. api-gateway (API Gateway)

# 참고

- <https://developer.hashicorp.com/terraform/language/backend/s3>
- <https://developer.hashicorp.com/terraform/tutorials/automation/github-actions>
- <https://docs.aws.amazon.com/prescriptive-guidance/latest/terraform-aws-provider-best-practices/structure.html>
- <https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest>
- <https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest>
- <https://www.infracost.io/docs/>
