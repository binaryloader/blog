---
date: 2019-11-18T00:00+09:00
title: "[Objective-C] Operators and Expressions"
ref: objective-c-operators-and-expressions
lang: en
excerpt: "A summary of operators and expressions in Objective-C."
last_modified_at: 2019-11-18T13:12+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/objective-c-operators-and-expressions.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/objective-c-operators-and-expressions.png"
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
    url: /en/development/
  - title: "Language"
    url: /en/development/language/
  - title: "Objective-C"
    url: /en/development/language/objective-c/
---

# Overview

A summary of operators and expressions in Objective-C.

# Note

This post is based on `Objective-C 2.0`.

# Introduction

Before exploring the operators and expressions provided by Objective-C, let us recall our university courses on programming language theory and compiler theory.
We learned that most compilers go through the following series of compilation phases:

- Lexical analysis (lexical analyze)
- Syntax analysis (syntax analyze)
- Semantic analysis (semantic analyze)
- IR generation (intermediate representation)
- Optimization (optimization)
- Code generation (code generation)

LL parsing, LR parsing, SLR parsing, closures, non-terminals -- I struggled a lot studying compiler theory in school because I was not the sharpest, but the fact that I remember at least something tells me it was not entirely in vain.

Among the phases above, during lexical analysis, syntax analysis, and semantic analysis, the compiler uses the symbol table to generate tokens, parse trees, and abstract syntax trees, and checks whether the code conforms to the language's grammatical or semantic definitions.
Typically, these phases constitute the compiler's front-end. Objective-C performs these phases through `Clang`, which is the front-end of `LLVM`.

We must write our programs according to the defined rules so that our friend Clang can properly analyze our expressions without getting upset. You might wonder why we are talking about compilers in a post about Objective-C operators and expressions, but unnecessarily complex or deeply nested arithmetic and expressions can significantly impact compilation performance, so it is important to use operators and expressions as simply and clearly as possible.

Now let us go through the operators and expressions in Objective-C.

# Summary

## 1. Expressions

A basic expression in Objective-C consists of an operator, two operands, and one assignment, as shown below:

```objectivec
int price = 12 + 25;
```

`int` : Data type
`price` : Variable name
`=` : Assignment operator
`10` : Operand 1
`+` : Arithmetic operator
`20` : Operand 2
`;` : Statement separator

The output of the above expression is as follows:

```objectivec
NSLog(@"price = %d", price);
```

```bash
price = 37
Program ended with exit code: 0
```

## 2. Operators

### 2.1. Assignment Operator

The assignment operator assigns a value or the result of an operation on the right side to the variable on the left side of the operator.

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

### 2.2. Arithmetic Operators

Arithmetic operators are used to write mathematical expressions such as addition, subtraction, division, multiplication, and modulo operations.
They can be used as unary or binary operators.

```objectivec
int price = 10;

// Sign inversion
price = -price;
NSLog(@"price = %d", price);

// Addition
price = 13 + 20;
NSLog(@"price = %d", price);

// Subtraction
price = 10 - 27;
NSLog(@"price = %d", price);

// Multiplication
price = 12 * 20;
NSLog(@"price = %d", price);

// Division
price = 11 / 9;
NSLog(@"price = %d", price);

// Modulo
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

### 2.3. Compound Assignment Operators

Compound assignment operators are a combined form of bitwise or arithmetic operators with the assignment operator.

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

### 2.4. Increment and Decrement Operators

Increment and decrement operators are used to increase or decrease the value of an operand by 1.
Be careful when using prefix and postfix forms, as they can produce different results depending on the intended use.

```objectivec
// Prefix increment
int price1 = 10;
NSLog(@"%d", ++price1);

// Postfix increment
int price2 = 10;
NSLog(@"%d", price2++);

// Prefix decrement
int price3 = 10;
NSLog(@"%d", --price3);

// Postfix decrement
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

### 2.5. Comparison Operators

Comparison operators are used to compare two given operands, as the name suggests.

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

### 2.6. Boolean Logical Operators

Logical operators provide logical operations on given operands, as the name suggests. Depending on the condition of the left operand, the condition of the subsequent operand may not be evaluated. (Short Circuit Evaluation)

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

### 2.7. Ternary Operators

The ternary operator evaluates the given condition before `?` and selects the true expression if the condition is true, or the false expression if it is false.

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

It can also be used in the form op1 `?:` op2, where op1 is selected if it is true, and op2 is selected if it is false.

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

### 2.8. Bitwise Operators

Bitwise operators provide binary operations on data.

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

### 2.9. Type Conversion Operator

The type conversion operator is used to explicitly convert the data on the right side of the operator to a specific data type. Data loss may occur.

```objectivec
int conversion = (int)22.5;
NSLog(@"%d", conversion);
```

```bash
casconversiont = 22
Program ended with exit code: 0
```

You can also explicitly convert an instance of a specific class to an instance of another class.
This is primarily used to cast instances of the id data type to specific class instances, or to upcast or downcast instances in an inheritance hierarchy.

```objectivec
id sushi = [[SalmonSushi alloc] init];
SalmonSushi *a = (SalmonSushi *)sushi;
```

```objectivec
Child *child = [[Child alloc] init];
Parent *parent = (Parent *)child;
```

## 3. Associativity

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

The operator with the highest precedence is placed at the top of the table, and precedence decreases as you go down. Among the operators, the one with the highest precedence is evaluated first.

# References

- <https://codescracker.com/objective-c/objective-c-operators.htm>
- <https://www.techotopia.com/index.php/Objective-C_Operators_and_Expressions>
- <https://www.tutorialspoint.com/objective_c/objective_c_operators.htm>
