---
title: "[Infra] AWS API Gateway 유형 비교와 EKS 연동"
ref: aws-api-gateway-eks-integration
excerpt: "REST API, HTTP API, WebSocket API의 차이를 비교하고 Lambda Authorizer 인증, VPC Link를 통한 EKS 연동 방법을 정리한다."
date: 2026-03-02T12:20+09:00
last_modified_at: 2026-03-02T12:20+09:00
published: false
header:
  overlay_image: "/assets/image/thumbnail/header/aws-api-gateway-eks-integration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/aws-api-gateway-eks-integration.png"
categories:
  - Development
  - Server
  - Infra
tags:
  - AWS
  - API Gateway
  - WebSocket
  - VPC Link
  - Lambda Authorizer
  - EKS
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Server"
    url: /ko/development/server/
  - title: "Infra"
    url: /ko/development/server/infra/
---

# 개요

REST API, HTTP API, WebSocket API의 차이를 비교하고 Lambda Authorizer 인증, VPC Link를 통한 EKS 연동 방법을 정리한다.

# 정리

## 1. API Gateway 유형 비교

| 항목 | REST API (v1) | HTTP API (v2) | WebSocket API |
|---|---|---|---|
| 가격 (100만 요청) | $3.50 | $1.00 (71% 저렴) | $1.00 + 연결 $0.25 |
| JWT Authorizer | 미지원 | 내장 지원 | 미지원 |
| Lambda Authorizer | 지원 | 지원 | 지원 |
| Usage Plans/API Keys | 지원 | 미지원 | 미지원 |
| WAF 통합 | 지원 | 미지원 | 미지원 |
| Response Streaming | GA (2025.11) | 미지원 | N/A |
| VPC Link | v1 (NLB 필요) | v2 (ALB 직접 지원) | 미지원 |
| 최대 연결 시간 | 29초 (스트리밍: 15분) | 29초 | 2시간 |
| 지연 시간 | 높음 | 낮음 | 낮음 |

## 2. 서비스별 API 유형 선택

| API 서비스 | 유형 | 이유 |
|---|---|---|
| AI API (스트리밍 채팅) | WebSocket API | 양방향 실시간 통신, 최대 2시간 연결 유지 |
| Service API (CRUD) | HTTP API | REST API 대비 71% 저렴, JWT Authorizer 내장 |
| Observation API | API Gateway 불필요 | 내부 스케줄러, 외부 노출 불필요 |

### 2.1. AI API — WebSocket vs REST API Streaming

AI API의 스트리밍 채팅에는 WebSocket API를 1순위로 권장한다. 양방향 통신이 가능하고 `@connections` API로 서버에서 클라이언트에 능동적으로 푸시할 수 있다.

기존 SSE(Server-Sent Events) 코드를 유지하고 싶다면 REST API + Response Streaming(2025년 11월 GA)이 대안이 될 수 있다. HTTP API는 스트리밍을 지원하지 않으므로 적합하지 않다.

| 옵션 | 장점 | 단점 |
|---|---|---|
| WebSocket API | 양방향, 2시간 연결, 푸시 가능 | SSE 코드 재작성 필요 |
| REST API + Streaming | SSE 코드 유지 가능, 15분 연결 | 단방향, REST API 가격 적용 |

### 2.2. Service API — HTTP API

HTTP API는 REST API 대비 71% 저렴하고 JWT Authorizer가 내장되어 있어 간단한 CRUD API에 최적이다. Usage Plans, WAF 통합이 필요한 경우에만 REST API를 고려한다.

## 3. 인증 — Lambda Authorizer

소셜 로그인 OAuth 토큰을 Lambda Authorizer에서 검증한다. 검증 결과를 TTL(최대 3600초)로 캐싱해 반복 호출을 줄인다.

```
클라이언트 → OAuth 로그인 → Access Token 발급
→ API Gateway 요청 (Authorization: Bearer {token})
→ Lambda Authorizer가 토큰 검증
→ IAM Policy Document 반환 (Allow/Deny)
→ EKS 백엔드로 요청 전달
```

Lambda Authorizer는 TOKEN 타입과 REQUEST 타입이 있다.

| 타입 | 입력 | 캐싱 키 | 적합 |
|---|---|---|---|
| TOKEN | Authorization 헤더 | 토큰 값 | Bearer 토큰 검증 |
| REQUEST | 전체 요청 컨텍스트 | 다중 파라미터 조합 | IP + 헤더 복합 검증 |

대부분의 OAuth 시나리오에서는 TOKEN 타입을 사용한다. 캐싱 TTL을 적절히 설정하면(300~3600초) Lambda 호출 비용을 크게 절감할 수 있다.

## 4. API Gateway + EKS 통합

### 4.1. HTTP API + VPC Link v2

HTTP API VPC Link v2는 ALB를 직접 지원한다. NLB 없이 비용과 복잡도를 줄일 수 있다.

```
인터넷 → API Gateway (HTTP API) → VPC Link v2 → 내부 ALB → EKS Pod
```

VPC Link v2는 2024년부터 ALB 직접 통합을 지원하므로 NLB를 별도로 생성할 필요가 없다.

### 4.2. REST API + VPC Link v1

REST API는 VPC Link v1을 사용하며 NLB가 필요하다.

```
인터넷 → API Gateway (REST API) → VPC Link v1 → NLB → EKS Pod
```

### 4.3. WebSocket API

WebSocket API는 VPC Link를 지원하지 않는다. Lambda 릴레이를 사용하거나 퍼블릭 NLB를 통해 EKS와 연결한다.

```
인터넷 → API Gateway (WebSocket) → Lambda → EKS Pod (내부 ALB)
```

## 5. CORS 설정

HTTP API는 CORS 자동 구성을 지원한다. REST API는 OPTIONS 메서드를 수동으로 설정해야 한다.

```
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

`Access-Control-Allow-Credentials: true`를 사용하는 경우 `Access-Control-Allow-Origin`에 와일드카드(`*`)를 사용할 수 없다.

## 6. 커스텀 도메인

ACM 인증서를 발급하고 Route53에서 API Gateway 도메인을 매핑한다. WebSocket API는 별도 도메인(예: `wss://ws.example.com`)으로 분리하는 것이 좋다.

```
api.example.com     → HTTP API (Service API)
ws.example.com      → WebSocket API (AI API)
```

## 7. Rate Limiting

REST API는 Usage Plans으로 API 키별 RPS를 제한할 수 있다. HTTP API와 WebSocket API는 계정 레벨 쓰로틀링(기본 10,000 RPS)만 지원한다.

API Gateway의 쓰로틀링은 token bucket 알고리즘을 사용한다. 순간적인 트래픽 스파이크를 burst로 흡수하면서 평균 RPS를 일정하게 유지한다.

## 8. API Gateway vs ALB 직접 노출

| 항목 | API Gateway | ALB 직접 노출 |
|---|---|---|
| 관리형 인증 | Lambda/JWT Authorizer | 없음 (앱 레벨에서 처리) |
| Rate Limiting | 내장 | 없음 |
| WAF | REST API만 지원 | 지원 |
| 처리량 | 10,000 RPS (기본) | 제한 없음 |
| WebSocket | 지원 | 미지원 |
| 비용 구조 | 요청 단위 | 시간 + LCU |

초기 트래픽에서는 API Gateway의 관리형 기능(인증, Rate Limiting)이 유리하다. 일 50만 요청 이상에서 ALB 직접 노출이 비용 효율적이다.

## 9. 비용

| 항목 | 시나리오 | 월 비용 |
|---|---|---|
| WebSocket API | 일 10,000 세션 × 30일 | ~$30 |
| HTTP API | 일 100,000 요청 × 30일 | ~$3 |
| Lambda Authorizer | 캐싱 적용 시 | ~$1 |
| 총 추정 | | ~$34/월 |

초기 트래픽에서 API Gateway 비용 자체는 크지 않다.

# 참고

- <https://aws.amazon.com/api-gateway/pricing/>
- <https://aws.amazon.com/blogs/compute/building-responsive-apis-with-amazon-api-gateway-response-streaming/>
- <https://aws.amazon.com/blogs/containers/integrate-amazon-api-gateway-with-amazon-eks/>
- <https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html>
- <https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api.html>
