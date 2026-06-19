---
title: "MEGUMI"
description: "A redesign of a Virgil Village head-spa & hair sanctuary as a single-page scroll narrative — the same architecture as KINESIS, retuned from a 'dream maze' into a 'breathing ritual.' A password-protected preview."
status: "shipped"
tech: ["html", "css", "javascript", "lenis"]
url: "/megumi/"
icon: "/icons/megumi.svg"
featured: true
highlight: true
date: 2026-06-09
---

MEGUMI is the applied, client-facing twin of KINESIS. Where KINESIS *names* the six techniques of scroll-narrative web design, MEGUMI *uses* them in service of a single brand: megumi.care, a head-spa and hair sanctuary in Virgil Village, LA. The structural kit is lifted from a teardown of the Somni Restaurant site — Lenis glide, oversized display serif, a horizontal track driven by vertical scroll, dark↔light chapter alternation, sticky rosters, in-view reveals — but every dial is retuned to the opposite emotional register. Somni sells a *dream maze* (deliberate disorientation). MEGUMI sells *"a moment to pause, breathe deeply, and reconnect"* — so the same architecture becomes a breathing ritual: a slower lerp that floats instead of snapping, the head-spa steps stepped through as a meditative horizontal sequence, the Ritual chapter going dark for "closed eyes," an ensō that draws itself on arrival, and matcha-and-clay leaves drifting through The Space.

Palette "Paper & Matcha" — warm paper, sumi ink, matcha, clay, dark moss — with Cormorant Garamond, Hanken Grotesk, and Spline Sans Mono. Dependency-light, no build step: plain HTML/CSS/JS plus a single vendored Lenis, all real Megumi copy and pricing, with first-class `prefers-reduced-motion` and proper landmark/heading accessibility. It's served behind a server-side password wall (a Cloudflare Pages Function) — a private preview rather than a public, indexable page.
