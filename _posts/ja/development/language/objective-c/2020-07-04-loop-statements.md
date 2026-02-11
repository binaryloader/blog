---
date: 2020-07-04T00:00+09:00
title: "[Objective-C] ループ文 - Loop Statements"
ref: objective-c-loop-statements
lang: ja
excerpt: "Objective-Cのループ文をまとめる。"
last_modified_at: 2020-07-04T11:39+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Development
  - Language
  - Objective-C
tags:
  - Development
  - Language
  - Objective-C
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Language"
    url: /ja/development/language/
  - title: "Objective-C"
    url: /ja/development/language/objective-c/
---

# 概要

Objective-Cのループ文をまとめる。

# 注意

本記事は`Objective-C 2.0`を基準に作成された。

# はじめに

Objective-CがサポートするLoop StatementsとControl Transfer Statementsは以下の通りである。

- `For Statement`、`While Statement`、`Do-While Statement`、`Fast Enumeration`
- `Continue Statement`、`Break Statement`、`Return Statement`

# まとめ

## 1. まずLoop Statementsを見てみよう

### 1.1. For Statement

C言語を勉強したならFor Statementは馴染みがあるだろう。以下のような形式で使用できる。

```objectivec
for (<#initialization#>; <#condition#>; <#increment#>) {
    <#statements#>
}
```

#### 1.1.1 initialization

ループを開始する初期化式で変数を通して初期値を設定する。この時ループスコープ内の変数を宣言することも外部スコープの変数を参照して初期値を設定することもできる。

#### 1.1.2. condition

ループ内のstatementsロジックを実行するかどうかを決定するために与えられた条件に従ってコンディションチェックを行う。もしコンディションを満たさなかった場合はループが終了する。

#### 1.1.3. increment

次のループ実行のためにコンディション条件式に必要な変数に対する演算を行う。

私は寿司が本当に好きなので寿司関連の例を作ってみる。以下のサンプルコードを実行してみよう。

```objectivec
for (int i = 1; i < 10; i++) {
    NSLog(@"私が食べたサーモン寿司の数は%d個だ。", i);
}
```

```bash
私が食べたサーモン寿司の数は1個だ。
私が食べたサーモン寿司の数は2個だ。
私が食べたサーモン寿司の数は3個だ。
私が食べたサーモン寿司の数は4個だ。
私が食べたサーモン寿司の数は5個だ。
私が食べたサーモン寿司の数は6個だ。
私が食べたサーモン寿司の数は7個だ。
私が食べたサーモン寿司の数は8個だ。
私が食べたサーモン寿司の数は9個だ。
Program ended with exit code: 0
```

以下の形式で使用すると無限ループになる。

```objectivec
for (;;) {
    <#statements#>
}
```

### 1.2. While Statement

While Statementも馴染みがあるだろう。以下のような形式で使用できる。

```objectivec
while (<#condition#>) {
    <#statements#>
}
```

#### 1.2.1. condition

与えられた条件に従ってコンディションチェックを行い、コンディションを満たした場合にループ内のstatementsロジックを実行する。

```objectivec
int i = 1;

while (i < 10) {
    NSLog(@"私が食べたヒラメ寿司の数は%d個だ。", i);
    i++;
}
```

```bash
私が食べたヒラメ寿司の数は1個だ。
私が食べたヒラメ寿司の数は2個だ。
私が食べたヒラメ寿司の数は3個だ。
私が食べたヒラメ寿司の数は4個だ。
私が食べたヒラメ寿司の数は5個だ。
私が食べたヒラメ寿司の数は6個だ。
私が食べたヒラメ寿司の数は7個だ。
私が食べたヒラメ寿司の数は8個だ。
私が食べたヒラメ寿司の数は9個だ。
Program ended with exit code: 0
```

以下の形式で使用すると無限ループになる。

```objectivec
while (YES) {
    <#statements#>
}
```

C言語と同様に0以外の整数を入れればよい。

### 1.3. Do while Statement

Do while Statementも馴染みがあるだろう。While Statementとは異なり必ずループ内のstatementsロジックを一度実行した後にコンディションチェックを行う。以下のような形式で使用できる。

```objectivec
do {
    <#statements#>
} while (<#condition#>);
```

#### 1.3.1. condition

与えられた条件に従ってコンディションチェックを行い、コンディションを満たした場合にループ内のロジックを実行する。

```objectivec
do {
    NSLog(@"私が食べた鯛寿司の数は%d個だ。", i);
    i++;
} while (i < 10);
```

```objectivec
私が食べた鯛寿司の数は1個だ。
私が食べた鯛寿司の数は2個だ。
私が食べた鯛寿司の数は3個だ。
私が食べた鯛寿司の数は4個だ。
私が食べた鯛寿司の数は5個だ。
私が食べた鯛寿司の数は6個だ。
私が食べた鯛寿司の数は7個だ。
私が食べた鯛寿司の数は8個だ。
私が食べた鯛寿司の数は9個だ。
```

以下の形式で使用すると無限ループになる。

```objectivec
do {
    <#statements#>
} while (YES);
```

C言語と同様に0以外の整数を入れればよい。

### 1.4. Fast Enumeration（高速列挙）

高速列挙とはCollectionの要素を効果的かつ安全に走査できる文法である。SwiftだけでなくObjective-Cでもこの文法をサポートしている。インデックスベースでコレクションの要素を参照するわけではないためOOB（配列範囲外アクセス）を防ぐことができる。

ただしObjective-Cでの高速列挙はNSArray、NSDictionaryなどCollectionタイプに対してのみ使用できる。

以下のような形式で使用できる。

```objectivec
for (<#type *object#> in <#collection#>) {
    <#statements#>
}
```

```objectivec
NSArray<NSNumber *> *array = @[@1, @2, @3, @4, @5, @6, @7, @8, @9];

for (NSNumber *number in array) {
    NSLog(@"私が食べたうなぎ寿司の数は%ld個だ。", number.integerValue);
}
```

```objectivec
NSArray<NSNumber *> *array = @[@1, @2, @3, @4, @5, @6, @7, @8, @9];

NSNumber *number = nil;

for (number in array) {
    NSLog(@"私が食べたうなぎ寿司の数は%ld個だ。", number.integerValue);
}
```

```bash
私が食べたうなぎ寿司の数は1個だ。
私が食べたうなぎ寿司の数は2個だ。
私が食べたうなぎ寿司の数は3個だ。
私が食べたうなぎ寿司の数は4個だ。
私が食べたうなぎ寿司の数は5個だ。
私が食べたうなぎ寿司の数は6個だ。
私が食べたうなぎ寿司の数は7個だ。
私が食べたうなぎ寿司の数は8個だ。
私が食べたうなぎ寿司の数は9個だ。
Program ended with exit code: 0
```

NSEnumeratorオブジェクトを使用して高速列挙を行うこともできる。

```objectivec
NSArray<NSNumber *> *array = @[@1, @2, @3, @4, @5, @6, @7, @8, @9];

NSEnumerator *enumerator = [array reverseObjectEnumerator];

for (NSNumber *number in enumerator) {
    NSLog(@"私が食べたうなぎ寿司の数は%ld個だ。", number.integerValue);
}
```

```bash
私が食べたうなぎ寿司の数は9個だ。
私が食べたうなぎ寿司の数は8個だ。
私が食べたうなぎ寿司の数は7個だ。
私が食べたうなぎ寿司の数は6個だ。
私が食べたうなぎ寿司の数は5個だ。
私が食べたうなぎ寿司の数は4個だ。
私が食べたうなぎ寿司の数は3個だ。
私が食べたうなぎ寿司の数は2個だ。
私が食べたうなぎ寿司の数は1個だ。
Program ended with exit code: 0
```

NSDictionaryも高速列挙を通じてすべてのキーを走査できる。

```objectivec
NSDictionary<NSString *, NSNumber *> *dictionary = @{
    @"サーモン寿司": @10,
    @"ヒラメ寿司": @10,
    @"鯛寿司": @10,
    @"うなぎ寿司": @10
};

NSLog(@"私が食べた寿司は以下の通りだ。");

for (NSString *key in dictionary.keyEnumerator) {
    NSLog(@"%@ %ld個", key, dictionary[key].integerValue);
}
```

```bash
私が食べた寿司は以下の通りだ。
鯛寿司 10個
サーモン寿司 10個
うなぎ寿司 10個
ヒラメ寿司 10個
Program ended with exit code: 0
```

## 2. 次にLoop Statementsと一緒に使えるControl Transfer Statementsを見てみよう

### 2.1. Continue Statement

ループ内でcontinueに出会うとその時点で次のループに実行フローが移る。

```objectivec
for (int i = 1; i < 10; i++) {
    if (i % 2 == 0) {
        continue;
    }

    NSLog(@"私が食べたサーモン寿司の数は%d個だ。", i);
}
```

```bash
私が食べたサーモン寿司の数は1個だ。
私が食べたサーモン寿司の数は3個だ。
私が食べたサーモン寿司の数は5個だ。
私が食べたサーモン寿司の数は7個だ。
私が食べたサーモン寿司の数は9個だ。
Program ended with exit code: 0
```

上の例では偶数の場合に次のループに実行フローが移るためiが奇数の場合のみ出力される。

### 2.2. Break Statement

ループ内でbreakに出会うとその時点でループを中断する。

```objectivec
int i = 1;

while (i < 10) {
    if (i % 2 == 0) {
        break;
    }

    NSLog(@"私が食べたヒラメ寿司の数は%d個だ。", i);
    i++;
}
```

```bash
私が食べたヒラメ寿司の数は1個だ。
Program ended with exit code: 0
```

上の例では偶数の場合にループを中断するためループ内のロジックは1回だけ実行されて終了する。

### 2.3. Return Statement

ループがメソッドスコープ内に存在する状態でループ内でreturnに出会うとその時点でメソッドの実行を終了してリターンする。

```objectivec
- (void)print {
    int i = 1;

    do {
        NSLog(@"私が食べた鯛寿司の数は%d個だ。", i);
        i++;

        if (i % 2 == 0) {
            return;
        }
    } while (i < 10);
}
```

```bash
私が食べた鯛寿司の数は1個だ。
Program ended with exit code: 0
```

上の例では偶数の場合にメソッドの実行を終了してリターンするためループ内のロジックは1回だけ実行され、メソッドフレームがスタックからポップされる。

# 参考

- <https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjectiveC/Chapters/ocFastEnumeration.html>
