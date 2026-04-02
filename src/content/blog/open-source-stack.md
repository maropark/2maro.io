---
title: "My Open Source Stack"
description: "The tools and workflows I use daily — from Obsidian to Claude Code to Astro."
date: 2026-04-01
tags: ["tools", "open-source", "workflow"]
category: "journal"
draft: false
featured: false
---

I've been refining my development stack over the past year, gravitating toward tools that are open source, composable, and respect my workflow rather than dictating it. Here's what I'm running.

## The brain: Obsidian

Everything starts in Obsidian. It's my second brain — ideas, project notes, research, daily journals. The vault syncs everywhere, and because it's just Markdown files on disk, I own my data completely.

I use it as the central hub for project planning. Ideas start as notes, grow into designs, and eventually become code in `~/Projects/`.

## The builder: Claude Code

Claude Code is my daily driver for development. It reads my vault, understands my project context, and helps me ship faster. I've built a set of custom skills on top of it — structured workflows for planning, reviewing, QA, and deployment.

The key insight: AI tools work best when they have context. By keeping everything in my vault and giving Claude Code access to it, every conversation starts with full project awareness.

## The site: Astro

This blog runs on Astro — a static site generator that ships zero JavaScript by default. For content sites, it's the best tool I've found. Write Markdown, get fast pages. The component model (`.astro` files) is clean and intuitive.

## The host: Cloudflare Pages

Free, fast, and my domain was already on Cloudflare. Git-push deploys, preview URLs for branches, and zero configuration for DNS/SSL.

## The philosophy

Every tool in my stack is either open source or has a clear data export path. I don't want to be locked into any platform. If a tool disappears tomorrow, my work — my notes, my code, my writing — all lives in plain files on my machine.

That's not paranoia. That's just good engineering.
