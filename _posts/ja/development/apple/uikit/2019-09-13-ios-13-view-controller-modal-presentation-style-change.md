---
date: 2019-09-13T00:00+09:00
title: "[UIKit] iOS 13のView Controller Modal Presentation Style変更に対応する"
ref: ios-13-view-controller-modal-presentation-style-change
excerpt: "iOS 13で変更されたModal Presentation Styleのデフォルト値に対応する方法をまとめる。"
lang: ja
last_modified_at: 2019-09-13T16:12+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Development
  - Apple
  - UIKit
tags:
  - Development
  - Apple
  - UIKit
  - iOS
  - Modal
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Apple"
    url: /ja/development/apple/
  - title: "UIKit"
    url: /ja/development/apple/uikit/
gallery_xcode11_gm_pad:
  - url: /assets/image/post/development/apple/uikit/ios-13-view-controller-modal-presentation-style-change/xcode11_gm_pad.png
    image_path: /assets/image/post/development/apple/uikit/ios-13-view-controller-modal-presentation-style-change/xcode11_gm_pad.png
gallery_xcode11_gm_phone:
  - url: /assets/image/post/development/apple/uikit/ios-13-view-controller-modal-presentation-style-change/xcode11_gm_phone.png
    image_path: /assets/image/post/development/apple/uikit/ios-13-view-controller-modal-presentation-style-change/xcode11_gm_phone.png
gallery_xcode11_gm_phone_full:
  - url: /assets/image/post/development/apple/uikit/ios-13-view-controller-modal-presentation-style-change/xcode11_gm_phone_full.png
    image_path: /assets/image/post/development/apple/uikit/ios-13-view-controller-modal-presentation-style-change/xcode11_gm_phone_full.png
---

# 概要

iOS 13で変更されたModal Presentation Styleのデフォルト値に対応する方法をまとめる。

# 注意

本記事は`Xcode 11 GM`バージョンでビルドおよびテストされたものであり、正式版リリース時に本文の内容と異なる動作をする可能性がある。

# はじめに

iOS 13 SDKで、UIModalPresentationStyleに`automatic`というケースが追加された。デフォルト値も従来の`fullScreen`から新しい`automatic`に変更された。これにより、従来と同じく画面全体を覆う形式のModal Presentation Styleを提供するには、追加の対応コードの挿入が不可避となった。

個人的にはAppleがカード形式のUIをトレンドとして推し進めようとしていることはある程度理解できるが、iOS SDKのデフォルト値を変更してしまうやり方は、開発者がiOS SDKに対して抱く印象に悪影響を及ぼしているように思え残念だ。

新規プロジェクトの場合はカード形式のスタイルを考慮したUI/UX対応が比較的容易だが、既に画面全体を覆うスタイルでUI/UXが実装・最適化されている既存プロジェクトでは、すぐに新しいスタイルへの対応が難しい状況だ。そこでiOS 13 SDKでビルドしたプロジェクトでも従来のように`fullScreen`スタイルを提供できないか調べてみよう。

# 調査して対応しよう

## 1. 何が変わったのか

まず実際に変更されたModal Presentation Styleをデバイスで確認してみよう。

{% include gallery id="gallery_xcode11_gm_pad" caption="Xcode 11 GM / iPad Pro 3rd Gen 12.9 / iOS 13" %}
{% include gallery id="gallery_xcode11_gm_phone" caption="Xcode 11 GM / iPhone 11 Pro / iOS 13" %}

左側の白い背景のView Controllerにある`present`ボタンを押すと、緑色の背景の新しいView ControllerがPresentされるように実装した。従来のようにPresentされるView Controllerが画面全体を覆う形式ではなく、既に表示されているView Controllerがディムされてスケールが小さくなり、新しくPresentされるView Controllerがその上を部分的にカード形式で覆いながら上がってくるのが確認できる。またプルダウンジェスチャーによるDismissインタラクションにも対応している。実際にシステムが提供するこのジェスチャーとインタラクションを使えるかどうかは未知数だ。デザイナーがシステムデフォルトのインタラクションを気に入るかも気になるところだ。

## 2. 開発者ドキュメントを読もう

カード形式のUIはきれいで良いのだが、今すぐは従来のように画面全体を覆う形式で提供する必要があるので、まずAppleが提供する開発者ドキュメントを読んでみよう。

- [UIModalPresentationStyle](https://developer.apple.com/documentation/uikit/uimodalpresentationstyle)
- [modalPresentationStyle](https://developer.apple.com/documentation/uikit/uiviewcontroller/1621355-modalpresentationstyle)

ざっと目を通すと、modalPresentationStyleを明示的に指定しない場合、Size Classesに応じてフルスクリーンを提供するか他のPresentationオプションを提供するかが決定されるようだ。

Appleの開発者ドキュメントには不正確な情報が含まれることもあるため、直接UIViewControllerのヘッダーを確認するのが心の平和への近道であることを痛いほど知っている。確認してみよう。

```swift
public enum UIModalPresentationStyle : Int {

    case fullScreen

    ...

    @available(iOS 7.0, *)
    case none

    @available(iOS 13.0, *)
    case automatic
}
```

UIModalPresentationStyle Enumの定義部分を確認すると、`automatic`というケースが追加されていることがわかる。またmodalPresentationStyleインスタンスプロパティの宣言部分にはコメントで関連内容の説明があった。必要な部分を整理すると以下のとおりだ。

- modalPresentationStyleはView Controllerがモーダル形式で表示される際に使用されるスタイルを定義する。
- このプロパティは表示させるコントローラーではなく、表示されるコントローラーに設定する必要がある。
- このプロパティがautomaticに設定されている場合、常に具体的なスタイルに変換される。
- デフォルトでは`automatic`は`pageSheet`として解釈される。
- デフォルト値はiOS 13.0以降は`automatic`、それ以前のバージョンでは`fullScreen`である。

これでデバッグのための事前情報収集は完了だ。関連情報をある程度調べたので、デバッグを行いiOS 13以前のバージョンのように`fullScreen`形式で表示されるよう修正してみよう。

## 3. デバッグしてみよう

Appleの開発者ドキュメントが述べているとおり、Xcode 11（厳密にはiOS 13 SDK）でUIModalPresentationStyleのデフォルト値が`automatic`に変わったのか確認してみよう。

適当な箇所にブレークポイントを設定し、以下のLLDBデバッグコマンドを実行してみよう。

```
(lldb) po viewController.modalPresentationStyle.rawValue
結果 : 1
```

`automatic`のrawValueである-2が出力されると思っていたが、1が出力された。iPadでも同様に1が出力される。Xcode 11 GMバージョンのバグかと思ったが、開発者ドキュメントに記載されているとおりSize Classesに応じて適切なスタイルに変換されたようだ。

## 4. まず急ぎの対応をしよう

デフォルト値の変更により`pageSheet`で表示されるモーダルスタイルを`fullScreen`に変更するための方法としては、大きく3つのアプローチがある。

1. UIViewControllerのpresent関連メソッドのSwizzling
2. 個別の呼び出し箇所でmodalPresentationStyleを`fullScreen`に変更
3. `fullScreen`でモーダルを表示するメソッドを実装

1番のメソッドSwizzlingは、アプリのライフサイクル全体にわたりアプリ全域やOSが呼び出す箇所にも影響を与えるため、サイドエフェクトが発生する可能性のある危険な方法だ。個人的に問題解決において他の代替手段がある場合はメソッドSwizzlingを極力避ける方針のため、1番の方法は除外する。

2番の個別呼び出し箇所でmodalPresentationStyleを`fullScreen`に変更する方法が最も安全でサイドエフェクトは皆無だが、コードが散在しやすく将来的に除去すべきレガシーコードになりうるため、この方法も除外する。

3番の`fullScreen`でモーダルを表示するメソッドを実装する方法が、現実との折り合いをつけた解決策といえる。これにより従来のように画面全体を覆う形式のモーダルスタイルを望む開発者はこのメソッドを使って問題を解決できる。

## 5. コードを書いてみよう

実務では一人で開発するのではなく複数人で共同作業をするため、予想可能なサイドエフェクトや解決すべき問題以外のケースに対する例外処理をできる限り実装しておくことが望ましい。

上で言及したメソッドを実装する際に予測できる最も基本的なサイドエフェクトは、外部から`fullScreen`以外のmodalPresentationStyleを設定してから呼び出されるケースだ。簡単な例を挙げると、`overCurrentContext`を設定してメソッドを通した場合、意図した動作ではなく`fullScreen`で画面全体を覆う動作になってしまう可能性がある。そこでAppleの開発者ドキュメントの確認とデバッグを通じて、フィルタリングすべき条件を明確に把握した。`pageSheet`の場合にのみ`fullScreen`に変更する方法だ。それではコードを書いてみよう。

```swift
extension UIViewController {

    func present(to viewController: UIViewController, animated: Bool, completion: (() -> Void)? = nil) {
        defer {
            present(viewController, animated: animated, completion: completion)
        }

        guard #available(iOS 13.0, *) else { return }

        let targets: [UIModalPresentationStyle] = [.pageSheet]
        guard targets.contains(viewController.modalPresentationStyle) else { return }

        viewController.modalPresentationStyle = .fullScreen
    }

}
```

extensionを使用して、`fullScreen`でモーダルを表示するメソッドをUIViewControllerに追加した。ランタイム環境がiOS 13以上で、表示するView ControllerのmodalPresentationStyleが`pageSheet`の場合にのみ`fullScreen`に変更するように実装した。

{% include gallery id="gallery_xcode11_gm_phone_full" caption="Xcode 11 GM / iPhone 11 Pro / iOS 13" %}

実行してみると、画面全体を覆う形式でモーダルが表示されることが確認できる。いずれは`pageSheet`スタイルに適したUI/UXに修正すべきだが、時間がない今は本記事で紹介した方法で対応するのも良いだろう。

# 参考

- <https://developer.apple.com/videos/play/wwdc2019/224/>
