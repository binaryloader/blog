---
date: 2021-08-27T00:00+09:00
title: "[Xcode] Building for iOS 15 Devices with Xcode 12"
ref: xcode12-build-ios15
excerpt: "How to deploy builds to iOS 15 or iPadOS 15 devices using Xcode 12."
lang: en
last_modified_at: 2021-08-27T14:15+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/xcode12-build-ios15.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/xcode12-build-ios15.png"
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
    url: /en/development/
  - title: "Apple"
    url: /en/development/apple/
  - title: "Xcode"
    url: /en/development/apple/xcode/
---

# Overview

This post covers how to deploy builds to iOS 15 or iPadOS 15 devices using Xcode 12.

# Steps

## 1. Download Xcode 13 Beta

- <https://developer.apple.com/download/>

**Warning:** If Xcode 13 has been officially released, simply download the release version.
{: .notice--warning}

## 2. Copy the 15.0 Folder from the Following Path

```
Xcode-beta.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport
```

## 3. Paste the Copied 15.0 Folder to the Following Path

```
Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport
```

## 4. Reboot

Once all steps are complete, reboot your Mac.
