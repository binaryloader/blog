---
title: "[cmux] AIエージェントの並列運用に特化したGhostty製ネイティブmacOSターミナル"
lang: ja
permalink: /ja/:categories/:title/
ref: cmux-terminal
excerpt: "Ghosttyエンジンをlibghosttyとして内蔵したSwift + AppKit製ネイティブターミナルcmux。Claude CodeやAider、Clineなど複数のエージェンティックコーディングアシスタントを一つのウィンドウで並列実行するために設計されたオープンソースmacOSアプリのインストールと活用方法をまとめる。"
date: 2026-04-19T10:20+09:00
last_modified_at: 2026-04-19T10:20+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/cmux-terminal.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/cmux-terminal.png"
categories:
  - Development
  - AI
  - Agentic-Coding-Assistant
  - Terminal
tags:
  - cmux
  - Ghostty
  - Terminal
  - macOS
  - Agentic Coding
  - Claude Code
depth:
  - title: "Development"
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "Agentic Coding Assistant"
    url: /ja/development/ai/agentic-coding-assistant/
  - title: "Terminal"
    url: /ja/development/ai/agentic-coding-assistant/terminal/
sidebar:
  nav: "menu-ja"
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: Claude
---

# 概要

Ghosttyエンジンをlibghosttyとして内蔵したSwift + AppKit製ネイティブターミナルcmux。Claude CodeやAider、Clineなど複数のエージェンティックコーディングアシスタントを一つのウィンドウで並列実行するために設計されたオープンソースmacOSアプリのインストールと活用方法をまとめる。

# 手順

## 1. cmuxとは

cmuxは[manaflow-ai](https://github.com/manaflow-ai/cmux)が公開したオープンソースのmacOSターミナルである。内部的にはGhosttyのエンジンであるlibghosttyを利用しているが、Ghostty本体とは別のアプリとして配布されている。Ghostty譲りのGPU加速レンダリングを維持しつつ、SwiftとAppKitで書かれた完全なネイティブアプリとして動作する。Electronベースではないため、起動速度もメモリ使用量も軽量である。

cmuxを一般的なターミナルと分けるのは設計意図である。Claude Code、Aider、Clineといった複数のエージェンティックコーディングアシスタントを、一つのウィンドウの中で同時並列で走らせるために作られている。各エージェントの入出力は独立したタブや分割ペインに分けつつ、通知バッジ、作業ディレクトリ、リッスンポート、gitブランチといった状態をサイドバー一箇所に集約する構成である。エージェンティックコーディングのワークフローで「今どのエージェントが入力待ちになっているか」を見落とさないためのUXに最適化されている。

対応環境はmacOS 14.0以降で、Apple SiliconとIntel Mac双方に対応する。ライセンスはオープンソースで、無料で利用できる。

## 2. 主な機能

縦タブサイドバーがcmuxの顔である。タブが縦に積み上がり、各タブにはgitブランチ、現在の作業ディレクトリ、リッスン中のポート、通知バッジが自動表示される。複数のエージェントが同時にログを吐き出していても、サイドバーを一瞥するだけでどのセッションに注意を払うべきかが即座に把握できる。

ウィンドウ分割は水平方向と垂直方向の両方に対応している。左でClaude Codeがコードを編集し、右でAiderがコミットを準備し、下でローカルサーバーのログを流す、といった配置が一つのウィンドウ内で自然に実現する。

ワークスペース(Workspaces)はプロジェクトや文脈を分けるための上位コンテナである。プロジェクトごとにワークスペースを作れば、タブ構成と分割レイアウトがまるごと分離される。一つの画面で複数のリポジトリを並行して扱う際に特に役立つ。

通知リングはエージェンティックコーディングに最も最適化された機能である。エージェントがユーザーの入力待ち状態に遷移すると、該当パネルの枠が光るリングで強調され、サイドバーにバッジが出て、同時にmacOSのデスクトップ通知が発火する。長時間作業を並列で走らせて別ウィンドウでレビューしていても、入力を求められた瞬間を逃さない。

内蔵ブラウザはターミナルの隣に分割配置できるスクリプタブルなブラウザである。エージェントがビルドしたWebサーバーを隣のペインで開いて確認したり、ドキュメントを横に置いたままコードを書いたりする用途に使える。自動化用のソケットAPIも提供されており、外部スクリプトからcmuxのタブやペインを制御できる。

## 3. インストール

インストール方法は2通りである。DMGを直接ダウンロードする方法と、Homebrew経由でインストールする方法がある。

DMGをダウンロードする場合は以下のリンクを利用する。

```
https://github.com/manaflow-ai/cmux/releases/latest/download/cmux-macos.dmg
```

Homebrewユーザーは以下のコマンドでtapを追加しインストールする。

```bash
brew tap manaflow-ai/cmux
brew install --cask cmux
```

どちらの方法でインストールしても、初回起動時にmacOSのセキュリティ確認が表示される。アプリケーションフォルダでcmuxを右クリックして「開く」を選択すれば、以降は通常通り起動する。

ターミナルから`cmux`コマンドを直接呼び出したい場合はCLIシンボリックリンクを作成する。任意だが、自動化スクリプトや他のツールからcmuxを起動する際に便利である。

```bash
sudo ln -sf "/Applications/cmux.app/Contents/Resources/bin/cmux" /usr/local/bin/cmux
```

## 4. キーボードショートカット

cmuxの生産性はショートカットの習熟に直結する。範囲別にまとめると以下のとおりである。

アプリ全体のショートカットは設定画面、コマンドパレット、ウィンドウ管理で使う。

| 操作 | ショートカット |
|------|---------------|
| 設定を開く | `⌘+,` |
| コマンドパレット | `⌘+⇧+P` |
| 新規ウィンドウ | `⌘+⇧+N` |
| 終了 | `⌘+Q` |

ワークスペース系はサイドバー切り替えと数字キー選択が中心となる。

| 操作 | ショートカット |
|------|---------------|
| サイドバー切り替え | `⌘+B` |
| 新規ワークスペース | `⌘+N` |
| 次のワークスペース | `⌃+⌘+]` |
| 前のワークスペース | `⌃+⌘+[` |
| ワークスペース直接選択 | `⌘+1`〜`⌘+9` |

タブ操作は他のターミナルと似た体系である。

| 操作 | ショートカット |
|------|---------------|
| 新規タブ | `⌘+T` |
| 次のタブ | `⌘+⇧+]` |
| 前のタブ | `⌘+⇧+[` |
| 現在のタブを閉じる | `⌘+W` |
| 他のタブをすべて閉じる | `⌥+⌘+T` |

ウィンドウ分割とフォーカス移動はAIエージェント並列運用の要である。

| 操作 | ショートカット |
|------|---------------|
| 右に分割 | `⌘+D` |
| 下に分割 | `⌘+⇧+D` |
| フォーカス移動 | `⌥+⌘+←` / `→` / `↑` / `↓` |

内蔵ブラウザのショートカットはWebブラウザと同様の体系である。

| 操作 | ショートカット |
|------|---------------|
| ブラウザを開く | `⌘+⇧+L` |
| アドレスバー | `⌘+L` |
| 戻る | `⌘+[` |
| 進む | `⌘+]` |

検索と通知関連のショートカットは以下のとおりである。

| 操作 | ショートカット |
|------|---------------|
| 検索 | `⌘+F` |
| 次の一致 | `⌘+G` |
| 通知を表示 | `⌘+I` |
| 未読通知 | `⌘+⇧+U` |

## 5. ~/.config/ghostty/configの設定

cmuxはGhosttyの設定ファイルをそのまま共有する。既にGhosttyを利用しているなら、フォント、テーマ、キーバインドなどが追加作業なしでcmuxにも適用される。新規ユーザーでも、`~/.config/ghostty/config`を一つ整えておけば両アプリに反映される仕組みである。

基本的な設定例は以下のとおりである。

```
font-family = "JetBrains Mono"
font-size = 13
theme = "GruvboxDark"
background-opacity = 0.95
window-padding-x = 12
window-padding-y = 12
cursor-style = block
cursor-style-blink = false
copy-on-select = true
scrollback-limit = 100000

keybind = ctrl+shift+c=copy_to_clipboard
keybind = ctrl+shift+v=paste_from_clipboard
```

cmux固有のショートカットはGhosttyの設定とは分離されている。設定画面のUIから編集するか、`~/.config/cmux/settings.json`を直接変更する。2段階チェインショートカットにも対応しているため、`⌘+K ⌘+O`のようなEmacs風の組み合わせも定義できる。

## 6. おわりに

cmuxはエージェンティックコーディングのワークフローが増えるほど確実な恩恵をもたらす。ターミナルウィンドウを複数並べてウィンドウ切り替えを繰り返すやり方を、サイドバー一瞥で置き換える構造である。Ghosttyのレンダリング性能とネイティブmacOSアプリの軽さをそのまま引き継ぎつつ、複数エージェント運用に必要なUXだけを上乗せしている。エージェンティックコーディングアシスタントを日常的に使う環境なら、デフォルトのターミナルを一度置き換えてみる価値のある選択肢である。

# 参考

- <https://cmux.com/docs/keyboard-shortcuts>
- <https://cmux.com/ja>
- <https://cmux.com/ja/docs/getting-started>
- <https://github.com/manaflow-ai/cmux>
