---
date: 2021-08-15T00:00+09:00
title: "[Synology] 커맨드 라인을 통한 SSL 인증서 수동 갱신하기"
ref: ssl-certificate-manual-renew-with-command-line
excerpt: "Synology NAS에서 SSL 인증서를 수동으로 갱신하는 방법을 정리한다."
last_modified_at: 2021-08-15T14:50+09:00
published: true
header:
  overlay_color: "#202020"
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
    url: /ko/playground/
  - title: "Synology"
    url: /ko/playground/synology/
---

# 개요

Synology NAS에서 SSL 인증서를 수동으로 갱신하는 방법을 정리한다.

# 들어가며

역방향 프록시를 사용하는 경우나 특정 사용 환경에서는 Let's Encrypt SSL 인증서의 자동 갱신이 되지 않는 경우가 있다.
이러한 경우 DSM의 제어판을 통하여 수동으로 갱신을 하게 되는데 이 과정에서 인증서 갱신에 실패를 하게 되더라도 왜 실패했는지
이유를 자세하게 알려주지 않는다.

이럴 때는 SSH로 시놀로지에 접속하여 인증서를 수동으로 갱신해주면 된다. 커맨드 라인으로 인증서 갱신 작업을 하는 경우 `-v` 혹은 `-vv`와 같은 디버그 옵션을 줄 수 있어서 인증서 갱신이 왜 실패했는지 확인할 수 있다. 두 옵션의 차이점은 `-v`보다 `-vv`가 보다 더 자세한 로그를 출력한다.

# 해결을 해보자

## 1. 갱신

```bash
/usr/syno/sbin/syno-letsencrypt renew-all -vv
```
