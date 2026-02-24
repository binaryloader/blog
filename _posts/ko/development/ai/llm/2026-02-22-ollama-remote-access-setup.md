---
title: "[LLM] Ollama 원격 접속 설정하기"
ref: ollama-remote-access-setup
excerpt: "Ollama의 OLLAMA_HOST 환경변수와 Windows 방화벽을 설정하여 같은 네트워크의 다른 기기에서 로컬 LLM에 접속하는 방법을 정리한다."
date: 2026-02-22T23:30+09:00
last_modified_at: 2026-02-22T23:30+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/ollama-remote-access-setup.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/ollama-remote-access-setup.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - Ollama
  - LLM
  - Windows 11
  - Network
depth:
  - title: "Development"
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "LLM"
    url: /ko/development/ai/llm/
---

# 개요

Ollama의 OLLAMA_HOST 환경변수와 Windows 방화벽을 설정하여 같은 네트워크의 다른 기기에서 로컬 LLM에 접속하는 방법을 정리한다.

# 정리

## 1. 배경

GPU가 장착된 Windows PC에 Ollama를 설치해서 LLM 모델을 호스팅하고 API 엔드포인트까지 제공하는 서버로 활용하려는 구성이다. 실제 개발과 스터디는 익숙한 macOS 환경에서 하면서 LLM이 필요할 때만 Windows의 API를 호출하면 되므로 GPU 자원은 Windows가, 개발 환경은 macOS가 담당하는 식으로 각 기기의 장점을 살릴 수 있다.

다만 Ollama는 기본적으로 `127.0.0.1:11434`에서만 요청을 받는다. 같은 PC에서는 문제없지만 맥에서 API를 호출하려면 외부 접속을 허용해야 한다. 평소 macOS에서 개발하다 보니 Windows에서 환경변수 설정하고 방화벽 여는 것만으로도 꽤 고생했다. 환경변수를 설정했는데 왜 안 되지? 싶으면 대부분 재부팅을 안 한 것이다.

## 2. OLLAMA_HOST 환경변수 설정

Windows에서 `OLLAMA_HOST` 환경변수를 `0.0.0.0:11434`로 설정하면 모든 네트워크 인터페이스에서 요청을 수신한다.

`Windows + S` → "환경 변수" 검색 → **시스템 환경 변수 편집** → **환경 변수** 버튼 → **사용자 변수**에서 **새로 만들기**를 클릭한다.

- 변수 이름: `OLLAMA_HOST`
- 변수 값: `0.0.0.0:11434`

![OLLAMA_HOST 환경변수 설정](/assets/image/post/development/ai/llm/ollama-remote-access-setup/ollama-host-env-var.png){: style="max-width: min(500px, 100%);"}

설정 후 PC를 재부팅하거나 Ollama를 재시작해야 반영된다.

### 2.1. 설정 확인

PowerShell에서 Ollama가 올바른 주소로 리스닝하는지 확인한다.

```powershell
netstat -an | findstr 11434
```

`0.0.0.0:11434 LISTENING`이 출력되면 정상이다. `127.0.0.1:11434`로 나오면 환경변수가 반영되지 않은 것이므로 재부팅이 필요하다.

## 3. Windows 방화벽 설정

환경변수를 설정해도 방화벽이 포트를 차단하면 외부에서 접속할 수 없다. 관리자 권한 PowerShell에서 방화벽 규칙을 추가한다.

```powershell
New-NetFirewallRule -DisplayName "Ollama" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow
```

## 4. 다른 기기에서 접속 테스트

같은 네트워크에 있는 맥이나 다른 기기에서 Windows PC의 IP로 API를 호출한다. Windows PC의 IP는 `ipconfig` 명령어로 확인할 수 있다.

```bash
curl -s http://<윈도우IP>:11434/api/generate -d '{"model":"qwen3:8b","prompt":"Explain what Ollama is in one sentence.","stream":false}'
```

![macOS에서 원격 API 호출](/assets/image/post/development/ai/llm/ollama-remote-access-setup/ollama-remote-curl.png)

응답이 정상적으로 돌아오면 설정이 완료된 것이다.

# 참고

- <https://github.com/ollama/ollama/blob/main/docs/faq.md>
- <https://ollama.com>
