---
title: "[Objective-C] Branch Statements"
ref: objective-c-branch-statements
lang: en
excerpt: "A summary of branch statements in Objective-C."
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
    url: /en/development/
  - title: "Language"
    url: /en/development/language/
  - title: "Objective-C"
    url: /en/development/language/objective-c/
---

# Overview

A summary of branch statements in Objective-C.

# Note

This post is based on `Objective-C 2.0`.

# Introduction

The Branch Statements supported by Objective-C are as follows:

- `If Statement`, `Switch Statement`

For decision-making using operators, please refer to the ternary operator section in the following post:

- [[Objective-C] Operators and Expressions](https://hacoma.github.io/development/language/objective-c/operators-and-expressions/#7-%EC%82%BC%ED%95%AD-%EC%97%B0%EC%82%B0%EC%9E%90-the-ternary-operators)

# Summary

## 1. If Statement

If you have studied C, the If Statement should be familiar. It can be used in the following form:

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

A condition check is performed based on the given condition to determine whether to execute the statements logic within the conditional statement. If the condition is not satisfied, the execution flow moves downward.

Let us run a simple example:

```objectivec
int number = 0;

NSLog(@"Enter a positive multiple of 10.");
scanf("%d", &number);

int remainder = number % 10;

if (number > 0 && remainder == 0) {
    NSLog(@"%d is a positive multiple of 10.", number);
} else {
    NSLog(@"%d is not a positive multiple of 10.", number);
}
```

```bash
200
200 is a positive multiple of 10.
Program ended with exit code: 0
```

When the condition check logic is complex, splitting the conditions into logical units before reaching the if statement, as shown below, can improve compilation performance and readability.

```objectivec
int number = 0;

NSLog(@"Enter a positive multiple of 10.");
scanf("%d", &number);

BOOL isNumberGreaterThanZero = number > 0;

int remainder = number % 10;
BOOL isRemainderEqualToZero = remainder == 0;

BOOL isMultiplesOfTen = isNumberGreaterThanZero && isRemainderEqualToZero;

if (isMultiplesOfTen) {
    NSLog(@"%d is a positive multiple of 10.", number);
} else {
    NSLog(@"%d is not a positive multiple of 10.", number);
}
```

```bash
35
35 is not a positive multiple of 10.
Program ended with exit code: 0
```

However, when the condition involves comparison or logical operators and you pre-compute all operations, you may lose the benefit of Short Circuit Evaluation, so write appropriately depending on the situation.

For example, if you do not split the conditions beforehand:

```objectivec
if (number > 0 && (number % 10) == 0) {
    ...
}
```

When checking the first condition, if number is less than or equal to 0, the `(number % 10) == 0` condition after `&&` will not be checked and the if statement will be exited immediately.

However, if you split the conditions into logical units and perform the operations first, both conditions are always checked, resulting in slightly more unnecessary computation cost:

```objectivec
BOOL isNumberGreaterThanZero = number > 0;

int remainder = number % 10;
BOOL isRemainderEqualToZero = remainder == 0;

BOOL isMultiplesOfTen = isNumberGreaterThanZero && isRemainderEqualToZero;

if (isMultiplesOfTen) {
    ...
}
```

If you want to add more branch paths, you can use if-else constructs to add as many as needed:

```objectivec
int number = 0;

NSLog(@"Enter a positive multiple of 10.");
scanf("%d", &number);

BOOL isNumberGreaterThanZero = number > 0;

int remainder = number % 10;
BOOL isRemainderEqualToZero = remainder == 0;

if (isNumberGreaterThanZero == NO) {
    NSLog(@"I said to enter a positive multiple of 10.");
} else if (isRemainderEqualToZero == NO) {
    NSLog(@"%d is not a multiple of 10.", number);
} else {
    NSLog(@"%d is a positive multiple of 10.", number);
}
```

In addition to simply adding paths, as shown in the above example, you can perform condition checks on single logical units, eliminating condition cases one by one to more clearly express the path to the final goal.

## 2. Switch Statement

The Switch Statement should also be familiar if you have studied C. It can be used in the following form:

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

A variable, constant, or expression that will be compared with the constant of each case.

### 2.2. constant

If the value of the case matches the value of the expression, the statements logic is executed. You must place `break` at the end of the case to execute only that case's statements logic and exit the switch statement.
If you forget it, the statements logic of the case immediately below will also be executed. However, there are cases where `break` is intentionally omitted for implementing certain logic, and in such cases, the intent should be clearly indicated.

### 2.3. default

This case is executed when none of the cases match. Since there are no more cases below, `break` can be omitted, but make it a habit to add break at the end of every case. Otherwise, you will accidentally forget it.

Let us run a simple example:

```objectivec
char operator = '*';

switch(operator) {
    case '+':
        NSLog(@"Addition" );
        break;
    case '-':
        NSLog(@"Subtraction" );
        break;
    case '*':
        NSLog(@"Multiplication" );
        break;
    case '/':
        NSLog(@"Division" );
        break;
    default:
        NSLog(@"Not a valid operator" );
        break;
}
```

```bash
Multiplication
Program ended with exit code: 0
```

Let us remove the break from the `*` case:

```objectivec
char operator = '*';

switch(operator) {
    case '+':
        NSLog(@"Addition" );
        break;
    case '-':
        NSLog(@"Subtraction" );
        break;
    case '*':
        NSLog(@"Multiplication" );
    case '/':
        NSLog(@"Division" );
        break;
    default:
        NSLog(@"Not a valid operator" );
        break;
}
```

```bash
Multiplication
Division
Program ended with exit code: 0
```

An unintended incorrect result occurred. The logic of the `/` case below the `*` case was also executed. Always watch out for unintended `break` omissions.

You can also intentionally omit `break` to have multiple cases execute a common piece of logic, like the following:

```objectivec
char operator = '*';

switch(operator) {
    case '+':
        NSLog(@"Addition" );
        break;
    case '-':
        NSLog(@"Subtraction" );
        break;
    case '*':
    case 'x':
        NSLog(@"Multiplication" );
        break;
    case '/':
        NSLog(@"Division" );
        break;
    default:
        NSLog(@"Not a valid operator" );
        break;
}
```

```bash
Multiplication
Program ended with exit code: 0
```

In such cases, as mentioned above, make sure the code itself clearly expresses the intent, or if that is not possible, write good comments.

# References

- <https://www.tutorialspoint.com/objective_c/switch_statement_in_objective_c.htm>
