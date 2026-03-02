---
title: "[Infra] Terraform Module Structure and S3 Native State Locking"
ref: terraform-modules-s3-native-locking
lang: en
permalink: /en/:categories/:title/
excerpt: "Cover Terraform module-based directory design, S3 native state locking, and GitHub Actions CI/CD pipeline."
date: 2026-03-02T12:50+09:00
last_modified_at: 2026-03-02T12:50+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/terraform-modules-s3-native-locking.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/terraform-modules-s3-native-locking.png"
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
    url: /en/development/
  - title: "Server"
    url: /en/development/server/
  - title: "Infra"
    url: /en/development/server/infra/
---

# Overview

Cover Terraform module-based directory design, S3 native state locking, and GitHub Actions CI/CD pipeline.

# Summary

## 1. Why Terraform

- Manage infrastructure as code for reproducibility and change tracking
- Preview changes with `terraform plan` before applying
- Automatically resolves dependencies between resources
- Remote State enables team collaboration
- Infracost integration allows reviewing cost changes at the PR stage
- Helm provider can manage Kubernetes resources like Milvus

## 2. Directory Structure

Common resources are abstracted into modules, and the environments directory combines modules per environment.

```
terraform/
├── bootstrap/              # State backend provisioning (one-time)
│   ├── main.tf
│   └── variables.tf
├── modules/
│   ├── networking/          # VPC, Subnets, NAT GW, SG
│   ├── eks/                 # EKS + Node Groups
│   ├── kms/                 # KMS Keys
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
└── .terraform-version       # tfenv version pinning
```

Each module consists of `variables.tf`, `outputs.tf`, and `main.tf`, with module parameters overridden in the per-environment `terraform.tfvars`.

## 3. S3 State Management

### 3.1. S3 Native Locking

Terraform 1.10+ supports S3 native state locking (`use_lockfile = true`). Locks can be managed with S3 alone without creating a separate DynamoDB table.

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

`use_lockfile = true` creates a `.terraform.lock.hcl` file in S3 to prevent concurrent execution. The legacy DynamoDB-based locking has been deprecated, so S3 native locking should be used for new projects.

### 3.2. Bootstrap

The S3 bucket for the state backend is provisioned separately in the bootstrap stage.

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

### 3.3. State File Separation

State files are separated by environment and component to reduce the blast radius.

```
my-project-terraform-state/
├── dev/terraform.tfstate
├── staging/terraform.tfstate
└── prod/terraform.tfstate
```

When referencing state from another environment, use the `terraform_remote_state` data source.

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

## 4. Key Modules

### 4.1. networking

Manages VPC, subnets, NAT Gateway, and Security Groups.

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

Manages the EKS cluster and Managed Node Groups.

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

Deploys Milvus to EKS using the Helm provider.

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

### 5.1. OIDC Authentication

GitHub Actions accesses AWS using OIDC authentication. This enhances security by using temporary credentials instead of static credentials (Access Keys).

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

### 5.2. PR Workflow — Plan

When a PR is created, `terraform plan` is executed and the results are displayed as a PR comment. Infracost integration also allows reviewing cost changes.

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

### 5.3. Main Workflow — Apply

When merged to the main branch, `terraform apply` is executed. A manual approval gate is added for the production environment.

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

Setting `environment: production` requires manual approval in GitHub.

## 6. Provider Version Management

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

## 7. Cost Management

Integrating Infracost at the PR stage allows previewing the cost impact of infrastructure changes. Costs are reduced by applying different instance sizes per environment.

| Item | dev | prod |
|---|---|---|
| EKS Nodes | t3.medium | m7i.large |
| MongoDB Atlas | M10 | M30 |
| NAT Gateway | Single | Multi-AZ |

## 8. Implementation Order

The implementation order considering resource dependencies is as follows.

1. bootstrap (S3 state bucket, KMS key)
2. networking (VPC, Subnet, Security Group)
3. eks (EKS cluster + Node Groups)
4. secrets (Secrets Manager)
5. database (MongoDB Atlas)
6. messaging (MSK)
7. storage (S3)
8. milvus (Helm on EKS)
9. cdn (CloudFront + S3)
10. api-gateway (API Gateway)

# References

- <https://developer.hashicorp.com/terraform/language/backend/s3>
- <https://developer.hashicorp.com/terraform/tutorials/automation/github-actions>
- <https://docs.aws.amazon.com/prescriptive-guidance/latest/terraform-aws-provider-best-practices/structure.html>
- <https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest>
- <https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest>
- <https://www.infracost.io/docs/>
