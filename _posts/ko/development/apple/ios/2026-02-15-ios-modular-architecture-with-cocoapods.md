---
title: "[iOS] Private Spec Repo를 활용한 CocoaPods 모듈화 아키텍처"
ref: ios-modular-architecture-with-cocoapods
excerpt: "CocoaPods Private Spec Repo를 활용하여 iOS 프로젝트를 계층별 모듈로 분리하는 방법을 정리한다."
date: 2026-02-15T00:00+09:00
last_modified_at: 2026-02-15T00:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/ios-modular-architecture-with-cocoapods.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/ios-modular-architecture-with-cocoapods.png"
categories:
  - Development
  - Apple
  - iOS
tags:
  - Development
  - Apple
  - iOS
  - CocoaPods
  - Modular Architecture
  - Private Spec Repo
  - Swift
  - Clean Swift
  - Dependency Injection
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Apple"
    url: /ko/development/apple/
  - title: "iOS"
    url: /ko/development/apple/ios/
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: binaryloader
---

# 개요

CocoaPods Private Spec Repo를 활용하여 iOS 프로젝트를 계층별 모듈로 분리하는 방법을 정리한다.

이 글에서 다루는 프로젝트는 2020년경에 설계한 것이다. 현재는 Swift Package Manager가 주류로 자리잡았고 Tuist 같은 프로젝트 생성 도구도 널리 사용되고 있어 당시와 트렌드가 다를 수 있다. 하지만 모듈 분리의 원칙과 계층 구조 설계는 도구가 달라져도 동일하게 적용할 수 있으므로 뒤늦게나마 정리해본다.

# 정리

## 1. 아키텍처 개요

프로젝트는 4개의 계층으로 구성된다.

```
┌───────────────────────────────────────────┐
│                   App                     │
│             (synstagram-app)              │
├───────────────────────────────────────────┤
│               Scene Layer                 │
│            (LoginScene, ...)              │
├───────────────────────────────────────────┤
│              Module Layer                 │
│        (APIService, Dependencies)         │
├───────────────────────────────────────────┤
│            Foundation Layer               │
│ (Network, Extensions, DIContainer, UI)    │
└───────────────────────────────────────────┘
```

| 계층 | 역할 | 예시 |
|---|---|---|
| Foundation | 앱에 종속되지 않는 범용 라이브러리 | BinaryLoaderNetwork, BinaryLoaderExtensions |
| Module | 앱 고유의 서비스 및 의존성 인터페이스 | APIService/Auth, Dependencies/Login |
| Scene | 화면 단위의 독립적인 기능 모듈 | LoginScene |
| App | 모듈 조립과 화면 전환을 담당하는 진입점 | Synstagram |

하위 계층은 상위 계층을 알지 못한다. Foundation은 Module을 모르고 Module은 Scene을 모른다. 의존성은 항상 위에서 아래로만 흐른다.

## 2. 저장소 구조

모듈화 프로젝트에는 두 종류의 저장소가 필요하다.

| 저장소 종류 | 역할 | 예시 |
|---|---|---|
| 소스 저장소 | 실제 코드가 있는 저장소 | `binaryloader-network`, `synstagram-scene-login` |
| 스펙 저장소 | podspec 파일을 버전별로 관리하는 저장소 | `cocoapods-specs`, `synstagram-scene-cocoapods-specs` |

스펙 저장소는 계층별로 분리했다.

| 스펙 저장소 | 대상 | 등록된 Pod |
|---|---|---|
| `cocoapods-specs` | Foundation 레이어 | BinaryLoaderNetwork, BinaryLoaderExtensions, BinaryLoaderDIContainer, BinaryLoaderUI |
| `synstagram-module-cocoapods-specs` | Module 레이어 | APIService, Dependencies |
| `synstagram-scene-cocoapods-specs` | Scene 레이어 | LoginScene |

스펙 저장소를 계층별로 분리하면 팀에서 접근 권한을 세분화할 수 있고 Foundation 레이어의 스펙 저장소는 다른 앱 프로젝트에서도 재사용할 수 있다.

## 3. Foundation 레이어

앱에 종속되지 않는 범용 라이브러리다. 다른 프로젝트에서도 그대로 가져다 쓸 수 있다.

### 3.1. BinaryLoaderNetwork

Moya를 래핑한 네트워크 추상화 레이어다.

```ruby
# BinaryLoaderNetwork.podspec
Pod::Spec.new do |s|
  s.name = 'BinaryLoaderNetwork'
  s.version = '1.0.5'
  s.ios.deployment_target = '13.0'
  s.source_files = 'BinaryLoaderNetwork/Module/Source/*.swift'
  s.dependency 'Moya', '15.0.0'
end
```

핵심은 `NetworkTarget` 프로토콜과 `NetworkProvider` 클래스다.

```swift
// NetworkTarget.swift
public protocol NetworkTarget: TargetType {

    var baseURL: URL { get }
    var path: String { get }
    var method: Method { get }
    var sampleData: Data { get }
    var task: Task { get }
    var headers: [String: String]? { get }

}
```

```swift
// NetworkProvider.swift
public final class NetworkProvider<Target: NetworkTarget> {

    private let provider: MoyaProvider<Target>

    @discardableResult
    public func request(target: Target, completion: @escaping Completion) -> Cancellable {
        let cancellable = provider.request(target, completion: completion)
        return cancellable
    }

    public func request(target: Target) async -> Result<Response, MoyaError> {
        let result = await provider.request(target)
        return result
    }

}
```

Moya의 타입을 직접 노출하지 않고 typealias로 래핑하여 외부에 제공한다.

```swift
// Moya+Wrapping.swift
public typealias Method = Moya.Method
public typealias Task = Moya.Task
public typealias Response = Moya.Response
public typealias MoyaError = Moya.MoyaError
```

이렇게 하면 Moya 버전이 변경되어 타입명이 바뀌더라도 래핑 파일만 수정하면 되므로 하위 모듈의 변경 범위를 최소화할 수 있다.

### 3.2. BinaryLoaderDIContainer

Property Wrapper 기반의 의존성 주입 컨테이너다. `@Injectable`로 의존성을 선언하고 `Container.shared.register(type:)`으로 등록한다.

```ruby
# BinaryLoaderDIContainer.podspec
Pod::Spec.new do |s|
  s.name = 'BinaryLoaderDIContainer'
  s.version = '1.0.5'
  s.source_files = 'BinaryLoaderDIContainer/Module/Source/*.swift'
end
```

### 3.3. BinaryLoaderUI

UI 컴포넌트를 subspec으로 분리하여 필요한 것만 선택적으로 사용할 수 있다.

```ruby
# BinaryLoaderUI.podspec
Pod::Spec.new do |s|
  s.name = 'BinaryLoaderUI'
  s.version = '1.0.3'
  s.default_subspec = :none

  s.subspec 'InsetTextField' do |ss|
    ss.source_files = 'BinaryLoaderUI/Module/InsetTextField/Source/*.swift'
  end
end
```

`default_subspec = :none`으로 설정하면 `pod 'BinaryLoaderUI'`만으로는 아무것도 포함되지 않고 `pod 'BinaryLoaderUI/InsetTextField'`처럼 명시적으로 subspec을 지정해야 한다.

## 4. Module 레이어

앱 고유의 비즈니스 로직을 담당하는 계층이다. Foundation 레이어에 의존하며 Scene 레이어에서 사용된다.

### 4.1. APIService

네트워크 API 호출을 캡슐화한다. 기능별로 subspec을 분리한다.

```ruby
# APIService.podspec
Pod::Spec.new do |s|
  s.name = 'APIService'
  s.version = '1.0.8'
  s.dependency 'BinaryLoaderExtensions', '1.0.3'
  s.default_subspec = :none

  s.subspec 'Auth' do |ss|
    ss.source_files = 'APIService/Module/Auth/Source/*.swift'
    ss.dependency 'BinaryLoaderNetwork', '1.0.5'
  end
end
```

Auth subspec은 `AuthService` 클래스를 통해 로그인/로그아웃 API를 제공한다. `NetworkTarget`을 구현한 `AuthNetworkTarget`으로 엔드포인트를 정의하고 `NetworkProvider`로 요청을 보낸다.

```swift
// AuthNetworkTarget.swift
struct AuthNetworkTarget {

    enum Route {
        case isAlreadyLogin
        case login(request: AuthLoginModel.Request)
        case logout
    }

    private let route: Route

}

extension AuthNetworkTarget: NetworkTarget {

    var baseURL: URL {
        let URLString = "https://photo.domain.com/photo/webapi"
        return URLString.toAPIURL
    }

    var task: BinaryLoaderNetwork.Task {
        var parameters: [String: Any] = [
            "api": "SYNO.PhotoStation.Auth",
            "version": "1"
        ]

        switch route {
        case .isAlreadyLogin:
            parameters["method"] = "checkauth"
        case .login(let request):
            parameters["method"] = "login"
            parameters["username"] = request.username
            parameters["password"] = request.password
        case .logout:
            parameters["method"] = "logout"
        }

        return .requestParameters(parameters: parameters, encoding: URLEncoding.queryString)
    }

}
```

### 4.2. Dependencies

Scene 간 의존성 인터페이스를 프로토콜로 정의한다. Scene 모듈은 이 프로토콜에만 의존하므로 구체적인 구현을 알 필요가 없다.

```ruby
# Dependencies.podspec
Pod::Spec.new do |s|
  s.name = 'Dependencies'
  s.version = '1.0.2'
  s.default_subspec = :none

  s.subspec 'Login' do |ss|
    ss.source_files = 'Dependencies/Module/Login/Source/*.swift'
  end

  s.subspec 'AlbumList' do |ss|
    ss.source_files = 'Dependencies/Module/AlbumList/Source/*.swift'
  end
end
```

```swift
// LoginDependency.swift
public protocol LoginDependency {

    var viewController: UIViewController { get }
}

// AlbumListDependency.swift
public protocol AlbumListDependency {

    func getViewController(username: String) -> UIViewController
}
```

이 패턴의 핵심은 Scene이 다른 Scene을 직접 import하지 않는 것이다. LoginScene이 AlbumListScene으로 화면 전환을 해야 할 때 `AlbumListDependency` 프로토콜을 통해 ViewController를 가져온다. 실제 구현체는 App 레이어에서 DI Container로 주입한다.

## 5. Scene 레이어

화면 단위의 독립적인 기능 모듈이다. Clean Swift(VIP) 아키텍처를 사용한다.

```ruby
# LoginScene.podspec
Pod::Spec.new do |s|
  s.name = 'LoginScene'
  s.version = '1.0.12'
  s.source_files = 'LoginScene/Module/Source/**/*.{swift,xib}'
  s.resource = 'LoginScene/Module/Resources/*.xcassets'
  s.dependency 'BinaryLoaderDIContainer', '1.0.5'
  s.dependency 'BinaryLoaderExtensions', '1.0.3'
  s.dependency 'BinaryLoaderUI/InsetTextField', '1.0.3'
  s.dependency 'APIService/Auth', '1.0.8'
  s.dependency 'Dependencies/Login', '1.0.2'
  s.dependency 'Dependencies/AlbumList', '1.0.2'
end
```

디렉토리 구조는 Clean Swift 패턴을 따른다.

```
LoginScene/Module/
├── Source/
│   ├── Dependency/
│   │   └── LoginDependencyItem.swift
│   ├── Interactor/
│   │   ├── LoginInteractor.swift
│   │   └── LoginWorker.swift
│   ├── Model/
│   │   ├── LoginModel.swift
│   │   ├── LoginModelDTOMapper.swift
│   │   └── LoginModelErrorMapper.swift
│   ├── Presenter/
│   │   └── LoginPresenter.swift
│   ├── Router/
│   │   └── LoginRouter.swift
│   └── View/
│       ├── LoginViewController.swift
│       ├── LoginViewController.xib
│       ├── ContentView.swift
│       └── ...
└── Resources/
    ├── Color.xcassets
    └── Image.xcassets
```

Scene 모듈은 Dependencies의 프로토콜을 구현하여 외부에 진입점을 제공한다.

```swift
// LoginDependencyItem.swift
public struct LoginDependencyItem: Dependency, LoginDependency {

    public var viewController: UIViewController {
        return LoginViewController(nibName: LoginViewController.className, bundle: LoginViewController.bundle)
    }
}
```

Scene 간 화면 전환은 Router에서 Dependencies 프로토콜을 통해 수행한다.

```swift
// LoginRouter.swift
final class LoginRouter: NSObject, LoginRoutingLogic {

    @Injectable
    private var albumListDependency: AlbumListDependency?

    func routeToAlbumList(username: String) {
        let albumListVC = albumListDependency?.getViewController(username: username)

        let keyWindow = UIApplication.shared.windows.first { $0.isKeyWindow }
        keyWindow?.rootViewController = albumListVC
    }
}
```

`@Injectable`은 DI Container에서 등록된 구현체를 자동으로 주입한다.

## 6. App 통합

App 레이어는 모든 모듈을 조립하는 진입점 역할을 한다.

### 6.1. Podfile

```ruby
source 'https://github.com/CocoaPods/Specs.git'
source 'https://github.com/binaryloader/cocoapods-specs.git'
source 'https://github.com/binaryloader/synstagram-module-cocoapods-specs.git'
source 'https://github.com/binaryloader/synstagram-scene-cocoapods-specs.git'

platform :ios, '13.0'
project 'Synstagram'
inhibit_all_warnings!
use_frameworks!

def scenes
    pod 'LoginScene', '1.0.13'
end

target :'Synstagram' do
    scenes
end
```

Scene Pod만 명시하면 CocoaPods가 의존성 그래프를 해석하여 하위 계층의 모든 Pod을 자동으로 설치한다.

### 6.2. DI Container 등록

App 레이어에서 각 Scene의 DependencyItem을 DI Container에 등록한다.

```swift
// DependencyContainer.swift
final class DependencyContainer {

    static func registerAll() {
        registerLoginSceneDependency()
    }
}

extension DependencyContainer {

    private static func registerLoginSceneDependency() {
        Container.shared.register(type: LoginDependencyItem.self)
    }
}
```

### 6.3. 앱 시작

```swift
// AppDelegate.swift
@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        DependencyContainer.registerAll()
        HierarchyCoordinator.configure(window: &window)
        return true
    }
}

// HierarchyCoordinator.swift
final class HierarchyCoordinator {

    static func configure(window: inout UIWindow?) {
        window = UIWindow(frame: UIScreen.main.bounds)
        let launcher = LoginSceneLauncher()
        launcher.launch(to: &window)
    }
}
```

## 7. 버전 관리 워크플로우

모듈의 코드를 수정하면 다음 순서로 변경 사항을 전파한다.

```
소스 코드 수정 → 버전 범프 → 태그 생성 → 스펙 저장소에 podspec 등록 → 하위 모듈 의존성 업데이트 → 반복
```

예를 들어 BinaryLoaderNetwork의 코드를 수정한 경우:

1. `BinaryLoaderNetwork.podspec`의 `s.version` 범프
2. `git tag 1.0.5` 생성 후 푸시
3. `cocoapods-specs` 저장소에 `BinaryLoaderNetwork/1.0.5/BinaryLoaderNetwork.podspec` 등록
4. BinaryLoaderNetwork에 의존하는 APIService의 의존성 버전 업데이트
5. APIService도 같은 과정 반복
6. 최종적으로 App의 Podfile에서 `pod install` 실행

이 과정이 번거롭게 느껴질 수 있지만 각 모듈의 버전이 명시적으로 고정되어 있으므로 어떤 시점에서든 정확히 어떤 버전의 코드가 사용되고 있는지 추적할 수 있다.

# 참고

- <https://github.com/binaryloader/synstagram-app>
