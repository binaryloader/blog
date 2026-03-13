---
title: "[Infra] Terraformモジュール構造とS3 Native State Locking"
ref: terraform-modules-s3-native-locking
excerpt: "Terraformモジュールベースのディレクトリ設計、S3 native state locking、GitHub Actions CI/CDパイプラインを整理する。"
date: 2026-03-02T12:50+09:00
last_modified_at: 2026-03-02T12:50+09:00
published: false
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/terraform-modules-s3-native-locking.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/terraform-modules-s3-native-locking.png"
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
    url: /ja/development/
  - title: "Server"
    url: /ja/development/server/
  - title: "Infra"
    url: /ja/development/server/infra/
---

# 概要

Terraformモジュールベースのディレクトリ設計、S3 native state locking、GitHub Actions CI/CDパイプラインを整理する。

# まとめ

## 1. Terraformを使用する理由

- インフラをコードで管理し再現性と変更追跡が可能である
- `terraform plan`で変更内容を事前検証できる
- リソース間の依存関係を自動解決する
- Remote Stateでチーム協業が可能である
- Infracostと連携するとPR段階でコスト変化を確認できる
- HelmプロバイダーでMilvusなどのKubernetesリソースも管理できる

## 2. ディレクトリ構造

modulesベースで共通リソースを抽象化し、environmentsディレクトリで環境別にモジュールを組み合わせる。

```
terraform/
├── bootstrap/              # Stateバックエンドプロビジョニング (1回)
│   ├── main.tf
│   └── variables.tf
├── modules/
│   ├── networking/          # VPC、Subnets、NAT GW、SG
│   ├── eks/                 # EKS + Node Groups
│   ├── kms/                 # KMSキー
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
└── .terraform-version       # tfenvバージョン固定
```

各モジュールは`variables.tf`、`outputs.tf`、`main.tf`で構成し、環境別の`terraform.tfvars`でモジュールパラメータをオーバーライドする。

## 3. S3 State管理

### 3.1. S3 Native Locking

Terraform 1.10+ではS3 native state locking(`use_lockfile = true`)をサポートする。DynamoDBを別途作成しなくてもS3のみでロックを管理できる。

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

`use_lockfile = true`はS3に`.terraform.lock.hcl`ファイルを作成して同時実行を防止する。従来のDynamoDBベースのロッキングはdeprecatedとなったため、新規プロジェクトではS3 native lockingを使用する。

### 3.2. Bootstrap

StateバックエンドのS3バケットはbootstrapフェーズで別途プロビジョニングする。

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

### 3.3. Stateファイル分離

Stateファイルは環境別、コンポーネント別に分離してblast radiusを縮小する。

```
my-project-terraform-state/
├── dev/terraform.tfstate
├── staging/terraform.tfstate
└── prod/terraform.tfstate
```

他の環境のStateを参照する必要がある場合は`terraform_remote_state`データソースを使用する。

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

## 4. 主要モジュール

### 4.1. networking

VPC、サブネット、NAT Gateway、Security Groupを管理する。

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

EKSクラスターとManaged Node Groupsを管理する。

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

HelmプロバイダーでEKSにMilvusをデプロイする。

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

### 5.1. OIDC認証

GitHub ActionsでOIDC認証によりAWSにアクセスする。Static credentials(Access Key)の代わりに一時的な認証情報を使用してセキュリティを強化する。

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

### 5.2. PRワークフロー — Plan

PR作成時に`terraform plan`を実行し結果をPRコメントに表示する。Infracostを連携するとコスト変化も一緒に確認できる。

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

### 5.3. Mainワークフロー — Apply

mainブランチにマージされると`terraform apply`を実行する。プロダクション環境は手動承認ゲートを追加する。

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

`environment: production`に設定するとGitHubで手動承認が要求される。

## 6. プロバイダーバージョン管理

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

## 7. コスト管理

InfracostをPR段階に連携するとインフラ変更のコスト影響を事前に確認できる。環境別にインスタンスサイズを差別化してコストを削減する。

| 項目 | dev | prod |
|---|---|---|
| EKSノード | t3.medium | m7i.large |
| MongoDB Atlas | M10 | M30 |
| NAT Gateway | 単一 | マルチAZ |

## 8. 実装順序

リソース間の依存関係を考慮した実装順序は以下の通りである。

1. bootstrap (S3 state bucket、KMS key)
2. networking (VPC、Subnet、Security Group)
3. eks (EKSクラスター + Node Groups)
4. secrets (Secrets Manager)
5. database (MongoDB Atlas)
6. messaging (MSK)
7. storage (S3)
8. milvus (Helm on EKS)
9. cdn (CloudFront + S3)
10. api-gateway (API Gateway)

# 参考

- <https://developer.hashicorp.com/terraform/language/backend/s3>
- <https://developer.hashicorp.com/terraform/tutorials/automation/github-actions>
- <https://docs.aws.amazon.com/prescriptive-guidance/latest/terraform-aws-provider-best-practices/structure.html>
- <https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest>
- <https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest>
- <https://www.infracost.io/docs/>
