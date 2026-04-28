---
title: "[LLM] Setting Up a Local LLM Environment on Apple Silicon with MLX"
ref: local-agent-on-mlx
excerpt: "Setting up a local LLM environment with MLX and Qwen 3.6 on a MacBook Pro M5 Pro and laying the groundwork for studying agent frameworks."
date: 2026-04-25T15:00+09:00
last_modified_at: 2026-04-25T15:00+09:00
published: true
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/local-agent-on-mlx.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/local-agent-on-mlx.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - MLX
  - Qwen
  - Apple-Silicon
  - Agent
  - LLM
  - Tool-Calling
  - Quantization
depth:
  - title: "Development"
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "LLM"
    url: /en/development/ai/llm/
---

# Overview

Setting up a local LLM environment with MLX and Qwen 3.6 on a MacBook Pro M5 Pro and laying the groundwork for studying agent frameworks.

# Steps

## 1. Learning Goals and Environment

The learning goals are below.

- Implement an agent framework from scratch (ReAct, Reflection, Plan-and-Execute)
- Understand the raw tool calling format and write a parser
- Compare behavioral differences between Dense and MoE models
- Observe reasoning patterns using Qwen's `<think>` blocks

The environment is summarized below.

- MacBook Pro M5 Pro
- 48GB unified memory
- macOS 26.4.1
- mlx-lm v0.31.3 (isolated install via uv tool)

The key decisions are summarized below.

- The main model is `unsloth/Qwen3.6-27B-UD-MLX-6bit` (Dense, about 22GB)
- The sub model is `unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit` (MoE, about 19GB)
- Start with the built-in `mlx_lm.server`, then verify with `mlx-openai-server` later in the learning cycle
- 6bit is the default quantization. 8bit lacks memory margin and 4bit risks noise

## 2. Hardware and Unified Memory Analysis

The primary constraint for choosing a local LLM model is unified memory. You must accurately estimate available memory and verify that model weights plus KV cache fit within it.

### 2.1. System Specs

- Model Identifier: Mac17,8 (MacBook Pro)
- Chip: Apple M5 Pro
- CPU: 18 cores (6 efficiency + 12 performance)
- GPU: 20 cores
- Unified memory: 48GB
- Disk free: about 790GB
- macOS: 26.4.1

### 2.2. What Unified Memory Means

Apple Silicon shares the same RAM between CPU and GPU. Unlike NVIDIA setups, you do not need to manage system RAM and VRAM separately. MLX leverages this structure to load quantized weights from disk straight into memory. As a result, the disk download size and the in-memory weight size are identical.

### 2.3. Memory Budget (48GB Allocation)

- macOS + system background: about 10-12GB
- Work environment such as IDE (Cursor / VSCode), browser, Claude Code: about 8-10GB
- Available for model weights + KV cache: about 26-30GB

### 2.4. KV Cache Estimates

| Context | 27B Dense | 35B-A3B (MoE) |
|---------|-----------|---------------|
| 8K | +2-3GB | +1-2GB |
| 16K | +4-6GB | +3-4GB |
| 32K | +8-10GB | +5-6GB |
| 64K | +15-18GB | +10-12GB |

### 2.5. Conclusion

Model weights should stay at or below 20-22GB so that multi-turn agents (8K-32K context) can hold their KV cache stably. 8bit quantization at 28GB or more risks triggering swap and is not recommended during the learning phase.

## 3. Installing MLX (mlx-lm + uv tool)

Isolate the MLX environment from the system Python and expose the CLI globally.

### 3.1. Difference Between MLX and mlx-lm

The relationship is similar to that of PyTorch and Hugging Face transformers.

MLX has the following characteristics.

- A low-level ML framework built directly by Apple (released December 2023)
- Provides tensor operations, automatic differentiation, and Metal GPU acceleration
- Sits at the same layer as PyTorch / JAX
- Used when training models or implementing new architectures

mlx-lm has the following characteristics.

- An LLM-focused library built on top of MLX
- Includes tools for model download, quantization, inference, and serving
- Sits at the same layer as transformers / vLLM
- Used to run already-trained LLMs

Running `uv tool install mlx-lm` automatically pulls in mlx as a dependency.

### 3.2. Installation

`uv tool install` is conceptually similar to pipx. It installs CLI tools into an isolated venv and exposes only the entry points on PATH.

```bash
uv tool install mlx-lm --python 3.12
```

The install locations are below.

- Isolated venv: `~/.local/share/uv/tools/mlx-lm/`
- CLI symlinks: `~/.local/bin/mlx_lm.*`

### 3.3. Python Version Handling

- The system Python (3.9.6) does not support MLX
- Specifying `--python 3.12` makes uv automatically download cpython 3.12.13
- Without specification, uv automatically picks the latest compatible version available

### 3.4. Install Verification

```bash
mlx_lm.server --help
uv tool list
```

Verify Metal GPU recognition with the following command.

```bash
uv tool run --from mlx-lm python -c \
  "import mlx.core as mx; print('Metal:', mx.metal.is_available()); print('Device:', mx.default_device())"
```

The output should be `Metal: True` and `Device: Device(gpu, 0)`.

### 3.5. Available CLI (mlx-lm v0.31.3, 17 tools)

- `mlx_lm.generate`: One-shot text generation
- `mlx_lm.server`: OpenAI-compatible HTTP server
- `mlx_lm.chat`: Interactive REPL
- `mlx_lm.convert`: Quantization conversion
- `mlx_lm.lora`: LoRA fine-tuning
- `mlx_lm.evaluate`: Benchmark evaluation
- Others: awq, dwq, gptq, fuse, manage, perplexity, share, upload, cache_prompt, benchmark, dynamic_quant

### 3.6. Benefits of the uv tool Approach

- Avoids transformers version conflicts with other ML tools (vllm, llama-cpp-python, etc.)
- Cleanly removes dependencies on uninstall (`uv tool uninstall mlx-lm`)
- mlx-lm version upgrades do not affect other tools

## 4. Choosing the Qwen 3.6 Model (Dense vs MoE)

Run two model variants in parallel, Dense and MoE, to fit the goal of learning and building an agent framework.

### 4.1. Qwen 3.6 Lineup (as of April 2026)

- Qwen3.6-Max-Preview (2026-04-20): Closed API, top of 6 coding benchmarks, 260K context
- Qwen3.6-27B (2026-04-22): Open-weight Dense, Apache 2.0, 262K native / 1M extended
- Qwen3.6-35B-A3B: Open-weight MoE (3B active), 262K native / 1M extended

### 4.2. Main Model: unsloth/Qwen3.6-27B-UD-MLX-6bit

- Type: Dense 27B
- Quantization: Unsloth Dynamic 6bit
- Disk / memory weight: about 22GB
- Use case: Serious behavior verification, ReAct decision tracing, quality baseline

### 4.3. Sub Model: unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit

- Type: MoE (35B total, 3B active)
- Quantization: Unsloth Dynamic 4bit
- Disk / memory weight: about 19GB
- Use case: Fast iteration debugging, prompt tuning, high-volume testing

### 4.4. Dense vs MoE Comparison

| Item | 27B Dense 6bit | 35B-A3B 4bit |
|------|----------------|---------------|
| Active parameters | All 27B | Only 3B |
| Token generation speed | 15-25 tok/s | 50-80 tok/s |
| Behavioral consistency | High (deterministic) | Routing non-determinism |
| Debugging ease | Excellent | Hard to trace |
| Coding benchmarks | Stronger | Slightly lower |

The reason for choosing Dense as the main model is as follows. Because of expert routing, MoE produces subtly different responses for the same input. When you trace why an agent made a particular decision, routing non-determinism becomes noise.

The reason for keeping MoE as a sub model is that running the same agent code on both models alternately turns the Dense vs MoE behavioral difference into the most valuable learning point.

### 4.5. Learning Value of Qwen 3.6

- Thinking Preservation: Preserves reasoning traces in `<think>` blocks across multi-turn dialogue
- Tool calling stability: Trained on Hermes-style tool use, so OpenAI-compatible function calls are stable
- Stronger agentic coding: Records 73.4% on SWE-bench Verified

### 4.6. Running Both Models

Loading both models simultaneously (22GB + 19GB = 41GB) on 48GB unified memory is impossible. Keep both on disk and compare them by restarting the server to swap memory.

## 5. Quantization Comparison

Analyze the trade-offs along two axes: bit width and quantization scheme.

### 5.1. Memory by Bit Width (Qwen 3.6 27B Reference)

| Quantization | Weight memory | With KV (8K) | With KV (32K) | 48GB Fit |
| ---- | ------- | --------- | ---------- | ----------- |
| 4bit | 15GB | 18-22GB | 23-27GB | Plenty of room |
| 6bit | 22GB | 24-25GB | 30-32GB | Best |
| 8bit | 28GB | 32-38GB | 40GB+ | Tight, swap risk |

### 5.2. Bit Width Selection Guide

- 8bit is effectively identical in quality to full precision but risks triggering macOS swap, which is fatal for the learning cycle
- 4bit has measurable quantization noise. Using it as the main model causes you to mistake response quality drops for model limitations
- 6bit is the sweet spot. The memory footprint is 22GB and Unsloth UD 6bit shows essentially negligible quality difference from 8bit

### 5.3. Uniform Quantization vs Dynamic Quantization

mlx-community (uniform quantization) has the following traits.

- Converts every layer to the same bit width
- Generated by the built-in mlx-lm tool (`mlx_lm.convert`)
- The most standard and verified approach

unsloth UD (Dynamic quantization) has the following traits.

- Applies different bit widths according to layer importance
- Keeps key layers like attention and embeddings at higher bits (8bit)
- Applies lower bits (4-5bit) to less important layers
- Average bit count is the same but quality loss is smaller

Combinations where Dynamic quantization shines are below.

- Dense models + lower bits (4-6bit) gain the most
- MoE models + lower bits gain partially (only a subset of experts is active anyway)
- The difference is negligible at 8bit and above

### 5.4. Comparing Two Providers (Qwen3.6-27B 6bit)

| Build | Quantization | Quality | Memory |
|-------|--------------|---------|--------|
| `mlx-community/Qwen3.6-27B-6bit` | Uniform 6bit | Standard | 22GB |
| `unsloth/Qwen3.6-27B-UD-MLX-6bit` | Dynamic 6bit | Better | 22GB |

### 5.5. Conclusion

For the goal of learning and building an agent framework, the most balanced choice is unsloth UD-MLX-6bit.

- Secures a memory margin (22GB leaves room for KV cache)
- Maintains 8bit-level quality (Dynamic quantization)
- Lets you use the model's actual capability as learning material

## 6. Inference Server Options

Spin up an OpenAI-compatible HTTP server and connect your own agent framework as a client.

### 6.1. Built-in Server (Included with mlx-lm v0.31.3)

The launch command is below.

```bash
mlx_lm.server \
  --model unsloth/Qwen3.6-27B-UD-MLX-6bit \
  --port 8080
```

The supported endpoints are below.

- `POST /v1/chat/completions` (with streaming)
- `POST /v1/completions`
- `GET /v1/models`

The supported features are below.

- OpenAI Chat Completions API compatibility
- Streaming (SSE)
- Function calling / tool use
- Automatic chat template application (recognizes Qwen Hermes-style)

The call example is below.

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="unsloth/Qwen3.6-27B-UD-MLX-6bit",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### 6.2. Third-Party Server: mlx-openai-server (cubist38, FastAPI-based)

Additional features over the built-in server are below.

- Multi-model concurrent serving (YAML config)
- Standardized per-model tool call parsers (qwen3, qwen3_5, qwen3_coder, gemma4, etc.)
- Reasoning parser separation (automatically separates Qwen `<think>` blocks into a `reasoning_content` field)
- Vision + text multimodal support

The installation command is below.

```bash
uv tool install mlx-openai-server
```

### 6.3. Selection by Learning Stage

- Early stage: Use the built-in server. The raw tool call output becomes learning material
- Middle stage: Write your own parser using the built-in server's raw tool calls. Learn to implement ReAct and Reflection patterns
- Late stage: Use mlx-openai-server to verify that your parser matches the standard

### 6.4. Other Options

| Tool | Features | Suitability for Learning |
|------|----------|---------------------------|
| `mlx_lm.server` (built-in) | OpenAI compatible, single model, standard | Starting point |
| mlx-openai-server | Multi-model, standardized parsers, reasoning split | Verification |
| LM Studio | GUI app, model manager | If you prefer GUI |
| FastMLX | Lightweight FastAPI wrapper | Simplicity-first |
| vllm-mlx | Continuous batching, 400+ tok/s, MCP support | Production |

### 6.5. Recommended Workflow

- Step 1: Start with the built-in `mlx_lm.server`
- Step 2: Verify single tool calls with curl / OpenAI SDK
- Step 3: Analyze the Hermes raw output and write your own tool call parser
- Step 4: Implement agent patterns such as ReAct
- Step 5: Verify your parser with mlx-openai-server

## 7. Execution Guide (From Install Verification to Troubleshooting)

This section organizes step-by-step commands from mlx-lm installation to API calls against both models.

### 7.1. Environment Verification

```bash
mlx_lm.server --help
uv tool run --from mlx-lm python -c "import mlx.core as mx; print(mx.metal.is_available(), mx.default_device())"
uv tool list
```

### 7.2. Download the Main Model (Qwen 3.6 27B Dense 6bit, About 22GB)

```bash
mlx_lm.generate --model unsloth/Qwen3.6-27B-UD-MLX-6bit --prompt "Hello, who are you?" --max-tokens 100
```

Monitor progress with the following command.

```bash
du -sh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-27B-UD-MLX-6bit
```

Confirm completion with the following command.

```bash
ls -lh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-27B-UD-MLX-6bit/snapshots/*/
```

### 7.3. Download the Sub Model (Qwen 3.6 35B-A3B MoE 4bit, About 19GB)

```bash
mlx_lm.generate --model unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit --prompt "Hello, who are you?" --max-tokens 100
du -sh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-35B-A3B-UD-MLX-4bit
```

### 7.4. Run the Server (One Model at a Time)

```bash
# Main model
mlx_lm.server --model unsloth/Qwen3.6-27B-UD-MLX-6bit --port 8080

# Sub model (after stopping the main)
mlx_lm.server --model unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit --port 8080
```

When you see `Starting server on 127.0.0.1:8080`, the server is up. To swap models, free memory with Ctrl+C and run the same command with the other model.

### 7.5. API Call Test (curl)

Call the server from another terminal while it is running. The examples below assume the main model. If you swapped to the sub model, change the `model` value to `unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit`. Paths are matched exactly, so a trailing slash or a query string returns 404.

A basic chat completion is below.

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [{"role": "user", "content": "Hello"}],
  "max_tokens": 50
}'
```

The model list is below.

```bash
curl http://localhost:8080/v1/models
```

The streaming example is below.

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [{"role": "user", "content": "Count from 1 to 10"}],
  "stream": true,
  "max_tokens": 100
}'
```

### 7.6. Tool Calling Test

A single tool call is below.

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [{"role": "user", "content": "What is the weather in Seoul?"}],
  "tools": [{
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "Get weather for a city",
      "parameters": {
        "type": "object",
        "properties": {
          "city": {"type": "string", "description": "City name"}
        },
        "required": ["city"]
      }
    }
  }],
  "max_tokens": 200
}'
```

The response should include a `tool_calls` field.

A multi-turn tool call (returning the result, then producing the final response) is below.

```bash
curl -X POST http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "unsloth/Qwen3.6-27B-UD-MLX-6bit",
  "messages": [
    {"role": "user", "content": "What is the weather in Seoul?"},
    {"role": "assistant", "content": null, "tool_calls": [{
      "id": "call_001",
      "type": "function",
      "function": {"name": "get_weather", "arguments": "{\"city\": \"Seoul\"}"}
    }]},
    {"role": "tool", "tool_call_id": "call_001", "content": "{\"temp\": 18, \"condition\": \"clear\"}"}
  ],
  "max_tokens": 200
}'
```

### 7.7. OpenAI SDK Call (Python)

```bash
uv tool run --from openai python -c "
from openai import OpenAI
client = OpenAI(base_url='http://localhost:8080/v1', api_key='not-needed')
response = client.chat.completions.create(
    model='unsloth/Qwen3.6-27B-UD-MLX-6bit',
    messages=[{'role': 'user', 'content': 'Hi'}],
    max_tokens=50
)
print(response.choices[0].message.content)
"
```

### 7.8. Disk Usage / Removing Models

After downloading both models, total usage is about 41GB.

```bash
du -sh ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-*
rm -rf ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-27B-UD-MLX-6bit
rm -rf ~/.cache/huggingface/hub/models--unsloth--Qwen3.6-35B-A3B-UD-MLX-4bit
```

### 7.9. Troubleshooting

The error `command not found: mlx_lm.server` occurs when `~/.local/bin` is not on PATH.

```bash
uv tool update-shell
source ~/.zshrc
```

To resume an interrupted download, run `mlx_lm.generate` or `mlx_lm.server` again. It automatically resumes via huggingface_hub.

For out-of-memory (OOM) issues, close other apps or shorten the context. Starting with an 8K context is recommended.

Resolve server port conflicts with the following commands.

```bash
lsof -i :8080
kill -9 <PID>
```

A 404 response on a POST request usually means the path is wrong. mlx_lm.server compares paths exactly, so a trailing slash (`/v1/chat/completions/`), a query string (`?...`), or a typo all return 404. The supported paths are only `/v1/chat/completions`, `/chat/completions`, and `/v1/completions` (text completion).

A 411 response on a POST request means the `Content-Length` header is missing. curl adds it automatically, but specify it explicitly when working with raw sockets.

## 8. Comprehensive Benchmark (Qwen3.6 27B 6bit)

The `unsloth/Qwen3.6-27B-UD-MLX-6bit` model is loaded into `mlx_lm.server` and memory limits and performance are measured across six scenarios: length stress, multi-turn, tool call, deep reasoning, general capability, and GPU throughput. The test machine is Apple Silicon with 48GB unified memory.

### 8.1. Environment

The test environment is below.

- Model: `unsloth/Qwen3.6-27B-UD-MLX-6bit` (Dense 27B, 6bit quantization)
- Weight size on disk: approximately 22GB
- Server: `mlx_lm.server` v0.31.3, port 8080
- System: Apple Silicon, 48GB unified memory, macOS Darwin 25.4

The measurement tools are below.

- Process RSS: `ps -o rss=`
- System memory: `vm_stat` (Pages free / inactive / wired / Swapouts)
- HTTP calls: standard library `urllib.request`
- Measurement scripts: `/tmp/mlx_stress.py`, `/tmp/mlx_extra.py`, `/tmp/mlx_gpu.py`

### 8.2. Difference Between RSS and Wired Memory

RSS showed only 2.8GB at the start of measurement, which was unexpected. The cause is macOS's mmap and memory compression behavior.

- `mlx_lm` loads weights via `mmap`. Pages are brought into physical memory only when actually accessed.
- macOS compresses idle pages. RSS may not reflect compressed memory.
- `Pages wired down` (wired) is more accurate for actual GPU occupancy. MLX holds Metal tensors as wired pages.
- Measurement result: wired jumps from 3.23GB at idle to 32.71GB when the model is active, an increase of approximately 29.5GB. This is the actual GPU memory occupancy.

For this reason, wired memory is used as the primary memory metric in this benchmark.

### 8.3. Length Stress (Incremental Prompt Token Growth)

prompt and `max_tokens` are increased incrementally in a single call to measure the length limit.

| target prompt | actual prompt | output | elapsed | RSS peak | swap Δ | min free+inactive | finish |
|---------------|---------------|--------|---------|----------|--------|-------------------|--------|
| 128 | 222 | 128 | 15.7s | 2.80GB | 0.0GB | 7.87GB | length |
| 512 | 796 | 422 | 50.8s | 2.84GB | 0.0GB | 7.51GB | stop |
| 2048 | 3089 | 420 | 55.9s | 2.84GB | 0.0GB | 7.58GB | stop |
| 4096 | 6147 | 597 | 83.2s | 2.86GB | 0.0GB | 5.65GB | stop |
| 8192 | 12264 | 339 | 69.5s | 2.86GB | 0.0GB | 4.96GB | stop |
| 16384 | 24492 | 376 | 200.6s | 1.94GB | 2.34GB | 3.11GB | stop |
| 24576 | - | - | - | - | thrashing | <1GB | (aborted) |

Key observations are below.

- Up to 12K prompt, calls are stable at 50-90 seconds each. The first call after idle takes longer due to weight paging-in.
- At an actual prompt of 24K (target 16384), elapsed spikes to 200 seconds and 2.3GB of swap occurs. This is a signal that the processing limit has been reached.
- At target 24576, system free drops to 0.5GB, wired reaches 25GB, and swap accumulates at 1.5-2GB every 5 seconds, causing thrashing. Processing is effectively impossible.

### 8.4. Multi-Turn (5-Turn Accumulated Conversation)

Measurement uses a 5-turn conversation on the TCA pattern as the topic. Each turn is called with the accumulated context.

| turn | prompt | completion | total | elapsed | RSS peak | swap Δ |
|------|--------|------------|-------|---------|----------|--------|
| 1 | 28 | 400 | 428 | 46.1s | 18.00GB | 0.00GB |
| 2 | 191 | 400 | 591 | 44.5s | 18.02GB | 0.03GB |
| 3 | 615 | 400 | 1015 | 45.5s | 18.02GB | 0.00GB |
| 4 | 1036 | 400 | 1436 | 46.2s | 18.02GB | 0.00GB |
| 5 | 1457 | 400 | 1857 | 45.4s | 18.02GB | 0.00GB |

Key observations are below.

- RSS is very stable at 18GB for an accumulated 1857 tokens across 5 turns.
- Elapsed time is nearly identical across turns (44-46s). At the 1500-token context level, the prefill overhead is negligible.
- Total swap across 5 turns is 0.03GB, which is effectively zero.

### 8.5. Tool Call (Function Calling)

The `get_weather` function is registered and a request is made to compare the weather in Seoul and Tokyo. The full cycle of tool call request, result return, and final response is measured.

| step | stage | elapsed | RSS peak |
|------|-------|---------|----------|
| 1 | tool_call_request | 37.0s | 18.02GB |
| 2 | final_answer | 17.9s | 18.02GB |

Key observations are below.

- In step 1, the model issues parallel `tool_calls` for both cities in a single call (parallel function calling is supported). Two `tool_calls` come back together in a single response.
- In step 2, two tool results are added to messages and a call is made, generating a natural comparison response.
- Response: "Seoul 18 degrees clear, Tokyo 22 degrees clear, Tokyo is 4 degrees warmer"
- Tool calling for Qwen3.6 works correctly in `mlx_lm.server` v0.31.3.

### 8.6. Deep Reasoning (Thinking Mode)

A seating inference puzzle ("Who is sitting across from the mother?") is used for measurement. Thinking mode is controlled via `chat_template_kwargs`.

| mode | elapsed | RSS peak | reasoning field |
|------|---------|----------|-----------------|
| default | 113.5s | 18.10GB | present |
| `enable_thinking=True` | 112.5s | 18.10GB | present |
| `enable_thinking=False` | 26.3s | 18.09GB | absent |

Key observations are below.

- Qwen3.6 has thinking on by default (the reasoning field is populated automatically).
- Switching to thinking_off makes responses 4.3x faster. This is recommended for simple responses or when an immediate answer is needed.
- With thinking_on, the reasoning process goes into the reasoning field and the final answer is separated into the content field.
- Memory usage is independent of mode.

### 8.7. General Capability (Code / Math / Korean / Translation)

Four short cases are used to quickly verify the model's general capability.

| case | elapsed | RSS peak | Note |
|------|---------|----------|------|
| code (Python deep merge) | 67.1s | 18.10GB | Response includes thinking process |
| math (Sum of multiples of 7 from 1 to 100) | 67.4s | 18.10GB | Correct solution |
| korean_reasoning (Ungrammatical sentence correction) | 68.4s | 18.10GB | Natural correction |
| translation (Korean to English/Japanese) | 67.1s | 18.10GB | Natural translation |

Key observations are below.

- All 4 cases have a consistent elapsed time of 67-68 seconds, which matches the expected decode speed of approximately 9 tok/s at max_tokens 600.
- Response quality passes the baseline bar. No separate quantitative evaluation is performed.
- No obvious errors are found in Korean reasoning or translation.

### 8.8. GPU / Throughput

prefill and decode speeds are measured separately.

| label | prompt | completion | elapsed | total tok/s | decode tok/s | wired before | wired after |
|-------|--------|------------|---------|-------------|--------------|--------------|-------------|
| baseline | 13 | 50 | 6.4s | 9.9 | 7.9 | 3.23GB | 32.71GB |
| medium | 24 | 400 | 44.5s | 9.5 | 9.0 | 32.71GB | 32.44GB |
| long_decode | 25 | 1500 | 163.7s | 9.3 | 9.2 | 32.44GB | 32.72GB |
| long_prompt | 1222 | 800 | 90.4s | 22.4 | 8.8 | 32.72GB | 32.79GB |

Key observations are below.

- Decode throughput is consistently 8-9 tok/s, which is the expected range for a 27B 6bit model on the M series.
- On the baseline first call, wired jumps from 3.23GB to 32.71GB. Model weights and Metal buffers are locked as wired pages.
- Subsequent calls are stable at 32.4-32.8GB wired. The KV cache fluctuates by 0.2-0.3GB depending on context length.
- The total 22.4 tok/s for long_prompt reflects the effect of processing 1222 prefill tokens very quickly. Prefill speed is estimated at 30-40 tok/s, which is 4-5x faster than decode.
- The stable operating point for this machine is 8-9 tok/s in terms of user-perceived speed (first-token latency and decode speed).

### 8.9. Streaming (TTFT, ITL)

The SSE streaming response is parsed directly to measure time to first token (TTFT) and inter-token latency (ITL).

| label | tokens | elapsed | TTFT | ITL avg | ITL p50 | ITL p95 | ITL max |
|-------|--------|---------|------|---------|---------|---------|---------|
| short(cold) | 100 | 15.7s | 4.77s | 110.6ms | 110.1ms | 114.2ms | 121.9ms |
| medium(warm) | 392 | 44.8s | 0.68s | 112.8ms | 110.4ms | 114.0ms | 332.0ms |
| long(warm) | 786 | 88.8s | 0.71s | 112.2ms | 109.7ms | 115.4ms | 329.9ms |

Key observations are below.

- TTFT is about 4.77s cold (immediately after weight page-in) and about 0.7s warm, a significant difference.
- ITL p50 is approximately 110ms and very consistent, which matches the 9 tok/s decode rate.
- ITL p95 stays within 115ms, so the distribution is tight.
- Occasional 330ms spikes occur, which translates to a brief stutter in the UI.
- User-perceived responsiveness is good in the warm state. The near-5-second first-call latency requires pre-warming for chat UX.

### 8.10. Conclusion

#### 8.10.1. Memory Limits

- With the model active, wired memory occupies approximately 33GB as a baseline. Of the 48GB unified memory, 15GB remains free.
- The safe operating context is approximately 12K actual prompt tokens. Beyond that, KV cache pressure causes elapsed time to spike.
- The hard limit is around 24K actual prompt tokens. Beyond that, thrashing makes processing effectively impossible.
- A 5-turn multi-turn conversation (approximately 1.8K accumulated tokens) places almost no memory burden.

#### 8.10.2. Performance

- Decode throughput is stable at 8-9 tok/s, with a tight ITL p50 of 110ms.
- Prefill is estimated at 30-40 tok/s. For short prompts, the prefill contribution is small, so response time is proportional to decode length.
- TTFT is about 4.8s cold (weight page-in) and about 0.7s warm.
- The first call takes approximately 30 seconds longer due to weight paging-in. This can be ignored for workloads with frequent calls.

#### 8.10.3. Features

- Tool calling works correctly and parallel function calling is supported.
- Reasoning defaults to thinking on. Explicitly setting `enable_thinking=False` accelerates responses by 4.3x.
- Korean, English, and Japanese baseline quality all pass the bar.

### 8.11. Recommended Usage Guidelines

- General chatbot/QA (2-4K context) works without issues. Responses come back at approximately 9 tok/s decode speed.
- Multi-turn conversations (up to approximately 10K accumulated context) are stable.
- Long document summarization (8-12K prompt) is possible. Responses take 60-90 seconds.
- Long document analysis (16K+ prompt) is possible but responses take 200 seconds or more and swap begins to occur.
- Very long inputs (20K+) are not recommended due to the risk of thrashing.
- For immediate-response workloads, setting `chat_template_kwargs.enable_thinking=False` provides a 4x speedup.
- When running other heavy apps simultaneously (such as Xcode builds or virtual machines), it is recommended to operate with a narrower context.

### 8.12. Measurement Limitations and Future Items

- Concurrent inference is not measured. Since `mlx_lm.server` processes requests in a single queue, this may not be particularly meaningful.
- GPU utilization, power, and temperature via `powermetrics` are not measured because they require sudo. This can be done in a separate session.
- Quantization comparison (4bit vs 6bit vs 8bit) will be covered in a separate quantization comparison note.
- A comparison of the 35B-A3B MoE 4bit model under the same scenarios is planned as a follow-up.

## 9. Learning Roadmap

### 9.1. Step-by-Step Roadmap

A step-by-step roadmap for studying and building an agent framework is below.

1. Environment setup
   - Run uv tool install mlx-lm
   - Confirm Metal GPU works
   - Download Qwen 3.6 27B Dense 6bit
2. Single-model verification
   - Confirm the first response with mlx_lm.generate
   - Launch mlx_lm.server
   - Call the compatible API with curl or the OpenAI SDK
3. Tool calling study
   - Verify single tool calls
   - Analyze raw responses in Hermes format
   - Write a tool call parser by hand
4. Agent pattern implementation
   - Build a ReAct loop
   - Apply the Reflection pattern
   - Apply the Plan-and-Execute pattern
5. Comparative learning
   - Run the same code on 35B-A3B and confirm behavior
   - Observe Dense vs MoE behavioral differences
   - Verify your own parser with mlx-openai-server

### 9.2. Learning Highlights

The learning highlights are below.

- Reasoning visualization through Qwen's `<think>` blocks
- Feeling the determinism of Dense versus the routing variance of MoE
- Hands-on parsing of the tool call format (Hermes style)
- Understanding KV cache behavior and the cost of multi-turn

### 9.3. Custom Framework Mollo Implementation - Design Complete

In parallel with this learning roadmap, I designed Mollo, a Swift 6-based native agent framework for macOS, iOS, and visionOS. It has zero external dependencies and treats Apple platform services as first-class citizens. The core elements planned for implementation are below.

- StateChannel + Reducer-based Strategy Graph (10+ node types, DFS cycle detection, `@StrategyBuilder` DSL)
- Durable execution (Checkpointer protocol, `ChannelSnapshot` state capture, resume API for OS-termination recovery)
- Interrupt/Command-based human-in-the-loop (`Interrupt` enum with userDecision/approval/custom, `Command` resume semantics)
- Parallel/Map nodes (Swift 6 TaskGroup concurrent execution, `maxConcurrency` backpressure)
- Subgraph node (reusing existing `Agent<Output>` while preserving guardrails, hooks, plugins, permissions, and memory)
- Multi-provider LLM (Anthropic, OpenAI, Google Gemini, DeepSeek, Ollama, OpenAI-compatible endpoints) with router (fallback/roundRobin/priority) and decorators (rate limiter, cache, cost tracker)
- MCP client (JSON-RPC 2.0 over stdio/HTTP+SSE/WebSocket transports, server-initiated request handling, multi-server lifecycle)
- Multimodal (Image/Audio/Video source abstraction, `SpeechInputTool`, `VisionTool`)
- Built-in tools (FileRead/Write/Edit, Grep, Glob, Shell, WebFetch with SSRF and command-injection defenses)
- Apple platform service integration (AppIntents-based Siri/Shortcuts, CloudKit session sync, Keychain credential store, online/offline hybrid router)
- OAuth 2.0 PKCE (SHA256 challenge, CSRF guard, automatic refresh)
- Persistence (InMemory/SQLite/Encrypted sessions, NLEmbedding/SQLite-FTS5 memory, 5 compression strategies)
- Observability (`TraceSpan` + JSON file exporter, unified `os.Logger`, rate limiter, cost tracker)
- Permissions/guardrails/plugins (3-tier permission model, input/output guardrails, 11 lifecycle hooks)
- Swift 6 typed throws (`throws(AgentError)`, `@Sendable` closures, actor-based concurrency)
- Applications (supporting domain-specific agents such as code review and document writing)

### 9.4. Comparative Study - Reference Frameworks

Compare the trade-offs between the frameworks referenced during Mollo's design and your own implementation. The references are below.

- LangGraph (Python) - the original of the State Channel + Reducer, Durable Execution, Interrupt/Command, and Parallel/Map abstractions
- LangChain - BaseChatModel and BaseTool interface patterns
- OpenAI Agents SDK - Handoff and AgentExecutor patterns
- Pydantic AI - the `Agent[Output]` generic structured-output pattern
- MCP (Model Context Protocol) - JSON-RPC 2.0-based tool protocol
- Apple platform - AppIntents, CloudKit, Keychain, BackgroundTasks, Vision, Speech, MLX Swift, Core ML, NLEmbedding

# References

- <https://ai.pydantic.dev/>
- <https://developer.apple.com/documentation/appintents>
- <https://developer.apple.com/documentation/backgroundtasks>
- <https://developer.apple.com/documentation/cloudkit>
- <https://developer.apple.com/documentation/coreml>
- <https://developer.apple.com/documentation/naturallanguage/nlembedding>
- <https://developer.apple.com/documentation/security/keychain_services>
- <https://developer.apple.com/documentation/speech>
- <https://developer.apple.com/documentation/vision>
- <https://github.com/langchain-ai/langchain>
- <https://github.com/langchain-ai/langgraph>
- <https://github.com/ml-explore/mlx>
- <https://github.com/ml-explore/mlx-lm>
- <https://github.com/ml-explore/mlx-swift>
- <https://github.com/openai/openai-agents-python>
- <https://huggingface.co/Qwen>
- <https://huggingface.co/unsloth>
- <https://modelcontextprotocol.io/>
