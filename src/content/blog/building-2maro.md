---
title: "Building 2maro.io"
description: "How I built a retro notebook-themed blog with Astro, CSS skeuomorphism, and zero design frameworks."
date: 2026-04-01
tags: ["astro", "css", "design"]
category: "technical"
draft: false
featured: false
---

I wanted my personal site to feel different. Not another portfolio with a grid of cards and a hero section that says "Hi, I'm a developer." I wanted something with **texture** — something that felt like opening a real notebook.

## The notebook metaphor

The entire site is built around the idea of a developer's journal. Every design decision maps back to this metaphor:

- **Post cards** look like notebook pages with slight rotation on hover
- **Tags** are rubber stamps — rotated, bordered, slightly transparent
- **Dates** appear as ink stamps in the margin
- **The footer** has a torn paper edge
- **Code blocks** use a monospace font that looks like a typewriter

## CSS, not JavaScript

Almost every visual effect is pure CSS:

```css
/* Notebook ruled lines — no images needed */
.notebook-lines {
  background-image:
    repeating-linear-gradient(
      transparent,
      transparent 31px,
      #D4C5A9 31px,
      #D4C5A9 32px
    );
}
```

The paper texture is a tiny noise PNG overlaid at 3% opacity. The torn edges use CSS `clip-path`. The washi tape strips are just colored `span` elements with rotation and transparency.

## Why Astro

Astro ships zero client JavaScript by default. For a content site, this is perfect — pages load instantly, Lighthouse scores are 95+, and the retro aesthetic isn't fighting against a heavy framework.

Content lives in Markdown files with typed frontmatter via Astro's Content Collections. No database, no CMS, no API calls. Push markdown, get a blog.

## Hosting on Cloudflare Pages

Since I bought my domain on Cloudflare, hosting on Cloudflare Pages was the obvious choice. DNS configuration is automatic, SSL is free, and every git push triggers a deploy. The free tier is more than enough for a personal blog.

## Design restraint

The hardest part was knowing when to stop. Skeuomorphic design can easily become kitschy if every element has a texture, a shadow, and a rotation. The rule I followed: **max 2-3 texture effects per page section**. Handwritten fonts only for accents. Body text stays in a readable serif.

The goal isn't to cosplay as a 2004 blog. It's to bring warmth and personality to a medium that's become increasingly sterile.
