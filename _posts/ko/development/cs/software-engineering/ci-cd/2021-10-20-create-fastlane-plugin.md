---
date: 2021-10-20T00:00+09:00
title: "[CI/CD] fastlane Plugin 만들기"
ref: create-fastlane-plugin
excerpt: "fastlane의 커스텀 Plugin을 만들고 배포하는 방법을 정리한다."
last_modified_at: 2021-10-20T13:34+09:00
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
  - Plugin
depth:
  - title: "Development"
    url: /ko/development/
  - title: "CS"
    url: /ko/development/cs/
  - title: "Software Engineering"
    url: /ko/development/cs/software-engineering/
  - title: "CI/CD"
    url: /ko/development/cs/software-engineering/ci-cd/
gallery_plugin-folder-structure:
  - url: /assets/image/post/development/cs/software-engineering/ci-cd/create-fastlane-plugin/plugin-folder-structure.png
    image_path: /assets/image/post/development/cs/software-engineering/ci-cd/create-fastlane-plugin/plugin-folder-structure.png
---

# 개요

fastlane의 커스텀 Plugin을 만들고 배포하는 방법을 정리한다.

# 정리

## 1. Plugin 예시

- [fastlane-plugin-validate_ipa](https://github.com/hacoma/fastlane-plugin-validate_ipa/)

## 2. Plugin 템플릿 생성

```zsh
fastlane new_plugin
```

- Plugin 네이밍은 `testflight`, `upload_to_s3`와 같은 형태로 작성한다.

```
Would 'hacoma_' be okay to use for your plugin name?
```

- 이름에 `plugin` 단어가 들어가면 위의 출력처럼 `plugin`이 생략이 되니 주의해야 한다.
- 예시 : 이름으로 hacoma*plugin을 입력한 경우 hacoma*로 변경된다.

```
Please enter a short summary of this fastlane plugin:
```

- Plugin에 대한 간단한 설명을 작성한다.
- 입력한 문자열은 아래 영역에 사용된다.
  - fastlane-plugin-[plugin_name].gemspec 파일의 `spec.summary`
  - README.md 파일의 `About [plugin_name]`
  - plugin_name_action.rb 파일의 `self.description`

```
Please enter a detailed description of this fastlane plugin:
```

- Plugin에 대한 보다 자세한 설명을 작성한다.
- 입력한 문자열은 아래 영역에 사용된다.
  - plugin_name_action.rb 파일의 `self.details`

## 3. Plugin 폴더 구조

{% include gallery id="gallery_plugin-folder-structure" %}

### 3.1. fastlane/Fastfile

- Plugin이 가지고 있는 Action의 기능이나 사용 방법을 보여주기 위하여 테스트 Lane을 제공한다.

### 3.2. fastlane-plugin-[plugin_name].gemspec

- fastlane Plugin은 gem을 통하여 배포 및 버전 관리를 하는데 gem에 관한 모든 정보는 `.gemspec` 파일에 작성되어 있다.
- 템플릿을 통하여 Plugin을 생성하였기 때문에 이미 대부분의 정보가 작성되어있다. `spec.homepage`는 주석을 풀어서 해당 Plugin의 GitHub 저장소 주소를 넣어주면 된다.

### 3.3. lib/fastlane/plugin/plugin_name/actions/plugin_name_action.rb

- 해당 파일에 Plugin에서 지원하는 Action을 구현하면 된다.
- Action의 구현 방법은 [[CI/CD] fastlane Action 만들기](/ko/development/cs/software-engineering/ci-cd/create-fastlane-action/) 포스트를 참고하면 된다.
- Plugin에서 여러 개의 Action을 지원하려고 한다면 이 파일과 동일한 경로에 원하는 대로 파일을 추가하면 된다.
  - 예시 : action1.rb, action2.rb, action3.rb, ...

### 3.4. lib/fastlane/plugin/plugin_name/helper/plugin_name_helper.rb

- 해당 파일에 Action에서 사용할 유틸성 기능을 구현하면 된다. helper에 구현한 메서드는 Action에서 호출하여 사용할 수 있다.
- 여러 개의 Action을 지원한다면 helper 파일도 Action의 이름을 가진 별도의 파일을 생성하여 작성한다.

### 3.5. lib/fastlane/plugin/plugin_name/version.rb

- Plugin의 버전을 정의한다. `.gemspec` 파일의 아래 라인이 `version.rb` 파일에 작성된 버전 정보를 참조한다.
- `spec.version = Fastlane::HacomaWrapper::VERSION`

### 3.6. REAME.md

- Plugin 사용자를 위하여 Example 영역에 샘플 코드를 자세하게 작성한다.
- 수정하거나 추가할 내용이 있다면 작성한다.

### 3.7. spec/plugin_name_action_spec.rb

- BDD 방법론 기반의 테스트 코드를 작성한다.
- 여러 개의 Action을 지원한다면 테스트 코드도 Action의 이름을 가진 별도의 파일을 생성하여 작성한다.

## 4. Plugin 사용

- Plugin 사용 방법은 [[CI/CD] fastlane Plugin 사용하기](/ko/development/cs/software-engineering/ci-cd/use-fastlane-plugins/) 포스트를 참고하면 된다.

## 5. Plugin 배포

### 5.1. RubyGems

1. [RubyGems.org](https://rubygems.org/)의 계정을 생성한다.
2. GitHub 저장소에 Plugin을 push 한다.
3. `.gemspec` 파일을 업데이트한다. `spec.homepage`는 Plugin을 push 한 GitHub 저장소의 주소이다.
4. 아래 커맨드를 수행하여 배포한다.
    ```zsh
    bundle install
    rake install
    rake release
    ```

- 커맨드를 수행하다가 아래와 같은 에러가 출력될 경우 system에서 사용 중인 gem을 업데이트하면 된다.

  ```
  ERROR:  While executing gem ... (NameError)
      uninitialized constant Gem::ConfigFile::FileUtils
  Did you mean?  FileTest
  ```

  ```zsh
  gem update --system
  ```

### 5.2. GitHub

- RubyGems에 배포하기 싫다면 GitHub를 통해 Plugin을 배포할 수도 있다.
- 단, 버전 관리는 태그를 사용하거나 다른 적절한 방법을 사용한다.

  ```ruby
  gem "fastlane-plugin-[plugin_name]", git: "https://github.com/[user]/[plugin_name]"
  gem "fastlane-plugin-[plugin_name]", git: "https://github.com/[user]/[plugin_name]", tag: 1.0.0
  ```

# 참고

- <https://docs.fastlane.tools/plugins/create-plugin/>
- <https://bundler.io/guides/git.html>
- <https://rubygems.org/>
