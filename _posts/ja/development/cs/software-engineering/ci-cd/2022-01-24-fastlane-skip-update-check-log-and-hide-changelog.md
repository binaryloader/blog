---
date: 2022-01-24T00:00+09:00
title: "[CI/CD] fastlaneのアップデート確認ログと変更履歴ログを無効にする"
ref: fastlane-skip-update-check-log-and-hide-changelog
excerpt: "fastlaneのアップデート確認ログと変更履歴ログを無効にする方法をまとめる。"
lang: ja
last_modified_at: 2022-01-24T15:16+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/fastlane-skip-update-check-log-and-hide-changelog.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/fastlane-skip-update-check-log-and-hide-changelog.png"
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
    url: /ja/development/
  - title: "CS"
    url: /ja/development/cs/
  - title: "Software Engineering"
    url: /ja/development/cs/software-engineering/
  - title: "CI/CD"
    url: /ja/development/cs/software-engineering/ci-cd/
---

# 概要

fastlaneのアップデート確認ログと変更履歴ログを無効にする方法をまとめる。

# はじめに

Laneの実行が完了すると結果が成功でも失敗でも以下のようなアップデート確認および変更履歴ログが出力され、Lane実行ログの確認が不便になる。アップデートがあるのはわかったからもうログを止めてくれ！

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

# 手順

## 1. 変更履歴ログの出力のみ無効にする

- 使用中のShellの設定ファイルに以下のようにグローバル環境変数を追加する。

  ```zsh
  code .zshrc
  ```

  ```zsh
  export FASTLANE_HIDE_CHANGELOG="1"
  ```

  ```zsh
  source .zshrc
  ```

- Shellを完全に閉じて再起動した後にLaneを実行すると、以下のようにアップデート確認ログのみが出力される。

  ```
  #######################################################################
  # fastlane 2.201.1 is available. You are on 2.196.0.
  # You should use the latest version.
  # Please update using `bundle update fastlane`.
  # To see what's new, open https://github.com/fastlane/fastlane/releases.
  #######################################################################
  ```

## 2. アップデート確認および変更履歴ログの出力を無効にする

- 使用中のShellの設定ファイルに以下のようなグローバル環境変数を追加する。

  ```zsh
  code .zshrc
  ```

  ```zsh
  export FASTLANE_SKIP_UPDATE_CHECK="1"
  ```

  ```zsh
  source .zshrc
  ```

- Shellを完全に閉じて再起動した後にLaneを実行すると、これ以上いかなるログも出力されなくなる。

# 参考

- <https://docs.fastlane.tools/advanced/fastlane/>
- <https://github.com/fastlane/fastlane/issues/10163>
