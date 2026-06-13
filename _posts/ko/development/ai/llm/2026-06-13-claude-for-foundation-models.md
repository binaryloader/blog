---
title: "[LLM] Apple Foundation Models에서 Claude를 쓰는 ClaudeForFoundationModels 패키지"
ref: claude-for-foundation-models
excerpt: "Anthropic의 ClaudeForFoundationModels로 Apple Foundation Models framework에서 Claude를 서버 사이드 모델로 연동하고 온디바이스 모델과 나눠 쓰는 방법을 정리한다."
date: 2026-06-13T16:00+09:00
last_modified_at: 2026-06-13T16:00+09:00
published: true
credits:
  planning: binaryloader
  research: Claude
  drafting: Claude
  editing: Claude
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: Claude
header:
  overlay_image: "/assets/image/thumbnail/header/claude-for-foundation-models.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/claude-for-foundation-models.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - Claude
  - Foundation Models
  - Swift
  - Apple
  - iOS
  - On-Device
  - Tool-Calling
depth:
  - title: "Development"
    url: /ko/development/
  - title: "AI"
    url: /ko/development/ai/
  - title: "LLM"
    url: /ko/development/ai/llm/
---

# 개요

Anthropic의 ClaudeForFoundationModels로 Apple Foundation Models framework에서 Claude를 서버 사이드 모델로 연동하고 온디바이스 모델과 나눠 쓰는 방법을 정리한다.

# 정리

먼저 한 가지를 솔직하게 밝혀 둔다. 이 글에 나오는 Swift 코드는 내가 직접 빌드해서 실행해 본 결과가 아니라 Anthropic 공식 문서와 저장소 README에 적힌 시그니처를 옮겨 정리한 참고용 코드다. 패키지가 서버 사이드 언어 모델 API를 쓰는 OS 27과 Xcode 27 베타를 요구하는데 내 환경은 아직 그 베타를 따로 올리지 못한 상태다. 그래서 코드의 모양과 흐름은 공식 자료를 근거로 신뢰할 만하지만 직접 돌려서 확인한 검증 결과는 아니다. 베타 환경을 올리면 저장소의 `Examples/ClaudeExample`을 직접 실행해 동작을 확인할 생각이다. 그때까지는 아래 코드를 동작 검증을 마친 것이 아니라 공식 명세를 정리한 참고 자료로 봐주면 좋겠다.

## 1. ClaudeForFoundationModels는 무엇이고 왜 나왔나

ClaudeForFoundationModels는 Anthropic이 2026년 6월 8일에 공개한 Swift 패키지다. 같은 날 블로그 발표와 함께 GitHub 저장소의 첫 태그 `0.1.0`이 올라왔고 현재 최신 태그는 6월 10일에 추가된 `0.1.1`이다. 하는 일은 한 문장으로 정리된다. Apple Foundation Models framework 안에서 Claude를 서버 사이드 언어 모델로 쓸 수 있게 연결한다.

여기서 중요한 구분이 하나 있다. 이 패키지는 범용 Messages API 클라이언트가 아니다. Anthropic API를 직접 호출하는 SDK를 찾는다면 별도의 클라이언트 라이브러리가 그 역할을 한다. ClaudeForFoundationModels의 정체성은 Foundation Models framework의 provider conformance다. 즉 Apple이 정의한 언어 모델 프로토콜에 Claude를 끼워 넣어 프레임워크가 온디바이스 모델을 다루는 것과 똑같은 방식으로 Claude를 다루게 만드는 어댑터다. 패키지가 외부에 노출하는 타입도 이 목적에 맞춰 최소한으로 좁혀져 있다. provider 본체인 `ClaudeLanguageModel`, 모델 식별과 capabilities를 담는 `ClaudeModel`, 인증 방식을 표현하는 `AuthMode`, 서버 사이드 도구를 설정하는 `ClaudeServerTool`, 그리고 transcript에 도구 활동을 노출하는 `ClaudeServerToolSegment` 정도다.

배경은 OS 27 베타에서 도입된 서버 사이드 언어 모델 API에 있다. Apple Foundation Models framework는 원래 디바이스에 내장된 온디바이스 모델을 다루는 프레임워크였는데 OS 27 베타부터 서버 사이드 언어 모델을 같은 프레임워크의 추상화 아래로 받아들이는 길이 열렸다. ClaudeForFoundationModels는 그 길을 통해 Claude를 프레임워크 안으로 들여보내는 구현이다. 라이선스는 Apache 2.0이며 beta 기간에는 버그 리포트를 GitHub issues로 받지만 외부 PR은 받지 않는다.

### 1.1. LanguageModel 프로토콜 conformance라는 설계

이 패키지의 설계를 한마디로 요약하면 Claude를 프레임워크의 언어 모델 프로토콜에 conform시킨 것이다. 결과적으로 Claude는 Apple 온디바이스 모델과 동일한 `LanguageModelSession` API로 구동된다. 응답을 받는 `respond(to:)`, 스트리밍, guided generation, tool calling이 모두 같은 세션 API 위에서 동작한다. 개발자 입장에서 보면 모델을 만드는 코드 한 줄만 다르고 그 뒤로 이어지는 세션 사용 코드는 온디바이스 모델을 쓸 때와 구조가 같다.

이 설계가 주는 실질적 이점은 두 가지다. 첫째 기존에 Foundation Models로 작성한 코드가 거의 그대로 재사용된다. 세션을 만들 때 넘기는 모델만 Claude로 바꾸면 나머지 호출 코드를 다시 쓸 필요가 없다. 둘째 온디바이스 모델과 Claude 사이를 같은 인터페이스로 오갈 수 있다. 이 두 번째 이점이 다음 섹션에서 다룰 모델 분담의 토대가 된다.

## 2. 온디바이스 모델과 Claude를 언제 쓰나

이 패키지를 도입할지 결정하기 전에 먼저 답해야 하는 질문은 애초에 Claude를 언제 호출할 것인가이다. Apple의 온디바이스 모델(`SystemLanguageModel`)은 디바이스 안에서 추론을 끝내므로 빠르고 프라이빗하며 오프라인에서도 동작한다. 다만 이 모델은 가벼운 작업에 맞춰 사이징되어 있다. 짧은 분류, 요약, 추출, 간단한 변환처럼 디바이스 자원으로 충분한 작업이 온디바이스 모델의 자리다.

반대로 디바이스 모델로 감당하기 어려운 요구가 생기는 지점이 있다. 더 큰 컨텍스트를 한 번에 다뤄야 하거나, frontier 수준의 추론이 필요하거나, 웹 검색이나 코드 실행 같은 서버 사이드 도구가 필요한 경우다. 이때 같은 작업을 Claude로 에스컬레이션한다. 판단의 축은 결국 작업의 무게다. 디바이스 자원으로 만족스럽게 끝나는 작업은 온디바이스에 두고 컨텍스트 규모, 추론 난이도, 서버 도구 의존성 때문에 한계에 부딪히는 작업만 Claude로 올린다.

이 분담이 코드 수준에서 매끄럽게 이뤄지는 이유는 양쪽이 같은 `LanguageModelSession` API를 공유하기 때문이다. 세션을 만들 때 넘기는 모델 인자만 바꾸면 같은 호출 코드가 온디바이스 모델로도 Claude로도 동작한다. 따라서 모델 선택을 세션 단위의 결정으로 다룰 수 있다. 앱이 작업마다 어떤 모델로 그 세션을 돌릴지 정하고 동일한 프롬프트 처리 로직을 두 모델에 모두 태운다. 가벼운 요청은 디바이스에서 처리하고 무거운 요청만 네트워크를 타고 Claude로 보내는 구조를 인터페이스 교체 없이 만들 수 있다는 뜻이다.

정리하면 이 글의 나머지는 Claude 쪽 통합을 다루지만 통합의 전제는 항상 같다. 온디바이스로 끝낼 수 있는 일은 온디바이스에 두고 그 경계를 넘는 일만 Claude로 올린다.

## 3. 요구사항과 설치

요구사항은 OS 27 베타 세대에 묶여 있다. 서버 사이드 언어 모델을 지원하는 OS 27 릴리즈가 전제이며 Package.swift의 플랫폼 타깃은 iOS 27, macOS 27, visionOS 27, watchOS 27 네 가지다. 모두 beta다. iPadOS는 iOS 타깃에 포함되므로 별도 OS로 나열하지 않는다. 빌드에는 Xcode 27 beta가 필요하고 개발 단계에서는 Claude Console에서 발급한 API 키가 필요하다. 프로덕션 배포에서는 API 키를 앱에 직접 싣지 않는 별도 인증 방식을 쓰는데 이 부분은 §7에서 따로 다룬다.

아래부터 나오는 코드는 앞서 밝혔듯이 공식 명세를 정리한 것이므로 그 점을 감안해서 봐주면 된다. 패키지는 Swift Package Manager로 추가한다. Package.swift의 dependencies에 저장소를 등록한다.

```swift
dependencies: [
    .package(url: "https://github.com/anthropics/ClaudeForFoundationModels.git", from: "0.1.0")
]
```

`from: "0.1.0"`은 태그 기반 명세이므로 현재 올라와 있는 `0.1.0`과 `0.1.1` 태그를 모두 만족한다. 공식 문서와 README 모두 `0.1.0` 기준으로 명세를 안내하고 있어 그대로 따르면 된다.

코드에서는 두 모듈을 함께 import한다. 세션과 generation 관련 타입은 Apple 프레임워크에서 가져오고 Claude provider 타입은 패키지에서 가져온다.

```swift
import FoundationModels
import ClaudeForFoundationModels
```

## 4. 빠른 시작

가장 작은 통합은 세 단계로 끝난다. Claude provider를 만들고 그것으로 세션을 만들고 세션에 프롬프트를 보낸다.

```swift
import FoundationModels
import ClaudeForFoundationModels

let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .apiKey("sk-ant-...")
)

let session = LanguageModelSession(model: model)

let response = try await session.respond(to: "Swift의 actor를 한 문단으로 설명해줘.")
print(response.content)
```

`ClaudeLanguageModel`이 provider 본체다. 첫 두 인자인 `name`과 `auth`만 넘기면 나머지는 기본값으로 채워진다. 세션을 만드는 `LanguageModelSession(model:)`과 응답을 받는 `respond(to:)`는 Apple Foundation Models의 표준 API이며 온디바이스 모델을 쓸 때와 동일하다. 응답 본문은 `response.content`로 꺼낸다.

이니셜라이저는 위 두 인자 외에 네 개를 더 받는다. 전체 시그니처는 아래와 같다.

```swift
public init(
    name: ClaudeModel,
    auth: AuthMode,
    fixedEffort: ClaudeModel.Effort? = nil,
    serverTools: Set<ClaudeServerTool> = [],
    baseURL: URL = ClaudeLanguageModel.defaultBaseURL,
    timeout: TimeInterval = 60
)
```

`fixedEffort`는 모든 요청의 추론 강도를 고정하는 옵션으로 §6에서 다룬다. `serverTools`는 웹 검색이나 코드 실행 같은 서버 사이드 도구 설정으로 §9에서 다룬다. `baseURL`은 기본값이 Claude API 엔드포인트이며 프록시 구성에서 자체 백엔드 주소로 바꾼다(§7). `timeout`은 요청 타임아웃으로 기본 60초다. 빠른 시작 단계에서는 `name`과 `auth`만으로 충분하고 나머지는 필요할 때 채운다.

## 5. 모델 선택과 Capabilities

세션에 넘기는 모델은 `ClaudeModel` 값이다. 이 값을 얻는 방법은 두 가지다. 패키지에 미리 컴파일된 상수를 쓰거나 capabilities를 직접 선언해서 아직 상수로 제공되지 않는 모델 ID를 구성한다.

### 5.1. 컴파일된 모델 상수

현재 패키지에는 다섯 개의 상수가 있다. 각 상수는 어떤 API 모델 ID에 매핑되는지와 어떤 기능을 받아들이는지가 함께 선언되어 있다.

| 상수 | API 모델 ID | effort 레벨 | adaptive thinking | sampling 파라미터 |
|------|-------------|-------------|-------------------|-------------------|
| `.opus4_8` | `claude-opus-4-8` | low, medium, high, xhigh, max | 지원 | 미지원 |
| `.opus4_7` | `claude-opus-4-7` | low, medium, high, xhigh, max | 지원 | 미지원 |
| `.opus4_6` | `claude-opus-4-6` | low, medium, high, max | 지원 | 지원 |
| `.sonnet4_6` | `claude-sonnet-4-6` | low, medium, high, max | 지원 | 지원 |
| `.haiku4_5` | `claude-haiku-4-5` | 미지원 | 미지원 | 지원 |

다섯 상수 모두 structured output과 image input은 지원한다. 차이가 나는 부분은 effort 레벨, adaptive thinking, sampling 파라미터다. 표에서 두 가지를 눈여겨봐야 한다. 첫째 `.opus4_8`과 `.opus4_7`만 effort `.xhigh`까지 받는다. `.opus4_6`과 `.sonnet4_6`은 `.max`까지 지원하지만 `.xhigh`는 받지 않는다. 둘째 `.haiku4_5`는 effort 레벨을 전혀 받지 않고 adaptive thinking도 false다. 추론 강도 조절이 필요한 작업에 `.haiku4_5`를 고르면 effort 관련 설정이 의미를 갖지 못한다.

### 5.2. capabilities가 결정하는 것

각 `ClaudeModel`은 자신이 어떤 필드를 받아들이는지를 capabilities로 선언한다. 받아들이는 항목은 sampling 파라미터, effort 레벨, adaptive thinking, structured output, image input이다. 이 선언이 단순한 메타데이터가 아니라는 점이 핵심이다.

Claude API는 모델이 지원하지 않는 필드를 받으면 조용히 무시하는 대신 hard error로 거부한다. 패키지는 이 동작을 capabilities 선언으로 방어한다. 즉 모델이 받지 않는다고 선언한 필드는 요청에 실어 보내지 않는다. 어떤 필드를 API로 전송할지를 패키지가 모델의 capabilities를 보고 결정한다는 뜻이다. 덕분에 개발자가 모델별로 어떤 필드가 허용되는지를 일일이 외우지 않아도 지원하지 않는 필드 때문에 요청이 거부되는 상황을 피할 수 있다.

### 5.3. 상수에 없는 모델 구성하기

아직 패키지에 상수로 들어오지 않은 모델 ID를 써야 한다면 `ClaudeModel`을 직접 만든다. ID와 capabilities를 함께 넘긴다. 아래 `claude-experimental-x`는 설명을 위한 가상의 모델 ID이고 capabilities 값도 그에 맞춘 임의 예시다.

```swift
let customModel = ClaudeModel(
    id: "claude-experimental-x",
    capabilities: .init(
        samplingParams: false,
        effortLevels: [.low, .medium, .high, .xhigh, .max],
        adaptiveThinking: true,
        structuredOutput: true,
        imageInput: true
    )
)

let model = ClaudeLanguageModel(name: customModel, auth: .apiKey("sk-ant-..."))
```

이때 capabilities는 그 모델이 실제로 지원하는 기능과 정확히 일치시켜야 한다. capabilities를 잘못 선언하면 패키지가 잘못된 판단으로 필드를 전송하거나 누락하게 되고 전자의 경우 결국 API가 거부한다. 새 모델이 출시되어 상수가 추가되기 전까지의 임시 수단으로 이 방식을 이해하면 된다.

## 6. Effort 제어

effort는 Claude가 응답 전에 들이는 추론의 강도를 조절하는 축이다. 레벨은 다섯 단계로 `low`, `medium`, `high`, `xhigh`, `max` 순이다. API는 effort가 명시되지 않으면 `high`를 기본값으로 사용한다.

여기서 프레임워크와 패키지 사이의 경계를 알아둘 필요가 있다. Foundation Models framework는 요청마다 추론 강도를 암시하는 reasoning hint를 가지고 있지만 그 단계가 `high`에서 멈춘다. 따라서 `.xhigh`와 `.max`는 프레임워크의 per-request hint로는 절대 도달할 수 없고 오직 `ClaudeLanguageModel`의 `fixedEffort` 인자로만 요청할 수 있다. `fixedEffort`를 설정하면 그 provider로 만든 모든 요청의 effort가 그 값으로 고정되며 프레임워크가 요청별로 주는 reasoning hint보다 우선한다.

```swift
let model = ClaudeLanguageModel(
    name: .opus4_8,
    auth: .apiKey("sk-ant-..."),
    fixedEffort: .xhigh
)
```

다만 §5에서 본 것처럼 effort는 모델마다 받는 범위가 다르다. `.opus4_8`과 `.opus4_7`은 `.xhigh`까지 받지만 `.sonnet4_6`과 `.opus4_6`은 `.max`까지만 받고 `.xhigh`는 받지 않는다. `.haiku4_5`는 effort를 아예 받지 않는다. 따라서 `fixedEffort`로 어떤 값을 고정할지는 함께 쓰는 모델이 그 레벨을 지원하는지 확인한 뒤에 정해야 한다. 위 예시에서 `.xhigh`를 고정하려면 `.opus4_8`이나 `.opus4_7`을 골라야 일관되게 동작한다.

## 7. 인증으로 개발 키와 프로덕션 프록시 나누기

`AuthMode`는 두 가지 케이스를 가진다. 개발용 직접 키 방식인 `apiKey(String)`과 프로덕션용 프록시 방식인 `proxied(headers: [String: String])`다. 이 둘의 구분은 보안에 직결되므로 처음부터 의도를 분명히 하고 쓰는 편이 좋다.

```swift
public enum AuthMode: Hashable, Sendable {
    case apiKey(String)
    case proxied(headers: [String: String])
}
```

### 7.1. 개발용 직접 키

`apiKey`는 Claude API 키를 앱에서 직접 들고 요청에 싣는 방식이다. 코드가 가장 단순해서 로컬 개발과 프로토타이핑에 알맞다. 문제는 배포 시점에 드러난다. 앱 바이너리에 박힌 문자열 키는 추출될 수 있다. 클라이언트에 들어간 시크릿은 더 이상 시크릿이 아니라는 보안의 기본 전제가 그대로 적용된다. 따라서 `apiKey`는 개발 전용으로만 쓰고 릴리즈 빌드를 만들기 전에 프록시 방식으로 전환하는 것을 전제로 도입해야 한다.

```swift
let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .apiKey("sk-ant-...")
)
```

### 7.2. 프로덕션용 프록시

`proxied`는 앱이 Claude API 키를 전혀 싣지 않는 방식이다. 앱은 표준 Messages API 형식의 요청을 자체 백엔드로 보내고 그 백엔드가 서버 사이드에서 credential을 붙여 Claude API로 포워딩한다. 구체적으로는 프록시가 앱의 요청을 받아 `x-api-key` 헤더를 추가한 뒤 `api.anthropic.com`으로 전달한다. 키는 백엔드에만 존재하고 앱 바이너리에는 남지 않는다.

이 구성에서 `headers`는 앱이 자체 백엔드에 대해 자신을 증명하는 데 쓴다. 즉 Claude API 인증이 아니라 caller 인증용 헤더다. 프록시 백엔드가 발급한 세션 토큰이나 사용자 인증 정보를 여기에 실어 백엔드가 정당한 클라이언트의 요청만 Claude로 중계하도록 만든다. baseURL은 기본값 대신 자체 백엔드 주소로 바꾼다.

```swift
let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .proxied(headers: ["Authorization": "Bearer <앱 세션 토큰>"]),
    baseURL: URL(string: "https://api.example.com/claude")!
)
```

정리하면 개발 단계에서는 `apiKey`로 빠르게 붙이되 프로덕션에서는 `proxied`와 자체 프록시 백엔드로 키를 서버 쪽에 격리한다. 이 전환을 릴리즈 체크리스트에 못 박아 두면 시크릿이 앱에 새는 사고를 막을 수 있다.

## 8. 스트리밍과 구조화된 출력

### 8.1. 스트리밍

응답을 토큰이 도착하는 대로 받아 보려면 `streamResponse(to:)`를 쓴다. 여기서 한 가지를 분명히 알아둬야 한다. 스트림이 내보내는 각 요소는 직전 요소와의 차이를 담은 델타가 아니라 그 시점까지 누적된 전체 스냅샷이다.

```swift
let session = LanguageModelSession(model: model)

for try await partial in session.streamResponse(to: "긴 답변을 스트리밍으로 줘.") {
    print(partial.content)
}
```

각 요소가 누적 스냅샷이므로 화면에 표시할 때는 받은 값으로 기존 텍스트를 교체하면 된다. 델타를 직접 이어 붙이는 코드를 작성하면 같은 내용이 중복으로 누적되니 주의한다. UI 갱신 관점에서는 마지막으로 받은 스냅샷이 항상 현재까지의 완전한 응답이라는 점이 오히려 다루기 쉽다.

### 8.2. 구조화된 출력

특정 타입의 값을 직접 돌려받고 싶으면 Foundation Models의 구조화 출력 기능을 그대로 쓴다. 반환할 타입을 `@Generable`로 선언하고 필드 설명이 필요하면 `@Guide(description:)`를 붙인 뒤 `respond(to:generating:)`에 그 타입을 넘긴다.

```swift
@Generable
struct Recipe {
    @Guide(description: "요리 이름")
    let name: String

    @Guide(description: "필요한 재료 목록")
    let ingredients: [String]

    @Guide(description: "조리 단계를 순서대로")
    let steps: [String]
}

let response = try await session.respond(
    to: "김치볶음밥 레시피를 알려줘.",
    generating: Recipe.self
)

let recipe = response.content
```

여기서 모델별 차이가 한 번 더 등장한다. 구조화 출력을 지원하지 않는 모델에 이 방식을 쓰면 패키지는 조용히 텍스트 응답으로 degrade하지 않는다. 대신 `LanguageModelError.unsupportedGenerationGuide`를 throw한다. 따라서 구조화 출력을 쓰는 코드 경로에서는 이 에러를 처리하거나 애초에 구조화 출력을 지원하는 모델만 그 경로에 태우는 식으로 설계해야 한다. §5의 다섯 상수는 모두 structured output을 지원하므로 상수를 쓰는 한 이 에러를 직접 만날 일은 적다. 직접 구성한 `ClaudeModel`의 capabilities에서 structured output을 false로 선언한 경우가 주의 대상이다.

### 8.3. 이미지 입력

이미지 입력도 같은 세션 API로 처리한다. image input capability를 가진 모델은 프레임워크의 vision capability를 선언하고 표준 세션 API로 이미지를 전달하면 패키지가 그것을 Claude API의 이미지 포맷으로 변환해 보낸다. §5의 다섯 상수는 모두 image input을 지원한다. 개발자는 Foundation Models의 표준 이미지 입력 방식을 그대로 쓰고 Claude API 포맷으로의 변환은 패키지에 맡기면 된다.

## 9. 도구 사용으로 클라이언트와 서버 도구 다루기

Claude를 쓰는 세션에서 도구는 두 갈래로 나뉜다. 디바이스에서 실행되는 클라이언트 사이드 도구와 Anthropic 인프라에서 실행되는 서버 사이드 도구다.

### 9.1. 클라이언트 사이드 도구

클라이언트 사이드 도구는 프레임워크의 표준 도구 메커니즘을 그대로 쓴다. 도구 타입을 `Tool`에 conform시키고 세션의 `tools:` 배열에 넣으면 모델이 그 도구를 호출하기로 할 때 디바이스에서 해당 도구가 invoke된다. 위치 조회, 로컬 데이터 검색, 디바이스 기능 호출처럼 앱이 디바이스 안에서 수행하는 작업이 여기에 해당한다. 이 부분은 온디바이스 모델을 쓸 때와 코드가 동일하다.

### 9.2. 서버 사이드 도구

서버 사이드 도구는 웹 검색, 웹 fetch, 코드 실행을 Anthropic 인프라에서 single round trip으로 처리한다. 디바이스가 아니라 Claude 쪽에서 도구가 실행되므로 앱은 도구 실행 결과까지 포함된 응답을 한 번의 왕복으로 받는다. 종류는 `ClaudeServerTool` enum으로 표현한다.

```swift
public enum ClaudeServerTool: Hashable, Sendable {
    case webSearch(domains: DomainFilter = .unrestricted, maxUses: Int? = nil)
    case webFetch(domains: DomainFilter = .unrestricted, maxUses: Int? = nil)
    case codeExecution
}
```

`webSearch`와 `webFetch`는 두 개의 옵션을 받는다. 첫 번째 `domains`는 검색이나 fetch를 허용하거나 차단할 도메인을 지정하는 `DomainFilter`다. 케이스는 특정 도메인만 허용하는 `.allowing([String])`, 특정 도메인을 차단하는 `.blocking([String])`, 제한을 두지 않는 `.unrestricted` 세 가지이며 기본값은 `.unrestricted`다. 두 번째 `maxUses`는 한 요청에서 그 도구를 최대 몇 번 쓸지 제한하는 값으로 기본값은 `nil`이다.

```swift
let model = ClaudeLanguageModel(
    name: .sonnet4_6,
    auth: .apiKey("sk-ant-..."),
    serverTools: [
        .webSearch(domains: .allowing(["developer.apple.com"]), maxUses: 5),
        .codeExecution
    ]
)
```

`domains`는 첫 번째 파라미터이므로 생략하면 기본값 `.unrestricted`가 적용된다. `.webSearch(maxUses: 5)`처럼 `domains`를 빼고 `maxUses`만 넘겨도 동작하지만 정확한 시그니처에서는 `domains`가 먼저 온다는 점을 기억해 두는 편이 좋다.

서버 사이드 도구가 실행되면 그 활동은 transcript에 `ClaudeServerToolSegment`라는 custom segment로 노출된다. 이 타입은 `Transcript.CustomSegment` 프로토콜을 채택하고 있어 모델이 어떤 서버 도구를 어떻게 썼는지를 transcript에서 확인할 수 있다.

### 9.3. 서버 도구가 세션이 아니라 ClaudeLanguageModel에 붙는 이유

여기서 설계상 눈에 띄는 점이 있다. 클라이언트 사이드 도구는 세션의 `tools:` 배열에 넣는데 서버 사이드 도구는 세션이 아니라 `ClaudeLanguageModel`의 `serverTools` 인자에 설정한다. 둘이 붙는 위치가 다르다.

이유는 타입의 소유권에 있다. `LanguageModelSession`은 Apple이 정의한 프레임워크 타입이라 패키지가 마음대로 확장하거나 새 설정 지점을 추가할 수 없다. 반면 서버 사이드 도구는 Apple 프레임워크에 대응 개념이 없는 Claude 고유 기능이다. 프레임워크가 모르는 기능을 프레임워크 소유의 세션 타입에 끼워 넣을 방법이 없으므로 패키지가 소유한 `ClaudeLanguageModel` 쪽에 서버 도구 설정을 둔 것이다. 그래서 서버 도구 구성은 모델(provider)을 만드는 시점에 결정되고 같은 서버 도구 설정을 공유하는 세션들은 그 provider로부터 만들어진다.

## 10. 에러 처리와 폴백

패키지는 Claude API 에러를 가능한 한 Apple `LanguageModelError`로 매핑한다. 그래야 온디바이스 모델을 다룰 때 쓰던 에러 처리 코드가 Claude에도 그대로 적용되기 때문이다. 주요 매핑은 아래와 같다.

- 컨텍스트 길이를 초과하면 `LanguageModelError.contextSizeExceeded`로 매핑된다
- HTTP 429(rate limit)와 HTTP 529(overloaded)는 모두 `LanguageModelError.rateLimited`로 매핑된다
- 요청 타임아웃(URLError의 타임아웃)은 `LanguageModelError.timeout`으로 매핑된다

`LanguageModelError`로 매핑할 등가물이 없는 Claude 고유 에러는 `ClaudeError`로 던져진다. 현재 `ClaudeError`에 정의된 케이스는 인증 실패를 나타내는 `missingCredential` 하나다.

```swift
public enum ClaudeError: LocalizedError, Sendable {
    case missingCredential
}
```

따라서 에러 처리 코드는 프레임워크 표준 에러와 Claude 고유 에러를 함께 다룬다. 아래는 rate limit에 부딪혔을 때 그 턴만 온디바이스 모델로 폴백하고 인증 문제는 별도로 처리하는 패턴이다.

```swift
do {
    let response = try await claudeSession.respond(to: prompt)
    return response.content
} catch let error as LanguageModelError {
    switch error {
    case .rateLimited:
        // 이번 턴만 온디바이스 모델로 폴백한다
        let fallback = LanguageModelSession(model: SystemLanguageModel.default)
        return try await fallback.respond(to: prompt).content
    case .contextSizeExceeded:
        // 입력을 줄이거나 요약 후 재시도하는 경로로 보낸다
        throw error
    default:
        throw error
    }
} catch ClaudeError.missingCredential {
    // 인증 설정이 잘못된 경우다. 사용자 메시지로 복구를 유도한다
    throw error
}
```

이 폴백 전략은 §2의 에스컬레이션 판단과 짝을 이룬다. 평소에는 무거운 작업을 Claude로 올리되 Claude가 일시적으로 응답할 수 없는 상황(rate limit, overloaded)에서는 그 턴을 온디바이스 모델로 떨어뜨려 사용자 경험의 단절을 줄인다. 양쪽이 같은 세션 API를 쓰기 때문에 폴백 경로의 코드가 본 경로와 거의 같은 형태가 된다는 점이 이 구조의 장점이다. 상황에 따라서는 즉시 폴백하는 대신 요청을 큐에 넣고 재시도하는 전략을 택할 수도 있다.

## 11. 데이터 프라이버시와 과금

데이터 경로는 단순하다. 요청은 앱에서 Claude API로 직접 간다. Apple은 이 요청 경로에 들어 있지 않으며 프롬프트도 응답도 보지 못한다. 이 점이 온디바이스 모델과 대비된다. 온디바이스 모델은 데이터가 디바이스를 떠나지 않는 대신 디바이스 자원의 한계를 받는다. Claude는 데이터가 Anthropic API로 나가는 대신 더 큰 모델과 서버 도구를 쓸 수 있다. 어느 쪽이든 Apple은 중간에서 데이터를 보지 않는다.

프록시 구성을 쓰면 요청이 자체 백엔드를 한 번 거치지만 그 경우에도 Apple은 여전히 경로에 없다. 데이터를 보는 주체가 Anthropic 하나에서 자체 백엔드와 Anthropic 둘로 늘어나는 차이만 있고 백엔드는 어차피 자신이 운영하는 인프라다.

과금은 Anthropic 계정으로 이뤄진다. 사용량은 표준 Claude API 가격 정책에 따라 청구된다. 즉 온디바이스 모델 호출은 비용이 들지 않지만 Claude로 에스컬레이션한 요청은 토큰 사용량만큼 과금된다는 뜻이다. 이 비용 구조 또한 §2의 분담 판단에 영향을 준다. 디바이스로 충분한 작업까지 Claude로 올리면 불필요한 비용이 발생하므로 무게가 가벼운 작업은 온디바이스에 두는 편이 비용 측면에서도 합리적이다.

## 12. 현재 제약

beta 단계인 만큼 알아둘 제약이 있다. 먼저 Apple 프로토콜로 표현할 수 없는 Claude API 기능은 이 패키지를 통해서는 쓸 수 없다. 공식 문서가 명시한 미지원 항목은 아래와 같다.

- 프롬프트 캐싱 제어: 캐싱 자체는 자동으로 적용되지만 TTL이나 breakpoint를 설정할 수 없다
- stop sequences
- batch processing
- Files API
- token counting
- beta headers

beta 기간이므로 GA 전까지 API가 변경될 수 있다. 버그 리포트는 GitHub issues로 받지만 외부 PR은 beta 동안 받지 않는다. 통합을 시작하기 전에 이 점을 감안하고 프로덕션 일정을 잡을 때는 API 변경 가능성을 여유로 둬야 한다.

실제 동작을 빠르게 확인하고 싶다면 저장소의 `Examples/ClaudeExample`을 참고한다. 이 예제는 실행 가능한 CLI 타깃으로 채팅 턴을 터미널에 스트리밍으로 출력한다. `--search` 플래그를 주면 서버 사이드 웹 검색이 동작하는 모습도 확인할 수 있다. 다만 실행에는 macOS 27 호스트가 필요하므로 OS 27 beta 환경을 갖춘 뒤에 돌려보는 것을 권한다.

# 참고

- <https://claude.com/blog/claude-for-foundation-models>
- <https://developer.apple.com/documentation/foundationmodels>
- <https://github.com/anthropics/ClaudeForFoundationModels>
- <https://platform.claude.com/docs/en/cli-sdks-libraries/libraries/apple-foundation-models>
