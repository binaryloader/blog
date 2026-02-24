---
title: "[iOS] Integrating Machine Learning Models into iOS Apps with Core ML Tools"
ref: core-ml-model-conversion
lang: en
permalink: /en/:categories/:title/
excerpt: "How to convert a PyTorch model to Core ML format using Core ML Tools and integrate it into an iOS app."
date: 2026-02-18T15:00+09:00
last_modified_at: 2026-02-18T15:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/core-ml-model-conversion.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/core-ml-model-conversion.png"
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
    url: /en/development/
  - title: "Apple"
    url: /en/development/apple/
  - title: "iOS"
    url: /en/development/apple/ios/
---

# Overview

How to convert a PyTorch model to Core ML format using Core ML Tools and integrate it into an iOS app.

# Steps

## 1. What is Core ML

Core ML is Apple's on-device machine learning framework. It enables running trained models directly on Apple devices such as iPhone, iPad, and Mac.

The key advantages of on-device inference are as follows.

- **Privacy** — Data never leaves the device, eliminating the need to send it to a server
- **Speed** — Leverages the Neural Engine, GPU, and CPU directly without network latency
- **Offline Operation** — Inference works without an internet connection
- **Cost Reduction** — Models run without server infrastructure

Core ML automatically manages hardware acceleration. On devices with an Apple Neural Engine, it uses the Neural Engine; otherwise, it falls back to GPU or CPU. Developers don't need to handle hardware-specific optimizations manually.

## 2. The Core ML Ecosystem

Apple provides domain-specific frameworks on top of Core ML.

- **Vision** — Image classification, object detection, face recognition, text recognition
- **Natural Language** — Text classification, sentiment analysis, language detection, tokenization
- **Speech** — Speech recognition, speech-to-text conversion
- **Sound Analysis** — Sound classification, environmental sound recognition
- **Create ML** — A tool for training models directly within Xcode

These frameworks use Core ML internally but provide higher-level APIs. For example, using Vision's `VNClassifyImageRequest`, you can implement image classification in just a few lines of code.

To use custom trained models, they must be converted to Core ML format (`.mlmodel` or `.mlpackage`). This is where Core ML Tools comes in.

## 3. Converting Models with Core ML Tools

Core ML Tools (`coremltools`) is a Python library provided by Apple that converts models from PyTorch, TensorFlow, and other frameworks to Core ML format. This guide uses PyTorch's MobileNetV2 image classification model as an example.

### 3.1. Installing Core ML Tools

```bash
pip install coremltools
pip install torch torchvision
```

Python 3.8 or later is required. This guide is based on Core ML Tools 8.x.

### 3.2. Converting a PyTorch Model

```python
import torch
import torchvision
import coremltools as ct

# 1. Load pre-trained MobileNetV2
base_model = torchvision.models.mobilenet_v2(
    weights=torchvision.models.MobileNet_V2_Weights.DEFAULT
)

# 2. Add normalization + softmax wrapper
class ModelWithSoftmax(torch.nn.Module):

    def __init__(self, base):
        super().__init__()
        self.base = base
        self.register_buffer(
            "mean",
            torch.tensor([0.485, 0.456, 0.406]).reshape(1, 3, 1, 1)
        )
        self.register_buffer(
            "std",
            torch.tensor([0.229, 0.224, 0.225]).reshape(1, 3, 1, 1)
        )

    def forward(self, x):
        x = (x - self.mean) / self.std
        return torch.nn.functional.softmax(self.base(x), dim=1)

model = ModelWithSoftmax(base_model)
model.eval()

# 3. Create example input (batch 1, RGB 3 channels, 224x224)
example_input = torch.rand(1, 3, 224, 224)

# 4. Trace with TorchScript
traced_model = torch.jit.trace(model, example_input)

# 5. Convert to Core ML model
labels = torchvision.models.MobileNet_V2_Weights.DEFAULT.meta["categories"]
mlmodel = ct.convert(
    traced_model,
    inputs=[
        ct.ImageType(
            name="image",
            shape=(1, 3, 224, 224),
            scale=1 / 255.0
        )
    ],
    classifier_config=ct.ClassifierConfig(labels),
    minimum_deployment_target=ct.target.iOS16,
)

# 6. Save
mlmodel.save("MobileNetV2.mlpackage")
```

Here's a step-by-step breakdown of the conversion process.

- `ModelWithSoftmax` — Applies ImageNet normalization (mean/std) and converts raw logits into probabilities in the 0–1 range using softmax
- `model.eval()` — Switches the model to inference mode. This prevents Dropout and BatchNorm from operating in training mode
- `torch.jit.trace` — Records the computation graph by passing example input through the model. coremltools accepts this TorchScript format as input
- `ct.ImageType` — Specifies that the input is an image. `scale=1/255.0` normalizes pixel values from 0–255 to the 0–1 range
- `ct.ClassifierConfig` — Maps model outputs to class labels. The 1000 ImageNet class names are retrieved from torchvision
- `minimum_deployment_target` — Sets the minimum deployment target. Setting it to iOS 16 or later enables the latest optimizations

### 3.3. Setting Model Metadata

```python
mlmodel.author = "CoreMLDemo"
mlmodel.short_description = "MobileNetV2 image classification model (ImageNet 1000 classes)"
mlmodel.version = "1.0"

# Input/output descriptions
spec = mlmodel.get_spec()
input_desc = spec.description.input[0]
input_desc.shortDescription = "224x224 RGB image"

output_desc = spec.description.output[0]
output_desc.shortDescription = "Classification probabilities for ImageNet 1000 classes"

mlmodel.save("MobileNetV2.mlpackage")
```

Setting metadata makes descriptions visible when opening the model in Xcode. This is useful for team collaboration and model management.

## 4. Integrating the Model in Xcode

### 4.1. Adding the Model to a Project

Simply drag and drop the converted `.mlpackage` file into your Xcode project. Xcode will automatically compile the model and generate Swift classes.

When you select the model file in Xcode, you can inspect the following information.

- **General** — Model type, size, author, description
- **Preview** — Drag an image to preview inference results
- **Predictions** — Input/output specifications (type, size, description)
- **Utilities** — The model's Neural Network structure

### 4.2. Auto-Generated Swift Classes

When you add a `.mlpackage`, Xcode automatically generates Swift classes named after the model. Adding `MobileNetV2.mlpackage` creates `MobileNetV2`, `MobileNetV2Input`, and `MobileNetV2Output` classes.

The structure of the auto-generated classes looks like this.

```swift
// Auto-generated by Xcode (do not modify directly)
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

### 4.3. Writing Prediction Code

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

Using Vision framework's `VNCoreMLRequest` automatically handles image preprocessing (resize, crop, normalization). This is the recommended approach over calling the Core ML model directly.

## 5. Model Optimization

Including a model in your app increases the app size. coremltools provides optimization options to reduce model size.

**Float16 Conversion**

```python
import coremltools.optimize as cto

mlmodel_fp16 = cto.coreml.linear_quantize_weights(
    mlmodel,
    dtype="float16"
)
mlmodel_fp16.save("MobileNetV2_fp16.mlpackage")
```

Converting from Float32 to Float16 reduces model size by roughly half with negligible accuracy loss in most cases. Since the Neural Engine natively supports Float16, inference speed may also improve.

**Palettization**

```python
config = cto.coreml.OptimizationConfig(
    global_config=cto.coreml.OpPalettizerConfig(nbits=8)
)
mlmodel_palettized = cto.coreml.palettize_weights(mlmodel, config)
mlmodel_palettized.save("MobileNetV2_8bit.mlpackage")
```

Palettization maps weight values to a limited set of representative values. Using an 8-bit palette reduces model size by approximately 75%.

| Method | Size Reduction | Accuracy Impact |
|---|---|---|
| Float16 | ~50% | Negligible |
| 8bit Palettization | ~75% | Minor |
| 4bit Palettization | ~87% | Model-dependent |

## 6. Considerations

- **Minimum iOS Version** — The `.mlpackage` format is supported on iOS 15 and later. Use the `.mlmodel` format if you need to support iOS 14 or earlier
- **Model Size** — The App Store has app size limits, so consider separating large models using On-Demand Resources or Background Assets
- **Neural Engine Support** — Neural Engine is available on A11 Bionic (iPhone 8/X) and later. Earlier devices fall back to GPU/CPU
- **Dynamic Input Size** — Variable-size inputs can be supported using `ct.RangeDim`, but performance may be lower compared to fixed sizes
- **Model Updates** — On iOS 17 and later, `MLModelCollection` allows replacing models without an app update

# References

- <https://coremltools.readme.io/docs>
- <https://developer.apple.com/documentation/coreml>
- <https://developer.apple.com/machine-learning/models/>
