---
title: "[Toolkit] fastlane-plugin-validate_ipa"
ref: library-fastlane-plugin-validate_ipa
excerpt: "Apple altool로 IPA를 검증하는 fastlane 플러그인"
date: 2026-05-01
published: true
categories:
  - Library
  - Toolkit
app_creator: "binaryloader"
app_summary: "Apple altool로 IPA 파일을 검증하는 fastlane 플러그인"
app_version: "1.1.0"
app_runtime: "Ruby 2.5+"
app_license: "MIT"
app_github: "https://github.com/binaryloader/fastlane-plugin-validate_ipa"
app_homepage: "https://rubygems.org/gems/fastlane-plugin-validate_ipa"
depth:
  - title: "Library"
    url: /ko/library/
  - title: "Toolkit"
    url: /ko/library/toolkit/
---

## 1. 개요

fastlane-plugin-validate_ipa는 Apple의 altool을 호출해 IPA 파일이 App Store 제출 요구사항을 만족하는지 업로드 전 검증하는 fastlane 플러그인이다.

## 2. 정보

- 개발: binaryloader
- 버전: 1.1.0
- 라이선스: MIT
- 요구사항: Ruby 2.5+
- GitHub: [binaryloader/fastlane-plugin-validate_ipa](https://github.com/binaryloader/fastlane-plugin-validate_ipa)
- RubyGems: [fastlane-plugin-validate_ipa](https://rubygems.org/gems/fastlane-plugin-validate_ipa)

## 3. 주요 기능

- altool 기반 IPA 검증을 fastlane 액션으로 통합
- App Store Connect 인증 정보를 환경 변수로 안전하게 주입
- 검증 결과를 fastlane 로그 포맷으로 출력해 CI 파이프라인 결과와 일관

## 4. 설치

```ruby
fastlane add_plugin validate_ipa
```
