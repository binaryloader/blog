---
title: "[Git] GitHub에서 SSH 키 여러 개 사용하기"
last_modified_at: 2021-10-10T04:48+09:00
header:
  overlay_color: "#202020"
categories:
  - Development
  - SCM
  - Git
tags:
  - Development
  - SCM
  - Git
  - GitHub
  - SSH
  - Key
depth:
  - title: "Development"
    url: /development/
  - title: "SCM"
    url: /development/scm/
  - title: "Git"
    url: /development/scm/git/
---

# 한번 알아보자

## 1. ~/.ssh/config에 아래 라인 추가

```bash
Host github.com-user1
	HostName github.com
	User git
	IdentityFile ~/.ssh/id_rsa_user1
```

## 2. 작동 확인

```bash
$ git clone git@github.com-user1:hacoma/iOS-Project.git
```

===

부족한 글 읽어주셔서 감사합니다.

잘못된 내용이나 오탈자에 대한 지적은 언제나 환영입니다.  
댓글로 남겨주시면 반영하도록 하겠습니다.
