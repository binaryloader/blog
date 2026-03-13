---
title: "[Infra] AWS API Gatewayタイプ比較とEKS連携"
ref: aws-api-gateway-eks-integration
excerpt: "REST API、HTTP API、WebSocket APIの違いを比較し、Lambda Authorizer認証、VPC Linkを通じたEKS連携方法を整理する。"
date: 2026-03-02T12:20+09:00
last_modified_at: 2026-03-02T12:20+09:00
published: false
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/aws-api-gateway-eks-integration.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/aws-api-gateway-eks-integration.png"
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
    url: /ja/development/
  - title: "Server"
    url: /ja/development/server/
  - title: "Infra"
    url: /ja/development/server/infra/
---

# 概要

REST API、HTTP API、WebSocket APIの違いを比較し、Lambda Authorizer認証、VPC Linkを通じたEKS連携方法を整理する。

# まとめ

## 1. API Gatewayタイプ比較

| 項目 | REST API (v1) | HTTP API (v2) | WebSocket API |
|---|---|---|---|
| 価格 (100万リクエスト) | $3.50 | $1.00 (71%安価) | $1.00 + 接続 $0.25 |
| JWT Authorizer | 非対応 | 組み込みサポート | 非対応 |
| Lambda Authorizer | 対応 | 対応 | 対応 |
| Usage Plans/API Keys | 対応 | 非対応 | 非対応 |
| WAF統合 | 対応 | 非対応 | 非対応 |
| Response Streaming | GA (2025.11) | 非対応 | N/A |
| VPC Link | v1 (NLB必要) | v2 (ALB直接サポート) | 非対応 |
| 最大接続時間 | 29秒 (ストリーミング: 15分) | 29秒 | 2時間 |
| レイテンシ | 高い | 低い | 低い |

## 2. サービス別APIタイプ選択

| APIサービス | タイプ | 理由 |
|---|---|---|
| AI API (ストリーミングチャット) | WebSocket API | 双方向リアルタイム通信、最大2時間接続維持 |
| Service API (CRUD) | HTTP API | REST API対比71%安価、JWT Authorizer組み込み |
| Observation API | API Gateway不要 | 内部スケジューラー、外部公開不要 |

### 2.1. AI API — WebSocket vs REST API Streaming

AI APIのストリーミングチャットにはWebSocket APIを第一候補として推奨する。双方向通信が可能で`@connections` APIによりサーバーからクライアントに能動的にプッシュできる。

既存のSSE(Server-Sent Events)コードを維持したい場合はREST API + Response Streaming(2025年11月GA)が代替となり得る。HTTP APIはストリーミングをサポートしないため適していない。

| オプション | メリット | デメリット |
|---|---|---|
| WebSocket API | 双方向、2時間接続、プッシュ可能 | SSEコード書き換え必要 |
| REST API + Streaming | SSEコード維持可能、15分接続 | 単方向、REST API価格適用 |

### 2.2. Service API — HTTP API

HTTP APIはREST API対比71%安価でJWT Authorizerが組み込まれており、シンプルなCRUD APIに最適である。Usage Plans、WAF統合が必要な場合のみREST APIを検討する。

## 3. 認証 — Lambda Authorizer

ソーシャルログインOAuthトークンをLambda Authorizerで検証する。検証結果をTTL(最大3600秒)でキャッシュし、繰り返しの呼び出しを削減する。

```
クライアント → OAuthログイン → Access Token発行
→ API Gatewayリクエスト (Authorization: Bearer {token})
→ Lambda Authorizerがトークン検証
→ IAM Policy Document返却 (Allow/Deny)
→ EKSバックエンドへリクエスト転送
```

Lambda AuthorizerにはTOKENタイプとREQUESTタイプがある。

| タイプ | 入力 | キャッシュキー | 適合 |
|---|---|---|---|
| TOKEN | Authorizationヘッダー | トークン値 | Bearerトークン検証 |
| REQUEST | リクエストコンテキスト全体 | 複数パラメータ組み合わせ | IP + ヘッダー複合検証 |

ほとんどのOAuthシナリオではTOKENタイプを使用する。キャッシュTTLを適切に設定すれば(300〜3600秒)Lambda呼び出しコストを大幅に削減できる。

## 4. API Gateway + EKS統合

### 4.1. HTTP API + VPC Link v2

HTTP API VPC Link v2はALBを直接サポートする。NLBなしでコストと複雑さを軽減できる。

```
インターネット → API Gateway (HTTP API) → VPC Link v2 → 内部ALB → EKS Pod
```

VPC Link v2は2024年からALB直接統合をサポートしているため、NLBを別途作成する必要がない。

### 4.2. REST API + VPC Link v1

REST APIはVPC Link v1を使用し、NLBが必要である。

```
インターネット → API Gateway (REST API) → VPC Link v1 → NLB → EKS Pod
```

### 4.3. WebSocket API

WebSocket APIはVPC Linkをサポートしない。Lambdaリレーを使用するか、パブリックNLBを通じてEKSと接続する。

```
インターネット → API Gateway (WebSocket) → Lambda → EKS Pod (内部ALB)
```

## 5. CORS設定

HTTP APIはCORS自動構成をサポートする。REST APIはOPTIONSメソッドを手動で設定する必要がある。

```
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

`Access-Control-Allow-Credentials: true`を使用する場合、`Access-Control-Allow-Origin`にワイルドカード(`*`)は使用できない。

## 6. カスタムドメイン

ACM証明書を発行しRoute53でAPI Gatewayドメインをマッピングする。WebSocket APIは別ドメイン(例: `wss://ws.example.com`)に分離するのが望ましい。

```
api.example.com     → HTTP API (Service API)
ws.example.com      → WebSocket API (AI API)
```

## 7. Rate Limiting

REST APIはUsage PlansでAPIキーごとのRPSを制限できる。HTTP APIとWebSocket APIはアカウントレベルスロットリング(デフォルト10,000 RPS)のみサポートする。

API Gatewayのスロットリングはtoken bucketアルゴリズムを使用する。瞬間的なトラフィックスパイクをburstで吸収しながら平均RPSを一定に維持する。

## 8. API Gateway vs ALB直接公開

| 項目 | API Gateway | ALB直接公開 |
|---|---|---|
| マネージド認証 | Lambda/JWT Authorizer | なし (アプリレベルで処理) |
| Rate Limiting | 組み込み | なし |
| WAF | REST APIのみ対応 | 対応 |
| スループット | 10,000 RPS (デフォルト) | 制限なし |
| WebSocket | 対応 | 非対応 |
| コスト構造 | リクエスト単位 | 時間 + LCU |

初期トラフィックではAPI Gatewayのマネージド機能(認証、Rate Limiting)が有利である。日50万リクエスト以上ではALB直接公開がコスト効率的である。

## 9. コスト

| 項目 | シナリオ | 月額コスト |
|---|---|---|
| WebSocket API | 日10,000セッション × 30日 | ~$30 |
| HTTP API | 日100,000リクエスト × 30日 | ~$3 |
| Lambda Authorizer | キャッシュ適用時 | ~$1 |
| 合計推定 | | ~$34/月 |

初期トラフィックではAPI Gatewayのコスト自体は大きくない。

# 参考

- <https://aws.amazon.com/api-gateway/pricing/>
- <https://aws.amazon.com/blogs/compute/building-responsive-apis-with-amazon-api-gateway-response-streaming/>
- <https://aws.amazon.com/blogs/containers/integrate-amazon-api-gateway-with-amazon-eks/>
- <https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html>
- <https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api.html>
