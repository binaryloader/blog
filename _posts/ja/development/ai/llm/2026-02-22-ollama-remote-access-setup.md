---
title: "[LLM] Ollamaのリモートアクセスを設定する"
ref: ollama-remote-access-setup
excerpt: "OLLAMA_HOST環境変数とWindowsファイアウォールを設定して、同じネットワーク上の他のデバイスからローカルLLMにアクセスする方法をまとめる。"
date: 2026-02-22T23:30+09:00
last_modified_at: 2026-02-22T23:30+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/ollama-remote-access-setup.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/ollama-remote-access-setup.png"
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
    url: /ja/development/
  - title: "AI"
    url: /ja/development/ai/
  - title: "LLM"
    url: /ja/development/ai/llm/
---

# 概要

OLLAMA_HOST環境変数とWindowsファイアウォールを設定して、同じネットワーク上の他のデバイスからローカルLLMにアクセスする方法をまとめる。

# 手順

## 1. 問題

Ollamaはデフォルトで`127.0.0.1:11434`でのみリクエストを受け付ける。同じPC上では問題ないが、Macや他のデバイスからAPIを呼び出すには外部アクセスを許可する必要がある。

## 2. OLLAMA_HOST環境変数の設定

Windowsで`OLLAMA_HOST`環境変数を`0.0.0.0:11434`に設定すると、すべてのネットワークインターフェースからリクエストを受信するようになる。

`Windows + S` → 「環境変数」で検索 → **システム環境変数の編集** → **環境変数**ボタン → **ユーザー変数**で**新規**をクリックする。

- 変数名: `OLLAMA_HOST`
- 変数値: `0.0.0.0:11434`

![OLLAMA_HOST環境変数の設定](/assets/image/post/development/ai/llm/ollama-remote-access-setup/ollama-host-env-var.png){: style="max-width: min(500px, 100%);"}

設定後、PCを再起動するかOllamaを再起動する必要がある。

### 2.1. 設定の確認

PowerShellでOllamaが正しいアドレスでリスニングしているか確認する。

```powershell
netstat -an | findstr 11434
```

`0.0.0.0:11434 LISTENING`と表示されれば正常だ。`127.0.0.1:11434`と表示される場合は再起動が必要だ。

## 3. Windowsファイアウォールの設定

環境変数を設定してもファイアウォールがポートをブロックすると外部からアクセスできない。管理者権限のPowerShellでファイアウォールルールを追加する。

```powershell
New-NetFirewallRule -DisplayName "Ollama" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow
```

## 4. 他のデバイスからの接続テスト

同じネットワーク上のMacや他のデバイスからWindows PCのIPでAPIを呼び出す。Windows PCのIPは`ipconfig`コマンドで確認できる。

```bash
curl -s http://<WindowsのIP>:11434/api/generate -d '{"model":"qwen3:8b","prompt":"Explain what Ollama is in one sentence.","stream":false}'
```

![macOSからのリモートAPI呼び出し](/assets/image/post/development/ai/llm/ollama-remote-access-setup/ollama-remote-curl.png)

レスポンスが正常に返ってくれば設定完了だ。

# 参考

- <https://ollama.com>
- <https://github.com/ollama/ollama/blob/main/docs/faq.md>
