---
title: "[iOS] Modular Architecture with CocoaPods Private Spec Repos"
ref: ios-modular-architecture-with-cocoapods
lang: en
permalink: /en/:categories/:title/
excerpt: "How to modularize an iOS project into layered modules using CocoaPods Private Spec Repos."
date: 2026-02-15T00:00+09:00
last_modified_at: 2026-02-15T00:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/ios-modular-architecture-with-cocoapods.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/ios-modular-architecture-with-cocoapods.png"
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
    url: /en/development/
  - title: "Apple"
    url: /en/development/apple/
  - title: "iOS"
    url: /en/development/apple/ios/
---

# Overview

How to modularize an iOS project into layered modules using CocoaPods Private Spec Repos.

This project was designed around 2020. Today Swift Package Manager has become the mainstream and project generation tools like Tuist are widely used, so the trend may differ from back then. However, the principles of module separation and layered architecture apply regardless of the tooling, so this is a belated write-up.

# Summary

## 1. Architecture Overview

The project consists of four layers.

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

| Layer | Role | Examples |
|---|---|---|
| **Foundation** | General-purpose libraries not tied to the app | BinaryLoaderNetwork, BinaryLoaderExtensions |
| **Module** | App-specific services and dependency interfaces | APIService/Auth, Dependencies/Login |
| **Scene** | Self-contained feature modules per screen | LoginScene |
| **App** | Entry point responsible for assembling modules and navigation | Synstagram |

Lower layers are unaware of upper layers. Foundation doesn't know about Module, and Module doesn't know about Scene. Dependencies always flow downward.

## 2. Repository Structure

A modularized project requires two types of repositories.

| Repository Type | Role | Examples |
|---|---|---|
| **Source repo** | Contains the actual code | `binaryloader-network`, `synstagram-scene-login` |
| **Spec repo** | Manages podspec files by version | `cocoapods-specs`, `synstagram-scene-cocoapods-specs` |

Spec repos are separated by layer.

| Spec Repo | Target | Registered Pods |
|---|---|---|
| `cocoapods-specs` | Foundation layer | BinaryLoaderNetwork, BinaryLoaderExtensions, BinaryLoaderDIContainer, BinaryLoaderUI |
| `synstagram-module-cocoapods-specs` | Module layer | APIService, Dependencies |
| `synstagram-scene-cocoapods-specs` | Scene layer | LoginScene |

Separating spec repos by layer enables fine-grained access control within a team and allows the Foundation spec repo to be reused across different app projects.

## 3. Foundation Layer

General-purpose libraries not tied to any specific app. They can be used as-is in other projects.

### BinaryLoaderNetwork

A network abstraction layer wrapping Moya.

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

The core components are the `NetworkTarget` protocol and the `NetworkProvider` class.

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

Moya types are not directly exposed; they are provided through typealiases.

```swift
// Moya+Wrapping.swift
public typealias Method = Moya.Method
public typealias Task = Moya.Task
public typealias Response = Moya.Response
public typealias MoyaError = Moya.MoyaError
```

This way, if Moya changes its type names across versions, only the wrapping file needs to be updated, minimizing the blast radius of changes.

### BinaryLoaderDIContainer

A Property Wrapper-based dependency injection container. Dependencies are declared with `@Injectable` and registered with `Container.shared.register(type:)`.

```ruby
# BinaryLoaderDIContainer.podspec
Pod::Spec.new do |s|
  s.name = 'BinaryLoaderDIContainer'
  s.version = '1.0.5'
  s.source_files = 'BinaryLoaderDIContainer/Module/Source/*.swift'
end
```

### BinaryLoaderUI

UI components are split into subspecs so only the needed parts are included.

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

Setting `default_subspec = :none` means `pod 'BinaryLoaderUI'` alone includes nothing. You must explicitly specify a subspec like `pod 'BinaryLoaderUI/InsetTextField'`.

## 4. Module Layer

The layer for app-specific business logic. It depends on the Foundation layer and is consumed by the Scene layer.

### APIService

Encapsulates network API calls. Features are split into subspecs.

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

The Auth subspec exposes login/logout APIs through the `AuthService` class. It defines endpoints via `AuthNetworkTarget` (which implements `NetworkTarget`) and sends requests through `NetworkProvider`.

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

### Dependencies

Defines inter-scene dependency interfaces as protocols. Scene modules depend only on these protocols and don't need to know the concrete implementations.

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

The key here is that **a Scene never directly imports another Scene**. When LoginScene needs to navigate to AlbumListScene, it obtains the ViewController through the `AlbumListDependency` protocol. The actual implementation is injected by the App layer via the DI Container.

## 5. Scene Layer

Self-contained feature modules per screen. Uses the Clean Swift (VIP) architecture.

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

The directory structure follows the Clean Swift pattern.

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

A Scene module implements the Dependencies protocol to expose its entry point.

```swift
// LoginDependencyItem.swift
public struct LoginDependencyItem: Dependency, LoginDependency {

    public var viewController: UIViewController {
        return LoginViewController(nibName: LoginViewController.className, bundle: LoginViewController.bundle)
    }
}
```

Inter-scene navigation is done through Dependencies protocols in the Router.

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

`@Injectable` automatically injects the implementation registered in the DI Container.

## 6. App Integration

The App layer serves as the entry point that assembles all modules.

### Podfile

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

By specifying only the Scene Pod, CocoaPods resolves the dependency graph and automatically installs all pods from lower layers.

### DI Container Registration

The App layer registers each Scene's DependencyItem into the DI Container.

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

### App Launch

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

## 7. Version Management Workflow

When code in a module is modified, changes propagate in the following order.

```
Modify source code → Bump version → Create tag → Register podspec in spec repo → Update downstream dependencies → Repeat
```

For example, if BinaryLoaderNetwork is modified:

1. Bump `s.version` in `BinaryLoaderNetwork.podspec`
2. Create and push `git tag 1.0.5`
3. Register `BinaryLoaderNetwork/1.0.5/BinaryLoaderNetwork.podspec` in the `cocoapods-specs` repo
4. Update the dependency version in APIService, which depends on BinaryLoaderNetwork
5. Repeat the same process for APIService
6. Finally, run `pod install` in the App's Podfile

This process may feel tedious, but since each module's version is explicitly pinned, you can track exactly which version of the code is in use at any point in time.

# References

- <https://github.com/binaryloader/synstagram-app>
