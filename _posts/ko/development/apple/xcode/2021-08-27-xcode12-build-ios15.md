---
date: 2021-08-27T00:00+09:00
title: "[Xcode] Xcode 12에서 iOS 15 기기에 빌드하기"
ref: xcode12-build-ios15
excerpt: "Xcode 12에서 iOS 15 또는 iPadOS 15 기기에 빌드를 올리는 방법을 정리한다."
last_modified_at: 2021-08-27T14:15+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/xcode12-build-ios15.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/xcode12-build-ios15.png"
categories:
  - Development
  - Apple
  - Xcode
tags:
  - Development
  - Apple
  - Xcode
  - iOS
  - iOS 15
  - Xcode 12
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Apple"
    url: /ko/development/apple/
  - title: "Xcode"
    url: /ko/development/apple/xcode/
---

# 개요

Xcode 12에서 iOS 15 또는 iPadOS 15 기기에 빌드를 올리는 방법을 정리한다.

# 정리

## 1. Xcode 13 베타 다운로드

- <https://developer.apple.com/download/>

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
