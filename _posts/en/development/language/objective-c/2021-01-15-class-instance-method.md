---
date: 2021-01-15T00:00+09:00
title: "[Objective-C] Class and Method, Instance"
ref: objective-c-class-instance-method
lang: en
excerpt: "A summary of classes, methods, and instances in Objective-C."
last_modified_at: 2021-01-15T18:31+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/objective-c-class-instance-method.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/objective-c-class-instance-method.png"
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
    url: /en/development/
  - title: "Language"
    url: /en/development/language/
  - title: "Objective-C"
    url: /en/development/language/objective-c/
---

# Overview

A summary of classes, methods, and instances in Objective-C.

# Note

This post is based on `Objective-C 2.0`.

# Introduction

Objective-C is a language that supports object-oriented programming. In the early 1980s, Brad Cox and Tom Love introduced Smalltalk-style object-oriented concepts to the C language.
Like other OOP languages, a real-world "something" can be implemented as an `object` in the computer world, and this object can be defined by a blueprint called a `class`.
Furthermore, an object defined by a class can be instantiated by allocating it in memory, creating an `instance`. In this post, I will summarize how Objective-C syntax supports such object-oriented programming.

# Summary

## 1. Class

A class consists of the following two areas. As shown in the example code below, when instance variables are declared and used directly, there are occasional cases where OOP encapsulation and information hiding are broken, and you have to create accessor methods for each one manually.
Therefore, since the introduction of properties, directly declaring instance variables is neither recommended nor commonly used. Additionally, there are pros and cons depending on where instance variables are declared, and these details will be covered in a separate post.
In this post, I will focus on classes themselves, excluding syntax like properties.

### 1.1. interface

The interface is where you define the class and declare instance variables, methods, properties, and more. Items declared here are inherited by child classes, and in the case of instance variables, they may or may not be inherited depending on the specified Access Modifier. However, since declaring instance variables in the interface is not recommended, they should only be declared in limited situations such as when variable inheritance through subclassing is unavoidable.

The basic syntax is as follows:

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

NSObject is the root class of most Objective-C class hierarchies and has basic interfaces to the runtime system implemented. Child classes that inherit from it can operate as Objective-C objects.
If you are not inheriting from a specific class, you should inherit from NSObject by default.

The above code defines a Caculator class that inherits from NSObject. It has a char data type instance variable with public visibility that can be accessed directly from outside.
It also has three instance methods.

### 1.2. implementation

The implementation contains the actual code that implements the methods declared in the interface. It can also define instance variables and methods that are not directly exposed externally or inherited by child classes.

The basic syntax is as follows:

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
            NSLog(@"Unsupported operator.");
            break;
    }
}

- (void)print {
    NSLog(@"%d", _accumulator);
}

@end
```

The implementation of the Caculator class implements the three methods defined in the interface. It also declares an int data type instance variable, which, as mentioned earlier, is not directly exposed externally or inherited by child classes.

Objective-C classes occasionally have the interface and implementation written in a single file, but in most cases they are written in separate files -- the interface in a file with the `*.h` extension and the implementation in a file with the `*.m` extension.

### 1.3. self

In Objective-C, self is a special keyword. self is used to reference the instance itself from within an instance, and it is a pointer to the instance that is the execution subject of the method.

It can be used to access instance variables or other instance methods within an instance method, and to access class variables or other class methods within a class method.

```objectivec
[self caculateValue:value withOperator:_operator];
```

## 2. Method

Since Objective-C adopted the Message Sending approach, "method call" is also referred to as "message send." In practice, these two terms are used interchangeably.
The Message Sending approach will be covered in a future post on the Objective-C runtime.

The basic syntax for method declaration is as follows:

```objectivec
- (void)caculate:(int)value;
```

- `-` : Method Type, where `-` denotes an instance method and `+` denotes a class method. In Objective-C, since a class itself exists as an instance of a metaclass, it is possible to send messages to a class.
- `(void)` : Return Type, which defines the data type the method will return.
- `caculate:` : Method Name, which defines the method name and indicates through the `:` token that it takes a parameter.
- `(int)` : Parameter Type, which defines the data type to be received as a parameter.
- `value` : Parameter Name, which defines the parameter name.

You can also pass multiple parameters in the following form:

```objectivec
- (void)caculateValue:(int)value withOperator:(char)operator;
```

You can also define class methods by declaring the Method Type as `+` instead of `-`:

```objectivec
+ (void)reset;
```

Defined methods can be called using the following syntax:

```objectivec
[ClassOrInstance method];
```

1. `[` : Open a square bracket.
2. `ClassOrInstance` : Write the name of the class or instance.
3. ` ` : Leave a space.
4. `method` : Write the name of the method to execute.
5. `]` : Close the square bracket.
6. `;` : Add a semicolon.

From a Message Sending perspective, it can also be expressed as follows:

```objectivec
[receiver message];
```

## 3. Instance

A class can be instantiated as follows:

```objectivec
[[ClassName alloc] init];
```

- `alloc` : A class method of NSObject that allocates the memory space required by the instance and creates a new instance. The return value of this method is the memory address of the created instance.
- `init` : An instance method of NSObject that performs initialization to prepare the newly created instance via `alloc` for use. It must be called immediately after the instance is allocated in memory via `alloc`.

`alloc` and `init` are defined in NSObject.h as follows:

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

The initializer can be overridden as follows. You must call the parent class's initialization method and assign the newly created instance to self. Since the allocation may fail due to insufficient memory or some other reason, a nil check is essential.
If self properly retains the newly created instance, perform the necessary work and then return self.

```objectivec
- (instancetype)init {
    self = [super init];

    if (self) {
        _operator = '+';
    }

    return self;
}
```

Before Modern Objective-C, initializers returned the id data type, so type checking was not performed at compile time. This sometimes led to crashes due to developer mistakes.
Apple addressed this by introducing instancetype in 2013, which performs type inference at compile time to ensure type safety. For initializers, it is recommended to use instancetype instead of the previously used id as the return type.

Once the above process is complete, a new instance has been created and is fully prepared for use. The above code behaves identically to the following:

```objectivec
[ClassName new];
```

- `new` : A class method of NSObject that allocates memory space for a new instance of the class, creates the instance, and sends an init message to perform initialization.

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

Although the instance variable \_operator does not have accessor methods, since it is publicly exposed, it can be accessed using the Arrow Operator, just like accessing struct members in C.
However, directly referencing instance variables from outside the class as shown above is extremely rare. This code was written to explain classes more simply -- **you should never do this in production**.

The following code performs the exact same functionality as the code above:

```objectivec
Caculator *cal = [Caculator new];
[cal caculateValue:20 withOperator:'-'];
[cal print];
```

```bash
-20
Program ended with exit code: 0
```

If you want to release an instance from memory, assign `nil` to the instance variable. Under `ARC`, one of iOS's memory management techniques, if there are no strong references to an instance anywhere, that instance is released from memory.
This will be covered in a future post on memory management techniques.

As shown below, sending a message to nil results in nothing happening. It does not cause a crash either.

```objectivec
cal = nil;
[cal caculateValue:20 withOperator:'-'];
[cal print];
```

If you want to know when an instance is released from memory, you can override the `dealloc` method, an instance method of NSObject.

```objectivec
- (void)dealloc {
    NSLog(@"Released from memory.");
}
```

Unlike most overriding patterns where you call the super implementation, you must not call the parent class's implementation here. Also, since `dealloc` is called by the runtime, developers should never call it directly.

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

If you write code like the above, your team members will be quite unhappy.

# References

- <https://www.tutorialspoint.com/objective_c/objective_c_classes_objects.htm>
