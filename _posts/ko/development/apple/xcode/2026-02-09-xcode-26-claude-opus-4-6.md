---
date: 2026-02-09T00:00+09:00
title: "[Xcode] Xcode 26.3에서 Claude Opus 4.6 사용하기"
ref: xcode-26-claude-opus-4-6
excerpt: "Xcode 26.3에서 Claude Opus 4.6 모델을 Agentic Coding Assistant로 설정하는 방법을 정리한다."
last_modified_at: 2026-02-09T00:30+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Development
  - Apple
  - Xcode
tags:
  - Development
  - Apple
  - Xcode
  - Claude Code
  - Claude Opus
  - AI
  - Agentic Coding Assistant
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Apple"
    url: /ko/development/apple/
  - title: "Xcode"
    url: /ko/development/apple/xcode/
---

# 개요

Xcode 26에서는 Agentic Coding Assistant로 Claude Code를 지원한다. 하지만 기본적으로 사용되는 모델이 최신 모델이 아닐 수 있다. 이 글에서는 Xcode 26.3에서 Claude Opus 4.6 모델을 사용하도록 설정하는 방법을 정리한다.

# 정리

## 1. Claude Code 바이너리 복사

Xcode의 Agentic Coding Assistant는 내부적으로 Claude Code 바이너리를 사용한다. 원하는 버전의 바이너리를 아래 경로에 복사한다.

```zsh
cp $(which claude) ~/Library/Developer/Xcode/CodingAssistant/Agents/Versions/26.3/claude
```

`claude` 바이너리가 설치되어 있지 않다면 먼저 Claude Code CLI를 설치한다.

```zsh
curl -fsSL https://claude.ai/install.sh | bash
```

## 2. settings.json 생성

모델을 Claude Opus 4.6으로 변경하기 위해 `settings.json` 파일을 생성한다.

```zsh
cat <<'EOF' > ~/Library/Developer/Xcode/CodingAssistant/ClaudeAgentConfig/settings.json
{
  "model": "claude-opus-4-6"
}
EOF
```

## 3. 확인

설정이 완료되면 Xcode를 재시작한다. Agentic Coding Assistant를 사용할 때 Claude Opus 4.6 모델이 적용된다.

### 디렉터리 구조

설정 완료 후 디렉터리 구조는 다음과 같다.

```
~/Library/Developer/Xcode/CodingAssistant/
├── Agents/
│   └── Versions/
│       └── 26.3/
│           └── claude          # Claude Code 바이너리
└── ClaudeAgentConfig/
    └── settings.json           # {"model": "claude-opus-4-6"}
```

# 참고

- <https://docs.anthropic.com/en/docs/claude-code>
- <https://developer.apple.com/xcode/>
- <https://www.youtube.com/watch?v=RwMPvH1LRz0>
