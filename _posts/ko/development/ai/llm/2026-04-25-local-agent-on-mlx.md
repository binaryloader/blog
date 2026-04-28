---
title: "[LLM] Apple Silicon에서 MLX로 로컬 LLM 환경 구축하기"
ref: local-agent-on-mlx
excerpt: "Apple Silicon MacBook Pro M5 Pro 환경에서 MLX와 Qwen 3.6 모델로 로컬 LLM 환경을 구축하고 에이전트 프레임워크 연구를 위한 사전 준비를 정리한다."
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

Apple Silicon MacBook Pro M5 Pro 환경에서 MLX와 Qwen 3.6 모델로 로컬 LLM 환경을 구축하고 에이전트 프레임워크 연구를 위한 사전 준비를 정리한다.

# 정리

## 1. 연구 목적과 환경

연구 목적은 아래와 같다.

- 에이전트 프레임워크 직접 구현(ReAct, Reflection, Plan-and-Execute)
- 툴 호출(Tool calling) raw 포맷 이해와 파서 작성
- Dense와 MoE 모델의 행동 차이 비교 연구
- Qwen의 `<think>` 블록을 활용한 reasoning 패턴 관찰

환경 요약은 아래와 같다.

- MacBook Pro M5 Pro
- 통합 메모리 48GB
- macOS 26.4.1
- mlx-lm v0.31.3(uv tool로 격리 설치)

핵심 결정 요약은 아래와 같다.

- 메인 모델은 `unsloth/Qwen3.6-27B-UD-MLX-6bit`(Dense, 약 22GB)이다
- 서브 모델은 `unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit`(MoE, 약 19GB)이다
- 서버는 빌트인 `mlx_lm.server`로 시작하고 연구 진행 후 `mlx-openai-server`로 검증한다
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

모델 가중치는 20-22GB 이하로 잡아야 멀티턴 에이전트(8K-32K 컨텍스트)에서도 KV 캐시까지 안정적으로 들어간다. 28GB 이상의 8bit 양자화는 swap 발생 위험이 있어 연구 단계에서는 추천하지 않는다.

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

연구와 에이전트 프레임워크 구현 목적에 맞게 Dense와 MoE를 함께 두 종류 운영한다.

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

MoE를 서브로 두는 이유는 같은 에이전트 코드를 두 모델에 번갈아 돌려보면 Dense vs MoE의 행동 차이가 가장 큰 연구 포인트가 되기 때문이다.

### 4.5. Qwen 3.6의 연구 가치

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

- 8bit는 풀프리시전과 사실상 동일한 품질이지만 macOS swap이 시작될 위험이 있어 연구 사이클에 치명적이다
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

연구와 에이전트 프레임워크 구현 목적에서 가장 균형 잡힌 선택은 unsloth UD-MLX-6bit이다.

- 메모리 마진을 확보한다(22GB로 KV 캐시 여유)
- 8bit 수준의 품질을 유지한다(Dynamic 양자화)
- 모델의 실제 capability를 연구 자료로 활용할 수 있다

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

### 6.3. 연구 단계별 선택

- 초기에는 빌트인 서버를 사용한다. tool call raw 출력이 연구 자료가 된다
- 중기에는 빌트인 서버 raw tool call로 본인 파서를 작성한다. ReAct, Reflection 패턴 구현을 연구한다
- 후기에는 mlx-openai-server로 본인 파서가 표준과 일치하는지 검증한다

### 6.4. 다른 옵션들

| 도구 | 특징 | 연구용 적합도 |
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

## 8. 종합 벤치마크(Qwen3.6 27B 6bit)

mlx_lm.server에 `unsloth/Qwen3.6-27B-UD-MLX-6bit` 모델을 올린 상태에서 6가지 시나리오(길이 스트레스, 멀티턴, 툴 콜, 딥 리즈닝, 일반 능력, GPU 스루풋)로 메모리 한계와 성능을 측정한다. 측정 머신은 Apple Silicon, 통합 메모리 48GB이다.

### 8.1. 환경

측정 환경은 아래와 같다.

- 모델: `unsloth/Qwen3.6-27B-UD-MLX-6bit`(Dense 27B, 6bit 양자화)
- 가중치 디스크 크기: 약 22GB
- 서버: `mlx_lm.server` v0.31.3, port 8080
- 시스템: Apple Silicon, 통합 메모리 48GB, macOS Darwin 25.4

측정 도구는 아래와 같다.

- 프로세스 RSS: `ps -o rss=`
- 시스템 메모리: `vm_stat`(Pages free / inactive / wired / Swapouts)
- HTTP 호출: 표준 라이브러리 `urllib.request`
- 측정 스크립트: `/tmp/mlx_stress.py`, `/tmp/mlx_extra.py`, `/tmp/mlx_gpu.py`

### 8.2. RSS와 wired 메모리의 차이

측정 초반에 RSS가 2.8GB로 나와 의아했는데 원인은 macOS의 mmap + 메모리 압축 동작이다.

- mlx_lm은 가중치를 `mmap`으로 로드한다. 페이지가 실제로 접근되어야 물리 메모리에 올라간다
- macOS는 idle 페이지를 압축하여 보관한다. RSS는 압축된 메모리를 반영하지 않을 수 있다
- 실제 GPU 점유는 `Pages wired down`(wired)이 더 정확하다. MLX는 Metal 텐서를 wired 페이지로 잡는다
- 측정 결과 idle 시 wired 3.23GB → 모델 활성 시 wired 32.71GB로 약 29.5GB 추가된다. 이 값이 실제 GPU 메모리 점유량이다

이런 이유로 본 측정에서는 wired 메모리를 주된 메모리 지표로 사용한다.

### 8.3. 길이 스트레스(prompt 토큰 점진 증가)

단일 호출에서 prompt와 max_tokens를 점진적으로 늘려 길이 한계를 측정한다.

| target prompt | actual prompt | output | elapsed | RSS peak | swap Δ | min free+inactive | finish |
|---------------|---------------|--------|---------|----------|--------|-------------------|--------|
| 128 | 222 | 128 | 15.7s | 2.80GB | 0.0GB | 7.87GB | length |
| 512 | 796 | 422 | 50.8s | 2.84GB | 0.0GB | 7.51GB | stop |
| 2048 | 3089 | 420 | 55.9s | 2.84GB | 0.0GB | 7.58GB | stop |
| 4096 | 6147 | 597 | 83.2s | 2.86GB | 0.0GB | 5.65GB | stop |
| 8192 | 12264 | 339 | 69.5s | 2.86GB | 0.0GB | 4.96GB | stop |
| 16384 | 24492 | 376 | 200.6s | 1.94GB | 2.34GB | 3.11GB | stop |
| 24576 | - | - | - | - | thrashing | <1GB | (중단) |

핵심 관찰은 아래와 같다.

- 12K prompt까지는 호출당 50-90초로 안정적이다(idle 후 첫 호출은 가중치 paging-in으로 더 걸린다)
- 24K 실제 prompt(target 16384)에서 elapsed가 200초로 급증하고 swap 2.3GB가 발생한다. 처리 한계 신호다
- target 24576 시점에서 시스템 free 0.5GB, wired 25GB, swap이 5초당 1.5-2GB 누적되며 thrashing이 발생한다. 사실상 처리 불가능하다

### 8.4. 멀티턴(5턴 누적 대화)

TCA 패턴을 주제로 한 5턴 대화로 측정한다. 매 턴 누적된 컨텍스트로 호출한다.

| turn | prompt | completion | total | elapsed | RSS peak | swap Δ |
|------|--------|------------|-------|---------|----------|--------|
| 1 | 28 | 400 | 428 | 46.1s | 18.00GB | 0.00GB |
| 2 | 191 | 400 | 591 | 44.5s | 18.02GB | 0.03GB |
| 3 | 615 | 400 | 1015 | 45.5s | 18.02GB | 0.00GB |
| 4 | 1036 | 400 | 1436 | 46.2s | 18.02GB | 0.00GB |
| 5 | 1457 | 400 | 1857 | 45.4s | 18.02GB | 0.00GB |

핵심 관찰은 아래와 같다.

- 5턴 누적 1857 토큰 수준에서 RSS 18GB로 매우 안정적이다
- 턴 간 elapsed가 거의 동일하다(44-46s). 컨텍스트 1500 토큰 수준에서는 prefill 부담이 미미하다
- 멀티턴 5턴 누적 swap 0.03GB로 사실상 0이다

### 8.5. 툴 콜(function calling)

`get_weather` 함수를 등록하고 "서울이랑 도쿄 날씨 비교"를 요청한다. 툴 호출 → 결과 반환 → 최종 응답까지 전체 사이클을 측정한다.

| step | stage | elapsed | RSS peak |
|------|-------|---------|----------|
| 1 | tool_call_request | 37.0s | 18.02GB |
| 2 | final_answer | 17.9s | 18.02GB |

핵심 관찰은 아래와 같다.

- 1단계에서 모델이 두 도시를 병렬 tool_call로 호출한다(parallel function calling 지원). 단일 호출에 두 개의 `tool_calls`가 함께 나온다
- 2단계에서 tool 결과 두 개를 messages에 넣어 호출하면 자연스러운 비교 응답이 생성된다
- 응답: "서울 18도 맑음, 도쿄 22도 맑음, 도쿄가 4도 더 따뜻"
- mlx_lm.server v0.31.3에서 Qwen3.6 툴 콜은 정상 동작한다

### 8.6. 딥 리즈닝(thinking mode)

좌석 추론 퍼즐("어머니 맞은편에 앉은 사람은?")로 측정한다. `chat_template_kwargs`로 thinking 모드를 제어한다.

| mode | elapsed | RSS peak | reasoning 필드 |
|------|---------|----------|----------------|
| default | 113.5s | 18.10GB | O |
| `enable_thinking=True` | 112.5s | 18.10GB | O |
| `enable_thinking=False` | 26.3s | 18.09GB | X |

핵심 관찰은 아래와 같다.

- Qwen3.6은 default가 이미 thinking on 상태다(reasoning 필드를 자동으로 채운다)
- thinking_off로 전환하면 4.3배 빨라진다. 단순 응답이나 즉답이 필요한 경우 권장한다
- thinking_on 응답은 reasoning 필드에 사고 과정이 들어가고 content 필드에 최종 답이 분리되어 들어온다
- 메모리 사용량은 모드와 무관하다

### 8.7. 일반 능력(코드/수학/한국어/번역)

4개 짧은 케이스로 모델 일반 능력을 빠르게 점검한다.

| case | elapsed | RSS peak | 비고 |
|------|---------|----------|------|
| code(Python deep merge) | 67.1s | 18.10GB | thinking process 포함 응답 |
| math(1-100 7배수 합) | 67.4s | 18.10GB | 정상 풀이 |
| korean_reasoning(비문법 교정) | 68.4s | 18.10GB | 자연스러운 교정 |
| translation(한→영/일) | 67.1s | 18.10GB | 자연스러운 번역 |

핵심 관찰은 아래와 같다.

- 4개 케이스 모두 elapsed가 67-68초로 일정하다. max_tokens 600 기준 약 9 tok/s 디코드 속도와 일치한다
- 응답 품질은 기본 합격선이다. 별도 정량 평가는 수행하지 않는다
- 한국어 추론과 번역에서 명백한 오류는 없다

### 8.8. GPU/스루풋

prefill과 decode 속도를 분리해서 측정한다.

| label | prompt | completion | elapsed | total tok/s | decode tok/s | wired before | wired after |
|-------|--------|------------|---------|-------------|--------------|--------------|-------------|
| baseline | 13 | 50 | 6.4s | 9.9 | 7.9 | 3.23GB | 32.71GB |
| medium | 24 | 400 | 44.5s | 9.5 | 9.0 | 32.71GB | 32.44GB |
| long_decode | 25 | 1500 | 163.7s | 9.3 | 9.2 | 32.44GB | 32.72GB |
| long_prompt | 1222 | 800 | 90.4s | 22.4 | 8.8 | 32.72GB | 32.79GB |

핵심 관찰은 아래와 같다.

- 디코드 스루풋이 일관되게 8-9 tok/s로 나온다(M 시리즈 27B 6bit 기대치)
- baseline 첫 호출에서 wired가 3.23GB → 32.71GB로 점프한다. 모델 가중치 + Metal 버퍼가 wired에 잡힌다
- 이후 호출은 wired 32.4-32.8GB에서 안정한다. 컨텍스트 길이에 따라 KV 캐시가 0.2-0.3GB 변동한다
- long_prompt의 total 22.4 tok/s는 prefill 1222 토큰을 매우 빠르게 처리한 효과다. prefill은 30-40 tok/s 수준으로 추정된다(decode 대비 4-5배 빠름)
- 사용자 체감 속도(첫 토큰 latency, 디코드 속도) 기준 8-9 tok/s가 이 머신의 안정 운영점이다

### 8.9. 스트리밍(TTFT, ITL)

SSE 스트리밍 응답을 직접 파싱해 첫 토큰까지 시간(TTFT)과 토큰 간 지연(ITL)을 측정한다.

| label | tokens | elapsed | TTFT | ITL avg | ITL p50 | ITL p95 | ITL max |
|-------|--------|---------|------|---------|---------|---------|---------|
| short(cold) | 100 | 15.7s | 4.77s | 110.6ms | 110.1ms | 114.2ms | 121.9ms |
| medium(warm) | 392 | 44.8s | 0.68s | 112.8ms | 110.4ms | 114.0ms | 332.0ms |
| long(warm) | 786 | 88.8s | 0.71s | 112.2ms | 109.7ms | 115.4ms | 329.9ms |

핵심 관찰은 아래와 같다.

- TTFT는 cold(가중치 page-in 직후) 4.77s, warm 약 0.7s로 차이가 크다
- ITL p50이 약 110ms로 매우 일정하다. 디코드 9 tok/s와 일치한다
- ITL p95도 115ms 이내로 분포가 좁다
- 드물게 330ms 스파이크가 발생한다. UI에서 한 박자 끊기는 정도다
- 사용자 체감 응답성은 warm 상태에서 양호하다. 첫 호출만 5초 가까이 걸리는 점은 챗 UX에서 사전 워밍이 필요하다

### 8.10. 결론

#### 8.10.1. 메모리 한계

- 모델 활성 시 wired 약 33GB가 기본 점유량이다. 통합 메모리 48GB 중 15GB가 여유다
- 안전 운영 컨텍스트는 약 12K 실제 prompt 토큰이다. 그 이상은 KV 캐시 압박으로 elapsed가 급증한다
- 절대 한계는 24K 실제 prompt 부근이다. 그 이상은 thrashing으로 사실상 불가능하다
- 멀티턴 5턴(누적 약 1.8K 토큰)은 메모리 부담이 거의 없다

#### 8.10.2. 성능

- 디코드 스루풋이 8-9 tok/s로 안정적이다. ITL p50 110ms로 분포가 좁다
- prefill은 30-40 tok/s로 추정된다. 짧은 프롬프트에서는 prefill 비중이 작아 응답 시간이 디코드 길이에 비례한다
- TTFT는 cold 약 4.8초(가중치 page-in), warm 약 0.7초다
- 첫 호출은 가중치 paging-in으로 추가 30초 정도 더 걸린다. 자주 호출되는 워크로드에서는 무시 가능하다

#### 8.10.3. 기능

- Tool calling은 정상 동작하고 parallel function calling을 지원한다
- Reasoning은 default로 thinking on 상태다. 명시적으로 `enable_thinking=False`로 끄면 4.3배 가속한다
- 한국어/영어/일본어 기본 품질이 합격선이다

### 8.11. 권장 사용 가이드라인

- 일반 챗봇/QA(2-4K 컨텍스트)는 무난하다. 디코드 9 tok/s 수준으로 응답한다
- 멀티턴 대화(누적 약 10K까지)는 안정적이다
- 긴 문서 요약(prompt 8-12K)은 가능하다. 응답이 60-90초 걸린다
- 긴 문서 분석(prompt 16K+)은 가능하지만 응답이 200초 이상 걸리고 swap이 발생하기 시작한다
- 초장문(20K+)은 권장하지 않는다. thrashing 위험이 있다
- 즉답형 워크로드는 `chat_template_kwargs.enable_thinking=False`로 4배 가속한다
- 다른 무거운 앱(Xcode 빌드, 가상머신 등)을 동시 실행할 때는 더 좁은 컨텍스트로 운영하기를 권장한다

### 8.12. 측정 한계와 차후 측정 항목

- 동시 요청(concurrent inference)은 미측정이다. mlx_lm.server는 단일 큐로 처리하므로 큰 의미는 없을 가능성이 있다
- powermetrics 기반 GPU 활용률/전력/온도는 sudo가 필요해 미측정이다. 별도 세션에서 진행할 수 있다
- 양자화 비교(4bit vs 6bit vs 8bit)는 양자화 비교 노트에서 다룬다
- 35B-A3B MoE 4bit 모델 동일 시나리오 비교는 후속으로 측정할 예정이다

## 9. 마치며

이번 환경 구축과 벤치마크를 거치면서 정리할 수 있는 결론은 분명하다. 통합 메모리 48GB의 Apple Silicon Mac에서 6bit 양자화된 27B Dense 모델은 실용 수준으로 상시 띄워둘 수 있다. 다만 어디까지 맡길 수 있을지에는 선이 있고 그 선을 정확히 인식해야 실망 없이 활용할 수 있다.

이 환경이 가장 잘 맞는 영역은 개인 워크플로 안에서의 가벼운 문서 작업이다. 머릿속에 흩어진 메모를 한 페이지로 정리하기, 거칠게 적어둔 초안을 다듬기, 회의록에서 핵심만 추리기, 한국어/영어/일본어 사이의 단락 단위 번역, 짧은 이메일이나 README 초안 작성 같은 작업이 여기에 해당한다. 디코드 9 tok/s에 ITL p50 110ms 분포는 사람이 읽어 내려가는 속도와 비슷해 결과를 기다리며 답답해질 일이 거의 없고 멀티턴 누적 약 1.8K 토큰까지는 메모리 부담 없이 자연스럽게 대화가 이어진다.

클라우드 API에 의존하지 않고 로컬에서 처리한다는 점은 단순한 비용 절감 이상의 의미가 있다. 개인 정보가 들어 있는 메모, 비공개 문서, 작업 중인 글의 초안처럼 외부로 내보내기 부담스러운 텍스트를 안심하고 다룰 수 있다. 항공기 안이나 회선이 불안정한 상황에서도 동일한 워크플로가 끊기지 않는다는 부수적인 장점도 따라온다. 기본적으로 노트북 한 대 안에서 모든 처리가 끝나기 때문에 데이터 유출 경로 자체가 없다.

반대로 이 환경에 맞지 않는 영역도 분명하다. 긴 문서 한 편을 통째로 읽고 분석하는 작업(prompt 16K 이상)은 응답이 200초를 넘어가고 swap이 시작되어 실용성이 빠르게 떨어진다. 동시에 수십 명이 붙는 챗봇 서비스, 대규모 코드베이스 자동 리팩터링, 긴 컨텍스트 기반의 무거운 RAG 같은 워크로드는 클라우드 API의 영역으로 두는 편이 맞다. 에이전트로 자동화한다고 해도 디코드 9 tok/s는 상호작용형 도구로는 충분하지만 백그라운드에서 수만 토큰을 토해내야 하는 일감에는 답답하다.

요약하자면 이 환경은 개인의 글 정리와 작성을 거드는 도구로 두는 것이 가장 적합하다. 모든 작업을 떠넘기지 않고 가장 잘 맞는 작업만 맡기면 클라우드에 매번 보내지 않아도 충분히 매끄럽게 굴러간다. 그 정도 기대치에서 출발하면 6bit 양자화 27B Dense는 의외로 오래 함께 쓰게 되는 도구라는 결론에 도달한다.

# 참고

- <https://github.com/ml-explore/mlx>
- <https://github.com/ml-explore/mlx-lm>
- <https://huggingface.co/Qwen>
- <https://huggingface.co/unsloth>
