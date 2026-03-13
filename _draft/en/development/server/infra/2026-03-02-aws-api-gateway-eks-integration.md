---
title: "[Infra] AWS API Gateway Types and EKS Integration"
ref: aws-api-gateway-eks-integration
lang: en
permalink: /en/:categories/:title/
excerpt: "Compare the differences between REST API, HTTP API, and WebSocket API, and outline Lambda Authorizer authentication and EKS integration via VPC Link."
date: 2026-03-02T12:20+09:00
last_modified_at: 2026-03-02T12:20+09:00
published: false
header:
  overlay_image: "/assets/image/thumbnail/header/aws-api-gateway-eks-integration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/aws-api-gateway-eks-integration.png"
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
    url: /en/development/
  - title: "Server"
    url: /en/development/server/
  - title: "Infra"
    url: /en/development/server/infra/
---

# Overview

Compare the differences between REST API, HTTP API, and WebSocket API, and outline Lambda Authorizer authentication and EKS integration via VPC Link.

# Summary

## 1. API Gateway Type Comparison

| Item | REST API (v1) | HTTP API (v2) | WebSocket API |
|---|---|---|---|
| Price (1M requests) | $3.50 | $1.00 (71% cheaper) | $1.00 + connection $0.25 |
| JWT Authorizer | Not supported | Built-in support | Not supported |
| Lambda Authorizer | Supported | Supported | Supported |
| Usage Plans/API Keys | Supported | Not supported | Not supported |
| WAF Integration | Supported | Not supported | Not supported |
| Response Streaming | GA (2025.11) | Not supported | N/A |
| VPC Link | v1 (NLB required) | v2 (direct ALB support) | Not supported |
| Max Connection Time | 29 sec (streaming: 15 min) | 29 sec | 2 hours |
| Latency | High | Low | Low |

## 2. API Type Selection per Service

| API Service | Type | Reason |
|---|---|---|
| AI API (streaming chat) | WebSocket API | Bidirectional real-time communication, up to 2-hour connection |
| Service API (CRUD) | HTTP API | 71% cheaper than REST API, built-in JWT Authorizer |
| Observation API | API Gateway not needed | Internal scheduler, no external exposure needed |

### 2.1. AI API — WebSocket vs REST API Streaming

WebSocket API is the top recommendation for AI API streaming chat. It supports bidirectional communication and allows the server to actively push to clients via the `@connections` API.

If you want to keep existing SSE (Server-Sent Events) code, REST API + Response Streaming (GA November 2025) can be an alternative. HTTP API does not support streaming and is therefore not suitable.

| Option | Pros | Cons |
|---|---|---|
| WebSocket API | Bidirectional, 2-hour connection, push capable | Requires SSE code rewrite |
| REST API + Streaming | Can keep SSE code, 15-min connection | Unidirectional, REST API pricing applies |

### 2.2. Service API — HTTP API

HTTP API is 71% cheaper than REST API and has a built-in JWT Authorizer, making it optimal for simple CRUD APIs. Consider REST API only when Usage Plans or WAF integration is needed.

## 3. Authentication — Lambda Authorizer

Social login OAuth tokens are verified in the Lambda Authorizer. Verification results are cached with TTL (up to 3600 seconds) to reduce repeated calls.

```
Client -> OAuth Login -> Access Token Issued
-> API Gateway Request (Authorization: Bearer {token})
-> Lambda Authorizer Validates Token
-> Returns IAM Policy Document (Allow/Deny)
-> Request Forwarded to EKS Backend
```

Lambda Authorizer has TOKEN type and REQUEST type.

| Type | Input | Cache Key | Suitable For |
|---|---|---|---|
| TOKEN | Authorization header | Token value | Bearer token verification |
| REQUEST | Full request context | Multi-parameter combination | IP + header composite verification |

TOKEN type is used in most OAuth scenarios. Setting an appropriate caching TTL (300-3600 seconds) can significantly reduce Lambda invocation costs.

## 4. API Gateway + EKS Integration

### 4.1. HTTP API + VPC Link v2

HTTP API VPC Link v2 supports ALB directly. This reduces cost and complexity without requiring an NLB.

```
Internet -> API Gateway (HTTP API) -> VPC Link v2 -> Internal ALB -> EKS Pod
```

VPC Link v2 has supported direct ALB integration since 2024, so there is no need to create a separate NLB.

### 4.2. REST API + VPC Link v1

REST API uses VPC Link v1 and requires an NLB.

```
Internet -> API Gateway (REST API) -> VPC Link v1 -> NLB -> EKS Pod
```

### 4.3. WebSocket API

WebSocket API does not support VPC Link. Connect to EKS using a Lambda relay or through a public NLB.

```
Internet -> API Gateway (WebSocket) -> Lambda -> EKS Pod (Internal ALB)
```

## 5. CORS Configuration

HTTP API supports automatic CORS configuration. REST API requires manual OPTIONS method setup.

```
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

When using `Access-Control-Allow-Credentials: true`, wildcards (`*`) cannot be used for `Access-Control-Allow-Origin`.

## 6. Custom Domain

Issue an ACM certificate and map the API Gateway domain in Route53. It is recommended to separate the WebSocket API on its own domain (e.g., `wss://ws.example.com`).

```
api.example.com     -> HTTP API (Service API)
ws.example.com      -> WebSocket API (AI API)
```

## 7. Rate Limiting

REST API can limit RPS per API key using Usage Plans. HTTP API and WebSocket API only support account-level throttling (default 10,000 RPS).

API Gateway throttling uses a token bucket algorithm. It absorbs momentary traffic spikes with burst capacity while maintaining a steady average RPS.

## 8. API Gateway vs Direct ALB Exposure

| Item | API Gateway | Direct ALB Exposure |
|---|---|---|
| Managed Authentication | Lambda/JWT Authorizer | None (handled at app level) |
| Rate Limiting | Built-in | None |
| WAF | REST API only | Supported |
| Throughput | 10,000 RPS (default) | Unlimited |
| WebSocket | Supported | Not supported |
| Cost Structure | Per request | Hourly + LCU |

At initial traffic levels, API Gateway's managed features (authentication, rate limiting) are advantageous. Above 500K daily requests, direct ALB exposure becomes more cost-effective.

## 9. Cost

| Item | Scenario | Monthly Cost |
|---|---|---|
| WebSocket API | 10,000 sessions/day x 30 days | ~$30 |
| HTTP API | 100,000 requests/day x 30 days | ~$3 |
| Lambda Authorizer | With caching | ~$1 |
| Estimated total | | ~$34/month |

API Gateway costs are not significant at initial traffic levels.

# References

- <https://aws.amazon.com/api-gateway/pricing/>
- <https://aws.amazon.com/blogs/compute/building-responsive-apis-with-amazon-api-gateway-response-streaming/>
- <https://aws.amazon.com/blogs/containers/integrate-amazon-api-gateway-with-amazon-eks/>
- <https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html>
- <https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api.html>
