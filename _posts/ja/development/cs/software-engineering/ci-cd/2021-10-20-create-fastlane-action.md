---
title: "[CI/CD] fastlane Actionを作成する"
ref: create-fastlane-action
excerpt: "fastlaneのカスタムActionを作成する方法をまとめる。"
lang: ja
last_modified_at: 2021-10-20T15:02+09:00
published: true
header:
  overlay_color: "#202020"
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
  - Action
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

fastlaneのカスタムActionを作成する方法をまとめる。

# 手順

## 1. Actionの例

- [validate_ipa](https://github.com/hacoma/fastlane-plugin-validate_ipa/blob/main/lib/fastlane/plugin/validate_ipa/actions/validate_ipa_action.rb)

## 2. Actionテンプレートの生成

```zsh
fastlane new_action
```

- Actionの命名は`testflight`や`upload_to_s3`のような形式で記述する。
- コマンドの実行が完了すると`actions`パスに`[action_name].rb`というRubyファイルが生成される。
- fastlaneが適用されたプロジェクトのパスでコマンドを実行した場合は`fastlane/actions`パスに生成される。

## 3. Actionの記述

```ruby
module Fastlane
  module Actions
    module SharedValues
      # LaneまたはAction間でグローバルに共有するSharedValuesを定義する。
      VALIDATE_IPA_CUSTOM_VALUE = :VALIDATE_IPA_CUSTOM_VALUE
    end

    class ValidateIpaAction < Action
      def self.run(params)
        # fastlaneがパラメータの読み取りと環境変数の取得を処理する。
        UI.message "Parameter API Token: #{params[:api_token]}"

        # lane_contextを通じてLaneまたはAction間でグローバルに共有されるSharedValuesにアクセスできる。
        # Actions.lane_context[SharedValues::VALIDATE_IPA_CUSTOM_VALUE] = "my_val"
        # custom_value = Actions.lane_context[SharedValues::VALIDATE_IPA_CUSTOM_VALUE]
      end

      #####################################################
      # @!group Documentation
      #####################################################

      def self.description
        "Actionが実行する処理についての簡潔な説明を80文字以内で記述する。"
      end

      def self.details
        "Actionが実行する処理についてより詳細な説明を記述する。"
      end

      def self.available_options
        # Actionがサポートするすべてのパラメータについての説明を提供し、verify_blockで入力値の検証も可能。
        [
          FastlaneCore::ConfigItem.new(key: :api_token,
                                       env_name: "FL_VALIDATE_IPA_API_TOKEN", # 環境変数の名前
                                       description: "API Token for ValidateIpaAction", # パラメータについての簡潔な説明
                                       verify_block: proc do |value|
                                          UI.user_error!("No API token for ValidateIpaAction given, pass using `api_token: 'token'`") unless (value and not value.empty?)
                                       end),
          FastlaneCore::ConfigItem.new(key: :development,
                                       env_name: "FL_VALIDATE_IPA_DEVELOPMENT",
                                       description: "Create a development certificate instead of a distribution one",
                                       is_string: false, # true: 入力が文字列であるかを検証、false: すべてのデータ型を渡すことが可能
                                       default_value: false) # ユーザーが入力を提供しなかった場合のデフォルト値。
        ]
      end

      def self.output
        # 上部で定義したSharedValuesについての説明を記述する。
        [
          ['VALIDATE_IPA_CUSTOM_VALUE', 'valueが何を含んでいるかについての説明']
        ]
      end

      def self.return_value
        # Actionが戻り値を提供する場合はその説明を記述する。
      end

      def self.authors
        # 名前またはユーザー名を記述する。
        ["Your GitHub/Twitter Name"]
      end

      def self.is_supported?(platform)
        # Actionがサポートするplatformを記述する。
        #
        #  true
        #
        #  platform == :ios
        #
        #  [:ios, :mac].include?(platform)
        #
        platform == :ios
      end
    end
  end
end
```

## 4. Actionの使用

```ruby
validate_ipa(
  api_token: "api_token",
  development: false
)
```

- 自作のActionはfastlaneのビルトインActionと同様に特別な作業なしで使用できる。

## 5. fastlaneメインリポジトリへの提出

- 自作のActionをfastlaneのビルトインActionとして提出したい場合は[fastlaneのGitHubリポジトリ](https://github.com/fastlane/fastlane)にPRを提出する。

### 5.1. ビルトインActionとして承認されるケース

- 一般的に大多数の開発者が使用できる。
- モバイルアプリ開発者の課題を解決する（iOSおよびAndroid）。
- 読みやすいドキュメントと優れたテストカバレッジを持っている。

### 5.2. ビルトインActionとして却下されるケース

- 少数の開発者のみを対象とした特定のユースケースを解決する。
- サードパーティサービスのAPIにアクセスし、そのサードパーティサービスがActionを所有または保守している。
- 将来的に多くのメンテナンス作業を必要とする複雑なActionである。
- モバイル開発者に関連しないすべてのもの。

# 参考

- <https://docs.fastlane.tools/create-action/>
- <https://docs.fastlane.tools/advanced/actions>
- <https://docs.fastlane.tools/advanced/lanes/#lane-context>
- <https://github.com/fastlane/fastlane/issues/14255>
