---
date: 2021-10-20T00:00+09:00
title: "[CI/CD] fastlane Pluginを作成する"
ref: create-fastlane-plugin
excerpt: "fastlaneのカスタムPluginを作成・配布する方法をまとめる。"
lang: ja
last_modified_at: 2021-10-20T13:34+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/create-fastlane-plugin.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/create-fastlane-plugin.png"
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
  - iOS
  - Automation
  - Ruby
  - RubyGems
depth:
  - title: "Development"
    url: /ja/development/
  - title: "CS"
    url: /ja/development/cs/
  - title: "Software Engineering"
    url: /ja/development/cs/software-engineering/
  - title: "CI/CD"
    url: /ja/development/cs/software-engineering/ci-cd/
gallery_plugin-folder-structure:
  - url: /assets/image/post/development/cs/software-engineering/ci-cd/create-fastlane-plugin/plugin-folder-structure.png
    image_path: /assets/image/post/development/cs/software-engineering/ci-cd/create-fastlane-plugin/plugin-folder-structure.png
---

# 概要

fastlaneのカスタムPluginを作成・配布する方法をまとめる。

# 手順

## 1. Pluginの例

- [fastlane-plugin-validate_ipa](https://github.com/hacoma/fastlane-plugin-validate_ipa/)

## 2. Pluginテンプレートの生成

```zsh
fastlane new_plugin
```

- Pluginの命名は`testflight`や`upload_to_s3`のような形式で記述する。

```
Would 'hacoma_' be okay to use for your plugin name?
```

- 名前に`plugin`という単語が含まれていると上記の出力のように`plugin`が省略されるので注意が必要だ。
- 例：名前にhacoma_pluginと入力した場合、hacoma_に変更される。

```
Please enter a short summary of this fastlane plugin:
```

- Pluginについての簡潔な説明を記述する。
- 入力した文字列は以下の箇所で使用される。
  - fastlane-plugin-[plugin_name].gemspecファイルの`spec.summary`
  - README.mdファイルの`About [plugin_name]`
  - plugin_name_action.rbファイルの`self.description`

```
Please enter a detailed description of this fastlane plugin:
```

- Pluginについてより詳細な説明を記述する。
- 入力した文字列は以下の箇所で使用される。
  - plugin_name_action.rbファイルの`self.details`

## 3. Pluginのフォルダ構造

{% include gallery id="gallery_plugin-folder-structure" %}

### 3.1. fastlane/Fastfile

- Pluginが持つActionの機能や使用方法を示すためにテストLaneを提供する。

### 3.2. fastlane-plugin-[plugin_name].gemspec

- fastlane Pluginはgemを通じて配布およびバージョン管理を行い、gemに関するすべての情報は`.gemspec`ファイルに記述されている。
- テンプレートを使用してPluginを生成したため、大部分の情報は既に記述されている。`spec.homepage`のコメントを解除して該当Pluginの GitHubリポジトリのURLを入力する。

### 3.3. lib/fastlane/plugin/plugin_name/actions/plugin_name_action.rb

- このファイルにPluginがサポートするActionを実装する。
- Actionの実装方法は[[CI/CD] fastlane Actionを作成する](/ja/development/cs/software-engineering/ci-cd/create-fastlane-action/)の記事を参考にする。
- Pluginで複数のActionをサポートする場合は、このファイルと同じパスにファイルを追加する。
  - 例：action1.rb, action2.rb, action3.rb, ...

### 3.4. lib/fastlane/plugin/plugin_name/helper/plugin_name_helper.rb

- このファイルにActionで使用するユーティリティ機能を実装する。helperに実装したメソッドはActionから呼び出して使用できる。
- 複数のActionをサポートする場合はhelperファイルもAction名を持つ別ファイルを作成して記述する。

### 3.5. lib/fastlane/plugin/plugin_name/version.rb

- Pluginのバージョンを定義する。`.gemspec`ファイルの以下の行が`version.rb`ファイルに記述されたバージョン情報を参照する。
- `spec.version = Fastlane::HacomaWrapper::VERSION`

### 3.6. README.md

- Pluginユーザーのために Example部分にサンプルコードを詳しく記述する。
- 修正または追加すべき内容があれば記述する。

### 3.7. spec/plugin_name_action_spec.rb

- BDD方法論に基づいたテストコードを記述する。
- 複数のActionをサポートする場合はテストコードもAction名を持つ別ファイルを作成して記述する。

## 4. Pluginの使用

- Pluginの使用方法は[[CI/CD] fastlane Pluginを使用する](/ja/development/cs/software-engineering/ci-cd/use-fastlane-plugins/)の記事を参考にする。

## 5. Pluginの配布

### 5.1. RubyGems

1. [RubyGems.org](https://rubygems.org/)のアカウントを作成する。
2. GitHubリポジトリにPluginをpushする。
3. `.gemspec`ファイルを更新する。`spec.homepage`はPluginをpushしたGitHubリポジトリのURLである。
4. 以下のコマンドを実行して配布する。
    ```zsh
    bundle install
    rake install
    rake release
    ```

- コマンドの実行中に以下のようなエラーが出力された場合はsystemで使用中のgemをアップデートする。

  ```
  ERROR:  While executing gem ... (NameError)
      uninitialized constant Gem::ConfigFile::FileUtils
  Did you mean?  FileTest
  ```

  ```zsh
  gem update --system
  ```

### 5.2. GitHub

- RubyGemsに配布したくない場合はGitHubを通じてPluginを配布することもできる。
- ただしバージョン管理はタグまたは他の適切な方法を使用する。

  ```ruby
  gem "fastlane-plugin-[plugin_name]", git: "https://github.com/[user]/[plugin_name]"
  gem "fastlane-plugin-[plugin_name]", git: "https://github.com/[user]/[plugin_name]", tag: 1.0.0
  ```

# 参考

- <https://bundler.io/guides/git.html>
- <https://docs.fastlane.tools/plugins/create-plugin/>
- <https://rubygems.org/>
