---
date: 2019-11-14T00:00+09:00
title: "[Objective-C] スタディリソース集"
ref: objective-c-study-resource-collections
lang: ja
excerpt: "Objective-C学習に役立つスタディリソースをまとめる。"
last_modified_at: 2019-11-14T13:12+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Development
  - Language
  - Objective-C
tags:
  - Development
  - Language
  - Objective-C
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Language"
    url: /ja/development/language/
  - title: "Objective-C"
    url: /ja/development/language/objective-c/
---

# 概要

Objective-C学習に役立つスタディリソースをまとめる。

# はじめに

私がiOS開発に入門した時に勉強したObjective-Cのスタディリソースを整理してみた。整理しながらドキュメントを一つずつ見直していると、Objective-Cを集中的に勉強して使ってからかなりの時間が経ったため改めて響く資料もあり、私も一部の資料は再度見直して復習する必要がありそうだ。

ところでObjective-CとFoundationを分離して扱うのが難しいためか、この2つを一緒に説明しているスタディリソースが多かった。それでもこの2つを同時に勉強するなら、Objective-CとFoundationの違いを明確に区別して理解しておくことが望ましい。

Objective-C言語自体ではクラスベースの文字列、数値、コレクションなどのデータ型やネットワーク、OSサービスなどはサポートしていないため、アプリ実装に必要な基本的なレイヤーを定義したFoundationという別のフレームワークが提供されている。

Objective-C != Foundation

そして今後機会があれば、書籍を除いた著作権の問題がない残りのリソースを翻訳して整理する時間も持ちたいと思う。

# リソース

## 1. Apple開発者ドキュメント

- [The Objective-C Programming Language](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjectiveC/Introduction/introObjectiveC.html)
- [Programming with Objective-C](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ProgrammingWithObjectiveC/Introduction/Introduction.html)
- [Concepts in Objective-C Programming](https://developer.apple.com/library/archive/documentation/General/Conceptual/CocoaEncyclopedia/Introduction/Introduction.html#//apple_ref/doc/uid/TP40010810)
- [Objective-C Runtime Programming Guide](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Introduction/Introduction.html#//apple_ref/doc/uid/TP40008048)
- [Objective-C Runtime Documentation](https://developer.apple.com/documentation/objectivec/objective-c_runtime)
- [Advanced Memory Management Programming Guide](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/MemoryMgmt/Articles/MemoryMgmt.html#//apple_ref/doc/uid/10000011i)
- [Object-Oriented Programming with Objective-C](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/OOP_ObjC/Introduction/Introduction.html#//apple_ref/doc/uid/TP40005149)

**警告:** Apple開発者ドキュメントはいつでも削除される可能性がある。
{: .notice--warning}

## 2. Clang 11ドキュメント

- [Clang Language Extensions - Objective-C Features](https://clang.llvm.org/docs/LanguageExtensions.html?highlight=objective#objective-c-features)
- [Objective-C Literals](https://clang.llvm.org/docs/ObjectiveCLiterals.html?highlight=objective)
- [Objective-C Automatic Reference Counting (ARC)](https://clang.llvm.org/docs/AutomaticReferenceCounting.html?highlight=objective)
- [Block Implementation Specification - Objective-C Extensions to Blocks](https://clang.llvm.org/docs/Block-ABI-Apple.html?highlight=objective#objective-c-extensions-to-blocks)
- [Language Specification for Blocks - Objective-C Extensions](https://clang.llvm.org/docs/BlockLanguageSpec.html?highlight=objective#objective-c-extensions)

## 3. 書籍

- プログラミングObjective-C 2.0、スティーブン・コーチャン
- アーロン・ヒリガスのObjective-Cプログラミング、アーロン・ヒリガス
- Objective-C開発レシピ、マシュー・キャンベル
- Objective-Cハンドブック、林晃
- OS X構造を理解しながら学ぶObjective-C、荻原剛志
- エフェクティブObjective-C 2.0、マット・ギャロウェイ
- プロObjective-Cデザインパターン、カルロ・チョン
- Cocoa Internals、キム・ジョン

## 4. Naverモバイル教育

- [iOS アプリ開発初級](https://tv.naver.com/v/364932/list/33493)
- [iOS アプリ開発問題解決中級](https://tv.naver.com/v/384067/list/35318)

## 5. BinaryLoader's Objective-C Series

- [[Objective-C] プリミティブデータ型 - Primitive Data Types](/ja/development/language/objective-c/primitive-data-types/)
- [[Objective-C] 演算子と式 - Operators and Expressions](/ja/development/language/objective-c/operators-and-expressions/)
- [[Objective-C] ループ文 - Loop Statements](/ja/development/language/objective-c/loop-statements/)
- [[Objective-C] 条件分岐文 - Branch Statements](/ja/development/language/objective-c/branch-statements/)
- [[Objective-C] クラスとメソッド、インスタンス - Class and Method, Instance](/ja/development/language/objective-c/class-instance-method/)
- [Objective-C] 継承
- [Objective-C] ポリモーフィズムと動的型付け、動的バインディング
- [Objective-C] 変数とAccess Modifiers
- [Objective-C] プロパティ
- [Objective-C] カテゴリとプロトコル
- [Objective-C] プリプロセッサ
- [Objective-C] ブロック
- [Objective-C] Generics
- [Objective-C] Nullability
- [Objective-C] ANSI C
