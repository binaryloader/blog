---
date: 2021-08-15T00:00+09:00
title: "[Synology] Manually Renewing SSL Certificates via Command Line"
ref: ssl-certificate-manual-renew-with-command-line
lang: en
excerpt: "A guide on how to manually renew SSL certificates on a Synology NAS."
last_modified_at: 2021-08-15T14:50+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/ssl-certificate-manual-renew-with-command-line.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/ssl-certificate-manual-renew-with-command-line.png"
categories:
  - Playground
  - Synology
tags:
  - Playground
  - Synology
  - SSL
  - Certificate
  - NAS
  - Let's Encrypt
  - SSH
depth:
  - title: "Playground"
    url: /en/playground/
  - title: "Synology"
    url: /en/playground/synology/
---

# Overview

This guide explains how to manually renew SSL certificates on a Synology NAS.

# Introduction

When using a reverse proxy or in certain environments, the automatic renewal of Let's Encrypt SSL certificates may fail.
In such cases, you typically perform a manual renewal through the DSM Control Panel. However even when the certificate renewal fails through the Control Panel, it doesn't provide a detailed explanation of why it failed.

In situations like this, you can SSH into your Synology and manually renew the certificate. When renewing certificates via the command line, you can use debug options like `-v` or `-vv` to find out why the renewal failed. The difference between the two options is that `-vv` outputs more detailed logs than `-v`.

# Steps

## 1. Renewal

```bash
/usr/syno/sbin/syno-letsencrypt renew-all -vv
```
