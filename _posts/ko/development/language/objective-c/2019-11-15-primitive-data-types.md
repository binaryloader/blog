---
date: 2019-11-15T00:00+09:00
title: "[Objective-C] 원시 데이터형 - Primitive Data Types"
ref: objective-c-primitive-data-types
excerpt: "Objective-C의 원시 데이터형을 정리한다."
last_modified_at: 2019-11-15T13:12+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/objective-c-primitive-data-types.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/objective-c-primitive-data-types.png"
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
    url: /ko/development/
  - title: "Language"
    url: /ko/development/language/
  - title: "Objective-C"
    url: /ko/development/language/objective-c/
---

# 개요

Objective-C의 원시 데이터형을 정리한다.

# 주의

본 글은 `Objective-C 2.0` 기준으로 작성되었다.

# 들어가며

Objective-C를 처음 공부할 때는 Foundation에서 제공하는 Class나 Type Alias로 재정의된 자료형을 엄격히 구분하여 공부하는 것이 좋다고 생각한다. 이번 포스팅에서는 Primitive Data Types에 대하여 정리해보도록 하겠다.

Objective-C는 ANSI C의 `strict superset`으로 ANSI C에서 제공하는 대부분의 데이터 타입뿐만 아니라 구조체(struct)와 공용체(union)도 사용할 수 있다.

# 정리

## 1. 문자 데이터형

### 1.1. char(32bit / 64bit)

| TYPE          | 크기  | 표현범위                  |
| ------------- | ----- | ------------------------- |
| signed char   | 1byte | Min : -128<br />Max : 127 |
| unsigned char | 1byte | Min : 0<br />Max : 255    |

{: .notice--info}
**참고:** char에 담기는 데이터 자체는 정수이지만 문자 데이터형으로 취급하는 경우가 있어서 정수 데이터형과는 별개로 나눴다. char는 정수 데이터형이자 문자 데이터형이다.

## 2. 정수 데이터형

### 2.1. short int(32bit / 64bit)

| TYPE               | 크기  | 표현범위                        |
| ------------------ | ----- | ------------------------------- |
| signed short int   | 2byte | Min : -32,768<br />Max : 32,767 |
| unsigned short int | 2byte | Min : 0<br />Max : 65,535       |

### 2.2. int(32bit / 64bit)

| TYPE         | 크기  | 표현범위                                      |
| ------------ | ----- | --------------------------------------------- |
| signed int   | 4byte | Min : -2,147,483,648<br />Max : 2,147,483,647 |
| unsigned int | 4byte | Min : 0<br />Max : 4,294,967,295              |

### 2.3. long int(32bit)

| TYPE              | 크기  | 표현범위                                      |
| ----------------- | ----- | --------------------------------------------- |
| signed long int   | 4byte | Min : -2,147,483,648<br />Max : 2,147,483,647 |
| unsigned long int | 4byte | Min : 0<br />Max : 4,294,967,295              |

### 2.4. long int(64bit)

| TYPE              | 크기  | 표현범위                                                              |
| ----------------- | ----- | --------------------------------------------------------------------- |
| signed long int   | 8byte | Min : -9,223,372,036,854,775,808<br />Max : 9,223,372,036,854,775,807 |
| unsigned long int | 8byte | Min : 0<br />Max : 18,446,744,073,709,551,615                         |

### 2.5. long long int(32bit / 64bit)

| TYPE                   | 크기  | 표현범위                                                              |
| ---------------------- | ----- | --------------------------------------------------------------------- |
| signed long long int   | 8byte | Min : -9,223,372,036,854,775,808<br />Max : 9,223,372,036,854,775,807 |
| unsigned long long int | 8byte | Min : 0<br />Max : 18,446,744,073,709,551,615                         |

## 3. 부동 소수 데이터형

### 3.1. float(32bit / 64bit)

| TYPE  | 크기  | 표현범위                                   |
| ----- | ----- | ------------------------------------------ |
| float | 4byte | Min : 1.175494e-38<br />Max : 3.402823e+38 |

### 3.2. double(32bit / 64bit)

| TYPE   | 크기  | 표현범위                                     |
| ------ | ----- | -------------------------------------------- |
| double | 8byte | Min : 2.225074e-308<br />Max : 1.797693e+308 |

## 4. 논리 데이터형

### 4.1. BOOL

논리 값을 나타내는 것에 사용되는 BOOL은 사실 typedef로 재정의된 데이터형이다.
컴파일러의 종류나 버전 혹은 바이너리가 실행되는 플랫폼 환경에 따라서 `int` 혹은 `char`가 재정의된 형태이다.
C 언어에서는 C99 이전에 BOOL 데이터형을 개발자들이 아래와 같이 직접 정의해서 사용했다.

```objectivec
typedef int bool

#define false 0
#define true  1

bool bValue;
bValue = true;
```

그러다가 C99에서 부울값을 저장하는 데이터형이 정식 도입되었다. 위 예시처럼 개발자들이 이미 C99 이전에 `int` 데이터형을 `bool`로 재정의해서 사용하고 있었기 때문에 `bool`이라는 키워드로는 지원하지 못하고 `_BOOL`이라는 키워드로 논리 값을 표현하는 데이터형을 지원하였다.

```objectivec
// stdbool.h

typedef _Bool bool;

#define true   (_Bool)1
#define false  (_Bool)0
```

그러나 `_BOOL`은 `bool`에 비해 조금 길다보니까 위에서 볼 수 있듯이 `stdbool.h`에서 별도로 `bool` 데이터형을 정의하여 제공했다. 그래서 C99에서 `_BOOL` 대신 `bool`을 사용하고 싶다면 `stdbool.h`를 include 해서 사용해야 한다.

근데 우리가 지금 보고 있는 것은 Objective-C인데 왜 C 언어 이야기를 길게 하나 의아할 것이다. 게시글의 도입부에서 말했던 것처럼 Objective-C는 C 언어의 `strict superset`이기 때문에
Objective-C 역시 BOOL은 컴파일러의 종류나 버전 혹은 플랫폼 환경에 따라서 원본 데이터형이 `int`가 될 수도 있었고 `char`가 될 수도 있었다.

될 수도 있었다고? 될 수도 있다도 아니고 될 수도 있었다는 무슨 말일까? 그건 바로 Xcode가 Clang을 채택하기 전에 사용하던 GCC 시절 이야기이다. GCC 시절에는 버전마다 원본 데이터형이 `int`가 될 수도 있었고 `char`가 될 수도 있었다.

예전에는 이러한 부울 값을 나타내는 데이터형의 차이로 인하여 이슈가 많이 나왔다고 한다. 현재는 C 컴파일러들이 ANSI C 기준을 어느 정도 잘 준수하기 때문에 부울 데이터형으로 채택하는 원본 데이터형이 거의 동일해졌고 true/false 논리값들도 0과 1로 잘 보정해줘서 이슈가 생기지 않는다.

과도기에는 부울 데이터형에 0과 1 이외의 데이터(원본 데이터형이 표현할 수 있는 데이터)가 담기기도 해서 true/false 비교에 논리적 결함으로 인한 이슈가 많았다고 한다. 심지어 ANSI C 표준을 정말 잘 지키지 않던 Visual Studio 구버전의 경우에는 `bool`은 `char`, `BOOL`은 `int`라서 개발자들을 더욱 헷갈리게 하는 경우도 있었다고 한다. 이러한 주절주절 히스토리를 잘 기억해뒀다가 오래된 버전의 C 컴파일러에서 부울 데이터형을 쓰는 경우에는 조금 더 주의를 기울이자.

그럼 Clang을 채택한 지금의 Xcode에서는 어떨까? 궁금하니까 직접 확인해보자.

먼저 macOS SDK와 iOS SDK에 있는 `objc.h`를 까보자.

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

와우! 헤더에서 BOOL 관련된 내용만 발췌해왔는데도 복잡하다.
그래도 하나씩 살펴보겠다.

#### 4.1.1. 결정 조건 1

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

`__OBJC_BOOL_IS_BOOL`이 정의되어 있을 때는 이 값에 따라서 `OBJC_BOOL_IS_BOOL`을 `0` 혹은 `1`로 정의한다.

#### 4.1.2. 결정 조건 2

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

`__OBJC_BOOL_IS_BOOL`이 정의되어 있지 않을 때는 타겟 운영체제와 플랫폼, 아키텍처 종류에 따라서 `OBJC_BOOL_IS_BOOL`을 `0` 혹은 `1`로 정의한다.

#### 4.1.3. 결정 조건 3

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

**결정 조건 1**과 **결정 조건 2**에 따라 결정된 `OBJC_BOOL_IS_BOOL`가 참이면 bool을 BOOL로 재정의, 거짓이면 signed char을 BOOL로 재정의한다.

#### 4.1.4. 결정 조건이 맞는지 테스트 해보자

오오! 헤더를 까보고 나니까 대충 알겠다. 그럼 코드를 짜서 디버깅해보면서 확인해보자.
먼저 macOS Command Line Tool 프로젝트를 생성하고 아래와 같이 코드를 작성해보겠다.

```objectivec
NSLog(@"__OBJC_BOOL_IS_BOOL = %@", __OBJC_BOOL_IS_BOOL ? @"defined" : @"undefined");
NSLog(@"TARGET_OS_OSX = %@", TARGET_OS_OSX ? @"YES" : @"NO");
NSLog(@"OBJC_BOOL_IS_BOOL = %@", OBJC_BOOL_IS_BOOL ? @"YES" : @"NO");
NSLog(@"OBJC_BOOL_IS_CHAR = %@", OBJC_BOOL_IS_CHAR ? @"YES" : @"NO");
```

결과는 다음과 같이 나왔다.

```bash
__OBJC_BOOL_IS_BOOL = undefined
TARGET_OS_OSX = YES
OBJC_BOOL_IS_BOOL = NO
OBJC_BOOL_IS_CHAR = YES
Program ended with exit code: 0
```

앞서 정리했던 세 가지의 결정 조건을 보면서 출력 결과를 이해해보면 아래와 같이 말해볼 수 있을 것 같다.

"Xcode 11.5, macOS 10.15 SDK로 빌드한 macOS Command Line Tool을 x86_64, macOS Catalina 10.15.4 환경에서 돌렸을 때 BOOL은 char를 재정의한 데이터형이다."

그럼 iOS 기기에서도 테스트 해보자. iOS Single View App 프로젝트를 생성하고 아래와 같이 코드를 작성해보겠다.

```objectivec
NSLog(@"__OBJC_BOOL_IS_BOOL = %@", __OBJC_BOOL_IS_BOOL ? @"defined" : @"undefined");
NSLog(@"TARGET_OS_OSX = %@", TARGET_OS_OSX ? @"YES" : @"NO");
NSLog(@"OBJC_BOOL_IS_BOOL = %@", OBJC_BOOL_IS_BOOL ? @"YES" : @"NO");
```

결과는 다음과 같이 나왔다.

```bash
__OBJC_BOOL_IS_BOOL = defined
TARGET_OS_OSX = NO
OBJC_BOOL_IS_BOOL = YES
Program ended with exit code: 0
```

아! 그럼 이건 또 아래와 같이 말해볼 수 있겠다.

"Xcode 11.5, iOS 13.5 SDK로 빌드한 iOS Single View App을 iPhone 11 Pro, arm64, iOS 13.5.1 환경에서 돌렸을 때 BOOL은 int를 재정의한 데이터형이다.
왜냐하면 BOOL은 bool을 재정의한 데이터형이고 bool은 int를 재정의한 데이터형이기 때문이다."

땡, 아니었다. 내가 마지막으로 사용했던 C 개발 환경에서는 bool이 int라서 Objective-C에서도 당연히 int일 줄 알았는데 char 데이터형이였다.
처음에는 sizeof를 찍었을 때 1이 나와서 어리둥절했는데 [애플 개발자 문서](https://developer.apple.com/documentation/objectivec/bool)를 찾아보니
이에 대한 내용들이 잘 나와있었다 ㅎㅎ

결국 BOOL은 아래의 표로 표현할 수 있을 것 같다.

| TYPE | Typedef     | 참  | 거짓 |
| ---- | ----------- | --- | ---- |
| BOOL | signed char | YES | NO   |

#### 4.1.5. 팁 : processor architecture 확인 방법

리눅스에서 하던대로 processor architecture를 확인해보려고 아래와 같은 커맨드를 수행했다.

```bash
arch
i386
```

결과는 `i386`이 출력되었다. 아닙니다. 선생님, 그럴 리가 없습니다. 제 맥은 64bit인 것으로 알고 있는데 이게 어떻게 된 일입니까?
식겁하고 구글링 좀 해봤다.

- [Stack Exchange Question1](https://unix.stackexchange.com/questions/518318/what-does-i386-mean-on-macos-mojave)
- [Stack Exchange Question2](https://apple.stackexchange.com/questions/140651/why-does-arch-output-i386)

아하~ 맥에서 `arch`는 PowerPC인지 Intel CPU인지 여부에 따라 Intel CPU면 무조건 `i386`을 돌려준다고 한다. 고로 `i386`이 나오면 `2-way universal` 혹은 `32-bit only` 둘 중 하나라는 것이다.

그럼 machine hardward name을 찍어보자. 아래와 같은 커맨드를 수행하면 된다.

```bash
machine
x86_64h
```

혹은

```bash
uname -m
x86_64
```

암요. 그럴 리가 없지요. 편안~

## 5. 인스턴스 포인터형

### 5.1. id(32bit)

| TYPE | 크기  | 표현범위        |
| ---- | ----- | --------------- |
| id   | 4byte | 인스턴스 포인터 |

### 5.2. id(64bit)

| TYPE | 크기  | 표현범위        |
| ---- | ----- | --------------- |
| id   | 8byte | 인스턴스 포인터 |

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

id가 표현할 수 있는 데이터는 인스턴스 포인터라고 했지만 조금 더 엄밀히 말하자면 isa 포인터를 인스턴스 변수로 가지고 있는 구조체 objc_object의 포인터를 담을 수 있다.
C 언어의 void 포인터와 동일한 역할을 하며 id 포인터를 이용해서 다형성 즉, 동적 바인딩과 동적 타이핑을 구현할 수 있다. isa는 Objective-C 런타임을 다룰 때 자세히 정리하겠다.

## 6. Format Specifies Type

| 데이터형               | 포맷 문자           |
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

Xcode 12에서 테스트해봤는데 signed와 unsigned 간에 포맷 문자를 혼용해도 빌드 경고는 없었다. 그래도 하위 호환성과 이슈 대비를 위해서는 이를 구분해서 정확히 사용하는 것이 좋을 것 같다.

# 눈으로 직접 확인을 해보자

이제 각 데이터형의 사이즈와 최소값, 최대값을 직접 확인해보자.
나는 32bit 기기를 가지고 있지 않아서 64bit 기기에서만 찍어보겠다.

## 1. 먼저 각 데이터형의 사이즈부터 보자

### 1.1. 문자 데이터형

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

### 1.2. 정수 데이터형

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

### 1.3. 부동 소수 데이터형

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

### 1.4. 논리 데이터형

#### 1.4.1. BOOL(64bit)

```objectivec
NSLog(@"size of BOOL is %ld", sizeof(BOOL));
```

```bash
size of BOOL is 1
Program ended with exit code: 0
```

### 1.5. 인스턴스 포인터형

#### 1.5.1. id(64bit)

```objectivec
NSLog(@"size of id is %ld", sizeof(id));
```

```bash
size of id is 8
Program ended with exit code: 0
```

## 2. 다음은 각 데이터형의 최소값과 최대값을 찍어보자

### 2.1. 문자 데이터형

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

### 2.2. 정수 데이터형

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

### 2.3. 부동 소수 데이터형

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

### 2.4. 논리 데이터형

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

### 2.5. 인스턴스 포인터형

#### 2.5.1. id(64bit)

```objectivec
id object = [[NSObject alloc] init];
NSLog(@"object address is %p", &object);
```

```bash
object address is 0x7ffeeb41b078
Program ended with exit code: 0
```

해당 메모리 주소는 실행 시 매번 변경된다.

지금까지 Objective-C에서 제공하는 원시 데이터형을 알아봤다. 나처럼 공부할 때 밑바닥을 봐야하는 성격인 사람들은 "NSInteger와 int의 차이는 뭐야?", "CGFloat와 float 차이는 뭐야?"
라는 궁금증이 더 생길 수도 있다. 이건 직접 헤더를 까보면서 확인해보자. 헤더는 명세 그 자체이다.

비록 실제 개발할 때는 아키텍처 환경이나 플랫폼에 따라서 적절한 데이터형을 typedef로 재정의해놓은 자료형들을 주로 사용할 것이라 생각한다.
하지만 원시 데이터형을 잘 알고 있는 것이 언젠가는 도움이 되는 순간이 올 것이라고 생각한다.

[+] 32bit 디바이스를 가지고 있는 분께서는 위 코드를 돌려보시고 결과를 댓글로 남겨주시면 본문에 업데이트하도록 하겠다.

# 참고

- <https://andybargh.com/primitive-data-types-objective-c/>
- <https://code.tutsplus.com/tutorials/objective-c-succinctly-data-types--mobile-21986>
- <https://www.tutorialspoint.com/objective_c/objective_c_data_types.htm>
