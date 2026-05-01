---
title: "[Toolkit] fastlane-plugin-validate_ipa"
ref: library-fastlane-plugin-validate_ipa
excerpt: "Apple altoolでIPAを検証するfastlaneプラグイン"
lang: ja
permalink: /ja/library/toolkit/fastlane-plugin-validate_ipa/
date: 2026-05-01
published: true
categories:
  - Library
  - Toolkit
app_creator: "binaryloader"
app_summary: "Apple altoolでIPAを検証するfastlaneプラグイン"
app_version: "1.1.0"
app_runtime: "Ruby 2.5+"
app_license: "MIT"
app_github: "https://github.com/binaryloader/fastlane-plugin-validate_ipa"
app_homepage: "https://rubygems.org/gems/fastlane-plugin-validate_ipa"
depth:
  - title: "Library"
    url: /ja/library/
  - title: "Toolkit"
    url: /ja/library/toolkit/
---

## 1. 概要

fastlane-plugin-validate_ipaは、AppleのaltoolでIPAがApp Store提出要件を満たしているかをアップロード前に検証するfastlaneプラグインである。

## 2. 情報

- 開発: binaryloader
- バージョン: 1.1.0
- ライセンス: MIT
- 要件: Ruby 2.5+
- GitHub: [binaryloader/fastlane-plugin-validate_ipa](https://github.com/binaryloader/fastlane-plugin-validate_ipa)
- RubyGems: [fastlane-plugin-validate_ipa](https://rubygems.org/gems/fastlane-plugin-validate_ipa)

## 3. 主な機能

- altoolベースのIPA検証をfastlaneアクションとして統合
- App Store Connectの認証情報を環境変数で安全に注入
- 検証結果をfastlaneログ形式で出力しCIパイプラインと一貫した表示

## 4. インストール

```ruby
fastlane add_plugin validate_ipa
```
