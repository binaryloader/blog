---
date: 2021-08-27T00:00+09:00
title: "[Xcode] Xcode 12でiOS 15デバイスにビルドする"
ref: xcode12-build-ios15
excerpt: "Xcode 12でiOS 15またはiPadOS 15デバイスにビルドをデプロイする方法をまとめる。"
lang: ja
last_modified_at: 2021-08-27T14:15+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/xcode12-build-ios15.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/xcode12-build-ios15.png"
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
    url: /ja/development/
  - title: "Apple"
    url: /ja/development/apple/
  - title: "Xcode"
    url: /ja/development/apple/xcode/
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: binaryloader
---

# 概要

Xcode 12でiOS 15またはiPadOS 15デバイスにビルドをデプロイする方法をまとめる。

# 手順

## 1. Xcode 13ベータをダウンロード

- <https://developer.apple.com/download/>

警告: Xcode 13が正式リリースされている場合は、リリース版をダウンロードすればよい。
{: .notice--warning}

## 2. 以下のパスから15.0フォルダをコピー

```
Xcode-beta.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport
```

## 3. コピーした15.0フォルダを以下のパスに貼り付け

```
Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/DeviceSupport
```

## 4. 再起動

すべての手順が完了したらMacを再起動する。
