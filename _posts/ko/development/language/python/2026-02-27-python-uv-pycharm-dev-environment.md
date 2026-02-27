---
title: "[Python] uv와 PyCharm으로 Python 개발 환경 구성하기"
ref: python-uv-pycharm-dev-environment
excerpt: "uv 패키지 매니저로 Python 프로젝트를 구성하고 PyCharm에서 개발 환경을 설정하는 방법을 정리한다."
date: 2026-02-27T17:00+09:00
last_modified_at: 2026-02-27T17:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/python-uv-pycharm-dev-environment.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/python-uv-pycharm-dev-environment.png"
categories:
  - Development
  - Language
  - Python
tags:
  - Python
  - uv
  - PyCharm
  - macOS
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Language"
    url: /ko/development/language/
  - title: "Python"
    url: /ko/development/language/python/
---

# 개요

uv 패키지 매니저로 Python 프로젝트를 구성하고 PyCharm에서 개발 환경을 설정하는 방법을 정리한다.

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

## 3. PyCharm 인터프리터 설정

PyCharm에서 uv 프로젝트를 실행하려면 `.venv`의 Python 인터프리터를 설정해야 한다.

1. **설정** (⌘ + ,) → **프로젝트** → **Python 인터프리터**
2. **인터프리터 추가** → **로컬 인터프리터 추가**
3. **기존 항목 선택** → 경로를 프로젝트의 `.venv/bin/python3`으로 지정

시스템 Python(`/usr/bin/python3`)을 사용하면 uv로 설치한 패키지를 인식하지 못한다.

## 4. macOS 로컬 네트워크 권한

PyCharm에서 같은 네트워크의 다른 기기에 접속하려면 macOS의 로컬 네트워크 권한이 필요하다. 터미널에서는 정상 동작하는데 PyCharm에서만 `No route to host` 또는 `ConnectionError`가 발생하면 이 설정을 확인한다.

**시스템 설정** → **개인정보 보호 및 보안** → **로컬 네트워크**에서 PyCharm을 허용하면 된다.

## 5. PyCharm 한국어 입력 UnicodeEncodeError

PyCharm 콘솔에서 한국어를 입력하면 아래와 같은 에러가 발생할 수 있다.

```
UnicodeEncodeError: 'utf-8' codec can't encode character '\udce3' in position 151: surrogates not allowed
```

`\udce3`는 UTF-8 3바이트 시퀀스(`0xe3`)의 surrogate 형태다. PyCharm 콘솔의 인코딩 설정 문제로 한국어 입력이 surrogate 문자로 잘못 변환되고 API로 전송될 때 UTF-8 인코딩에 실패하는 것이다.

### 5.1. 해결 방법

**도움말** → **사용자 지정 VM 옵션 편집...**을 열고 아래 두 줄을 추가한 뒤 PyCharm을 재시작한다.

```
-Dfile.encoding=UTF-8
-Dconsole.encoding=UTF-8
```

**설정** → **에디터** → **파일 인코딩**에서 모든 항목이 `UTF-8`로 되어 있는지도 확인한다.

### 5.2. 확인 방법

터미널에서 직접 실행해 보면 PyCharm 문제인지 확인할 수 있다.

```bash
uv run python main.py
```

터미널에서 정상 동작한다면 PyCharm 콘솔 인코딩 문제가 맞다.

# 참고

- <https://docs.astral.sh/uv/>
- <https://peps.python.org/pep-0008/>
