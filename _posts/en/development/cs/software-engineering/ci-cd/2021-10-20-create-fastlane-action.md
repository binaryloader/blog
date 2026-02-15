---
date: 2021-10-20T00:00+09:00
title: "[CI/CD] Creating a fastlane Action"
ref: create-fastlane-action
excerpt: "How to create a custom fastlane Action."
lang: en
last_modified_at: 2021-10-20T15:02+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/create-fastlane-action.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/create-fastlane-action.png"
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
    url: /en/development/
  - title: "CS"
    url: /en/development/cs/
  - title: "Software Engineering"
    url: /en/development/cs/software-engineering/
  - title: "CI/CD"
    url: /en/development/cs/software-engineering/ci-cd/
---

# Overview

This post covers how to create a custom fastlane Action.

# Steps

## 1. Action Example

- [validate_ipa](https://github.com/hacoma/fastlane-plugin-validate_ipa/blob/main/lib/fastlane/plugin/validate_ipa/actions/validate_ipa_action.rb)

## 2. Generating an Action Template

```zsh
fastlane new_action
```

- Action naming should follow formats like `testflight` or `upload_to_s3`.
- Once the command completes, a Ruby file named `[action_name].rb` is created in the `actions` directory.
- If the command was run in a project with fastlane set up, the file is created under `fastlane/actions`.

## 3. Writing the Action

```ruby
module Fastlane
  module Actions
    module SharedValues
      # Define SharedValues to be shared globally between Lanes or Actions.
      VALIDATE_IPA_CUSTOM_VALUE = :VALIDATE_IPA_CUSTOM_VALUE
    end

    class ValidateIpaAction < Action
      def self.run(params)
        # fastlane will handle reading parameters and fetching environment variables.
        UI.message "Parameter API Token: #{params[:api_token]}"

        # You can access SharedValues shared globally between Lanes or Actions via lane_context.
        # Actions.lane_context[SharedValues::VALIDATE_IPA_CUSTOM_VALUE] = "my_val"
        # custom_value = Actions.lane_context[SharedValues::VALIDATE_IPA_CUSTOM_VALUE]
      end

      #####################################################
      # @!group Documentation
      #####################################################

      def self.description
        "Write a brief description of what the Action does in 80 characters or less."
      end

      def self.details
        "Write a more detailed description of what the Action does."
      end

      def self.available_options
        # Provide descriptions for all parameters supported by the Action. You can also validate input values using verify_block.
        [
          FastlaneCore::ConfigItem.new(key: :api_token,
                                       env_name: "FL_VALIDATE_IPA_API_TOKEN", # Name of the environment variable
                                       description: "API Token for ValidateIpaAction", # Brief description of the parameter
                                       verify_block: proc do |value|
                                          UI.user_error!("No API token for ValidateIpaAction given, pass using `api_token: 'token'`") unless (value and not value.empty?)
                                       end),
          FastlaneCore::ConfigItem.new(key: :development,
                                       env_name: "FL_VALIDATE_IPA_DEVELOPMENT",
                                       description: "Create a development certificate instead of a distribution one",
                                       is_string: false, # true: validates that input is a string, false: allows any data type
                                       default_value: false) # Uses default value if user provides no input.
        ]
      end

      def self.output
        # Write descriptions for the SharedValues defined above.
        [
          ['VALIDATE_IPA_CUSTOM_VALUE', 'Description of what the value contains']
        ]
      end

      def self.return_value
        # If the Action provides a return value, write a description for it.
      end

      def self.authors
        # Write your name or username.
        ["Your GitHub/Twitter Name"]
      end

      def self.is_supported?(platform)
        # Specify the platforms the Action supports.
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

## 4. Using the Action

```ruby
validate_ipa(
  api_token: "api_token",
  development: false
)
```

- Custom Actions can be used just like fastlane built-in Actions without any additional setup.

## 5. Submitting to the fastlane Main Repo

- If you want to submit your custom Action as a fastlane built-in Action, submit a PR to the [fastlane GitHub repository](https://github.com/fastlane/fastlane).

### 5.1. Cases Where Built-in Actions Are Approved

- Generally usable by the majority of developers.
- Addresses pain points of mobile app developers (iOS and Android).
- Has well-written documentation and good test coverage.

### 5.2. Cases Where Built-in Actions Are Rejected

- Solves a specific use case for only a small number of developers.
- Accesses third-party service APIs while the third-party service owns or maintains the Action.
- A complex Action that will require significant maintenance in the future.
- Anything unrelated to mobile development.

# References

- <https://docs.fastlane.tools/create-action/>
- <https://docs.fastlane.tools/advanced/actions>
- <https://docs.fastlane.tools/advanced/lanes/#lane-context>
- <https://github.com/fastlane/fastlane/issues/14255>
