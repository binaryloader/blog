---
title: "[CI/CD] fastlane 업데이트 확인 로그 및 변경사항 로그 끄기"
ref: fastlane-skip-update-check-log-and-hide-changelog
excerpt: "fastlane의 업데이트 확인 로그와 변경사항 로그를 끄는 방법을 정리한다."
last_modified_at: 2022-01-24T15:16+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Development
  - CS
  - Software-Engineering
  - CI-CD
tags:
  - Development
  - CS
  - Software Engineering
  - CI/CD
  - fastlane
  - Log
depth:
  - title: "Development"
    url: /ko/development/
  - title: "CS"
    url: /ko/development/cs/
  - title: "Software Engineering"
    url: /ko/development/cs/software-engineering/
  - title: "CI/CD"
    url: /ko/development/cs/software-engineering/ci-cd/
---

# 개요

fastlane의 업데이트 확인 로그와 변경사항 로그를 끄는 방법을 정리한다.

# 들어가며

Lane 수행이 끝나면 결과가 실패든 성공이든 아래와 같은 업데이트 확인 및 변경사항 로그가 출력되어서 Lane 수행 로그를 확인하기가 불편하다.
업데이트된 것 알겠으니까 이제 로그 멈춰!

```
#######################################################################
# fastlane 2.201.1 is available. You are on 2.196.0.
# You should use the latest version.
# Please update using `bundle update fastlane`.
#######################################################################

2.201.1 Hotfixes for scan and trainer
* [scan] prevent error from raising and prevent xcresult processing when multiple devices with xcpretty (#19829) via Josh Holtz
* [trainer] Make new options used by scan public (to fix crash) (#19828) via Josh Holtz
* [scan][xcov] set xcresult path in SharedValues and use as default in xcov (#19825) via Josh Holtz

...

To see all new releases, open https://github.com/fastlane/fastlane/releases

Please update using `bundle update fastlane`
```

# 정리

## 1. 변경사항 로그 출력만 끄기

- 사용 중인 Shell의 설정 파일에 아래와 같이 전역 환경 변수를 추가해준다.

  ```zsh
  code .zshrc
  ```

  ```zsh
  export FASTLANE_HIDE_CHANGELOG="1"
  ```

  ```zsh
  source .zshrc
  ```

- Shell을 완전히 종료했다가 다시 실행한 뒤에 Lane을 수행하면 아래와 같이 업데이트 확인 로그만 출력된다.

  ```
  #######################################################################
  # fastlane 2.201.1 is available. You are on 2.196.0.
  # You should use the latest version.
  # Please update using `bundle update fastlane`.
  # To see what's new, open https://github.com/fastlane/fastlane/releases.
  #######################################################################
  ```

## 2. 업데이트 확인 및 변경사항 로그 출력 끄기

- 사용 중인 Shell의 설정 파일에 아래와 같은 전역 환경 변수를 추가해준다.

  ```zsh
  code .zshrc
  ```

  ```zsh
  export FASTLANE_SKIP_UPDATE_CHECK="1"
  ```

  ```zsh
  source .zshrc
  ```

- Shell을 완전히 종료했다가 다시 실행한 뒤에 Lane을 수행하면 더 이상 어떠한 로그도 출력되지 않는다.

# 참고

- <https://docs.fastlane.tools/advanced/fastlane/>
- <https://github.com/fastlane/fastlane/issues/10163>
