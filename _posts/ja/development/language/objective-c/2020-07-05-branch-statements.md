---
title: "[Objective-C] 条件分岐文 - Branch Statements"
ref: objective-c-branch-statements
lang: ja
excerpt: "Objective-Cの条件分岐文をまとめる。"
last_modified_at: 2020-07-05T12:39+09:00
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

Objective-Cの条件分岐文をまとめる。

# 注意

本記事は`Objective-C 2.0`を基準に作成された。

# はじめに

Objective-CがサポートするBranch Statementsは以下の通りである。

- `If Statement`、`Switch Statement`

演算子による意思決定については以下のポストの三項演算子セクションを参照してほしい。

- [[Objective-C] 演算子と式 - Operators and Expressions](/ja/development/language/objective-c/operators-and-expressions/#7-%EC%82%BC%ED%95%AD-%EC%97%B0%EC%82%B0%EC%9E%90-the-ternary-operators)

# まとめ

## 1. If Statement

C言語を勉強したならIf Statementは馴染みがあるだろう。以下のような形式で使用できる。

```objectivec
if (<#condition#>) {
    <#statements#>
}
```

```objectivec
if (<#condition#>) {
    <#statements#>
} else if (<#expression#>) {
    <#statements#>
} else {
    <#statements#>
}
```

### 1.1. condition

条件文内のstatementsロジックを実行するかどうかを決定するために与えられた条件に従ってコンディションチェックを行う。もしコンディションを満たさなかった場合は下方向に実行フローが移る。

簡単な例を実行してみよう。

```objectivec
int number = 0;

NSLog(@"0より大きい10の倍数を入力せよ。");
scanf("%d", &number);

int remainder = number % 10;

if (number > 0 && remainder == 0) {
    NSLog(@"%dは0より大きい10の倍数である。", number);
} else {
    NSLog(@"%dは0より大きい10の倍数ではない。", number);
}
```

```bash
200
200は0より大きい10の倍数である。
Program ended with exit code: 0
```

コンディションチェックのロジックが複雑な場合はif statementに到達する前に以下のように条件を論理単位で細かく分割して先に演算してあげるとコンパイル性能と可読性に役立つこともある。

```objectivec
int number = 0;

NSLog(@"0より大きい10の倍数を入力せよ。");
scanf("%d", &number);

BOOL isNumberGreaterThanZero = number > 0;

int remainder = number % 10;
BOOL isRemainderEqualToZero = remainder == 0;

BOOL isMultiplesOfTen = isNumberGreaterThanZero && isRemainderEqualToZero;

if (isMultiplesOfTen) {
    NSLog(@"%dは0より大きい10の倍数である。", number);
} else {
    NSLog(@"%dは0より大きい10の倍数ではない。", number);
}
```

```bash
35
35は0より大きい10の倍数ではない。
Program ended with exit code: 0
```

ただしコンディションに比較演算子や論理演算子がある場合に演算を先にすべて行ってしまうとShort Circuit Evaluationの利点を失うこともあるため状況に応じて適切に記述しよう。

例えば以下のように先に条件を分割して演算しない場合

```objectivec
if (number > 0 && (number % 10) == 0) {
    ...
}
```

最初のコンディションをチェックする際にnumberが0以下であれば`&&`の後の(number % 10) == 0コンディションはチェックせずすぐにif statementを抜ける。

しかし以下のように論理単位ごとに分割して演算を先に行う場合は2つのコンディションをすべてチェックするため不必要な演算コストが少し増えることになる。

```objectivec
BOOL isNumberGreaterThanZero = number > 0;

int remainder = number % 10;
BOOL isRemainderEqualToZero = remainder == 0;

BOOL isMultiplesOfTen = isNumberGreaterThanZero && isRemainderEqualToZero;

if (isMultiplesOfTen) {
    ...
}
```

分岐パスを追加したい場合はif-else構文を使用して必要なだけ追加できる。

```objectivec
int number = 0;

NSLog(@"0より大きい10の倍数を入力せよ。");
scanf("%d", &number);

BOOL isNumberGreaterThanZero = number > 0;

int remainder = number % 10;
BOOL isRemainderEqualToZero = remainder == 0;

if (isNumberGreaterThanZero == NO) {
    NSLog(@"0より大きい10の倍数を入力しろと言った。");
} else if (isRemainderEqualToZero == NO) {
    NSLog(@"%dは10の倍数ではない。", number);
} else {
    NSLog(@"%dは0より大きい10の倍数である。", number);
}
```

また単純にパスの追加だけでなく上の例のようにコンディションチェックを単一論理単位で行えるため複数のコンディションケースを一つずつ処理しながら最終目標までの到達パスをより明確に表現できる。

## 2. Switch Statement

Switch StatementもC言語を勉強したなら馴染みがあるだろう。以下のような形式で使用できる。

```objectivec
switch (<#expression#>) {
    case <#constant#>:
        <#statements#>
        break;
    default:
        break;
}
```

### 2.1. expression

各caseのconstantと比較される変数や定数もしくは式である。

### 2.2. constant

該当caseの値がexpressionの値と比較して同じ場合にstatementsロジックを実行する。caseの最後に`break`を入れないと該当caseのstatementsロジックだけを実行してswitch statementを抜けることができない。
もしこれを忘れた場合は該当caseのすぐ下にあるcaseのstatementsロジックも実行される。ただし意図的に`break`を入れずにロジックを実装する場合もありその時はその意図を明確に示す必要がある。

### 2.3. default

すべてのcaseが一致しない場合に実行されるcaseである。下にはこれ以上のcaseがないため`break`を省略しても問題ないがすべてのcaseの最後にbreakを追加する習慣をつけよう。そうしないとうっかり忘れることがある。

簡単な例を実行してみよう。

```objectivec
char operator = '*';

switch(operator) {
    case '+':
        NSLog(@"足し算" );
        break;
    case '-':
        NSLog(@"引き算" );
        break;
    case '*':
        NSLog(@"掛け算" );
        break;
    case '/':
        NSLog(@"割り算" );
        break;
    default:
        NSLog(@"有効な演算子ではない" );
        break;
}
```

```bash
掛け算
Program ended with exit code: 0
```

`*`ケースのbreakを外してみよう。

```objectivec
char operator = '*';

switch(operator) {
    case '+':
        NSLog(@"足し算" );
        break;
    case '-':
        NSLog(@"引き算" );
        break;
    case '*':
        NSLog(@"掛け算" );
    case '/':
        NSLog(@"割り算" );
        break;
    default:
        NSLog(@"有効な演算子ではない" );
        break;
}
```

```bash
掛け算
割り算
Program ended with exit code: 0
```

意図しない誤った結果が出た。`*` caseの下にある`/`ケースのロジックまで実行された。常に意図しない`break`の漏れに注意しよう。

`break`を意図的に省いて以下のように複数のケースで共通の特定ロジックを実行させることもできる。

```objectivec
char operator = '*';

switch(operator) {
    case '+':
        NSLog(@"足し算" );
        break;
    case '-':
        NSLog(@"引き算" );
        break;
    case '*':
    case 'x':
        NSLog(@"掛け算" );
        break;
    case '/':
        NSLog(@"割り算" );
        break;
    default:
        NSLog(@"有効な演算子ではない" );
        break;
}
```

```bash
掛け算
Program ended with exit code: 0
```

このような場合は上で述べた通りコード自体で十分に意図が表現されるようにするか、それが不可能な場合はコメントをしっかり書いておこう。

# 参考

- <https://www.tutorialspoint.com/objective_c/switch_statement_in_objective_c.htm>
