---
title: "[macOS] 在Xcode 26.3中使用Claude Opus 4.6"
lang: zh
ref: xcode-26-claude-opus-4-6
last_modified_at: 2026-02-09T00:30+09:00
published: true
permalink: /zh/playground/macos/xcode-26-claude-opus-4-6/
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
    url: /zh/playground/
  - title: "macOS"
    url: /zh/playground/macos/
---

# 概述

Xcode 26支持Claude Code作为编程助手。但默认使用的模型可能不是最新版本。本文介绍如何将Xcode 26.3配置为使用Claude Opus 4.6模型。

# 步骤

## 1. 复制Claude Code二进制文件

Xcode的编程助手内部使用Claude Code二进制文件。将所需版本的二进制文件复制到以下路径。

```zsh
cp $(which claude) ~/Library/Developer/Xcode/CodingAssistant/Agents/Versions/26.3/claude
```

如果尚未安装`claude`二进制文件，请先安装Claude Code CLI。

```zsh
curl -fsSL https://claude.ai/install.sh | bash
```

## 2. 创建settings.json

创建`settings.json`文件以将模型更改为Claude Opus 4.6。

```zsh
cat <<'EOF' > ~/Library/Developer/Xcode/CodingAssistant/ClaudeAgentConfig/settings.json
{
  "model": "claude-opus-4-6"
}
EOF
```

## 3. 验证

配置完成后，重新启动Xcode。使用编程助手时将应用Claude Opus 4.6模型。

### 目录结构

配置完成后的目录结构如下。

```
~/Library/Developer/Xcode/CodingAssistant/
├── Agents/
│   └── Versions/
│       └── 26.3/
│           └── claude          # Claude Code二进制文件
└── ClaudeAgentConfig/
    └── settings.json           # {"model": "claude-opus-4-6"}
```

# 参考

- <https://docs.anthropic.com/en/docs/claude-code>
- <https://developer.apple.com/xcode/>
- <https://www.youtube.com/watch?v=RwMPvH1LRz0>
