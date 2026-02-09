---
title: "[Router] How to Enable HTTPS on ASUS Router Settings Page"
ref: setting-asus-router-enable-https
lang: en
excerpt: "A guide on how to enable HTTPS for the ASUS router settings page."
last_modified_at: 2021-10-17T08:15+09:00
published: true
header:
  overlay_color: "#202020"
categories:
  - Playground
  - Router
tags:
  - Playground
  - Router
  - ASUS
  - RT-AX3000
  - HTTPS
  - Certificate
depth:
  - title: "Playground"
    url: /en/playground/
  - title: "Router"
    url: /en/playground/router/
gallery_local_access_settings:
  - url: /assets/image/post/playground/router/asus-router-settings-page-enable-https/local-access-settings.png
    image_path: /assets/image/post/playground/router/asus-router-settings-page-enable-https/local-access-settings.png
gallery_trust_certificate:
  - url: /assets/image/post/playground/router/asus-router-settings-page-enable-https/trust-certificate.png
    image_path: /assets/image/post/playground/router/asus-router-settings-page-enable-https/trust-certificate.png
---

# Overview

This guide explains how to enable HTTPS for the ASUS router settings page.

# Steps

## 1. Access the ASUS Settings Page

- http://192.168.50.1
- http://router.asus.com

## 2. Advanced Settings - Administration - System

### 2.1. Configure the Local Access Settings as Follows

{% include gallery id="gallery_local_access_settings" %}

- Authentication Method: BOTH or HTTPS
- HTTPS LAN Port: 8443
- Click the Export button under Download Certificate to download the `*.crt` file.
- Double-click the downloaded file to register it in the Keychain login items.

## 3. Register and Trust the Certificate in Keychain

{% include gallery id="gallery_trust_certificate" %}

- Right-click the certificate named `router.asus.com` in Keychain and click Get Info.
- Change the SSL (Secure Sockets Layer) setting to Always Trust as shown in the screenshot above.

## 4. Verify HTTPS Access

- Enter https://router.asus.com:8443 in your browser and verify the connection.

# References

- <https://www.asus.com/kr/support/FAQ/1034294/>
