---
title: "[iOS] Core ML Tools で機械学習モデルを iOS アプリに統合する"
ref: core-ml-model-conversion
lang: ja
permalink: /ja/:categories/:title/
excerpt: "Core ML Tools を活用して PyTorch モデルを Core ML 形式に変換し、iOS アプリに統合する方法をまとめる。"
date: 2026-02-18T15:00+09:00
last_modified_at: 2026-02-18T15:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/core-ml-model-conversion.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/core-ml-model-conversion.png"
categories:
  - Development
  - Apple
  - iOS
tags:
  - iOS
  - Swift
  - Core ML
  - coremltools
  - Machine Learning
  - PyTorch
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Apple"
    url: /ja/development/apple/
  - title: "iOS"
    url: /ja/development/apple/ios/
---

# 概要

Core ML Tools を活用して PyTorch モデルを Core ML 形式に変換し、iOS アプリに統合する方法をまとめる。

# 手順

## 1. Core ML とは

Core ML は Apple のオンデバイス機械学習フレームワークである。学習済みモデルを iPhone、iPad、Mac などの Apple デバイスで直接実行できるようにする。

オンデバイス推論の主な利点は以下のとおりである。

- **プライバシー** — データがデバイスから外に出ないため、サーバーに送信する必要がない
- **速度** — ネットワーク遅延なしで Neural Engine、GPU、CPU を直接活用する
- **オフライン動作** — インターネット接続なしでも推論が可能である
- **コスト削減** — サーバーインフラなしでモデルを実行できる

Core ML はハードウェアアクセラレーションを自動的に管理する。Apple Neural Engine を搭載したデバイスでは Neural Engine を、搭載していない場合は GPU や CPU に自動で切り替える。開発者がハードウェアごとの最適化を手動で行う必要はない。

## 2. Core ML エコシステム

Apple は Core ML の上にドメイン別の上位フレームワークを提供している。

- **Vision** — 画像分類、オブジェクト検出、顔認識、テキスト認識
- **Natural Language** — テキスト分類、感情分析、言語検出、トークン化
- **Speech** — 音声認識、音声テキスト変換
- **Sound Analysis** — 音声分類、環境音認識
- **Create ML** — Xcode 内で直接モデルを学習できるツール

これらのフレームワークは内部的に Core ML を使用しているが、より高レベルな API を提供する。例えば、Vision の `VNClassifyImageRequest` を使えば、画像分類を数行のコードで実装できる。

独自に学習したカスタムモデルを使用するには、Core ML 形式（`.mlmodel` または `.mlpackage`）に変換する必要がある。ここで Core ML Tools が必要になる。

## 3. Core ML Tools でモデル変換

Core ML Tools（`coremltools`）は Apple が提供する Python ライブラリで、PyTorch や TensorFlow などのモデルを Core ML 形式に変換する。この記事では PyTorch の MobileNetV2 画像分類モデルを例として使用する。

### 3.1. Core ML Tools のインストール

```bash
pip install coremltools
pip install torch torchvision
```

Python 3.8 以上が必要である。Core ML Tools 8.x を基準に説明する。

### 3.2. PyTorch モデルの変換

```python
import torch
import torchvision
import coremltools as ct

# 1. 事前学習済み MobileNetV2 をロード
model = torchvision.models.mobilenet_v2(
    weights=torchvision.models.MobileNet_V2_Weights.DEFAULT
)
model.eval()

# 2. サンプル入力を作成（バッチ 1、RGB 3チャネル、224x224）
example_input = torch.rand(1, 3, 224, 224)

# 3. TorchScript でトレース
traced_model = torch.jit.trace(model, example_input)

# 4. Core ML モデルに変換
mlmodel = ct.convert(
    traced_model,
    inputs=[
        ct.ImageType(
            name="image",
            shape=(1, 3, 224, 224),
            scale=1 / 255.0
        )
    ],
    minimum_deployment_target=ct.target.iOS16,
)

# 5. 保存
mlmodel.save("MobileNetV2.mlpackage")
```

変換プロセスをステップごとに見ていく。

- `model.eval()` — モデルを推論モードに切り替える。Dropout や BatchNorm がトレーニングモードで動作するのを防ぐ
- `torch.jit.trace` — サンプル入力をモデルに通して演算グラフを記録する。coremltools はこの TorchScript 形式を入力として受け取る
- `ct.ImageType` — 入力が画像であることを明示する。`scale=1/255.0` で 0〜255 のピクセル値を 0〜1 の範囲に正規化する
- `minimum_deployment_target` — 最小デプロイターゲットを指定する。iOS 16 以上に設定すると最新の最適化が適用される

### 3.3. モデルメタデータの設定

```python
mlmodel.author = "CoreMLDemo"
mlmodel.short_description = "MobileNetV2 画像分類モデル（ImageNet 1000 クラス）"
mlmodel.version = "1.0"

# 入出力の説明
spec = mlmodel.get_spec()
input_desc = spec.description.input[0]
input_desc.shortDescription = "224x224 RGB 画像"

output_desc = spec.description.output[0]
output_desc.shortDescription = "ImageNet 1000 クラスの分類確率"

mlmodel.save("MobileNetV2.mlpackage")
```

メタデータを設定すると、Xcode でモデルを開いた際に説明が表示される。チーム協業やモデル管理に有用である。

## 4. Xcode でモデルを統合

### 4.1. プロジェクトにモデルを追加

変換した `.mlpackage` ファイルを Xcode プロジェクトにドラッグ＆ドロップするだけでよい。Xcode はモデルを自動的にコンパイルし、Swift クラスを生成する。

Xcode でモデルファイルを選択すると、以下の情報を確認できる。

- **General** — モデルタイプ、サイズ、作成者、説明
- **Preview** — 画像をドラッグして推論結果をプレビュー
- **Predictions** — 入出力仕様（タイプ、サイズ、説明）
- **Utilities** — モデルの Neural Network 構造

### 4.2. 自動生成される Swift クラス

`.mlpackage` を追加すると、Xcode はモデル名と同じ Swift クラスを自動生成する。`MobileNetV2.mlpackage` を追加すると `MobileNetV2`、`MobileNetV2Input`、`MobileNetV2Output` クラスが生成される。

自動生成されるクラスの構造は以下のとおりである。

```swift
// Xcode が自動生成（直接修正しない）
class MobileNetV2 {
    let model: MLModel
    func prediction(input: MobileNetV2Input) throws -> MobileNetV2Output
}

class MobileNetV2Input: MLFeatureProvider {
    var image: CVPixelBuffer
}

class MobileNetV2Output: MLFeatureProvider {
    let classLabel: String
    let classLabelProbs: [String: Double]
}
```

### 4.3. 予測コードの作成

```swift
public func classify(_ cgImage: CGImage) {
    guard let vnModel else {
        errorMessage = "Model not loaded"
        return
    }

    isClassifying = true
    results = []
    errorMessage = nil

    let request = VNCoreMLRequest(model: vnModel) { [weak self] request, error in
        Task { @MainActor in
            self?.handleResults(
                request: request,
                error: error
            )
        }
    }

    request.imageCropAndScaleOption = .centerCrop

    let handler = VNImageRequestHandler(cgImage: cgImage)

    do {
        try handler.perform([request])
    } catch {
        isClassifying = false
        errorMessage = "Classification failed: \(error.localizedDescription)"
    }
}
```

Vision フレームワークの `VNCoreMLRequest` を使うと、画像の前処理（リサイズ、クロップ、正規化）が自動的に処理される。Core ML モデルを直接呼び出すよりも推奨される方法である。

## 5. モデルの最適化

アプリにモデルを含めるとアプリサイズが増加する。coremltools はモデルサイズを削減する最適化オプションを提供している。

**Float16 変換**

```python
import coremltools.optimize as cto

mlmodel_fp16 = cto.coreml.linear_quantize_weights(
    mlmodel,
    dtype="float16"
)
mlmodel_fp16.save("MobileNetV2_fp16.mlpackage")
```

Float32 から Float16 への変換でモデルサイズが約半分に減少し、ほとんどの場合精度の低下はほぼない。Neural Engine は Float16 をネイティブでサポートしているため、推論速度も向上する可能性がある。

**パレタイゼーション（パレット量子化）**

```python
config = cto.coreml.OptimizationConfig(
    global_config=cto.coreml.OpPalettizerConfig(nbits=8)
)
mlmodel_palettized = cto.coreml.palettize_weights(mlmodel, config)
mlmodel_palettized.save("MobileNetV2_8bit.mlpackage")
```

パレット量子化は重みの値を限られた数の代表値にマッピングする。8ビットパレットを使用するとモデルサイズが約 1/4 に削減される。

| 方式 | サイズ削減 | 精度への影響 |
|---|---|---|
| Float16 | 約 50% | ほぼなし |
| 8bit Palettization | 約 75% | 軽微 |
| 4bit Palettization | 約 87% | モデルによる |

## 6. 注意事項

- **iOS 最小バージョン** — `.mlpackage` 形式は iOS 15 以上でサポートされる。iOS 14 以下をサポートする必要がある場合は `.mlmodel` 形式を使用する
- **モデルサイズ** — App Store にはアプリサイズの制限があるため、大きなモデルは On-Demand Resources や Background Assets で分離することを検討する
- **Neural Engine サポート** — A11 Bionic（iPhone 8/X）以降で Neural Engine が利用可能である。それ以前のデバイスでは GPU/CPU にフォールバックする
- **動的入力サイズ** — `ct.RangeDim` で可変サイズ入力をサポートできるが、固定サイズと比較してパフォーマンスが低下する場合がある
- **モデルの更新** — iOS 17 以降では `MLModelCollection` を通じてアプリのアップデートなしでモデルを差し替えることができる

# 参考

- <https://developer.apple.com/documentation/coreml>
- <https://coremltools.readme.io/docs>
- <https://developer.apple.com/machine-learning/models/>
