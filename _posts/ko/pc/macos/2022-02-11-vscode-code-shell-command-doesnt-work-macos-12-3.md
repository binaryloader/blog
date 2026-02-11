---
date: 2022-02-11T00:00+09:00
title: "[macOS] macOS 12.3에서 Visual Studio Code의 code Shell Command가 동작하지 않는 이슈 해결하기"
ref: vscode-code-shell-command-doesnt-work-macos-12-3
excerpt: "macOS 12.3에서 Python 2 제거로 인해 VS Code의 code 명령이 동작하지 않는 이슈를 해결하는 방법을 정리한다."
last_modified_at: 2022-02-11T18:27+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - Command Line
  - Visual Studio Code
  - VSCode
  - Python
  - Troubleshooting
depth:
  - title: "PC"
    url: /ko/pc/
  - title: "macOS"
    url: /ko/pc/macos/
---

# 개요

macOS 12.3에서 Python 2 제거로 인해 VS Code의 `code` 명령이 동작하지 않는 이슈를 해결하는 방법을 정리한다.

# 정리

## 1. 원인 파악

- macOS 12.3에서 Python 2가 제거됨에 따라 Visual Studio Code의 `code` Shell Command 수행 시 아래와 같은 에러가 발생한다.
  ```bash
  /usr/local/bin/code: line 6: python: command not found
  /usr/local/bin/code: line 10: ./MacOS/Electron: No such file or directory
  ```

## 2. 이슈 해결

### 2.1. /usr/local/bin 경로로 이동

```zsh
cd /usr/local/bin
```

### 2.2. vi 또는 nano로 code의 내용 수정

```zsh
nano code
```

```bash
# 수정 전
function realpath() { python -c ...

# 수정 후
function realpath() { python3 -c ...
```

# 참고

- <https://github.com/microsoft/vscode/issues/141738>
