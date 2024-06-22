---
title: "[macOS] Zsh Alien 테마 설치하기"
last_modified_at: 2021-08-16T08:17+09:00
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

## 1. Oh-My-Zsh 테마 폴더로 이동

```bash
$ cd ~/.oh-my-zsh/custom/themes
```

## 2. 테마 레포지토리 및 서브 모듈 클론

```bash
$ git clone https://github.com/eendroroy/alien.git
$ cd alien
$ git submodule update --init --recursive
```

## 3. ~/.zshrc에 아래 라인 추가

```bash
source ~/.oh-my-zsh/custom/themes/alien/alien.zsh
export ALIEN_THEME="red"
```

## 4. 적용

```bash
$ source ~/.zshrc
```

# 참조

- [https://github.com/eendroroy/alien](https://github.com/eendroroy/alien)
- [https://github.com/powerline/fonts](https://github.com/powerline/fonts)

===

부족한 글 읽어주셔서 감사합니다.

잘못된 내용이나 오탈자에 대한 지적은 언제나 환영입니다.  
댓글로 남겨주시면 반영하도록 하겠습니다.
