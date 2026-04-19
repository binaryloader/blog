---
title: "[macOS] Claude Code로 Claude Code 모니터링 앱 만들기"
ref: building-claude-usage-meter-with-claude-code
excerpt: "Claude Code를 사용해 자기 자신의 사용량을 모니터링하는 macOS 메뉴바 앱을 만든 경험을 공유한다."
date: 2026-02-14T23:00+09:00
last_modified_at: 2026-02-14T23:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/building-claude-usage-meter-with-claude-code.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/building-claude-usage-meter-with-claude-code.png"
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
    url: /ko/development/
  - title: "Apple"
    url: /ko/development/apple/
  - title: "macOS"
    url: /ko/development/apple/macos/
---

{% assign img_path = "/assets/image/post/development/apple/macos/building-claude-usage-meter-with-claude-code" %}

# 개요

Claude Code를 사용해 자기 자신의 사용량을 모니터링하는 macOS 메뉴바 앱을 만든 경험을 공유한다.

# 배경

Claude Code Max 플랜을 사용하면서 현재 세션에서 토큰을 얼마나 썼는지 메시지를 몇 개 보냈는지 궁금할 때가 많았다. 웹에서 사용량 페이지를 열어볼 수는 있지만 매번 브라우저를 전환하는 것이 번거로웠다.

Claude Code는 `~/.claude/stats-cache.json`에 일별 사용량 데이터를 로컬에 저장하고 있다. 이 파일을 읽어서 메뉴바에 항상 표시해두면 편하겠다는 생각에 프로젝트를 시작했다.
그리고 이 앱 자체를 Claude Code로 만들었다. Claude Code가 자기 자신의 사용량을 모니터링하는 앱을 만드는 셈이다.

# 데이터 소스

Claude Code가 로컬에 저장하는 두 개의 JSON 파일을 사용한다.

| 파일 | 용도 |
|------|------|
| `~/.claude/stats-cache.json` | 일별 메시지/토큰/세션/도구호출 수, 모델별 누적 토큰 |
| `~/.claude.json` | 계정명, 플랜 종류(Pro/Max) |

`stats-cache.json`의 구조는 다음과 같다.

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

# 기술 스택

Xcode 프로젝트 없이 Swift Package Manager만으로 구성했다.

- SwiftUI + MenuBarExtra(macOS 14+, `.window` 스타일)
- @Observable 매크로 + @MainActor
- DispatchSource 파일 감시
- 외부 의존성 없음

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

# 주요 구현

## 1. MenuBarExtra

macOS 14부터 SwiftUI에서 `MenuBarExtra`를 사용하면 네이티브 메뉴바 앱을 만들 수 있다. `.window` 스타일을 적용하면 클릭 시 팝오버 윈도우가 표시된다.

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

## 2. DispatchSource 파일 감시

`stats-cache.json` 파일이 변경되면 즉시 UI를 갱신하기 위해 `DispatchSource`로 파일 시스템 이벤트를 감시한다. 폴백으로 60초 주기 타이머도 함께 사용한다.

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

## 3. .app 번들 생성

SPM으로 빌드한 바이너리를 macOS 앱 번들로 패키징하려면 `Info.plist`를 포함한 디렉토리 구조를 직접 만들어야 한다. `LSUIElement`를 `true`로 설정하면 Dock에 나타나지 않는 메뉴바 전용 앱이 된다.

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

# 시행착오

## 1. 서버 사용량을 가져올 수 없다

처음에는 프로그레스 바로 일일 사용량 대비 한도를 시각화하려고 했다. 하지만 웹에서 보이는 플랜 사용률(현재 세션 5%, 주간 10% 등)은 서버 측에서 계산하는 값이고 이 데이터를 가져올 수 있는 공개 API가 없었다.
Anthropic의 Usage & Cost API가 있지만 조직용 Admin API 키(`sk-ant-admin...`)가 필요하고 개인 플랜의 세션별/주간 사용률과는 다른 데이터였다.

결국 프로그레스 바를 제거하고 `stats-cache.json`에서 확실하게 보여줄 수 있는 데이터(메시지 수, 토큰 수, 세션 수, 모델별 사용량)에 집중하는 방향으로 전환했다.

## 2. macOS 아이콘 캐시

Swift 스크립트로 앱 아이콘을 프로그래밍 방식으로 생성했는데 아이콘을 변경해도 macOS의 아이콘 캐시 때문에 반영되지 않는 문제가 있었다. `lsregister`로 앱을 재등록하고 Finder와 Dock을 재시작해야 갱신되었다.

```bash
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f ClaudeUsageMeter.app
killall Finder Dock
```

# 구현 결과

한 세션에서 플랜 수립부터 구현, 아이콘 생성, GitHub 푸시까지 완료했다. 최종 프로젝트 구조는 다음과 같다.

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

메뉴바 아이콘을 클릭하면 계정 정보, 오늘의 활동, 7일 추이 차트, 모델별 토큰 사용량, 전체 통계를 한눈에 확인할 수 있다.

![ClaudeUsageMeter 팝오버 화면]({{ img_path }}/popover.png){: .align-center style="max-width: min(400px, 100%);"}

참고로 이 프로젝트에서 사람이 한 일은 "이거 만들어줘"라고 말한 것뿐이다. 앱 개발, GitHub 저장소 생성, 앱 아이콘 생성까지 전부 Claude Code가 알아서 했다. 본인은 옆에서 구경하다가 가끔 "그거 아닌데"라고 태클을 걸었을 뿐이다.

# 참고

- <https://developer.apple.com/documentation/dispatch/dispatchsource>
- <https://developer.apple.com/documentation/swiftui/menubarextra>
- <https://docs.anthropic.com/en/docs/claude-code/overview>
- <https://platform.claude.com/docs/en/build-with-claude/usage-cost-api>
