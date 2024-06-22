---
title: "[macOS] Zsh 자동 완성 플러그인 설치하기"
last_modified_at: 2021-08-21T15:33+09:00
header:
  overlay_color: "#202020"
categories:
  - PC
  - macOS
tags:
  - PC
  - macOS
  - Oh-My-Zsh
depth:
  - title: "PC"
    url: /pc/
  - title: "macOS"
    url: /pc/macos/
---

# 한번 알아보자

## 1. Oh-My-Zsh 플러그인 폴더로 이동

```bash
$ cd ~/.oh-my-zsh/custom/plugins
```

## 2. 플러그인 레포지토리 클론

```bash
$ git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

## 3. ~/.zshrc의 plugins에 zsh-autosuggestions 추가

```bash
plugins=(
    # other plugins...
    zsh-autosuggestions
)
```

# 참조

- [https://github.com/zsh-users/zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions)

===

부족한 글 읽어주셔서 감사합니다.

잘못된 내용이나 오탈자에 대한 지적은 언제나 환영입니다.  
댓글로 남겨주시면 반영하도록 하겠습니다.
