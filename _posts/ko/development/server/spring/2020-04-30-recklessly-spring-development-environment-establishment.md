---
date: 2020-04-30T00:00+09:00
title: "[Spring] 스프링 5 개발환경 구축하기"
ref: spring-development-environment-establishment
excerpt: "Spring 5 개발 환경을 구축하는 방법을 정리한다."
last_modified_at: 2020-04-30T21:26+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Development
  - Server
  - Spring
tags:
  - Development
  - Server
  - Spring
depth:
  - title: "Development"
    url: /ko/development/
  - title: "Server"
    url: /ko/development/server/
  - title: "Spring"
    url: /ko/development/server/spring/
gallery_eclipse:
  - url: /assets/image/post/development/server/spring/recklessly-spring-development-environment-establishment/eclipse.png
    image_path: /assets/image/post/development/server/spring/recklessly-spring-development-environment-establishment/eclipse.png
---

# 개요

Spring 5 개발 환경을 구축하는 방법을 정리한다.

# 들어가며

내가 운이 없는 것인지 사이드 프로젝트를 진행하는 경우 서버 개발을 담당하기로 한 팀원이 탈주하는 상황이 빈번하게 벌어진다.
아주 어렵게 팀 빌딩하고 기획하고 프로젝트를 시작하면 대략 3주 정도가 지난 시점부터 탈주 닌자들이 나오기 시작한다.

물론 회사 업무와 병행하며 사이드 프로젝트를 진행하는게 어렵다는 것은 이해를 한다. 그래도 다들 없는 시간 쪼개서 진행하는건데 끝까지 마칠 수 있었으면 좋겠다.
그래서 나는 더 이상 사이드 프로젝트를 위한 팀 빌딩을 하지 않고 혼자서 서버 개발까지 해보려고 한다. 어차피 누구나 처음 접하는 영역은 맨땅에 헤딩하며 배우는 것 아니겠어?

근데 무엇부터 해야 할지 감을 잡기가 어려워서 교보문고에 가서 눈에 띄는 도서 하나를 구입했다. 최범균님이 집필하신 `초보 웹 개발자를 위한 스프링 5 프로그래밍 입문`이다.
이 책을 공부하며 스프링 프레임워크를 통한 서버 개발의 전반적인 흐름을 알 수 있었으면 좋겠다.

또한 스프링 프레임워크를 공부하는 동안의 모든 삽질을 `무작정 스프링 개발` 시리즈를 통해 기록하도록 하겠다. 그럼 그 첫번째 단계로 스프링 5 개발환경을 구축해보겠다.

# 개발환경 구축

## 1. JDK 8 설치

- [Java SE Development Kit 8](https://www.oracle.com/java/technologies/javase-jdk8-downloads.html)을 다운로드 및 설치한다.
- 이 글을 작성할 시점의 버전은 8u251이다.
- 환경 변수를 별도로 잡아줘야 한다는데 알아서 잘 찾아서 이 단계는 패스한다.
- 아래와 같은 커맨드를 수행해서 JDK가 잘 설치되었는지 결과를 확인한다.

```zsh
java -version
java version "1.8.0_251"
Java(TM) SE Runtime Environment (build 1.8.0_251-b08)
Java HotSpot(TM) 64-Bit Server VM (build 25.251-b08, mixed mode)
```

## 2. Maven 설치

- [Apache Maven Project](https://maven.apache.org/download.cgi)로 이동하여 바이너리 압축 파일(tar.gz)을 다운로드한다.
- 이 글을 작성할 시점의 버전은 3.6.3이다.
- 아래와 같은 커맨드를 수행해서 압축을 해제하고 `적절한 경로`로 apache-maven-3.6.3 폴더를 옮긴다.

```zsh
tar xzf apache-maven-3.6.3-bin.tar.gz
```

- mvn 커맨드 사용을 위해서 환경 변수를 잡아줘야 하는데 zsh를 사용 중이므로 `.zshrc`를 열어서 아래와 같이 설정한다.

```zsh
vi ~/.zshrc
```

- 전 단계에서 maven 폴더를 옮겼던 `적절한 경로`로 잡아주면 된다. 난 Library로 옮겼기 때문에 {HOME}/Library/apache-maven-3.6.3로 잡아줬다.

```zsh
export MVN=${HOME}/Library/apache-maven-3.6.3
export PATH=$PATH:${MVN}/bin
```

- 그리고 아래와 같은 커맨드를 수행해서 zshrc 파일을 다시 읽어들이도록 한다.

```zsh
source ~/.zshrc
```

- 여기까지 완료되었다면 아래와 같은 커맨드를 수행해서 mvn 커맨드가 잘 동작하는지 확인한다.

```zsh
mvn -version
Maven home: /Users/dongwook/Library/Apache-maven-3.6.3
Java version: 1.8.0_251, vendor: Oracle Corporation, runtime: /Library/Java/JavaVirtualMachines/jdk1.8.0_251.jdk/Contents/Home/jre
Default locale: ko_KR, platform encoding: UTF-8
OS name: "mac os x", version: "10.15.4", arch: "x86_64", family: "mac"
```

## 3. Gradle 설치

- Gradle은 Homebrew로 설치할 수 있다.
- 이 글을 작성할 시점의 버전은 6.3이다.

```zsh
brew install gradle
```

- 설치가 완료되면 아래와 같은 커맨드를 수행해서 Gradle이 잘 설치되었는지 결과를 확인한다.

```zsh
gradle -version
Welcome to Gradle 6.3!
..중략..
Build time:   2020-03-24 19:52:07 UTC
Revision:     bacd40b727b0130eeac8855ae3f9fd9a0b207c60
Kotlin:       1.3.70
Groovy:       2.5.10
Ant:          Apache Ant(TM) version 1.10.7 compiled on September 1 2019
JVM:          13.0.2 (Oracle Corporation 13.0.2+8)
OS:           Mac OS X 10.15.4 x86_64
```

## 4. Eclipse 설치

- [Eclipse Foundation](https://www.eclipse.org/downloads/)으로 이동하여 다운로드 및 설치를 한다.
- 난 Eclipse IDE for Enterprise Java Developers를 받았다.
- 설치가 완료되었다면 아래와 같이 이클립스가 정상적으로 실행이 되는지 확인해보자.

{% include gallery id="gallery_eclipse" %}

# 마치며

여기까지 완료되었다면 스프링 5 개발환경 구축은 모두 완료되었다. iOS 개발과 다르게 개발환경을 구축하는 것이 낯설어서 그런지 생각보다 오래 걸렸다.
오늘은 여기까지 하고 다음에는 프로젝트를 생성하여 대망의 `Hello, World!`를 찍어보도록 하겠다.
