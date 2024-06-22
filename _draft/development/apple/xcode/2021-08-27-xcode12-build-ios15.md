---
title: "[Xcode] Xcode 12에서 iOS 15 혹은 iPadOS 15 기기에 빌드 올리기"
last_modified_at: 2021-08-27T14:15+09:00
header:
  overlay_color: "#202020"
categories:
  - Development
  - Apple
  - Xcode
tags:
  - Development
  - Apple
  - Xcode
depth:
  - title: "Development"
    url: /development/
  - title: "Apple"
    url: /development/apple/
  - title: "Xcode"
    url: /development/apple/xcode/
---

# 적용

## 1. Xcode 13 베타 다운로드

- [https://developer.apple.com/download/](https://developer.apple.com/download/)

**경고:** Xcode 13이 정식 릴리즈 되었다면 릴리즈 버전을 받으면 된다.
{: .notice--warning}

## 2. 아래 경로에서 15.0 폴더 복사

```
Xcode-beta.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport
```

## 3. 위에서 복사한 15.0 폴더를 아래 경로에 붙여넣기

```
Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport
```

## 4. 재부팅

모든 과정이 완료되었다면 맥을 재부팅한다.

===

부족한 글 읽어주셔서 감사합니다.

잘못된 내용이나 오탈자에 대한 지적은 언제나 환영입니다.  
댓글로 남겨주시면 반영하도록 하겠습니다.
