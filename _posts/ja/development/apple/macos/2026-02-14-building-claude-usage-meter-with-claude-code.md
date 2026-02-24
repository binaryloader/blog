---
title: "[macOS] Claude CodeでClaude Codeモニタリングアプリを作る"
ref: building-claude-usage-meter-with-claude-code
excerpt: "Claude Codeを使って自身の使用量をモニタリングするmacOSメニューバーアプリを作った経験を共有する。"
date: 2026-02-14T23:00+09:00
last_modified_at: 2026-02-14T23:00+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/building-claude-usage-meter-with-claude-code.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/building-claude-usage-meter-with-claude-code.png"
categories:
  - Development
  - Apple
  - macOS
tags:
  - Development
  - Apple
  - macOS
  - SwiftUI
  - Claude Code
  - MenuBarExtra
  - Swift Package Manager
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Apple"
    url: /ja/development/apple/
  - title: "macOS"
    url: /ja/development/apple/macos/
---

{% assign img_path = "/assets/image/post/development/apple/macos/building-claude-usage-meter-with-claude-code" %}

# 概要

Claude Codeを使って自身の使用量をモニタリングするmacOSメニューバーアプリを作った経験を共有する。

# 背景

Claude Code Maxプランを使っていると、現在のセッションでトークンをどれだけ消費したか、メッセージを何通送ったかが気になることが多かった。ブラウザで使用量ページを毎回開くのは面倒だった。

Claude Codeは`~/.claude/stats-cache.json`に日別使用量データをローカルに保存している。このファイルを読み取ってメニューバーに常時表示すれば便利だと思い、プロジェクトを始めた。
そしてこのアプリ自体をClaude Codeで作った。Claude Codeが自分自身の使用量をモニタリングするアプリを作るという構図だ。

# データソース

Claude Codeがローカルに保存する2つのJSONファイルを使用する。

| ファイル | 用途 |
|----------|------|
| `~/.claude/stats-cache.json` | 日別メッセージ/トークン/セッション/ツール呼び出し数、モデル別累積トークン |
| `~/.claude.json` | アカウント名、プラン種別（Pro/Max） |

`stats-cache.json`の構造は以下の通り。

```json
{
  "dailyActivity": [
    {
      "date": "2026-02-14",
      "messageCount": 2511,
      "sessionCount": 9,
      "toolCallCount": 537
    }
  ],
  "dailyModelTokens": [
    {
      "date": "2026-02-14",
      "tokensByModel": {
        "claude-opus-4-6": 65342,
        "claude-sonnet-4-5-20250929": 11726
      }
    }
  ],
  "modelUsage": {
    "claude-opus-4-6": {
      "inputTokens": 15389,
      "outputTokens": 282180,
      "cacheReadInputTokens": 251600374,
      "cacheCreationInputTokens": 5266604
    }
  },
  "totalSessions": 28,
  "totalMessages": 8789,
  "longestSession": { "duration": 27382247, "messageCount": 85 },
  "firstSessionDate": "2026-02-08T14:38:23.545Z"
}
```

# 技術スタック

Xcodeプロジェクトなしで、Swift Package Managerのみで構成した。

- **SwiftUI** + **MenuBarExtra**（macOS 14+、`.window`スタイル）
- **@Observable**マクロ + **@MainActor**
- **DispatchSource**ファイル監視
- 外部依存なし

```swift
// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "ClaudeUsageMeter",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(
            name: "ClaudeUsageMeter",
            path: "Sources"
        )
    ]
)
```

# 主要な実装

## 1. MenuBarExtra

macOS 14からSwiftUIの`MenuBarExtra`でネイティブメニューバーアプリを作れるようになった。`.window`スタイルを適用するとクリック時にポップオーバーウィンドウが表示される。

```swift
@main
struct ClaudeUsageMeterApp: App {
    @State private var viewModel = UsageViewModel()

    var body: some Scene {
        MenuBarExtra {
            PopoverContentView(viewModel: viewModel)
        } label: {
            MenuBarLabel()
        }
        .menuBarExtraStyle(.window)
    }
}
```

## 2. DispatchSourceファイル監視

`stats-cache.json`ファイルが変更されたら即座にUIを更新するため、`DispatchSource`でファイルシステムイベントを監視する。フォールバックとして60秒周期タイマーも併用する。

```swift
final class FileWatcher {
    private var source: DispatchSourceFileSystemObject?

    func start() {
        let fd = open(path, O_EVTONLY)
        guard fd >= 0 else { return }

        let source = DispatchSource.makeFileSystemObjectSource(
            fileDescriptor: fd,
            eventMask: [.write, .rename, .delete],
            queue: .main
        )
        source.setEventHandler { [weak self] in
            self?.onChange()
        }
        source.setCancelHandler { close(fd) }
        self.source = source
        source.resume()
    }
}
```

## 3. .appバンドルの作成

SPMでビルドしたバイナリをmacOSアプリバンドルとしてパッケージングするには、`Info.plist`を含むディレクトリ構造を手動で作成する必要がある。`LSUIElement`を`true`に設定するとDockに表示されないメニューバー専用アプリになる。

```
ClaudeUsageMeter.app/
├── Contents/
│   ├── Info.plist
│   ├── MacOS/
│   │   └── ClaudeUsageMeter
│   └── Resources/
│       └── AppIcon.icns
```

```xml
<key>LSUIElement</key>
<true/>
```

# 試行錯誤

## 1. サーバー側の使用量を取得できない

当初はプログレスバーで日次使用量と上限を可視化する予定だった。しかしWebで表示される使用率（「現在のセッション5%」「週間10%」など）はサーバー側で計算される値で、取得できる公開APIがなかった。
AnthropicのUsage & Cost APIはあるが、組織用Admin APIキー（`sk-ant-admin...`）が必要で、個人プランのセッション別/週間使用率とは異なるデータだった。

結局プログレスバーを削除し、`stats-cache.json`で確実に表示できるデータ（メッセージ数、トークン数、セッション数、モデル別使用量）に集中する方向に転換した。

## 2. macOSアイコンキャッシュ

Swiftスクリプトでアプリアイコンをプログラム的に生成したが、アイコンを変更してもmacOSのアイコンキャッシュのせいで反映されない問題があった。`lsregister`でアプリを再登録し、FinderとDockを再起動する必要があった。

```bash
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f ClaudeUsageMeter.app
killall Finder Dock
```

# 実装結果

プラン策定から実装、アイコン生成、GitHubへのプッシュまで1セッションで完了した。最終的なプロジェクト構造は以下の通り。

```
Sources/
├── App/
│   └── ClaudeUsageMeterApp.swift
├── Models/
│   ├── StatsCache.swift
│   ├── ClaudeConfig.swift
│   └── UsageSnapshot.swift
├── Services/
│   ├── StatsLoader.swift
│   └── FileWatcher.swift
├── ViewModels/
│   └── UsageViewModel.swift
└── Views/
    ├── MenuBarLabel.swift
    ├── PopoverContentView.swift
    ├── HeaderView.swift
    ├── TodayStatsSection.swift
    ├── DailyTrendSection.swift
    ├── ModelBreakdownSection.swift
    └── CumulativeStatsSection.swift
```

メニューバーアイコンをクリックすると、アカウント情報、今日のアクティビティ、7日間トレンドチャート、モデル別トークン使用量、累計統計を一目で確認できる。

![ClaudeUsageMeterポップオーバー画面]({{ img_path }}/popover.png){: .align-center style="max-width: min(400px, 100%);"}

ちなみにこのプロジェクトで人間がやったことは「これ作って」と言っただけだ。アプリ開発、GitHubリポジトリ作成、アイコン生成まで全部Claude Codeが勝手にやった。本人は横で見物しながらたまに「それ違うよ」とツッコミを入れただけである。

# 参考

- <https://developer.apple.com/documentation/dispatch/dispatchsource>
- <https://developer.apple.com/documentation/swiftui/menubarextra>
- <https://docs.anthropic.com/en/docs/claude-code/overview>
- <https://platform.claude.com/docs/en/build-with-claude/usage-cost-api>
