---
title: "[macOS] Recording Microphone and System Audio Together with QuickTime Player"
ref: macos-quicktime-blackhole-audio-recording
lang: en
permalink: /en/:categories/:title/
excerpt: "How to record both microphone input and system audio simultaneously in QuickTime Player using BlackHole."
date: 2026-02-17T17:00+09:00
last_modified_at: 2026-02-17T17:00+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/macos-quicktime-blackhole-audio-recording.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/macos-quicktime-blackhole-audio-recording.png"
categories:
  - Development
  - Apple
  - macOS
tags:
  - Development
  - Apple
  - macOS
  - QuickTime Player
  - BlackHole
  - Audio MIDI Setup
depth:
  - title: "Development"
    url: /en/development/
  - title: "Apple"
    url: /en/development/apple/
  - title: "macOS"
    url: /en/development/apple/macos/
---

{% assign img_path = "/assets/image/post/development/apple/macos/macos-quicktime-blackhole-audio-recording" %}

# Overview

How to record both microphone input and system audio simultaneously in QuickTime Player using BlackHole.

# Steps

QuickTime Player on macOS can only capture microphone input during screen recording — it cannot record system audio (the sound coming out of your speakers). To record both, you need a virtual audio driver called BlackHole to loop back system audio, then combine it with microphone input into a single input device.

## 1. Install BlackHole

[BlackHole](https://existential.audio/blackhole/) is an open-source virtual audio driver for macOS that enables audio routing between applications. Download the installer from the official site and run it.

Once installed, BlackHole 16ch appears in the device list of Audio MIDI Setup.

## 2. Create a Multi-Output Device

To hear system audio through your speakers (or headphones) while simultaneously sending it to BlackHole, you need a Multi-Output Device.

Open Audio MIDI Setup, click the `+` button at the bottom left, and select `Create Multi-Output Device`.

![Audio MIDI Setup]({{ img_path }}/audio-midi-setup.png){: .align-center}
*Audio MIDI Setup — click the `+` button at the bottom to create a device*
{: .text-center}

In the right panel, check both your actual output device (AirPods, speakers, etc.) and BlackHole 16ch. Also enable drift correction for BlackHole.

![Multi-Output Device]({{ img_path }}/multi-output-device.png){: .align-center}
*Multi-Output Device — select both your speakers and BlackHole*
{: .text-center}

This routes system audio to both your speakers and BlackHole simultaneously.

## 3. Create an Aggregate Device

To combine microphone input and BlackHole input into a single device, you need an Aggregate Device.

Click the `+` button again and select `Create Aggregate Device`. In the right panel, check both your microphone (e.g. AirPods Pro) and BlackHole 16ch. Enable drift correction for BlackHole.

![Aggregate Device]({{ img_path }}/aggregate-device.png){: .align-center}
*Aggregate Device — combines microphone and BlackHole into one input device*
{: .text-center}

The Aggregate Device merges the physical input channels of your microphone with BlackHole's virtual input channels, allowing QuickTime Player to capture both sources simultaneously.

## 4. Change System Output Device

Click the sound icon in the menu bar or go to System Settings → Sound and change the output device to the `Multi-Output Device` you just created.

![Sound output settings]({{ img_path }}/sound-output.png){: .align-center style="max-width: min(400px, 100%);"}
*Change sound output to Multi-Output Device*
{: .text-center}

In this state, system audio is sent to both your speakers and BlackHole. You can hear sound normally through your speakers while also routing it to the recording.

## 5. Record with QuickTime Player

Open QuickTime Player and press `⌘⇧5` or select `File → New Screen Recording` from the menu. Click `Options` in the bottom toolbar, and under the microphone section, select `Aggregate Device`.

![QuickTime recording settings]({{ img_path }}/quicktime-recording.png){: .align-center style="max-width: min(400px, 100%);"}
*QuickTime screen recording — select Aggregate Device as the microphone*
{: .text-center}

Start recording, and both microphone input and system audio will be captured together.

## 6. Restore Settings After Recording

After recording, change the sound output back to your original device (speakers, AirPods, etc.). System volume control may not work while using the Multi-Output Device.

## 7. Uninstall BlackHole

If you no longer need BlackHole, delete `BlackHole16ch.driver` from `/Library/Audio/Plug-Ins/HAL/`.

![HAL path]({{ img_path }}/hal-path.png){: .align-center style="max-width: min(600px, 100%);"}
*Navigate to `/Library/Audio/Plug-Ins/HAL/` in Finder*
{: .text-center}

![HAL directory]({{ img_path }}/hal-directory.png){: .align-center}
*Delete BlackHole16ch.driver to uninstall*
{: .text-center}

# References

- <https://existential.audio/blackhole/>
- <https://support.apple.com/guide/audio-midi-setup/ams11031/mac>
