---
title: "[TIL][260224] Getting Started with Python Projects Using uv and Ollama"
ref: python-uv-ollama-getting-started
excerpt: "Setting up a Python project with the uv package manager and connecting to a remote LLM server using the Ollama Python library."
date: 2026-02-25T01:55+09:00
last_modified_at: 2026-02-25T01:55+09:00
published: true
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/python-uv-ollama-getting-started.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/python-uv-ollama-getting-started.png"
categories:
  - Study
  - TIL
tags:
  - Python
  - uv
  - Ollama
  - PyCharm
  - macOS
depth:
  - title: "Study"
    url: /en/study/
  - title: "TIL"
    url: /en/study/til/
---

# Overview

Setting up a Python project with the uv package manager and connecting to a remote LLM server using the Ollama Python library.

# Summary

## 1. pip vs pip3

Multiple Python versions can coexist on macOS. `pip` may point to Python 2 or 3 depending on the system, while `pip3` always points to Python 3. The most explicit approach is `python3 -m pip install package`, which removes any ambiguity about which Python interpreter is being used.

With uv, there is rarely a need to use `pip` directly.

## 2. uv Package Manager

uv is a Python package manager written in Rust. It is faster than pip and automatically manages per-project virtual environments.

### 2.1. Installation

```bash
brew install uv
```

### 2.2. Key Commands

```bash
uv init                    # Initialize project in current directory
uv init myproject          # Create myproject folder and initialize
uv add ollama              # Install package + add to pyproject.toml
uv run main.py             # Run script in virtual environment
uv sync                    # Sync dependencies
```

### 2.3. Python Version Management

```bash
uv python install 3.13     # Install Python 3.13
uv python uninstall 3.14   # Uninstall Python 3.14
uv python pin 3.13         # Pin Python version for the project
uv python list --only-installed  # List installed versions
```

It is better to install a recent version instead of using the Xcode-bundled Python 3.9. Python 3.14 is not yet supported by some packages (e.g., `orjson`), so 3.13 is the stable choice at this point.

### 2.4. Virtual Environments

Running `uv init` creates a `.venv` directory at the project root. `uv run` automatically activates this virtual environment, so there is no need to manually run `source .venv/bin/activate` or `deactivate`.

## 3. Python Basics

Key differences compared to Swift.

### 3.1. Dynamic Typing

Variable types do not need to be declared. Type hints are optional and not enforced at runtime.

```python
name = "hello"        # No type declaration
name: str = "hello"   # Type hint (optional)
```

### 3.2. Constants

There is no immutable keyword like Swift's `let`. Uppercase variable names indicate constants by convention, but they can still be modified.

```python
MAX_COUNT = 100  # Conventional constant (mutable)
```

### 3.3. Naming Conventions

| Target | Python | Swift |
|---|---|---|
| Functions/Variables | `snake_case` | `camelCase` |
| Classes | `PascalCase` | `PascalCase` |

### 3.4. Strings

Both single quotes (`'`) and double quotes (`"`) work. Since Black, the official Python formatter, defaults to double quotes, it is best to use `"` consistently.

### 3.5. `if __name__ == "__main__":`

A guard pattern that runs code only when the file is executed directly, not when imported by another file. The `main()` function is not special to Python — it is simply a conventional name.

```python
def run():
    print("hello")

if __name__ == "__main__":
    run()  # Called only on direct execution
```

### 3.6. import

```python
import ollama            # Call as ollama.chat(...)
from ollama import chat  # Call as chat(...) directly
```

`import ollama` alone provides access to all features. The `from` syntax is used to skip the module prefix.

## 4. Ollama Python Library

### 4.1. Remote Server Connection

Specifying `host` and `timeout` on `Client` connects to a remote Ollama server. When using LangChain, set `base_url` on `ChatOllama`.

```python
import ollama

client = ollama.Client(
    host="http://192.168.x.x:11434",
    timeout=300
)
```

### 4.2. generate and chat

```python
# Single response generation
result = client.generate(
    model="qwen3:8b",
    prompt="Explain what Python is in one sentence"
)
print(result["response"])

# Conversational
reply = client.chat(
    model="qwen3:8b",
    messages=[{"role": "user", "content": "Hello"}]
)
print(reply.message.content)
```

### 4.3. LangChain Integration

Using LangChain's `ChatOllama` makes it easy to build a conversational interface.

```python
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage

llm = ChatOllama(
    model="qwen3:8b",
    base_url="http://192.168.x.x:11434"
)

while True:
    user_input = input("Enter your question (quit: exit): ")
    if user_input.lower() == "exit":
        break

    messages = [HumanMessage(content=user_input)]
    response = llm.invoke(messages)
    print("Answer:", response.content)
```

### 4.4. Timeout

Even an 8B model can take time depending on server specs. If the default timeout is too short, a `ConnectionError` occurs. Setting a generous `timeout` value is recommended.

## 5. PyCharm Interpreter Setup

To run a uv project in PyCharm, the `.venv` Python interpreter must be configured.

1. **Settings** (⌘ + ,) → **Project** → **Python Interpreter**
2. **Add Interpreter** → **Add Local Interpreter**
3. **Existing** → Set path to the project's `.venv/bin/python3`

Using the system Python (`/usr/bin/python3`) will not recognize packages installed via uv.

## 6. macOS Local Network Permission

To access devices on the same network from PyCharm, macOS local network permission is required. If the terminal works fine but PyCharm throws `No route to host` or `ConnectionError`, check this setting.

Go to **System Settings** → **Privacy & Security** → **Local Network** and enable PyCharm.

# Resources

- 올라마와 오픈소스 LLM을 활용한 AI 에이전트 개발 입문

# References

- <https://docs.astral.sh/uv/>
- <https://github.com/godstale/ollama-mcp-tutorials>
- <https://github.com/ollama/ollama-python>
- <https://peps.python.org/pep-0008/>
