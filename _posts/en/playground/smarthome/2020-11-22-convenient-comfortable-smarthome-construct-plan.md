---
date: 2020-11-22T00:00+09:00
title: "[SmartHome] Planning a Convenient and Comfortable Smart Home"
ref: smarthome-construct-plan
lang: en
excerpt: "A summary of the plan for building a convenient and comfortable smart home infrastructure."
last_modified_at: 2020-11-22T18:12+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/smarthome-construct-plan.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/smarthome-construct-plan.png"
categories:
  - Playground
  - SmartHome
tags:
  - Playground
  - SmartHome
  - IoT
  - ZigBee
  - SmartThings
depth:
  - title: "Playground"
    url: /en/playground/
  - title: "SmartHome"
    url: /en/playground/smarthome/
gallery_infra:
  - url: /assets/image/post/playground/smarthome/convenient-comfortable-smarthome-construct-plan/infra.png
    image_path: /assets/image/post/playground/smarthome/convenient-comfortable-smarthome-construct-plan/infra.png
---

# Overview

This post summarizes the plan for building a convenient and comfortable smart home infrastructure.

# Introduction

One day I happened to come across a smart home video on YouTube. The house in the video had lights, curtains, furniture, and appliances all controllable through a smartphone app, with condition-based automation set up throughout. My first thought was "Wow, this looks incredibly fun."

When I was building a mobile app-based controller panel for smart home devices at work, I didn't feel much curiosity. But this time, I was hooked the moment I saw it.

# Preparation

## 1. Think About the Purpose

- The goal is to leverage IoT technology for a more convenient and comfortable lifestyle.
- Another goal is to integrate all electronics, devices, and furniture into a single network and control the home through touch, voice commands, and automation via an application.
- Honestly, the main reason is that it just looks fun.

## 2. Research and Explore

### 2.1. Smart Home YouTube Channels

Since I use almost all of Apple's devices, I initially planned to build a smart home using HomeKit and Apple-certified products. However after some research I found that the selection of certified devices was very limited and they were far too expensive.
I spent a good amount of time deep-diving into YouTube channels to figure out how to build a smart home like the ones in those videos within a reasonable budget.

- [Onaldo's Smart Home Build](https://www.youtube.com/c/Onaldo7)
- [Smart Home Living](https://www.youtube.com/c/HomeIoT)
- [Kuru Guy's Smart Home Build](https://www.youtube.com/channel/UCm0uQ1mIl_QW1XOFVCmK4dA)
- [Ray's Smart Home with HA](https://www.youtube.com/c/HAsmarthome)

### 2.2. Smart Home Communities

While searching the web for more detailed information than what YouTube offered, I discovered a Naver Cafe (Korean online community) where people running smart homes primarily based on SmartThings gathered.

- [Smartthings & IoT home Community](https://cafe.naver.com/stsmarthome)

I decided to review the guides and posts shared by pioneers who had already embarked on this challenging journey before making my decision. To my surprise, all the YouTube channel owners mentioned above were members of this community as well.

### 2.3. Choosing the Primary Communication Protocol

After watching the YouTube videos and reading community posts, I realized that the first priority was to choose the main smart home platform and communication protocol (setting aside HomeKit).
I decided to pick the communication protocol first, and found that there were smart home devices and platforms using various standards including `Wi-Fi`, `Bluetooth`, `ZigBee`, and `Z-Wave`.

The low-power communication protocols commonly used in the smart home ecosystem appear to be `ZigBee` and `Z-Wave`. I decided to skip `Z-Wave` because its frequency bands differ by country.
I ultimately chose `ZigBee` as my primary communication protocol. I wasn't too worried about devices using other protocols since they could potentially be integrated into the platform through cloud services and bridges.

### 2.4. Choosing a ZigBee Hub

There were quite a few hubs available that could work with `ZigBee` devices. Among them, I chose the SmartThings Hub for the following reasons:

- Although Samsung Electronics has been stepping back from smart home hardware, their brand recognition still carries some weight, and I expect their after-sales support to remain reasonable.
- Samsung continues to handle the development and improvement of software such as controller clients and WebCoRE for automation.
- Through mini app-style plugins (SmartApps) and device drivers (DTH), it supports cloud integration of devices that cannot be directly connected to the hub, as well as integration across different platforms.
- The developer documentation and developer community are well-established.

## 3. Smart Home Infrastructure Plan

Based on everything I've researched and decided so far, I've roughly sketched out a smart home infrastructure plan.
This is still an early version and may be based on incorrect information, so please use it as a rough reference only.
I'll redraw it as I actually build things out one by one.

{% include gallery id="gallery_infra" %}

I plan to build the smart home in my new place after moving in February. Since I live with my family, I'll start with my own room and gradually expand the coverage.
The key thing to remember is that a smart home should be about creating a comfortable and cozy environment - it should never turn into a situation where you implement various features and then tolerate the inconveniences. If even one family member feels uncomfortable or has complaints about the smart home, that device should be immediately repaired or removed.
