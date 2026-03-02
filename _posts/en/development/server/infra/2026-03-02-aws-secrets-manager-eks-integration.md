---
title: "[Infra] AWS Secrets Manager and EKS Integration Guide"
ref: aws-secrets-manager-eks-integration
lang: en
permalink: /en/:categories/:title/
excerpt: "Set up secret management, KMS encryption, and automatic rotation in AWS Secrets Manager, and integrate with EKS using External Secrets Operator (ESO)."
date: 2026-03-02T12:10+09:00
last_modified_at: 2026-03-02T12:10+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/aws-secrets-manager-eks-integration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/aws-secrets-manager-eks-integration.png"
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
    url: /en/development/
  - title: "Server"
    url: /en/development/server/
  - title: "Infra"
    url: /en/development/server/infra/
---

# Overview

Set up secret management, KMS encryption, and automatic rotation in AWS Secrets Manager, and integrate with EKS using External Secrets Operator (ESO).

# Summary

## 1. Secret Management Service Comparison

| Item | Secrets Manager | Parameter Store | Kubernetes Secrets |
|---|---|---|---|
| Automatic Rotation | Native support (Lambda) | Not supported | Not supported |
| Encryption | Always KMS encrypted | Optional (SecureString) | base64 encoding only |
| Cross-Region Replication | Built-in support | Not supported | Not supported |
| Version Management | AWSCURRENT/AWSPREVIOUS | Not supported | Not supported |
| Cost | $0.40/secret/month + API calls | Free (Standard) | Free |

Use Secrets Manager for credentials that require automatic rotation or security compliance, and use Parameter Store for simple configuration values.

## 2. Secret Classification and Naming

Secret names follow a `{project}/{environment}/{service}/{key-name}` hierarchical structure.

| Secret | Format | Rotation Period |
|---|---|---|
| LLM API keys (OpenAI, Anthropic) | Single string | 90 days |
| MongoDB Atlas URI | Connection string | 30 days (custom Lambda) |
| Kafka SASL/SCRAM credentials | JSON (`username`/`password`) | 30 days (managed) |
| External API keys | Single string | Manual |
| OAuth client secrets | JSON (`client_id`/`client_secret`) | Manual |
| JWT signing key | Single string | 90 days (rolling) |

JWT signing keys are rotated using a rolling method that leverages AWSPREVIOUS to verify tokens signed with the previous key.

## 3. KMS Encryption

Secrets Manager uses envelope encryption. A unique data key is generated for each secret, and this data key is encrypted with a KMS CMK (Customer Master Key).

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

The CMK is automatically rotated annually with `enable_key_rotation = true`.

## 4. EKS Integration Methods

### 4.1. External Secrets Operator (ESO) — Recommended

ESO automatically syncs secrets from Secrets Manager into Kubernetes Secrets. Pods consume them as regular environment variables.

```bash
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets --create-namespace
```

Create a ClusterSecretStore to make it available across the entire cluster.

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

Use ExternalSecret resources to sync individual secrets.

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

Installed as an EKS add-on, it injects secrets via volume mounts. Unlike ESO, Pods must be restarted to read the latest secrets.

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

ESO supports automatic refresh via `refreshInterval` and directly creates Kubernetes Secrets, making it recommended for most cases. ASCP is used in specific scenarios where secrets must be mounted as files.

## 5. IRSA (IAM Roles for Service Accounts)

Create per-service IAM roles to apply the least privilege principle, allowing access only to necessary secrets.

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

Each service (AI API, Service API, etc.) uses a separate IAM role that can only access the secret paths it needs.

## 6. Automatic Rotation

Automatic rotation in Secrets Manager proceeds through 4 stages via a Lambda function.

1. **createSecret**: Generate new secret value and store it in the AWSPENDING stage
2. **setSecret**: Apply new credentials to external services (DB, etc.)
3. **testSecret**: Test connection with new credentials
4. **finishSecret**: Promote AWSPENDING to AWSCURRENT, move existing value to AWSPREVIOUS

```hcl
resource "aws_secretsmanager_secret_rotation" "mongodb" {
  secret_id           = aws_secretsmanager_secret.mongodb_uri.id
  rotation_lambda_arn = aws_lambda_function.rotate_mongodb.arn

  rotation_rules {
    automatically_after_days = 30
  }
}
```

Custom rotation like MongoDB Atlas URI is implemented by calling the Atlas Admin API from Lambda to set a new password and update the connection string.

## 7. Client-Side Caching

Apply client-side caching to reduce API call costs by over 90%.

Below is a Python (FastAPI) example.

```python
from aws_secretsmanager_caching import SecretCache

cache = SecretCache()
secret = cache.get_secret_string("project/prod/ai/openai-api-key")
```

Below is a Kotlin (Spring Boot) example.

```kotlin
@Cacheable("secrets")
fun getSecret(secretId: String): String {
    val request = GetSecretValueRequest.builder()
        .secretId(secretId)
        .build()
    return secretsManagerClient.getSecretValue(request).secretString()
}
```

## 8. Monitoring

Track `GetSecretValue`, `RotateSecret`, `CreateSecret`, and `DeleteSecret` events in CloudTrail. Set up CloudWatch metric filters to detect abnormal access patterns (such as a high number of GetSecretValue calls in a short time) and configure alarms.

## 9. Cost

Approximately $6/month based on 10 secrets.

| Item | Cost |
|---|---|
| Secret storage (10 x $0.40) | $4 |
| KMS CMK | $1 |
| API calls | ~$1 |
| Estimated total | ~$6/month |

Client-side caching can reduce API call costs by over 90%.

# References

- <https://aws.amazon.com/blogs/security/how-to-choose-the-right-aws-service-for-managing-secrets-and-configurations/>
- <https://aws.amazon.com/secrets-manager/pricing/>
- <https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_lambda.html>
- <https://external-secrets.io/latest/introduction/getting-started/>
- <https://external-secrets.io/latest/provider/aws-secrets-manager/>
