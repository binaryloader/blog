---
date: 2019-11-15T00:00+09:00
title: "[Objective-C] Primitive Data Types"
ref: objective-c-primitive-data-types
lang: en
excerpt: "A summary of primitive data types in Objective-C."
last_modified_at: 2019-11-15T13:12+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/objective-c-primitive-data-types.png"
  overlay_filter: "0.1"
  teaser: "/assets/image/thumbnail/teaser/objective-c-primitive-data-types.png"
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
    url: /en/development/
  - title: "Language"
    url: /en/development/language/
  - title: "Objective-C"
    url: /en/development/language/objective-c/
---

# Overview

A summary of primitive data types in Objective-C.

# Note

This post is based on `Objective-C 2.0`.

# Introduction

When first studying Objective-C, I think it is a good idea to strictly distinguish between the data types provided by Foundation (Classes or Type Aliases that redefine types) and the primitive types. In this post, I will cover Primitive Data Types.

Objective-C is a `strict superset` of ANSI C, so you can use most of the data types provided by ANSI C, as well as structs and unions.

# Summary

## 1. Character Data Type

### 1.1. char (32bit / 64bit)

| TYPE          | Size  | Range                     |
| ------------- | ----- | ------------------------- |
| signed char   | 1byte | Min : -128<br />Max : 127 |
| unsigned char | 1byte | Min : 0<br />Max : 255    |

{: .notice--info}
**Note:** Although the data stored in char is actually an integer, it is sometimes treated as a character data type, so I separated it from the integer data types. char is both an integer data type and a character data type.

## 2. Integer Data Types

### 2.1. short int (32bit / 64bit)

| TYPE               | Size  | Range                           |
| ------------------ | ----- | ------------------------------- |
| signed short int   | 2byte | Min : -32,768<br />Max : 32,767 |
| unsigned short int | 2byte | Min : 0<br />Max : 65,535       |

### 2.2. int (32bit / 64bit)

| TYPE         | Size  | Range                                         |
| ------------ | ----- | --------------------------------------------- |
| signed int   | 4byte | Min : -2,147,483,648<br />Max : 2,147,483,647 |
| unsigned int | 4byte | Min : 0<br />Max : 4,294,967,295              |

### 2.3. long int (32bit)

| TYPE              | Size  | Range                                         |
| ----------------- | ----- | --------------------------------------------- |
| signed long int   | 4byte | Min : -2,147,483,648<br />Max : 2,147,483,647 |
| unsigned long int | 4byte | Min : 0<br />Max : 4,294,967,295              |

### 2.4. long int (64bit)

| TYPE              | Size  | Range                                                                 |
| ----------------- | ----- | --------------------------------------------------------------------- |
| signed long int   | 8byte | Min : -9,223,372,036,854,775,808<br />Max : 9,223,372,036,854,775,807 |
| unsigned long int | 8byte | Min : 0<br />Max : 18,446,744,073,709,551,615                         |

### 2.5. long long int (32bit / 64bit)

| TYPE                   | Size  | Range                                                                 |
| ---------------------- | ----- | --------------------------------------------------------------------- |
| signed long long int   | 8byte | Min : -9,223,372,036,854,775,808<br />Max : 9,223,372,036,854,775,807 |
| unsigned long long int | 8byte | Min : 0<br />Max : 18,446,744,073,709,551,615                         |

## 3. Floating-Point Data Types

### 3.1. float (32bit / 64bit)

| TYPE  | Size  | Range                                      |
| ----- | ----- | ------------------------------------------ |
| float | 4byte | Min : 1.175494e-38<br />Max : 3.402823e+38 |

### 3.2. double (32bit / 64bit)

| TYPE   | Size  | Range                                        |
| ------ | ----- | -------------------------------------------- |
| double | 8byte | Min : 2.225074e-308<br />Max : 1.797693e+308 |

## 4. Boolean Data Type

### 4.1. BOOL

BOOL, used to represent boolean values, is actually a data type redefined with typedef.
Depending on the compiler type, version, or the platform environment where the binary runs, it may be a redefined form of `int` or `char`.
In C, before C99, developers used to define the BOOL data type themselves like this:

```objectivec
typedef int bool

#define false 0
#define true  1

bool bValue;
bValue = true;
```

Then in C99, a data type for storing boolean values was officially introduced. Since developers had already been redefining the `int` data type as `bool` before C99 as shown above, the keyword `bool` could not be used. Instead, the `_BOOL` keyword was used to support boolean values.

```objectivec
// stdbool.h

typedef _Bool bool;

#define true   (_Bool)1
#define false  (_Bool)0
```

However, since `_BOOL` is a bit longer than `bool`, as you can see above, `stdbool.h` separately defines and provides the `bool` data type. So in C99, if you want to use `bool` instead of `_BOOL`, you need to include `stdbool.h`.

You might wonder why we are talking about C when we are looking at Objective-C. As mentioned at the beginning of this post, Objective-C is a `strict superset` of C, so in Objective-C as well, BOOL could have been a redefined form of `int` or `char` depending on the compiler type, version, or platform environment.

"Could have been"? Not "could be"? What does that mean? That refers to the era when Xcode used GCC before adopting Clang. During the GCC era, the underlying data type could have been either `int` or `char` depending on the version.

In the past, there were reportedly many issues caused by such differences in boolean data types. Nowadays, C compilers comply reasonably well with the ANSI C standard, so the underlying data types adopted for boolean types are nearly identical, and true/false logical values are well-normalized to 0 and 1, preventing issues.

During the transitional period, boolean data types could contain data other than 0 and 1 (any data the underlying type could represent), which caused many issues due to logical flaws in true/false comparisons. In older versions of Visual Studio that did not strictly follow the ANSI C standard, `bool` was `char` and `BOOL` was `int`, which reportedly confused developers even further. Keep this rambling history in mind and exercise extra caution when using boolean data types in older C compilers.

So what about the current Xcode that has adopted Clang? Let us check for ourselves since we are curious.

First, let us look inside `objc.h` in the macOS SDK and iOS SDK.

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

Wow! Even though I only extracted the BOOL-related content from the header, it is complex.
Let us go through it one by one.

#### 4.1.1. Decision Condition 1

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

When `__OBJC_BOOL_IS_BOOL` is defined, `OBJC_BOOL_IS_BOOL` is defined as `0` or `1` based on its value.

#### 4.1.2. Decision Condition 2

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

When `__OBJC_BOOL_IS_BOOL` is not defined, `OBJC_BOOL_IS_BOOL` is defined as `0` or `1` based on the target operating system, platform, and architecture type.

#### 4.1.3. Decision Condition 3

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

If `OBJC_BOOL_IS_BOOL`, determined by **Decision Condition 1** and **Decision Condition 2**, is true, then bool is redefined as BOOL. If false, signed char is redefined as BOOL.

#### 4.1.4. Let Us Test Whether the Decision Conditions Are Correct

After looking inside the header, I have a rough idea now. Let us write some code and verify by debugging.
First, let us create a macOS Command Line Tool project and write the following code.

```objectivec
NSLog(@"__OBJC_BOOL_IS_BOOL = %@", __OBJC_BOOL_IS_BOOL ? @"defined" : @"undefined");
NSLog(@"TARGET_OS_OSX = %@", TARGET_OS_OSX ? @"YES" : @"NO");
NSLog(@"OBJC_BOOL_IS_BOOL = %@", OBJC_BOOL_IS_BOOL ? @"YES" : @"NO");
NSLog(@"OBJC_BOOL_IS_CHAR = %@", OBJC_BOOL_IS_CHAR ? @"YES" : @"NO");
```

The results are as follows:

```bash
__OBJC_BOOL_IS_BOOL = undefined
TARGET_OS_OSX = YES
OBJC_BOOL_IS_BOOL = NO
OBJC_BOOL_IS_CHAR = YES
Program ended with exit code: 0
```

Looking at the three decision conditions summarized earlier while understanding the output, we can say the following:

"When running a macOS Command Line Tool built with Xcode 11.5 and macOS 10.15 SDK on x86_64, macOS Catalina 10.15.4, BOOL is a data type that redefines char."

Let us also test on an iOS device. Create an iOS Single View App project and write the following code.

```objectivec
NSLog(@"__OBJC_BOOL_IS_BOOL = %@", __OBJC_BOOL_IS_BOOL ? @"defined" : @"undefined");
NSLog(@"TARGET_OS_OSX = %@", TARGET_OS_OSX ? @"YES" : @"NO");
NSLog(@"OBJC_BOOL_IS_BOOL = %@", OBJC_BOOL_IS_BOOL ? @"YES" : @"NO");
```

The results are as follows:

```bash
__OBJC_BOOL_IS_BOOL = defined
TARGET_OS_OSX = NO
OBJC_BOOL_IS_BOOL = YES
Program ended with exit code: 0
```

Oh! Then we could also say the following:

"When running an iOS Single View App built with Xcode 11.5 and iOS 13.5 SDK on iPhone 11 Pro, arm64, iOS 13.5.1, BOOL is a data type that redefines int.
Because BOOL is a redefined form of bool, and bool is a redefined form of int."

Wrong -- that was not the case. In the last C development environment I used, bool was int, so I naturally assumed it would also be int in Objective-C, but it turned out to be a char data type.
At first I was puzzled when sizeof returned 1, but after checking the [Apple developer documentation](https://developer.apple.com/documentation/objectivec/bool), the details were well documented.

In the end, BOOL can be summarized in the following table:

| TYPE | Typedef     | True | False |
| ---- | ----------- | ---- | ----- |
| BOOL | signed char | YES  | NO    |

#### 4.1.5. Tip: How to Check Processor Architecture

I tried to check the processor architecture as I would on Linux by running the following command:

```bash
arch
i386
```

The result was `i386`. No way. Sir, that cannot be right. My Mac should be 64-bit, so what happened?
I was startled and did some googling.

- [Stack Exchange Question1](https://unix.stackexchange.com/questions/518318/what-does-i386-mean-on-macos-mojave)
- [Stack Exchange Question2](https://apple.stackexchange.com/questions/140651/why-does-arch-output-i386)

Ah, on Mac, `arch` always returns `i386` for Intel CPUs regardless of whether it is PowerPC or Intel. So if you get `i386`, it means either `2-way universal` or `32-bit only`.

Then let us check the machine hardware name. Run the following command:

```bash
machine
x86_64h
```

Or:

```bash
uname -m
x86_64
```

Of course. That is more like it. Phew.

## 5. Instance Pointer Type

### 5.1. id (32bit)

| TYPE | Size  | Range            |
| ---- | ----- | ---------------- |
| id   | 4byte | Instance pointer |

### 5.2. id (64bit)

| TYPE | Size  | Range            |
| ---- | ----- | ---------------- |
| id   | 8byte | Instance pointer |

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

Although we said that the data id can represent is an instance pointer, to be more precise, it can hold a pointer to the struct objc_object that has an isa pointer as an instance variable.
It serves the same role as a void pointer in C, and polymorphism -- that is, dynamic binding and dynamic typing -- can be implemented using id pointers. The details of isa will be covered when we discuss the Objective-C runtime.

## 6. Format Specifiers Type

| Data Type              | Format Character    |
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

I tested in Xcode 12 and there were no build warnings when mixing format characters between signed and unsigned. Still, for backward compatibility and issue prevention, it is better to use them correctly.

# Let Us Verify with Our Own Eyes

Now let us check the size, minimum, and maximum values of each data type ourselves.
I do not have a 32-bit device, so I will only test on a 64-bit device.

## 1. First, Let Us Look at the Size of Each Data Type

### 1.1. Character Data Type

#### 1.1.1. char (64bit)

```objectivec
NSLog(@"size of char is %ld", sizeof(char));
NSLog(@"size of unsigned char is %ld", sizeof(unsigned char));
```

```bash
size of char is 1
size of unsigned char is 1
Program ended with exit code: 0
```

### 1.2. Integer Data Types

#### 1.2.1. short int (64bit)

```objectivec
NSLog(@"size of short int is %ld", sizeof(short int));
NSLog(@"size of unsigned short int is %ld", sizeof(unsigned short int));
```

```bash
size of short int is 2
size of unsigned short int is 2
Program ended with exit code: 0
```

#### 1.2.2. int (64bit)

```objectivec
NSLog(@"size of int is %ld", sizeof(int));
NSLog(@"size of unsigned int is %ld", sizeof(unsigned int));
```

```bash
size of int is 4
size of unsigned int is 4
Program ended with exit code: 0
```

#### 1.2.3. long int (64bit)

```objectivec
NSLog(@"size of long int is %ld", sizeof(long int));
NSLog(@"size of unsigned long int is %ld", sizeof(unsigned long int));
```

```bash
size of long int is 8
size of unsigned long int is 8
Program ended with exit code: 0
```

#### 1.2.4. long long int (64bit)

```objectivec
NSLog(@"size of long long int is %ld", sizeof(long long int));
NSLog(@"size of unsigned long long int is %ld", sizeof(unsigned long long int));
```

```bash
size of long long int is 8
size of unsigned long long int is 8
Program ended with exit code: 0
```

### 1.3. Floating-Point Data Types

#### 1.3.1. float (64bit)

```objectivec
NSLog(@"size of float is %ld", sizeof(float));
```

```bash
size of float is 4
Program ended with exit code: 0
```

#### 1.3.2. double (64bit)

```objectivec
NSLog(@"size of double is %ld", sizeof(double));
```

```bash
size of double is 8
Program ended with exit code: 0
```

### 1.4. Boolean Data Type

#### 1.4.1. BOOL (64bit)

```objectivec
NSLog(@"size of BOOL is %ld", sizeof(BOOL));
```

```bash
size of BOOL is 1
Program ended with exit code: 0
```

### 1.5. Instance Pointer Type

#### 1.5.1. id (64bit)

```objectivec
NSLog(@"size of id is %ld", sizeof(id));
```

```bash
size of id is 8
Program ended with exit code: 0
```

## 2. Next, Let Us Print the Minimum and Maximum Values of Each Data Type

### 2.1. Character Data Type

#### 2.1.1. char (64bit)

```objectivec
NSLog(@"CHAR MIN is %d, CHAR MAX is %d", CHAR_MIN, CHAR_MAX);
NSLog(@"UCHAR MAX is %u", UCHAR_MAX);
```

```bash
CHAR MIN is -128, CHAR MAX is 127
UCHAR MAX is 255
Program ended with exit code: 0
```

### 2.2. Integer Data Types

#### 2.2.1. short int (64bit)

```objectivec
NSLog(@"SHRT MIN is %hd, SHRT MAX is %hd", SHRT_MIN, SHRT_MAX);
NSLog(@"USHRT MAX is %hu", USHRT_MAX);
```

```bash
SHRT MIN is -32768, SHRT MAX is 32767
USHRT MAX is 65535
Program ended with exit code: 0
```

#### 2.2.2. int (64bit)

```objectivec
NSLog(@"INT MIN is %d, INT MAX is %d", INT_MIN, INT_MAX);
NSLog(@"UINT MAX is %u", UINT_MAX);
```

```bash
INT MIN is -2147483648, INT MAX is 2147483647
UINT MAX is 4294967295
Program ended with exit code: 0
```

#### 2.2.3. long int (64bit)

```objectivec
NSLog(@"LONG MIN is %ld, LONG MAX is %ld", LONG_MIN, LONG_MAX);
NSLog(@"ULONG MAX is %lu", ULONG_MAX);
```

```bash
LONG MIN is -9223372036854775808, LONG MAX is 9223372036854775807
ULONG MAX is 18446744073709551615
Program ended with exit code: 0
```

#### 2.2.4. long long int (64bit)

```objectivec
NSLog(@"LLONG MIN is %lld, LLONG MAX is %lld", LLONG_MIN, LLONG_MAX);
NSLog(@"ULLONG MAX is %llu", ULLONG_MAX);
```

```bash
LLONG MIN is -9223372036854775808, LLONG MAX is 9223372036854775807
ULLONG MAX is 18446744073709551615
Program ended with exit code: 0
```

### 2.3. Floating-Point Data Types

#### 2.3.1. float (64bit)

```objectivec
NSLog(@"FLT MIN is %f, FLT MAX is %f", FLT_MIN, FLT_MAX);
```

```bash
FLT MIN is 0.000000, FLT MAX is 340282346638528859811704183484516925440.000000
Program ended with exit code: 0
```

#### 2.3.2. double (64bit)

```objectivec
NSLog(@"DBL MIN is %f, DBL MAX is %f", DBL_MIN, DBL_MAX);
```

```bash
DBL MIN is 0.000000, DBL MAX is 179769313486231570814527423731704356798070567525844996598917476803157260780028538760589558632766878171540458953514382464234321326889464182768467546703537516986049910576551282076245490090389328944075868508455133942304583236903222948165808559332123348274797826204144723168738177180919299881250404026184124858368.000000
Program ended with exit code: 0
```

### 2.4. Boolean Data Type

#### 2.4.1. BOOL (64bit)

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

### 2.5. Instance Pointer Type

#### 2.5.1. id (64bit)

```objectivec
id object = [[NSObject alloc] init];
NSLog(@"object address is %p", &object);
```

```bash
object address is 0x7ffeeb41b078
Program ended with exit code: 0
```

The memory address changes with each execution.

So far, we have explored the primitive data types provided by Objective-C. For those of you who like to dig deep like me, you might have additional questions like "What is the difference between NSInteger and int?" or "What is the difference between CGFloat and float?"
You can find out by looking inside the headers yourself. Headers are the specification itself.

Although in real-world development, I believe you will primarily use data types that have been redefined with typedef to match the appropriate architecture and platform. However, having a solid understanding of primitive data types will surely come in handy someday.

[+] If anyone has a 32-bit device, please run the code above and leave the results in the comments, and I will update the post.

# References

- <https://code.tutsplus.com/tutorials/objective-c-succinctly-data-types--mobile-21986>
- <https://andybargh.com/primitive-data-types-objective-c/>
- <https://www.tutorialspoint.com/objective_c/objective_c_data_types.htm>
