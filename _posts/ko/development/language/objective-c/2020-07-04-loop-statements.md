---
date: 2020-07-04T00:00+09:00
title: "[Objective-C] 반복문 - Loop Statements"
ref: objective-c-loop-statements
excerpt: "Objective-C의 반복문을 정리한다."
last_modified_at: 2020-07-04T11:39+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/objective-c-loop-statements.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/objective-c-loop-statements.png"
categories:
  - Development
  - Language
  - Objective-C
tags:
  - Development
  - Language
  - Objective-C
  - Loop
  - Control Flow
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Language"
    url: /ko/development/language/
  - title: "Objective-C"
    url: /ko/development/language/objective-c/
---

# 개요

Objective-C의 반복문을 정리한다.

# 주의

본 글은 `Objective-C 2.0` 기준으로 작성되었다.

# 들어가며

Objective-C가 지원하는 Loop Statements와 Control Transfer Statements는 아래와 같다.

- `For Statement`, `While Statement`, `Do-While Statement`, `Fast Enumeration`
- `Continue Statement`, `Break Statement`, `Return Statement`

# 정리

## 1. 먼저 Loop Statements를 보자

### 1.1. For Statement

C 언어를 공부했다면 For Statement는 익숙할 것이다. 아래와 같은 형태로 사용할 수 있다.

```objectivec
for (<#initialization#>; <#condition#>; <#increment#>) {
    <#statements#>
}
```

#### 1.1.1 initialization

루프를 시작할 초기화식으로 변수를 통해 초기값을 설정한다. 이때, 루프 스코프 내의 변수를 선언할 수도 있고 외부 스코프의 변수를 참조하여 초기값을 설정할 수도 있다.

#### 1.1.2. condition

루프 내의 statements 로직을 수행할 지 여부를 결정하기 위하여 주어진 조건에 따른 컨디션 체크를 수행한다. 만약 컨디션을 만족하지 못했을 경우 루프는 종료된다.

#### 1.1.3. increment

다음 루프 수행을 위하여 컨디션 조건식에 필요한 변수에 대한 연산을 수행한다.

나는 초밥을 정말 좋아하므로 초밥 관련 예제를 만들어보겠다. 아래와 같은 예제 코드를 한번 돌려보자.

```objectivec
for (int i = 1; i < 10; i++) {
    NSLog(@"내가 먹은 연어 초밥의 개수는 %d개다.", i);
}
```

```bash
내가 먹은 연어 초밥의 개수는 1개다.
내가 먹은 연어 초밥의 개수는 2개다.
내가 먹은 연어 초밥의 개수는 3개다.
내가 먹은 연어 초밥의 개수는 4개다.
내가 먹은 연어 초밥의 개수는 5개다.
내가 먹은 연어 초밥의 개수는 6개다.
내가 먹은 연어 초밥의 개수는 7개다.
내가 먹은 연어 초밥의 개수는 8개다.
내가 먹은 연어 초밥의 개수는 9개다.
Program ended with exit code: 0
```

아래와 같은 형태로 사용하면 무한 루프를 돌게 된다.

```objectivec
for (;;) {
    <#statements#>
}
```

### 1.2. While Statement

While Statement도 익숙할 것이다. 아래와 같은 형태로 사용할 수 있다.

```objectivec
while (<#condition#>) {
    <#statements#>
}
```

#### 1.2.1. condition

주어진 조건에 따른 컨디션 체크를 수행하고 만약 컨디션을 만족하였다면 루프 내의 statements 로직을 수행한다.

```objectivec
int i = 1;

while (i < 10) {
    NSLog(@"내가 먹은 광어 초밥의 개수는 %d개다.", i);
    i++;
}
```

```bash
내가 먹은 광어 초밥의 개수는 1개다.
내가 먹은 광어 초밥의 개수는 2개다.
내가 먹은 광어 초밥의 개수는 3개다.
내가 먹은 광어 초밥의 개수는 4개다.
내가 먹은 광어 초밥의 개수는 5개다.
내가 먹은 광어 초밥의 개수는 6개다.
내가 먹은 광어 초밥의 개수는 7개다.
내가 먹은 광어 초밥의 개수는 8개다.
내가 먹은 광어 초밥의 개수는 9개다.
Program ended with exit code: 0
```

아래와 같은 형태로 사용하면 무한 루프를 돌게 된다.

```objectivec
while (YES) {
    <#statements#>
}
```

C 언어와 마찬가지로 0이 아닌 정수를 넣어주면 된다.

### 1.3. Do while Statement

Do while Statement 역시 익숙할 것이다. While Statement와는 다르게 무조건 루프 내의 statements 로직을 한번 수행하고 난 뒤에 컨디션 체크를 수행한다. 아래와 같은 형태로 사용할 수 있다.

```objectivec
do {
    <#statements#>
} while (<#condition#>);
```

#### 1.3.1. condition

주어진 조건에 따른 컨디션 체크를 수행하고 만약 컨디션을 만족하였다면 루프 내의 로직을 수행한다.

```objectivec
do {
    NSLog(@"내가 먹은 도미 초밥의 개수는 %d개다.", i);
    i++;
} while (i < 10);
```

```objectivec
내가 먹은 도미 초밥의 개수는 1개다.
내가 먹은 도미 초밥의 개수는 2개다.
내가 먹은 도미 초밥의 개수는 3개다.
내가 먹은 도미 초밥의 개수는 4개다.
내가 먹은 도미 초밥의 개수는 5개다.
내가 먹은 도미 초밥의 개수는 6개다.
내가 먹은 도미 초밥의 개수는 7개다.
내가 먹은 도미 초밥의 개수는 8개다.
내가 먹은 도미 초밥의 개수는 9개다.
```

아래와 같은 형태로 사용하면 무한 루프를 돌게 된다.

```objectivec
do {
    <#statements#>
} while (YES);
```

C 언어와 마찬가지로 0이 아닌 정수를 넣어주면 된다.

### 1.4. Fast Enumeration (빠른 열거)

빠른 열거란 Collection의 원소들을 효과적이고 안전하게 탐색할 수 있는 문법이다. Swift 뿐만 아니라 Objective-C에서도 해당 문법을 지원하고 있다. 인덱스 기반으로 컬렉션의 원소를 참조하는 것이 아니기 때문에 OOB를 방지할 수 있다.

단, Objective-C에서 빠른 열거는 NSArray, NSDictionary 등 Collection 타입에 대해서만 사용을 할 수 있다.

아래와 같은 형태로 사용할 수 있다.

```objectivec
for (<#type *object#> in <#collection#>) {
    <#statements#>
}
```

```objectivec
NSArray<NSNumber *> *array = @[@1, @2, @3, @4, @5, @6, @7, @8, @9];

for (NSNumber *number in array) {
    NSLog(@"내가 먹은 장어 초밥의 개수는 %ld개다.", number.integerValue);
}
```

```objectivec
NSArray<NSNumber *> *array = @[@1, @2, @3, @4, @5, @6, @7, @8, @9];

NSNumber *number = nil;

for (number in array) {
    NSLog(@"내가 먹은 장어 초밥의 개수는 %ld개다.", number.integerValue);
}
```

```bash
내가 먹은 장어 초밥의 개수는 1개다.
내가 먹은 장어 초밥의 개수는 2개다.
내가 먹은 장어 초밥의 개수는 3개다.
내가 먹은 장어 초밥의 개수는 4개다.
내가 먹은 장어 초밥의 개수는 5개다.
내가 먹은 장어 초밥의 개수는 6개다.
내가 먹은 장어 초밥의 개수는 7개다.
내가 먹은 장어 초밥의 개수는 8개다.
내가 먹은 장어 초밥의 개수는 9개다.
Program ended with exit code: 0
```

NSEnumerator 객체를 사용하여 빠른 열거를 할 수도 있다.

```objectivec
NSArray<NSNumber *> *array = @[@1, @2, @3, @4, @5, @6, @7, @8, @9];

NSEnumerator *enumerator = [array reverseObjectEnumerator];

for (NSNumber *number in enumerator) {
    NSLog(@"내가 먹은 장어 초밥의 개수는 %ld개다.", number.integerValue);
}
```

```bash
내가 먹은 장어 초밥의 개수는 9개다.
내가 먹은 장어 초밥의 개수는 8개다.
내가 먹은 장어 초밥의 개수는 7개다.
내가 먹은 장어 초밥의 개수는 6개다.
내가 먹은 장어 초밥의 개수는 5개다.
내가 먹은 장어 초밥의 개수는 4개다.
내가 먹은 장어 초밥의 개수는 3개다.
내가 먹은 장어 초밥의 개수는 2개다.
내가 먹은 장어 초밥의 개수는 1개다.
Program ended with exit code: 0
```

NSDictionary도 빠른 열거를 통하여 모든 키를 순회할 수 있다.

```objectivec
NSDictionary<NSString *, NSNumber *> *dictionary = @{
    @"연어 초밥": @10,
    @"광어 초밥": @10,
    @"도미 초밥": @10,
    @"장어 초밥": @10
};

NSLog(@"내가 먹은 초밥은 아래와 같다.");

for (NSString *key in dictionary.keyEnumerator) {
    NSLog(@"%@ %ld개", key, dictionary[key].integerValue);
}
```

```bash
내가 먹은 초밥은 아래와 같다.
도미 초밥 10개
연어 초밥 10개
장어 초밥 10개
광어 초밥 10개
Program ended with exit code: 0
```

## 2. 다음은 Loop Statements와 함께 사용할 수 있는 Control Transfer Statements를 보자

### 2.1. Continue Statement

루프 내에서 continue를 만나면 그 즉시 다음 루프로 실행 흐름이 넘어간다.

```objectivec
for (int i = 1; i < 10; i++) {
    if (i % 2 == 0) {
        continue;
    }

    NSLog(@"내가 먹은 연어 초밥의 개수는 %d개다.", i);
}
```

```bash
내가 먹은 연어 초밥의 개수는 1개다.
내가 먹은 연어 초밥의 개수는 3개다.
내가 먹은 연어 초밥의 개수는 5개다.
내가 먹은 연어 초밥의 개수는 7개다.
내가 먹은 연어 초밥의 개수는 9개다.
Program ended with exit code: 0
```

위의 예제에서는 짝수인 경우 다음 루프로 실행 흐름이 넘어가기 때문에 i가 홀수인 경우만 출력이 된다.

### 2.2. Break Statement

루프 내에서 break를 만나면 그 즉시 루프를 중단한다.

```objectivec
int i = 1;

while (i < 10) {
    if (i % 2 == 0) {
        break;
    }

    NSLog(@"내가 먹은 광어 초밥의 개수는 %d개다.", i);
    i++;
}
```

```bash
내가 먹은 광어 초밥의 개수는 1개다.
Program ended with exit code: 0
```

위의 예제에서는 짝수인 경우 루프를 중단하기 때문에 루프 안의 로직은 한번만 수행되고 종료된다.

### 2.3. Return Statement

루프가 메서드 스코프 내에 존재하는 상태에서 루프 내에서 return을 만나면 그 즉시 메서드 수행을 종료하고 리턴한다.

```objectivec
- (void)print {
    int i = 1;

    do {
        NSLog(@"내가 먹은 도미 초밥의 개수는 %d개다.", i);
        i++;

        if (i % 2 == 0) {
            return;
        }
    } while (i < 10);
}
```

```bash
내가 먹은 도미 초밥의 개수는 1개다.
Program ended with exit code: 0
```

위의 예제에서는 짝수인 경우 메서드 수행을 종료하고 리턴하기 때문에 루프 안의 로직은 한번만 수행되고 메서드 프레임이 스택에서 팝 된다.

# 참고

- <https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjectiveC/Chapters/ocFastEnumeration.html>
