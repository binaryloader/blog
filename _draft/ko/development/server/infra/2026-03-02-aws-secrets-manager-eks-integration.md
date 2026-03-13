---
title: "[Infra] AWS Secrets Manager와 EKS 연동 가이드"
ref: aws-secrets-manager-eks-integration
excerpt: "AWS Secrets Manager의 시크릿 관리, KMS 암호화, 자동 로테이션을 설정하고 External Secrets Operator(ESO)로 EKS에 연동하는 방법을 정리한다."
date: 2026-03-02T12:10+09:00
last_modified_at: 2026-03-02T12:10+09:00
published: false
header:
  overlay_image: "/assets/image/thumbnail/header/aws-secrets-manager-eks-integration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/aws-secrets-manager-eks-integration.png"
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
    url: /ko/development/
  - title: "Server"
    url: /ko/development/server/
  - title: "Infra"
    url: /ko/development/server/infra/
---

# 개요

AWS Secrets Manager의 시크릿 관리, KMS 암호화, 자동 로테이션을 설정하고 External Secrets Operator(ESO)로 EKS에 연동하는 방법을 정리한다.

# 정리

## 1. 시크릿 관리 서비스 비교

| 항목 | Secrets Manager | Parameter Store | Kubernetes Secrets |
|---|---|---|---|
| 자동 로테이션 | 네이티브 지원 (Lambda) | 미지원 | 미지원 |
| 암호화 | 항상 KMS 암호화 | 선택적 (SecureString) | base64 인코딩만 |
| 크로스 리전 복제 | 기본 지원 | 미지원 | 미지원 |
| 버전 관리 | AWSCURRENT/AWSPREVIOUS | 미지원 | 미지원 |
| 비용 | $0.40/시크릿/월 + API 호출 | 무료(Standard) | 무료 |

자동 로테이션이 필요하거나 보안 컴플라이언스가 요구되는 자격증명에 Secrets Manager를 사용하고 단순 설정값은 Parameter Store를 사용한다.

## 2. 시크릿 분류와 네이밍

시크릿 이름은 `{프로젝트}/{환경}/{서비스}/{키명}` 계층 구조를 사용한다.

| 시크릿 | 형식 | 로테이션 주기 |
|---|---|---|
| LLM API 키 (OpenAI, Anthropic) | 단일 문자열 | 90일 |
| MongoDB Atlas URI | 연결 문자열 | 30일 (커스텀 Lambda) |
| Kafka SASL/SCRAM 자격증명 | JSON (`username`/`password`) | 30일 (관리형) |
| 외부 API 키 | 단일 문자열 | 수동 |
| OAuth 클라이언트 시크릿 | JSON (`client_id`/`client_secret`) | 수동 |
| JWT 서명 키 | 단일 문자열 | 90일 (롤링) |

JWT 서명 키는 AWSPREVIOUS를 활용해 이전 키로 서명된 토큰도 검증할 수 있는 롤링 방식으로 교체한다.

## 3. KMS 암호화

Secrets Manager는 envelope encryption 방식을 사용한다. 시크릿마다 고유 데이터 키를 생성하고 이 데이터 키를 KMS CMK(Customer Master Key)로 암호화한다.

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

`enable_key_rotation = true`로 CMK를 매년 자동 로테이션한다.

## 4. EKS 연동 방법

### 4.1. External Secrets Operator (ESO) — 추천

ESO는 Secrets Manager의 시크릿을 Kubernetes Secret으로 자동 동기화한다. 파드는 일반 환경 변수처럼 사용한다.

```bash
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets --create-namespace
```

ClusterSecretStore를 생성해 클러스터 전체에서 사용할 수 있도록 한다.

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

ExternalSecret 리소스로 개별 시크릿을 동기화한다.

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

EKS 애드온으로 설치하며 볼륨 마운트 방식으로 시크릿을 주입한다. ESO와 달리 파드가 재시작되어야 최신 시크릿을 읽는다.

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

ESO는 `refreshInterval`로 자동 갱신이 가능하고 Kubernetes Secret을 직접 생성하므로 대부분의 경우 ESO를 권장한다. ASCP는 파일 기반으로 시크릿을 마운트해야 하는 특수한 상황에서 사용한다.

## 5. IRSA (IAM Roles for Service Accounts)

서비스별 IAM 역할을 생성해 필요한 시크릿에만 접근하도록 최소 권한 원칙을 적용한다.

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

각 서비스(AI API, Service API 등)는 자신에게 필요한 시크릿 경로에만 접근할 수 있는 별도의 IAM 역할을 사용한다.

## 6. 자동 로테이션

Secrets Manager의 자동 로테이션은 Lambda 함수를 통해 4단계로 진행된다.

1. **createSecret**: 새 시크릿 값 생성 → AWSPENDING 스테이지에 저장
2. **setSecret**: 외부 서비스(DB 등)에 새 자격증명 적용
3. **testSecret**: 새 자격증명으로 연결 테스트
4. **finishSecret**: AWSPENDING → AWSCURRENT 승격, 기존값은 AWSPREVIOUS로 이동

```hcl
resource "aws_secretsmanager_secret_rotation" "mongodb" {
  secret_id           = aws_secretsmanager_secret.mongodb_uri.id
  rotation_lambda_arn = aws_lambda_function.rotate_mongodb.arn

  rotation_rules {
    automatically_after_days = 30
  }
}
```

MongoDB Atlas URI 같은 커스텀 로테이션은 Lambda에서 Atlas Admin API를 호출해 새 비밀번호를 설정하고 연결 문자열을 갱신하는 방식으로 구현한다.

## 7. 클라이언트 사이드 캐싱

API 호출 비용을 90% 이상 절감하기 위해 클라이언트 사이드 캐싱을 적용한다.

Python(FastAPI) 예시는 아래와 같다.

```python
from aws_secretsmanager_caching import SecretCache

cache = SecretCache()
secret = cache.get_secret_string("project/prod/ai/openai-api-key")
```

Kotlin(Spring Boot) 예시는 아래와 같다.

```kotlin
@Cacheable("secrets")
fun getSecret(secretId: String): String {
    val request = GetSecretValueRequest.builder()
        .secretId(secretId)
        .build()
    return secretsManagerClient.getSecretValue(request).secretString()
}
```

## 8. 모니터링

CloudTrail에서 `GetSecretValue`, `RotateSecret`, `CreateSecret`, `DeleteSecret` 이벤트를 추적한다. CloudWatch 메트릭 필터를 설정해 비정상적인 접근 패턴(짧은 시간에 다수의 GetSecretValue 호출 등)을 감지하고 알람을 구성한다.

## 9. 비용

시크릿 10개 기준 약 $6/월이다.

| 항목 | 비용 |
|---|---|
| 시크릿 저장 (10개 × $0.40) | $4 |
| KMS CMK | $1 |
| API 호출 | ~$1 |
| 총 추정 | ~$6/월 |

클라이언트 사이드 캐싱으로 API 호출 비용을 90% 이상 절감할 수 있다.

# 참고

- <https://aws.amazon.com/blogs/security/how-to-choose-the-right-aws-service-for-managing-secrets-and-configurations/>
- <https://aws.amazon.com/secrets-manager/pricing/>
- <https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_lambda.html>
- <https://external-secrets.io/latest/introduction/getting-started/>
- <https://external-secrets.io/latest/provider/aws-secrets-manager/>
