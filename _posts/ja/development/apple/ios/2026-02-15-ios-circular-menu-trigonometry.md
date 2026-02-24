---
title: "[iOS] 三角関数で円形メニューの配置と回転を実装する"
ref: ios-circular-menu-trigonometry
lang: ja
permalink: /ja/:categories/:title/
excerpt: "三角関数(sin, cos, atan2)を活用してiOSで円形メニューアイテムを配置・回転させる方法をまとめる。"
date: 2026-02-15T03:40+09:00
last_modified_at: 2026-02-15T06:15+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/ios-circular-menu-trigonometry.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/ios-circular-menu-trigonometry.png"
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
    url: /ja/development/
  - title: "Apple"
    url: /ja/development/apple/
  - title: "iOS"
    url: /ja/development/apple/ios/
---

# 概要

三角関数(sin, cos, atan2)を活用してiOSで円形メニューアイテムを配置・回転させる方法をまとめる。

# 核心公式

```
x = centerX + radius × cos(angle)
y = centerY + radius × sin(angle)
```

```
angle = atan2(y, x)
```

cosとsinで角度を座標に変換してメニューを配置しatan2で座標を角度に変換してタッチ回転を実装する。この記事ではこれらの公式がなぜこうなるのか最初からステップごとに解説する。

# 手順

## 1. cosとsin

### 1.1. はしごの比喩

壁に立て掛けたはしごを想像する。

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/ladder.svg" alt="はしごの比喩: cos(横), sin(縦), 斜辺" style="max-width: min(320px, 100%);">

はしごを寝かせると横の距離が伸び縦の高さが縮む。はしごを立てると縦が伸び横が縮む。角度によって横と縦の配分が変わる。

はしごの長さを100%とすると横が何%、縦が何%かを表現できる。この比率に名前をつけたのが**cos**(横の比率)と**sin**(縦の比率)だ。

### 1.2. なぜcos = x、sin = yなのか

直角三角形でcos = 底辺 ÷ 斜辺、sin = 高さ ÷ 斜辺。斜辺(はしごの長さ)が**1**なら割り算が消える。

```
cos = 底辺 ÷ 1 = 底辺そのもの
sin = 高さ ÷ 1 = 高さそのもの
```

この三角形を座標平面に置くと底辺 = x軸方向、高さ = y軸方向。つまり**cosがそのままx座標**、**sinがそのままy座標**になる。

### 1.3. 単位円

はしごをぐるっと回すと先端が円を描く。半径1のこの円を単位円と呼ぶ。

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/unit-circle.svg" alt="単位円: 半径1の円上の座標" style="max-width: min(400px, 100%);">

円上のどの点も`(cos θ, sin θ)`で表現できる。

### 1.4. 値の範囲: -1 ~ 1

単位円の外には出られないのでcosとsinの値は常に**-1から1の間**だ。

```
cos = +0.7  →  右方向に半径の70%
cos = -0.7  →  左方向に半径の70%
sin = +0.7  →  下方向に半径の70% (iOS)
sin = -0.7  →  上方向に半径の70% (iOS)
```

cos/sinは「この角度で横に/縦に半径の何%移動するか」を教えてくれる比率表だ。

## 2. ラジアン

### 2.1. ラジアンとは

半径1の円の円周上を**歩いた距離**だ。

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/radian.svg" alt="ラジアン: 単位円の弧の長さ" style="max-width: min(360px, 100%);">

- 円周 = 2 × π × 1 = 2π ≈ **6.28**
- 一周 = 6.28ラジアン = **360°**
- 半周 = π ≈ 3.14ラジアン = **180°**
- 1/4周 = π/2 ≈ 1.57ラジアン = **90°**

### 2.2. 主要な変換値

| 回転 | ラジアン | 度(°) |
|---|---|---|
| 1 | 2π (6.28) | 360° |
| 1/2 | π (3.14) | 180° |
| 1/4 | π/2 (1.57) | 90° |
| 1/8 | π/4 (0.79) | 45° |

```
度 → ラジアン: 度 × 0.0174  (= 度 × π ÷ 180)
ラジアン → 度: ラジアン × 57.3  (= ラジアン × 180 ÷ π)
```

### 2.3. Swiftでのラジアン

Swiftの`cos()`と`sin()`は**ラジアンのみ**受け付ける。

```swift
cos(90)        // ❌ 90ラジアン = 5156°と解釈される
cos(.pi / 2)   // ✅ これが90°
```

## 3. iOS座標系

### 3.1. y軸が反転している

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/coordinates.svg" alt="数学座標系 vs iOS座標系" style="max-width: min(520px, 100%);">

数学ではyが上に増加するがiOSでは**yが下に**増加する。

### 3.2. 回転方向

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/rotation.svg" alt="回転方向: 数学(反時計回り) vs iOS(時計回り)" style="max-width: min(520px, 100%);">

y軸が反転しているため同じコードを実行しても**数学で反時計 = iOSで時計回り**になる。この特性のおかげで**-π/2(12時)から開始すると時計回りに自然に配置**される。

## 4. 円形配置の計算

### 4.1. 全体の流れ

```
一周(2π) ÷ 個数 = 一切れ
-π/2 + 順番 × 一切れ = 角度
cos(角度), sin(角度) = 比率
比率 × 半径 = 実際の距離
中心 + 実際の距離 = 最終座標
```

### 4.2. ステップ別計算 (8個のアイコン)

中心(200, 200)、半径120で8個のアイコンを12時から時計回りに配置する。

#### 4.2.1. 一周をラジアンで

```
2 × π = 2 × 3.14159 = 6.28318ラジアン
```

#### 4.2.2. 8等分

```
6.28318 ÷ 8 = 0.78540ラジアン (= 45°)
```

#### 4.2.3. 開始点を12時に

0°は3時方向(右)だ。12時に移すには1/4回転戻る。

```
6.28318 ÷ 4 = 1.5708
戻る(負の方向): -1.5708ラジアン (= -90°)
```

#### 4.2.4. 各アイコンの角度

公式: `-1.5708 + i × 0.78540`

```
i=0:  -1.5708 + 0 × 0.7854 = -1.5708  → -90°  (12時)
i=1:  -1.5708 + 1 × 0.7854 = -0.7854  → -45°  (1~2時)
i=2:  -1.5708 + 2 × 0.7854 =  0       →   0°  (3時)
i=3:  -1.5708 + 3 × 0.7854 =  0.7854  →  45°  (4~5時)
i=4:  -1.5708 + 4 × 0.7854 =  1.5708  →  90°  (6時)
i=5:  -1.5708 + 5 × 0.7854 =  2.3562  → 135°  (7~8時)
i=6:  -1.5708 + 6 × 0.7854 =  3.1416  → 180°  (9時)
i=7:  -1.5708 + 7 × 0.7854 =  3.9270  → 225°  (10~11時)
```

#### 4.2.5. cos/sin比率を求める

入力はラジアン、出力は-1から1の比率だ。

```
i=0:  cos(-1.5708)= 0.0000   sin(-1.5708)=-1.0000  (横なし, 上100%)
i=1:  cos(-0.7854)= 0.7071   sin(-0.7854)=-0.7071  (右70.7%, 上70.7%)
i=2:  cos(0)      = 1.0000   sin(0)      = 0.0000  (右100%, 縦なし)
i=3:  cos(0.7854) = 0.7071   sin(0.7854) = 0.7071  (右70.7%, 下70.7%)
i=4:  cos(1.5708) = 0.0000   sin(1.5708) = 1.0000  (横なし, 下100%)
i=5:  cos(2.3562) =-0.7071   sin(2.3562) = 0.7071  (左70.7%, 下70.7%)
i=6:  cos(3.1416) =-1.0000   sin(3.1416) = 0.0000  (左100%, 縦なし)
i=7:  cos(3.9270) =-0.7071   sin(3.9270) =-0.7071  (左70.7%, 上70.7%)
```

#### 4.2.6. 半径(120)を掛ける

比率に半径を掛けると実際の移動距離(pt)が出る。

```
i=0:  横  0.0000 × 120 =    0     縦 -1.0000 × 120 = -120
i=1:  横  0.7071 × 120 =   84.9   縦 -0.7071 × 120 =  -84.9
i=2:  横  1.0000 × 120 =  120     縦  0.0000 × 120 =    0
i=3:  横  0.7071 × 120 =   84.9   縦  0.7071 × 120 =   84.9
i=4:  横  0.0000 × 120 =    0     縦  1.0000 × 120 =  120
i=5:  横 -0.7071 × 120 =  -84.9   縦  0.7071 × 120 =   84.9
i=6:  横 -1.0000 × 120 = -120     縦  0.0000 × 120 =    0
i=7:  横 -0.7071 × 120 =  -84.9   縦 -0.7071 × 120 =  -84.9
```

#### 4.2.7. 中心座標(200, 200)を足す

```
i=0:  x = 200 +    0   = 200    y = 200 + (-120)  =  80    (12時)
i=1:  x = 200 +   84.9 = 284.9  y = 200 + (-84.9) = 115.1  (1~2時)
i=2:  x = 200 +  120   = 320    y = 200 +    0    = 200    (3時)
i=3:  x = 200 +   84.9 = 284.9  y = 200 +   84.9  = 284.9  (4~5時)
i=4:  x = 200 +    0   = 200    y = 200 +  120    = 320    (6時)
i=5:  x = 200 + (-84.9)= 115.1  y = 200 +   84.9  = 284.9  (7~8時)
i=6:  x = 200 + (-120) =  80    y = 200 +    0    = 200    (9時)
i=7:  x = 200 + (-84.9)= 115.1  y = 200 + (-84.9) = 115.1  (10~11時)
```

結果を視覚化すると以下のようになる。

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/placement.svg" alt="8個のアイコン円形配置結果" style="max-width: min(440px, 100%);">

## 5. atan2

cosとsinは角度を入れると座標が出た。`atan2`は逆だ。座標を入れると角度が出る。

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/atan2.svg" alt="atan2: 座標から角度を求める逆関数" style="max-width: min(400px, 100%);">

```
cos(角度) → x比率      角度 → 座標
sin(角度) → y比率      角度 → 座標
atan2(y, x) → 角度     座標 → 角度
```

`atan2(y, x)`は原点`(0, 0)`から(x, y)方向までの角度をラジアンで返す。

- 返り値の範囲: **-π ~ π** (-180° ~ 180°)
- 3時 = 0、6時 = π/2、9時 = ±π、12時 = -π/2

円形メニューの中心は原点ではなく画面中心(例: `(200, 300)`)だ。`atan2`にタッチ座標をそのまま渡すと原点基準の角度になるのでタッチ座標から中心を引いて中心基準の座標に変換する必要がある。

```
画面中心 = (200, 300)、タッチ = (296, 234)
中心基準座標 = (296 - 200, 234 - 300) = (96, -66)
atan2(-66, 96) → 中心からタッチ方向の角度
```

```swift
let center = CGPoint(x: view.bounds.midX, y: view.bounds.midY)
let angle = atan2(point.y - center.y, point.x - center.x)
```

## 6. パンジェスチャーで回転

配置したメニューをドラッグで回転させるにはタッチ地点の**角度変化**を追跡する必要がある。

### 6.1. 回転量の計算

#### 6.1.1. タッチ開始 (began)

```swift
panStartAngle = angle(for: touchPoint) - currentRotation
```

タッチ地点の角度から現在の回転量を引いて**オフセット**を記録する。このオフセットはタッチ地点とメニューの回転状態の差だ。

```
タッチ角度 = 0.5 rad、現在の回転 = 0.3 rad
オフセット = 0.5 - 0.3 = 0.2 rad
```

オフセットを記録する理由はメニューが既に回転した状態でタッチしてもメニューがジャンプせず滑らかに続くようにするためだ。

#### 6.1.2. タッチ移動 (changed)

```swift
currentRotation = angle(for: touchPoint) - panStartAngle
```

新しいタッチ角度からオフセットを引くと新しい回転量が出る。

```
タッチが0.5 → 1.2に移動
新しい回転 = 1.2 - 0.2(オフセット) = 1.0 rad
回転変化 = 1.0 - 0.3(以前) = 0.7 rad分回転
```

#### 6.1.3. 角速度の記録

```swift
angularVelocity = newRotation - previousAngle
previousAngle = newRotation
```

フレーム間の回転変化量を**角速度**として記録する。タッチを離した時この値が減速アニメーションの初速になる。

### 6.2. 減速アニメーション

タッチを離すと急に止まる代わりに慣性のようにゆっくり減速する。

#### 6.2.1. CADisplayLink

`CADisplayLink`はディスプレイのリフレッシュレートに同期し、毎フレーム呼ばれるタイマーだ。

```swift
displayLink = CADisplayLink(target: self, selector: #selector(step))
displayLink?.add(to: .main, forMode: .common)
```

#### 6.2.2. フレームごとの処理

```swift
let dt = link.timestamp - lastTimestamp         // 前フレームとの時間差(秒)
angularVelocity *= pow(0.92, CGFloat(dt * 60))  // 減衰
currentRotation += angularVelocity              // 回転適用
layoutMenuItems()                               // 再配置
```

- **dt**: 前フレームとの時間差(秒)。60fpsなら約0.0167秒、フレームドロップが発生するとより大きくなる。
- **0.92**: 減衰係数。毎フレーム速度が8%ずつ減少する。
- **pow(a, b)**: aのb乗。`pow(0.92, 3)` = 0.92³ ≈ 0.779。
- **pow(0.92, dt × 60)**: フレームレートに関係なく一定の減速を保証する。dtが1/60秒(1フレーム)なら0.92¹ = 0.92、dtが1/30秒(フレームドロップ)なら0.92² ≈ 0.846になる。
- 角速度が0.0001未満になるとタイマーを停止する。

#### 6.2.3. 減衰係数による感触

<img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/deceleration.svg" alt="減衰係数別角速度減少グラフ" style="max-width: min(440px, 100%);">

| 係数 | フレームごとの減少 | 感触 |
|---|---|---|
| 0.98 | 2% | 長く滑る (氷上) |
| 0.95 | 5% | 滑らかな減速 |
| 0.92 | 8% | 適度な減速 |
| 0.85 | 15% | 素早い停止 |

## 7. Swift実装

### 7.1. 均等配置

```swift
let count = 8
let slice = (2 * .pi) / CGFloat(count)  // 一周(2π) ÷ 8 = 45°ずつ

for i in 0..<count {
    let angle = -(.pi / 2) + CGFloat(i) * slice
    //          ↑ 12時から   ↑ 何番目     ↑ 一切れの大きさ

    let x = centerX + radius * cos(angle)  // cos = 横
    let y = centerY + radius * sin(angle)  // sin = 縦
}
```

### 7.2. 不均等配置

間隔が均一でない配置は角度を直接指定する。

```swift
// 各アイコンの角度を手動指定 (ラジアン)
let itemAngles: [CGFloat] = [
    -.pi / 2,            // 12時
    -.pi / 4,            // 1~2時
    0,                   // 3時
    .pi / 4,             // 4~5時
    .pi / 2,             // 6時
    .pi * 3 / 4,         // 7~8時
    .pi,                 // 9時
    .pi + .pi / 4        // 10~11時
]

for (i, angle) in itemAngles.enumerated() {
    let x = centerX + radius * cos(angle)
    let y = centerY + radius * sin(angle)
}
```

### 7.3. パンジェスチャー回転

配置に回転を適用するには各アイコンの角度に`currentRotation`を加える。

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

角度変換は5章、パンジェスチャーと減速アニメーションは6章で扱った。

実際にUIKitアプリで実装すると以下のようになる。

<div style="display: flex; gap: 12px; align-items: center;">
  <div style="flex: 0 0 auto; width: min(200px, 45%);">
    <img src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/demo.png" alt="UIKit円形メニュー実装結果" style="width: 100%;">
  </div>
  <div style="flex: 0 0 auto; width: min(200px, 45%);">
    <video autoplay loop muted playsinline style="width: 100%;">
      <source src="/assets/image/post/development/apple/ios/ios-circular-menu-trigonometry/demo.mp4" type="video/mp4">
    </video>
  </div>
</div>

# 参考

- <https://developer.apple.com/documentation/coregraphics/cgfloat>
- <https://developer.apple.com/documentation/quartzcore/cadisplaylink>
- <https://en.wikipedia.org/wiki/Radian>
- <https://en.wikipedia.org/wiki/Unit_circle>
