---
title: "[Toolkit] fastlane-plugin-validate_ipa"
ref: library-fastlane-plugin-validate_ipa
excerpt: "Fastlane plugin that validates IPAs with Apple's altool"
lang: en
permalink: /en/library/toolkit/fastlane-plugin-validate_ipa/
date: 2026-05-01
published: true
categories:
  - Library
  - Toolkit
app_creator: "binaryloader"
app_summary: "Fastlane plugin that validates IPAs with Apple's altool"
app_version: "1.1.0"
app_runtime: "Ruby 2.5+"
app_license: "MIT"
app_github: "https://github.com/binaryloader/fastlane-plugin-validate_ipa"
app_homepage: "https://rubygems.org/gems/fastlane-plugin-validate_ipa"
depth:
  - title: "Library"
    url: /en/library/
  - title: "Toolkit"
    url: /en/library/toolkit/
---

## 1. Overview

fastlane-plugin-validate_ipa is a fastlane plugin that calls Apple's altool to verify whether an IPA meets App Store submission requirements before upload.

## 2. Info

- Developer: binaryloader
- Version: 1.1.0
- License: MIT
- Requirements: Ruby 2.5+
- GitHub: [binaryloader/fastlane-plugin-validate_ipa](https://github.com/binaryloader/fastlane-plugin-validate_ipa)
- RubyGems: [fastlane-plugin-validate_ipa](https://rubygems.org/gems/fastlane-plugin-validate_ipa)

## 3. Features

- Integrates altool-based IPA validation as a fastlane action
- Safely injects App Store Connect credentials via environment variables
- Emits results in fastlane log format for consistent CI pipeline output

## 4. Install

```ruby
fastlane add_plugin validate_ipa
```
