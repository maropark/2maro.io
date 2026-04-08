---
title: "Doraemon"
description: "Firefox browser control from any CLI via a local JSON-RPC relay — no LLM required, no native messaging, just HTTP."
status: "active"
tech: ["node", "javascript", "firefox-extension", "json-rpc"]
github: "https://github.com/maropark/doraemon"
icon: "/icons/doraemon.svg"
featured: true
date: 2026-03-15
---

A minimal Firefox automation relay: a local server on `127.0.0.1:1969` paired with a Firefox extension that auto-connects. Any CLI that can POST JSON gets full browser control — navigate, click, scroll, screenshot, eval JS, pull YouTube transcripts. No chat UI, no model integration, no overhead. The smallest useful base for making Firefox scriptable from a terminal.
