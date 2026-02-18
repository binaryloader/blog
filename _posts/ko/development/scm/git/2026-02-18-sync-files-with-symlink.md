---
date: 2026-02-18T14:00+09:00
title: "[Git] 심볼릭 링크로 설정 파일을 Git 저장소와 동기화하기"
ref: sync-files-with-symlink
excerpt: "심볼릭 링크를 활용해 특정 경로의 설정 파일을 Git 저장소에서 버전 관리하는 방법을 정리한다."
last_modified_at: 2026-02-18T14:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/sync-files-with-symlink.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/sync-files-with-symlink.png"
categories:
  - Development
  - SCM
  - Git
tags:
  - Git
  - Symbolic Link
  - dotfiles
depth:
  - title: "Development"
    url: /ko/development/
  - title: "SCM"
    url: /ko/development/scm/
  - title: "Git"
    url: /ko/development/scm/git/
---

# 개요

심볼릭 링크를 활용해 특정 경로의 설정 파일을 Git 저장소에서 버전 관리하는 방법을 정리한다.

# 정리

## 1. 심볼릭 링크란

심볼릭 링크(symbolic link, symlink)는 다른 파일이나 디렉토리를 가리키는 특수한 파일이다. Windows의 바로가기와 비슷한 개념으로, 실제 데이터는 원본에만 존재하고 심볼릭 링크는 원본의 경로 정보만 저장한다.

하드 링크와의 차이점은 아래와 같다.

- **심볼릭 링크**: 원본 파일의 **경로**를 참조한다. 원본이 삭제되면 링크가 깨진다(dangling link).
- **하드 링크**: 원본 파일의 **inode**를 공유한다. 원본이 삭제되어도 데이터에 접근할 수 있다.

설정 파일 동기화에는 심볼릭 링크가 적합하다. 원본의 위치가 명확하고 링크가 어떤 파일을 가리키는지 직관적으로 확인할 수 있기 때문이다.

## 2. 심볼릭 링크 생성

`ln -s` 명령어로 심볼릭 링크를 생성한다.

```zsh
ln -s <원본 경로> <링크 경로>
```

예를 들어 `~/Documents/memo.txt`를 바탕화면에서 접근하고 싶다면 아래와 같이 실행한다.

```zsh
ln -s ~/Documents/memo.txt ~/Desktop/memo.txt
```

링크가 정상적으로 생성되었는지 확인한다.

```zsh
ls -la ~/Desktop/memo.txt
# lrwxr-xr-x  1 user  staff  25 Feb 18 14:00 memo.txt -> /Users/user/Documents/memo.txt
```

`l`로 시작하는 파일 타입과 `->` 화살표로 심볼릭 링크임을 확인할 수 있다.

## 3. Git 저장소와 동기화

설정 파일이 특정 시스템 경로에 있어야 하지만 Git으로 버전 관리하고 싶은 경우가 있다. `~/.zshrc`, `~/.gitconfig`, `~/.ssh/config` 같은 dotfiles가 대표적이다. 이런 파일들은 원본을 Git 저장소로 이동한 뒤 원래 위치에 심볼릭 링크를 생성하면 된다.

### 3.1. 원본을 저장소로 이동

```zsh
mv ~/.zshrc ~/repos/dotfiles/.zshrc
```

### 3.2. 심볼릭 링크 생성

```zsh
ln -s ~/repos/dotfiles/.zshrc ~/.zshrc
```

이제 `~/.zshrc`를 수정하면 실제로는 저장소의 파일이 수정된다. 저장소에서 커밋하고 푸시하면 설정 파일의 변경 이력이 관리된다.

### 3.3. 다른 dotfiles도 같은 방식

```zsh
# 원본을 저장소로 이동
mv ~/.gitconfig ~/repos/dotfiles/.gitconfig
mv ~/.ssh/config ~/repos/dotfiles/.ssh/config

# 심볼릭 링크 생성
ln -s ~/repos/dotfiles/.gitconfig ~/.gitconfig
ln -s ~/repos/dotfiles/.ssh/config ~/.ssh/config
```

## 4. 동기화 해제

심볼릭 링크를 삭제하고 원본 파일을 원래 위치로 복원한다.

```zsh
# 심볼릭 링크 삭제 (원본은 영향 없음)
rm ~/.zshrc

# 원본을 원래 위치로 복원
mv ~/repos/dotfiles/.zshrc ~/.zshrc
```

`rm`은 심볼릭 링크 파일만 삭제하며 원본 파일에는 영향을 주지 않는다.

## 5. 주의사항

### 절대 경로와 상대 경로

심볼릭 링크 생성 시 원본 경로를 절대 경로로 지정하는 것이 안전하다. 상대 경로를 사용하면 링크 파일의 위치를 기준으로 해석되므로 링크를 이동하면 깨질 수 있다.

```zsh
# 절대 경로 (권장)
ln -s /Users/user/repos/dotfiles/.zshrc ~/.zshrc

# 상대 경로 (링크 위치 기준)
ln -s ../repos/dotfiles/.zshrc ~/.zshrc
```

### 원본 삭제 시 깨짐

원본 파일을 삭제하면 심볼릭 링크가 깨진다. 깨진 링크에 접근하면 "No such file or directory" 에러가 발생한다. 깨진 링크는 아래 명령어로 찾을 수 있다.

```zsh
find ~ -maxdepth 3 -type l ! -exec test -e {} \; -print
```

### Git에서 심볼릭 링크 추적

Git은 심볼릭 링크 자체를 추적한다. 저장소에 심볼릭 링크를 커밋하면 링크가 가리키는 경로가 저장되며, 다른 환경에서 클론할 때 해당 경로에 원본이 없으면 깨진 링크가 된다. 따라서 저장소에는 원본 파일을 두고 심볼릭 링크는 저장소 밖의 시스템 경로에 생성하는 것이 일반적이다.
