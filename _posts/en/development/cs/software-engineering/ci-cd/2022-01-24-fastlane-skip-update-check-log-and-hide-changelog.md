---
date: 2022-01-24T00:00+09:00
title: "[CI/CD] Disabling fastlane Update Check and Changelog Logs"
ref: fastlane-skip-update-check-log-and-hide-changelog
excerpt: "How to disable fastlane's update check log and changelog log."
lang: en
last_modified_at: 2022-01-24T15:16+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/fastlane-skip-update-check-log-and-hide-changelog.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/fastlane-skip-update-check-log-and-hide-changelog.png"
categories:
  - Development
  - CS
  - Software-Engineering
  - CI/CD
tags:
  - Development
  - CS
  - Software Engineering
  - CI/CD
  - fastlane
  - Log
  - iOS
  - Automation
depth:
  - title: "Development"
    url: /en/development/
  - title: "CS"
    url: /en/development/cs/
  - title: "Software Engineering"
    url: /en/development/cs/software-engineering/
  - title: "CI/CD"
    url: /en/development/cs/software-engineering/ci-cd/
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

# Overview

This post covers how to disable fastlane's update check log and changelog log.

# Introduction

When a lane execution finishes, regardless of whether it succeeds or fails, an update check and changelog log like the one below is printed, making it inconvenient to review the lane execution logs. We get it, there's an update - now stop the logs!

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

# Steps

## 1. Disable Only the Changelog Log

- Add the following global environment variable to your shell configuration file.

  ```zsh
  code .zshrc
  ```

  ```zsh
  export FASTLANE_HIDE_CHANGELOG="1"
  ```

  ```zsh
  source .zshrc
  ```

- After completely closing and reopening the shell, running a lane will print only the update check log as shown below.

  ```
  #######################################################################
  # fastlane 2.201.1 is available. You are on 2.196.0.
  # You should use the latest version.
  # Please update using `bundle update fastlane`.
  # To see what's new, open https://github.com/fastlane/fastlane/releases.
  #######################################################################
  ```

## 2. Disable Both Update Check and Changelog Logs

- Add the following global environment variable to your shell configuration file.

  ```zsh
  code .zshrc
  ```

  ```zsh
  export FASTLANE_SKIP_UPDATE_CHECK="1"
  ```

  ```zsh
  source .zshrc
  ```

- After completely closing and reopening the shell, running a lane will no longer print any such logs.

# References

- <https://docs.fastlane.tools/advanced/fastlane/>
- <https://github.com/fastlane/fastlane/issues/10163>
