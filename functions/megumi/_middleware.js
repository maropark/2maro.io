// Server-side password gate for the Megumi redesign — covers every request
// under /megumi/* (the page, its CSS/JS, and assets).
//
// The password is read from the MEGUMI_PASSWORD environment variable, which is
// stored as a Cloudflare Pages secret and is NEVER committed to this repo. On a
// correct password we set an HttpOnly cookie holding a SHA-256 hash of the
// password; that hash is re-derived from the env var and compared on every
// request, so the cookie can't be forged without knowing the password, and the
// raw password never reaches the browser via JavaScript.
//
// Required one-time setup (see the project notes): set MEGUMI_PASSWORD in the
// Cloudflare Pages project. Until it is set, the area fails closed (503).

const COOKIE = 'megumi_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const PEPPER = 'megumi::paper-and-matcha::v1'; // not secret — just lengthens the hashed input

async function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

// Constant-time-ish string compare to avoid leaking via timing.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function gatePage({ error = '', notice = '' } = {}) {
  const errorBlock = error
    ? `<p class="gate__error" role="alert">${error}</p>`
    : notice
      ? `<p class="gate__notice">${notice}</p>`
      : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>MEGUMI — Private preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Hanken+Grotesk:wght@300;400;500&family=Spline+Sans+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --paper:#F4F1E8; --paper-2:#EDE7D9; --ink:#26241E; --ink-2:#46423A; --ink-3:#756F61;
      --matcha:#7A8B5C; --matcha-deep:#5A6940; --clay:#C2714F; --clay-deep:#A85B3B;
      --line:rgba(38,36,30,0.16);
      --serif:"Cormorant Garamond",Georgia,serif;
      --sans:"Hanken Grotesk",system-ui,sans-serif;
      --mono:"Spline Sans Mono",ui-monospace,monospace;
      --ease:cubic-bezier(.22,1,.36,1);
    }
    * { box-sizing:border-box; margin:0; padding:0; }
    html,body { height:100%; }
    body {
      font-family:var(--sans); color:var(--ink-2); background:var(--paper);
      min-height:100vh; display:grid; place-items:center; padding:1.5rem;
      -webkit-font-smoothing:antialiased; position:relative; overflow:hidden;
    }
    ::selection { background:var(--matcha); color:var(--paper); }
    /* breathing light blooms, echoing the site's atmosphere */
    .breath { position:fixed; border-radius:50%; filter:blur(70px); opacity:.4; pointer-events:none; z-index:0; }
    .breath--a { width:46vmax; height:46vmax; top:-14vmax; left:-10vmax; background:radial-gradient(circle,#AEB98C,transparent 70%); animation:breathe 13s var(--ease) infinite; }
    .breath--b { width:38vmax; height:38vmax; bottom:-12vmax; right:-8vmax; background:radial-gradient(circle,#DC9069,transparent 70%); animation:breathe 17s var(--ease) infinite 2s; }
    @keyframes breathe { 0%,100%{ transform:scale(1); opacity:.32; } 50%{ transform:scale(1.12); opacity:.5; } }
    .gate {
      position:relative; z-index:1; width:min(30rem,100%);
      background:rgba(244,241,232,.72); backdrop-filter:blur(6px);
      border:1px solid var(--line); border-radius:4px;
      padding:clamp(2rem,5vw,3.25rem); text-align:center;
      box-shadow:0 1px 0 rgba(255,255,255,.5) inset, 0 24px 60px -28px rgba(38,36,30,.4);
    }
    .gate__mark {
      font-family:var(--serif); font-size:2.6rem; line-height:1; color:var(--matcha-deep);
      display:block; margin-bottom:.5rem;
    }
    .gate__word {
      font-family:var(--mono); font-size:.72rem; letter-spacing:.42em; text-transform:uppercase;
      color:var(--ink-3); padding-left:.42em;
    }
    .gate__rule { width:34px; height:1px; background:var(--clay); margin:1.4rem auto; opacity:.7; }
    .gate__title {
      font-family:var(--serif); font-weight:400; font-style:italic;
      font-size:clamp(1.7rem,5vw,2.3rem); line-height:1.15; color:var(--ink); margin-bottom:.7rem;
    }
    .gate__sub { font-size:.95rem; color:var(--ink-3); line-height:1.6; margin-bottom:1.9rem; }
    form { display:flex; flex-direction:column; gap:.85rem; }
    .gate__field { position:relative; text-align:left; }
    .gate__label {
      font-family:var(--mono); font-size:.62rem; letter-spacing:.24em; text-transform:uppercase;
      color:var(--ink-3); display:block; margin-bottom:.5rem;
    }
    input[type=password] {
      font-family:var(--sans); font-size:1rem; width:100%; padding:.8rem .95rem; color:var(--ink);
      background:var(--paper); border:1px solid var(--line); border-radius:3px; transition:border-color .25s var(--ease);
    }
    input[type=password]:focus { outline:none; border-color:var(--matcha); }
    .gate__btn {
      font-family:var(--sans); font-weight:500; font-size:.95rem; letter-spacing:.01em;
      color:var(--paper); background:var(--clay); border:none; border-radius:999px;
      padding:.85rem 1.4rem; cursor:pointer; margin-top:.35rem;
      transition:background .25s var(--ease), transform .25s var(--ease);
    }
    .gate__btn:hover { background:var(--clay-deep); transform:translateY(-1px); }
    .gate__btn:focus-visible { outline:2px solid var(--matcha-deep); outline-offset:3px; }
    .gate__error { color:var(--clay-deep); font-size:.85rem; margin-bottom:-.2rem; }
    .gate__notice { color:var(--ink-3); font-size:.85rem; margin-bottom:-.2rem; }
    .gate__foot { margin-top:1.9rem; font-size:.78rem; color:var(--ink-3); }
    .gate__foot a { color:var(--matcha-deep); border-bottom:1px solid var(--line); padding-bottom:1px; text-decoration:none; }
    .gate__foot a:hover { border-color:var(--matcha-deep); }
    @media (prefers-reduced-motion: reduce) { .breath { animation:none; } }
  </style>
</head>
<body>
  <span class="breath breath--a" aria-hidden="true"></span>
  <span class="breath breath--b" aria-hidden="true"></span>
  <main class="gate">
    <span class="gate__mark" aria-hidden="true">恵</span>
    <span class="gate__word">Megumi</span>
    <div class="gate__rule" aria-hidden="true"></div>
    <h1 class="gate__title">A private preview</h1>
    <p class="gate__sub">This redesign is a protected design study. Enter the password to step inside.</p>
    ${errorBlock}
    <form method="POST" action="/megumi/">
      <div class="gate__field">
        <label class="gate__label" for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" autofocus required />
      </div>
      <button class="gate__btn" type="submit">Enter the studio</button>
    </form>
    <p class="gate__foot"><a href="https://2maro.io/">← back to 2maro.io</a></p>
  </main>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const password = env.MEGUMI_PASSWORD;

  // Fail closed if the secret hasn't been configured yet.
  if (!password) {
    return htmlResponse(
      gatePage({ notice: 'This preview isn’t configured yet. (MEGUMI_PASSWORD is not set.)' }),
      503,
    );
  }

  const expectedToken = await sha256Hex(password + PEPPER);

  // Login attempt.
  if (request.method === 'POST') {
    let supplied = '';
    try {
      const form = await request.formData();
      supplied = String(form.get('password') || '');
    } catch {
      supplied = '';
    }
    if (safeEqual(supplied, password)) {
      const headers = new Headers({
        Location: '/megumi/',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      });
      headers.append(
        'Set-Cookie',
        `${COOKIE}=${expectedToken}; Path=/megumi; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
      );
      return new Response(null, { status: 303, headers });
    }
    return htmlResponse(gatePage({ error: 'That password didn’t match. Try again.' }), 401);
  }

  // Already unlocked? Serve the real asset, tagged noindex.
  const cookies = parseCookies(request.headers.get('Cookie'));
  if (cookies[COOKIE] && safeEqual(cookies[COOKIE], expectedToken)) {
    const response = await next();
    const out = new Response(response.body, response);
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return out;
  }

  // Locked.
  return htmlResponse(gatePage(), 401);
}
