/**
 * Nightfall — scroll-driven day-to-night transition
 *
 * As the reader scrolls, the journal transitions through three phases:
 *   1. Daytime (0–30%) — warm cream notebook, blue sky, sun rising
 *   2. Golden Hour (30–65%) — amber, rosy warmth, sun crossing, orange sky
 *   3. Night (65–100%) — black & silver ink journal, dark sky, stars
 */

// --- Color utilities ---

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: RGB): string {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpColor(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function lerpHex(a: string, b: string, t: number): string {
  return rgbToHex(lerpColor(hexToRgb(a), hexToRgb(b), t));
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Three-stop gradient: interpolates day → golden → night
 */
function threeStop(day: string, golden: string, night: string, t: number, dayEnd = 0.30, nightStart = 0.65): string {
  if (t <= dayEnd) return day;
  if (t >= nightStart) {
    const nt = Math.min((t - nightStart) / (1 - nightStart), 1);
    return lerpHex(golden, night, nt);
  }
  const gt = (t - dayEnd) / (nightStart - dayEnd);
  return lerpHex(day, golden, gt);
}

function threeStopNum(day: number, golden: number, night: number, t: number, dayEnd = 0.30, nightStart = 0.65): number {
  if (t <= dayEnd) return day;
  if (t >= nightStart) {
    const nt = Math.min((t - nightStart) / (1 - nightStart), 1);
    return lerpNum(golden, night, nt);
  }
  const gt = (t - dayEnd) / (nightStart - dayEnd);
  return lerpNum(day, golden, gt);
}

// --- Color palettes ---

const DAY = {
  paper:         '#F5F0E8',
  paperAlt:      '#EDE8DD',
  kraft:         '#D4C5A9',
  kraftLight:    '#E0D5BF',
  ink:           '#2C2C2C',
  pencil:        '#6B6B6B',
  inkFaded:      '#8B8B8B',
  stampRed:      '#C1440E',
  stickyYellow:  '#F2C94C',
  washiTeal:     '#4A9B8E',
  ballpointBlue: '#2D5FAA',
  typewriter:    '#3D3D3D',
  typewriterBg:  '#EDE8DD',
  lineColor:     '#D4C5A9',
  marginLine:    '#E8A0A0',
};

const GOLDEN = {
  paper:         '#F0DCC0',
  paperAlt:      '#E8D0B0',
  kraft:         '#C4A878',
  kraftLight:    '#D8C4A0',
  ink:           '#2A1A0A',
  pencil:        '#7A5A3A',
  inkFaded:      '#9A7A5A',
  stampRed:      '#D4380A',
  stickyYellow:  '#E8A020',
  washiTeal:     '#C47830',
  ballpointBlue: '#8A5A30',
  typewriter:    '#3A2A1A',
  typewriterBg:  '#E8D0B0',
  lineColor:     '#C4A878',
  marginLine:    '#D48070',
};

const NIGHT = {
  paper:         '#0D0D14',
  paperAlt:      '#141420',
  kraft:         '#252535',
  kraftLight:    '#1A1A28',
  ink:           '#D0D0E0',
  pencil:        '#8888A0',
  inkFaded:      '#666680',
  stampRed:      '#FF4488',
  stickyYellow:  '#CCFF00',
  washiTeal:     '#00FFCC',
  ballpointBlue: '#4488FF',
  typewriter:    '#C8C8E0',
  typewriterBg:  '#1A1A28',
  lineColor:     '#1E1E30',
  marginLine:    '#FF448840',
};

// --- Sky palettes ---

const SKY = {
  day:    { top: '#7EC8E3', bottom: '#B8E4F0', horizon: '#A8D8EA' },
  golden: { top: '#D4614E', bottom: '#F0A050', horizon: '#E88840' },
  night:  { top: '#08081A', bottom: '#0E0E28', horizon: '#151530' },
};

// --- Token mapping (CSS variable name → palette key) ---

const TOKEN_MAP: Record<string, keyof typeof DAY> = {
  '--color-paper':         'paper',
  '--color-paper-alt':     'paperAlt',
  '--color-kraft':         'kraft',
  '--color-kraft-light':   'kraftLight',
  '--color-ink':           'ink',
  '--color-pencil':        'pencil',
  '--color-ink-faded':     'inkFaded',
  '--color-stamp-red':     'stampRed',
  '--color-sticky-yellow': 'stickyYellow',
  '--color-washi-teal':    'washiTeal',
  '--color-ballpoint-blue':'ballpointBlue',
  '--color-typewriter':    'typewriter',
  '--color-typewriter-bg': 'typewriterBg',
  '--line-color':          'lineColor',
  '--color-margin-line':   'marginLine',
};

// --- Shadow interpolation ---

function getShadows(t: number): Record<string, string> {
  if (t <= 0.30) {
    return {
      '--shadow-paper':       '2px 3px 8px rgba(0, 0, 0, 0.08)',
      '--shadow-paper-hover': '3px 5px 14px rgba(0, 0, 0, 0.12)',
    };
  }
  if (t >= 0.85) {
    return {
      '--shadow-paper':       '0 0 12px rgba(68, 136, 255, 0.08), 2px 3px 8px rgba(0, 0, 0, 0.3)',
      '--shadow-paper-hover': '0 0 20px rgba(68, 136, 255, 0.12), 3px 5px 14px rgba(0, 0, 0, 0.4)',
    };
  }
  const depth = 0.08 + (t - 0.30) * 0.4;
  return {
    '--shadow-paper':       `2px 3px 8px rgba(0, 0, 0, ${depth.toFixed(2)})`,
    '--shadow-paper-hover': `3px 5px 14px rgba(0, 0, 0, ${(depth + 0.04).toFixed(2)})`,
  };
}

// --- Texture overlay opacity ---
function getTextureOpacity(t: number): number {
  if (t <= 0.30) return 0.03;
  if (t >= 0.85) return 0.06;
  return 0.03 + (t - 0.30) * 0.055;
}

// --- Sun position ---
// Sun arcs from left to right across the sky, then dips below horizon at night
function getSunPosition(t: number): { x: number; y: number; opacity: number } {
  // x: moves from 10% → 50% → 90% across the sky
  const x = threeStopNum(10, 50, 92, t);

  // y: arcs up then down (parabolic) — 30% at start, rises to 10% at golden hour, drops to 90% at night
  let y: number;
  if (t <= 0.30) {
    y = 25 - t * 30; // 25% → 16%
  } else if (t <= 0.65) {
    const gt = (t - 0.30) / 0.35;
    y = 16 + gt * 50; // 16% → 66%
  } else {
    const nt = (t - 0.65) / 0.35;
    y = 66 + nt * 60; // 66% → 126% (below horizon)
  }

  // opacity: fades out as sun sets
  let opacity = 1;
  if (t > 0.70) {
    opacity = Math.max(0, 1 - (t - 0.70) / 0.20);
  }

  return { x, y, opacity };
}

// --- Main loop ---

let ticking = false;
let lastProgress = -1;

function applyNightfall() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const t = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

  if (Math.abs(t - lastProgress) < 0.002) {
    ticking = false;
    return;
  }
  lastProgress = t;

  const root = document.documentElement;

  // Interpolate all color tokens
  for (const [cssVar, key] of Object.entries(TOKEN_MAP)) {
    root.style.setProperty(cssVar, threeStop(DAY[key], GOLDEN[key], NIGHT[key], t));
  }

  // Shadows
  const shadows = getShadows(t);
  for (const [prop, val] of Object.entries(shadows)) {
    root.style.setProperty(prop, val);
  }

  // Stacked shadow
  const kraftLight = threeStop(DAY.kraftLight, GOLDEN.kraftLight, NIGHT.kraftLight, t);
  const kraft = threeStop(DAY.kraft, GOLDEN.kraft, NIGHT.kraft, t);
  root.style.setProperty('--shadow-stacked', `1px 1px 0 ${kraftLight}, 3px 3px 0 ${kraft}`);

  // Texture overlay opacity
  root.style.setProperty('--texture-opacity', String(getTextureOpacity(t)));

  // Sky colors
  root.style.setProperty('--sky-top', threeStop(SKY.day.top, SKY.golden.top, SKY.night.top, t));
  root.style.setProperty('--sky-bottom', threeStop(SKY.day.bottom, SKY.golden.bottom, SKY.night.bottom, t));
  root.style.setProperty('--sky-horizon', threeStop(SKY.day.horizon, SKY.golden.horizon, SKY.night.horizon, t));

  // Sun position
  const sun = getSunPosition(t);
  root.style.setProperty('--sun-x', `${sun.x}%`);
  root.style.setProperty('--sun-y', `${sun.y}%`);
  root.style.setProperty('--sun-opacity', String(sun.opacity));

  // Cloud opacity (fade during golden hour, gone at night)
  const cloudOpacity = t <= 0.30 ? 0.7 : t <= 0.65 ? 0.7 - ((t - 0.30) / 0.35) * 0.5 : Math.max(0, 0.2 - ((t - 0.65) / 0.35) * 0.2);
  root.style.setProperty('--cloud-opacity', String(cloudOpacity));

  // Stars opacity (only at night)
  const starsOpacity = t < 0.60 ? 0 : Math.min((t - 0.60) / 0.25, 1);
  root.style.setProperty('--stars-opacity', String(starsOpacity));

  // Phase classes
  root.classList.toggle('nightfall-golden', t > 0.25 && t < 0.70);
  root.classList.toggle('nightfall-night', t >= 0.65);

  // Progress for CSS
  root.style.setProperty('--nightfall-progress', String(t));

  ticking = false;
}

function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(applyNightfall);
  }
}

// Initialize
applyNightfall();
window.addEventListener('scroll', onScroll, { passive: true });

// Re-initialize after Astro client-side navigation
document.addEventListener('astro:page-load', () => {
  lastProgress = -1;
  applyNightfall();
});
