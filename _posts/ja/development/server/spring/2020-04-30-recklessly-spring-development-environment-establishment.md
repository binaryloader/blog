---
date: 2020-04-30T00:00+09:00
title: "[Spring] Spring 5 開発環境を構築する"
ref: spring-development-environment-establishment
lang: ja
excerpt: "Spring 5 の開発環境を構築する方法をまとめる。"
last_modified_at: 2020-04-30T21:26+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/spring-development-environment-establishment.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/spring-development-environment-establishment.png"
categories:
  - Development
  - Server
  - Spring
tags:
  - Development
  - Server
  - Spring
  - Java
  - Maven
  - Gradle
  - Eclipse
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Server"
    url: /ja/development/server/
  - title: "Spring"
    url: /ja/development/server/spring/
gallery_eclipse:
  - url: /assets/image/post/development/server/spring/recklessly-spring-development-environment-establishment/eclipse.png
    image_path: /assets/image/post/development/server/spring/recklessly-spring-development-environment-establishment/eclipse.png
---

# 概要

Spring 5 の開発環境を構築する方法をまとめる。

# はじめに

運が悪いのか、サイドプロジェクトを進めるたびにサーバー開発を担当するはずだったチームメンバーが離脱するということが頻繁に起きる。
苦労してチームビルディングをし、企画をして、プロジェクトを始めると、大体3週間くらい経った時点から脱走者が出始める。

もちろん会社の仕事と並行しながらサイドプロジェクトを進めるのが大変だということは理解している。それでも皆が限られた時間を割いて取り組んでいるのだから、最後までやり遂げてほしいものだ。
そこで私はサイドプロジェクトのためのチームビルディングをやめ、自分一人でサーバー開発までやってみることにした。どうせ誰でも初めて触れる分野は体当たりで学ぶものだろう。

しかし何から始めればいいのか見当がつかず、書店に行って目に留まった本を1冊購入した。チェ・ボムギュン氏の著書「初心者ウェブ開発者のための Spring 5 プログラミング入門」である。
この本を通じて Spring フレームワークによるサーバー開発の全体的な流れを把握できればと思う。

また Spring フレームワークを学ぶ過程での試行錯誤はすべて「無謀な Spring 開発」シリーズを通じて記録していく。それでは最初のステップとして Spring 5 の開発環境を構築していこう。

# 開発環境の構築

## 1. JDK 8 のインストール

- [Java SE Development Kit 8](https://www.oracle.com/java/technologies/javase-jdk8-downloads.html) をダウンロードしてインストールする。
- 執筆時点のバージョンは 8u251 である。
- 環境変数を別途設定する必要があるが、各自で調べて対応してほしい。
- 以下のコマンドを実行して JDK が正しくインストールされたか確認する。

```zsh
java -version
java version "1.8.0_251"
Java(TM) SE Runtime Environment (build 1.8.0_251-b08)
Java HotSpot(TM) 64-Bit Server VM (build 25.251-b08, mixed mode)
```

## 2. Maven のインストール

- [Apache Maven Project](https://maven.apache.org/download.cgi) にアクセスしてバイナリアーカイブ (tar.gz) をダウンロードする。
- 執筆時点のバージョンは 3.6.3 である。
- 以下のコマンドを実行してアーカイブを解凍し、apache-maven-3.6.3 フォルダを`適切な場所`に移動する。

```zsh
tar xzf apache-maven-3.6.3-bin.tar.gz
```

- mvn コマンドを使うために環境変数を設定する必要がある。zsh を使用しているので `.zshrc` を開いて以下のように設定した。

```zsh
vi ~/.zshrc
```

- 前のステップで Maven フォルダを移動した`適切な場所`のパスを設定する。私は Library に移動したので {HOME}/Library/apache-maven-3.6.3 と設定した。

```zsh
export MVN=${HOME}/Library/apache-maven-3.6.3
export PATH=$PATH:${MVN}/bin
```

- そして以下のコマンドを実行して zshrc ファイルを再読み込みする。

```zsh
source ~/.zshrc
```

- ここまで完了したら以下のコマンドを実行して mvn コマンドが正常に動作するか確認する。

```zsh
mvn -version
Maven home: /Users/dongwook/Library/Apache-maven-3.6.3
Java version: 1.8.0_251, vendor: Oracle Corporation, runtime: /Library/Java/JavaVirtualMachines/jdk1.8.0_251.jdk/Contents/Home/jre
Default locale: ko_KR, platform encoding: UTF-8
OS name: "mac os x", version: "10.15.4", arch: "x86_64", family: "mac"
```

## 3. Gradle のインストール

- Gradle は Homebrew でインストールできる。
- 執筆時点のバージョンは 6.3 である。

```zsh
brew install gradle
```

- インストールが完了したら以下のコマンドを実行して Gradle が正しくインストールされたか確認する。

```zsh
gradle -version
Welcome to Gradle 6.3!
..省略..
Build time:   2020-03-24 19:52:07 UTC
Revision:     bacd40b727b0130eeac8855ae3f9fd9a0b207c60
Kotlin:       1.3.70
Groovy:       2.5.10
Ant:          Apache Ant(TM) version 1.10.7 compiled on September 1 2019
JVM:          13.0.2 (Oracle Corporation 13.0.2+8)
OS:           Mac OS X 10.15.4 x86_64
```

## 4. Eclipse のインストール

- [Eclipse Foundation](https://www.eclipse.org/downloads/) のサイトにアクセスしてダウンロード・インストールする。
- 私は Eclipse IDE for Enterprise Java Developers を選択した。
- インストールが完了したら以下のように Eclipse が正常に起動するか確認しよう。

{% include gallery id="gallery_eclipse" %}

# おわりに

ここまで完了すれば Spring 5 の開発環境構築はすべて完了である。iOS 開発とは異なり開発環境の構築が慣れないもので、思ったより時間がかかった。
今日はここまでにして、次回はプロジェクトを作成してお馴染みの `Hello, World!` を出力してみよう。
