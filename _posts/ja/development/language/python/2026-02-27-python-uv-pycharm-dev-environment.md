---
title: "[Python] uvとPyCharmでPython開発環境を構築する"
ref: python-uv-pycharm-dev-environment
excerpt: "uvパッケージマネージャでPythonプロジェクトを構成し、PyCharmで開発環境を設定する方法を整理する。"
date: 2026-02-27T17:00+09:00
last_modified_at: 2026-02-27T17:00+09:00
published: true
lang: ja
permalink: /ja/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/python-uv-pycharm-dev-environment.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/python-uv-pycharm-dev-environment.png"
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
    url: /ja/development/
  - title: "Language"
    url: /ja/development/language/
  - title: "Python"
    url: /ja/development/language/python/
---

# 概要

uvパッケージマネージャでPythonプロジェクトを構成し、PyCharmで開発環境を設定する方法を整理する。

# 手順

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

## 3. PyCharmインタプリタ設定

PyCharmでuvプロジェクトを実行するには`.venv`のPythonインタプリタを設定する必要がある。

1. 設定 (⌘ + ,) → プロジェクト → Pythonインタプリタ
2. インタプリタの追加 → ローカルインタプリタの追加
3. 既存の環境を選択 → パスをプロジェクトの`.venv/bin/python3`に指定

システムPython（`/usr/bin/python3`）を使うとuvでインストールしたパッケージを認識できない。

## 4. macOSローカルネットワーク権限

PyCharmから同じネットワーク上の他のデバイスにアクセスするにはmacOSのローカルネットワーク権限が必要だ。ターミナルでは正常に動作するのにPyCharmだけ`No route to host`や`ConnectionError`が発生する場合はこの設定を確認する。

システム設定 → プライバシーとセキュリティ → ローカルネットワークでPyCharmを許可すれば良い。

## 5. PyCharmで韓国語入力時のUnicodeEncodeError

PyCharmのコンソールで韓国語を入力すると、以下のようなエラーが発生することがある。

```
UnicodeEncodeError: 'utf-8' codec can't encode character '\udce3' in position 151: surrogates not allowed
```

`\udce3`はUTF-8 3バイトシーケンス（`0xe3`）のsurrogate形式だ。PyCharmコンソールのエンコーディング設定の問題で韓国語入力がsurrogate文字に誤って変換され、APIに送信する際にUTF-8エンコーディングが失敗するのだ。

### 5.1. 解決方法

ヘルプ → カスタムVMオプションの編集...を開き、以下の2行を追加してからPyCharmを再起動する。

```
-Dfile.encoding=UTF-8
-Dconsole.encoding=UTF-8
```

設定 → エディタ → ファイルエンコーディングですべての項目が`UTF-8`になっているかも確認する。

### 5.2. 確認方法

ターミナルで直接実行してPyCharmの問題かどうか確認できる。

```bash
uv run python main.py
```

ターミナルで正常に動作すれば、PyCharmコンソールのエンコーディング問題だ。

# 参考

- <https://docs.astral.sh/uv/>
- <https://peps.python.org/pep-0008/>
