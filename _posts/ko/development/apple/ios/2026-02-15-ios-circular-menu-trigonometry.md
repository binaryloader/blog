---
title: "[iOS] 삼각함수로 원형 메뉴 배치와 회전 구현하기"
ref: ios-circular-menu-trigonometry
excerpt: "삼각함수(sin, cos, atan2)를 활용하여 iOS에서 원형 메뉴 아이템을 배치하고 회전시키는 방법을 정리한다."
date: 2026-02-15T03:40+09:00
last_modified_at: 2026-02-15T06:15+09:00
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
  - Swift
  - UIKit
  - Trigonometry
  - Mathematics
  - UI
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Apple"
    url: /ko/development/apple/
  - title: "iOS"
    url: /ko/development/apple/ios/
---

# 개요

삼각함수(sin, cos, atan2)를 활용하여 iOS에서 원형 메뉴 아이템을 배치하고 회전시키는 방법을 정리한다.

# 핵심 공식

```
x = centerX + radius × cos(angle)
y = centerY + radius × sin(angle)
```

```
angle = atan2(y, x)
```

cos, sin으로 각도를 좌표로 변환하여 메뉴를 배치하고 atan2로 좌표를 각도로 변환하여 터치 회전을 구현한다. 이 포스트에서는 이 공식들이 왜 이렇게 생겼는지 처음부터 단계별로 풀어본다.

# 정리

## 1. cos과 sin

### 1.1. 사다리 비유

벽에 기대어 놓은 사다리를 상상해 본다.

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/ladder.svg" alt="사다리 비유: cos(가로), sin(세로), 빗변" style="max-width: min(320px, 100%);">

사다리를 눕히면 가로가 길어지고 세로가 짧아진다. 사다리를 세우면 세로가 길어지고 가로가 짧아진다. 각도에 따라 가로와 세로의 분배가 달라진다.

사다리 길이를 100%로 보면 가로가 몇 %, 세로가 몇 %인지 표현할 수 있다. 이 비율에 이름을 붙인 것이 **cos**(가로 비율)과 **sin**(세로 비율)이다.

### 1.2. 왜 cos = x, sin = y인가

직각삼각형에서 cos = 밑변 ÷ 빗변, sin = 높이 ÷ 빗변이다. 빗변(사다리 길이)이 **1**이면 나눗셈이 사라진다.

```
cos = 밑변 ÷ 1 = 밑변 그 자체
sin = 높이 ÷ 1 = 높이 그 자체
```

이 삼각형을 좌표평면에 올려놓으면 밑변 = x축 방향, 높이 = y축 방향이다. 그래서 **cos이 곧 x좌표**, **sin이 곧 y좌표**가 된다.

### 1.3. 단위원

사다리를 빙글 돌리면 끝점이 원을 그린다. 반지름이 1인 이 원을 단위원이라 한다.

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/unit-circle.svg" alt="단위원: 반지름 1인 원 위의 좌표" style="max-width: min(400px, 100%);">

원 위의 어떤 점이든 `(cos θ, sin θ)`로 표현할 수 있다.

### 1.4. 값의 범위: -1 ~ 1

단위원 밖으로는 나갈 수 없으니 cos과 sin의 값은 항상 **-1에서 1 사이**다.

```
cos = +0.7  →  오른쪽으로 반지름의 70%
cos = -0.7  →  왼쪽으로 반지름의 70%
sin = +0.7  →  아래쪽으로 반지름의 70% (iOS)
sin = -0.7  →  위쪽으로 반지름의 70% (iOS)
```

cos/sin은 "이 각도에서 가로로/세로로 반지름의 몇 %를 이동하느냐"를 알려주는 비율표다.

## 2. 라디안

### 2.1. 라디안이란

반지름 1인 원의 둘레 위를 **걸은 거리**다.

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/radian.svg" alt="라디안: 반지름 1인 원의 호 길이" style="max-width: min(360px, 100%);">

- 원 둘레 = 2 × π × 1 = 2π ≈ **6.28**
- 한 바퀴 = 6.28 라디안 = **360°**
- 반 바퀴 = π ≈ 3.14 라디안 = **180°**
- 1/4 바퀴 = π/2 ≈ 1.57 라디안 = **90°**

### 2.2. 주요 변환 값

| 바퀴 | 라디안 | 도(°) |
|---|---|---|
| 1 | 2π (6.28) | 360° |
| 1/2 | π (3.14) | 180° |
| 1/4 | π/2 (1.57) | 90° |
| 1/8 | π/4 (0.79) | 45° |

```
도 → 라디안: 도 × 0.0174  (= 도 × π ÷ 180)
라디안 → 도: 라디안 × 57.3  (= 라디안 × 180 ÷ π)
```

### 2.3. Swift에서 라디안

Swift의 `cos()`과 `sin()` 함수는 **라디안만** 받는다.

```swift
cos(90)        // ❌ 90 라디안 = 5156°로 해석됨
cos(.pi / 2)   // ✅ 이것이 90°
```

## 3. iOS 좌표계

### 3.1. y축이 뒤집혀 있다

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/coordinates.svg" alt="수학 좌표계 vs iOS 좌표계" style="max-width: min(520px, 100%);">

수학에서는 y가 위로 증가하지만 iOS에서는 **y가 아래로** 증가한다.

### 3.2. 회전 방향

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/rotation.svg" alt="회전 방향: 수학(반시계) vs iOS(시계)" style="max-width: min(520px, 100%);">

y축이 뒤집혔기 때문에 같은 코드를 실행해도 **수학에서 반시계 = iOS에서 시계방향**이 된다. 이 특성 덕분에 **-π/2(12시)부터 시작하면 시계방향으로 자연스럽게 배치**된다.

## 4. 원형 배치 계산

### 4.1. 전체 흐름

```
한 바퀴(2π) ÷ 개수 = 한 조각
-π/2 + 순서 × 한 조각 = 각도
cos(각도), sin(각도) = 비율
비율 × 반지름 = 실제 거리
중심 + 실제 거리 = 최종 좌표
```

### 4.2. 단계별 계산 (8개 아이콘 예시)

중심 (200, 200), 반지름 120으로 8개 아이콘을 12시부터 시계방향으로 배치한다.

#### 1단계: 한 바퀴를 라디안으로

```
2 × π = 2 × 3.14159 = 6.28318 라디안
```

#### 2단계: 8등분

```
6.28318 ÷ 8 = 0.78540 라디안 (= 45°)
```

#### 3단계: 시작점을 12시로

0°는 3시 방향(오른쪽)이다. 12시로 옮기려면 1/4 바퀴 뒤로 간다.

```
6.28318 ÷ 4 = 1.5708
뒤로(음의 방향): -1.5708 라디안 (= -90°)
```

#### 4단계: 각 아이콘의 각도

공식: `-1.5708 + i × 0.78540`

```
i=0:  -1.5708 + 0 × 0.7854 = -1.5708  → -90°  (12시)
i=1:  -1.5708 + 1 × 0.7854 = -0.7854  → -45°  (1~2시)
i=2:  -1.5708 + 2 × 0.7854 =  0       →   0°  (3시)
i=3:  -1.5708 + 3 × 0.7854 =  0.7854  →  45°  (4~5시)
i=4:  -1.5708 + 4 × 0.7854 =  1.5708  →  90°  (6시)
i=5:  -1.5708 + 5 × 0.7854 =  2.3562  → 135°  (7~8시)
i=6:  -1.5708 + 6 × 0.7854 =  3.1416  → 180°  (9시)
i=7:  -1.5708 + 7 × 0.7854 =  3.9270  → 225°  (10~11시)
```

#### 5단계: cos/sin 비율 구하기

입력은 라디안, 출력은 -1 ~ 1 사이의 비율이다.

```
i=0:  cos(-1.5708)= 0.0000   sin(-1.5708)=-1.0000  (가로 없음, 위로 100%)
i=1:  cos(-0.7854)= 0.7071   sin(-0.7854)=-0.7071  (오른쪽 70.7%, 위로 70.7%)
i=2:  cos(0)      = 1.0000   sin(0)      = 0.0000  (오른쪽 100%, 세로 없음)
i=3:  cos(0.7854) = 0.7071   sin(0.7854) = 0.7071  (오른쪽 70.7%, 아래로 70.7%)
i=4:  cos(1.5708) = 0.0000   sin(1.5708) = 1.0000  (가로 없음, 아래로 100%)
i=5:  cos(2.3562) =-0.7071   sin(2.3562) = 0.7071  (왼쪽 70.7%, 아래로 70.7%)
i=6:  cos(3.1416) =-1.0000   sin(3.1416) = 0.0000  (왼쪽 100%, 세로 없음)
i=7:  cos(3.9270) =-0.7071   sin(3.9270) =-0.7071  (왼쪽 70.7%, 위로 70.7%)
```

#### 6단계: 반지름(120) 곱하기

비율에 반지름을 곱하면 실제 이동 거리(pt)가 나온다.

```
i=0:  가로  0.0000 × 120 =    0     세로 -1.0000 × 120 = -120
i=1:  가로  0.7071 × 120 =   84.9   세로 -0.7071 × 120 =  -84.9
i=2:  가로  1.0000 × 120 =  120     세로  0.0000 × 120 =    0
i=3:  가로  0.7071 × 120 =   84.9   세로  0.7071 × 120 =   84.9
i=4:  가로  0.0000 × 120 =    0     세로  1.0000 × 120 =  120
i=5:  가로 -0.7071 × 120 =  -84.9   세로  0.7071 × 120 =   84.9
i=6:  가로 -1.0000 × 120 = -120     세로  0.0000 × 120 =    0
i=7:  가로 -0.7071 × 120 =  -84.9   세로 -0.7071 × 120 =  -84.9
```

#### 7단계: 중심 좌표(200, 200) 더하기

```
i=0:  x = 200 +    0   = 200    y = 200 + (-120)  =  80    (12시)
i=1:  x = 200 +   84.9 = 284.9  y = 200 + (-84.9) = 115.1  (1~2시)
i=2:  x = 200 +  120   = 320    y = 200 +    0    = 200    (3시)
i=3:  x = 200 +   84.9 = 284.9  y = 200 +   84.9  = 284.9  (4~5시)
i=4:  x = 200 +    0   = 200    y = 200 +  120    = 320    (6시)
i=5:  x = 200 + (-84.9)= 115.1  y = 200 +   84.9  = 284.9  (7~8시)
i=6:  x = 200 + (-120) =  80    y = 200 +    0    = 200    (9시)
i=7:  x = 200 + (-84.9)= 115.1  y = 200 + (-84.9) = 115.1  (10~11시)
```

결과를 시각화하면 다음과 같다.

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/placement.svg" alt="8개 아이콘 원형 배치 결과" style="max-width: min(440px, 100%);">

## 5. atan2

cos과 sin은 각도를 넣으면 좌표가 나왔다. `atan2`는 반대다. 좌표를 넣으면 각도가 나온다.

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/atan2.svg" alt="atan2: 좌표에서 각도를 구하는 역함수" style="max-width: min(400px, 100%);">

```
cos(각도) → x 비율      각도 → 좌표
sin(각도) → y 비율      각도 → 좌표
atan2(y, x) → 각도      좌표 → 각도
```

`atan2(y, x)`는 원점 `(0, 0)`에서 (x, y) 방향까지의 각도를 라디안으로 반환한다.

- 반환 범위: **-π ~ π** (-180° ~ 180°)
- 3시 = 0, 6시 = π/2, 9시 = ±π, 12시 = -π/2

원형 메뉴의 중심은 원점이 아니라 화면 중심(예: `(200, 300)`)이다. `atan2`에 터치 좌표를 그대로 넣으면 원점 기준 각도가 나오므로 터치 좌표에서 중심을 빼서 중심 기준 좌표로 변환해야 한다.

```
화면 중심 = (200, 300), 터치 = (296, 234)
중심 기준 좌표 = (296 - 200, 234 - 300) = (96, -66)
atan2(-66, 96) → 중심에서 터치 방향의 각도
```

```swift
let center = CGPoint(x: view.bounds.midX, y: view.bounds.midY)
let angle = atan2(point.y - center.y, point.x - center.x)
```

## 6. 팬 제스처로 회전

배치된 메뉴를 드래그로 회전시키려면 터치 지점의 **각도 변화**를 추적해야 한다.

### 6.1. 회전량 계산

#### 터치 시작 (began)

```swift
panStartAngle = angle(for: touchPoint) - currentRotation
```

터치 지점의 각도에서 현재 회전량을 빼서 **오프셋**을 기록한다. 이 오프셋은 터치 지점과 메뉴 회전 상태 사이의 차이다.

```
터치 각도 = 0.5 rad, 현재 회전 = 0.3 rad
오프셋 = 0.5 - 0.3 = 0.2 rad
```

오프셋을 기록하는 이유는 메뉴가 이미 회전된 상태에서 터치해도 메뉴가 점프하지 않고 부드럽게 이어지도록 하기 위해서다.

#### 터치 이동 (changed)

```swift
currentRotation = angle(for: touchPoint) - panStartAngle
```

새 터치 각도에서 오프셋을 빼면 새 회전량이 나온다.

```
터치가 0.5 → 1.2로 이동
새 회전 = 1.2 - 0.2(오프셋) = 1.0 rad
회전 변화 = 1.0 - 0.3(이전) = 0.7 rad만큼 회전
```

#### 각속도 기록

```swift
angularVelocity = newRotation - previousAngle
previousAngle = newRotation
```

프레임 간 회전 변화량을 **각속도**로 기록한다. 터치를 뗄 때 이 값이 감속 애니메이션의 초기 속도가 된다.

### 6.2. 감속 애니메이션

터치를 떼면 갑자기 멈추는 대신 관성처럼 서서히 느려진다.

#### CADisplayLink

`CADisplayLink`는 화면이 갱신될 때마다(보통 초당 60회) 호출되는 타이머다.

```swift
displayLink = CADisplayLink(target: self, selector: #selector(step))
displayLink?.add(to: .main, forMode: .common)
```

#### 매 프레임 처리

```swift
let dt = link.timestamp - lastTimestamp         // 이전 프레임과의 시간 차(초)
angularVelocity *= pow(0.92, CGFloat(dt * 60))  // 감쇠
currentRotation += angularVelocity              // 회전 적용
layoutMenuItems()                               // 재배치
```

- **dt**: 이전 프레임과의 시간 차이(초). 60fps면 약 0.0167초, 프레임 드롭이 발생하면 더 커진다.
- **0.92**: 감쇠 계수. 매 프레임 속도가 8%씩 감소한다.
- **pow(a, b)**: a의 b제곱. `pow(0.92, 3)` = 0.92³ ≈ 0.779.
- **pow(0.92, dt × 60)**: 프레임 속도에 관계없이 일정한 감속을 보장한다. dt가 1/60초(한 프레임)면 0.92¹ = 0.92, dt가 1/30초(프레임 드롭)면 0.92² ≈ 0.846이 된다.
- 각속도가 0.0001 미만이면 타이머를 중지한다.

#### 감쇠 계수에 따른 느낌

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/deceleration.svg" alt="감쇠 계수별 각속도 감소 그래프" style="max-width: min(440px, 100%);">

| 계수 | 프레임당 감소 | 느낌 |
|---|---|---|
| 0.98 | 2% | 오래 미끄러짐 (빙판) |
| 0.95 | 5% | 부드러운 감속 |
| 0.92 | 8% | 적당한 감속 |
| 0.85 | 15% | 빠른 정지 |

## 7. Swift 구현

### 7.1. 균등 배치

```swift
let count = 8
let slice = (2 * .pi) / CGFloat(count)  // 한 바퀴(2π) ÷ 8 = 45°씩

for i in 0..<count {
    let angle = -(.pi / 2) + CGFloat(i) * slice
    //          ↑ 12시       ↑ 몇 번째    ↑ 한 조각

    let x = centerX + radius * cos(angle)  // cos = 가로
    let y = centerY + radius * sin(angle)  // sin = 세로
}
```

### 7.2. 불균등 배치

간격이 불규칙한 경우 각도를 직접 지정한다.

```swift
// 각 아이콘의 각도를 직접 지정 (라디안)
let itemAngles: [CGFloat] = [
    -.pi / 2,            // 12시
    -.pi / 4,            // 1~2시
    0,                   // 3시
    .pi / 4,             // 4~5시
    .pi / 2,             // 6시
    .pi * 3 / 4,         // 7~8시
    .pi,                 // 9시
    .pi + .pi / 4        // 10~11시
]

for (i, angle) in itemAngles.enumerated() {
    let x = centerX + radius * cos(angle)
    let y = centerY + radius * sin(angle)
}
```

### 7.3. 팬 제스처 회전

배치에 회전을 적용하려면 각 아이콘의 각도에 `currentRotation`을 더한다.

```swift
let center = CGPoint(x: view.bounds.midX, y: view.bounds.midY)
let radius: CGFloat = 120
let slice = (2 * .pi) / CGFloat(menuItems.count)

for (i, item) in menuItems.enumerated() {
    let angle = -(.pi / 2) + CGFloat(i) * slice + currentRotation
    item.center = CGPoint(
        x: center.x + radius * cos(angle),
        y: center.y + radius * sin(angle)
    )
}
```

각도 변환은 5장, 팬 제스처와 감속 애니메이션은 6장에서 다뤘다.

실제 UIKit 앱에서 구현하면 다음과 같다.

<div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
  <img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/demo.png" alt="UIKit 원형 메뉴 구현 결과" style="max-width: min(200px, 45%);">
  <video autoplay loop muted playsinline width="200" style="max-width: min(200px, 45%);">
    <source src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/demo.mp4" type="video/mp4">
  </video>
</div>

# 참고

- <https://developer.apple.com/documentation/coregraphics/cgfloat>
- <https://en.wikipedia.org/wiki/Unit_circle>
- <https://en.wikipedia.org/wiki/Radian>
- <https://developer.apple.com/documentation/quartzcore/cadisplaylink>
