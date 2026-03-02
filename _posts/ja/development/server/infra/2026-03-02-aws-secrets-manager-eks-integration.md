---
title: "[Infra] AWS Secrets ManagerとEKS連携ガイド"
ref: aws-secrets-manager-eks-integration
excerpt: "AWS Secrets Managerのシークレット管理、KMS暗号化、自動ローテーションを設定し、External Secrets Operator(ESO)でEKSに連携する方法を整理する。"
date: 2026-03-02T12:10+09:00
last_modified_at: 2026-03-02T12:10+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/aws-secrets-manager-eks-integration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/aws-secrets-manager-eks-integration.png"
categories:
  - Development
  - Server
  - Infra
tags:
  - AWS
  - Secrets Manager
  - EKS
  - ESO
  - KMS
  - IRSA
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Server"
    url: /ja/development/server/
  - title: "Infra"
    url: /ja/development/server/infra/
---

# 概要

AWS Secrets Managerのシークレット管理、KMS暗号化、自動ローテーションを設定し、External Secrets Operator(ESO)でEKSに連携する方法を整理する。

# まとめ

## 1. シークレット管理サービス比較

| 項目 | Secrets Manager | Parameter Store | Kubernetes Secrets |
|---|---|---|---|
| 自動ローテーション | ネイティブサポート (Lambda) | 非対応 | 非対応 |
| 暗号化 | 常時KMS暗号化 | 選択式 (SecureString) | base64エンコードのみ |
| クロスリージョンレプリケーション | 標準サポート | 非対応 | 非対応 |
| バージョン管理 | AWSCURRENT/AWSPREVIOUS | 非対応 | 非対応 |
| コスト | $0.40/シークレット/月 + API呼び出し | 無料(Standard) | 無料 |

自動ローテーションが必要な場合やセキュリティコンプライアンスが求められる認証情報にはSecrets Managerを使用し、単純な設定値にはParameter Storeを使用する。

## 2. シークレット分類とネーミング

シークレット名は`{プロジェクト}/{環境}/{サービス}/{キー名}`の階層構造を使用する。

| シークレット | 形式 | ローテーション周期 |
|---|---|---|
| LLM APIキー (OpenAI、Anthropic) | 単一文字列 | 90日 |
| MongoDB Atlas URI | 接続文字列 | 30日 (カスタムLambda) |
| Kafka SASL/SCRAM認証情報 | JSON (`username`/`password`) | 30日 (マネージド) |
| 外部APIキー | 単一文字列 | 手動 |
| OAuthクライアントシークレット | JSON (`client_id`/`client_secret`) | 手動 |
| JWT署名キー | 単一文字列 | 90日 (ローリング) |

JWT署名キーはAWSPREVIOUSを活用して以前のキーで署名されたトークンも検証できるローリング方式で交換する。

## 3. KMS暗号化

Secrets Managerはenvelope encryption方式を使用する。シークレットごとに固有のデータキーを生成し、このデータキーをKMS CMK(Customer Master Key)で暗号化する。

```hcl
resource "aws_kms_key" "secrets" {
  description             = "CMK for Secrets Manager"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSecretsManagerAccess"
        Effect = "Allow"
        Principal = {
          Service = "secretsmanager.amazonaws.com"
        }
        Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource = "*"
      }
    ]
  })
}
```

`enable_key_rotation = true`でCMKを毎年自動ローテーションする。

## 4. EKS連携方法

### 4.1. External Secrets Operator (ESO) — 推奨

ESOはSecrets ManagerのシークレットをKubernetes Secretとして自動同期する。PodからはKubernetes Secretを通常の環境変数として使用する。

```bash
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets --create-namespace
```

ClusterSecretStoreを作成してクラスター全体で使用できるようにする。

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-northeast-2
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets
```

ExternalSecretリソースで個別シークレットを同期する。

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ai-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: aws-secrets-manager
  target:
    name: ai-secrets
    creationPolicy: Owner
  data:
    - secretKey: OPENAI_API_KEY
      remoteRef:
        key: project/prod/ai/openai-api-key
    - secretKey: ANTHROPIC_API_KEY
      remoteRef:
        key: project/prod/ai/anthropic-api-key
```

### 4.2. CSI Secrets Store Driver (ASCP)

EKSアドオンとしてインストールし、ボリュームマウント方式でシークレットを注入する。ESOと異なりPodが再起動しないと最新のシークレットを読み込まない。

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: aws-secrets
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: "project/prod/ai/openai-api-key"
        objectType: "secretsmanager"
```

ESOは`refreshInterval`で自動更新が可能で、Kubernetes Secretを直接作成するため、ほとんどの場合ESOを推奨する。ASCPはファイルベースでシークレットをマウントする必要がある特殊な状況で使用する。

## 5. IRSA (IAM Roles for Service Accounts)

サービスごとにIAMロールを作成し、必要なシークレットにのみアクセスできるよう最小権限の原則を適用する。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:ap-northeast-2:*:secret:project/prod/ai/*"
    },
    {
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "arn:aws:kms:ap-northeast-2:*:key/<kms-key-id>"
    }
  ]
}
```

各サービス(AI API、Service APIなど)は自身に必要なシークレットパスにのみアクセスできる個別のIAMロールを使用する。

## 6. 自動ローテーション

Secrets Managerの自動ローテーションはLambda関数を通じて4段階で進行する。

1. **createSecret**: 新しいシークレット値を生成 → AWSPENDINGステージに保存
2. **setSecret**: 外部サービス(DBなど)に新しい認証情報を適用
3. **testSecret**: 新しい認証情報で接続テスト
4. **finishSecret**: AWSPENDING → AWSCURRENTに昇格、既存値はAWSPREVIOUSに移動

```hcl
resource "aws_secretsmanager_secret_rotation" "mongodb" {
  secret_id           = aws_secretsmanager_secret.mongodb_uri.id
  rotation_lambda_arn = aws_lambda_function.rotate_mongodb.arn

  rotation_rules {
    automatically_after_days = 30
  }
}
```

MongoDB Atlas URIなどのカスタムローテーションはLambdaでAtlas Admin APIを呼び出して新しいパスワードを設定し、接続文字列を更新する方式で実装する。

## 7. クライアントサイドキャッシング

API呼び出しコストを90%以上削減するためにクライアントサイドキャッシングを適用する。

Python(FastAPI)の例は以下の通りである。

```python
from aws_secretsmanager_caching import SecretCache

cache = SecretCache()
secret = cache.get_secret_string("project/prod/ai/openai-api-key")
```

Kotlin(Spring Boot)の例は以下の通りである。

```kotlin
@Cacheable("secrets")
fun getSecret(secretId: String): String {
    val request = GetSecretValueRequest.builder()
        .secretId(secretId)
        .build()
    return secretsManagerClient.getSecretValue(request).secretString()
}
```

## 8. モニタリング

CloudTrailで`GetSecretValue`、`RotateSecret`、`CreateSecret`、`DeleteSecret`イベントを追跡する。CloudWatchメトリクスフィルターを設定して異常なアクセスパターン(短時間での大量のGetSecretValue呼び出しなど)を検知しアラームを構成する。

## 9. コスト

シークレット10個基準で約$6/月である。

| 項目 | コスト |
|---|---|
| シークレット保存 (10個 × $0.40) | $4 |
| KMS CMK | $1 |
| API呼び出し | ~$1 |
| 合計推定 | ~$6/月 |

クライアントサイドキャッシングでAPI呼び出しコストを90%以上削減できる。

# 参考

- <https://aws.amazon.com/blogs/security/how-to-choose-the-right-aws-service-for-managing-secrets-and-configurations/>
- <https://aws.amazon.com/secrets-manager/pricing/>
- <https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_lambda.html>
- <https://external-secrets.io/latest/introduction/getting-started/>
- <https://external-secrets.io/latest/provider/aws-secrets-manager/>
