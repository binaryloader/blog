---
title: "[iOS] Private Spec Repoを活用したCocoaPodsモジュラーアーキテクチャ"
ref: ios-modular-architecture-with-cocoapods
lang: ja
permalink: /ja/:categories/:title/
excerpt: "CocoaPods Private Spec Repoを活用してiOSプロジェクトをレイヤー別モジュールに分離する方法をまとめる。"
date: 2026-02-15T00:00+09:00
last_modified_at: 2026-02-15T00:00+09:00
published: true
header:
  overlay_color: "#202020"
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
    url: /ja/development/
  - title: "Apple"
    url: /ja/development/apple/
  - title: "iOS"
    url: /ja/development/apple/ios/
---

# 概要

CocoaPods Private Spec Repoを活用してiOSプロジェクトをレイヤー別モジュールに分離する方法をまとめる。

この記事で扱うプロジェクトは2020年頃に設計したものである。現在はSwift Package Managerが主流となりTuistのようなプロジェクト生成ツールも広く使われているため当時とトレンドが異なる可能性がある。しかしモジュール分離の原則やレイヤー構造の設計はツールが変わっても同様に適用できるため遅ればせながらまとめてみる。

# まとめ

## 1. アーキテクチャ概要

プロジェクトは4つのレイヤーで構成される。

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

| レイヤー | 役割 | 例 |
|---|---|---|
| **Foundation** | アプリに依存しない汎用ライブラリ | BinaryLoaderNetwork, BinaryLoaderExtensions |
| **Module** | アプリ固有のサービスと依存性インターフェース | APIService/Auth, Dependencies/Login |
| **Scene** | 画面単位の独立した機能モジュール | LoginScene |
| **App** | モジュールの組み立てと画面遷移を担当するエントリポイント | Synstagram |

下位レイヤーは上位レイヤーを知らない。FoundationはModuleを知らずModuleはSceneを知らない。依存性は常に上から下へのみ流れる。

## 2. リポジトリ構成

モジュール化プロジェクトには2種類のリポジトリが必要である。

| リポジトリ種類 | 役割 | 例 |
|---|---|---|
| **ソースリポジトリ** | 実際のコードを含むリポジトリ | `binaryloader-network`, `synstagram-scene-login` |
| **スペックリポジトリ** | podspecファイルをバージョン別に管理するリポジトリ | `cocoapods-specs`, `synstagram-scene-cocoapods-specs` |

スペックリポジトリはレイヤー別に分離した。

| スペックリポジトリ | 対象 | 登録済みPod |
|---|---|---|
| `cocoapods-specs` | Foundationレイヤー | BinaryLoaderNetwork, BinaryLoaderExtensions, BinaryLoaderDIContainer, BinaryLoaderUI |
| `synstagram-module-cocoapods-specs` | Moduleレイヤー | APIService, Dependencies |
| `synstagram-scene-cocoapods-specs` | Sceneレイヤー | LoginScene |

スペックリポジトリをレイヤー別に分離するとチームでアクセス権限を細分化でき Foundationレイヤーのスペックリポジトリは他のアプリプロジェクトでも再利用できる。

## 3. Foundationレイヤー

アプリに依存しない汎用ライブラリである。他のプロジェクトでもそのまま利用できる。

### BinaryLoaderNetwork

Moyaをラップしたネットワーク抽象化レイヤーである。

```ruby
# BinaryLoaderNetwork.podspec
Pod::Spec.new do |s|
  s.name = 'BinaryLoaderNetwork'
  s.version = '1.0.4'
  s.ios.deployment_target = '13.0'
  s.source_files = 'BinaryLoaderNetwork/Module/Source/*.swift'
  s.dependency 'Moya', '15.0.0'
end
```

コアは`NetworkTarget`プロトコルと`NetworkProvider`クラスである。

```swift
// NetworkTarget.swift
public protocol NetworkTarget: TargetType {
    var baseURL: URL { get }
    var path: String { get }
    var method: HTTPMethod { get }
    var sampleData: Data { get }
    var task: HTTPTask { get }
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

Moyaの型を直接公開せずtypealiasでラップして提供する。

```swift
// Moya+Wrapping.swift
public typealias HTTPMethod = Moya.Method
public typealias HTTPTask = Moya.Task
public typealias Response = Moya.Response
public typealias MoyaError = Moya.MoyaError
```

これによりMoyaのバージョンアップで型名が変更されてもラッピングファイルのみ修正すれば済むため下位モジュールへの変更範囲を最小化できる。

### BinaryLoaderDIContainer

Property Wrapperベースの依存性注入コンテナである。`@Injectable`で依存性を宣言し`Container.shared.register(type:)`で登録する。

```ruby
# BinaryLoaderDIContainer.podspec
Pod::Spec.new do |s|
  s.name = 'BinaryLoaderDIContainer'
  s.version = '1.0.4'
  s.source_files = 'BinaryLoaderDIContainer/Module/Source/*.swift'
end
```

### BinaryLoaderUI

UIコンポーネントをsubspecで分離し必要なものだけ選択的に使用できる。

```ruby
# BinaryLoaderUI.podspec
Pod::Spec.new do |s|
  s.name = 'BinaryLoaderUI'
  s.version = '1.0.2'
  s.default_subspec = :none

  s.subspec 'InsetTextField' do |ss|
    ss.source_files = 'BinaryLoaderUI/Module/InsetTextField/Source/*.swift'
  end
end
```

`default_subspec = :none`に設定すると`pod 'BinaryLoaderUI'`だけでは何も含まれず`pod 'BinaryLoaderUI/InsetTextField'`のように明示的にsubspecを指定する必要がある。

## 4. Moduleレイヤー

アプリ固有のビジネスロジックを担当するレイヤーである。Foundationレイヤーに依存しSceneレイヤーから利用される。

### APIService

ネットワークAPI呼び出しをカプセル化する。機能別にsubspecを分離する。

```ruby
# APIService.podspec
Pod::Spec.new do |s|
  s.name = 'APIService'
  s.version = '1.0.6'
  s.dependency 'BinaryLoaderExtensions', '1.0.2'
  s.default_subspec = :none

  s.subspec 'Auth' do |ss|
    ss.source_files = 'APIService/Module/Auth/Source/*.swift'
    ss.dependency 'BinaryLoaderNetwork', '1.0.4'
  end
end
```

Auth subspecは`AuthService`クラスを通じてログイン/ログアウトAPIを提供する。`NetworkTarget`を実装した`AuthNetworkTarget`でエンドポイントを定義し`NetworkProvider`でリクエストを送信する。

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
    var task: HTTPTask {
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

Scene間の依存性インターフェースをプロトコルで定義する。Sceneモジュールはこのプロトコルにのみ依存するため具体的な実装を知る必要がない。

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

このパターンの核心は**Sceneが他のSceneを直接importしないこと**である。LoginSceneがAlbumListSceneへ画面遷移する必要がある場合`AlbumListDependency`プロトコルを通じてViewControllerを取得する。実際の実装はAppレイヤーでDI Containerにより注入される。

## 5. Sceneレイヤー

画面単位の独立した機能モジュールである。Clean Swift（VIP）アーキテクチャを使用する。

```ruby
# LoginScene.podspec
Pod::Spec.new do |s|
  s.name = 'LoginScene'
  s.version = '1.0.10'
  s.source_files = 'LoginScene/Module/Source/**/*.{swift,xib}'
  s.resource = 'LoginScene/Module/Resources/*.xcassets'
  s.dependency 'BinaryLoaderDIContainer', '1.0.4'
  s.dependency 'BinaryLoaderExtensions', '1.0.2'
  s.dependency 'BinaryLoaderUI/InsetTextField', '1.0.2'
  s.dependency 'APIService/Auth', '1.0.6'
  s.dependency 'Dependencies/Login', '1.0.2'
  s.dependency 'Dependencies/AlbumList', '1.0.2'
end
```

ディレクトリ構成はClean Swiftパターンに従う。

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

SceneモジュールはDependenciesのプロトコルを実装して外部にエントリポイントを提供する。

```swift
// LoginDependencyItem.swift
public struct LoginDependencyItem: Dependency, LoginDependency {
    public var viewController: UIViewController {
        return LoginViewController(
            nibName: LoginViewController.className,
            bundle: LoginViewController.bundle
        )
    }
}
```

Scene間の画面遷移はRouterでDependenciesプロトコルを通じて行う。

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

`@Injectable`はDI Containerに登録された実装を自動的に注入する。

## 6. App統合

Appレイヤーはすべてのモジュールを組み立てるエントリポイントの役割を担う。

### Podfile

```ruby
source 'https://github.com/CocoaPods/Specs.git'
source 'https://github.com/binaryloader/cocoapods-specs.git'
source 'https://github.com/binaryloader/synstagram-module-cocoapods-specs.git'
source 'https://github.com/binaryloader/synstagram-scene-cocoapods-specs.git'

platform :ios, '13.0'
use_frameworks!

target :'Synstagram' do
    pod 'LoginScene', '1.0.10'
end
```

Scene Podのみ指定すればCocoaPodsが依存性グラフを解析し下位レイヤーのすべてのPodを自動的にインストールする。

### DI Container登録

Appレイヤーで各SceneのDependencyItemをDI Containerに登録する。

```swift
// DependencyContainer.swift
final class DependencyContainer {
    static func registerAll() {
        registerLoginSceneDependency()
    }

    private static func registerLoginSceneDependency() {
        Container.shared.register(type: LoginDependencyItem.self)
    }
}
```

### アプリ起動

```swift
// AppDelegate.swift
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
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

## 7. バージョン管理ワークフロー

モジュールのコードを修正した場合以下の順序で変更を伝搬する。

```
ソースコード修正 → バージョンバンプ → タグ作成 → スペックリポジトリにpodspec登録 → 下流モジュールの依存性更新 → 繰り返し
```

例えばBinaryLoaderNetworkのコードを修正した場合:

1. `BinaryLoaderNetwork.podspec`の`s.version`をバンプ
2. `git tag 1.0.5`を作成しプッシュ
3. `cocoapods-specs`リポジトリに`BinaryLoaderNetwork/1.0.5/BinaryLoaderNetwork.podspec`を登録
4. BinaryLoaderNetworkに依存するAPIServiceの依存性バージョンを更新
5. APIServiceも同じプロセスを繰り返す
6. 最終的にAppのPodfileで`pod install`を実行

このプロセスは煩雑に感じるかもしれないが各モジュールのバージョンが明示的に固定されているためどの時点でもどのバージョンのコードが使用されているか正確に追跡できる。

# 参考

- <https://github.com/binaryloader/synstagram-app>
