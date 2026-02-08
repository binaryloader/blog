---
title: "[macOS] Using Claude Opus 4.6 in Xcode 26.3"
lang: en
ref: xcode-26-claude-opus-4-6
last_modified_at: 2025-02-09T00:30+09:00
published: true
permalink: /en/playground/macos/xcode-26-claude-opus-4-6/
header:
  overlay_color: "#202020"
categories:
  - Playground
  - macOS
tags:
  - Playground
  - macOS
  - Xcode
  - Claude Code
  - Claude Opus
  - AI
  - Coding Assistant
depth:
  - title: "Playground"
    url: /en/playground/
  - title: "macOS"
    url: /en/playground/macos/
---

# Overview

Xcode 26 supports Claude Code as a coding assistant. However, the default model may not be the latest version. This guide covers how to configure Xcode 26.3 to use the Claude Opus 4.6 model.

# Steps

## 1. Copy the Claude Code binary

Xcode's coding assistant internally uses a Claude Code binary. Copy the desired version of the binary to the following path.

```zsh
cp $(which claude) ~/Library/Developer/Xcode/CodingAssistant/Agents/Versions/26.3/claude
```

If the `claude` binary is not installed, first install the Claude Code CLI.

```zsh
curl -fsSL https://claude.ai/install.sh | bash
```

## 2. Create settings.json

Create a `settings.json` file to change the model to Claude Opus 4.6.

```zsh
cat <<'EOF' > ~/Library/Developer/Xcode/CodingAssistant/ClaudeAgentConfig/settings.json
{
  "model": "claude-opus-4-6"
}
EOF
```

## 3. Verify

After the configuration is complete, restart Xcode. The Claude Opus 4.6 model will be applied when using the coding assistant.

### Directory structure

After configuration, the directory structure should look like this.

```
~/Library/Developer/Xcode/CodingAssistant/
├── Agents/
│   └── Versions/
│       └── 26.3/
│           └── claude          # Claude Code binary
└── ClaudeAgentConfig/
    └── settings.json           # {"model": "claude-opus-4-6"}
```

# References

- <https://docs.anthropic.com/en/docs/claude-code>
- <https://developer.apple.com/xcode/>
- <https://www.youtube.com/watch?v=RwMPvH1LRz0>
