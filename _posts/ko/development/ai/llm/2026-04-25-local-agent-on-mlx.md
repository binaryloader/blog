---
title: "[LLM] Apple Silicon에서 MLX로 로컬 LLM 환경 구축하기"
ref: local-agent-on-mlx
excerpt: "Apple Silicon MacBook Pro M5 Pro 환경에서 MLX와 Qwen 3.6 모델로 로컬 LLM 환경을 구축하고 에이전트 프레임워크 학습을 위한 사전 준비를 정리한다."
date: 2026-04-25T15:00+09:00
last_modified_at: 2026-04-25T15:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/local-agent-on-mlx.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/local-agent-on-mlx.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - MLX
  - Qwen
  - Apple-Silicon
  - Agent
  - LLM
  - Tool-Calling
  - Quantization
depth:
  - title: "Development"
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "LLM"
    url: /ko/development/ai/llm/
---

# 개요

Apple Silicon MacBook Pro M5 Pro 환경에서 MLX와 Qwen 3.6 모델로 로컬 LLM 환경을 구축하고 에이전트 프레임워크 학습을 위한 사전 준비를 정리한다.

# 정리

## 1. 학습 목적과 환경

학습 목적은 아래와 같다.

- 에이전트 프레임워크 직접 구현(ReAct, Reflection, Plan-and-Execute)
- 툴 호출(Tool calling) raw 포맷 이해와 파서 작성
- Dense와 MoE 모델의 행동 차이 비교 학습
- Qwen의 `<think>` 블록을 활용한 reasoning 패턴 관찰

환경 요약은 아래와 같다.

- MacBook Pro M5 Pro
- 통합 메모리 48GB
- macOS 26.4.1
- mlx-lm v0.31.3(uv tool로 격리 설치)

핵심 결정 요약은 아래와 같다.

- 메인 모델은 `unsloth/Qwen3.6-27B-UD-MLX-6bit`(Dense, 약 22GB)이다
- 서브 모델은 `unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit`(MoE, 약 19GB)이다
- 서버는 빌트인 `mlx_lm.server`로 시작하고 학습 진행 후 `mlx-openai-server`로 검증한다
- 양자화는 6bit를 기본으로 한다. 8bit는 메모리 마진 부족, 4bit는 노이즈 위험이 있다

## 2. 하드웨어와 통합 메모리 분석

로컬 LLM 모델 선택의 1차 제약은 통합 메모리이다. 가용 메모리를 정확히 산정하고 모델 가중치 + KV 캐시가 그 안에 들어가는지 검증해야 한다.

### 2.1. 시스템 사양

- Model Identifier: Mac17,8(MacBook Pro)
- Chip: Apple M5 Pro
- CPU: 18 cores(6 efficiency + 12 performance)
- GPU: 20 cores
- 통합 메모리(unified memory): 48GB
- 디스크 여유: 약 790GB
- macOS: 26.4.1

### 2.2. 통합 메모리의 의미

Apple Silicon은 CPU와 GPU가 같은 RAM을 공유한다. NVIDIA 환경처럼 시스템 RAM과 VRAM을 따로 관리할 필요가 없다. MLX는 이 구조를 그대로 활용해 양자화된 가중치를 디스크에서 메모리로 그대로 로드한다. 따라서 디스크 다운로드 사이즈와 메모리 가중치 사이즈는 동일하다.

### 2.3. 메모리 예산(48GB 분배)

- macOS + 시스템 백그라운드: 약 10-12GB
- IDE(Cursor / VSCode), 브라우저, Claude Code 등 작업 환경: 약 8-10GB
- 모델 가중치 + KV 캐시 가용: 약 26-30GB

### 2.4. KV 캐시 추정치

| 컨텍스트 | 27B Dense | 35B-A3B(MoE) |
|----------|-----------|--------------|
| 8K | +2-3GB | +1-2GB |
| 16K | +4-6GB | +3-4GB |
| 32K | +8-10GB | +5-6GB |
| 64K | +15-18GB | +10-12GB |

### 2.5. 결론

모델 가중치는 20-22GB 이하로 잡아야 멀티턴 에이전트(8K-32K 컨텍스트)에서도 KV 캐시까지 안정적으로 들어간다. 28GB 이상의 8bit 양자화는 swap 발생 위험이 있어 학습 단계에서는 추천하지 않는다.

## 3. MLX 설치(mlx-lm + uv tool)

MLX 환경을 시스템 Python과 분리해 격리 설치하고 CLI를 전역에서 호출 가능하게 만든다.

### 3.1. MLX와 mlx-lm의 차이

PyTorch와 Hugging Face transformers의 관계와 같다.

MLX는 아래 특징을 가진다.

- Apple이 직접 만든 저수준 ML 프레임워크(2023년 12월 공개)이다
- 텐서 연산, 자동 미분, Metal GPU 가속을 제공한다
- PyTorch / JAX와 같은 계층의 도구이다
- 모델을 학습하거나 새 아키텍처를 구현할 때 사용한다

mlx-lm은 아래 특징을 가진다.

- MLX 위에 얹은 LLM 전용 라이브러리이다
- 모델 다운로드, 양자화, 추론, 서빙 도구를 포함한다
- transformers / vLLM과 같은 계층의 도구이다
- 이미 학습된 LLM을 가져다 돌릴 때 사용한다

`uv tool install mlx-lm`을 하면 의존성으로 mlx도 자동 설치된다.

### 3.2. 설치

`uv tool install`은 pipx와 같은 개념으로 격리된 venv에 CLI 도구를 설치하고 진입점만 PATH에 노출한다.

```bash
uv tool install mlx-lm --python 3.12
```

설치 위치는 아래와 같다.

- 격리 venv: `~/.local/share/uv/tools/mlx-lm/`
- CLI 심볼릭 링크: `~/.local/bin/mlx_lm.*`

### 3.3. Python 버전 처리

- 시스템 Python(3.9.6)은 MLX를 지원하지 않는다
- `--python 3.12` 명시 시 uv가 cpython 3.12.13을 자동 다운로드한다
- 명시하지 않으면 가용한 가장 최신 호환 버전이 자동으로 선택된다

### 3.4. 설치 검증

```bash
mlx_lm.server --help
uv tool list
```

Metal GPU 인식 확인은 아래 명령으로 한다.

```bash
uv tool run --from mlx-lm python -c \
  "import mlx.core as mx; print('Metal:', mx.metal.is_available()); print('Device:', mx.default_device())"
```

`Metal: True`와 `Device: Device(gpu, 0)`이 출력돼야 한다.

### 3.5. 사용 가능한 CLI(mlx-lm v0.31.3, 17개)

- `mlx_lm.generate`: 단발 텍스트 생성
- `mlx_lm.server`: OpenAI 호환 HTTP 서버
- `mlx_lm.chat`: 대화형 REPL
- `mlx_lm.convert`: 모델 양자화 변환
- `mlx_lm.lora`: LoRA 파인튜닝
- `mlx_lm.evaluate`: 벤치마크 평가
- 기타: awq, dwq, gptq, fuse, manage, perplexity, share, upload, cache_prompt, benchmark, dynamic_quant

### 3.6. uv tool 방식의 이점

- 다른 ML 도구(vllm, llama-cpp-python 등)와 transformers 버전 충돌을 회피한다
- 제거 시 의존성까지 깔끔하게 정리한다(`uv tool uninstall mlx-lm`)
- mlx-lm 버전 업그레이드가 다른 도구에 영향을 주지 않는다

## 4. Qwen 3.6 모델 선택(Dense vs MoE)

학습과 에이전트 프레임워크 구현 목적에 맞게 Dense와 MoE를 함께 두 종류 운영한다.

### 4.1. Qwen 3.6 라인업(2026년 4월 기준)

- Qwen3.6-Max-Preview(2026-04-20): 클로즈드 API, 6개 코딩 벤치 1위, 260K 컨텍스트
- Qwen3.6-27B(2026-04-22): 오픈웨이트 Dense, Apache 2.0, 262K 네이티브 / 1M 확장
- Qwen3.6-35B-A3B: 오픈웨이트 MoE(활성 3B), 262K 네이티브 / 1M 확장

### 4.2. 메인 모델: unsloth/Qwen3.6-27B-UD-MLX-6bit

- 타입: Dense 27B
- 양자화: Unsloth Dynamic 6bit
- 디스크 / 메모리 가중치: 약 22GB
- 용도: 진지한 동작 검증, ReAct 결정 추적, 품질 비교 기준점

### 4.3. 서브 모델: unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit

- 타입: MoE(총 35B, 활성 3B)
- 양자화: Unsloth Dynamic 4bit
- 디스크 / 메모리 가중치: 약 19GB
- 용도: 빠른 반복 디버깅, 프롬프트 튜닝, 대량 테스트

### 4.4. Dense vs MoE 비교

| 항목 | 27B Dense 6bit | 35B-A3B 4bit |
|------|----------------|---------------|
| 활성 파라미터 | 27B 전체 | 3B만 |
| 토큰 생성 속도 | 15-25 tok/s | 50-80 tok/s |
| 행동 일관성 | 높음(결정적) | 라우팅 비결정성 있음 |
| 디버깅 용이성 | 우수 | 추적 어려움 |
| 코딩 벤치 | 더 강함 | 약간 낮음 |

Dense를 메인으로 선택한 이유는 아래와 같다. MoE는 expert routing 때문에 같은 입력에도 미묘하게 다른 응답이 나온다. 에이전트 디버깅에서 왜 이 결정을 했는지 추적할 때 라우팅 비결정성이 노이즈로 작용한다.

MoE를 서브로 두는 이유는 같은 에이전트 코드를 두 모델에 번갈아 돌려보면 Dense vs MoE의 행동 차이가 가장 큰 학습 포인트가 되기 때문이다.

### 4.5. Qwen 3.6의 학습 가치

- Thinking Preservation: 멀티턴 대화에서 `<think>` 블록의 reasoning trace를 보존한다
- Tool calling 안정성: Hermes-style tool use로 학습되어 OpenAI 호환 함수 호출이 안정적이다
- Agentic 코딩 강화: SWE-bench Verified 73.4%를 기록한다

### 4.6. 두 모델 동시 운용

48GB 통합 메모리에서 두 모델(22GB + 19GB = 41GB)을 동시에 로드하는 것은 불가능하다. 디스크에는 둘 다 두고 서버 재시작으로 메모리 스왑하는 방식으로 비교한다.

## 5. 양자화 비교

양자화 비트수와 양자화 방식 두 축에서 트레이드오프를 분석한다.

### 5.1. 비트수별 메모리(Qwen 3.6 27B 기준)

| 양자화 | 가중치 메모리 | KV 포함(8K) | KV 포함(32K) | 48GB 적합도 |
| ---- | ------- | --------- | ---------- | ----------- |
| 4bit | 15GB | 18-22GB | 23-27GB | 여유 있음 |
| 6bit | 22GB | 24-25GB | 30-32GB | 베스트 |
| 8bit | 28GB | 32-38GB | 40GB+ | 빠듯, swap 위험 |

### 5.2. 비트수 선택 가이드

- 8bit는 풀프리시전과 사실상 동일한 품질이지만 macOS swap이 시작될 위험이 있어 학습 사이클에 치명적이다
- 4bit는 양자화 노이즈가 측정 가능한 수준이다. 메인으로 쓰면 응답 품질 저하를 모델 한계로 오해할 수 있다
- 6bit가 최적점이다. 메모리 22GB이며 Unsloth UD 6bit는 8bit와 사실상 무의미한 품질 차이를 보인다

### 5.3. 균일 양자화 vs Dynamic 양자화

mlx-community(균일 양자화)는 아래 특성을 가진다.

- 모든 레이어를 같은 비트로 변환한다
- mlx-lm 내장 도구(`mlx_lm.convert`)로 생성한다
- 가장 표준적이고 검증된 방식이다

unsloth UD(Dynamic 양자화)는 아래 특성을 가진다.

- 레이어 중요도에 따라 다른 비트를 적용한다
- 어텐션, embedding 등 핵심 레이어는 높은 비트(8bit)로 유지한다
- 덜 중요한 레이어는 낮은 비트(4-5bit)로 적용한다
- 평균 비트수는 동일하지만 품질 손실은 더 작다

Dynamic 양자화 이점이 큰 조합은 아래와 같다.

- Dense 모델 + 낮은 비트(4-6bit)에서 큰 이점이 있다
- MoE 모델 + 낮은 비트는 일부 이점이 있다(어차피 일부 expert만 활성화된다)
- 8bit 이상에서는 차이가 미미하다

### 5.4. 두 제공자 비교(Qwen3.6-27B 6bit)

| 빌드 | 양자화 방식 | 품질 | 메모리 |
|------|-------------|------|--------|
| `mlx-community/Qwen3.6-27B-6bit` | 균일 6bit | 표준 | 22GB |
| `unsloth/Qwen3.6-27B-UD-MLX-6bit` | Dynamic 6bit | 더 좋음 | 22GB |

### 5.5. 결론

학습과 에이전트 프레임워크 구현 목적에서 가장 균형 잡힌 선택은 unsloth UD-MLX-6bit이다.

- 메모리 마진을 확보한다(22GB로 KV 캐시 여유)
- 8bit 수준의 품질을 유지한다(Dynamic 양자화)
- 모델의 실제 capability를 학습 자료로 활용할 수 있다

## 6. 추론 서버 옵션

OpenAI 호환 HTTP 서버로 모델을 띄워서 본인 에이전트 프레임워크를 클라이언트로 붙인다.

### 6.1. 빌트인 서버(mlx-lm v0.31.3 포함)

실행 방법은 아래와 같다.

```bash
mlx_lm.server \
  --model unsloth/Qwen3.6-27B-UD-MLX-6bit \
  --port 8080
```

지원 엔드포인트는 아래와 같다.

- `POST /v1/chat/completions`(스트리밍 포함)
- `POST /v1/completions`
- `GET /v1/models`

지원 기능은 아래와 같다.

- OpenAI Chat Completions API 호환
- Streaming(SSE)
- Function calling / tool use
- Chat template 자동 적용(Qwen Hermes-style 인식)

호출 예시는 아래와 같다.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="unsloth/Qwen3.6-27B-UD-MLX-6bit",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### 6.2. 서드파티 서버: mlx-openai-server(cubist38, FastAPI 기반)

빌트인 대비 추가 기능은 아래와 같다.

- 멀티 모델 동시 서빙(YAML config)
- 모델별 표준화된 tool call 파서(qwen3, qwen3_5, qwen3_coder, gemma4 등)
- Reasoning parser 분리(Qwen `<think>` 블록을 `reasoning_content` 필드로 자동 분리)
- 비전 + 텍스트 멀티모달 지원

설치는 아래와 같다.

```bash
uv tool install mlx-openai-server
```

### 6.3. 학습 단계별 선택

- 초기에는 빌트인 서버를 사용한다. tool call raw 출력이 학습 자료가 된다
- 중기에는 빌트인 서버 raw tool call로 본인 파서를 작성한다. ReAct, Reflection 패턴 구현을 학습한다
- 후기에는 mlx-openai-server로 본인 파서가 표준과 일치하는지 검증한다

### 6.4. 다른 옵션들

| 도구 | 특징 | 학습용 적합도 |
|------|------|---------------|
| `mlx_lm.server`(빌트인) | OpenAI 호환, 단일 모델, 표준 | 시작점 |
| mlx-openai-server | 멀티 모델, 표준화 파서, reasoning 분리 | 검증용 |
| LM Studio | GUI 앱, 모델 매니저 | GUI 선호 시 |
| FastMLX | 경량 FastAPI 래퍼 | 단순함 우선 |
| vllm-mlx | 연속 배칭, 400+ tok/s, MCP 지원 | 프로덕션 |

### 6.5. 결론 동선

- 1단계: 빌트인 `mlx_lm.server`로 시작한다
- 2단계: curl / OpenAI SDK로 단일 tool call을 검증한다
- 3단계: Hermes raw 출력 분석 후 본인 tool call 파서를 작성한다
- 4단계: ReAct 등 에이전트 패턴을 구현한다
- 5단계: mlx-openai-server로 본인 파서를 검증한다

## 7. 실행 가이드(설치 검증부터 트러블슈팅까지)

mlx-lm 설치부터 두 모델 API 호출까지 단계별 명령어를 정리한다.

### 7.1. 환경 검증

```bash
mlx_lm.server --help
uv tool run --from mlx-lm python -c "import mlx.core as mx; print(mx.metal.is_available(), mx.default_device())"
uv tool list
```

### 7.2. 메인 모델 다운로드(Qwen 3.6 27B Dense 6bit, 약 22GB)

```bash
mlx_lm.generate --model unsloth/Qwen3.6-27B-UD-MLX-6bit --prompt "안녕, 너는 누구야?" --max-tokens 100
```

진행 모니터링은 아래 명령으로 한다.

```bash
du -sh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-27B-UD-MLX-6bit
```

완료 확인은 아래 명령으로 한다.

```bash
ls -lh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-27B-UD-MLX-6bit/snapshots/*/
```

### 7.3. 서브 모델 다운로드(Qwen 3.6 35B-A3B MoE 4bit, 약 19GB)

```bash
mlx_lm.generate --model unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit --prompt "안녕, 너는 누구야?" --max-tokens 100
du -sh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-35B-A3B-UD-MLX-4bit
```

### 7.4. 서버 실행(한 번에 하나만)

```bash
# 메인 모델
mlx_lm.server --model unsloth/Qwen3.6-27B-UD-MLX-6bit --port 8080

# 서브 모델 (메인 종료 후)
mlx_lm.server --model unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit --port 8080
```

`Starting server on 127.0.0.1:8080`이 출력되면 성공이다. 모델 스왑은 Ctrl+C로 메모리를 해제한 후 다른 모델로 같은 명령을 실행한다.

### 7.5. API 호출 테스트(curl)

서버가 실행 중인 상태에서 다른 터미널에서 호출한다. 아래 예시는 메인 모델 기준이고 서브 모델로 교체했으면 `model` 값을 `unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit`로 바꾼다. 경로는 정확 일치 비교라 끝에 슬래시나 쿼리 스트링이 붙으면 404가 난다.

기본 chat completion은 아래와 같다.

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [{"role": "user", "content": "Hello"}],
  "max_tokens": 50
}'
```

모델 목록은 아래와 같다.

```bash
curl http://localhost:8080/v1/models
```

스트리밍은 아래와 같다.

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [{"role": "user", "content": "1부터 10까지 세어줘"}],
  "stream": true,
  "max_tokens": 100
}'
```

### 7.6. Tool Calling 테스트

단일 tool call은 아래와 같다.

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [{"role": "user", "content": "서울 날씨 알려줘"}],
  "tools": [{
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "Get weather for a city",
      "parameters": {
        "type": "object",
        "properties": {
          "city": {"type": "string", "description": "City name"}
        },
        "required": ["city"]
      }
    }
  }],
  "max_tokens": 200
}'
```

응답에 `tool_calls` 필드가 포함돼야 한다.

멀티턴 tool call(결과 반환 후 최종 응답)은 아래와 같다.

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [
    {"role": "user", "content": "서울 날씨 알려줘"},
    {"role": "assistant", "content": null, "tool_calls": [{
      "id": "call_001",
      "type": "function",
      "function": {"name": "get_weather", "arguments": "{\"city\": \"Seoul\"}"}
    }]},
    {"role": "tool", "tool_call_id": "call_001", "content": "{\"temp\": 18, \"condition\": \"맑음\"}"}
  ],
  "max_tokens": 200
}'
```

### 7.7. OpenAI SDK 호출(Python)

```bash
uv tool run --from openai python -c "
from openai import OpenAI
client = OpenAI(base_url='http://localhost:8080/v1', api_key='not-needed')
response = client.chat.completions.create(
    model='unsloth/Qwen3.6-27B-UD-MLX-6bit',
    messages=[{'role': 'user', 'content': '안녕'}],
    max_tokens=50
)
print(response.choices[0].message.content)
"
```

### 7.8. 디스크 사용량 / 모델 제거

두 모델 다운로드 후 총 사용량은 약 41GB이다.

```bash
du -sh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-*
rm -rf ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-27B-UD-MLX-6bit
rm -rf ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-35B-A3B-UD-MLX-4bit
```

### 7.9. 트러블슈팅

`command not found: mlx_lm.server` 오류는 PATH에 `~/.local/bin`이 등록되지 않은 경우 발생한다.

```bash
uv tool update-shell
source ~/.zshrc
```

다운로드 중단 후 재개는 `mlx_lm.generate` 또는 `mlx_lm.server`를 다시 실행하면 자동으로 이어받는다(huggingface_hub의 resume).

메모리 부족(OOM) 시에는 다른 앱을 종료하거나 컨텍스트를 짧게 잡는다. 8K 컨텍스트로 시작하기를 권장한다.

서버 포트 충돌은 아래 명령으로 처리한다.

```bash
lsof -i :8080
kill -9 <PID>
```

POST 요청에 404가 떨어지면 경로를 다시 본다. mlx_lm.server는 경로를 정확 일치 비교한다. 끝에 슬래시(`/v1/chat/completions/`), 쿼리 스트링(`?...`), 오타가 있으면 404가 난다. 지원 경로는 `/v1/chat/completions`, `/chat/completions`, `/v1/completions`(text completion)뿐이다.

POST 요청에 411 응답이 떨어지면 `Content-Length` 헤더가 빠진 경우다. curl은 자동으로 붙여주지만 직접 소켓을 다룰 때는 명시한다.

## 8. 학습 로드맵

에이전트 프레임워크 학습과 구현을 위한 단계별 로드맵은 아래와 같다.

1. 환경 구축
   - uv tool install mlx-lm 완료
   - Metal GPU 동작 확인 완료
   - Qwen 3.6 27B Dense 6bit 다운로드
2. 단일 모델 검증
   - mlx_lm.generate로 첫 응답 확인
   - mlx_lm.server를 띄움
   - curl 또는 OpenAI SDK로 호환 API 호출
3. Tool calling 학습
   - 단일 tool call 동작 확인
   - Hermes 포맷 raw 응답 분석
   - 직접 tool call 파서 작성
4. 에이전트 패턴 구현
   - ReAct 루프 구현
   - Reflection 패턴 적용
   - Plan-and-Execute 패턴 적용
5. 비교 학습
   - 35B-A3B로 같은 코드를 돌려서 동작 확인
   - Dense vs MoE 행동 차이 관찰
   - mlx-openai-server로 본인 파서 검증

학습 포인트는 아래와 같다.

- Qwen의 `<think>` 블록을 활용한 reasoning 가시화
- Dense의 결정성과 MoE의 라우팅 차이 체감
- Tool call 포맷(Hermes 스타일) 직접 파싱 경험
- KV 캐시 동작과 멀티턴 비용 이해

다음 단계(학습 로드맵 완료 후)는 아래와 같다.

- LangGraph 등 기존 프레임워크와 본인 구현 비교
- MCP(Model Context Protocol) 서버 직접 작성
- 멀티 에이전트 협업 패턴 실험
- 도메인 특화 에이전트(코드 리뷰, 문서 작성 등) 구현

# 참고

- <https://github.com/ml-explore/mlx>
- <https://github.com/ml-explore/mlx-lm>
- <https://huggingface.co/Qwen>
- <https://huggingface.co/unsloth>
