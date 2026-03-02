---
title: "[Infra] S3 + CloudFront로 React SPA 호스팅하기"
ref: s3-cloudfront-react-spa-hosting
excerpt: "S3 버킷에 React SPA를 배포하고 CloudFront OAC로 안전하게 서빙하는 방법, 캐싱 전략, 수명 주기 정책을 정리한다."
date: 2026-03-02T12:30+09:00
last_modified_at: 2026-03-02T12:30+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/s3-cloudfront-react-spa-hosting.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/s3-cloudfront-react-spa-hosting.png"
categories:
  - Development
  - Server
  - Infra
tags:
  - AWS
  - S3
  - CloudFront
  - React
  - OAC
  - Terraform
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Server"
    url: /ko/development/server/
  - title: "Infra"
    url: /ko/development/server/infra/
---

# 개요

S3 버킷에 React SPA를 배포하고 CloudFront OAC로 안전하게 서빙하는 방법, 캐싱 전략, 수명 주기 정책을 정리한다.

# 정리

## 1. S3 버킷 용도

프로젝트에서 S3를 4가지 용도로 사용한다.

| 버킷 | 용도 | 버전 관리 |
|---|---|---|
| `my-project-{env}-frontend` | React SPA 빌드 산출물 | 활성화 |
| `my-project-terraform-state` | Terraform 상태 파일 (S3 native locking) | 활성화 |
| `my-project-{env}-documents` | 외부 API에서 수집한 원본 데이터 | 활성화 |
| `my-project-{env}-milvus` | Milvus 벡터 DB 오브젝트 스토리지 | 비활성화 |

버킷 네이밍은 `{프로젝트}-{환경}-{용도}` 패턴을 사용한다.

## 2. CloudFront + S3 정적 호스팅

### 2.1. OAC (Origin Access Control)

S3 버킷은 Block All Public Access로 완전히 차단하고 CloudFront OAC를 통해서만 접근을 허용한다. OAC는 기존 OAI(Origin Access Identity)를 대체하는 최신 방식으로 SigV4 서명을 사용한다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAC",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-project-prod-frontend/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::123456789012:distribution/EDFDVBD6EXAMPLE"
        }
      }
    }
  ]
}
```

### 2.2. SPA 라우팅

React Router 클라이언트 사이드 라우팅을 위해 CloudFront에서 403/404 응답을 `index.html`로 리다이렉트한다. S3에 존재하지 않는 경로로 요청이 오면 403(Access Denied)이 반환되는데 이를 `index.html`로 보내야 React Router가 처리할 수 있다.

```hcl
custom_error_response {
  error_code         = 403
  response_code      = 200
  response_page_path = "/index.html"
}

custom_error_response {
  error_code         = 404
  response_code      = 200
  response_page_path = "/index.html"
}
```

### 2.3. 커스텀 도메인 + ACM

ACM 인증서는 반드시 `us-east-1` 리전에서 발급해야 CloudFront에 연결할 수 있다. Route53에서 CloudFront 배포를 Alias 레코드로 연결한다.

```hcl
resource "aws_acm_certificate" "frontend" {
  provider          = aws.us_east_1
  domain_name       = "app.example.com"
  validation_method = "DNS"
}
```

## 3. 캐싱 전략

| 파일 유형 | Cache-Control | TTL | 이유 |
|---|---|---|---|
| `index.html` | `no-cache` 또는 `max-age=300` | 5분 | 배포 시 즉시 반영 필요 |
| JS/CSS (해시 포함) | `max-age=31536000, immutable` | 1년 | 파일명에 content hash 포함 |
| 이미지, 폰트 | `max-age=86400` | 1일 | 변경 빈도 낮음 |

Vite(또는 Webpack)가 빌드 시 생성하는 content hash(예: `main.a1b2c3d4.js`)로 파일이 고유하게 식별되므로 해시가 포함된 파일은 1년 캐싱해도 안전하다. 배포 시에는 `index.html`만 invalidation하면 된다.

```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/index.html"
```

Price Class는 한국 사용자 대상으로 `PriceClass_200`을 선택한다. `PriceClass_100`(미국/유럽만)보다 아시아 커버리지가 넓고 `PriceClass_All`보다 저렴하다.

## 4. 수명 주기 정책

### 4.1. 데이터 버킷

데이터 버킷에 수명 주기 정책을 적용해 비용을 절감한다.

- 90일 후 Standard → Standard-IA로 전환 (~40% 절감)
- 1년 후 Standard-IA → Glacier Instant Retrieval로 전환
- 접근 빈도를 예측하기 어려운 경우 S3 Intelligent-Tiering을 고려한다

### 4.2. Terraform State 버킷

비현재 버전을 90일 후 자동 정리해 버전 이력이 무한히 쌓이는 것을 방지한다.

### 4.3. 프론트엔드 버킷

이전 배포의 비현재 버전을 30일 후 삭제한다. 최신 빌드만 유지하면 되므로 짧은 주기를 적용한다.

## 5. 버전 관리와 백업

프론트엔드 버킷과 Terraform State 버킷은 버전 관리를 활성화해 실수로 삭제된 파일을 복구할 수 있도록 한다. 데이터 버킷은 Cross-Region Replication(CRR)으로 재해 복구에 대비할 수 있다.

## 6. Milvus 스토리지

Milvus의 오브젝트 스토리지를 MinIO 대신 S3로 대체한다. IRSA(IAM Roles for Service Accounts)를 사용하면 액세스 키 없이 S3에 접근할 수 있어 보안이 강화된다.

```yaml
milvus:
  storage:
    type: S3
    endpoint: s3.ap-northeast-2.amazonaws.com
    bucketName: my-project-prod-milvus
    useIAM: true
```

## 7. Terraform 구성

S3 + CloudFront 전체 구성을 Terraform으로 관리한다.

```hcl
resource "aws_s3_bucket" "frontend" {
  bucket = "my-project-${var.environment}-frontend"
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "frontend-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = ["app.example.com"]
  price_class         = "PriceClass_200"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-frontend"

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-frontend"

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.frontend.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
```

## 8. 비용

| 항목 | 월 비용 |
|---|---|
| S3 스토리지 (5GB) | ~$0.12 |
| S3 요청 | ~$1 |
| CloudFront (50GB 전송) | ~$5 |
| 총 추정 | ~$6/월 |

S3 수명 주기 정책과 CloudFront 캐싱을 적절히 설정하면 비용을 최소화할 수 있다.

# 참고

- <https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html>
- <https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/deploy-a-react-based-single-page-application-to-amazon-s3-and-cloudfront.html>
- <https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html>
- <https://milvus.io/docs/deploy_s3.md>
