---
title: "[Column] Running a Tech Blog in the AI Era"
ref: running-a-tech-blog-in-the-ai-era
excerpt: "Running a trilingual blog when your Japanese doesn't go beyond travel phrases. How AI has transformed the way tech blogs are run."
date: 2026-02-15T03:00+09:00
last_modified_at: 2026-02-15T03:00+09:00
published: true
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/running-a-tech-blog-in-the-ai-era.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/running-a-tech-blog-in-the-ai-era.png"
categories:
  - Writing
  - Column
tags:
  - AI
  - Blog
  - Column
depth:
  - title: "Writing"
    url: /en/writing/
  - title: "Column"
    url: /en/writing/column/
---

# Overview

Running a trilingual blog when your Japanese doesn't go beyond travel phrases. How AI has transformed the way tech blogs are run.

# Writing a Japanese Blog Without Knowing Japanese

This blog is published in three languages: Korean, English, and Japanese. But I don't really speak Japanese — just enough travel phrases to get by.

A few days ago, I published a post documenting how I implemented multilingual support. After publishing, I was reviewing the Japanese version and found this sentence in the background section: "日本語もできるので3言語で運営することにした" — "Since I can also speak Japanese, I decided to run it in three languages." The AI had over-interpreted the context when generating the draft. From the fact that the blog runs in three languages, it inferred that the author must speak all three.

This episode captures the reality of running a blog in the AI era. AI writes well. It translates well. But it doesn't know the author's life — which languages they speak, what experiences they've had, what context they're writing from. These things still require human verification.

The core point remains unchanged, though. I'm currently running a Japanese tech blog when my Japanese doesn't go beyond ordering ramen. This would have been impossible just a year or two ago.

# How AI Has Changed the Blog Workflow

The way this blog operates is very different from a traditional blog.

When writing a post, I decide on the topic and direction and convey the key points. The AI drafts the content, I read through it, make corrections, and request revisions. Translating the finished Korean post into English and Japanese is also handled by AI. Front Matter configuration, category page creation, navigation menu updates, Git commits and pushes — all processed by AI.

What I do is set the direction and review the output. It's closer to being an editor-in-chief. Instead of opening an editor to type markdown directly and running git commands in a terminal, the blog gets built through conversation.

The biggest advantage of this approach is speed. Writing a post in three languages, creating category pages, updating navigation, and deploying — work that used to take half a day now finishes in an hour or two. It's not about writing more posts in the same time. It's about delivering a single post faster to a wider audience.

# Translation Quality: Not Perfect, but Sufficient

AI translation isn't perfect. Factual errors like the "I can speak Japanese" incident happen. Technical terminology nuances can be subtly off, and cultural context can be lost.

But for a tech blog, this level of quality is sufficient. The core value of a tech blog isn't literary beauty — it's accuracy and usefulness of information. Code blocks are identical regardless of language, and configuration file contents don't need translation. What readers want isn't beautiful Japanese prose but accurate information that solves their problems.

Columns and essays are different, of course. Style and nuance matter in these pieces. But even here, it's a matter of choice. Wait for perfect translations and publish only in Korean, or publish in three languages at 90% quality to reach more readers? I chose the latter.

# Has the Meaning of Tech Blogs Changed?

We live in an era where AI can answer most technical questions. Ask AI "How do I implement multilingual support in Jekyll?" and you'll get a decent answer. Does that mean tech blogs have become meaningless?

No. They've become more meaningful than ever.

AI is great at explaining general concepts. But concrete, contextualized experiences — like the Liquid filtering issues encountered while [implementing Jekyll multilingual support](/en/development/blog/jekyll/jekyll-multilingual-blog-implementation/), where leaving the lang field empty while setting Korean as the default language caused unexpected problems — can only be written by someone who has actually gone through it. Cutting-edge experiences absent from AI training data, debugging logs from specific environments, unexpected problems and solutions when combining multiple tools. These are the real value of tech blogs.

The role of tech blogs in the AI era is shifting from information provider to experience chronicler. "How do you do this?" — ask AI. "Here's what actually happened when I tried this" — that's value only a blog can provide.

# An Era Where Anyone Can Run a Global Blog

Just a year ago, running a trilingual blog required either speaking all three languages or being able to hire translators. Now you just need to be good at your native language. AI handles the rest.

This is an unprecedented opportunity for individual bloggers. Quality tech content that could only reach domestic readers due to the Korean language barrier is now open to readers worldwide. A [Synology VPN setup guide](/en/playground/synology/synology-vpn-server-setup/) written on a small Korean blog can be read by a home server enthusiast in Japan. A macOS development environment setup post can be referenced by an English-speaking junior developer.

Of course, this opportunity isn't exclusive to me. Every blogger worldwide has access to the same tools. Competition goes global and the language shield disappears. That's why the uniqueness of experience becomes even more important. Even covering the same topic, a record of solving problems in your own environment is irreplaceable. If AI has torn down the translation barrier, what bloggers need to provide is an experience worth translating.

# Building a System, Not Just Writing a Blog

There's one thing I've realized while running this blog. Blog management in the AI era is less about the act of writing and more about building a system.

Design a multilingual URL structure. Create Liquid filtering patterns. Implement language switching logic. Automate SEO hreflang tags. Establish an AI collaboration workflow. Once all of this is built, subsequent post publishing becomes dramatically simple. Decide on a topic, organize the content, and the system handles the rest.

This is fundamentally different from how blogs used to be run. Writing each post used to be the core activity. Now the core activity is building a system that can efficiently produce and distribute posts. Automate repetitive tasks, expand the areas AI can handle, and sharply narrow the parts that require human focus. This is the essence of running a blog in the AI era.

# In the End, Human Experience Remains

AI writes, translates, and helps with deployment. But the starting point of every post is still human experience.

The debugging struggles while [setting up a VPN server on my Synology](/en/playground/synology/synology-vpn-server-setup/) — I went through those myself. The Liquid variable scope issue discovered while [implementing multilingual support in Jekyll](/en/development/blog/jekyll/jekyll-multilingual-blog-implementation/) — I ran into that myself. Spotting the sentence that said "I can speak Japanese" and realizing "wait, that's not right" — that was me.

AI is a tool. A powerful tool. But what you build with that tool is still up to the person. The reason tech blogs remain meaningful in the AI era is that they're a medium for recording human experience. Not posts written by AI, but records of experiences created together with AI. That's what this blog aspires to be.
