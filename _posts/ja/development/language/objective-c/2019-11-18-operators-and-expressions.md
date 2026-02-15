---
date: 2019-11-18T00:00+09:00
title: "[Objective-C] 演算子と式 - Operators and Expressions"
ref: objective-c-operators-and-expressions
lang: ja
excerpt: "Objective-Cの演算子と式をまとめる。"
last_modified_at: 2019-11-18T13:12+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/objective-c-operators-and-expressions.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/objective-c-operators-and-expressions.png"
categories:
  - Development
  - Language
  - Objective-C
tags:
  - Development
  - Language
  - Objective-C
  - Operator
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Language"
    url: /ja/development/language/
  - title: "Objective-C"
    url: /ja/development/language/objective-c/
---

# 概要

Objective-Cの演算子と式をまとめる。

# 注意

本記事は`Objective-C 2.0`を基準に作成された。

# はじめに

Objective-Cで提供される演算子と式を見る前に、大学でプログラミング言語論とコンパイラ論を受講した記憶を振り返ってみよう。
ほとんどのコンパイラは以下のような一連のコンパイル過程を経ると学んだ。

- 字句解析 (lexical analyze)
- 構文解析 (syntax analyze)
- 意味解析 (semantic analyze)
- IR生成 (intermediate representation)
- 最適化 (optimization)
- コード生成 (code generation)

LL構文解析、LR構文解析、SLR構文解析、クロージャ、非終端記号など学校でコンパイラ論を勉強する時は頭が良くなくて苦労したが、少しでも覚えているということは無駄ではなかったようだ。

上記の過程のうち字句解析、構文解析、意味解析段階ではシンボルテーブルを活用してトークンとパースツリー、抽象構文木を生成し、文法的もしくは意味的にプログラミング言語の定義に適合するか検査を行う。
通常ここまでの過程をコンパイラのフロントエンドと見ることができるが、Objective-Cは`LLVM`のフロントエンドである`Clang`を通じてこれらの過程を実行する。

我々はClang先輩が書いた式を正しく解析してお怒りにならないよう、決められたルールに従ってプログラムを作成しなければならない。Objective-Cの演算子と式をまとめる記事になぜコンパイラの話かと思うかもしれないが、必要以上に複雑な入れ子になった演算式や式はコンパイル性能に大きな影響を与えることもあるため、これを考慮して最大限シンプルかつ明確に演算子と式を使用することも重要である。

ではObjective-Cの演算子と式をまとめていこう。

# まとめ

## 1. 式 (Expressions)

Objective-Cの基本的な式は以下のように演算子と2つのオペランド、1つの代入で構成される。

```objectivec
int price = 12 + 25;
```

`int` : データ型
`price` : 変数名
`=` : 代入演算子
`10` : オペランド1
`+` : 算術演算子
`20` : オペランド2
`;` : ステートメントセパレータ

上記の式の結果を出力すると以下のようになる。

```objectivec
NSLog(@"price = %d", price);
```

```bash
price = 37
Program ended with exit code: 0
```

## 2. 演算子 (Operators)

### 2.1. 代入演算子 (Assignment Operator)

代入演算子は演算子の右側にある値や値の演算結果を演算子の左側にある変数に代入する。

```objectivec
int price = 10 + 20;
NSLog(@"price = %d", price);

price = 12;
NSLog(@"price = %d", price);
```

```bash
price = 30
price = 12
Program ended with exit code: 0
```

### 2.2. 算術演算子 (Arithmetic Operators)

算術演算子は加算、減算、除算、乗算、剰余演算など数学式を記述するための演算子である。
単項演算子または二項演算子として使用できる。

```objectivec
int price = 10;

// 符号反転
price = -price;
NSLog(@"price = %d", price);

// 加算
price = 13 + 20;
NSLog(@"price = %d", price);

// 減算
price = 10 - 27;
NSLog(@"price = %d", price);

// 乗算
price = 12 * 20;
NSLog(@"price = %d", price);

// 除算
price = 11 / 9;
NSLog(@"price = %d", price);

// 剰余演算
price = 3 % 2;
NSLog(@"price = %d", price);
```

```bash
price = -10
price = 33
price = -17
price = 240
price = 1
price = 1
Program ended with exit code: 0
```

### 2.3. 複合代入演算子 (Compound Assignment Operators)

複合代入演算子はビット演算子や算術演算子が代入演算子と結合された形態である。

```objectivec
int price = 10;

// price = price + 13;
price += 13;
NSLog(@"price = %d", price);

// price = price - 10;
price -= 10;
NSLog(@"price = %d", price);

// price = price * 12;
price *= 12;
NSLog(@"price = %d", price);

// price = price / 9;
price /= 9;
NSLog(@"price = %d", price);

// price = price % 3;
price %= 3;
NSLog(@"price = %d", price);

// price = price & 10;
price &= 10;
NSLog(@"price = %d", price);

// price = price | 12;
price |= 12;
NSLog(@"price = %d", price);

// price = price ^ 29;
price ^= 29;
NSLog(@"price = %d", price);

// price = price << 17;
price <<= 17;
NSLog(@"price = %d", price);

// price = price >> 2;
price >>= 2;
NSLog(@"price = %d", price);
```

```bash
price = 23
price = 13
price = 156
price = 17
price = 2
price = 2
price = 14
price = 19
price = 2490368
price = 622592
Program ended with exit code: 0
```

### 2.4. インクリメント・デクリメント演算子 (Increment and Decrement Operators)

インクリメント・デクリメント演算子はオペランドの値を1だけ増加または減少させるために使用される。
前置と後置によって意図した結果が変わる可能性があるため注意して使用する必要がある。

```objectivec
// 前置インクリメント
int price1 = 10;
NSLog(@"%d", ++price1);

// 後置インクリメント
int price2 = 10;
NSLog(@"%d", price2++);

// 前置デクリメント
int price3 = 10;
NSLog(@"%d", --price3);

// 後置デクリメント
int price4 = 10;
NSLog(@"%d", price4--);
```

```bash
price = 11
price = 10
price = 9
price = 10
Program ended with exit code: 0
```

### 2.5. 比較演算子 (Comparison Operators)

比較演算子は文字通り与えられた2つのオペランドを比較するために使用される。

```objectivec
int price1 = 10;
int price2 = 12;

BOOL result1 = price1 != price2;
NSLog(@"%d", result1);

BOOL result2 = price1 == price2;
NSLog(@"%d", result2);

BOOL result3 = price1 > price2;
NSLog(@"%d", result3);

BOOL result4 = price1 < price2;
NSLog(@"%d", result4);

BOOL result5 = price1 >= price2;
NSLog(@"%d", result5);

BOOL result6 = price1 <= price2;
NSLog(@"%d", result6);
```

```bash
result1 = 1
result2 = 0
result3 = 0
result4 = 1
result5 = 0
result6 = 1
Program ended with exit code: 0
```

### 2.6. 論理演算子 (Boolean Logical Operators)

論理演算子も文字通り与えられたオペランドに対する論理演算を提供する。左側のオペランドの条件によって次のオペランドの条件確認をしない場合もある。(Short Circuit Evaluation)

```objectivec
BOOL condition1 = NO;
BOOL condition2 = YES;

BOOL result1 = condition1 && condition2;
NSLog(@"result1 = %d", result1);

BOOL result2 = condition1 || condition2;
NSLog(@"result2 = %d", result2);

BOOL result3 = !condition1;
NSLog(@"result3 = %d", result3);
```

```bash
result1 = 0
result2 = 1
result3 = 1
Program ended with exit code: 0
```

### 2.7. 三項演算子 (Ternary Operators)

三項演算子は`?`の前の与えられた条件を見て条件が真なら真の式を、偽なら偽の式を採用する。

```objectivec
int price1 = 20;
int price2 = 10;

int max = price1 > price2 ? price1 : price2;
NSLog(@"max = %d", max);
```

```bash
max = 20
Program ended with exit code: 0
```

op1 `?:` op2の形でも使用でき、op1が真ならop1を、偽ならop2を採用する。

```objectivec
BOOL condition1 = YES;
BOOL condition2 = NO;

BOOL result = condition1 ?: condition2;
NSLog(@"result = %d", result);
```

```bash
result = 1
Program ended with exit code: 0
```

### 2.8. ビット演算子 (Bitwise Operators)

ビット演算子はデータの2進演算を提供する。

```objectivec
int price1 = 21;
int price2 = 11;

// BCD CDOE (8421)
// 21 = 0001 0101
// 11 = 0000 1011

// result1 = 0000 0001 = 0001 0101 & 0000 1011
int result1 = price1 & price2;
NSLog(@"result1 = %d", result1);

// result2 = 0001 1111 = 0001 0101 | 0000 1011
int result2 = price1 | price2;
NSLog(@"result2 = %d", result2);

// result3 = 0001 1110 = 0001 0101 ^ 0000 1011
int result3 = price1 ^ price2;
NSLog(@"result3 = %d", result3);

// result4 = 1110 1010 = ~0001 0101
int result4 = ~price1;
NSLog(@"result4 = %d", result4);

// result5 = 0010 1010 = 0001 0101 << 1
int result5 = price1 << 1;
NSLog(@"result5 = %d", result5);

// result6 = 0000 1010 = 0001 0101 >> 1
int result6 = price1 >> 1;
NSLog(@"result6 = %d", result6);
```

```bash
result1 = 1
result2 = 31
result3 = 30
result4 = -22
result5 = 42
result6 = 10
Program ended with exit code: 0
```

### 2.9. 型変換演算子 (Type Conversion Operator)

型変換演算子は演算子の右側にあるデータを明示的に特定のデータ型に変換するために使用され、データ損失が発生する可能性もある。

```objectivec
int conversion = (int)22.5;
NSLog(@"%d", conversion);
```

```bash
casconversiont = 22
Program ended with exit code: 0
```

また特定クラスのインスタンスを明示的に別のクラスのインスタンスに変換することもできる。
主にidデータ型のインスタンスを特定クラスのインスタンスにキャストしたり、継承構造を持つインスタンスをアップキャストまたはダウンキャストするために使用する。

```objectivec
id sushi = [[SalmonSushi alloc] init];
SalmonSushi *a = (SalmonSushi *)sushi;
```

```objectivec
Child *child = [[Child alloc] init];
Parent *parent = (Parent *)child;
```

## 3. 結合方向 (Associativity)

| Category       | Operator                            | Associativity |
| -------------- | ----------------------------------- | ------------- |
| Postfix        | () [] -> . ++ \-\-                  | Left to right |
| Unary          | + - ! ~ ++ \-\- (type)\* & sizeof   | Right to left |
| Multiplicative | \* / %                              | Left to right |
| Additive       | + -                                 | Left to right |
| Shift          | << >>                               | Left to right |
| Relational     | < <= > >=                           | Left to right |
| Equality       | == !=                               | Left to right |
| Bitwise AND    | &                                   | Left to right |
| Bitwise XOR    | ^                                   | Left to right |
| Bitwise OR     | \|                                  | Left to right |
| Logical AND    | &&                                  | Left to right |
| Logical OR     | \|\|                                | Left to right |
| Conditional    | ?:                                  | Right to left |
| Assignment     | = += -= \*= /= %= >>= <<= &= ^= \|= | Right to left |
| Comma          | ,                                   | Left to right |

優先順位が最も高い演算子を表の最上部に配置し、下に行くほど優先順位は低くなる。演算子の中で優先順位が最も高いものを先に評価する。

# 参考

- <https://www.techotopia.com/index.php/Objective-C_Operators_and_Expressions>
- <https://www.tutorialspoint.com/objective_c/objective_c_operators.htm>
- <https://codescracker.com/objective-c/objective-c-operators.htm>
