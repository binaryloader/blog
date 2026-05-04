---
title: "[Agent] CLI / MCP로 동작하는 한국인 합성 페르소나 인터뷰 도구 korea-persona-interview"
ref: korea-persona-interview
excerpt: "사이드 프로젝트로 만든 한국인 합성 페르소나 인터뷰 자동화 도구 korea-persona-interview를 정리한다. NVIDIA Nemotron-Personas-Korea 데이터셋 위에 멀티턴 인터뷰와 자동 follow-up 페르소나 깨짐 감지를 얹어 사업 가설을 빠르게 검증한다. CLI / MCP server / MCP orchestrator 3개 진입점이 동일한 코어를 공유하도록 설계한 패턴도 함께 다룬다."
date: 2026-05-03T00:00+09:00
last_modified_at: 2026-05-04T19:26+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/korea-persona-interview.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/korea-persona-interview.png"
categories:
  - Development
  - AI
  - Agent
tags:
  - Agent
  - LLM
  - MCP
  - OpenAI
  - Anthropic
  - MLX
  - Korean Persona
  - Nemotron
  - User Research
  - Side Project
  - Python
depth:
  - title: "Development"
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "Agent"
    url: /ko/development/ai/agent/
credits:
  planning: Claude
  research: Claude
  drafting: Claude
  editing: Claude
  review: [Claude, binaryloader]
  translation: Claude
  thumbnail: Claude
  publishing: Claude
---

# 개요

사이드 프로젝트로 만든 한국인 합성 페르소나 인터뷰 자동화 도구 korea-persona-interview를 정리한다. NVIDIA Nemotron-Personas-Korea 데이터셋 위에 멀티턴 인터뷰와 자동 follow-up 페르소나 깨짐 감지를 얹어 사업 가설을 빠르게 검증한다. CLI / MCP server / MCP orchestrator 3개 진입점이 동일한 코어를 공유하도록 설계한 패턴도 함께 다룬다.

# 정리

## 1. 사이드 프로젝트의 시작

사업 아이템 가설을 검증할 때 가장 부담스러운 단계는 사용자 인터뷰다. 모집과 일정 조율, 인터뷰 자체에 들어가는 시간, 답변을 의사결정에 쓸 수 있는 형태로 다듬는 후처리까지 합치면 한 가설에 며칠이 사라진다. 그래서 본격 인터뷰에 들어가기 전 1차 가설 필터로 쓸 합성 페르소나 도구가 필요했다. 실제 사람을 대체하려는 의도는 없다. 진짜 인터뷰에 데려갈 가설을 추리는 용도다.

LLM 한 모델에 페르소나를 묘사한 system prompt를 박고 N명에게 같은 질문을 던지는 토이 스크립트는 GitHub에서도 어렵지 않게 보인다. 다만 본 도구는 가설 검증이 목적이라 페르소나의 다양성과 답변 품질을 정량/정성 양쪽으로 가둘 장치가 필요했다. 페르소나 분포는 통계 기반으로 균형을 맞추고 답변은 페르소나 깨짐과 모호한 답변을 자동 검출해 follow-up을 던지는 구조다.

## 2. 도구 한 줄 정의와 전체 흐름

한 줄로 적으면 한국인 합성 페르소나 N명에게 사업 아이템 질문을 던지고 정량/정성 리포트를 받는 도구다. 사용자는 yaml에 사업 아이템 한 줄과 질문 5개 정도를 적고 CLI 한 명령으로 인터뷰와 리포트 생성을 함께 수행한다.

전체 흐름은 아래와 같다.

- 페르소나 데이터셋을 필터 DSL로 좁혀 N명을 시드 고정 샘플링한다
- 각 페르소나에게 멀티턴으로 질문 5개를 던지고 짧거나 모호한 답에는 자동 follow-up 1회를 추가한다
- 인터뷰 종료 후 별도 단일턴 호출로 답변을 구조화 요약 JSON으로 만든다
- 모든 페르소나의 응답을 합쳐 정량 점수, 가격 의향, 코호트별 분포를 마크다운 리포트로 출력한다

산출물은 `outputs/interview_{slug}_{timestamp}.json`에 페르소나별 messages와 raw 응답이 그대로 남고 같은 디렉토리에 사람이 읽을 마크다운 리포트가 생성된다. JSON에는 인터뷰 1건의 모든 turn과 retry, 토큰 사용량까지 들어가 있어 중간 결과를 다른 분석 스크립트로 재활용하기 쉽다.

## 3. 페르소나 데이터 - NVIDIA Nemotron-Personas-Korea

### 3.1. 데이터셋 구성과 컬럼

페르소나 원본은 NVIDIA가 2026-04-20에 공개한 Nemotron-Personas-Korea 데이터셋이다. 라이선스는 CC BY 4.0이라 attribution만 지키면 자유롭게 활용할 수 있다. 규모를 흔히 100만 페르소나로 줄여 쓰지만 정확히는 100만 레코드 규모다. 한 레코드당 7종의 자유 서술 페르소나 컬럼(professional, sports, arts, travel, culinary, family, persona)이 들어 있어 합치면 약 700만 페르소나에 해당한다. 본 도구는 한 레코드를 1명의 합성 인물로 본다.

핵심 컬럼은 인구 통계 약 11종에 자유 서술 페르소나 7종이 더해진 묶음이다. 인구 통계 축은 성별, 연령(19-99), 결혼 여부, 군 복무, 가구 형태(`family_type`은 39종 변형), 주거 유형(6종), 학력(7종), 전공, 직업, 시군구(252종 이상), 시도(17종)가 1차 자료다. country 컬럼도 포함되지만 본 데이터셋은 한국 단일값이라 필터링에 쓰지 않는다. 자유 서술 컬럼인 `persona`는 한 인물의 성향과 일상 톤이 자연어로 적혀 있어 system prompt에 그대로 주입하기 적합한 형태다.

### 3.2. 코호트 필터링과 샘플링

도구는 데이터셋 전체를 메모리에 올려도 되지만 대부분의 가설은 특정 코호트(예: 30대 서울 1인 가구 직장인)에 국한된다. 따라서 필터 DSL을 도입해 `--filter "age:25-39,region:서울특별시,gender:F,occupation_keyword:개발자"` 같은 한 줄로 표본을 좁힌다. `src/load_personas.py`의 `parse_filter`가 같은 키 OR, 다른 키 AND 결합 규칙으로 파싱하고 `load_and_sample`이 시드 고정 `random.Random(seed).sample`로 N명을 선택한다.

시드 고정은 동일 가설을 다시 돌렸을 때 같은 페르소나가 뽑혀 결과 비교가 의미 있도록 하기 위함이다. provider를 OpenAI에서 Anthropic으로 갈아끼웠을 때 페르소나가 다르면 답변 차이가 모델 차이인지 페르소나 차이인지 분리되지 않는다.

## 4. 인터뷰 흐름 설계

### 4.1. 멀티턴 + 인터뷰 종료 후 단일턴 구조화 요약

질문을 어떻게 묶어 보낼지가 도구 설계에서 가장 무겁게 다룬 결정이다. ADR-001에 후보 세 가지를 트레이드오프 표로 비교했다.

- 후보 A는 멀티턴이다. 질문을 1턴씩 보내고 messages 히스토리에 누적한다. 인터뷰가 끝나면 별도 system prompt로 같은 모델에게 messages 전체를 입력해 JSON 구조화 요약을 단일턴 생성한다
- 후보 B는 단일턴 번들이다. 질문 N개를 한 번에 묶어 보내고 모델이 한 응답에 모든 답을 자유 서술 + JSON으로 돌려준다
- 후보 C는 후보 B와 동일하게 한 번에 답을 받되 정성 인사이트만 별도 단일턴으로 생성한다

후보 A는 토큰과 시간이 약 1.8-2.5배 비싸지만 자동 follow-up과 페르소나 깨짐 감지를 답변 단위로 격리할 수 있다. 한 답이 오염되어도 나머지 4개는 살릴 수 있다는 점이 결정적이었다. 후보 B/C는 한 응답에 답이 섞여 있어 답별 격리가 본질적으로 어렵다. 본 도구의 핵심 가드레일이 follow-up과 drift 감지인 이상 둘과 양립하지 않는다.

세부 정책은 system 메시지를 `messages[0]`에 truncate 없이 보존하고 누적 토큰이 `llm.context_budget` 기준치(기본 32000)를 넘으면 system을 제외한 가장 오래된 user/assistant 페어부터 제거하는 것이다. truncation이 발동하면 record의 `flags.truncated=true`가 박힌다. 토큰 추정은 한국어 1자 = 1, 영문 1자 = 0.25, 그 외 0.5의 휴리스틱이라 실제 토크나이저 없이 stdlib만으로 일관된 트리거를 만든다.

### 4.2. 자동 follow-up - 짧은 답과 모호 키워드 감지

`src/interview.py`의 `should_auto_follow_up`은 답변 길이와 모호 키워드 두 축으로 follow-up 여부를 판정한다. 공백을 제거한 글자 수가 임계값(`heuristics.short_answer_threshold`, 기본 20자) 미만이면 True가 된다. 그렇지 않으면 `heuristics.ambiguous_keywords`에 정의된 회피 표현 6종("글쎄요", "잘 모르겠습니다", "잘 모르겠어요", "딱히", "별로 생각 안 해봤", "모르겠")이 부분 문자열로 포함되는지 본다. 둘 중 하나라도 트리거되면 같은 턴 흐름에서 후속 질문을 한 번 더 던진다.

follow-up 1회로 제한한 이유는 두 가지다. 첫째, 후속 질문을 무한히 던지면 페르소나가 인터뷰 도중 점점 모델 본체 톤에 가까워진다. 둘째, 토큰과 시간이 페르소나마다 균등하게 들지 않으면 비용 견적이 무너진다. 1회 follow-up이면 짧은 답을 보강하는 효과가 충분하면서 비용 변동도 예측 가능한 범위 안이다.

### 4.3. 페르소나 깨짐 감지 - drift와 refusal 휴리스틱

`detect_persona_drift`는 응답이 페르소나의 인구 통계와 정면으로 모순되는지를 본다. 감지 축은 영어 비율, 연령대 모순, 성별 모순, 지역 모순, 거주 형태 모순 다섯이다. 영어 비율 임계값(기본 0.30)은 단어 단위 비율로 잡는다. 글자 단위로 잡으면 한국어 한 문장에 섞인 4글자 영단어가 임계값을 넘기 어려워 false negative가 늘었다. 단어 단위로 보면 "I think this is solo"처럼 영어 위주 응답을 안정적으로 잡아낸다.

가짜 양성을 줄이는 데 들어간 시간이 더 길었다. 인구 통계 모순은 "저는", "나는", "제가", "내가" 같은 자기 단언 컨텍스트의 30자 윈도우 안에서만 검사한다. 거주 형태 축은 같은 문장 단위로 1인칭 주어 + 거주 동사 정밀 정규식만 매칭한다. "혼자 사시는 분들" 같은 3인칭 일반화, "혼자서 끼니를 해결" 같은 행동 표현, 응답에 우연히 등장한 product 키워드 "1인 가구용" 같은 표기는 trigger에서 제외된다. 가족 동거 페르소나가 "1인 가구가 아니라서"라고 답하는 부정 단언도 정합한 답변이라 drift로 잡지 않는다.

영문 직업명에 대한 화이트리스트도 들어가 있다. "IT 컨설턴트", "UX 디자이너" 같은 페르소나가 본인 직업명을 자연스럽게 언급할 때 영어 비율 분모/분자에서 동시에 빼서 false positive를 차단한다. `_occupation_english_tokens`가 페르소나의 `occupation` 필드에서 영문 토큰을 lower-case로 뽑아 frozenset으로 돌려준다.

### 4.4. 시스템 프롬프트 단일 빌더

세 진입점이 같은 페르소나 1인칭 가드레일을 공유하도록 시스템 프롬프트는 단일 빌더로 강제한다. `src/interview.py:399`의 `build_system_prompt`가 그 진입점이다. 인구 통계 7개 필드와 자유 서술 `persona` 요약을 항상 주입하고 토글 키워드인 professional, sports, arts, travel, culinary, family가 활성화되어 있으면 해당 자유 서술 컬럼을 raw에서 꺼내 추가한다.

템플릿 자체는 `prompts/system_prompt.txt`에 별도 파일로 분리되어 있다. `{persona_json}`과 `{product}` 두 placeholder만 `str.format`으로 치환되고 정적 prefix는 그대로 유지된다. 이 구조는 OpenAI의 자동 prompt caching과 잘 맞물린다. 같은 템플릿을 반복 호출하면 prefix가 반복되어 입력 토큰 단가의 일부가 환급된다. 자세한 수치는 §5.2에서 정리한다.

`family_type`과 `housing_type`을 시스템 프롬프트에 명시적으로 노출한 것은 회귀 한 건을 차단하기 위함이다. 두 필드를 빼면 모델이 1인 가구 여부와 주거 유형을 추론으로 채우는 경향이 있어 페르소나가 무작위로 흔들렸다. raw에 값이 있으면 그대로 박고 없으면 prompt에서 생략한다.

## 5. multi-provider LLM 백엔드

### 5.1. OpenAI / Anthropic / 로컬 OpenAI 호환 서버

LLM 백엔드는 `LLMBackend` Protocol로 추상화되어 있다. 구현은 `OpenAIBackend`와 `AnthropicBackend` 두 가지다. provider 토글은 `LlmConfig.provider`로 결정한다. `provider=openai`(기본)는 OpenAI Chat Completions와 OpenAI 호환 엔드포인트인 mlx_lm.server, vLLM, llama.cpp를 다룬다. `base_url`을 `http://localhost:PORT/v1`로 바꾸면 그대로 로컬 서버에 붙는다. `provider=anthropic`은 Anthropic Messages API를 직접 호출한다.

공식 `openai`와 `anthropic` 패키지는 둘 다 의존성에서 뺐고 httpx로 직접 호출한다. retry/timeout/logging 정책을 한 모듈에서 통일하기 쉽고 트랜지티브 의존성 트리도 작아진다. Anthropic Messages API는 OpenAI Chat Completions와 모양이 다르다. top-level `system` 필드를 쓰고 `x-api-key` 헤더가 필요하며 `max_tokens`가 필수다. base_url 매칭만으로 분기하기에는 안정적이지 않아 별도 어댑터로 분리했다.

### 5.2. prompt caching 활용

OpenAI의 prompt caching은 자동이다. 클라이언트 코드에 별도 annotation을 박지 않아도 된다. 다만 prefix가 1024 토큰 이상이어야 캐시가 활성화되고 그 이상은 128-token 증분으로 캐시 prefix가 늘어난다. 매칭은 exact prefix match만 hit이라 `messages[0]`의 system prompt + persona 보강이 가변 부분(질문, 답변 누적)보다 앞에 있어야 효과가 난다. 본 도구는 system을 항상 messages[0]에 두므로 한 페르소나 안의 멀티턴 호출은 자연스럽게 prefix 반복이 발생한다.

Anthropic의 prompt caching은 자동이 아니라 `cache_control` 명시가 필요하다. block 또는 request 단위로 표기하며 한 요청에 최대 4개의 breakpoint를 둘 수 있다. 모델별 최소 prefix 길이도 다르다. Sonnet 4.5/Opus 4.1/Sonnet 3.7은 1024 tokens, Sonnet 4.6은 2048, Opus 4.7/4.6/4.5와 Haiku 4.5는 4096 tokens다. TTL은 기본 5분이며 `cache_control.ttl: "1h"`로 1시간을 선택할 수 있다. 가격 배수는 5분 cache write가 base input의 1.25배, 1시간 write가 2배, cache read는 0.1배다. 본 도구의 `AnthropicBackend`는 system 블록에 `cache_control: ephemeral` 마커를 박는 구조다.

두 provider의 동작이 다르기 때문에 본 도구의 적용 결과도 다르다. OpenAI 쪽은 prefix를 분리해 두면 별도 작업 없이 효과가 난다. Anthropic 쪽은 `cache_control` 마커가 정확히 박혀야 하고 5분 TTL 안에 다음 호출이 들어와야 read가 활성화된다. 100명을 동시성 4로 배치하면 같은 prefix가 5분 안에 반복되어 read 적중 빈도가 충분히 올라간다.

### 5.3. 비용과 시간 트레이드오프

처리 성능 SLO는 100명 인터뷰 1회를 v1.x 기준 5-10분 안에 끝내는 것이다. 질문 5개, 동시성 4를 가정한 수치다. 초기 v1.0은 로컬 MLX 시절을 기준으로 30분 SLO를 잡았는데 OpenAI 백엔드로 갈아끼우면서 한 턴 응답이 1-3초 수준으로 떨어져 5-10분으로 갱신했다. PRD에도 두 SLO의 변경 경위를 그대로 남겨 둔다.

동시성 한계와 retry 정책은 보수적으로 잡았다. asyncio.Semaphore로 동시 호출 수를 제한하고 retry는 기본 3회, timeout과 jitter 폭은 yaml에서 조정 가능하다. truncation은 `llm.context_budget` 기준치 누적이 임계라 멀티턴 5턴 + 페르소나 보강이 들어가도 여유가 있는 편이다. 실 사용에서 truncation 발동 사례는 follow-up이 길어진 페르소나 일부에 한정됐다.

## 6. 결정의 변천

도구의 핵심 결정은 한 번에 정해진 것이 아니라 운영 데이터와 사용 환경 변화를 따라 다섯 번에 걸쳐 갱신됐다. ADR 5건과 PRD의 SLO 갱신 흐름을 시간순으로 묶어 정리한다. 회고형 톤을 살리는 의미에서 각 절은 무엇을 결정했는가보다 왜 그 결정을 다시 손보게 됐는가에 초점을 둔다.

### 6.1. 멀티턴 전략 결정

가장 먼저 정해야 했던 것은 질문 N개를 모델에게 어떻게 묶어 보낼 것인가다. 같은 질문 묶음이라도 묶음 방식에 따라 페르소나 일관성, 토큰 사용량, 처리 시간, 후처리 복잡도가 모두 달라진다. ADR-001에는 후보 세 가지가 트레이드오프 표로 비교되어 있다.

후보 A는 멀티턴 인터뷰 + 인터뷰 종료 후 단일턴 구조화 요약이다. 질문을 1턴씩 보내고 messages 히스토리에 누적한 뒤 별도 system 프롬프트로 messages 전체를 입력해 JSON 구조화 요약을 단일턴 생성한다. 후보 B는 단일턴 번들이라 질문 N개를 한 번에 묶어 보내고 모델이 한 응답에 답을 모두 돌려준다. 후보 C는 후보 B와 동일하게 한 번에 답을 받되 정성 인사이트만 별도 단일턴으로 생성한다.

표에서 후보 A는 토큰 사용량과 처리 시간에서 약 1.8-2.5배 비싸지만 페르소나 일관성, 자동 follow-up 통합, drift/refusal 격리, 디버깅 용이성 네 축에서 모두 가장 우월하다. 이 도구의 핵심 가드레일이 자동 follow-up과 페르소나 깨짐 감지라 답별 격리가 본질적으로 필요하다. 한 답이 오염되어도 나머지 네 개를 살릴 수 있느냐가 결정 기준이었고 후보 B/C는 한 응답에 답이 섞여 있어 이 가드레일과 양립하지 않는다.

그래서 후보 A를 채택하고 세부 정책 셋을 함께 박았다. system 메시지는 messages[0]에 truncate 없이 보존하고 누적 토큰 임계값 초과 시 가장 오래된 user/assistant 페어부터 제거한다. 토큰 추정은 한국어 1자 = 1, 영문 1자 = 0.25, 그 외 0.5 휴리스틱으로 stdlib만으로 일관된 트리거를 만든다. 단일턴 모드는 `--single-turn` 플래그로만 dry-run/토큰 절약용으로 열어 두고 v1 기본값은 멀티턴이다.

### 6.2. 로컬 MLX에서 OpenAI 백엔드로

v1 초안 단계의 추론 백엔드는 로컬 MLX였다. Apple Silicon + `mlx_lm.server` 조합으로 외부 API 비용을 0으로 두고 사업 아이템 정보가 로컬에서만 흐르게 하여 보안과 비용 양면에서 우위를 잡는다는 설계였다.

GATE-1 통과 후 운영 검증과 메인 세션 dry-run을 거치면서 한계가 누적됐다. 35B-A3B 4bit MLX 빌드는 토크나이저 EOS 인식이 불안정해 특정 입력에서 토큰 루프(`券后` 같은 한자 반복)가 재현됐고 27B Dense 6bit는 더 심한 토큰 루프로 이미 후보에서 빠진 상태였다. Qwen3 thinking 토글은 `enable_thinking=true`로 호출하면 영문 reasoning이 max_tokens를 모두 소진해 content가 빈 문자열이 되는 분기가 생겼다. 35B-A3B 4bit가 8-10GB를 점유해 16GB 머신에서 동시성 4 이상은 OOM 위험이라 동시성을 1-3으로 좁혀야 했다. 첫 모델 다운로드 12-20GB와 사용자가 별도 터미널에서 `mlx_lm.server`를 띄워야 하는 외부 의존도 진입 마찰을 키웠다.

ADR-002는 이 한계 묶음을 정리한 뒤 OpenAI Chat Completions API로의 전환을 결정했다. 기본 모델은 `gpt-4o-mini`, base_url은 `https://api.openai.com/v1`, 인증은 표준 `OPENAI_API_KEY`와 fallback `KPI_OPENAI_API_KEY`였다(이 fallback은 v1.2.0에서 제거됐다). HTTP 클라이언트는 httpx를 그대로 유지하고 `openai` 공식 SDK는 도입하지 않는다. Qwen 전용 `chat_template_kwargs` 같은 OSS 추론 서버 전용 파라미터도 함께 제거됐다. 비용은 0이 아니게 됐지만(100명 인터뷰 1회 약 $0.50-$2.00) 페르소나 일관성, EOS 인식 안정성, 응답 지연, OS 제약 해소까지 네 축에서 모두 개선됐다.

가장 눈에 띄는 효과는 SLO 갱신이었다. PRD §6.1 line 268은 "100명 인터뷰 1회를 5-10분 이내에 완료한다(질문 5개, 동시성 4 가정). gpt-4o-mini 기준 한 턴 응답이 약 1-3초로 추정되며 (...) v1.0의 30분 SLO는 로컬 MLX 시절 보수 추정치였고 v1.x OpenAI 백엔드에서는 5-10분 SLO로 갱신한다"로 갱신됐다. PRD §10 성공 지표 line 389도 "처리 성능: 100명 인터뷰 1회를 5-10분 이내에 완료한다(질문 5개, 동시성 4 기준. v1.0의 30분 SLO를 OpenAI 백엔드에 맞춰 갱신)"으로 같은 흐름을 반영한다.

동시성 기본값도 1-3에서 4로 올라갔고 한계는 1-10 범위로 완화됐다. 한 턴 응답 평균이 4-10초에서 1-3초로 줄어들면서 동시성 가드의 의미가 메모리 보호에서 OpenAI rate limit 보호로 바뀐 셈이다. 사용자 환경 다양성도 함께 흡수됐다. macOS, Linux, Windows 모두에서 동작하므로 Apple Silicon 전제도 사라진다.

### 6.3. multi-provider 추상화

OpenAI 단일 백엔드 결정 직후 두 가지 사용자 요구가 누적됐다. 하나는 Anthropic 크레딧 보유 사용자나 Claude 한국어 톤을 평가하려는 사용자가 Claude를 인터뷰 백엔드로 직접 쓰고 싶다는 요구였다. 다른 하나는 보안 도메인이나 사내 LLM을 쓰는 환경에서 로컬 LLM(mlx_lm.server, vLLM, llama.cpp)으로 오프라인으로 돌리고 싶다는 요구였다.

ADR-003은 이 두 요구를 흡수하기 위해 `LLMBackend` Protocol을 도입하고 진입점을 `LlmConfig.provider`로 분기했다. `provider=openai`(기본)는 `OpenAIBackend`라 OpenAI Chat Completions API와 OpenAI 호환 로컬 서버 양쪽을 다룬다. base_url을 `http://localhost:PORT/v1`로 바꾸면 그대로 로컬 서버에 붙는다. `provider=anthropic`은 `AnthropicBackend`라 Anthropic Messages API에 직접 httpx로 호출한다. anthropic SDK 의존은 추가하지 않았다.

base_url 매칭만으로 분기하는 휴리스틱은 안정적이지 않아 거부됐다. Anthropic은 OpenAI Chat Completions와 호환되지 않는 Messages API 스키마를 쓴다. top-level `system` 필드, `x-api-key` 헤더, 필수 `max_tokens`까지 차이가 누적되면 base_url 패턴 매칭으로 분기하는 코드가 자주 깨진다. 별도 어댑터로 분리해 두는 편이 낫다. anthropic SDK 도입도 거부됐다. dependency.md §1의 leftpad 회피 원칙과 트랜지티브 트리 최소화 관점에서 httpx 직접 호출로 retry/timeout/logging을 단일 모듈에 통일하는 편이 통제 비용이 낮다.

이 라운드에서 token 사용량 추적도 정규화됐다. OpenAI는 `cached_tokens`, Anthropic은 `cache_read_input_tokens`로 필드 이름이 다른데 둘 다 `TokenUsage.cached_tokens`로 합쳐 도구 전반이 같은 인터페이스로 합산한다. Anthropic 쪽은 prompt caching이 자동이 아니라 `cache_control` 마커가 명시적으로 박혀야 한다는 점이 OpenAI와 다르다. system 블록에 `cache_control: ephemeral` 마커를 박는 구조로 가져갔다.

ADR-002의 OpenAI 단일 백엔드 결정은 ADR-003으로 supersede됐다. 다만 ADR-003 자체도 ADR-003 §2(결정 섹션)에 박혀 있던 MCP 진입점에 대한 한 가지 결정이 다음 라운드에서 부분 supersede될 사연을 안고 있었다. 그 부분이 §6.4에서 다룰 MCP mode 도입의 출발점이다.

### 6.4. MCP mode 도입(server / sampling)

ADR-003에서 MCP 서버 진입점은 sampling 전용으로 단순화했었다. 추론은 항상 호스트 에이전트의 `sampling/createMessage`로 위임하고 server-side에는 OpenAI/Anthropic 키를 두지 않는다는 정책이었다. MCP가 본질적으로 호스트 LLM을 활용하기 위한 프로토콜이라는 관점에서 보면 깔끔한 결정이다.

다만 운영 마찰이 두 갈래로 누적됐다. 첫째, 2026년 4월 기준 sampling capability를 표준 노출하는 MCP 클라이언트가 매우 적었다. cmux 빌드는 sampling 미지원, Claude Code Desktop 정식 빌드도 sampling 노출이 확정되지 않은 상태, Cursor 일부 빌드만 부분 지원이었다. 둘째, 결과적으로 일반 사용자가 mcp.json에 이 도구를 등록하고 자연어로 호출하면 ConfigError가 항상 떨어졌다. 도구가 부팅조차 안 되니 실 사용 가치가 사라졌다.

ADR-004는 이 운영 마찰을 해소하기 위해 `mcp.mode` 토글을 도입했다. 자동 fallback은 두지 않는다. 사용자가 명시 토글로 동작 경로를 선택한다는 원칙이 핵심이다.

`mcp.mode: "server"`(당시 default)는 MCP 도구 호출이 server-side `OpenAIBackend`나 `AnthropicBackend`를 사용한다. CLI와 동일한 `LlmConfig` 필드(provider, base_url, model, api_key, timeout, retry, anthropic_cache_control, extra_chat_kwargs, streaming)를 그대로 활용하고 mcp.json `env`에 `OPENAI_API_KEY` 또는 `ANTHROPIC_API_KEY`를 박아 주어야 한다. 응답에는 `"backend": "mcp_server"` 라벨이 박힌다. `mcp.mode: "sampling"`은 명시 opt-in으로 호스트 에이전트의 `sampling/createMessage`에 위임하고 server-side 키가 불필요하다. 호스트가 sampling capability를 노출하지 않으면 ConfigError와 CLI fallback 안내로 차단된다. 응답 라벨은 `"mcp_sampling"`이다.

자동 fallback을 거부한 이유는 surprise 동작과 디버깅 어려움 때문이다. server mode 시도 후 키 없으면 sampling으로 자동 전환하는 흐름은 응답이 어느 경로로 갔는지 사용자가 추적하기 어렵게 만든다. 비용 청구 주체가 불분명해지는 것이 가장 큰 문제다. server 키로 청구된 줄 알았는데 호스트 sampling으로 갔거나 그 반대 사례가 섞이면 운영자가 비용 폭증을 즉시 감지할 수 없다. 결국 명시 토글 + 응답 라벨 박기로 정리됐다.

### 6.5. sampling 제거와 orchestrator 모드 도입

server/sampling 두 모드 토글로 onboarding 마찰은 해소됐지만 v1.1.1 운영 데이터에서 sampling 모드는 사실상 사용되지 않는다는 사실이 드러났다. ADR-004에 박아 둔 supersede 임계 기준은 sampling 호환 클라이언트 보급률 50% 이상이고 2026-05 현재 추정 10% 미만이라 가까운 시기에 임계에 도달할 신호가 없다.

한편 호스트 sub-agent 도구(Claude Code의 Task tool, Cursor의 sub-agent 패턴)는 mainstream에서 안정 지원 중이라 호스트가 직접 sub-agent를 띄워 자기 LLM으로 인터뷰를 수행하면 sampling 의존 없이 동일한 가치(server-side 키 불필요 + 호스트 LLM 활용)를 제공할 수 있다는 우회로가 보였다. 보급률 수치는 공식 통계가 아니라 ADR-005 §1의 자체 추정이라는 점을 함께 밝힌다.

ADR-005는 두 결정을 한 번에 묶었다. 첫째, `mcp.mode: "sampling"`을 화이트리스트와 코드 양쪽에서 제거했다. `McpSamplingBackend` 클래스, sampling capability check, `_convert_to_sampling_messages`, `_extract_sampling_text` 헬퍼도 함께 정리됐다. 둘째, `mcp.mode: "orchestrator"`를 신규 default로 도입했다. server-side에서 LLM을 호출하지 않고 호스트 sub-agent가 자기 LLM으로 인터뷰를 수행하며 이 도구는 데이터/프롬프트 helper만 노출한다. 응답 라벨은 `"mcp_orchestrator"`다. ADR-004의 server-default 결정도 이 라운드에서 함께 supersede됐다. 키 설정 없이 즉시 동작한다는 점이 신규 사용자 마찰을 가장 작게 만든다는 판단이다.

이 변경은 BREAKING이라 `mcp.mode: "sampling"`을 사용하던 사용자는 yaml에서 `"orchestrator"` 또는 `"server"`로 마이그레이션해야 한다. orchestrator 모드는 휴리스틱 자동 적용이 빠지므로 호스트가 helper 도구(`detect_persona_drift`, `should_auto_follow_up`, `parse_structured_summary`, `interview_record_schema`)를 명시 호출해야 server 모드와 동일한 임계값으로 drift/follow-up을 판정할 수 있다. 휴리스틱을 호스트 쪽에서 다시 구현할 필요가 없도록 같은 임계값과 키워드를 helper 도구로 노출한 것이 이 라운드의 부수 결정이다. 자동 fallback은 ADR-004와 동일한 사유로 두지 않는다. 사용자가 mode를 명시 토글로 선택해 동작 경로와 비용 주체를 분명히 한다.

다섯 번의 결정을 거치며 도구의 추론 경로는 단일 로컬 MLX에서 multi-provider + 두 진입점 모드로 진화했다. 결정 흐름 자체는 회고적으로 보면 한 가지 패턴을 따른다. 처음에 정한 깔끔한 정책이 운영 데이터에서 마찰을 일으키면 명시 토글로 경로를 분리하고 자동 fallback 대신 응답 라벨로 추적성을 확보한 뒤 보급률이나 가치가 0에 수렴한 옵션은 supersede ADR로 정리하는 흐름이다. 이 패턴은 §7과 §8의 정적 설계 설명에서 동작 결과로 한 번 더 확인할 수 있다.

## 7. 한 코어로 CLI / MCP server / MCP orchestrator 동시 지원

### 7.1. 진입점별 책임 분리

진입점은 세 개다. CLI인 `main.py`는 `click` 서브커맨드 네 개를 노출하고 종료 코드와 매핑한다. 서브커맨드는 healthcheck, list-personas, interview, report다. MCP server인 `src/mcp_handlers/server.py`는 server 모드 전용으로 `interview` 도구가 추가로 노출된다. 이 도구는 server-side에서 직접 OpenAI/Anthropic을 호출한다. MCP orchestrator인 `src/mcp_handlers/orchestrator.py`는 server-side LLM을 호출하지 않고 프롬프트 helper만 노출한다. `healthcheck`, `list_personas`, `report`, `should_auto_follow_up`, `detect_persona_drift`, `parse_structured_summary`, `interview_record_schema` 등은 두 mode가 공통으로 노출하는 도구다.

각 진입점은 입출력과 dispatch만 담당하고 비즈니스 로직은 가지지 않는다. CLI는 click 옵션 파싱과 종료 코드 매핑에, MCP 진입점은 MCP 도구 인자 검증과 응답 봉투 생성에만 집중한다. 실제 인터뷰 흐름은 공통 모듈에 둔다.

### 7.2. 공통 모듈 - load_personas / build_system_prompt / run_batch / report

CLI와 MCP server는 모두 `from src.batch import run_batch`, `from src.llm_backend import build_cli_backend`, `from src.load_personas import load_and_sample`을 import한다. `run_batch`는 `from .interview import run_interview`로 진입하고 `run_interview`는 `build_system_prompt`로 시스템 프롬프트를 만든 뒤 멀티턴 호출을 수행한다. 즉 CLI와 MCP server는 같은 함수 콜 그래프를 거친다.

MCP orchestrator는 `build_system_prompt`를 직접 호출해 호스트 sub-agent에 넘겨줄 프롬프트만 만든다. 인터뷰 자체는 호스트 LLM이 수행하므로 `run_batch`/`run_interview` 경로를 거치지 않는다. 다만 페르소나 로딩 함수인 `load_and_sample`과 리포트 생성 함수인 `report.generate_report`는 동일 모듈을 그대로 사용한다. 페르소나 결정과 코호트 집계 로직이 진입점마다 다를 이유가 없기 때문이다.

| 진입점 | LLM 호출 경로 | 공통 코어 호출 |
| --- | --- | --- |
| CLI | server-side `LLMBackend` | `load_and_sample` -> `run_batch` -> `run_interview` -> `build_system_prompt` |
| MCP server | server-side `LLMBackend` | `load_and_sample` -> `run_batch` -> `run_interview` -> `build_system_prompt` |
| MCP orchestrator | 호스트 sub-agent | `load_and_sample` -> `build_system_prompt` 직접 호출 -> 호스트가 인터뷰 수행 -> `aggregate_results` -> `generate_report` |

### 7.3. mode 분기 dispatch 패턴

MCP 진입점은 mode가 두 가지(`server`, `orchestrator`)라 같은 이름의 도구라도 mode마다 동작이 달라야 한다. `src/mcp_handlers/__init__.py:24`의 `TOOLS_BY_MODE`가 mode별 노출 도구 이름 리스트를 박고 `src/mcp_handlers/__init__.py:51`의 `HANDLERS`가 `(mode, tool_name)` 튜플 키를 coroutine으로 dispatch한다. `mcp_server.dispatch_tool`이 두 매핑을 그대로 활용해 list_tools 응답이 mode에 맞춰 잘리도록 하고 현재 mode에서 노출되지 않은 도구를 호출하면 키가 없어 dispatch 실패가 안내된다.

이 구조의 장점은 fallthrough가 없다는 점이다. orchestrator 모드에서 `interview` 도구를 호출하면 `("orchestrator", "interview")` 키가 매핑에 없어 즉시 차단된다. 자동으로 server 모드로 떨어지지 않는다. 도구 호출 결과가 어느 백엔드를 거쳤는지 응답 라벨인 `backend: "mcp_server"` 또는 `"mcp_orchestrator"`로 명시되어 디버깅 비용이 낮다. 다른 안으로 자동 fallback도 검토했지만 비용 청구 주체와 데이터 흐름이 불분명해진다는 사유로 거부했다.

## 8. MCP orchestrator 모드의 현재 동작 구조

### 8.1. sampling과 sub-agent fan-out의 자리 정리

이 절은 §6.5에서 정리한 의사결정 흐름의 결과로 현재 도구가 어떤 구조로 동작하는지를 정적 설계 관점에서 정리한다. 변경 사연은 §6.5에 두고 여기서는 동작 모양과 도구 분담만 다룬다.

MCP에는 서버가 호스트 LLM에 추론을 위임하는 sampling 기능이 정의되어 있다. 서버는 `sampling/createMessage`로 요청을 보내고 호스트가 자기 LLM으로 생성해 돌려준다. 공식 문서 표현 그대로 "no server API keys necessary"가 핵심 가치다. 이 도구는 sampling 모드를 v1.2.0에서 제거했고 같은 가치를 호스트 sub-agent fan-out으로 제공한다. Claude Code의 Task tool, Cursor의 sub-agent 같은 패턴은 mainstream에서 안정 지원이라 호스트가 직접 sub-agent를 띄워 자기 LLM으로 인터뷰를 수행하는 흐름이 도구 호출의 정상 경로가 된다.

### 8.2. orchestrator 모드의 도구 분담

현재 orchestrator 모드는 세 도구로 호스트 sub-agent 흐름의 책임을 분담한다.

- `build_persona_prompt`는 단일 페르소나의 시스템 프롬프트와 페르소나 dict를 돌려준다. 호스트는 받은 `system_prompt`를 sub-agent의 system 메시지로 그대로 넣어 인터뷰를 수행한다
- `build_batch_prompts`는 N명 분의 시스템 프롬프트와 페르소나 dict를 한 번에 돌려준다. 호스트는 이 응답을 받아 sub-agent fan-out으로 N개의 인터뷰를 병렬 실행한다
- `aggregate_results`는 호스트가 모은 record를 받아 정량 집계와 마크다운 리포트를 생성한다

이 도구는 프롬프트 빌드와 집계만 책임지고 추론은 호스트가 맡는다. helper 도구인 `detect_persona_drift`, `should_auto_follow_up`, `parse_structured_summary`, `interview_record_schema`도 같은 mode에 노출되어 호스트가 명시 호출하면 server 모드와 동일한 임계값/키워드를 적용할 수 있다. 휴리스틱을 호스트 쪽에서 다시 구현할 필요가 없다.

### 8.3. 비용 분담 구조의 차이

server 모드와 orchestrator 모드는 비용 청구 주체가 다르다. server 모드는 mcp.json `env`에 `OPENAI_API_KEY` 또는 `ANTHROPIC_API_KEY`를 박아야 하고 인터뷰 비용도 그 키 소유자에게 청구된다. 응답 라벨은 `"mcp_server"`다. orchestrator 모드는 server-side 키 없이 동작하고 인터뷰 비용은 호스트의 LLM 구독(Claude Code 구독, Cursor pro 등) 안에서 처리된다. 응답 라벨은 `"mcp_orchestrator"`다.

도구 호출 응답 라벨이 mode마다 명시되어 비용 청구 주체와 데이터 흐름이 한눈에 추적된다. 자동 fallback이 없는 점도 이 추적성을 받쳐 준다. 응답 라벨이 곧 "이 호출이 어느 키로 갔는가"를 그대로 알려 주므로 운영자가 비용 폭증 신호를 즉시 감지할 수 있다.

## 9. 결과 해석 - 정량과 정성 리포트

### 9.1. quant 점수와 willingness_to_pay 시그널

정량 리포트는 페르소나별 `StructuredSummary`를 합쳐 산출된다. 핵심 필드는 다섯이다. `intent`는 positive/neutral/negative 중 하나, `acceptable_price_signal`은 cheap/fair/expensive/null 중 하나, `willingness_to_pay`는 정수 또는 null, `rejection_reasons`는 거부 사유 리스트, `one_line`은 80자 이내 한 줄 요약이다.

스키마 v2(`SCHEMA_VERSION = 2`, `src/models.py`)에서 가격 의향을 두 필드로 분리한 것이 가장 큰 변화다. v1에서는 `willingness_to_pay` 한 필드로 정성 신호와 명시 숫자를 함께 받았다. 응답 본문에 "월 5만원 정도면 쓸 만하다" 같은 명시 숫자가 없으면 정량 분포에 빈 값이 많아 분석이 어려웠다. v2부터는 `acceptable_price_signal`이 정성 신호인 "비싸다", "적당하다", "저렴하다" 류 표현을 분류해 모든 record에 가능한 한 채우고 `willingness_to_pay`에는 명시 숫자 정수만 들어간다. 두 분포를 합쳐 보면 가격 수용도와 절대 금액 의향을 분리해 해석할 수 있다.

v1 JSON은 `acceptable_price_signal`을 None으로 채워 호환 로드되므로 과거 결과 파일도 그대로 다시 읽힌다.

### 9.2. 정성 인사이트 단일턴 요약

정성 인사이트는 인터뷰 종료 후 별도 단일턴 호출로 생성한다. 같은 모델에게 messages 전체를 입력하고 JSON 스키마를 강제해 카테고리별 인사이트를 추출한다. 멀티턴 인터뷰와는 별도 호출이라 인터뷰 본문 톤과 요약 톤이 섞이지 않는다.

orchestrator 모드는 이 단계 자체가 server-side에 없다. fallback이 아니라 호스트가 자기 LLM으로 정성 요약을 만들어 `aggregate_results`의 `insights` 인자로 넘기는 흐름이 정상 경로다. 같은 helper 도구로 휴리스틱을 먼저 적용한 뒤 그 결과까지 묶어 호스트가 단일턴 요약을 생성한다. 진짜 fallback은 호스트가 인사이트를 안 넘긴 경우인데 이때는 리포트의 정성 섹션이 안내 문구로 채워져 호스트 쪽에서 정성 분석을 추가하라고 알려 준다.

### 9.3. drift 비율과 신뢰도 플래그

JSON의 각 `raw_responses[i]`에는 turn별 응답, 지연, retry, 토큰 사용량이 분리되어 있고 record 단위로 `flags.persona_drift`, `flags.refusal_detected`, `flags.truncated`, `flags.parse_failed`, `flags.auto_follow_up_used`가 박힌다. 리포트에서는 drift 비율, refusal 비율, truncated 비율을 함께 보여 주어 데이터 신뢰도를 판단할 근거를 제공한다.

drift 비율이 5%를 넘으면 페르소나 보강 빈도(매 턴 system 재주입) 도입을 검토하는 트리거다(ADR-001 §3.3). 실 사용에서는 거주 형태 정밀 정규식과 self-intro 윈도우 30자 가드를 도입한 이후 5% 임계 안에서 안정화됐다. truncated 비율이 0이 아니면 질문 수를 줄이거나 `llm.context_budget`을 늘리는 신호로 본다.

## 10. 한계와 다음 과제

합성 페르소나는 어디까지나 합성이다. 본 도구가 돌려주는 정량 점수와 정성 요약은 가설을 좁히는 1차 필터로 쓰는 것이지 실 사용자 인터뷰를 대체할 자료가 아니다. 답변은 결국 LLM이 페르소나 컬럼을 1인칭으로 풀어 쓴 결과라 페르소나가 가진 진짜 맥락(가족 관계, 직장 동료, 최근 한 달의 사건)이 빠져 있다. 실 인터뷰의 모집 비용을 줄이는 보조 도구로 위치를 명확히 잡는 것이 안전하다.

다음 과제는 두 갈래다. 하나는 코호트 확장이다. 현재 데이터셋이 한국 단일 country라 다른 시장 검증에는 그대로 쓸 수 없다. 같은 NVIDIA 시리즈의 다른 언어 데이터셋을 같은 추상화에 끼우는 작업이 올라와 있다. 다른 하나는 산업별 프롬프트 템플릿이다. `prompts/system_prompt.txt`가 하나라 모든 사업 아이템에 같은 1인칭 가드레일이 적용되는데 B2B SaaS와 D2C 푸드는 인터뷰 톤 자체가 달라 템플릿을 분리할 여지가 있다.

# 참고

- <https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching>
- <https://github.com/binaryloader/korea-persona-interview>
- <https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea>
- <https://modelcontextprotocol.io/docs/concepts/sampling>
- <https://platform.openai.com/docs/guides/prompt-caching>
