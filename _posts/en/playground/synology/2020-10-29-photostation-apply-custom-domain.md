---
date: 2020-10-29T00:00+09:00
title: "[Synology] Connecting a Custom Domain to Photo Station"
ref: photostation-apply-custom-domain
lang: en
excerpt: "A guide on how to connect a custom domain to Synology Photo Station."
last_modified_at: 2020-11-05T21:30+09:00
published: true
header:
  overlay_image: "/assets/image/thumbnail/header/photostation-apply-custom-domain.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/photostation-apply-custom-domain.png"
categories:
  - Playground
  - Synology
tags:
  - Playground
  - Synology
  - PhotoStation
  - NAS
  - Nginx
  - Domain
depth:
  - title: "Playground"
    url: /en/playground/
  - title: "Synology"
    url: /en/playground/synology/
---

# Overview

This guide explains how to connect a custom domain to Synology Photo Station.

# Introduction

After purchasing a personal domain and setting up reverse proxy, I successfully connected subdomains to each application as follows:

- blog.mydomain.com
- dsm.mydomain.com
- drive.mydomain.com

However, connecting a subdomain to Photo Station turned out to be a bit tricky.
The methods that had been previously shared online didn't work - possibly because of a DSM version upgrade or because I was applying them incorrectly.
While searching for a solution, I found a relevant Gist and applied it successfully.

I'm sharing this in case anyone else is struggling with the same issue.

**Warning:** As a prerequisite for this process, a subdomain such as photo.mydomain.com should already be connected to your Synology via CNAME record registration.
{: .notice--warning}

# Steps

## 1. Create Photo.mustache

Create a file named `Photo.mustache` in the `/usr/syno/share/nginx` directory with the following content.
Set `server_name` to the subdomain you want to connect.

```
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name photo.mydomain.com;

    location = / {
        {% raw %}{{#DSM.ssl}}{% endraw %}
        if ($scheme = https) {
            rewrite / https://$host/photo/ redirect;
        }
        {% raw %}{{/DSM.ssl}}{% endraw %}
        rewrite / http://$host/photo/ redirect;
    }

    include /usr/local/etc/nginx/conf.d/www.PhotoStation.conf;
}
```

## 2. Modify nginx.mustache

Open the `nginx.mustache` file in the `/usr/syno/share/nginx` directory and add the following line:

```
{% raw %}{{> /usr/syno/share/nginx/Photo}}{% endraw %}
```

Once all the above steps are complete, reboot your Synology and try accessing the subdomain.
You should see that it redirects to Photo Station.

# References

- <https://gist.github.com/kalbasit/9cf9b23f2e0f70c285d0>
