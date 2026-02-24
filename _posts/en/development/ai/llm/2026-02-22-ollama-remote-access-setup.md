---
title: "[LLM] Setting Up Ollama Remote Access"
ref: ollama-remote-access-setup
excerpt: "Configuring the OLLAMA_HOST environment variable and Windows Firewall to access a local LLM from other devices on the same network."
date: 2026-02-22T23:30+09:00
last_modified_at: 2026-02-22T23:30+09:00
published: true
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/ollama-remote-access-setup.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/ollama-remote-access-setup.png"
categories:
  - Development
  - AI
  - LLM
tags:
  - Ollama
  - LLM
  - Windows 11
  - Network
depth:
  - title: "Development"
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "LLM"
    url: /en/development/ai/llm/
---

# Overview

Configuring the OLLAMA_HOST environment variable and Windows Firewall to access a local LLM from other devices on the same network.

# Steps

## 1. Background

The idea is to install Ollama on a GPU-equipped Windows PC so it can host LLM models and serve as an API endpoint. Actual development and study happens on macOS — just call the Windows API whenever you need the LLM. This way, Windows handles the GPU workload while macOS handles the development environment, making the most of each machine's strengths.

However, Ollama only listens on `127.0.0.1:11434` by default. This works fine on the same PC, but to call the API from a Mac, you need to allow external access.

## 2. Setting the OLLAMA_HOST Environment Variable

Setting the `OLLAMA_HOST` environment variable to `0.0.0.0:11434` on Windows makes Ollama accept requests from all network interfaces.

`Windows + S` → Search "environment variables" → **Edit the system environment variables** → **Environment Variables** button → **New** under **User variables**.

- Variable name: `OLLAMA_HOST`
- Variable value: `0.0.0.0:11434`

![OLLAMA_HOST environment variable](/assets/image/post/development/ai/llm/ollama-remote-access-setup/ollama-host-env-var.png){: style="max-width: min(500px, 100%);"}

A PC reboot or Ollama restart is required for the change to take effect.

### 2.1. Verifying the Setting

Check if Ollama is listening on the correct address in PowerShell.

```powershell
netstat -an | findstr 11434
```

If the output shows `0.0.0.0:11434 LISTENING`, the setting is applied correctly. If it shows `127.0.0.1:11434`, a reboot is needed.

## 3. Windows Firewall Configuration

Even with the environment variable set, the firewall may block the port from external access. Add a firewall rule in an administrator PowerShell.

```powershell
New-NetFirewallRule -DisplayName "Ollama" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow
```

## 4. Testing from Another Device

Call the API from a Mac or other device on the same network using the Windows PC's IP address. You can find the IP with the `ipconfig` command on Windows.

```bash
curl -s http://<windows-ip>:11434/api/generate -d '{"model":"qwen3:8b","prompt":"Explain what Ollama is in one sentence.","stream":false}'
```

![Remote API call from macOS](/assets/image/post/development/ai/llm/ollama-remote-access-setup/ollama-remote-curl.png)

If a response comes back successfully, the setup is complete.

# References

- <https://github.com/ollama/ollama/blob/main/docs/faq.md>
- <https://ollama.com>
