---
date: 2019-11-15T00:00+09:00
title: "[Objective-C] プリミティブデータ型(Primitive Data Types)"
ref: objective-c-primitive-data-types
lang: ja
excerpt: "Objective-Cのプリミティブデータ型をまとめる。"
last_modified_at: 2019-11-15T13:12+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/objective-c-primitive-data-types.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/objective-c-primitive-data-types.png"
categories:
  - Development
  - Language
  - Objective-C
tags:
  - Development
  - Language
  - Objective-C
  - Data Type
depth:
  - title: "Development"
    url: /ja/development/
  - title: "Language"
    url: /ja/development/language/
  - title: "Objective-C"
    url: /ja/development/language/objective-c/
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: binaryloader
---

# 概要

Objective-Cのプリミティブデータ型をまとめる。

# 注意

本記事は`Objective-C 2.0`を基準に作成された。

# はじめに

Objective-Cを初めて勉強する際には、Foundationが提供するClassやType Aliasで再定義されたデータ型を厳密に区別して学習することが良いと考える。今回の記事ではPrimitive Data Typesについてまとめていく。

Objective-CはANSI Cの`strict superset`であるため、ANSI Cが提供するほとんどのデータ型だけでなく構造体(struct)や共用体(union)も使用できる。

# まとめ

## 1. 文字データ型

### 1.1. char(32bit / 64bit)

| TYPE          | サイズ | 表現範囲                  |
| ------------- | ------ | ------------------------- |
| signed char   | 1byte  | Min : -128<br />Max : 127 |
| unsigned char | 1byte  | Min : 0<br />Max : 255    |

{: .notice--info}
参考: charに格納されるデータ自体は整数だが、文字データ型として扱われる場合があるため整数データ型とは別に分類した。charは整数データ型であり文字データ型でもある。

## 2. 整数データ型

### 2.1. short int(32bit / 64bit)

| TYPE               | サイズ | 表現範囲                        |
| ------------------ | ------ | ------------------------------- |
| signed short int   | 2byte  | Min : -32,768<br />Max : 32,767 |
| unsigned short int | 2byte  | Min : 0<br />Max : 65,535       |

### 2.2. int(32bit / 64bit)

| TYPE         | サイズ | 表現範囲                                      |
| ------------ | ------ | --------------------------------------------- |
| signed int   | 4byte  | Min : -2,147,483,648<br />Max : 2,147,483,647 |
| unsigned int | 4byte  | Min : 0<br />Max : 4,294,967,295              |

### 2.3. long int(32bit)

| TYPE              | サイズ | 表現範囲                                      |
| ----------------- | ------ | --------------------------------------------- |
| signed long int   | 4byte  | Min : -2,147,483,648<br />Max : 2,147,483,647 |
| unsigned long int | 4byte  | Min : 0<br />Max : 4,294,967,295              |

### 2.4. long int(64bit)

| TYPE              | サイズ | 表現範囲                                                              |
| ----------------- | ------ | --------------------------------------------------------------------- |
| signed long int   | 8byte  | Min : -9,223,372,036,854,775,808<br />Max : 9,223,372,036,854,775,807 |
| unsigned long int | 8byte  | Min : 0<br />Max : 18,446,744,073,709,551,615                         |

### 2.5. long long int(32bit / 64bit)

| TYPE                   | サイズ | 表現範囲                                                              |
| ---------------------- | ------ | --------------------------------------------------------------------- |
| signed long long int   | 8byte  | Min : -9,223,372,036,854,775,808<br />Max : 9,223,372,036,854,775,807 |
| unsigned long long int | 8byte  | Min : 0<br />Max : 18,446,744,073,709,551,615                         |

## 3. 浮動小数点データ型

### 3.1. float(32bit / 64bit)

| TYPE  | サイズ | 表現範囲                                   |
| ----- | ------ | ------------------------------------------ |
| float | 4byte  | Min : 1.175494e-38<br />Max : 3.402823e+38 |

### 3.2. double(32bit / 64bit)

| TYPE   | サイズ | 表現範囲                                     |
| ------ | ------ | -------------------------------------------- |
| double | 8byte  | Min : 2.225074e-308<br />Max : 1.797693e+308 |

## 4. 論理データ型

### 4.1. BOOL

論理値を表すために使われるBOOLは実はtypedefで再定義されたデータ型である。
コンパイラの種類やバージョン、またはバイナリが実行されるプラットフォーム環境によって`int`または`char`が再定義された形態となる。
C言語ではC99以前にBOOLデータ型を開発者が以下のように自分で定義して使用していた。

```objectivec
typedef int bool

#define false 0
#define true  1

bool bValue;
bValue = true;
```

その後C99でブール値を格納するデータ型が正式に導入された。上記の例のように開発者たちはすでにC99以前から`int`データ型を`bool`として再定義して使用していたため、`bool`というキーワードではサポートできず、`_BOOL`というキーワードで論理値を表すデータ型をサポートした。

```objectivec
// stdbool.h

typedef _Bool bool;

#define true   (_Bool)1
#define false  (_Bool)0
```

しかし`_BOOL`は`bool`に比べて少し長いため、上記で見られるように`stdbool.h`で別途`bool`データ型を定義して提供した。そのためC99で`_BOOL`の代わりに`bool`を使用したい場合は`stdbool.h`をincludeする必要がある。

ところで今見ているのはObjective-Cなのになぜ C言語の話を長々としているのか不思議に思うかもしれない。記事の冒頭で述べたようにObjective-CはC言語の`strict superset`であるため、Objective-CでもBOOLはコンパイラの種類やバージョン、プラットフォーム環境によって元のデータ型が`int`になることも`char`になることもあった。

あったって？ なることもあるではなく、なることもあったとはどういうことか？それはXcodeがClangを採用する前に使用していたGCC時代の話である。GCC時代にはバージョンによって元のデータ型が`int`になることも`char`になることもあった。

以前はこのようなブール値を表すデータ型の違いによる問題が多く発生していたそうだ。現在はCコンパイラがANSI C基準をある程度よく遵守しているためブールデータ型として採用する元のデータ型がほぼ同一になり、true/false論理値も0と1にしっかり補正されるため問題が発生しない。

過渡期にはブールデータ型に0と1以外のデータ(元のデータ型が表現できるデータ)が入ることもあり、true/false比較の論理的欠陥による問題が多かったそうだ。さらにANSI C標準を本当に遵守しなかったVisual Studioの旧バージョンでは`bool`は`char`、`BOOL`は`int`で開発者をさらに混乱させるケースもあったそうだ。こうした歴史を覚えておいて、古いバージョンのCコンパイラでブールデータ型を使う場合にはもう少し注意を払おう。

ではClangを採用した現在のXcodeではどうだろう？気になるので直接確認してみよう。

まずmacOS SDKとiOS SDKにある`objc.h`を見てみよう。

```objectivec
// objc.h

/// Type to represent a boolean value.

#if defined(__OBJC_BOOL_IS_BOOL)
    // Honor __OBJC_BOOL_IS_BOOL when available.
#   if __OBJC_BOOL_IS_BOOL
#       define OBJC_BOOL_IS_BOOL 1
#   else
#       define OBJC_BOOL_IS_BOOL 0
#   endif
#else
    // __OBJC_BOOL_IS_BOOL not set.
#   if TARGET_OS_OSX || TARGET_OS_MACCATALYST || ((TARGET_OS_IOS || 0) && !__LP64__ && !__ARM_ARCH_7K)
#      define OBJC_BOOL_IS_BOOL 0
#   else
#      define OBJC_BOOL_IS_BOOL 1
#   endif
#endif

#if OBJC_BOOL_IS_BOOL
    typedef bool BOOL;
#else
#   define OBJC_BOOL_IS_CHAR 1
    typedef signed char BOOL;
    // BOOL is explicitly signed so @encode(BOOL) == "c" rather than "C"
    // even if -funsigned-char is used.
#endif
```

おお！ヘッダからBOOL関連の内容だけ抜粋してきたのに複雑だ。
それでも一つずつ見ていこう。

#### 4.1.1. 決定条件1

```objectivec
#if defined(__OBJC_BOOL_IS_BOOL)
    // Honor __OBJC_BOOL_IS_BOOL when available.
#   if __OBJC_BOOL_IS_BOOL
#       define OBJC_BOOL_IS_BOOL 1
#   else
#       define OBJC_BOOL_IS_BOOL 0
#   endif
#else
```

`__OBJC_BOOL_IS_BOOL`が定義されている場合はこの値に応じて`OBJC_BOOL_IS_BOOL`を`0`または`1`で定義する。

#### 4.1.2. 決定条件2

```objectivec
#else
    // __OBJC_BOOL_IS_BOOL not set.
#   if TARGET_OS_OSX || TARGET_OS_MACCATALYST || ((TARGET_OS_IOS || 0) && !__LP64__ && !__ARM_ARCH_7K)
#      define OBJC_BOOL_IS_BOOL 0
#   else
#      define OBJC_BOOL_IS_BOOL 1
#   endif
#endif
```

`__OBJC_BOOL_IS_BOOL`が定義されていない場合はターゲットOS、プラットフォーム、アーキテクチャの種類に応じて`OBJC_BOOL_IS_BOOL`を`0`または`1`で定義する。

#### 4.1.3. 決定条件3

```objectivec
#if OBJC_BOOL_IS_BOOL
    typedef bool BOOL;
#else
#   define OBJC_BOOL_IS_CHAR 1
    typedef signed char BOOL;
    // BOOL is explicitly signed so @encode(BOOL) == "c" rather than "C"
    // even if -funsigned-char is used.
#endif
```

決定条件1と決定条件2によって決定された`OBJC_BOOL_IS_BOOL`が真であればboolをBOOLとして再定義し、偽であればsigned charをBOOLとして再定義する。

#### 4.1.4. 決定条件が正しいかテストしてみよう

おお！ヘッダを見てだいたいわかった。ではコードを書いてデバッグしながら確認してみよう。
まずmacOS Command Line Toolプロジェクトを作成し、以下のようにコードを書いてみる。

```objectivec
NSLog(@"__OBJC_BOOL_IS_BOOL = %@", __OBJC_BOOL_IS_BOOL ? @"defined" : @"undefined");
NSLog(@"TARGET_OS_OSX = %@", TARGET_OS_OSX ? @"YES" : @"NO");
NSLog(@"OBJC_BOOL_IS_BOOL = %@", OBJC_BOOL_IS_BOOL ? @"YES" : @"NO");
NSLog(@"OBJC_BOOL_IS_CHAR = %@", OBJC_BOOL_IS_CHAR ? @"YES" : @"NO");
```

結果は以下の通りだった。

```bash
__OBJC_BOOL_IS_BOOL = undefined
TARGET_OS_OSX = YES
OBJC_BOOL_IS_BOOL = NO
OBJC_BOOL_IS_CHAR = YES
Program ended with exit code: 0
```

先ほどまとめた3つの決定条件を見ながら出力結果を理解すると以下のように言えるだろう。

「Xcode 11.5、macOS 10.15 SDKでビルドしたmacOS Command Line Toolをx86_64、macOS Catalina 10.15.4環境で実行した場合、BOOLはcharを再定義したデータ型である。」

ではiOSデバイスでもテストしてみよう。iOS Single View Appプロジェクトを作成し、以下のようにコードを書いてみる。

```objectivec
NSLog(@"__OBJC_BOOL_IS_BOOL = %@", __OBJC_BOOL_IS_BOOL ? @"defined" : @"undefined");
NSLog(@"TARGET_OS_OSX = %@", TARGET_OS_OSX ? @"YES" : @"NO");
NSLog(@"OBJC_BOOL_IS_BOOL = %@", OBJC_BOOL_IS_BOOL ? @"YES" : @"NO");
```

結果は以下の通りだった。

```bash
__OBJC_BOOL_IS_BOOL = defined
TARGET_OS_OSX = NO
OBJC_BOOL_IS_BOOL = YES
Program ended with exit code: 0
```

おっ！これは以下のようにも言えるだろう。

「Xcode 11.5、iOS 13.5 SDKでビルドしたiOS Single View AppをiPhone 11 Pro、arm64、iOS 13.5.1環境で実行した場合、BOOLはintを再定義したデータ型である。
なぜならBOOLはboolを再定義したデータ型であり、boolはintを再定義したデータ型だからだ。」

ブー、違っていた。私が最後に使っていたC開発環境ではboolがintだったのでObjective-Cでも当然intだと思っていたがcharデータ型だった。
最初はsizeofで1が出た時は戸惑ったが、[Apple開発者ドキュメント](https://developer.apple.com/documentation/objectivec/bool)を調べるとこれに関する内容がしっかり記載されていた。

結局BOOLは以下の表で表現できるだろう。

| TYPE | Typedef     | 真  | 偽 |
| ---- | ----------- | --- | -- |
| BOOL | signed char | YES | NO |

#### 4.1.5. ヒント：プロセッサアーキテクチャの確認方法

Linuxでやっていたようにプロセッサアーキテクチャを確認しようと以下のコマンドを実行した。

```bash
arch
i386
```

結果は`i386`が出力された。いやいや、そんなはずがない。私のMacは64bitのはずなのにこれはどういうことだ？
驚いてGoogleで検索してみた。

- [Stack Exchange Question1](https://unix.stackexchange.com/questions/518318/what-does-i386-mean-on-macos-mojave)
- [Stack Exchange Question2](https://apple.stackexchange.com/questions/140651/why-does-arch-output-i386)

なるほど、Macでは`arch`はPowerPCかIntel CPUかによってIntel CPUの場合は無条件で`i386`を返すそうだ。つまり`i386`が出たら`2-way universal`か`32-bit only`のどちらかということだ。

ではmachine hardware nameを確認してみよう。以下のコマンドを実行すればよい。

```bash
machine
x86_64h
```

または

```bash
uname -m
x86_64
```

そうだよね。そんなはずがないよね。安心〜

## 5. インスタンスポインタ型

### 5.1. id(32bit)

| TYPE | サイズ | 表現範囲          |
| ---- | ------ | ----------------- |
| id   | 4byte  | インスタンスポインタ |

### 5.2. id(64bit)

| TYPE | サイズ | 表現範囲          |
| ---- | ------ | ----------------- |
| id   | 8byte  | インスタンスポインタ |

```objectivec
// objc.h

/// An opaque type that represents an Objective-C class.
typedef struct objc_class *Class;

/// Represents an instance of a class.
struct objc_object {
    Class _Nonnull isa  OBJC_ISA_AVAILABILITY;
};

/// A pointer to an instance of a class.
typedef struct objc_object *id;
```

idが表現できるデータはインスタンスポインタと言ったがもう少し厳密に言うとisaポインタをインスタンス変数として持っている構造体objc_objectのポインタを格納できる。
C言語のvoidポインタと同じ役割を果たし、idポインタを利用してポリモーフィズム、つまり動的バインディングと動的型付けを実装できる。isaはObjective-Cランタイムを扱う際に詳しくまとめる。

## 6. フォーマット指定子型

| データ型               | フォーマット文字     |
| ---------------------- | ------------------- |
| char                   | %c                  |
| signed short int       | %hd %hi %hx %ho     |
| unsigned short int     | %hu %hx %ho         |
| signed int             | %d %i %x %o         |
| unsigned int           | %u %x %o            |
| signed long int        | %ld %li %lx %lo     |
| unsigned long int      | %lu %lx %lo         |
| signed long long int   | %lld %lli %llx %llo |
| unsigned long long int | %llu %llx %llo      |
| float                  | %f %e %g %a         |
| double                 | %f %e %g %a         |
| id                     | %p                  |

Xcode 12でテストしてみたがsignedとunsigned間でフォーマット文字を混用してもビルド警告はなかった。それでも下位互換性と問題対策のためにはこれらを区別して正確に使用するのが良いだろう。

# 自分の目で直接確認してみよう

では各データ型のサイズと最小値、最大値を直接確認してみよう。
私は32bitデバイスを持っていないため64bitデバイスでのみ確認する。

## 1. まず各データ型のサイズを見てみよう

### 1.1. 文字データ型

#### 1.1.1. char(64bit)

```objectivec
NSLog(@"size of char is %ld", sizeof(char));
NSLog(@"size of unsigned char is %ld", sizeof(unsigned char));
```

```bash
size of char is 1
size of unsigned char is 1
Program ended with exit code: 0
```

### 1.2. 整数データ型

#### 1.2.1. short int(64bit)

```objectivec
NSLog(@"size of short int is %ld", sizeof(short int));
NSLog(@"size of unsigned short int is %ld", sizeof(unsigned short int));
```

```bash
size of short int is 2
size of unsigned short int is 2
Program ended with exit code: 0
```

#### 1.2.2. int(64bit)

```objectivec
NSLog(@"size of int is %ld", sizeof(int));
NSLog(@"size of unsigned int is %ld", sizeof(unsigned int));
```

```bash
size of int is 4
size of unsigned int is 4
Program ended with exit code: 0
```

#### 1.2.3. long int(64bit)

```objectivec
NSLog(@"size of long int is %ld", sizeof(long int));
NSLog(@"size of unsigned long int is %ld", sizeof(unsigned long int));
```

```bash
size of long int is 8
size of unsigned long int is 8
Program ended with exit code: 0
```

#### 1.2.4. long long int(64bit)

```objectivec
NSLog(@"size of long long int is %ld", sizeof(long long int));
NSLog(@"size of unsigned long long int is %ld", sizeof(unsigned long long int));
```

```bash
size of long long int is 8
size of unsigned long long int is 8
Program ended with exit code: 0
```

### 1.3. 浮動小数点データ型

#### 1.3.1. float(64bit)

```objectivec
NSLog(@"size of float is %ld", sizeof(float));
```

```bash
size of float is 4
Program ended with exit code: 0
```

#### 1.3.2. double(64bit)

```objectivec
NSLog(@"size of double is %ld", sizeof(double));
```

```bash
size of double is 8
Program ended with exit code: 0
```

### 1.4. 論理データ型

#### 1.4.1. BOOL(64bit)

```objectivec
NSLog(@"size of BOOL is %ld", sizeof(BOOL));
```

```bash
size of BOOL is 1
Program ended with exit code: 0
```

### 1.5. インスタンスポインタ型

#### 1.5.1. id(64bit)

```objectivec
NSLog(@"size of id is %ld", sizeof(id));
```

```bash
size of id is 8
Program ended with exit code: 0
```

## 2. 次に各データ型の最小値と最大値を出力してみよう

### 2.1. 文字データ型

#### 2.1.1. char(64bit)

```objectivec
NSLog(@"CHAR MIN is %d, CHAR MAX is %d", CHAR_MIN, CHAR_MAX);
NSLog(@"UCHAR MAX is %u", UCHAR_MAX);
```

```bash
CHAR MIN is -128, CHAR MAX is 127
UCHAR MAX is 255
Program ended with exit code: 0
```

### 2.2. 整数データ型

#### 2.2.1. short int(64bit)

```objectivec
NSLog(@"SHRT MIN is %hd, SHRT MAX is %hd", SHRT_MIN, SHRT_MAX);
NSLog(@"USHRT MAX is %hu", USHRT_MAX);
```

```bash
SHRT MIN is -32768, SHRT MAX is 32767
USHRT MAX is 65535
Program ended with exit code: 0
```

#### 2.2.2. int(64bit)

```objectivec
NSLog(@"INT MIN is %d, INT MAX is %d", INT_MIN, INT_MAX);
NSLog(@"UINT MAX is %u", UINT_MAX);
```

```bash
INT MIN is -2147483648, INT MAX is 2147483647
UINT MAX is 4294967295
Program ended with exit code: 0
```

#### 2.2.3. long int(64bit)

```objectivec
NSLog(@"LONG MIN is %ld, LONG MAX is %ld", LONG_MIN, LONG_MAX);
NSLog(@"ULONG MAX is %lu", ULONG_MAX);
```

```bash
LONG MIN is -9223372036854775808, LONG MAX is 9223372036854775807
ULONG MAX is 18446744073709551615
Program ended with exit code: 0
```

#### 2.2.4. long long int(64bit)

```objectivec
NSLog(@"LLONG MIN is %lld, LLONG MAX is %lld", LLONG_MIN, LLONG_MAX);
NSLog(@"ULLONG MAX is %llu", ULLONG_MAX);
```

```bash
LLONG MIN is -9223372036854775808, LLONG MAX is 9223372036854775807
ULLONG MAX is 18446744073709551615
Program ended with exit code: 0
```

### 2.3. 浮動小数点データ型

#### 2.3.1. float(64bit)

```objectivec
NSLog(@"FLT MIN is %f, FLT MAX is %f", FLT_MIN, FLT_MAX);
```

```bash
FLT MIN is 0.000000, FLT MAX is 340282346638528859811704183484516925440.000000
Program ended with exit code: 0
```

#### 2.3.2. double(64bit)

```objectivec
NSLog(@"DBL MIN is %f, DBL MAX is %f", DBL_MIN, DBL_MAX);
```

```bash
DBL MIN is 0.000000, DBL MAX is 179769313486231570814527423731704356798070567525844996598917476803157260780028538760589558632766878171540458953514382464234321326889464182768467546703537516986049910576551282076245490090389328944075868508455133942304583236903222948165808559332123348274797826204144723168738177180919299881250404026184124858368.000000
Program ended with exit code: 0
```

### 2.4. 論理データ型

#### 2.4.1. BOOL(64bit)

```objectivec
BOOL yes = YES;
BOOL no = NO;

NSLog(@"YES is %d", yes);
NSLog(@"NO is %d", no);
```

```bash
YES is 1
NO is 0
Program ended with exit code: 0
```

### 2.5. インスタンスポインタ型

#### 2.5.1. id(64bit)

```objectivec
id object = [[NSObject alloc] init];
NSLog(@"object address is %p", &object);
```

```bash
object address is 0x7ffeeb41b078
Program ended with exit code: 0
```

このメモリアドレスは実行のたびに変更される。

ここまでObjective-Cで提供するプリミティブデータ型を見てきた。私のように勉強する時に底まで見ないと気が済まない性格の人は「NSIntegerとintの違いは何？」「CGFloatとfloatの違いは何？」
という疑問がさらに生まれるかもしれない。これは直接ヘッダを開いて確認してみよう。ヘッダは仕様そのものである。

実際の開発ではアーキテクチャ環境やプラットフォームに応じて適切なデータ型をtypedefで再定義したデータ型を主に使用すると思う。
しかしプリミティブデータ型をよく理解していることがいつか役に立つ時が来ると考えている。

[+] 32bitデバイスをお持ちの方は上記のコードを実行して結果をコメントに残していただければ本文を更新する。

# 参考

- <https://andybargh.com/primitive-data-types-objective-c/>
- <https://code.tutsplus.com/tutorials/objective-c-succinctly-data-types--mobile-21986>
- <https://www.tutorialspoint.com/objective_c/objective_c_data_types.htm>
