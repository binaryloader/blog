---
date: 2021-01-15T00:00+09:00
title: "[Objective-C] クラスとメソッド、インスタンス(Class and Method, Instance)"
ref: objective-c-class-instance-method
lang: ja
excerpt: "Objective-Cのクラスとメソッドそしてインスタンスをまとめる。"
last_modified_at: 2021-01-15T18:31+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/objective-c-class-instance-method.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ja/objective-c-class-instance-method.png"
categories:
  - Development
  - Language
  - Objective-C
tags:
  - Development
  - Language
  - Objective-C
  - OOP
  - Class
  - Method
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

Objective-Cのクラスとメソッドそしてインスタンスをまとめる。

# 注意

本記事は`Objective-C 2.0`を基準に作成された。

# はじめに

Objective-Cはオブジェクト指向プログラミングをサポートする言語である。1980年代初頭、ブラッド・コックスとトム・ラブはC言語にSmalltalk形式のオブジェクト指向の概念を導入した。
他のOOP言語と同様に現実世界の「あるもの」をコンピュータ世界の`オブジェクト(Object)`としてその概念とコンセプトを実装でき、このオブジェクトは`クラス(Class)`という設計図で定義できる。
またクラスで定義されたオブジェクトをメモリに割り当てて実体化することで`インスタンス(Instance)`にすることができる。今回の記事ではこのようなオブジェクト指向プログラミングをObjective-Cの文法でどのようにサポートしているかまとめていく。

# まとめ

## 1. クラス

クラスは以下の2つの領域で構成される。これから出てくるサンプルコードのようにインスタンス変数自体を宣言して使用する場合にはOOPのカプセル化と隠蔽が破れるケースが生じたり、一つ一つアクセスメソッドを作成する必要がある。
そのためプロパティが導入されて以降はインスタンス変数を直接宣言することは推奨されておらず使用もされていない。またインスタンス変数を宣言した場所によってそれぞれ長所と短所が存在するがこのような内容は別の記事で詳しくまとめる。
今回の記事ではプロパティなどの文法は除外してクラス自体に集中する。

### 1.1. interface

interfaceはクラスを定義しインスタンス変数やメソッド、プロパティなどを宣言する部分である。ここで宣言した内容は継承時にその子クラスが同様に承継し、インスタンス変数の場合は指定されたAccess Modifierに応じて
継承されることもあればされないこともある。ただしinterfaceでインスタンス変数を宣言することは推奨されないため継承を通じた変数承継などやむを得ない状況でのみ限定的に宣言する。

基本的な文法は以下の通りである。

```objectivec
@interface <#class name#> : <#superclass#>

...

@end
```

```objectivec
// Caculator.h

@interface Caculator : NSObject {
@public
    char _operator;
}

- (void)caculateValue:(int)value;
- (void)caculateValue:(int)value withOperator:(char)operator;
- (void)print;

@end
```

NSObjectはほとんどのObjective-Cクラス階層構造のルートクラスでランタイムシステムに対する基本的なインターフェースが実装されている。これを継承した子クラスはObjective-Cオブジェクトとして動作できる。
特定のクラスを継承する場合でなければ基本的にNSObjectクラスを継承する必要がある。

上記のコードはNSObjectクラスを継承したCaculatorクラスを定義している。charデータ型のインスタンス変数を持っており可視性はpublicで外部から直接アクセスできる。
そして3つのインスタンスメソッドを持っている。

### 1.2. implementation

implementationはinterfaceで宣言したメソッドを実際に実装するコードを含んでいる。また外部に直接公開しなかったり子クラスに継承しないインスタンス変数やメソッドを定義できる。

基本的な文法は以下の通りである。

```objectivec
@implementation <#class#>

<#methods#>

@end
```

```objectivec
// Caculator.m

@implementation Caculator {
    int _accumulator;
}

- (void)caculateValue:(int)value {
    [self caculateValue:value withOperator:_operator];
}

- (void)caculateValue:(int)value withOperator:(char)operator {
    switch (operator) {
        case '+':
            _accumulator += value;
            break;
        case '-':
            _accumulator -= value;
            break;
        case '*':
            _accumulator += value;
            break;
        case '/':
            _accumulator /= value;
            break;
        default:
            NSLog(@"サポートされていない演算子。");
            break;
    }
}

- (void)print {
    NSLog(@"%d", _accumulator);
}

@end
```

Caculatorクラスのimplementationはinterfaceで定義した3つのメソッドを実装している。またintデータ型のインスタンス変数を宣言しているが先ほど述べた通りこれは外部に直接公開されたり継承時に子クラスに承継されない。

Objective-Cクラスは1つのファイルにinterfaceとimplementationを一緒に書く場合もまれにあるがほとんどの場合は別々のファイルに書き、interfaceは`*.h`、implementationは`*.m`という拡張子のファイルに記述する。

### 1.3. self

Objective-Cでselfは特別なキーワードである。selfはインスタンス内で自分自身を参照する際に使用し、メソッドの実行主体であるインスタンスのポインタである。

インスタンスメソッド内でインスタンス変数や他のインスタンスメソッドにアクセスする際に使用でき、クラスメソッド内でクラス変数や他のクラスメソッドにアクセスする際に使用できる。

```objectivec
[self caculateValue:value withOperator:_operator];
```

## 2. メソッド

Objective-CはMessage Sending方式を採用しているため「メソッド呼び出し」を「メッセージ送信」とも言う。現場ではコミュニケーションの際にこの2つを混用して使う。
このMessage Sending方式は今後アップロードされるObjective-Cランタイム関連の記事でまとめる。

メソッド宣言の基本的な文法は以下の通りである。

```objectivec
- (void)caculate:(int)value;
```

- `-` : Method Typeで`-`はインスタンスメソッド、`+`はクラスメソッドである。Objective-Cではクラス自体もメタクラスのインスタンスとして存在するためクラスに対してメッセージを送ることが可能である。
- `(void)` : Return Typeでメソッドが返すデータ型を定義する。
- `caculate:` : Method Nameでメソッド名を定義し`:`トークンを通じてパラメータを受け取ることを示す。
- `(int)` : Parameter Typeでパラメータとして受け取るデータ型を定義する。
- `value` : Parameter Nameでパラメータ名を定義する。

以下のような形式でパラメータを複数渡すこともできる。

```objectivec
- (void)caculateValue:(int)value withOperator:(char)operator;
```

クラスメソッドを定義することもできるがMethod Typeを`-`ではなく`+`で宣言すればよい。

```objectivec
+ (void)reset;
```

定義したメソッドは以下のような文法で呼び出せる。

```objectivec
[ClassOrInstance method];
```

1. `[` : 角括弧を開く。
2. `ClassOrInstance` : クラスやインスタンスの名前を書く。
3. ` ` : スペースを1つ置く。
4. `method` : 実行するメソッド名を書く。
5. `]` : 角括弧を閉じる。
6. `;` : セミコロンを追加する。

Message Sendingの観点からは以下のようにも表現できる。

```objectivec
[receiver message];
```

## 3. インスタンス

クラスは以下のようにインスタンス化できる。

```objectivec
[[クラス名 alloc] init];
```

- `alloc` : NSObjectのクラスメソッドでインスタンスが必要とするメモリ空間を割り当て新しいインスタンスを生成する。このメソッドの戻り値として生成されたインスタンスのメモリアドレスが返される。
- `init` : NSObjectのインスタンスメソッドで`alloc`を通じて新しく生成されたインスタンスを使用するために初期化を行う。`alloc`を通じてメモリにインスタンスが割り当てられた直後に呼び出す必要がある。

`alloc`と`init`は以下のようにNSObject.hに定義されている。

```objectivec
// NSObject.h

+ (instancetype)alloc OBJC_SWIFT_UNAVAILABLE("use object initializers instead");
```

```objectivec
// NSObject.h

- (instancetype)init
#if NS_ENFORCE_NSOBJECT_DESIGNATED_INITIALIZER
    NS_DESIGNATED_INITIALIZER
#endif
    ;
```

initializerは以下のようにオーバーライドが可能である。親クラスの初期化メソッドを呼び出して新しく生成されたインスタンスをselfに代入する必要があるがメモリ空間が不足したり何らかの理由で失敗する場合があるためnilチェックが必須である。
もしselfが新しく生成されたインスタンスを正しくリテインしていれば必要な作業を行った後にselfを返す。

```objectivec
- (instancetype)init {
    self = [super init];

    if (self) {
        _operator = '+';
    }

    return self;
}
```

Modern Objective-C以前はinitializerがidデータ型を返すためコンパイル時に型チェックを行わなかった。このため開発者のミスによるクラッシュが発生するケースもあった。
これを受けてAppleはコンパイル時に型推論を行い型安全性を保証するinstancetypeを2013年に発表した。initializerでは従来使用していたidの代わりにinstancetypeをリターン型として記述することが推奨されている。

上記の過程が終われば新しいインスタンスを生成し使用する準備がすべて完了したことになる。上記のコードは以下のコードと同じように動作する。

```objectivec
[クラス名 new];
```

- `new` : NSObjectのクラスメソッドでクラスの新しいインスタンスのためのメモリ空間を割り当てインスタンスを生成するだけでなく生成されたインスタンスにinitメッセージを送って初期化まで行う。

```objectivec
Caculator *cal = [[Caculator alloc] init];
cal->_operator = '-';
[cal caculateValue:20];
[cal print];
```

```bash
-20
Program ended with exit code: 0
```

インスタンス変数\_operatorの場合はアクセスメソッドはないが外部にpublicで公開されているためC言語で構造体メンバにアクセスするのと同様にArrow Operatorを使用してアクセスできる。
しかし上記のコードのようにクラス外部からインスタンス変数を直接参照するケースはほとんどない。クラスをよりシンプルに説明するために書いたコードなので現場でこのように使ってはいけない。

以下のコードは上のコードとまったく同じ機能を果たす。

```objectivec
Caculator *cal = [Caculator new];
[cal caculateValue:20 withOperator:'-'];
[cal print];
```

```bash
-20
Program ended with exit code: 0
```

インスタンスをメモリから解放したい場合はインスタンス変数に`nil`を代入すればよい。iOSのメモリ管理技法の1つである`ARC`環境ではインスタンスを強く参照している場所が1つもなければそのインスタンスをメモリから解放する。
これは今後メモリ管理技法でまとめる。

以下のようにnilに対してメッセージを送ると何も起きない。クラッシュも発生しない。

```objectivec
cal = nil;
[cal caculateValue:20 withOperator:'-'];
[cal print];
```

インスタンスがメモリから解放されるタイミングを知りたければNSObjectのインスタンスメソッドである`dealloc`メソッドをオーバーライドすればよい。

```objectivec
- (void)dealloc {
    NSLog(@"メモリから解放された。");
}
```

オーバーライド時にSuper Callingをする大部分のオーバーライドパターンとは異なり親クラスの実装を呼び出してはならない。また`dealloc`はランタイムによって呼び出されるため開発者が直接呼び出してはならない。

```objectivec
- (void)dealloc {
    // Do not invoke the superclass's implementation.
    [super dealloc];
    ...
}
```

```objectivec
// Never send a dealloc message directly.
[self dealloc];
[cal dealloc];
```

上記のようなコードを書くとチームメンバーがかなり苦しむことになるだろう。

# 参考

- <https://www.tutorialspoint.com/objective_c/objective_c_classes_objects.htm>
