---
date: 2021-10-20T00:00+09:00
title: "[CI/CD] fastlane Action 만들기"
ref: create-fastlane-action
excerpt: "fastlane의 커스텀 Action을 만드는 방법을 정리한다."
last_modified_at: 2021-10-20T15:02+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/create-fastlane-action.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/create-fastlane-action.png"
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
  - iOS
  - Automation
  - Ruby
depth:
  - title: "Development"
    url: /ko/development/
  - title: "CS"
    url: /ko/development/cs/
  - title: "Software Engineering"
    url: /ko/development/cs/software-engineering/
  - title: "CI/CD"
    url: /ko/development/cs/software-engineering/ci-cd/
---

# 개요

fastlane의 커스텀 Action을 만드는 방법을 정리한다.

# 정리

## 1. Action 예시

- [validate_ipa](https://github.com/hacoma/fastlane-plugin-validate_ipa/blob/main/lib/fastlane/plugin/validate_ipa/actions/validate_ipa_action.rb)

## 2. Action 템플릿 생성

```zsh
fastlane new_action
```

- Action 네이밍은 `testflight`, `upload_to_s3`와 같은 형태로 작성한다.
- 커맨드 수행이 완료되었다면 `actions` 경로에 `[action_name].rb`라는 Ruby 파일이 생성된다.
- fastlane이 적용된 프로젝트 경로에서 커맨드를 수행했다면 `fastlane/actions` 경로에 생성된다.

## 3. Action 작성

```ruby
module Fastlane
  module Actions
    module SharedValues
      # Lane 혹은 Action 간 전역으로 공유할 SharedValues를 정의한다.
      VALIDATE_IPA_CUSTOM_VALUE = :VALIDATE_IPA_CUSTOM_VALUE
    end

    class ValidateIpaAction < Action
      def self.run(params)
        # fastlane은 파라미터를 읽는 것과 환경 변수를 가져오는 것을 처리할 것이다.
        UI.message "Parameter API Token: #{params[:api_token]}"

        # lane_context를 통해 Lane 혹은 Action 간 전역으로 공유되는 SharedValues에 접근할 수 있다.
        # Actions.lane_context[SharedValues::VALIDATE_IPA_CUSTOM_VALUE] = "my_val"
        # custom_value = Actions.lane_context[SharedValues::VALIDATE_IPA_CUSTOM_VALUE]
      end

      #####################################################
      # @!group Documentation
      #####################################################

      def self.description
        "Action이 수행하는 작업에 대한 간단한 설명을 80자 이하로 작성한다."
      end

      def self.details
        "Action이 수행하는 작업에 대해서 보다 자세한 설명을 작성한다."
      end

      def self.available_options
        # Action에서 지원하는 모든 파라미터에 대한 설명을 제공하며 verify_blockd을 통해 입력된 value에 대한 검증도 가능하다.
        [
          FastlaneCore::ConfigItem.new(key: :api_token,
                                       env_name: "FL_VALIDATE_IPA_API_TOKEN", # 환경 변수의 이름
                                       description: "API Token for ValidateIpaAction", # 파라미터에 대한 간략한 설명
                                       verify_block: proc do |value|
                                          UI.user_error!("No API token for ValidateIpaAction given, pass using `api_token: 'token'`") unless (value and not value.empty?)
                                       end),
          FastlaneCore::ConfigItem.new(key: :development,
                                       env_name: "FL_VALIDATE_IPA_DEVELOPMENT",
                                       description: "Create a development certificate instead of a distribution one",
                                       is_string: false, # true: 입력이 문자열인지 검증, false: 모든 타입의 데이터를 전달할 수 있음.
                                       default_value: false) # 사용자가 입력을 제공하지 않았을 경우 default value를 사용.
        ]
      end

      def self.output
        # 상단에서 정의한 SharedValues에 대한 설명을 작성한다.
        [
          ['VALIDATE_IPA_CUSTOM_VALUE', 'value가 무엇을 담고 있는지에 대한 설명']
        ]
      end

      def self.return_value
        # Action이 return value를 제공한다면 그것에 대한 설명을 작성한다.
      end

      def self.authors
        # 이름 혹은 닉네임을 작성한다.
        ["Your GitHub/Twitter Name"]
      end

      def self.is_supported?(platform)
        # Action이 지원하는 platform을 작성한다.
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

## 4. Action 사용

```ruby
validate_ipa(
  api_token: "api_token",
  development: false
)
```

- 직접 만든 Action은 fastlane Built-in Action과 동일하게 별다른 작업 없이 사용할 수 있다.

## 5. fastlane main repo에 제출

- 직접 만든 Action을 fastlane의 Built-in Action으로 제출하고 싶다면 [fastlane의 GitHub 저장소](https://github.com/fastlane/fastlane)에 PR을 제출하면 된다.

### 5.1. Built-in Action으로 승인하는 경우

- 일반적으로 대다수의 개발자가 사용할 수 있다.
- 모바일 앱 개발자들의 고충을 해결한다. (iOS 및 Android)
- 쉽게 읽을 수 있는 문서와 우수한 테스트 커버리지를 가졌다.

### 5.2. Built-in Action으로 거절하는 경우

- 소수의 개발자만을 위한 특정한 유스 케이스를 해결한다.
- 타사 서비스의 API에 접근하면서 타사 서비스가 Action을 소유하거나 유지 보수한다.
- 미래에 많은 유지 보수 작업을 필요로 하는 복잡한 Action이다.
- 모바일 개발자와 관련없는 모든 것.

# 참고

- <https://docs.fastlane.tools/advanced/actions>
- <https://docs.fastlane.tools/advanced/lanes/#lane-context>
- <https://docs.fastlane.tools/create-action/>
- <https://github.com/fastlane/fastlane/issues/14255>
