---
title: "[CI/CD] Creating a fastlane Plugin"
ref: create-fastlane-plugin
excerpt: "How to create and distribute a custom fastlane Plugin."
lang: en
last_modified_at: 2021-10-20T13:34+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Development
  - CS
  - Software-Engineering
  - CI-CD
tags:
  - Development
  - CS
  - Software Engineering
  - CI/CD
  - fastlane
  - Plugin
depth:
  - title: "Development"
    url: /en/development/
  - title: "CS"
    url: /en/development/cs/
  - title: "Software Engineering"
    url: /en/development/cs/software-engineering/
  - title: "CI/CD"
    url: /en/development/cs/software-engineering/ci-cd/
gallery_plugin-folder-structure:
  - url: /assets/image/post/development/cs/software-engineering/ci-cd/create-fastlane-plugin/plugin-folder-structure.png
    image_path: /assets/image/post/development/cs/software-engineering/ci-cd/create-fastlane-plugin/plugin-folder-structure.png
---

# Overview

This post covers how to create and distribute a custom fastlane Plugin.

# Guide

## 1. Plugin Example

- [fastlane-plugin-validate_ipa](https://github.com/hacoma/fastlane-plugin-validate_ipa/)

## 2. Generating a Plugin Template

```zsh
fastlane new_plugin
```

- Plugin naming should follow formats like `testflight` or `upload_to_s3`.

```
Would 'hacoma_' be okay to use for your plugin name?
```

- If the name contains the word `plugin`, it will be stripped as shown above, so be careful.
- Example: If you enter hacoma_plugin as the name, it will be changed to hacoma_.

```
Please enter a short summary of this fastlane plugin:
```

- Write a brief description of the Plugin.
- The entered string is used in the following places:
  - `spec.summary` in the fastlane-plugin-[plugin_name].gemspec file
  - `About [plugin_name]` in the README.md file
  - `self.description` in the plugin_name_action.rb file

```
Please enter a detailed description of this fastlane plugin:
```

- Write a more detailed description of the Plugin.
- The entered string is used in the following place:
  - `self.details` in the plugin_name_action.rb file

## 3. Plugin Folder Structure

{% include gallery id="gallery_plugin-folder-structure" %}

### 3.1. fastlane/Fastfile

- Provides test lanes to demonstrate the features and usage of the Actions included in the Plugin.

### 3.2. fastlane-plugin-[plugin_name].gemspec

- fastlane Plugins are distributed and versioned through gems, and all gem-related information is written in the `.gemspec` file.
- Since the Plugin was created using a template, most of the information is already filled in. Uncomment `spec.homepage` and enter the GitHub repository URL for the Plugin.

### 3.3. lib/fastlane/plugin/plugin_name/actions/plugin_name_action.rb

- Implement the Actions supported by the Plugin in this file.
- For how to implement Actions, refer to the [[macOS] Creating a fastlane Action](https://hacoma.github.io/pc/macos/create-fastlane-action/) post.
- If you want the Plugin to support multiple Actions, add additional files in the same directory.
  - Example: action1.rb, action2.rb, action3.rb, ...

### 3.4. lib/fastlane/plugin/plugin_name/helper/plugin_name_helper.rb

- Implement utility functions used by Actions in this file. Methods implemented in the helper can be called from Actions.
- If supporting multiple Actions, create separate helper files named after each Action.

### 3.5. lib/fastlane/plugin/plugin_name/version.rb

- Defines the Plugin version. The following line in the `.gemspec` file references the version information written in the `version.rb` file.
- `spec.version = Fastlane::HacomaWrapper::VERSION`

### 3.6. README.md

- Write detailed sample code in the Example section for Plugin users.
- Add or modify any additional content as needed.

### 3.7. spec/plugin_name_action_spec.rb

- Write test code based on the BDD methodology.
- If supporting multiple Actions, create separate test files named after each Action.

## 4. Using the Plugin

- For how to use Plugins, refer to the [[macOS] Using fastlane Plugins](https://hacoma.github.io/pc/macos/use-fastlane-plugins/) post.

## 5. Distributing the Plugin

### 5.1. RubyGems

1. Create an account on [RubyGems.org](https://rubygems.org/).
2. Push the Plugin to a GitHub repository.
3. Update the `.gemspec` file. `spec.homepage` should be the URL of the GitHub repository where the Plugin was pushed.
4. Run the following commands to distribute:
    ```zsh
    bundle install
    rake install
    rake release
    ```

- If you encounter the following error while running the commands, update the system gem:

  ```
  ERROR:  While executing gem ... (NameError)
      uninitialized constant Gem::ConfigFile::FileUtils
  Did you mean?  FileTest
  ```

  ```zsh
  gem update --system
  ```

### 5.2. GitHub

- If you don't want to distribute via RubyGems, you can distribute the Plugin through GitHub instead.
- However, use tags or another appropriate method for version management.

  ```ruby
  gem "fastlane-plugin-[plugin_name]", git: "https://github.com/[user]/[plugin_name]"
  gem "fastlane-plugin-[plugin_name]", git: "https://github.com/[user]/[plugin_name]", tag: 1.0.0
  ```

# References

- <https://docs.fastlane.tools/plugins/create-plugin/>
- <https://bundler.io/guides/git.html>
- <https://rubygems.org/>
