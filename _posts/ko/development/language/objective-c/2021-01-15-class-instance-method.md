---
date: 2021-01-15T00:00+09:00
title: "[Objective-C] 클래스와 메서드, 인스턴스 - Class and Method, Instance"
ref: objective-c-class-instance-method
excerpt: "Objective-C의 클래스와 메서드 그리고 인스턴스를 정리한다."
last_modified_at: 2021-01-15T18:31+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/objective-c-class-instance-method.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/objective-c-class-instance-method.png"
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
    url: /ko/development/
  - title: "Language"
    url: /ko/development/language/
  - title: "Objective-C"
    url: /ko/development/language/objective-c/
---

# 개요

Objective-C의 클래스와 메서드 그리고 인스턴스를 정리한다.

# 주의

본 글은 `Objective-C 2.0` 기준으로 작성되었다.

# 들어가며

Objective-C는 객체 지향 프로그래밍을 지원하는 언어이다. 1980년대 초, 브래드 콕스와 톰 러브는 C 언어에 Small Talk(스몰 토크) 형식의 객체 지향 개념을 도입하였다.
여타 OOP 언어와 동일하게 현실 세계의 `어떤 것`을 컴퓨터 세계의 `객체(Object)`로 그 개념과 컨셉을 구현할 수 있으며 이 객체는 `클래스(Class)`라는 설계도로 정의할 수 있다.
또한, 클래스로 정의되어 있는 객체를 메모리에 할당하여 실체화함으로써 `인스턴스(Instance)`로 만들 수 있다. 이번 포스팅에서는 이러한 객체 지향 프로그래밍을 Objective-C 문법에서 어떻게 지원하는지 정리해보도록 하겠다.

# 정리

## 1. 클래스

클래스는 아래와 같은 두 개의 영역으로 구성된다. 앞으로 나올 예시 코드처럼 인스턴스 변수 자체를 선언하여 사용하는 경우에는 종종 OOP의 캡슐화와 은닉화가 깨지는 케이스가 생기기도 하고 일일히 액세스 메서드를 만들어줘야 한다.
그래서 프로퍼티가 도입된 이후로는 인스턴스 변수를 직접 선언하는 것은 권장되지도 사용되지도 않는다. 또한 인스턴스 변수를 선언한 위치에 따라서 각기 장단점이 존재하는데 이러한 내용들은 별도의 포스트에서 자세히 정리하도록 하겠다.
이번 포스트에서는 프로퍼티 등과 같은 문법은 제외하고 클래스 자체에 집중하도록 하겠다.

### 1.1. interface

interface는 클래스를 정의하고 인스턴스 변수와 메서드, 프로퍼티 등을 선언하는 부분이다. 이곳에 선언한 내용들은 상속 시 그 자식이 동일하게 승계하며 인스턴스 변수의 경우 지정된 Access Modifier에 따라서
상속될 수도 있고 상속되지 않을 수도 있다. 다만, interface에서 인스턴스 변수를 선언하는 것은 권장되지 않기 때문에 상속을 통한 변수 승계 등의 불가피한 상황에서만 제한적으로 선언한다.

기본적인 문법은 아래와 같다.

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

NSObject는 대부분의 Objective-C 클래스 계층 구조의 루트 클래스로 런타임 시스템에 대한 기본적인 인터페이스가 구현되어 있다. 이를 상속받은 자식 클래스는 Objective-C 객체로 동작할 수 있다.
특정한 클래스를 상속 받는 경우가 아니라면 기본적으로 NSObject 클래스를 상속해야 한다.

위 코드는 NSObject 클래스를 상속한 Caculator 클래스를 정의한다. char 데이터형 인스턴스 변수를 가지고 있으며 가시성은 public으로 외부에서 직접 접근할 수 있다.
그리고 인스턴스 메서드 세 개를 가지고 있다.

### 1.2. implementation

implementation은 interface에 선언한 메서드를 실제로 구현하는 코드를 담고 있다. 또한, 외부에 직접 공개하지 않거나 자식에게 상속하지 않을 인스턴스 변수와 메서드를 정의할 수 있다.

기본적인 문법은 아래와 같다.

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
            NSLog(@"지원하지 않는 연산자.");
            break;
    }
}

- (void)print {
    NSLog(@"%d", _accumulator);
}

@end
```

Caculator 클래스의 implementation은 interface에서 정의한 세 개의 메서드를 구현하고 있다. 또한, int 데이터형 인스턴스 변수를 선언하고 있는데 앞서 말한 것처럼 이는 외부에 직접 공개되거나 상속 시 자식에게 승계되지 않는다.

Objective-C 클래스는 하나의 파일에 interface와 implementation을 함께 작성하는 경우도 드물게 있지만 대부분의 경우에는 별도의 파일로 작성하는데 interface는 `*.h`, implementation은 `*.m`라는 확장자를 가진 파일에 작성한다.

### 1.3. self

Objective-C에서 self는 특별한 키워드이다. self는 인스턴스 안에서 자기 자신을 참조할 때 사용하며 메서드의 실행 주체가 되는 인스턴스의 포인터이다.

인스턴스 메서드 내에서 인스턴스 변수 혹은 다른 인스턴스 메서드에 접근할 때 사용할 수 있으며, 클래스 메서드 내에서 클래스 변수 혹은 다른 클래스 메서드에 접근할 때 사용할 수 있다.

```objectivec
[self caculateValue:value withOperator:_operator];
```

## 2. 메서드

Objective-C는 Message Sending 방식을 채택했기 때문에 `메서드 호출`을 `메세지 전송`이라고도 한다. 현업에서는 커뮤니케이션 할 때 두 개를 혼용해서 사용한다.
이러한 Message Sending 방식은 추후에 업로드 될 Objective-C 런타임 관련 포스트를 통해 정리하도록 하겠다.

메서드 선언의 기본적인 문법은 아래와 같다.

```objectivec
- (void)caculate:(int)value;
```

- `-` : Method Type으로 `-`은 인스턴스 메서드, `+`는 클래스 메서드이다. Objective-C에서는 클래스 자체도 메타 클래스의 인스턴스로 존재하기 때문에 클래스에 대하여 메세지를 보내는 것이 가능하다.
- `(void)` : Return Type으로 메서드가 반환할 데이터형을 정의한다.
- `caculate:` : Method Name으로 메서드 이름을 정의하고 `:` 토큰을 통해 파라미터를 받는다는 것을 나타낸다.
- `(int)` : Parameter Type으로 파라미터로 받을 데이터형을 정의한다.
- `value` : Parameter Name으로 파라미터 이름을 정의한다.

아래와 같은 형태로 파라미터를 여러 개 넘길 수도 있다.

```objectivec
- (void)caculateValue:(int)value withOperator:(char)operator;
```

클래스 메서드를 정의할 수도 있는데 Method Type을 `-`가 아닌 `+`로 선언하면 된다.

```objectivec
+ (void)reset;
```

정의한 메서드는 아래와 같은 문법으로 호출할 수 있다.

```objectivec
[ClassOrInstance method];
```

1. `[` : 대괄호를 연다.
2. `ClassOrInstance` : 클래스나 인스턴스의 이름을 적는다.
3. ` ` : 공백을 하나 둔다.
4. `method` : 수행할 메서드 이름을 적는다.
5. `]` : 대괄호를 닫는다.
6. `;` : 세미콜론을 추가한다.

Message Sending 관점에서는 아래와 같이 표현할 수도 있다.

```objectivec
[receiver message];
```

## 3. 인스턴스

클래스는 아래와 같이 인스턴스화 할 수 있다.

```objectivec
[[클래스 이름 alloc] init];
```

- `alloc` : NSObject의 클래스 메서드로 인스턴스가 필요로 하는 메모리 공간을 할당하고 새로운 인스턴스를 생성한다. 이 메서드의 반환 값으로 생성된 인스턴스의 메모리 주소가 리턴된다.
- `init` : NSObject의 인스턴스 메서드로 `alloc`을 통해 새로 생성된 인스턴스를 사용하기 위하여 초기화를 수행한다. `alloc`을 통해 메모리에 인스턴스가 할당되자마자 호출해야 한다.

`alloc`과 `init`은 아래와 같이 NSObject.h에 정의되어 있다.

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

initializer는 아래와 같이 오버라이딩이 가능하다. 부모 클래스의 초기화 메서드를 호출해서 새로 생성된 인스턴스를 self에 대입해야 하는데 메모리 공간이 부족하거나 어떠한 이유로 실패하는 경우가 있을 수도 있어서 nil 체크를 꼭 해야 한다.
만약 self가 새로 생성된 인스턴스를 제대로 리테인하고 있다면 필요한 작업을 수행한 뒤에 self를 리턴해준다.

```objectivec
- (instancetype)init {
    self = [super init];

    if (self) {
        _operator = '+';
    }

    return self;
}
```

Modern Objective-C 이전에는 initializer가 id 데이터형을 리턴하여 컴파일 타임에 타입 체크를 하지 않았다. 이 때문에 개발자 실수로 인한 이런 저런 크래시가 발생하는 경우도 종종 있었다.
이에 애플은 컴파일 타임에 타입 추론을 수행하여 형 안정성을 보장해주는 instancetype을 2013년에 발표하였다. initializer에서는 기존에 사용하던 id 대신 instancetype을 리턴 타입으로 작성하는 것이 권장되고 있다.

위 과정이 끝나면 새로운 인스턴스를 생성하고 사용할 준비를 모두 마친 것이다. 위 코드는 아래 코드와 동일하게 동작한다.

```objectivec
[클래스 이름 new];
```

- `new` : NSObject의 클래스 메서드로 클래스의 새로운 인스턴스를 위한 메모리 공간을 할당하고 인스턴스를 생성할 뿐만 아니라 생성된 인스턴스에 init 메세지를 보내 초기화까지 수행한다.

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

인스턴스 변수 \_operator의 경우 엑세스 메서드는 없지만 외부에 public으로 공개되어 있기 때문에 C 언어에서 구조체 멤버에 접근하는 것과 동일하게 Arrow Operator를 사용하여 접근할 수 있다.
하지만 위 코드처럼 클래스 외부에서 인스턴스 변수를 직접 참조하는 경우는 거의 없다. 클래스를 보다 단순하게 설명하기 위해서 작성한 코드이므로 현업에서 이렇게 사용하면 절대 안 된다.

아래 코드는 위의 코드와 전적으로 동일한 기능을 수행한다.

```objectivec
Caculator *cal = [Caculator new];
[cal caculateValue:20 withOperator:'-'];
[cal print];
```

```bash
-20
Program ended with exit code: 0
```

인스턴스를 메모리에서 해제하고 싶다면 인스턴스 변수에 `nil`을 대입하면 된다. iOS의 메모리 관리 기법 중 하나인 `ARC` 환경에서는 인스턴스를 강하게 참조하는 곳이 하나도 없다면 해당 인스턴스를 메모리에서 해제한다.
이는 추후 메모리 관리 기법에서 정리하도록 하겠다.

아래와 같이 nil에 대하여 메세지를 보내면 아무 일도 일어나지 않는다. 크래시도 나지 않는다.

```objectivec
cal = nil;
[cal caculateValue:20 withOperator:'-'];
[cal print];
```

인스턴스가 메모리에서 해제되는 시점을 알고 싶다면 NSObject의 인스턴스 메서드인 `dealloc` 메서드를 오버라이딩하면 된다.

```objectivec
- (void)dealloc {
    NSLog(@"메모리에서 해제되었음.");
}
```

오버라이딩 시 Super Calling을 하는 대부분의 오버라이딩 패턴과는 다르게 부모 클래스의 구현을 호출하면 안된다. 또한, `dealloc`은 런타임에 의해서 호출되기 때문에 개발자가 직접 호출하면 절대 안된다.

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

위처럼 코드를 작성했다면 팀원들이 상당히 괴로워할 것이다.

# 참고

- <https://www.tutorialspoint.com/objective_c/objective_c_classes_objects.htm>
