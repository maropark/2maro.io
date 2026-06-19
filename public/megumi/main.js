/* =====================================================================
   MEGUMI — motion engine
   Lenis glide + scroll-linked "breathing ritual" behaviors.
   Progressive enhancement: nothing here is required to read the page.
   Honors prefers-reduced-motion (and absence of Lenis) by staying still.
   ===================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasLenis = typeof window.Lenis === "function";
  const motion = !reduce && hasLenis;

  /* ---------- always-on, no-motion-required wiring ---------- */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // newsletter — local confirmation, no backend
  const form = document.querySelector("[data-newsletter]");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const thanks = form.querySelector("[data-newsletter-thanks]");
      const row = form.querySelector(".newsletter__row");
      if (thanks) thanks.hidden = false;
      if (row) row.style.display = "none";
    });
  }

  // menu rail — swap the sticky category label as each group passes (no animation,
  // so it runs even under reduced motion)
  const railLabel = document.querySelector("[data-rail-label]");
  const railJp = document.querySelector("[data-rail-jp]");
  const mgroups = [...document.querySelectorAll("[data-mgroup]")];
  if (railLabel && mgroups.length && "IntersectionObserver" in window) {
    const mObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            railLabel.textContent = en.target.dataset.mgroup;
            if (railJp) railJp.textContent = en.target.dataset.mgroupJp;
          }
        });
      },
      { rootMargin: "-22% 0px -74% 0px" }
    );
    mgroups.forEach((g) => mObs.observe(g));
  }

  // nav overlay
  const overlay = document.querySelector("[data-nav-overlay]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const closeBtn = document.querySelector("[data-nav-close]");
  let lenis = null;

  function setOverlay(open) {
    if (!overlay) return;
    overlay.classList.toggle("is-open", open);
    overlay.toggleAttribute("inert", !open);
    overlay.setAttribute("aria-hidden", String(!open));
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  if (overlay) {
    overlay.removeAttribute("hidden");
    setOverlay(false);
    toggle && toggle.addEventListener("click", () => setOverlay(true));
    closeBtn && closeBtn.addEventListener("click", () => setOverlay(false));
    overlay.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setOverlay(false))
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) setOverlay(false);
    });
  }

  /* ---------- reduced-motion / no-lenis: stop here (page is fully readable) ---------- */
  if (!motion) return;

  root.classList.add("motion");

  /* ---------- Lenis smooth scroll — gentle, floating lerp ---------- */
  lenis = new window.Lenis({
    lerp: 0.075,          // slow, calm glide
    wheelMultiplier: 0.9,
    smoothWheel: true,
  });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  // anchor links → smooth scroll through Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    });
  });

  /* ---------- in-view reveals ---------- */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          revealIO.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => revealIO.observe(el));

  /* ---------- ensō draws itself when it arrives ---------- */
  const enso = document.querySelector("[data-enso] path");
  if (enso) {
    const len = enso.getTotalLength();
    enso.style.strokeDasharray = len;
    enso.style.strokeDashoffset = len;
    const ensoIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            enso.style.transition = "stroke-dashoffset 2.4s cubic-bezier(0.22,1,0.36,1)";
            enso.style.strokeDashoffset = "0";
            ensoIO.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    ensoIO.observe(enso);
  }

  /* ---------- drifting leaves in The Space ---------- */
  const leavesBox = document.querySelector("[data-leaves]");
  if (leavesBox) {
    const COLORS = ["var(--matcha)", "var(--clay)", "var(--matcha-deep)"];
    for (let i = 0; i < 12; i++) {
      const leaf = document.createElement("span");
      leaf.className = "leaf";
      const size = 9 + Math.random() * 12;
      leaf.style.left = Math.random() * 100 + "%";
      leaf.style.width = size + "px";
      leaf.style.height = size * 1.5 + "px";
      leaf.style.background = COLORS[i % COLORS.length];
      leaf.style.opacity = (0.3 + Math.random() * 0.35).toFixed(2);
      leaf.style.animationDuration = 9 + Math.random() * 9 + "s";
      leaf.style.animationDelay = -Math.random() * 12 + "s";
      leavesBox.appendChild(leaf);
    }
  }

  /* ---------- scroll-linked transforms (one rAF-throttled pass) ---------- */
  const header = document.querySelector("[data-header]");
  const indicator = document.querySelector("[data-chapter-indicator]");
  const indNum = indicator && indicator.querySelector(".chapter-indicator__num");
  const indName = indicator && indicator.querySelector(".chapter-indicator__name");
  const heroWord = document.querySelector("[data-hero-word]");
  const heroSection = document.querySelector(".hero");
  const parallax = [...document.querySelectorAll("[data-parallax]")];
  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const ritualSection = document.querySelector(".ritual");
  const ritualStage = document.querySelector("[data-ritual-stage]");
  const ritualSteps = document.querySelector(".ritual__steps");
  const ritualBar = document.querySelector("[data-ritual-progress]");

  // The horizontal ritual pin only makes sense with room to move sideways.
  function setRitualPin() {
    const enable = window.innerWidth >= 760;
    root.classList.toggle("ritual-pin", enable);
  }
  setRitualPin();

  let activeName = "";
  let ticking = false;

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    const y = window.scrollY;

    // header chrome
    if (header) {
      header.classList.toggle("is-scrolled", y > 48);
      if (ritualSection) {
        const r = ritualSection.getBoundingClientRect();
        const headerLine = 40;
        header.classList.toggle("on-dark", r.top <= headerLine && r.bottom >= headerLine);
      }
    }

    // hero word: gentle grow + fade as it leaves
    if (heroWord && heroSection) {
      const hp = Math.min(Math.max(y / (heroSection.offsetHeight || vh), 0), 1);
      heroWord.style.transform = `scale(${1 + hp * 0.12})`;
      heroWord.style.opacity = String(1 - hp * 0.7);
    }

    // parallax drift
    for (const el of parallax) {
      const speed = parseFloat(el.dataset.parallax) || 0;
      const r = el.getBoundingClientRect();
      const offset = vh / 2 - (r.top + r.height / 2);
      el.style.transform = `translate3d(0, ${(offset * speed).toFixed(1)}px, 0)`;
    }

    // morphing chapter indicator
    let current = null;
    for (const ch of chapters) {
      if (ch.getBoundingClientRect().top <= vh * 0.4) current = ch;
    }
    if (indicator) {
      const name = current ? current.dataset.chapterName : "";
      const num = current ? current.dataset.chapterNum : "—";
      if (name !== activeName) {
        activeName = name;
        if (indNum) indNum.textContent = num;
        if (indName) indName.textContent = name || "Design Hair with Care";
      }
    }

    // ritual horizontal sequence
    if (root.classList.contains("ritual-pin") && ritualStage && ritualSteps) {
      const r = ritualStage.getBoundingClientRect();
      const scrollable = ritualStage.offsetHeight - vh;
      const p = Math.min(Math.max(-r.top / (scrollable || 1), 0), 1);
      const maxX = Math.max(0, ritualSteps.scrollWidth - window.innerWidth);
      ritualSteps.style.transform = `translate3d(${(-p * maxX).toFixed(1)}px,0,0)`;
      if (ritualBar) ritualBar.style.width = (p * 100).toFixed(1) + "%";
    } else if (ritualSteps) {
      ritualSteps.style.transform = "";
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  lenis.on("scroll", onScroll);
  // also listen to native scroll so anchor jumps / programmatic scrolls stay in sync
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { setRitualPin(); onScroll(); }, { passive: true });
  update();
})();
