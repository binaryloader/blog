---
title: "[TIL][260224] uvとOllamaでPythonプロジェクトを始める"
ref: python-uv-ollama-getting-started
excerpt: "uvパッケージマネージャでPythonプロジェクトを構成し、Ollama PythonライブラリでリモートLLMサーバーに接続しながら学んだことをまとめる。"
date: 2026-02-25T01:55+09:00
last_modified_at: 2026-02-25T01:55+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/python-uv-ollama-getting-started.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/python-uv-ollama-getting-started.png"
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
    url: /ja/study/
  - title: "TIL"
    url: /ja/study/til/
---

# 概要

uvパッケージマネージャでPythonプロジェクトを構成し、Ollama PythonライブラリでリモートLLMサーバーに接続しながら学んだことをまとめる。

# まとめ

## 1. pip vs pip3

macOSでは複数のPythonバージョンが共存できる。`pip`はシステムによってPython 2または3に紐づくが、`pip3`は常にPython 3に紐づく。最も明確な方法は`python3 -m pip install パッケージ名`で実行することだ。どのPythonインタプリタにインストールするか曖昧さがなくなる。

uvを使えば`pip`を直接使う場面はほとんどない。

## 2. uvパッケージマネージャ

uvはRustで書かれたPythonパッケージマネージャだ。pipより高速で、プロジェクトごとの仮想環境を自動管理する。

### 2.1. インストール

```bash
brew install uv
```

### 2.2. 主要コマンド

```bash
uv init                    # カレントディレクトリでプロジェクト初期化
uv init myproject          # myprojectフォルダを作成して初期化
uv add ollama              # パッケージインストール + pyproject.tomlに依存関係追加
uv run main.py             # 仮想環境でスクリプト実行
uv sync                    # 依存関係の同期
```

### 2.3. Pythonバージョン管理

```bash
uv python install 3.13     # Python 3.13をインストール
uv python uninstall 3.14   # Python 3.14をアンインストール
uv python pin 3.13         # プロジェクトのPythonバージョンを固定
uv python list --only-installed  # インストール済みバージョンを確認
```

XcodeにバンドルされたPython 3.9の代わりに最新バージョンをインストールして使うのが良い。Python 3.14はまだ一部のパッケージ（`orjson`など）がサポートしていないため、現時点では3.13が安定的だ。

### 2.4. 仮想環境

`uv init`を実行するとプロジェクトルートに`.venv`ディレクトリが作成される。`uv run`がこの仮想環境を自動的にアクティベートするため、`source .venv/bin/activate`や`deactivate`のようなコマンドを直接使う必要がない。

## 3. Python基本文法

Swiftと比較しながら違いを整理する。

### 3.1. 動的型付け

変数の型を宣言する必要がない。型ヒントはオプションで、実行時に強制されない。

```python
name = "hello"        # 型宣言なし
name: str = "hello"   # 型ヒント（オプション）
```

### 3.2. 定数

Swiftの`let`のような不変キーワードがない。大文字の変数名で定数を表現するが、実際には変更を防がない。

```python
MAX_COUNT = 100  # 慣例的な定数（変更可能）
```

### 3.3. 命名規則

| 対象 | Python | Swift |
|---|---|---|
| 関数/変数 | `snake_case` | `camelCase` |
| クラス | `PascalCase` | `PascalCase` |

### 3.4. 文字列

シングルクォート（`'`）とダブルクォート（`"`）のどちらも使える。Python公式フォーマッタのBlackがダブルクォートをデフォルトで使用するため、`"`に統一するのが良い。

### 3.5. `if __name__ == "__main__":`

ファイルを直接実行した時だけコードを実行し、他のファイルからimportした時は実行しないガードパターンだ。`main()`関数はPythonが特別扱いするものではなく、単なる慣例的な名前だ。

```python
def run():
    print("hello")

if __name__ == "__main__":
    run()  # 直接実行時のみ呼び出し
```

### 3.6. import

```python
import ollama            # ollama.chat(...)で呼び出し
from ollama import chat  # chat(...)で直接呼び出し
```

`import ollama`だけですべての機能を使える。`from`構文はモジュール名を省略したい時に使う。

## 4. Ollama Pythonライブラリ

### 4.1. リモートサーバー接続

`Client`に`host`と`timeout`を指定するとリモートOllamaサーバーに接続できる。LangChainを使う場合は`ChatOllama`に`base_url`を指定する。

```python
import ollama

client = ollama.Client(
    host="http://192.168.x.x:11434",
    timeout=300
)
```

### 4.2. generateとchat

```python
# 単一レスポンス生成
result = client.generate(
    model="qwen3:8b",
    prompt="Pythonとは何かを一文で説明して"
)
print(result["response"])

# 対話形式
reply = client.chat(
    model="qwen3:8b",
    messages=[{"role": "user", "content": "こんにちは"}]
)
print(reply.message.content)
```

### 4.3. LangChain連携

LangChainの`ChatOllama`を使えば対話型インターフェースを簡単に実装できる。

```python
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage

llm = ChatOllama(
    model="qwen3:8b",
    base_url="http://192.168.x.x:11434"
)

while True:
    user_input = input("質問を入力してください (終了: exit): ")
    if user_input.lower() == "exit":
        break

    messages = [HumanMessage(content=user_input)]
    response = llm.invoke(messages)
    print("回答:", response.content)
```

### 4.4. タイムアウト

8Bモデルでもサーバーのスペックによってはレスポンスに時間がかかることがある。デフォルトのタイムアウトが短いと`ConnectionError`が発生するため、`timeout`を余裕を持って設定するのが良い。

## 5. PyCharmインタプリタ設定

PyCharmでuvプロジェクトを実行するには`.venv`のPythonインタプリタを設定する必要がある。

1. **設定** (⌘ + ,) → **プロジェクト** → **Pythonインタプリタ**
2. **インタプリタの追加** → **ローカルインタプリタの追加**
3. **既存** → パスをプロジェクトの`.venv/bin/python3`に指定

システムPython（`/usr/bin/python3`）を使うとuvでインストールしたパッケージを認識できない。

## 6. macOSローカルネットワーク権限

PyCharmから同じネットワーク上の他のデバイスにアクセスするにはmacOSのローカルネットワーク権限が必要だ。ターミナルでは正常に動作するのにPyCharmだけ`No route to host`や`ConnectionError`が発生する場合はこの設定を確認する。

**システム設定** → **プライバシーとセキュリティ** → **ローカルネットワーク**でPyCharmを許可すれば良い。

# リソース

- 올라마와 오픈소스 LLM을 활용한 AI 에이전트 개발 입문（이성용 著、이지스퍼블리싱）

# 参考

- <https://docs.astral.sh/uv/>
- <https://github.com/godstale/ollama-mcp-tutorials>
- <https://github.com/ollama/ollama-python>
- <https://peps.python.org/pep-0008/>
