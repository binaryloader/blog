---
title: "[TIL][260224] uv와 Ollama로 Python 프로젝트 시작하기"
ref: python-uv-ollama-getting-started
excerpt: "uv 패키지 매니저로 Python 프로젝트를 구성하고 Ollama Python 라이브러리로 원격 LLM 서버에 연결하면서 배운 것들을 정리한다."
date: 2026-02-25T01:55+09:00
last_modified_at: 2026-02-25T01:55+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/python-uv-ollama-getting-started.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/python-uv-ollama-getting-started.png"
categories:
  - Study
  - TIL
tags:
  - Python
  - uv
  - Ollama
  - PyCharm
  - macOS
depth:
  - title: "Study"
    url: /ko/study/
  - title: "TIL"
    url: /ko/study/til/
---

# 개요

uv 패키지 매니저로 Python 프로젝트를 구성하고 Ollama Python 라이브러리로 원격 LLM 서버에 연결하면서 배운 것들을 정리한다.

# 정리

## 1. pip vs pip3

macOS에는 Python이 여러 버전 공존할 수 있다. `pip`은 시스템에 따라 Python 2 또는 3에 연결되고 `pip3`는 항상 Python 3에 연결된다. 가장 명확한 방법은 `python3 -m pip install 패키지명`으로 실행하는 것이다. 어떤 Python 인터프리터에 설치하는지 모호함이 없다.

다만 uv를 사용하면 `pip`을 직접 쓸 일이 거의 없다.

## 2. uv 패키지 매니저

uv는 Rust로 작성된 Python 패키지 매니저다. pip보다 빠르고 프로젝트별 가상환경을 자동으로 관리한다.

### 2.1. 설치

```bash
brew install uv
```

### 2.2. 주요 명령어

```bash
uv init                    # 현재 디렉토리에 프로젝트 초기화
uv init myproject          # myproject 폴더를 만들고 초기화
uv add ollama              # 패키지 설치 + pyproject.toml에 의존성 추가
uv run main.py             # 가상환경에서 스크립트 실행
uv sync                    # 의존성 동기화
```

### 2.3. Python 버전 관리

```bash
uv python install 3.13     # Python 3.13 설치
uv python uninstall 3.14   # Python 3.14 삭제
uv python pin 3.13         # 프로젝트에 Python 버전 고정
uv python list --only-installed  # 설치된 버전 확인
```

macOS에 번들된 Xcode Python 3.9 대신 최신 버전을 설치해서 사용하는 것이 좋다. Python 3.14는 아직 일부 패키지(`orjson` 등)가 지원하지 않으므로 현 시점에서는 3.13이 안정적이다.

### 2.4. 가상환경

`uv init`을 실행하면 프로젝트 루트에 `.venv` 디렉토리가 생성된다. `uv run`이 이 가상환경을 자동으로 활성화하므로 `source .venv/bin/activate`나 `deactivate` 같은 명령을 직접 쓸 필요가 없다.

## 3. Python 기본 문법

Swift와 비교하면서 차이점을 정리한다.

### 3.1. 동적 타이핑

변수 타입을 선언하지 않아도 된다. 타입 힌트는 선택사항이고 실행 시 강제되지 않는다.

```python
name = "hello"        # 타입 선언 없이
name: str = "hello"   # 타입 힌트 (선택)
```

### 3.2. 상수

Swift의 `let` 같은 불변 키워드가 없다. 대문자 변수명으로 상수를 표현하지만 실제로 변경을 막지는 않는다.

```python
MAX_COUNT = 100  # 관례적 상수 (변경 가능)
```

### 3.3. 네이밍 컨벤션

| 대상 | Python | Swift |
|---|---|---|
| 함수/변수 | `snake_case` | `camelCase` |
| 클래스 | `PascalCase` | `PascalCase` |

### 3.4. 문자열

작은따옴표(`'`)와 큰따옴표(`"`) 모두 사용 가능하다. Python 공식 포매터 Black이 큰따옴표를 기본으로 사용하므로 `"`로 통일하는 것이 좋다.

### 3.5. `if __name__ == "__main__":`

파일을 직접 실행할 때만 코드를 실행하고 다른 파일에서 import할 때는 실행하지 않는 가드 패턴이다. `main()` 함수는 Python이 특별하게 취급하는 것이 아니라 관례적 이름일 뿐이다.

```python
def run():
    print("hello")

if __name__ == "__main__":
    run()  # 직접 실행할 때만 호출
```

### 3.6. import

```python
import ollama            # ollama.chat(...)으로 호출
from ollama import chat  # chat(...)으로 직접 호출
```

`import ollama`만 해도 모든 기능을 사용할 수 있다. `from` 구문은 모듈명을 생략하고 싶을 때 쓴다.

## 4. Ollama Python 라이브러리

### 4.1. 원격 서버 연결

`Client`에 `host`와 `timeout`을 지정하면 원격 Ollama 서버에 연결할 수 있다. LangChain을 사용하는 경우 `ChatOllama`에 `base_url`을 지정한다.

```python
import ollama

client = ollama.Client(
    host="http://192.168.x.x:11434",
    timeout=300
)
```

### 4.2. generate와 chat

```python
# 단일 응답 생성
result = client.generate(
    model="qwen3:8b",
    prompt="Python이 뭔지 한 줄로 설명해"
)
print(result["response"])

# 대화형
reply = client.chat(
    model="qwen3:8b",
    messages=[{"role": "user", "content": "안녕"}]
)
print(reply.message.content)
```

### 4.3. LangChain 연동

LangChain의 `ChatOllama`를 사용하면 대화형 인터페이스를 간단하게 구현할 수 있다.

```python
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage

llm = ChatOllama(
    model="qwen3:8b",
    base_url="http://192.168.x.x:11434"
)

while True:
    user_input = input("질문을 입력하세요 (종료: exit): ")
    if user_input.lower() == "exit":
        break

    messages = [HumanMessage(content=user_input)]
    response = llm.invoke(messages)
    print("답변:", response.content)
```

### 4.4. 타임아웃

8B 모델이라도 서버 사양에 따라 응답에 시간이 걸릴 수 있다. 기본 타임아웃이 짧으면 `ConnectionError`가 발생하므로 `timeout`을 넉넉하게 설정하는 것이 좋다.

## 5. PyCharm 인터프리터 설정

PyCharm에서 uv 프로젝트를 실행하려면 `.venv`의 Python 인터프리터를 설정해야 한다.

1. **설정** (⌘ + ,) → **프로젝트** → **Python 인터프리터**
2. **인터프리터 추가** → **로컬 인터프리터 추가**
3. **기존 항목 선택** → 경로를 프로젝트의 `.venv/bin/python3`으로 지정

시스템 Python(`/usr/bin/python3`)을 사용하면 uv로 설치한 패키지를 인식하지 못한다.

## 6. macOS 로컬 네트워크 권한

PyCharm에서 같은 네트워크의 다른 기기에 접속하려면 macOS의 로컬 네트워크 권한이 필요하다. 터미널에서는 정상 동작하는데 PyCharm에서만 `No route to host` 또는 `ConnectionError`가 발생하면 이 설정을 확인한다.

**시스템 설정** → **개인정보 보호 및 보안** → **로컬 네트워크**에서 PyCharm을 허용하면 된다.

# 참고

- <https://docs.astral.sh/uv/>
- <https://github.com/godstale/ollama-mcp-tutorials>
- <https://github.com/ollama/ollama-python>
- <https://peps.python.org/pep-0008/>
