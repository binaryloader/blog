---
date: 2020-07-05T00:00+09:00
title: "[Objective-C] 조건문(Branch Statements)"
ref: objective-c-branch-statements
excerpt: "Objective-C의 조건문을 정리한다."
last_modified_at: 2020-07-05T12:39+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/objective-c-branch-statements.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/objective-c-branch-statements.png"
categories:
  - Development
  - Language
  - Objective-C
tags:
  - Development
  - Language
  - Objective-C
  - Branch
  - Control Flow
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Language"
    url: /ko/development/language/
  - title: "Objective-C"
    url: /ko/development/language/objective-c/
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

# 개요

Objective-C의 조건문을 정리한다.

# 주의

본 글은 `Objective-C 2.0` 기준으로 작성되었다.

# 들어가며

Objective-C가 지원하는 Branch Statements는 아래와 같다.

- `If Statement`, `Switch Statement`

연산자를 통한 의사결정은 아래 포스트의 삼항 연산자 섹션을 참고하기 바란다.

- [[Objective-C] 연산자와 표현식 - Operators and Expressions](/ko/development/language/objective-c/operators-and-expressions/#7-%EC%82%BC%ED%95%AD-%EC%97%B0%EC%82%B0%EC%9E%90-the-ternary-operators)

# 정리

## 1. If Statement

C 언어를 공부했다면 If Statement는 익숙할 것이다. 아래와 같은 형태로 사용할 수 있다.

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

조건문 내의 statements 로직을 수행할 지 여부를 결정하기 위하여 주어진 조건에 따른 컨디션 체크를 수행한다. 만약 컨디션을 만족하지 못했을 경우 아래 쪽으로 실행 흐름이 내려간다.

간단한 예제 하나 돌려보자.

```objectivec
int number = 0;

NSLog(@"0보다 큰 10의 배수를 입력하라.");
scanf("%d", &number);

int remainder = number % 10;

if (number > 0 && remainder == 0) {
    NSLog(@"%d는 0보다 큰 10의 배수이다.", number);
} else {
    NSLog(@"%d는 0보다 큰 10의 배수가 아니다.", number);
}
```

```bash
200
200는 0보다 큰 10의 배수이다.
Program ended with exit code: 0
```

컨디션 체크 로직이 복잡할 경우 if statement에 도달하기 전에 아래처럼 조건을 논리 단위로 잘게 쪼개서 먼저 연산 해주는 것이 컴파일 성능과 가독성에 도움이 될 수도 있다.

```objectivec
int number = 0;

NSLog(@"0보다 큰 10의 배수를 입력하라.");
scanf("%d", &number);

BOOL isNumberGreaterThanZero = number > 0;

int remainder = number % 10;
BOOL isRemainderEqualToZero = remainder == 0;

BOOL isMultiplesOfTen = isNumberGreaterThanZero && isRemainderEqualToZero;

if (isMultiplesOfTen) {
    NSLog(@"%d는 0보다 큰 10의 배수이다.", number);
} else {
    NSLog(@"%d는 0보다 큰 10의 배수가 아니다.", number);
}
```

```bash
35
35는 0보다 큰 10의 배수가 아니다.
Program ended with exit code: 0
```

단, 컨디션에 비교 연산자나 논리 연산자가 있는데 연산을 먼저 전부 해주는 경우 Short Circuit Evaluation의 이점을 잃게 될 수도 있으니 상황에 따라서 적절하게 작성해주자.

예를 들어, 아래와 같이 먼저 조건을 잘게 쪼개서 연산하지 않는 경우

```objectivec
if (number > 0 && (number % 10) == 0) {
    ...
}
```

첫번째 컨디션을 체크할 때 number가 0보다 작거나 같다면 `&&` 뒤의(number % 10) == 0 컨디션은 체크하지 않고 바로 if statement를 빠져나가게 된다.

하지만 아래처럼 논리 단위별로 쪼개서 연산을 먼저 수행하는 경우에는 두 개의 컨디션을 모두 체크하기 때문에 불필요한 연산 비용이 조금 더 들게 된다.

```objectivec
BOOL isNumberGreaterThanZero = number > 0;

int remainder = number % 10;
BOOL isRemainderEqualToZero = remainder == 0;

BOOL isMultiplesOfTen = isNumberGreaterThanZero && isRemainderEqualToZero;

if (isMultiplesOfTen) {
    ...
}
```

분기 경로를 추가하고 싶다면 if-else 구문을 사용하여 원하는 만큼 더 추가할 수 있다.

```objectivec
int number = 0;

NSLog(@"0보다 큰 10의 배수를 입력하라.");
scanf("%d", &number);

BOOL isNumberGreaterThanZero = number > 0;

int remainder = number % 10;
BOOL isRemainderEqualToZero = remainder == 0;

if (isNumberGreaterThanZero == NO) {
    NSLog(@"0보다 큰 10의 배수를 입력하라고 했다.");
} else if (isRemainderEqualToZero == NO) {
    NSLog(@"%d는 10의 배수가 아니다.", number);
} else {
    NSLog(@"%d는 0보다 큰 10의 배수이다.", number);
}
```

또한, 단순히 경로 추가 뿐만 아니라 위의 예시처럼 컨디션 체크를 단일 논리 단위로 수행할 수 있어서 여러 컨디션 케이스를 하나씩 쳐내면서 최종 목표까지의 도달 경로를 보다 명확히 표현할 수 있다.

## 2. Switch Statement

Switch Statement 역시 C 언어를 공부했다면 익숙할 것이다. 아래와 같은 형태로 사용할 수 있다.

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

각 case의 constant와 비교될 변수나 상수 혹은 표현식이다.

### 2.2. constant

해당 case의 값이 expression의 값과 비교했을 때 같은 경우 statements 로직을 수행한다. case 끝에 `break`를 넣어야만 해당 case의 statements 로직만 수행하고 switch statement를 빠져나올 수 있다.
만약 이를 빠뜨릴 경우 해당 case 바로 밑에 있는 case의 statements 로직도 수행된다. 다만 의도적으로 `break`를 넣지 않고 로직을 구현하는 경우도 있는데 그때는 그 의도를 분명하게 나타내야 한다.

### 2.3. default

모든 case가 일치하지 않는다면 수행되는 case이다. 밑으로는 더 이상의 case가 없으므로 `break`를 생략해도 상관없지만 모든 case 마지막에 break를 추가하는 습관을 들이자. 아니면 실수로 빠뜨리는 경우가 생긴다.

간단한 예제 한번 돌려보자.

```objectivec
char operator = '*';

switch(operator) {
    case '+':
        NSLog(@"더하기" );
        break;
    case '-':
        NSLog(@"빼기" );
        break;
    case '*':
        NSLog(@"곱하기" );
        break;
    case '/':
        NSLog(@"나누기" );
        break;
    default:
        NSLog(@"유효한 연산자가 아님" );
        break;
}
```

```bash
곱하기
Program ended with exit code: 0
```

`*` 케이스에 break를 빼보자.

```objectivec
char operator = '*';

switch(operator) {
    case '+':
        NSLog(@"더하기" );
        break;
    case '-':
        NSLog(@"빼기" );
        break;
    case '*':
        NSLog(@"곱하기" );
    case '/':
        NSLog(@"나누기" );
        break;
    default:
        NSLog(@"유효한 연산자가 아님" );
        break;
}
```

```bash
곱하기
나누기
Program ended with exit code: 0
```

의도하지 않은 잘못된 결과가 나왔다. `*` case 밑에 있는 `/` 케이스의 로직까지 수행됐다. 항상 의도하지 않은 `break` 누락을 조심하자.

`break`를 의도적으로 빠뜨려서 아래와 같이 여러 케이스에 공통된 특정 로직 수행을 하도록 작성할 수도 있다.

```objectivec
char operator = '*';

switch(operator) {
    case '+':
        NSLog(@"더하기" );
        break;
    case '-':
        NSLog(@"빼기" );
        break;
    case '*':
    case 'x':
        NSLog(@"곱하기" );
        break;
    case '/':
        NSLog(@"나누기" );
        break;
    default:
        NSLog(@"유효한 연산자가 아님" );
        break;
}
```

```bash
곱하기
Program ended with exit code: 0
```

이런 경우에는 위에서 말했듯이 코드 그 자체로도 충분히 의도가 표현되도록 하거나 그것이 불가능하다면 주석을 잘 작성해두자.

# 참고

- <https://www.tutorialspoint.com/objective_c/switch_statement_in_objective_c.htm>
