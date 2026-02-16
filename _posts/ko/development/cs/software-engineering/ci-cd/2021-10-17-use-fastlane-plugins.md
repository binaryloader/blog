---
date: 2021-10-17T00:00+09:00
title: "[CI/CD] fastlane Plugin 사용하기"
ref: use-fastlane-plugins
excerpt: "fastlane Plugin을 추가하고 관리하는 방법을 정리한다."
last_modified_at: 2021-10-17T04:32+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/use-fastlane-plugins.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/use-fastlane-plugins.png"
categories:
  - Development
  - CS
  - Software Engineering
  - CI/CD
tags:
  - Development
  - CS
  - Software Engineering
  - CI/CD
  - fastlane
  - Plugin
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

fastlane Plugin을 추가하고 관리하는 방법을 정리한다.

# 정리

## 1. Plugin 의존성 추가

### 1.1. 커맨드 수행을 통해 추가

```zsh
fastlane add_plugin [name]
```

- `fastlane`이 적용된 프로젝트 경로로 이동하여 위 커맨드를 수행한다.

```
1. Git URL
2. Local Path
3. RubyGems.org ('fastlane-plugin-hacoma_wrapper' seems to not be available
there)
4. Other Gem Server
```

- Plugin 파일이 위치한 곳을 선택하고 적절한 경로 또는 주소를 입력한다.
- `Local Path`를 선택한 경우 `.gemspec` 파일이 있는 폴더의 경로를 적어준다.
- 위 모든 과정을 수행하면 아래와 같은 변경사항이 발생한다.
  - `fastlane` 폴더 안에 `Pluginfile`이 생성되며 이 파일에 플러그인 의존성이 추가된다.
  - 프로젝트 경로에 위치한 `Gemfile`에 아래 두 라인이 추가된다.
    ```ruby
      plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
      eval_gemfile(plugins_path) if File.exist?(plugins_path)
    ```

### 1.2. Pluginfile 수정을 통해 추가

```ruby
# Fetched from RubyGems.org
gem "fastlane-plugin-name"

# Fetched from GitHub
gem "fastlane-plugin-name", git: "https://github.com/fastlane/fastlane-plugin-name"
gem "fastlane-plugin-name", git: "https://github.com/fastlane/fastlane-plugin-name", tag: '1.1.0'

# Fetched from a local directory
gem "fastlane-plugin-name", path: "../fastlane-plugin-name"

# Specify a version requirements
gem "fastlane-plugin-name", "1.1.0"
gem "fastlane-plugin-name", ">= 1.0"
```

- `fastlane` 폴더 안의 `Pluginfile`을 위와 같이 수정한다. `Pluginfile`이 존재하지 않는다면 새로 생성한다.

```ruby
plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
```

- 프로젝트 경로에 위치한 `Gemfile`에 위의 두 라인을 추가한다.

## 2. Plugin 설치

```zsh
bundle install
bundle exec fastlane install_plugins
```

## 3. Plugin 업데이트

```zsh
bundle install
bundle exec fastlane update_plugins
```

## 4. Plugin 제거

- `Pluginfile`에서 제거하려는 Plugin 의존성 라인을 삭제한다.
- 이후 Plugin 설치 커맨드를 수행한다.

### 4.1. 제거 전

```
gem "fastlane-plugin-name"
gem "fastlane-plugin-name2"
```

### 4.2. 제거 후

```
gem "fastlane-plugin-name"
```

# 참고

- <https://docs.fastlane.tools/plugins/using-plugins/>
- <https://bundler.io/gemfile.html>
