---
title: "[Infra] S3 + CloudFrontでReact SPAをホスティングする"
ref: s3-cloudfront-react-spa-hosting
excerpt: "S3バケットにReact SPAをデプロイし、CloudFront OACで安全に配信する方法、キャッシュ戦略、ライフサイクルポリシーを整理する。"
date: 2026-03-02T12:30+09:00
last_modified_at: 2026-03-02T12:30+09:00
published: false
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/s3-cloudfront-react-spa-hosting.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/s3-cloudfront-react-spa-hosting.png"
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
    url: /ja/development/
  - title: "Server"
    url: /ja/development/server/
  - title: "Infra"
    url: /ja/development/server/infra/
---

# 概要

S3バケットにReact SPAをデプロイし、CloudFront OACで安全に配信する方法、キャッシュ戦略、ライフサイクルポリシーを整理する。

# まとめ

## 1. S3バケット用途

プロジェクトでS3を4つの用途で使用する。

| バケット | 用途 | バージョニング |
|---|---|---|
| `my-project-{env}-frontend` | React SPAビルド成果物 | 有効 |
| `my-project-terraform-state` | Terraform状態ファイル (S3 native locking) | 有効 |
| `my-project-{env}-documents` | 外部APIから収集した元データ | 有効 |
| `my-project-{env}-milvus` | MilvusベクトルDBオブジェクトストレージ | 無効 |

バケットネーミングは`{プロジェクト}-{環境}-{用途}`パターンを使用する。

## 2. CloudFront + S3静的ホスティング

### 2.1. OAC (Origin Access Control)

S3バケットはBlock All Public Accessで完全にブロックし、CloudFront OACを通じてのみアクセスを許可する。OACは従来のOAI(Origin Access Identity)に代わる最新方式で、SigV4署名を使用する。

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

### 2.2. SPAルーティング

React Routerのクライアントサイドルーティングのため、CloudFrontで403/404レスポンスを`index.html`にリダイレクトする。S3に存在しないパスへのリクエストは403(Access Denied)が返されるが、これを`index.html`に送る必要がありReact Routerが処理できるようにする。

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

### 2.3. カスタムドメイン + ACM

ACM証明書は必ず`us-east-1`リージョンで発行しなければCloudFrontに接続できない。Route53でCloudFrontディストリビューションをAliasレコードで接続する。

```hcl
resource "aws_acm_certificate" "frontend" {
  provider          = aws.us_east_1
  domain_name       = "app.example.com"
  validation_method = "DNS"
}
```

## 3. キャッシュ戦略

| ファイルタイプ | Cache-Control | TTL | 理由 |
|---|---|---|---|
| `index.html` | `no-cache`または`max-age=300` | 5分 | デプロイ時に即時反映が必要 |
| JS/CSS (ハッシュ付き) | `max-age=31536000, immutable` | 1年 | ファイル名にcontent hash含む |
| 画像、フォント | `max-age=86400` | 1日 | 変更頻度が低い |

Vite(またはWebpack)がビルド時に生成するcontent hash(例: `main.a1b2c3d4.js`)によりファイルが一意に識別されるため、ハッシュ付きファイルは1年キャッシュしても安全である。デプロイ時には`index.html`のみinvalidationすればよい。

```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/index.html"
```

Price Classは韓国ユーザー向けに`PriceClass_200`を選択する。`PriceClass_100`(米国/欧州のみ)よりアジアカバレッジが広く、`PriceClass_All`より安価である。

## 4. ライフサイクルポリシー

### 4.1. データバケット

データバケットにライフサイクルポリシーを適用してコストを削減する。

- 90日後にStandard → Standard-IAに移行 (~40%削減)
- 1年後にStandard-IA → Glacier Instant Retrievalに移行
- アクセス頻度の予測が難しい場合はS3 Intelligent-Tieringを検討する

### 4.2. Terraform Stateバケット

非現行バージョンを90日後に自動削除してバージョン履歴が無限に蓄積されるのを防止する。

### 4.3. フロントエンドバケット

以前のデプロイの非現行バージョンを30日後に削除する。最新ビルドのみ保持すればよいため短い周期を適用する。

## 5. バージョニングとバックアップ

フロントエンドバケットとTerraform Stateバケットはバージョニングを有効化し、誤って削除されたファイルを復元できるようにする。データバケットはCross-Region Replication(CRR)で災害復旧に備えることができる。

## 6. Milvusストレージ

MilvusのオブジェクトストレージをMinIOの代わりにS3で代替する。IRSA(IAM Roles for Service Accounts)を使用すればアクセスキーなしでS3にアクセスできるためセキュリティが強化される。

```yaml
milvus:
  storage:
    type: S3
    endpoint: s3.ap-northeast-2.amazonaws.com
    bucketName: my-project-prod-milvus
    useIAM: true
```

## 7. Terraform構成

S3 + CloudFront全体構成をTerraformで管理する。

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

## 8. コスト

| 項目 | 月額コスト |
|---|---|
| S3ストレージ (5GB) | ~$0.12 |
| S3リクエスト | ~$1 |
| CloudFront (50GB転送) | ~$5 |
| 合計推定 | ~$6/月 |

S3ライフサイクルポリシーとCloudFrontキャッシュを適切に設定すればコストを最小化できる。

# 参考

- <https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html>
- <https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/deploy-a-react-based-single-page-application-to-amazon-s3-and-cloudfront.html>
- <https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html>
- <https://milvus.io/docs/deploy_s3.md>
