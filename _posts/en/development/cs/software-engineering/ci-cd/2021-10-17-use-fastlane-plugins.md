---
date: 2021-10-17T00:00+09:00
title: "[CI/CD] Using fastlane Plugins"
ref: use-fastlane-plugins
excerpt: "How to add and manage fastlane plugins."
lang: en
last_modified_at: 2021-10-17T04:32+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/use-fastlane-plugins.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/use-fastlane-plugins.png"
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

This post covers how to add and manage fastlane plugins.

# Steps

## 1. Adding a Plugin Dependency

### 1.1. Adding via Command

```zsh
fastlane add_plugin [name]
```

- Navigate to the project directory where `fastlane` is set up and run the command above.

```
1. Git URL
2. Local Path
3. RubyGems.org ('fastlane-plugin-hacoma_wrapper' seems to not be available
there)
4. Other Gem Server
```

- Select where the plugin file is located and enter the appropriate path or URL.
- If you select `Local Path`, enter the path to the folder containing the `.gemspec` file.
- After completing all the steps above, the following changes will occur:
  - A `Pluginfile` is created inside the `fastlane` folder, and the plugin dependency is added to this file.
  - The following two lines are added to the `Gemfile` in the project root:
    ```ruby
      plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
      eval_gemfile(plugins_path) if File.exist?(plugins_path)
    ```

### 1.2. Adding by Editing the Pluginfile

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

- Edit the `Pluginfile` inside the `fastlane` folder as shown above. If the `Pluginfile` does not exist, create a new one.

```ruby
plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
```

- Add the two lines above to the `Gemfile` in the project root.

## 2. Installing Plugins

```zsh
bundle install
bundle exec fastlane install_plugins
```

## 3. Updating Plugins

```zsh
bundle install
bundle exec fastlane update_plugins
```

## 4. Removing a Plugin

- Delete the plugin dependency line from the `Pluginfile`.
- Then run the plugin install command.

### 4.1. Before Removal

```
gem "fastlane-plugin-name"
gem "fastlane-plugin-name2"
```

### 4.2. After Removal

```
gem "fastlane-plugin-name"
```

# References

- <https://docs.fastlane.tools/plugins/using-plugins/>
- <https://bundler.io/gemfile.html>
