---
title: "[macOS] QuickTime Player로 마이크와 시스템 오디오를 함께 녹음하는 방법"
ref: quicktime-blackhole-audio-recording
excerpt: "BlackHole을 이용해 QuickTime Player에서 마이크 입력과 시스템 오디오를 동시에 녹음하는 방법을 정리한다."
date: 2026-02-17T17:00+09:00
last_modified_at: 2026-02-17T17:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/quicktime-blackhole-audio-recording.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/ko/quicktime-blackhole-audio-recording.png"
categories:
  - PC
  - macOS
tags:
  - macOS
  - QuickTime Player
  - BlackHole
  - Audio MIDI Setup
depth:
  - title: "PC"
    url: /ko/pc/
  - title: "macOS"
    url: /ko/pc/macos/
credits:
  planning: binaryloader
  research: binaryloader
  drafting: binaryloader
  editing: binaryloader
  review: binaryloader
  translation: Claude
  thumbnail: Claude
  publishing: Claude
---

{% assign img_path = "/assets/image/post/pc/macos/quicktime-blackhole-audio-recording" %}

# 개요

BlackHole을 이용해 QuickTime Player에서 마이크 입력과 시스템 오디오를 동시에 녹음하는 방법을 정리한다.

# 정리

macOS의 QuickTime Player는 화면 녹화 시 마이크 입력만 녹음할 수 있고 시스템에서 재생되는 소리(스피커 출력)는 캡처하지 못한다. 마이크와 시스템 오디오를 함께 녹음하려면 가상 오디오 드라이버인 BlackHole을 이용해 시스템 오디오를 루프백한 뒤 마이크 입력과 합쳐서 하나의 입력 장치로 만들어야 한다.

## 1. BlackHole 설치

[BlackHole](https://existential.audio/blackhole/)은 macOS용 오픈소스 가상 오디오 드라이버다. 앱 간에 오디오를 라우팅할 수 있게 해준다. 공식 사이트에서 설치 파일을 다운로드하여 실행하면 된다.

설치가 완료되면 오디오 MIDI 설정(Audio MIDI Setup)의 장치 목록에 BlackHole 16ch가 나타난다.

## 2. 다중 출력 기기 생성

시스템 오디오를 스피커(또는 이어폰)로 들으면서 동시에 BlackHole로도 보내려면 다중 출력 기기가 필요하다.

오디오 MIDI 설정을 열고 왼쪽 하단의 `+` 버튼을 클릭한 뒤 `다중 출력 기기 생성`을 선택한다.

![오디오 MIDI 설정]({{ img_path }}/audio-midi-setup.png){: .align-center}
*오디오 MIDI 설정 - 하단 `+` 버튼으로 기기를 생성한다*
{: .text-center}

오른쪽 패널에서 실제로 소리를 들을 출력 장치(AirPods, 스피커 등)와 BlackHole 16ch를 모두 체크한다. BlackHole의 드리프트 보정도 체크해 준다.

![다중 출력 기기]({{ img_path }}/multi-output-device.png){: .align-center}
*다중 출력 기기 - 스피커와 BlackHole을 함께 선택한다*
{: .text-center}

이렇게 하면 시스템 오디오가 스피커와 BlackHole 양쪽으로 동시에 출력된다.

## 3. 통합 기기 생성

마이크 입력과 BlackHole 입력을 하나의 장치로 합치려면 통합 기기가 필요하다.

다시 `+` 버튼을 클릭해 `통합 기기 생성`을 선택한다. 오른쪽 패널에서 마이크(AirPods Pro 등)와 BlackHole 16ch를 모두 체크한다. BlackHole의 드리프트 보정을 체크한다.

![통합 기기]({{ img_path }}/aggregate-device.png){: .align-center}
*통합 기기 - 마이크와 BlackHole을 하나의 입력 장치로 합친다*
{: .text-center}

통합 기기는 마이크의 물리적 입력 채널과 BlackHole의 가상 입력 채널을 하나로 묶어서 QuickTime Player가 두 소스를 동시에 캡처할 수 있게 해준다.

## 4. 시스템 출력 장치 변경

메뉴바의 사운드 아이콘을 클릭하거나 시스템 설정 → 사운드에서 출력 장치를 앞서 만든 `다중 출력 기기`로 변경한다.

![사운드 출력 설정]({{ img_path }}/sound-output.png){: .align-center style="max-width: min(400px, 100%);"}
*사운드 출력을 다중 출력 기기로 변경한다*
{: .text-center}

이 상태에서는 시스템 오디오가 스피커와 BlackHole로 동시에 출력된다. 스피커로 소리를 정상적으로 들으면서 BlackHole을 통해 녹음도 가능해진다.

## 5. QuickTime Player로 녹음

QuickTime Player를 열고 `⌘⇧5` 또는 메뉴에서 `파일 → 새로운 화면 기록`을 선택한다. 하단 툴바에서 `옵션`을 클릭하면 마이크 항목이 나타난다. 여기서 `통합 기기`를 선택한다.

![QuickTime 녹음 설정]({{ img_path }}/quicktime-recording.png){: .align-center style="max-width: min(400px, 100%);"}
*QuickTime 화면 기록 - 마이크를 통합 기기로 선택한다*
{: .text-center}

녹화를 시작하면 마이크 입력과 시스템 오디오가 함께 녹음된다.

## 6. 녹음 후 원래대로 되돌리기

녹음이 끝나면 사운드 출력을 원래 장치(스피커, AirPods 등)로 다시 변경한다. 다중 출력 기기 상태에서는 시스템 볼륨 조절이 되지 않을 수 있다.

## 7. BlackHole 삭제

BlackHole을 더 이상 사용하지 않으면 `/Library/Audio/Plug-Ins/HAL/` 경로에서 `BlackHole16ch.driver`를 삭제하면 된다.

![HAL 경로]({{ img_path }}/hal-path.png){: .align-center style="max-width: min(600px, 100%);"}
*Finder에서 `/Library/Audio/Plug-Ins/HAL/`로 이동*
{: .text-center}

![HAL 디렉토리]({{ img_path }}/hal-directory.png){: .align-center}
*BlackHole16ch.driver를 삭제하면 된다*
{: .text-center}

# 참고

- <https://existential.audio/blackhole/>
- <https://www.youtube.com/watch?v=tZ03DpRufxo>
