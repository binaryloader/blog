---
date: 2020-07-04T00:00+09:00
title: "[Objective-C] Loop Statements"
ref: objective-c-loop-statements
lang: en
excerpt: "A summary of loop statements in Objective-C."
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
    url: /en/development/
  - title: "Language"
    url: /en/development/language/
  - title: "Objective-C"
    url: /en/development/language/objective-c/
---

# Overview

A summary of loop statements in Objective-C.

# Note

This post is based on `Objective-C 2.0`.

# Introduction

The Loop Statements and Control Transfer Statements supported by Objective-C are as follows:

- `For Statement`, `While Statement`, `Do-While Statement`, `Fast Enumeration`
- `Continue Statement`, `Break Statement`, `Return Statement`

# Summary

## 1. First, Let Us Look at Loop Statements

### 1.1. For Statement

If you have studied C, the For Statement should be familiar. It can be used in the following form:

```objectivec
for (<#initialization#>; <#condition#>; <#increment#>) {
    <#statements#>
}
```

#### 1.1.1 initialization

This is the initialization expression for starting the loop, where you set an initial value through a variable. You can declare a variable within the loop scope or reference a variable from an outer scope to set the initial value.

#### 1.1.2. condition

A condition check is performed based on the given condition to determine whether to execute the statements logic within the loop. If the condition is not satisfied, the loop terminates.

#### 1.1.3. increment

An operation is performed on the variable needed for the condition expression in preparation for the next loop iteration.

Since I really love sushi, I will create a sushi-related example. Let us run the following example code:

```objectivec
for (int i = 1; i < 10; i++) {
    NSLog(@"The number of salmon sushi I ate is %d.", i);
}
```

```bash
The number of salmon sushi I ate is 1.
The number of salmon sushi I ate is 2.
The number of salmon sushi I ate is 3.
The number of salmon sushi I ate is 4.
The number of salmon sushi I ate is 5.
The number of salmon sushi I ate is 6.
The number of salmon sushi I ate is 7.
The number of salmon sushi I ate is 8.
The number of salmon sushi I ate is 9.
Program ended with exit code: 0
```

Using the following form will create an infinite loop:

```objectivec
for (;;) {
    <#statements#>
}
```

### 1.2. While Statement

The While Statement should also be familiar. It can be used in the following form:

```objectivec
while (<#condition#>) {
    <#statements#>
}
```

#### 1.2.1. condition

A condition check is performed based on the given condition, and if the condition is satisfied, the statements logic within the loop is executed.

```objectivec
int i = 1;

while (i < 10) {
    NSLog(@"The number of flatfish sushi I ate is %d.", i);
    i++;
}
```

```bash
The number of flatfish sushi I ate is 1.
The number of flatfish sushi I ate is 2.
The number of flatfish sushi I ate is 3.
The number of flatfish sushi I ate is 4.
The number of flatfish sushi I ate is 5.
The number of flatfish sushi I ate is 6.
The number of flatfish sushi I ate is 7.
The number of flatfish sushi I ate is 8.
The number of flatfish sushi I ate is 9.
Program ended with exit code: 0
```

Using the following form will create an infinite loop:

```objectivec
while (YES) {
    <#statements#>
}
```

As with C, you can pass any non-zero integer.

### 1.3. Do While Statement

The Do While Statement should also be familiar. Unlike the While Statement, it unconditionally executes the statements logic within the loop once before performing the condition check. It can be used in the following form:

```objectivec
do {
    <#statements#>
} while (<#condition#>);
```

#### 1.3.1. condition

A condition check is performed based on the given condition, and if the condition is satisfied, the logic within the loop is executed.

```objectivec
do {
    NSLog(@"The number of sea bream sushi I ate is %d.", i);
    i++;
} while (i < 10);
```

```objectivec
The number of sea bream sushi I ate is 1.
The number of sea bream sushi I ate is 2.
The number of sea bream sushi I ate is 3.
The number of sea bream sushi I ate is 4.
The number of sea bream sushi I ate is 5.
The number of sea bream sushi I ate is 6.
The number of sea bream sushi I ate is 7.
The number of sea bream sushi I ate is 8.
The number of sea bream sushi I ate is 9.
```

Using the following form will create an infinite loop:

```objectivec
do {
    <#statements#>
} while (YES);
```

As with C, you can pass any non-zero integer.

### 1.4. Fast Enumeration

Fast enumeration is a syntax for effectively and safely traversing elements of a Collection. Not only Swift but also Objective-C supports this syntax. Since it does not reference collection elements by index, it can prevent OOB (Out of Bounds) errors.

However, in Objective-C, fast enumeration can only be used with Collection types such as NSArray and NSDictionary.

It can be used in the following form:

```objectivec
for (<#type *object#> in <#collection#>) {
    <#statements#>
}
```

```objectivec
NSArray<NSNumber *> *array = @[@1, @2, @3, @4, @5, @6, @7, @8, @9];

for (NSNumber *number in array) {
    NSLog(@"The number of eel sushi I ate is %ld.", number.integerValue);
}
```

```objectivec
NSArray<NSNumber *> *array = @[@1, @2, @3, @4, @5, @6, @7, @8, @9];

NSNumber *number = nil;

for (number in array) {
    NSLog(@"The number of eel sushi I ate is %ld.", number.integerValue);
}
```

```bash
The number of eel sushi I ate is 1.
The number of eel sushi I ate is 2.
The number of eel sushi I ate is 3.
The number of eel sushi I ate is 4.
The number of eel sushi I ate is 5.
The number of eel sushi I ate is 6.
The number of eel sushi I ate is 7.
The number of eel sushi I ate is 8.
The number of eel sushi I ate is 9.
Program ended with exit code: 0
```

You can also perform fast enumeration using an NSEnumerator object.

```objectivec
NSArray<NSNumber *> *array = @[@1, @2, @3, @4, @5, @6, @7, @8, @9];

NSEnumerator *enumerator = [array reverseObjectEnumerator];

for (NSNumber *number in enumerator) {
    NSLog(@"The number of eel sushi I ate is %ld.", number.integerValue);
}
```

```bash
The number of eel sushi I ate is 9.
The number of eel sushi I ate is 8.
The number of eel sushi I ate is 7.
The number of eel sushi I ate is 6.
The number of eel sushi I ate is 5.
The number of eel sushi I ate is 4.
The number of eel sushi I ate is 3.
The number of eel sushi I ate is 2.
The number of eel sushi I ate is 1.
Program ended with exit code: 0
```

NSDictionary can also iterate through all keys using fast enumeration.

```objectivec
NSDictionary<NSString *, NSNumber *> *dictionary = @{
    @"Salmon sushi": @10,
    @"Flatfish sushi": @10,
    @"Sea bream sushi": @10,
    @"Eel sushi": @10
};

NSLog(@"The sushi I ate are as follows.");

for (NSString *key in dictionary.keyEnumerator) {
    NSLog(@"%@ %ld pieces", key, dictionary[key].integerValue);
}
```

```bash
The sushi I ate are as follows.
Sea bream sushi 10 pieces
Salmon sushi 10 pieces
Eel sushi 10 pieces
Flatfish sushi 10 pieces
Program ended with exit code: 0
```

## 2. Next, Let Us Look at Control Transfer Statements Used with Loop Statements

### 2.1. Continue Statement

When continue is encountered within a loop, execution flow immediately moves to the next iteration.

```objectivec
for (int i = 1; i < 10; i++) {
    if (i % 2 == 0) {
        continue;
    }

    NSLog(@"The number of salmon sushi I ate is %d.", i);
}
```

```bash
The number of salmon sushi I ate is 1.
The number of salmon sushi I ate is 3.
The number of salmon sushi I ate is 5.
The number of salmon sushi I ate is 7.
The number of salmon sushi I ate is 9.
Program ended with exit code: 0
```

In the above example, execution flow moves to the next iteration when the number is even, so only odd values of i are printed.

### 2.2. Break Statement

When break is encountered within a loop, the loop is immediately terminated.

```objectivec
int i = 1;

while (i < 10) {
    if (i % 2 == 0) {
        break;
    }

    NSLog(@"The number of flatfish sushi I ate is %d.", i);
    i++;
}
```

```bash
The number of flatfish sushi I ate is 1.
Program ended with exit code: 0
```

In the above example, the loop terminates when the number is even, so the logic inside the loop is executed only once before terminating.

### 2.3. Return Statement

When return is encountered within a loop that exists inside a method scope, the method execution is immediately terminated and returns.

```objectivec
- (void)print {
    int i = 1;

    do {
        NSLog(@"The number of sea bream sushi I ate is %d.", i);
        i++;

        if (i % 2 == 0) {
            return;
        }
    } while (i < 10);
}
```

```bash
The number of sea bream sushi I ate is 1.
Program ended with exit code: 0
```

In the above example, the method execution terminates and returns when the number is even, so the logic inside the loop is executed only once and the method frame is popped from the stack.

# References

- <https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjectiveC/Chapters/ocFastEnumeration.html>
