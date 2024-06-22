---
title: "[macOS] macOS 12.3에서 Visual Studio Code의 `code` Shell Command가 동작하지 않는 이슈 해결하기"
last_modified_at: 2022-02-11T18:27+09:00
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
depth:
  - title: "PC"
    url: /pc/
  - title: "macOS"
    url: /pc/macos/
---

# 한번 알아보자

## 1. 원인 파악

- macOS 12.3에서 Python 2가 제거됨에 따라 Visual Studio Code의 `code` Shell Command 수행 시 아래와 같은 에러가 발생한다.
  ```bash
  /usr/local/bin/code: line 6: python: command not found
  /usr/local/bin/code: line 10: ./MacOS/Electron: No such file or directory
  ```

## 2. 이슈 해결

### 2.1. /usr/local/bin 경로로 이동

```bash
$ cd /usr/local/bin
```

### 2.2. vi 또는 nano로 `code`의 내용 수정

```bash
$ nano code
```

```bash
# 수정 전
function realpath() { python -c ...

# 수정 후
function realpath() { python3 -c ...
```

# 참조

- [https://github.com/microsoft/vscode/issues/141738](https://github.com/microsoft/vscode/issues/141738)

===

부족한 글 읽어주셔서 감사합니다.

잘못된 내용이나 오탈자에 대한 지적은 언제나 환영입니다.  
댓글로 남겨주시면 반영하도록 하겠습니다.
