---
title: "[UIKit] iOS 13 View Controller Modal Presentation Style 변경 대응하기"
ref: ios-13-view-controller-modal-presentation-style-change
excerpt: "iOS 13에서 변경된 Modal Presentation Style의 기본값에 대응하는 방법을 정리한다."
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
    url: /ko/development/
  - title: "Apple"
    url: /ko/development/apple/
  - title: "UIKit"
    url: /ko/development/apple/uikit/
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

# 개요

iOS 13에서 변경된 Modal Presentation Style의 기본값에 대응하는 방법을 정리한다.

# 주의

본 글은 `Xcode 11 GM` 버전에서 빌드 및 테스트 되었으며 정식 버전 릴리즈 시 본문의 내용과는 상이한 방식으로 동작할 가능성이 있다.

# 들어가며

iOS 13 SDK에서 UIModalPresentationStyle에 `automatic`이라는 케이스가 추가되었다. default value도 기존의 `fullScreen`에서 새로 추가된 케이스인 `automatic`으로 변경되었다. 이에 따라 기존과 같이 스크린 전체를 덮는 형태의 Modal Presentation Style을 제공하기 위해서는 추가 대응 코드 삽입이 불가피해졌다.

개인적으로 애플이 카드 형태의 UI를 트랜드로 밀고 나가려는 것은 어느 정도 이해를 하지만 iOS SDK의 default value를 변경해버리는 행태는 개발자들이 iOS SDK를 바라보는 시선에 좋지 않는 영향을 주는 것 같아 안타깝다.

신규 프로젝트의 경우 카드 형태의 스타일을 고려한 UI/UX 대응이 보다 수월하겠지만 이미 화면 전체를 덮는 스타일로 UI/UX가 구현 및 최적화가 되어 있는 기존 프로젝트들은 지금 당장은 변경된 스타일로 대응이 힘든 상황이다. 이에 따라 iOS 13 SDK로 빌드한 프로젝트에서도 기존처럼 `fullScreen` 스타일을 제공할 수 없을지 알아보도록 하겠다.

# 알아보고 대응하자

## 1. 어떻게 바뀌었나

먼저 실제로 변경된 Modal Presentation Style을 기기에서 확인해보자.

{% include gallery id="gallery_xcode11_gm_pad" caption="Xcode 11 GM / iPad Pro 3rd Gen 12.9 / iOS 13" %}
{% include gallery id="gallery_xcode11_gm_phone" caption="Xcode 11 GM / iPhone 11 Pro / iOS 13" %}

왼쪽 흰색 배경의 뷰 컨트롤러에 있는 `present` 버튼을 누르면 녹색 배경의 새로운 뷰 컨트롤러가 Present 되도록 구현했다. 기존처럼 Present 되는 뷰 컨트롤러가 화면 전체를 덮는 형태가 아니라 기존에 노출되고 있던 뷰 컨트롤러는 딤드되면서 스케일이 작아지고 새로 Present 되는 뷰 컨트롤러가 그 위를 일부만 덮으면서 카드 형태로 올라오는 것을 확인할 수 있다. 또한 풀 다운 제스처를 통한 Dismiss 인터렉션을 지원한다. 사실 시스템에서 제공하는 이 제스처와 인터렉션을 사용할 수 있을지는 미지수이다. 디자이너가 과연 시스템 디폴트 인터렉션을 마음에 들어 할지 궁금하다.

## 2. 개발자 문서를 읽어보자

카드 형태의 UI도 이쁘고 다 좋은데 당장은 기존과 같이 스크린 전체를 덮는 형태로 제공을 해야 하니 일단 애플에서 제공하는 개발자 문서를 읽어보자.

- [UIModalPresentationStyle](https://developer.apple.com/documentation/uikit/uimodalpresentationstyle)
- [modalPresentationStyle](https://developer.apple.com/documentation/uikit/uiviewcontroller/1621355-modalpresentationstyle)

대충 훑어보니 modalPresentationStyle을 명시적으로 지정하지 않으면 Size Classes에 따라서 full screen을 제공할지 다른 Presentation 옵션을 제공할지 결정되는 것 같다.

애플 개발자 문서는 정확하지 않은 정보들도 가끔 있기 때문에 직접 UIViewController 헤더를 까보는 것이 마음의 평화를 위한 지름길이라는 것을 너무나도 잘 알고 있다. 한번 까보자.

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

UIModalPresentationStyle Enum이 정의된 부분을 찾아보니 `automatic`이라는 케이스가 추가된 것을 확인할 수 있다. 또한 modalPresentationStyle 인스턴스 프로퍼티 선언 부분을 가보니 주석으로 관련 내용을 설명을 하고 있었다. 필요한 부분을 해석하여 정리하면 아래와 같다.

- modalPresentationStyle은 뷰컨이 모달 형태로 표시될 때 사용되는 스타일을 정의함.
- 이 프로퍼티는 노출시키는 컨트롤러가 아닌 노출될 컨트롤러에 설정해야 함.
- 이 프로퍼티가 automatic으로 설정되어 있다면 이것은 항상 구체적인 스타일로 변환됨.
- 기본적으로 `automatic`은 `pageSheet`으로 해석됨.
- default value는 iOS 13.0 부터 `automatic`, 이전 버전에서는 `fullScreen`임.

이제 디버깅을 위한 사전 정보 탐색은 다 끝났다. 관련된 정보를 어느 정도 찾아봤으니 디버깅을 해보고 iOS 13 이전 버전처럼 `fullScreen` 형태로 표시되도록 수정해보자.

## 3. 디버깅을 해보자

애플 개발자 문서가 말하는대로 Xcode 11, 엄밀히 따지자면 iOS 13 SDK에서 UIModalPresentationStyle의 default value가 `automatic`으로 바뀌었는지 확인해보자.

브레이크 포인트를 적당한 곳에 걸고 아래 LLDB 디버깅 커맨드를 수행해보자.

```
(lldb) po viewController.modalPresentationStyle.rawValue
결과 : 1
```

`automatic`의 rawValue인 -2가 출력될 줄 알았는데 1이 출력되었다. 아이패드에서도 동일하게 1이 출력된다. Xcode 11 GM 버전의 버그인 줄 알았는데 개발자 문서에 나와있는 것처럼 Size Classes에 따라서 적당한 스타일로 변환된 것 같다.

## 4. 일단 급한 불을 꺼보자

default value 변경으로 인하여 `pageSheet`으로 표시되는 모달 스타일을 `fullScreen`으로 변경하기 위한 방법으로는 크게 세 가지 방법이 있다.

1. UIViewController의 present 관련 메서드 스위즐링
2. 개별 호출 부분에서 modalPresentationStyle을 `fullScreen`으로 변경
3. `fullScreen`으로 모달을 표시하는 메서드 구현

1번 메서드 스위즐링은 앱 라이프 사이클 동안 앱 전역 혹은 OS가 호출하는 부분도 영향을 받기 때문에 사이드 이펙트가 생길 수도 있는 위험한 방법이다. 개인적으로 문제 해결을 할 때 다른 대안이 있는 경우 메서드 스위즐링은 최대한 지양하는 편이라 1번 방법은 제외하기로 하겠다.

2번 개별 호출 부분에서 modalPresentationStyle을 `fullScreen`으로 변경하는 것이 가장 안전하고 이로 인한 사이드 이펙트는 아예 없겠지만 코드가 혼재되고 추후에 걷어내야 하는 레거시가 될 수 있기 때문에 이 방법 역시 제외하기로 하겠다.

3번 `fullScreen`으로 모달을 표시하는 메서드를 구현하는 방법이 그나마 현실과 타협한 해결 방법이라고 할 수 있다. 이를 통해 기존처럼 화면 전체를 덮는 형태의 모달 스타일을 원하는 개발자는 이 메서드를 통하여 문제를 해결할 수 있다.

## 5. 코드를 짜보자

현업에서는 개발을 혼자하는 것이 아니라 여러 사람과 함께 작업을 하기 때문에 예상 가능한 사이드 이펙트 혹은 해결해야 할 문제 이외의 케이스에 대한 예외처리를 최대한 해놓는 것이 바람직하다.

우리가 위에서 언급한 메서드를 구현할 때 예측할 수 있는 가장 기본적인 사이드 이펙트는 외부에서 `fullScreen` 이외의 modalPresentationStyle을 설정하고 들어오는 경우이다.
간단한 예시를 하나 들자면 `overCurrentContext`를 설정하고 메서드를 태웠더니 의도한 동작이 아닌 `fullScreen`으로 화면 전체를 덮는 동작을 하게 될 수도 있다. 그래서 우리는 애플 개발자 문서 읽기와 디버깅을 통해서 우리가 발라내야 할 조건을 명확히 파악했다. `pageSheet`인 경우에만 `fullScreen`으로 변경하는 방법이다. 이제 코드를 짜보자.

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

extension을 통해 `fullScreen`으로 모달을 표시하는 메서드를 UIViewController에 추가하였다. 런타임 환경이 iOS 13 이상, 표시할 뷰 컨트롤러의 modalPresentationStyle이 `pageSheet`일 경우에만 `fullScreen`으로 변경하도록 작성하였다.

{% include gallery id="gallery_xcode11_gm_phone_full" caption="Xcode 11 GM / iPhone 11 Pro / iOS 13" %}

실행해보면 화면 전체를 덮는 형태로 모달이 표시되는 것을 확인할 수 있다. 언젠가는 `pageSheet` 스타일에 적합한 UI/UX로 수정을 해야겠지만 시간이 없는 지금 당장은 본 글에서 알아본 방법으로 해결하는 것도 괜찮을 것 같다.

# 참고

- <https://developer.apple.com/videos/play/wwdc2019/224/>
