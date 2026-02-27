---
title: "[Python] Setting Up a Python Dev Environment with uv and PyCharm"
ref: python-uv-pycharm-dev-environment
excerpt: "Setting up a Python project with the uv package manager and configuring the development environment in PyCharm."
date: 2026-02-27T17:00+09:00
last_modified_at: 2026-02-27T17:00+09:00
published: true
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/python-uv-pycharm-dev-environment.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/python-uv-pycharm-dev-environment.png"
categories:
  - Development
  - Language
  - Python
tags:
  - Python
  - uv
  - PyCharm
  - macOS
depth:
  - title: "Development"
    url: /en/development/
  - title: "Language"
    url: /en/development/language/
  - title: "Python"
    url: /en/development/language/python/
---

# Overview

Setting up a Python project with the uv package manager and configuring the development environment in PyCharm.

# Steps

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

## 3. PyCharm Interpreter Setup

To run a uv project in PyCharm, the `.venv` Python interpreter must be configured.

1. **Settings** (⌘ + ,) → **Project** → **Python Interpreter**
2. **Add Interpreter** → **Add Local Interpreter**
3. **Existing** → Set path to the project's `.venv/bin/python3`

Using the system Python (`/usr/bin/python3`) will not recognize packages installed via uv.

## 4. macOS Local Network Permission

To access devices on the same network from PyCharm, macOS local network permission is required. If the terminal works fine but PyCharm throws `No route to host` or `ConnectionError`, check this setting.

Go to **System Settings** → **Privacy & Security** → **Local Network** and enable PyCharm.

## 5. UnicodeEncodeError with Korean Input in PyCharm

When entering Korean text in PyCharm's console, the following error may occur.

```
UnicodeEncodeError: 'utf-8' codec can't encode character '\udce3' in position 151: surrogates not allowed
```

`\udce3` is the surrogate form of a UTF-8 3-byte sequence (`0xe3`). Due to PyCharm's console encoding settings, Korean input is incorrectly converted to surrogate characters, which then fails UTF-8 encoding when sent to an API.

### 5.1. Solution

Open **Help** → **Edit Custom VM Options...** and add the following two lines, then restart PyCharm.

```
-Dfile.encoding=UTF-8
-Dconsole.encoding=UTF-8
```

Also check that all items under **Settings** → **Editor** → **File Encodings** are set to `UTF-8`.

### 5.2. Verification

Run the script directly in the terminal to confirm whether it's a PyCharm issue.

```bash
uv run python main.py
```

If it works correctly in the terminal, the PyCharm console encoding is the problem.

# References

- <https://docs.astral.sh/uv/>
- <https://peps.python.org/pep-0008/>
