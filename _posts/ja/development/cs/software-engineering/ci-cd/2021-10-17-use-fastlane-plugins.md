---
date: 2021-10-17T00:00+09:00
title: "[CI/CD] fastlane Pluginを使用する"
ref: use-fastlane-plugins
excerpt: "fastlane Pluginを追加・管理する方法をまとめる。"
lang: ja
last_modified_at: 2021-10-17T04:32+09:00
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
    url: /ja/development/
  - title: "CS"
    url: /ja/development/cs/
  - title: "Software Engineering"
    url: /ja/development/cs/software-engineering/
  - title: "CI/CD"
    url: /ja/development/cs/software-engineering/ci-cd/
---

# 概要

fastlane Pluginを追加・管理する方法をまとめる。

# 手順

## 1. Pluginの依存関係を追加

### 1.1. コマンドの実行で追加

```zsh
fastlane add_plugin [name]
```

- `fastlane`が適用されたプロジェクトのパスに移動して上記コマンドを実行する。

```
1. Git URL
2. Local Path
3. RubyGems.org ('fastlane-plugin-hacoma_wrapper' seems to not be available
there)
4. Other Gem Server
```

- Pluginファイルが配置されている場所を選択し、適切なパスまたはURLを入力する。
- `Local Path`を選択した場合は`.gemspec`ファイルがあるフォルダのパスを入力する。
- 上記のすべての手順を完了すると以下の変更が発生する。
  - `fastlane`フォルダ内に`Pluginfile`が作成され、このファイルにプラグインの依存関係が追加される。
  - プロジェクトルートの`Gemfile`に以下の2行が追加される。
    ```ruby
      plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
      eval_gemfile(plugins_path) if File.exist?(plugins_path)
    ```

### 1.2. Pluginfileを編集して追加

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

- `fastlane`フォルダ内の`Pluginfile`を上記のように編集する。`Pluginfile`が存在しない場合は新規作成する。

```ruby
plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
```

- プロジェクトルートの`Gemfile`に上記の2行を追加する。

## 2. Pluginのインストール

```zsh
bundle install
bundle exec fastlane install_plugins
```

## 3. Pluginのアップデート

```zsh
bundle install
bundle exec fastlane update_plugins
```

## 4. Pluginの削除

- `Pluginfile`から削除したいPluginの依存関係の行を削除する。
- その後Pluginインストールコマンドを実行する。

### 4.1. 削除前

```
gem "fastlane-plugin-name"
gem "fastlane-plugin-name2"
```

### 4.2. 削除後

```
gem "fastlane-plugin-name"
```

# 参考

- <https://docs.fastlane.tools/plugins/using-plugins/>
- <https://bundler.io/gemfile.html>
