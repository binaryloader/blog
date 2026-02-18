---
title: "[iOS] Core ML Tools로 머신러닝 모델을 iOS 앱에 통합하기"
ref: core-ml-model-conversion
excerpt: "Core ML Tools를 활용하여 PyTorch 모델을 Core ML 형식으로 변환하고 iOS 앱에 통합하는 방법을 정리한다."
date: 2026-02-18T15:00+09:00
last_modified_at: 2026-02-18T15:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/core-ml-model-conversion.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/core-ml-model-conversion.png"
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
    url: /ko/development/
  - title: "Apple"
    url: /ko/development/apple/
  - title: "iOS"
    url: /ko/development/apple/ios/
---

# 개요

Core ML Tools를 활용하여 PyTorch 모델을 Core ML 형식으로 변환하고 iOS 앱에 통합하는 방법을 정리한다.

# 정리

## 1. Core ML이란

Core ML은 Apple의 온디바이스 머신러닝 프레임워크다. 학습된 모델을 iPhone, iPad, Mac 등 Apple 기기에서 직접 실행할 수 있게 해준다.

온디바이스 추론의 핵심 장점은 다음과 같다.

- **프라이버시** — 데이터가 기기를 떠나지 않으므로 서버로 전송할 필요가 없다
- **속도** — 네트워크 지연 없이 Neural Engine, GPU, CPU를 직접 활용한다
- **오프라인 동작** — 인터넷 연결 없이도 추론이 가능하다
- **비용 절감** — 서버 인프라 없이 모델을 실행할 수 있다

Core ML은 하드웨어 가속을 자동으로 관리한다. Apple Neural Engine이 있는 기기에서는 Neural Engine을, 없으면 GPU나 CPU로 자동 전환한다. 개발자가 하드웨어별 최적화를 직접 처리할 필요가 없다.

## 2. Core ML 생태계

Apple은 Core ML 위에 도메인별 상위 프레임워크를 제공한다.

- **Vision** — 이미지 분류, 객체 감지, 얼굴 인식, 텍스트 인식
- **Natural Language** — 텍스트 분류, 감정 분석, 언어 감지, 토큰화
- **Speech** — 음성 인식, 음성-텍스트 변환
- **Sound Analysis** — 소리 분류, 환경음 인식
- **Create ML** — Xcode 내에서 직접 모델을 학습할 수 있는 도구

이 프레임워크들은 내부적으로 Core ML을 사용하지만 더 높은 수준의 API를 제공한다. 예를 들어 Vision의 `VNClassifyImageRequest`를 사용하면 이미지 분류를 몇 줄의 코드로 구현할 수 있다.

직접 학습한 커스텀 모델을 사용하려면 Core ML 형식(`.mlmodel` 또는 `.mlpackage`)으로 변환해야 한다. 여기서 Core ML Tools가 필요하다.

## 3. Core ML Tools로 모델 변환

Core ML Tools(`coremltools`)는 Apple이 제공하는 Python 라이브러리로 PyTorch, TensorFlow 등의 모델을 Core ML 형식으로 변환한다. 이 글에서는 PyTorch의 MobileNetV2 이미지 분류 모델을 예제로 사용한다.

### 3.1. Core ML Tools 설치

```bash
pip install coremltools
pip install torch torchvision
```

Python 3.8 이상이 필요하며 Core ML Tools 8.x 기준으로 설명한다.

### 3.2. PyTorch 모델 변환

```python
import torch
import torchvision
import coremltools as ct

# 1. 사전 학습된 MobileNetV2 로드
model = torchvision.models.mobilenet_v2(
    weights=torchvision.models.MobileNet_V2_Weights.DEFAULT
)
model.eval()

# 2. 예제 입력 생성 (배치 1, RGB 3채널, 224x224)
example_input = torch.rand(1, 3, 224, 224)

# 3. TorchScript로 트레이싱
traced_model = torch.jit.trace(model, example_input)

# 4. Core ML 모델로 변환
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

# 5. 저장
mlmodel.save("MobileNetV2.mlpackage")
```

변환 과정을 단계별로 살펴보면 다음과 같다.

- `model.eval()` — 모델을 추론 모드로 전환한다. Dropout이나 BatchNorm이 학습 모드로 동작하는 것을 방지한다
- `torch.jit.trace` — 예제 입력을 모델에 통과시켜 연산 그래프를 기록한다. coremltools는 이 TorchScript 형식을 입력으로 받는다
- `ct.ImageType` — 입력이 이미지임을 명시한다. `scale=1/255.0`으로 0~255 픽셀값을 0~1 범위로 정규화한다
- `minimum_deployment_target` — 최소 배포 대상을 지정한다. iOS 16 이상으로 설정하면 최신 최적화가 적용된다

### 3.3. 모델 메타데이터 설정

```python
mlmodel.author = "CoreMLDemo"
mlmodel.short_description = "MobileNetV2 이미지 분류 모델 (ImageNet 1000 클래스)"
mlmodel.version = "1.0"

# 입출력 설명
spec = mlmodel.get_spec()
input_desc = spec.description.input[0]
input_desc.shortDescription = "224x224 RGB 이미지"

output_desc = spec.description.output[0]
output_desc.shortDescription = "ImageNet 1000 클래스 분류 확률"

mlmodel.save("MobileNetV2.mlpackage")
```

메타데이터를 설정하면 Xcode에서 모델을 열었을 때 설명이 표시된다. 팀 협업이나 모델 관리에 유용하다.

## 4. Xcode에서 모델 통합

### 4.1. 프로젝트에 모델 추가

변환된 `.mlpackage` 파일을 Xcode 프로젝트에 드래그 앤 드롭하면 된다. Xcode는 모델을 자동으로 컴파일하고 Swift 클래스를 생성한다.

Xcode에서 모델 파일을 선택하면 다음 정보를 확인할 수 있다.

- **General** — 모델 타입, 크기, 작성자, 설명
- **Preview** — 이미지를 드래그하여 추론 결과를 미리 확인
- **Predictions** — 입출력 사양 (타입, 크기, 설명)
- **Utilities** — 모델의 Neural Network 구조

### 4.2. 자동 생성된 Swift 클래스

Xcode는 `.mlpackage`를 추가하면 모델 이름과 동일한 Swift 클래스를 자동 생성한다. `MobileNetV2.mlpackage`를 추가하면 `MobileNetV2`, `MobileNetV2Input`, `MobileNetV2Output` 클래스가 생성된다.

자동 생성된 클래스의 구조는 다음과 같다.

```swift
// Xcode가 자동 생성 (직접 수정하지 않는다)
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

### 4.3. 예측 코드 작성

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

Vision 프레임워크의 `VNCoreMLRequest`를 사용하면 이미지 전처리(리사이즈, 크롭, 정규화)를 자동으로 처리한다. Core ML 모델을 직접 호출하는 것보다 권장되는 방식이다.

## 5. 모델 최적화

앱에 모델을 포함하면 앱 크기가 증가한다. coremltools는 모델 크기를 줄이는 최적화 옵션을 제공한다.

**Float16 변환**

```python
import coremltools.optimize as cto

mlmodel_fp16 = cto.coreml.linear_quantize_weights(
    mlmodel,
    dtype="float16"
)
mlmodel_fp16.save("MobileNetV2_fp16.mlpackage")
```

Float32에서 Float16으로 변환하면 모델 크기가 약 절반으로 줄어들며 대부분의 경우 정확도 손실이 거의 없다. Neural Engine은 Float16을 네이티브로 지원하므로 추론 속도도 향상될 수 있다.

**Palettization (팔레트 양자화)**

```python
config = cto.coreml.OptimizationConfig(
    global_config=cto.coreml.OpPalettizerConfig(nbits=8)
)
mlmodel_palettized = cto.coreml.palettize_weights(mlmodel, config)
mlmodel_palettized.save("MobileNetV2_8bit.mlpackage")
```

팔레트 양자화는 가중치 값을 제한된 수의 대표값으로 매핑한다. 8비트 팔레트를 사용하면 모델 크기가 약 1/4로 줄어든다.

| 방식 | 크기 감소 | 정확도 영향 |
|---|---|---|
| Float16 | ~50% | 거의 없음 |
| 8bit Palettization | ~75% | 경미 |
| 4bit Palettization | ~87% | 모델에 따라 다름 |

## 6. 주의사항

- **iOS 최소 버전** — `.mlpackage` 형식은 iOS 15 이상에서 지원된다. iOS 14 이하를 지원해야 하면 `.mlmodel` 형식을 사용한다
- **모델 크기** — App Store는 앱 크기 제한이 있으므로 큰 모델은 On-Demand Resources나 Background Assets로 분리하는 것을 고려한다
- **Neural Engine 지원** — A11 Bionic (iPhone 8/X) 이상에서 Neural Engine을 사용할 수 있다. 이전 기기에서는 GPU/CPU로 폴백된다
- **동적 입력 크기** — `ct.RangeDim`으로 가변 크기 입력을 지원할 수 있지만 고정 크기 대비 성능이 떨어질 수 있다
- **모델 업데이트** — iOS 17 이상에서는 `MLModelCollection`을 통해 앱 업데이트 없이 모델을 교체할 수 있다

# 참고

- <https://developer.apple.com/documentation/coreml>
- <https://coremltools.readme.io/docs>
- <https://developer.apple.com/machine-learning/models/>
