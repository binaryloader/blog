---
title: "[cmux] AI 에이전트 병렬 운영을 위한 Ghostty 기반 네이티브 macOS 터미널"
ref: cmux-terminal
excerpt: "Ghostty 엔진을 내장한 Swift + AppKit 네이티브 터미널 cmux. Claude Code, Aider, Cline 같은 여러 에이전틱 코딩 어시스턴트를 한 창에서 병렬로 돌리기 위해 설계된 오픈소스 macOS 앱의 설치와 활용법을 정리한다."
date: 2026-04-19T10:20+09:00
last_modified_at: 2026-04-19T10:20+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/cmux-terminal.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/cmux-terminal.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Terminal
tags:
  - cmux
  - Ghostty
  - Terminal
  - macOS
  - Agentic Coding
  - Claude Code
depth:
  - title: "Development"
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "Agentic Coding Assistant"
    url: /ko/development/ai/agentic-coding-assistant/
  - title: "Terminal"
    url: /ko/development/ai/agentic-coding-assistant/terminal/
---

# 개요

Ghostty 엔진을 내장한 Swift + AppKit 네이티브 터미널 cmux. Claude Code, Aider, Cline 같은 여러 에이전틱 코딩 어시스턴트를 한 창에서 병렬로 돌리기 위해 설계된 오픈소스 macOS 앱의 설치와 활용법을 정리한다.

# 정리

## 1. cmux 소개

cmux는 [manaflow-ai](https://github.com/manaflow-ai/cmux)가 공개한 오픈소스 macOS 터미널이다. 내부적으로 Ghostty의 엔진인 libghostty를 사용하지만 Ghostty 본체와는 별개의 앱으로 배포된다. 경량 GPU 가속 렌더링을 유지하면서도 Swift와 AppKit으로 작성된 완전한 네이티브 앱이다. Electron 기반이 아니기 때문에 메모리 점유와 시작 속도 모두 가볍다.

cmux가 일반 터미널과 구분되는 지점은 만든 목적이다. 하나의 창에서 Claude Code, Aider, Cline 같은 에이전틱 코딩 어시스턴트를 동시에 여러 개 돌리기 위해 설계되었다. 각 에이전트의 입출력을 독립된 탭과 분할 창으로 분리하면서 알림 배지, 작업 디렉토리, 포트, git 브랜치 등의 상태를 사이드바 한곳에서 보여주는 구조이다. 에이전틱 코딩 워크플로우에서 "지금 어느 에이전트가 내 입력을 기다리는가"를 놓치지 않기 위한 UX이다.

지원 환경은 macOS 14.0 이상이며 Apple Silicon과 Intel Mac을 모두 지원한다. 라이선스는 오픈소스이고 무료로 사용할 수 있다.

## 2. 주요 기능

세로 탭 사이드바가 cmux의 얼굴이다. 각 탭이 세로로 쌓이고 탭별로 git 브랜치, 현재 작업 디렉토리, 리스닝 중인 포트, 알림 배지를 자동으로 표시한다. 여러 에이전트가 동시에 출력을 쏟아내더라도 사이드바만 훑으면 어느 세션에 주의가 필요한지 즉시 파악된다.

창 분할은 가로와 세로 양방향으로 지원된다. 왼쪽에서는 Claude Code가 코드를 수정하고 오른쪽에서는 Aider가 커밋을 만들고 아래쪽에서는 로컬 서버 로그를 보는 식의 배치가 한 창 안에서 자연스럽게 된다.

작업공간(Workspaces) 개념은 프로젝트와 문맥을 분리하기 위한 상위 단위이다. 프로젝트별로 작업공간을 만들어두면 탭 구성과 분할 레이아웃이 통째로 격리된다. 한 화면에서 여러 저장소를 병렬로 다룰 때 특히 유용하다.

알림 링은 에이전틱 코딩에 최적화된 기능이다. 에이전트가 사용자 입력을 대기하는 상태로 넘어가면 해당 패널 테두리가 링으로 강조되고 사이드바에 배지가 뜨며 동시에 macOS 데스크톱 알림이 발생한다. 긴 작업을 병렬로 돌려두고 다른 창에서 리뷰하고 있어도 입력 대기가 발생하는 순간을 놓치지 않는다.

내장 브라우저는 터미널 옆에 분할 배치 가능한 스크립팅 브라우저이다. 에이전트가 빌드한 웹 서버를 바로 옆 패널에서 열어 확인하거나 문서 페이지를 띄워둔 채 코드를 작성하는 용도로 쓴다. 자동화를 위한 소켓 API도 제공되어 외부 스크립트에서 cmux의 탭과 창을 제어할 수 있다.

## 3. 설치

설치 방법은 두 가지이다. DMG 직접 다운로드 방식과 Homebrew를 통한 설치이다.

DMG를 내려받으려면 아래 링크에서 받는다.

```
https://github.com/manaflow-ai/cmux/releases/latest/download/cmux-macos.dmg
```

Homebrew 사용자는 아래 명령어로 tap을 추가하고 설치한다.

```bash
brew tap manaflow-ai/cmux
brew install --cask cmux
```

어느 방식으로 설치하든 첫 실행 시 macOS 보안 확인 창이 뜬다. 응용 프로그램 폴더에서 cmux를 우클릭하여 "열기"를 선택하면 이후로는 정상 실행된다.

터미널에서 `cmux` 명령을 직접 호출하고 싶다면 CLI 심링크를 만든다. 선택 사항이지만 자동화 스크립트나 다른 도구에서 cmux를 호출할 때 편하다.

```bash
sudo ln -sf "/Applications/cmux.app/Contents/Resources/bin/cmux" /usr/local/bin/cmux
```

## 4. 키보드 단축키

cmux의 생산성은 단축키 숙지에 직결된다. 영역별로 정리하면 아래와 같다.

앱 전역 단축키는 설정 창 진입과 명령 팔레트, 새 창 관리에 쓴다.

| 동작 | 단축키 |
|------|--------|
| 설정 열기 | `⌘+,` |
| 명령 팔레트 | `⌘+⇧+P` |
| 새 창 | `⌘+⇧+N` |
| 종료 | `⌘+Q` |

작업공간 전환은 사이드바 토글과 숫자 키 이동이 핵심이다.

| 동작 | 단축키 |
|------|--------|
| 사이드바 토글 | `⌘+B` |
| 새 작업공간 | `⌘+N` |
| 다음 작업공간 | `⌃+⌘+]` |
| 이전 작업공간 | `⌃+⌘+[` |
| 작업공간 직접 선택 | `⌘+1` ~ `⌘+9` |

탭 조작은 다른 터미널과 비슷한 체계를 따른다.

| 동작 | 단축키 |
|------|--------|
| 새 탭 | `⌘+T` |
| 다음 탭 | `⌘+⇧+]` |
| 이전 탭 | `⌘+⇧+[` |
| 현재 탭 닫기 | `⌘+W` |
| 다른 탭 모두 닫기 | `⌥+⌘+T` |

창 분할과 포커스 이동은 AI 에이전트 병렬 운영의 핵심이다.

| 동작 | 단축키 |
|------|--------|
| 오른쪽으로 분할 | `⌘+D` |
| 아래로 분할 | `⌘+⇧+D` |
| 포커스 이동 | `⌥+⌘+←` / `→` / `↑` / `↓` |

내장 브라우저 단축키는 웹 브라우저와 비슷한 체계이다.

| 동작 | 단축키 |
|------|--------|
| 브라우저 열기 | `⌘+⇧+L` |
| 주소창 포커스 | `⌘+L` |
| 뒤로 | `⌘+[` |
| 앞으로 | `⌘+]` |

검색과 알림 관련 단축키는 아래와 같다.

| 동작 | 단축키 |
|------|--------|
| 찾기 | `⌘+F` |
| 다음 검색 결과 | `⌘+G` |
| 알림 표시 | `⌘+I` |
| 읽지 않은 알림 | `⌘+⇧+U` |

## 5. ~/.config/ghostty/config 설정

cmux는 Ghostty의 설정 파일을 그대로 공유한다. 이미 Ghostty를 쓰고 있다면 별도 설정 없이 폰트, 테마, 키바인딩 등이 그대로 적용된다. 신규 사용자라도 `~/.config/ghostty/config` 파일 하나에 설정을 정리해두면 두 앱 모두에 반영된다.

기본 예시는 아래와 같다.

```
font-family = "JetBrains Mono"
font-size = 13
theme = "GruvboxDark"
background-opacity = 0.95
window-padding-x = 12
window-padding-y = 12
cursor-style = block
cursor-style-blink = false
copy-on-select = true
scrollback-limit = 100000

keybind = ctrl+shift+c=copy_to_clipboard
keybind = ctrl+shift+v=paste_from_clipboard
```

cmux 고유 단축키는 Ghostty 설정과 분리되어 있다. 설정 창에서 UI로 편집하거나 `~/.config/cmux/settings.json`을 직접 수정한다. 두 단계 체인 단축키도 지원하므로 `⌘+K ⌘+O`처럼 Emacs 스타일 조합도 정의할 수 있다.

## 6. 마치며

cmux는 에이전틱 코딩 워크플로우가 늘어날수록 확실한 이득을 준다. 터미널 여러 개를 띄워놓고 창 전환을 반복하던 방식을 사이드바 한 번 훑기로 대체한다. Ghostty의 렌더링 성능과 네이티브 macOS 앱의 가벼움을 그대로 가져가면서 다중 에이전트 운영에 필요한 UX만 덧붙인 구조이다. 에이전틱 코딩 어시스턴트를 일상적으로 쓰는 환경이라면 한 번쯤 기본 터미널을 교체해볼 만한 선택지이다.

# 참고

- <https://cmux.com/docs/keyboard-shortcuts>
- <https://cmux.com/ko>
- <https://cmux.com/ko/docs/getting-started>
- <https://github.com/manaflow-ai/cmux>
