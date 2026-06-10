/* =====================================================================
   KINESIS — motion engine + self-describing telemetry
   Lenis glide and scroll-linked behaviours. Progressive enhancement:
   nothing here is required to read the page. The HUD still names each
   technique under prefers-reduced-motion; only the movement is dropped.
   ===================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasLenis = typeof window.Lenis === "function";
  const motion = !reduce && hasLenis;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  // chapter hue → hex, mirrored to the fixed chrome (HUD / rail / aurora)
  const HUES = {
    violet: "#7C5CFF", indigo: "#6E7BFF", blue: "#3E8BFF", teal: "#2BD7C4",
    aqua: "#39E0A0", amber: "#FFB23E", rose: "#FF6B9A", magenta: "#C66BFF",
    cyan: "#39D2FF", spectrum: "#7C5CFF",
  };

  /* ---------- always-on wiring (works with no motion) ---------- */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // HUD elements
  const hud = document.querySelector("[data-hud]");
  const hudNum = document.querySelector("[data-hud-num]");
  const hudName = document.querySelector("[data-hud-name]");
  const hudSpec = document.querySelector("[data-hud-spec]");
  const hudProgress = document.querySelector("[data-hud-progress]");
  const hudVelocity = document.querySelector("[data-hud-velocity]");
  const hudBar = document.querySelector("[data-hud-bar]");
  const hudXWrap = document.querySelector("[data-hud-x-wrap]");
  const hudX = document.querySelector("[data-hud-x]");
  const railTicks = [...document.querySelectorAll("[data-rail-tick]")];
  const header = document.querySelector("[data-header]");

  // name the active technique as each chapter crosses the viewport centre
  let activeId = "";
  function setActive(el) {
    if (!el || el.id === activeId) return;
    activeId = el.id;
    const num = el.dataset.num || "—";
    const name = el.dataset.name || "";
    const spec = el.dataset.spec || "";
    const hue = HUES[el.dataset.glow] || HUES.violet;
    if (hudNum) hudNum.textContent = num;
    if (hudName) hudName.textContent = name;
    if (hudSpec) hudSpec.textContent = spec;
    root.style.setProperty("--glow", hue);
    railTicks.forEach((t) => t.classList.toggle("is-active", t.dataset.railTick === el.id));
    // the horizontal-offset readout only means something during The Turn
    if (hudXWrap) hudXWrap.hidden = el.id !== "turn";
  }

  const chapters = [...document.querySelectorAll("[data-chapter]")];
  if ("IntersectionObserver" in window && chapters.length) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => { if (en.isIntersecting) setActive(en.target); }),
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    chapters.forEach((c) => io.observe(c));
  }
  setActive(chapters[0]);

  // HUD collapse toggle
  const hudToggle = document.querySelector("[data-hud-toggle]");
  if (hud && hudToggle) {
    hudToggle.addEventListener("click", () => {
      const min = hud.classList.toggle("is-min");
      hudToggle.setAttribute("aria-pressed", String(min));
      hudToggle.textContent = min ? "+" : "−";
      hudToggle.setAttribute("aria-label", min ? "Show telemetry" : "Hide telemetry");
    });
  }

  // register machine — same kit, two feelings (interaction, no motion needed)
  const REGISTERS = {
    maze: {
      lerp: "0.12 — quick, restless", stagger: "30ms — things rush in",
      contrast: "hard — abrupt cuts", density: "crowded — edges cropped",
      palette: "hot accent on black", feeling: "a luxury you get lost in", hue: "#FF6B9A",
    },
    breath: {
      lerp: "0.06 — slow, floating", stagger: "120ms — things unfold",
      contrast: "soft — long fades", density: "airy — generous space",
      palette: "one calm accent on paper", feeling: "a calm you want to stay in", hue: "#2BD7C4",
    },
  };
  const rSwitches = [...document.querySelectorAll("[data-register]")];
  const rReadout = document.querySelector("[data-register-readout]");
  if (rSwitches.length && rReadout) {
    rSwitches.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.register;
        const set = REGISTERS[key];
        if (!set) return;
        rSwitches.forEach((b) => {
          const on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", String(on));
        });
        rReadout.querySelectorAll("[data-p]").forEach((dd) => {
          const v = set[dd.dataset.p];
          if (v != null) { dd.style.opacity = "0"; setTimeout(() => { dd.textContent = v; dd.style.opacity = "1"; }, 140); }
        });
        root.style.setProperty("--glow", set.hue);
      });
    });
  }

  // base scroll state — cheap, runs even without Lenis
  const docProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  };
  function baseUpdate() {
    const p = clamp(docProgress(), 0, 1);
    if (hudProgress) hudProgress.textContent = Math.round(p * 100);
    if (hudBar) hudBar.style.width = (p * 100).toFixed(1) + "%";
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", baseUpdate, { passive: true });
  window.addEventListener("resize", baseUpdate, { passive: true });
  baseUpdate();

  /* ---------- reduced-motion / no-Lenis: stop here (fully readable) ---------- */
  if (!motion) return;
  root.classList.add("motion");

  /* ---------- Lenis glide ---------- */
  const lenis = new window.Lenis({ lerp: 0.08, wheelMultiplier: 0.95, smoothWheel: true });
  window.lenis = lenis;   // exposed for tooling / debugging
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.3 });
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

  /* ---------- continuous rAF: the glide demo + pointer glow easing ---------- */
  const glideBox = document.querySelector("[data-glide]");
  const glideTarget = document.querySelector("[data-glide-target]");
  const glideFollow = document.querySelector("[data-glide-follow]");
  let followP = 0;

  const pointerGlow = document.querySelector("[data-pointer-glow]");
  let pgX = window.innerWidth / 2, pgY = window.innerHeight / 2, pgCurX = pgX, pgCurY = pgY;
  if (pointerGlow) {
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      pgX = e.clientX; pgY = e.clientY;
    }, { passive: true });
  }

  function tick() {
    // glide demo: target locked to scroll, follower eased toward it (visible lag)
    if (glideBox && glideTarget && glideFollow) {
      const r = glideBox.getBoundingClientRect();
      const vh = window.innerHeight;
      const tp = clamp((vh * 0.62 - r.top) / (r.height + vh * 0.5), 0, 1);
      const usable = glideBox.clientWidth * 0.9;
      const base = glideBox.clientWidth * 0.05;
      followP += (tp - followP) * 0.06;          // the lerp, made visible
      glideTarget.style.transform = `translateX(${(base + tp * usable).toFixed(1)}px)`;
      glideFollow.style.transform = `translateX(${(base + followP * usable).toFixed(1)}px)`;
    }
    // pointer glow eases toward the cursor
    if (pointerGlow) {
      pgCurX += (pgX - pgCurX) * 0.12; pgCurY += (pgY - pgCurY) * 0.12;
      pointerGlow.style.transform = `translate(${pgCurX.toFixed(1)}px, ${pgCurY.toFixed(1)}px)`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---------- scroll-linked transforms (one rAF-throttled pass) ---------- */
  const typeWord = document.querySelector("[data-type-word]");
  const typeStage = document.querySelector(".type-stage");
  const turnStage = document.querySelector("[data-turn-stage]");
  const turnRail = document.querySelector("[data-turn-rail]");
  const turnSpot = document.querySelector("[data-turn-spot]");
  const contrastSec = document.querySelector("[data-contrast]");
  const parallax = [...document.querySelectorAll("[data-parallax]")];

  function setTurnPin() { root.classList.toggle("turn-pin", window.innerWidth >= 760); }
  setTurnPin();

  let ticking = false;
  function update() {
    ticking = false;
    const vh = window.innerHeight;

    // velocity readout
    if (hudVelocity) hudVelocity.textContent = Math.min(Math.abs(lenis.velocity || 0), 9).toFixed(2);

    // 02 · type — one word scales + drifts as it passes (cropped by the stage)
    if (typeWord && typeStage) {
      const r = typeStage.getBoundingClientRect();
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      typeWord.style.transform = `translateX(${((0.5 - p) * 14).toFixed(2)}rem) scale(${(0.82 + p * 0.5).toFixed(3)})`;
    }

    // 04 · turn — vertical scroll → horizontal travel
    if (root.classList.contains("turn-pin") && turnStage && turnRail) {
      const r = turnStage.getBoundingClientRect();
      const scrollable = turnStage.offsetHeight - vh;
      const p = clamp(-r.top / (scrollable || 1), 0, 1);
      const maxX = Math.max(0, turnRail.scrollWidth - window.innerWidth);
      const x = p * maxX;
      turnRail.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`;
      if (turnSpot) turnSpot.style.transform = `translateX(${(p * window.innerWidth).toFixed(1)}px)`;
      if (hudX) hudX.textContent = Math.round(x);
    } else if (turnRail) {
      turnRail.style.transform = "";
    }

    // 05 · contrast — polarity blooms to light as the section centres, then back
    if (contrastSec) {
      const r = contrastSec.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const dist = Math.abs(center - vh / 2) / (vh / 2 + r.height / 2);
      contrastSec.style.setProperty("--c", clamp(1 - dist * 1.3, 0, 1).toFixed(3));
    }

    // 06 · depth + colophon wordmark — parallax planes
    for (const el of parallax) {
      const speed = parseFloat(el.dataset.parallax) || 0;
      const r = el.getBoundingClientRect();
      const offset = vh / 2 - (r.top + r.height / 2);
      el.style.transform = `translate3d(0, ${(offset * speed).toFixed(1)}px, 0)`;
    }
  }

  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  lenis.on("scroll", onScroll);
  window.addEventListener("scroll", onScroll, { passive: true });   // anchor jumps / find-in-page stay in sync
  window.addEventListener("resize", () => { setTurnPin(); onScroll(); }, { passive: true });
  update();
})();
