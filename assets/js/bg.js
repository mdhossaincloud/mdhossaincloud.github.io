/* ==========================================================================
   Page background: a 3D "data sphere" of network nodes and binary digits.
   It turns slowly at the top of the page and, as the visitor scrolls,
   breaks into fragments that drift apart and vanish.
   Canvas 2D, no dependencies. Static under reduced motion.
   ========================================================================== */
(() => {
  'use strict';
  const canvas = document.getElementById('bg');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rmq = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = rmq.matches;
  let W = 0, H = 0, dpr = 1, mobile = false;
  let C = {};
  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    C = { acc: cs.getPropertyValue('--acc').trim(), cy: cs.getPropertyValue('--cy').trim(), mu: cs.getPropertyValue('--mu').trim(), ink: cs.getPropertyValue('--ink').trim() };
  };

  // deterministic randomness so the sphere looks the same on every visit
  let seed = 20180701;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  /* ---------- Particles on a Fibonacci sphere, plus two orbit rings ---------- */
  let parts = [];
  function build() {
    seed = 20180701;
    parts = [];
    const n = mobile ? 360 : 720;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const push = (x, y, z, ring) => {
      const ox = x + (rnd() - 0.5) * 0.9 + 0.45, oy = y + (rnd() - 0.5) * 0.9 + 0.35, oz = z + (rnd() - 0.5) * 0.9;
      const len = Math.hypot(ox, oy, oz) || 1;
      parts.push({
        x, y, z, ring,
        vx: ox / len, vy: oy / len, vz: oz / len,
        speed: 0.7 + rnd() * 1.6,
        delay: rnd() * 0.45,
        glyph: rnd() < 0.2 ? (rnd() < 0.5 ? '0' : '1') : null,
        size: 0.8 + rnd() * 1.3,
        hot: rnd() < 0.06,
      });
    };
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      push(Math.cos(th) * r, y, Math.sin(th) * r, 0);
    }
    const ringN = mobile ? 70 : 140;
    for (let i = 0; i < ringN; i++) {
      const a = (i / ringN) * Math.PI * 2;
      push(Math.cos(a) * 1.45, Math.sin(a) * 0.18, Math.sin(a) * 1.45, 1);
    }
  }

  /* ---------- Camera ---------- */
  let yaw = 0.6, tilt = 0.32, px = 0, py = 0, tpx = 0, tpy = 0;
  function project(x, y, z, cx, cy, R) {
    const cyw = Math.cos(yaw), syw = Math.sin(yaw);
    const x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
    const ct = Math.cos(tilt + py), st = Math.sin(tilt + py);
    const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
    const s = 3.2 / (3.2 + z2);
    return { x: cx + (x1 + px) * R * s, y: cy + y2 * R * s, s, z: z2 };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const wasMobile = mobile;
    mobile = W < 900;
    if (!parts.length || wasMobile !== mobile) build();
    draw();
  }

  const clamp = (v) => Math.max(0, Math.min(1, v));
  const scrollP = () => clamp(scrollY / (H * 0.95));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const p = reduce ? (scrollY > H * 0.6 ? 1 : 0) : scrollP();
    if (p >= 1) return;
    const e0 = p * p;
    const cx = (mobile ? W * 0.5 : W * 0.74) + e0 * W * 0.06;
    const cy = mobile ? H * 0.3 : H * 0.5;
    const R = mobile ? Math.min(W, H) * 0.36 : Math.min(W * 0.2, H * 0.34);
    const base = mobile ? 0.38 : 0.9;
    const font = `${mobile ? 9 : 11}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < parts.length; i++) {
      const q = parts[i];
      // each fragment starts breaking away at its own moment
      const d = clamp((p - q.delay * 0.6) / (1 - q.delay * 0.6));
      const e = d * d * (3 - 2 * d);
      const dist = e * q.speed * 2.4;
      const pr = project(q.x + q.vx * dist, q.y + q.vy * dist - e * 0.4, q.z + q.vz * dist, cx, cy, R);
      const front = (1 - pr.z) / 2; // 0 back .. 1 front
      let a = (0.18 + 0.82 * front) * Math.pow(1 - e, 1.6) * base;
      if (a < 0.01) continue;
      if (q.glyph) {
        // binary digits glow brighter while they break away, then fade out
        const g = (0.35 + Math.sin(Math.PI * Math.min(1, e * 1.4)) * 0.9) * (1 - e * 0.7);
        ctx.globalAlpha = Math.min(1, a * g * 1.3);
        ctx.fillStyle = q.hot ? C.cy : C.acc;
        ctx.fillText(q.glyph, pr.x, pr.y);
      } else {
        ctx.globalAlpha = a * (q.ring ? 0.7 : 1);
        ctx.fillStyle = q.hot ? C.cy : (q.ring ? C.acc : C.mu);
        const r = q.size * pr.s * (1 - e * 0.5) * (mobile ? 0.9 : 1.1);
        ctx.fillRect(pr.x - r / 2, pr.y - r / 2, r, r);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Loop: only while the sphere is visible ---------- */
  let raf = 0, last = 0, running = false;
  function tick(ts) {
    raf = 0;
    const dt = Math.min(50, ts - (last || ts));
    last = ts;
    yaw += dt * 0.00011;
    px += (tpx - px) * 0.05;
    py += (tpy - py) * 0.05;
    draw();
    if (running) raf = requestAnimationFrame(tick);
  }
  function update() {
    const want = !reduce && !document.hidden && scrollP() < 1;
    if (want && !running) { running = true; last = 0; raf = requestAnimationFrame(tick); }
    if (!want && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; draw(); }
  }

  addEventListener('scroll', () => { if (!running) { update(); if (!running) draw(); } }, { passive: true });
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', update);
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reduce) return;
    tpx = (e.clientX / W - 0.5) * 0.12;
    tpy = (e.clientY / H - 0.5) * 0.12;
  }, { passive: true });
  rmq.addEventListener?.('change', (m) => { reduce = m.matches; update(); draw(); });
  window.addEventListener('themechange', () => { readColors(); draw(); });

  readColors();
  resize();
  update();
})();
