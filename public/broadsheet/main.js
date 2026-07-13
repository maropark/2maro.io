/* =====================================================================
   BROADSHEET — engine: humanizer resolver + live data render + the six
   named motions + The Desk telemetry. Progressive enhancement throughout:
   nothing here is required to read the page. The Desk still names each
   chapter under prefers-reduced-motion; only the movement is dropped.
   ===================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const osReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let forcedReduce = false;
  const reduceActive = () => osReduce || forcedReduce;
  const hasLenis = typeof window.Lenis === "function";
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  /* =====================================================================
     THE IMPACT HUMANIZER — ported verbatim from the design-system spec.
     A raw record is never printed as its enum; it resolves to one of
     three display kinds, phrased the way an analyst would write it.
     ===================================================================== */
  const NOUN = {
    fte_redeploy:      "FTE redeployment",
    capacity_reclaim:  "Capacity reclaim",
    committee_added:   "Committee addition",
    governance_added:  "Governance controls",
    productivity_gain: "Productivity gain",
  };

  function qLabel(type, v) {
    switch (type) {
      case "fte_redeploy":     return `${v} FTE redeployed`;
      case "capacity_reclaim": return `${v} FTE capacity reclaimed`;
      case "committee_added":  return `${v} committee${v === 1 ? "" : "s"} added`;
      case "governance_added": return `${v} governance control${v === 1 ? "" : "s"} added`;
      case "productivity_gain":return `+${v}% productivity`;
      default:                 return `${v} ${String(type).replace(/_/g, " ")}`;
    }
  }

  const usd = (n) => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1,
  }).format(n);

  function metric(u) {
    const t = u.impact_type, v = u.impact_value, s = u.impact_savings_usd;
    if (t == null) return { kind: "none" };
    if (v == null && s == null) return { kind: "soft", label: NOUN[t] || t };
    if (s != null) return { kind: "money", big: usd(s), suffix: "/yr", sub: v != null ? qLabel(t, v) : NOUN[t] };
    if (t === "productivity_gain") return { kind: "count", big: `+${v}%`, suffix: "", sub: "productivity gain" };
    if (t === "fte_redeploy")      return { kind: "count", big: `${v}`, suffix: "FTE", sub: "redeployed" };
    if (t === "capacity_reclaim")  return { kind: "count", big: `${v}`, suffix: "FTE", sub: "capacity reclaimed" };
    if (t === "committee_added")   return { kind: "count", big: `${v}`, suffix: v === 1 ? "committee" : "committees", sub: "added" };
    if (t === "governance_added")  return { kind: "count", big: `${v}`, suffix: v === 1 ? "control" : "controls", sub: "added" };
    return { kind: "count", big: `${v}`, suffix: "", sub: NOUN[t] || t };
  }

  function metricHTML(m) {
    if (m.kind === "money") return `<div class="hz-money"><span class="hz-big">${m.big}</span><span class="hz-suffix">${m.suffix}</span><span class="hz-sub">${m.sub}</span></div>`;
    if (m.kind === "count") return `<div class="hz-count"><span class="hz-big">${m.big}</span><span class="hz-suffix">${m.suffix}</span><span class="hz-sub">${m.sub}</span></div>`;
    if (m.kind === "soft")  return `<div class="hz-soft">${m.label} · <em>not yet quantified</em></div>`;
    return `<div class="hz-none">Nothing to show</div>`;
  }

  /* small hero-metric HTML for cards/rows/lead (compact, no wrapper class) */
  function heroInline(m) {
    if (m.kind === "money") return `<span class="bs-card__figure-big">${m.big}</span><span class="bs-card__figure-suffix">${m.suffix}</span><span class="bs-card__figure-sub">${m.sub}</span>`;
    if (m.kind === "count") return `<span class="bs-card__figure-big">${m.big}</span><span class="bs-card__figure-suffix">${m.suffix}</span><span class="bs-card__figure-sub">${m.sub}</span>`;
    if (m.kind === "soft")  return `<span class="bs-card__figure-sub">${m.label} · <em>not yet quantified</em></span>`;
    return `<span class="bs-card__figure-sub">Not yet scored</span>`;
  }

  /* =====================================================================
     DOMAIN HUES — read live from tokens.css, never hardcoded here.
     ===================================================================== */
  const DOMAINS = ["finance", "consumer", "retail", "tech", "pharma", "media", "aero", "auto", "industrial"];
  const DOMAIN_LABEL = {
    finance: "Financial Services", consumer: "Consumer Goods", retail: "Retail", tech: "Technology",
    pharma: "Pharmaceuticals", media: "Media & Entertainment", aero: "Aerospace", auto: "Automotive", industrial: "Industrial",
  };
  function domainHue(domain) {
    const cs = getComputedStyle(root);
    return {
      ink: cs.getPropertyValue(`--bs-${domain}-ink`).trim(),
      glow: cs.getPropertyValue(`--bs-${domain}-glow`).trim(),
    };
  }
  function retune(ink, glow) {
    root.style.setProperty("--bs-glow", ink);
    root.style.setProperty("--bs-glow-soft", glow || ink);
  }
  function bindHoverRetune(el, domain) {
    const hue = domainHue(domain);
    el.style.setProperty("--hue", hue.ink);
    el.addEventListener("pointerenter", () => retune(hue.ink, hue.glow));
  }

  /* =====================================================================
     REVIEWED STATE — persisted in localStorage, per Components.md
     ===================================================================== */
  const REVIEW_KEY = "broadsheet-reviewed";
  function getReviewed() {
    try { return new Set(JSON.parse(localStorage.getItem(REVIEW_KEY) || "[]")); } catch { return new Set(); }
  }
  function setReviewed(set) {
    try { localStorage.setItem(REVIEW_KEY, JSON.stringify([...set])); } catch { /* ignore */ }
  }
  function toggleReviewed(id) {
    const set = getReviewed();
    if (set.has(id)) set.delete(id); else set.add(id);
    setReviewed(set);
    return set.has(id);
  }

  /* =====================================================================
     DATA — fetch the fictional dispatch set and render every live demo.
     ===================================================================== */
  let DATA = null;

  fetch("assets/data/dispatches.json")
    .then((r) => r.json())
    .then((data) => { DATA = data; renderAll(data); })
    .catch(() => { /* if opened via file://, the live demos simply stay empty */ });

  function renderAll(data) {
    const reviewed = getReviewed();
    const wireCounts = document.querySelectorAll("[data-wire-count], [data-wire-count-2]");
    wireCounts.forEach((el) => (el.textContent = String(data.dispatches.length)));

    renderWire(data);
    renderDispatchGrid(data, reviewed);
    renderLeague(data, reviewed);
    renderAfterHours(data);
    renderDossierDemo(data);
    bindCardClicks(data, reviewed);
  }

  function rankValue(u) {
    return (u.impact_savings_usd || 0) * 1 + (u.impact_savings_usd ? 0 : (u.impact_value || 0) * 10000);
  }

  /* ---- 04 · The Wire ---- */
  function renderWire(data) {
    const track = document.querySelector("[data-wire-track]");
    if (!track) return;
    const items = data.dispatches.map((u) => {
      const hue = domainHue(u.domain);
      const m = metric(u);
      const figText = m.kind === "money" ? `${m.big} ${m.suffix}` : m.kind === "count" ? `${m.big} ${m.suffix}` : "TBD";
      return `<span class="bs-wire__item" style="--hue:${hue.ink}"><span class="bs-wire__dot"></span><span class="bs-wire__company">${u.company}</span><span class="bs-wire__figure">${figText}</span><span class="bs-wire__desk">${u.category}</span></span>`;
    }).join("");
    track.innerHTML = items + items; // duplicate for seamless -50% loop
  }

  /* ---- 05 · The Dispatch (lead + grid) ---- */
  function renderDispatchGrid(data, reviewed) {
    const sorted = [...data.dispatches].sort((a, b) => rankValue(b) - rankValue(a));
    const [lead, ...rest] = sorted;
    const leadEl = document.querySelector("[data-lead]");
    if (leadEl && lead) {
      const hue = domainHue(lead.domain);
      const m = metric(lead);
      const pct = clamp((lead.impact_savings_usd || 0) / (sorted[0].impact_savings_usd || 1), 0.08, 1);
      leadEl.style.setProperty("--hue", hue.ink);
      leadEl.innerHTML = `
        <div class="bs-lead__story">
          <div class="kick bs-lead__kicker">Lead · ${lead.category}</div>
          <h3 class="bs-lead__headline">${lead.headline}</h3>
          <p class="bs-lead__dek">${lead.dek}</p>
          <div class="bs-lead__byline">${lead.company} · ${lead.industry}</div>
        </div>
        <div class="bs-lead__rail">
          <div class="bs-lead__rail-label">Projected impact</div>
          <div class="bs-lead__figure">${m.kind === "money" ? m.big : m.kind === "count" ? m.big + (m.suffix ? " " + m.suffix : "") : "—"}</div>
          <div class="bs-lead__figure-sub">${m.sub || m.label || "not yet quantified"}</div>
          <div class="bs-lead__track"><span style="width:${(pct * 100).toFixed(0)}%"></span></div>
          <div class="bs-lead__open" data-open-dossier="${lead.id}">Open dossier →</div>
        </div>`;
      bindHoverRetune(leadEl, lead.domain);
    }

    const gridEl = document.querySelector("[data-dispatch-grid]");
    if (gridEl) {
      gridEl.innerHTML = rest.slice(0, 6).map((u, i) => {
        const hue = domainHue(u.domain);
        const m = metric(u);
        return `<article class="bs-card" style="--hue:${hue.ink};--i:${i}" data-open-dossier="${u.id}">
          <div class="bs-card__head">
            <span class="kick bs-card__kicker">${u.category}</span>
            ${reviewed.has(u.id) ? '<span class="bs-card__reviewed">✓ Reviewed</span>' : ""}
          </div>
          <h4 class="bs-card__headline">${u.headline}</h4>
          <div class="bs-card__company"><b>${u.company}</b> · ${u.industry}</div>
          <div class="bs-card__figure">${heroInline(m)}</div>
          <p class="bs-card__dek">${u.dek}</p>
          <div class="bs-card__sources">${u.sources.length} source${u.sources.length === 1 ? "" : "s"}</div>
        </article>`;
      }).join("");
      [...gridEl.children].forEach((card, i) => {
        const u = rest[i];
        if (u) bindHoverRetune(card, u.domain);
      });
    }
  }

  /* ---- 06 · The League Table ---- */
  function renderLeague(data, reviewed) {
    const headEl = document.querySelector("[data-league-head]");
    if (headEl) {
      const agg = usd(data.aggregate_impact_usd);
      const totalFte = data.dispatches.filter((u) => u.impact_type === "fte_redeploy").reduce((s, u) => s + (u.impact_value || 0), 0);
      headEl.innerHTML = `
        <div class="bs-league-head__name">Dispatch — the league table</div>
        <div class="bs-league-head__agg"><b>${agg}</b> aggregate /yr · ${totalFte} FTE in motion · ${data.dispatches.length} units</div>`;
    }
    const el = document.querySelector("[data-league]");
    if (!el) return;
    const sorted = [...data.dispatches].sort((a, b) => rankValue(b) - rankValue(a));
    el.innerHTML = sorted.map((u, i) => {
      const hue = domainHue(u.domain);
      const m = metric(u);
      const rank = String(i + 1).padStart(2, "0");
      return `<div class="bs-row ${i === 0 ? "bs-row--01" : ""}" style="--hue:${hue.ink};--i:${i}" data-open-dossier="${u.id}">
        <div class="bs-row__rank">${rank}</div>
        <div class="bs-row__mid">
          <div class="bs-row__kicker"><span class="kick" style="color:var(--hue)">${u.category}</span>${reviewed.has(u.id) ? '<span class="bs-card__reviewed">✓ Reviewed</span>' : ""}</div>
          <div class="bs-row__headline">${u.headline}</div>
          <div class="bs-row__company">${u.company} · ${u.industry}</div>
        </div>
        <div class="bs-row__figure">${m.kind === "money" ? `<div class="bs-row__figure-big">${m.big}</div><div class="bs-row__figure-sub">${m.suffix}</div>` : m.kind === "count" ? `<div class="bs-row__figure-big">${m.big}${m.suffix ? " " + m.suffix : ""}</div><div class="bs-row__figure-sub">${m.sub}</div>` : `<div class="bs-row__figure-sub">not yet quantified</div>`}</div>
      </div>`;
    }).join("");
    [...el.children].forEach((row, i) => bindHoverRetune(row, sorted[i].domain));
  }

  /* ---- 08 · After Hours (board + enterprise) ---- */
  function renderAfterHours(data) {
    const el = document.querySelector("[data-evening-items]");
    if (!el) return;
    const items = data.dispatches.filter((u) => u.category === "board" || u.category === "enterprise");
    el.innerHTML = items.map((u) => {
      const hue = domainHue(u.domain);
      const m = metric(u);
      return `<div class="bs-evening__item" style="--hue:${hue.glow}" data-open-dossier="${u.id}">
        <div>
          <div class="bs-evening__item-meta">${u.category} · ${u.company}</div>
          <div class="bs-evening__item-head">${u.headline}</div>
        </div>
        <div class="bs-evening__item-figure">${m.kind === "count" ? `${m.big}${m.suffix ? " " + m.suffix : ""}` : m.kind === "money" ? m.big : "—"}</div>
      </div>`;
    }).join("");
  }

  /* ---- 09 · The Dossier (inline demo) ---- */
  function renderDossierDemo(data) {
    const el = document.querySelector("[data-dossier-demo]");
    if (!el) return;
    const u = data.dispatches.find((d) => d.id === "bs_e511") || data.dispatches[0];
    el.innerHTML = dossierHTML(u, getReviewed().has(u.id), false);
    bindDossierReview(el, u);
    bindHoverRetune(el.querySelector(".bs-dossier"), u.domain);
  }

  function dossierHTML(u, isReviewed, withBack) {
    const hue = domainHue(u.domain);
    const m = metric(u);
    const figText = m.kind === "money" ? `${m.big}<span style="font-size:16px;color:var(--bs-ink-2)"> ${m.suffix}</span>` : m.kind === "count" ? `${m.big}${m.suffix ? ` <span style="font-size:16px;color:var(--bs-ink-2)">${m.suffix}</span>` : ""}` : `<span style="font-size:20px;color:var(--bs-ink-2)">${m.label || "Not yet scored"} · <em>not yet quantified</em></span>`;
    const sources = u.sources.length
      ? u.sources.map((s) => `<div class="bs-dossier__source">${s.type === "external" ? `<a class="bs-dossier__source-ext" href="${s.url || "#"}" target="_blank" rel="noopener">${s.label} ↗</a>` : `<span>${s.label}</span>`}<span class="bs-dossier__source-tag">${s.type === "external" ? "" : "Internal"}</span></div>`).join("")
      : `<div class="bs-dossier__source"><em>No sources cited.</em></div>`;
    return `<div class="bs-dossier" style="--hue:${hue.ink}">
      ${withBack ? '<span class="bs-dossier__back" data-close-dossier>← The Wire</span>' : ""}
      <div class="kick bs-dossier__kicker">${u.category} · Dossier</div>
      <h3 class="bs-dossier__headline">${u.headline}</h3>
      <div class="bs-dossier__meta"><b>${u.company}</b> · ${u.industry} · ${u.category}</div>
      <div class="bs-dossier__metricrule">${figText}</div>
      <p class="bs-dossier__dek">${u.dek}</p>
      <div class="bs-dossier__sources">
        <div class="bs-dossier__sources-label">Sources</div>
        ${sources}
      </div>
      <div class="bs-dossier__footer">
        <span class="mono">Generated ${new Date(DATA?.generated_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        <button class="bs-dossier__review ${isReviewed ? "is-reviewed" : ""}" data-review-btn data-id="${u.id}">${isReviewed ? "Reviewed · undo" : "Mark as reviewed"}</button>
      </div>
    </div>`;
  }

  function bindDossierReview(container, u) {
    const btn = container.querySelector("[data-review-btn]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isReviewed = toggleReviewed(u.id);
      btn.textContent = isReviewed ? "Reviewed · undo" : "Mark as reviewed";
      btn.classList.toggle("is-reviewed", isReviewed);
    });
  }

  /* ---- click any card / row / lead-open / after-hours item → open dossier overlay ---- */
  let overlayEl = null;
  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement("div");
    overlayEl.className = "bs-overlay";
    overlayEl.innerHTML = `<button class="bs-overlay__close" data-close-dossier>Close ✕</button><div class="wrap" data-overlay-body></div>`;
    document.body.appendChild(overlayEl);
    overlayEl.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-dossier]") || e.target === overlayEl) closeOverlay();
    });
    return overlayEl;
  }

  function openOverlay(id) {
    if (!DATA) return;
    const u = DATA.dispatches.find((d) => d.id === id);
    if (!u) return;
    const el = ensureOverlay();
    const body = el.querySelector("[data-overlay-body]");
    const doOpen = () => {
      body.innerHTML = dossierHTML(u, getReviewed().has(u.id), true);
      bindDossierReview(body, u);
      el.classList.add("is-open");
      body.scrollTop = 0;
    };
    if (!reduceActive() && document.startViewTransition) {
      document.startViewTransition(doOpen);
    } else {
      doOpen();
    }
  }
  function closeOverlay() {
    if (!overlayEl) return;
    const doClose = () => overlayEl.classList.remove("is-open");
    if (!reduceActive() && document.startViewTransition) {
      document.startViewTransition(doClose);
    } else {
      doClose();
    }
  }

  function bindCardClicks(data) {
    document.body.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-open-dossier]");
      if (opener) { openOverlay(opener.getAttribute("data-open-dossier")); return; }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeOverlay(); });
  }

  /* =====================================================================
     01 · Ink & Paper — palette + hue swatches (also feeds §10 The System)
     ===================================================================== */
  const PALETTE = [
    ["Paper", "--bs-paper"], ["Card", "--bs-paper-2"], ["Ink", "--bs-ink"],
    ["Muted ink", "--bs-ink-2"], ["Faint ink", "--bs-ink-3"], ["Hairline", "--bs-hair"],
    ["Night", "--bs-night"], ["Bone", "--bs-bone"],
  ];
  function renderPalette(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const cs = getComputedStyle(root);
    el.innerHTML = PALETTE.map(([name, tok]) => {
      const hex = cs.getPropertyValue(tok).trim();
      return `<div><div class="swatch-card__block" style="background:${hex}"></div><div class="swatch-card__name">${name}</div><div class="swatch-card__meta">${tok} · ${hex}</div></div>`;
    }).join("");
  }
  function renderHues(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.innerHTML = DOMAINS.map((d) => {
      const hue = domainHue(d);
      return `<div class="hue-card" data-ink="${hue.ink}" data-glow="${hue.glow}">
        <div class="hue-card__split"><span style="background:${hue.ink}"></span><span style="background:${hue.glow}"></span></div>
        <div class="swatch-card__name">${DOMAIN_LABEL[d]}</div>
        <div class="swatch-card__meta">${hue.ink} · ${hue.glow}</div>
      </div>`;
    }).join("");
    el.querySelectorAll("[data-ink]").forEach((card) => {
      card.addEventListener("pointerenter", () => retune(card.dataset.ink, card.dataset.glow));
    });
  }
  renderPalette("palette");
  renderHues("hues");
  renderPalette("sys-palette");
  renderHues("sys-hues");

  /* ---- §10 The System — motion + voice recap ---- */
  const MOTION_RECAP = [
    ["Traveling accent", "--bs-glow retunes to the hovered desk · instant swap, no tween"],
    ["Assemble", "staggered rise · 550ms stop · cubic-bezier(.2,.7,.2,1) · fill backwards"],
    ["The Wire", "marquee 64s linear · loops -50% · pauses on hover"],
    ["After Hours", "scroll-linked polarity · --c 0→1 · color-mix(paper, night)"],
    ["Pointer glow", "eased follower · lerp 0.09 · multiply blend"],
    ["Reduced motion", "first-class · movement drops, content stays legible"],
  ];
  const VOICE_RECAP = [
    ["One figure carries the weight.", "Rank the information; let a single number be the largest, accented thing in any unit."],
    ["Restraint is the styling.", "Warm paper, warm ink, hairlines. Colour is spent once, where it counts."],
    ["Evidence, not advertisement.", "Sources are first-class. Internal is labeled, never hidden."],
    ["Humanize the data.", "fte_redeploy becomes “FTE redeployed.” Phrase enums the way an analyst would."],
  ];
  const motionRecapEl = document.getElementById("sys-motion");
  if (motionRecapEl) motionRecapEl.innerHTML = MOTION_RECAP.map(([t, b]) => `<div class="motion-recap__item"><div class="motion-recap__title">${t}</div><div class="motion-recap__body">${b}</div></div>`).join("");
  const voiceRecapEl = document.getElementById("sys-voice");
  if (voiceRecapEl) voiceRecapEl.innerHTML = VOICE_RECAP.map(([h, p]) => `<div><div class="voice-recap__h">${h}</div><p class="voice-recap__p">${p}</p></div>`).join("");

  /* =====================================================================
     07 · Humanizing the Number — cycle a demo unit through all four kinds
     ===================================================================== */
  const HZ_STATES = {
    money: { impact_type: "fte_redeploy", impact_value: 22, impact_savings_usd: 3600000 },
    count: { impact_type: "fte_redeploy", impact_value: 42, impact_savings_usd: null },
    soft:  { impact_type: "capacity_reclaim", impact_value: null, impact_savings_usd: null },
    none:  { impact_type: null, impact_value: null, impact_savings_usd: null },
  };
  const hzStage = document.querySelector("[data-humanizer-stage]");
  const hzBtns = [...document.querySelectorAll("[data-humanize]")];
  function setHumanizer(key) {
    if (!hzStage) return;
    hzStage.innerHTML = metricHTML(metric(HZ_STATES[key]));
    hzBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.humanize === key));
  }
  hzBtns.forEach((b) => b.addEventListener("click", () => setHumanizer(b.dataset.humanize)));
  setHumanizer("money");

  /* =====================================================================
     EDITION BAR — live date + scroll shadow
     ===================================================================== */
  const dateEl = document.querySelector("[data-edbar-date]");
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =====================================================================
     THE DESK — self-describing telemetry, chapter-driven
     ===================================================================== */
  const desk = document.querySelector("[data-desk]");
  const deskNum = document.querySelector("[data-desk-num]");
  const deskName = document.querySelector("[data-desk-name]");
  const deskSpec = document.querySelector("[data-desk-spec]");
  const deskProgress = document.querySelector("[data-desk-progress]");
  const deskSwatch = document.querySelector("[data-desk-swatch]");
  const deskHex = document.querySelector("[data-desk-hex]");
  const deskRm = document.querySelector("[data-desk-rm]");
  const deskBar = document.querySelector("[data-desk-bar]");
  const header = document.querySelector("[data-header]");

  const chapters = [...document.querySelectorAll("[data-chapter]")];
  let activeId = "";
  function setActiveChapter(el) {
    if (!el || el.id === activeId) return;
    activeId = el.id;
    const idx = chapters.indexOf(el);
    if (deskNum) deskNum.textContent = el.dataset.num || "--";
    if (deskName) deskName.textContent = el.dataset.name || "";
    if (deskSpec) deskSpec.textContent = el.dataset.spec || "";
    if (deskProgress) deskProgress.textContent = `${idx + 1}/${chapters.length}`;
    if (deskBar) deskBar.style.width = `${(((idx + 1) / chapters.length) * 100).toFixed(1)}%`;
    const domain = el.dataset.domain;
    if (domain) {
      const hue = domainHue(domain);
      retune(hue.ink, hue.glow);
    }
  }
  function updateDeskSwatch() {
    const hex = getComputedStyle(root).getPropertyValue("--bs-glow").trim();
    if (deskHex) deskHex.textContent = hex;
    if (deskSwatch) deskSwatch.style.background = hex;
  }

  if ("IntersectionObserver" in window && chapters.length) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => { if (en.isIntersecting) { setActiveChapter(en.target); updateDeskSwatch(); } }),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    chapters.forEach((c) => io.observe(c));
  }
  setActiveChapter(chapters[0]);
  updateDeskSwatch();
  // keep the swatch honest even between chapter boundaries (hover retunes fire often)
  setInterval(updateDeskSwatch, 400);

  const deskToggle = document.querySelector("[data-desk-toggle]");
  if (desk && deskToggle) {
    deskToggle.addEventListener("click", () => {
      const min = desk.classList.toggle("is-min");
      deskToggle.setAttribute("aria-pressed", String(min));
      deskToggle.textContent = min ? "+" : "−";
      deskToggle.setAttribute("aria-label", min ? "Show the desk" : "Hide the desk");
    });
  }

  function baseUpdate() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 30);
  }
  window.addEventListener("scroll", baseUpdate, { passive: true });
  baseUpdate();

  /* =====================================================================
     §10 — the live reduced-motion toggle (independent of the OS setting)
     ===================================================================== */
  const rmToggle = document.querySelector("[data-rm-toggle]");
  const rmLabel = document.querySelector("[data-rm-label]");
  function applyForcedReduce(on) {
    forcedReduce = on;
    document.body.classList.toggle("is-reduced", on);
    root.classList.toggle("motion", !reduceActive());
    if (on) {
      root.style.setProperty("--bs-rise", ".001s");
      root.style.setProperty("--bs-rise-in", ".001s");
      root.style.setProperty("--bs-fade", ".001s");
      root.style.setProperty("--bs-wire", "0s");
    } else if (!osReduce) {
      root.style.removeProperty("--bs-rise");
      root.style.removeProperty("--bs-rise-in");
      root.style.removeProperty("--bs-fade");
      root.style.removeProperty("--bs-wire");
    }
    if (rmToggle) rmToggle.setAttribute("aria-pressed", String(on));
    if (rmLabel) rmLabel.textContent = `Reduced motion: ${on ? "ON" : "OFF"}`;
    if (deskRm) deskRm.textContent = reduceActive() ? "on" : "off";
  }
  if (rmToggle) rmToggle.addEventListener("click", () => applyForcedReduce(!forcedReduce));
  if (deskRm) deskRm.textContent = reduceActive() ? "on" : "off";

  /* ---------- reduced-motion / no-Lenis: stop here (fully readable) ---------- */
  if (osReduce || !hasLenis) {
    if (!osReduce) root.classList.add("motion"); // still allow CSS-driven bits if Lenis is merely missing
    return;
  }
  root.classList.add("motion");

  /* ---------- Lenis glide ---------- */
  const lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
  window.lenis = lenis;
  function raf(t) { if (!reduceActive()) lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.2 });
    });
  });

  /* ---------- in-view reveals (greet once) ---------- */
  const revealIO = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); revealIO.unobserve(en.target); }
    }),
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => revealIO.observe(el));

  /* ---------- pointer glow (motion #5) ---------- */
  const pointerGlow = document.querySelector("[data-pointer-glow]");
  let pgX = window.innerWidth / 2, pgY = window.innerHeight * 0.3, pgCurX = pgX, pgCurY = pgY;
  if (pointerGlow) {
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      pgX = e.clientX; pgY = e.clientY;
    }, { passive: true });
  }
  function pgTick() {
    if (pointerGlow && !reduceActive()) {
      pgCurX += (pgX - pgCurX) * 0.09; pgCurY += (pgY - pgCurY) * 0.09;
      pointerGlow.style.transform = `translate3d(${pgCurX.toFixed(1)}px, ${pgCurY.toFixed(1)}px, 0)`;
    }
    requestAnimationFrame(pgTick);
  }
  requestAnimationFrame(pgTick);

  /* ---------- After Hours scroll-linked bloom (motion #4) ---------- */
  const evening = document.querySelector("[data-evening]");
  function eveningTick() {
    if (evening) {
      if (reduceActive()) {
        evening.style.setProperty("--c", "0.55");
      } else {
        const r = evening.getBoundingClientRect(), vh = window.innerHeight;
        const center = r.top + r.height / 2;
        const dist = Math.abs(center - vh / 2) / (vh / 2 + r.height / 2);
        const c = clamp(1 - dist * 1.22, 0, 1);
        evening.style.setProperty("--c", c.toFixed(3));
      }
    }
    requestAnimationFrame(eveningTick);
  }
  requestAnimationFrame(eveningTick);
})();
