---
date: 2021-10-16T00:00+09:00
title: "[Python] PIP 설치하기"
ref: install-python3-pip
excerpt: "Python 3의 패키지 관리자 PIP를 설치하는 방법을 정리한다."
last_modified_at: 2021-10-16T04:32+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/install-python3-pip.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/install-python3-pip.png"
categories:
  - Development
  - Language
  - Python
tags:
  - Development
  - Language
  - Python
  - Python3
  - PIP
  - Package Management
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Language"
    url: /ko/development/language/
  - title: "Python"
    url: /ko/development/language/python/
---

# 개요

Python 3의 패키지 관리자 PIP를 설치하는 방법을 정리한다.

# 정리

## 1. get-pip.py를 다운로드 할 경로로 이동

```zsh
cd desktop
```

## 2. get-pip.py 다운로드

```zsh
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
```

## 3. Python script 수행을 통한 PIP 설치

```zsh
python3 get-pip.py
```

# 참고

- <https://pip.pypa.io/en/stable/>
