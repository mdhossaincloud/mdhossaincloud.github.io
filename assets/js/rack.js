/* Server rack in 3D: scroll-driven walkthrough that ends by dissolving into binary.
   Hand-rolled projection on a 2D canvas; no libraries. */
(() => {
  'use strict';
  const story = document.getElementById('rack-story');
  const cv = document.getElementById('rack3d');
  if (!story || !cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const steps = [...story.querySelectorAll('.rack-steps > li')];
  const endStep = story.querySelector('.rk-end');
  const fig = story.querySelector('.rack-fig');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Model (y up, rack front faces +z) ---------- */
  const UH = 0.175;                       // one rack unit
  const RU = 24;                          // 24U rack
  const X0 = -0.92, X1 = 0.92, ZB = -0.72, ZF = 0.74;
  const yOf = (u) => -RU * UH / 2 + (u - 1) * UH;
  const UNITS = [
    { kind: 'fw', u: 23, n: 1, step: 0 },
    { kind: 'patch', u: 22, n: 1, step: 1 },
    { kind: 'mgr', u: 21, n: 1, step: 1 },
    { kind: 'sw', u: 20, n: 1, step: 2 },
    { kind: 'srv', u: 17, n: 2, step: 3 },
    { kind: 'srv', u: 15, n: 2, step: 3 },
    { kind: 'blank', u: 13, n: 1, step: -1 },
    { kind: 'nvr', u: 10, n: 2, step: 4 },
    { kind: 'blank', u: 7, n: 1, step: -1 },
    { kind: 'ups', u: 2, n: 2, step: 5 },
  ].map((m) => ({ ...m, y0: yOf(m.u), y1: yOf(m.u + m.n) - 0.012, slide: 0, phase: Math.random() * 6 }));
  const RACK = { x0: -1.08, x1: 1.08, y0: yOf(1) - 0.16, y1: yOf(RU + 1) + 0.14, z0: -0.86, z1: 0.86 };

  /* ---------- Colours from the design tokens ---------- */
  let C = {};
  const readColors = () => {
    const s = getComputedStyle(document.documentElement);
    const g = (n) => s.getPropertyValue(n).trim();
    const light = document.documentElement.dataset.theme === 'light';
    C = { bg: g('--bg'), sf: g('--sf'), sf2: g('--sf-2'), ln: g('--ln'), ln2: g('--ln-2'), acc: g('--acc'),
      cy: g('--cy'), ok: g('--ok'), warn: g('--warn'), mu: g('--mu'), ink: g('--ink'), light,
      hole: light ? '#1b2740' : '#050a14', red: '#ff5d6c' };
  };
  readColors();

  /* ---------- Camera ---------- */
  let W = 0, H = 0, DPR = 1, F = 1, cx = 0, cy = 0, yaw = -0.5, pitch = 0.2;
  const D = 9;
  function proj(x, y, z) {
    const ca = Math.cos(yaw), sa = Math.sin(yaw), cb = Math.cos(pitch), sb = Math.sin(pitch);
    const x1 = x * ca + z * sa;
    const z1 = -x * sa + z * ca;
    const y2 = y * cb - z1 * sb;
    const z2 = y * sb + z1 * cb;
    const zc = D - z2;
    return [cx + (x1 * F) / zc, cy - (y2 * F) / zc, zc];
  }
  function poly(pts, fill, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }
  const area = (p) => (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[1][1] - p[0][1]) * (p[2][0] - p[0][0]);

  /* Box faces, each listed counter-clockwise when seen from outside. */
  function box(x0, x1, y0, y1, z0, z1) {
    const P = (x, y, z) => proj(x, y, z);
    return {
      front: [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)],
      top: [P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)],
      left: [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)],
      right: [P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1)],
      bottom: [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)],
    };
  }
  let SIGN = 1; // decided once from the front face winding
  const visible = (f) => area(f) * SIGN > 0;

  /* Draw a rectangle on a unit's front panel, in panel coordinates (u across, v up, 0..1). */
  function panelRect(m, z, u0, v0, u1, v1, fill, stroke) {
    const X = (u) => X0 + (X1 - X0) * u, Y = (v) => m.y0 + (m.y1 - m.y0) * v;
    poly([proj(X(u0), Y(v0), z), proj(X(u1), Y(v0), z), proj(X(u1), Y(v1), z), proj(X(u0), Y(v1), z)], fill, stroke, 0.8);
  }

  function details(m, z, t, alpha) {
    const blink = (k, rate) => (Math.sin(t * rate + m.phase + k * 1.7) > -0.2);
    switch (m.kind) {
      case 'fw':
        panelRect(m, z, 0.03, 0.25, 0.16, 0.75, C.acc);
        for (let i = 0; i < 3; i++) panelRect(m, z, 0.2 + i * 0.035, 0.42, 0.22 + i * 0.035, 0.58, blink(i, 5) ? C.ok : C.ln2);
        for (let i = 0; i < 8; i++) panelRect(m, z, 0.42 + i * 0.065, 0.22, 0.47 + i * 0.065, 0.78, C.hole, C.ln2);
        for (let i = 0; i < 8; i++) if (blink(i, 9)) panelRect(m, z, 0.43 + i * 0.065, 0.8, 0.46 + i * 0.065, 0.9, C.cy);
        break;
      case 'patch':
        for (let i = 0; i < 24; i++) {
          const u = 0.05 + i * 0.0378;
          panelRect(m, z, u, 0.25, u + 0.026, 0.75, C.hole, C.ln2);
          if (i % 3 !== 2) panelRect(m, z, u + 0.004, 0.38, u + 0.022, 0.62, [C.acc, C.cy, C.warn, C.ok][i % 4]);
        }
        break;
      case 'mgr':
        panelRect(m, z, 0.04, 0.42, 0.96, 0.58, C.hole);
        break;
      case 'sw':
        for (let r = 0; r < 2; r++) for (let i = 0; i < 24; i++) {
          const u = 0.16 + i * 0.032 + Math.floor(i / 6) * 0.012;
          const v = r ? 0.52 : 0.14;
          panelRect(m, z, u, v, u + 0.024, v + 0.32, C.hole);
          if (blink(i + r * 24, 11 + (i % 5))) panelRect(m, z, u + 0.004, v + 0.34, u + 0.02, v + 0.4, C.ok);
        }
        panelRect(m, z, 0.03, 0.3, 0.1, 0.7, C.ln2);
        break;
      case 'srv':
        for (let i = 0; i < 8; i++) {
          const u = 0.06 + i * 0.085;
          panelRect(m, z, u, 0.12, u + 0.072, 0.88, C.sf, C.ln2);
          panelRect(m, z, u + 0.05, 0.72, u + 0.064, 0.8, blink(i, 3 + i) ? C.ok : C.ln);
        }
        panelRect(m, z, 0.8, 0.12, 0.97, 0.88, C.hole);
        for (let i = 0; i < 5; i++) panelRect(m, z, 0.82, 0.2 + i * 0.13, 0.95, 0.24 + i * 0.13, C.ln2);
        panelRect(m, z, 0.74, 0.44, 0.77, 0.56, C.acc);
        break;
      case 'nvr':
        for (let i = 0; i < 4; i++) {
          const u = 0.06 + i * 0.11;
          panelRect(m, z, u, 0.14, u + 0.095, 0.86, C.sf, C.ln2);
          panelRect(m, z, u + 0.07, 0.7, u + 0.085, 0.78, C.ok);
        }
        panelRect(m, z, 0.56, 0.3, 0.86, 0.72, C.hole, C.ln2);
        if (blink(0, 2.4)) panelRect(m, z, 0.59, 0.44, 0.62, 0.58, C.red);
        panelRect(m, z, 0.64, 0.46, 0.8, 0.56, C.mu);
        panelRect(m, z, 0.9, 0.42, 0.94, 0.58, C.warn);
        break;
      case 'ups':
        panelRect(m, z, 0.06, 0.32, 0.3, 0.72, C.hole, C.ln2);
        for (let i = 0; i < 5; i++) panelRect(m, z, 0.08 + i * 0.042, 0.42, 0.11 + i * 0.042, 0.62, i < 4 ? C.ok : C.ln);
        for (let i = 0; i < 3; i++) panelRect(m, z, 0.36 + i * 0.05, 0.42, 0.39 + i * 0.05, 0.58, C.ln2);
        for (let i = 0; i < 12; i++) panelRect(m, z, 0.56 + i * 0.033, 0.18, 0.575 + i * 0.033, 0.82, C.hole);
        break;
      case 'blank':
        for (let i = 0; i < 18; i++) panelRect(m, z, 0.06 + i * 0.05, 0.4, 0.085 + i * 0.05, 0.6, C.hole);
        break;
    }
  }

  /* ---------- Particles for the binary break-up ---------- */
  const mobile = matchMedia('(max-width: 900px)').matches;
  const parts = [];
  (function sample() {
    const per = mobile ? 0.55 : 1;
    UNITS.forEach((m) => {
      const cols = Math.round(34 * per), rows = Math.max(2, Math.round(m.n * 4 * per));
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        if (Math.random() < 0.25) continue;
        parts.push(mk(X0 + (X1 - X0) * (i + Math.random()) / cols, m.y0 + (m.y1 - m.y0) * (j + Math.random()) / rows, ZF, m));
      }
      for (let i = 0; i < cols * 0.4; i++) parts.push(mk(X0 + (X1 - X0) * Math.random(), m.y1, ZB + (ZF - ZB) * Math.random(), m));
    });
    for (let i = 0; i < 180 * per; i++) {
      const post = i % 4;
      parts.push(mk(post % 2 ? RACK.x1 : RACK.x0, RACK.y0 + (RACK.y1 - RACK.y0) * Math.random(), post < 2 ? RACK.z1 : RACK.z0, null));
    }
    function mk(x, y, z, m) {
      const a = Math.random() * Math.PI * 2;
      return { x, y, z, dx: x * 0.8 + Math.cos(a) * 0.9, dy: 0.4 + Math.random() * 1.2, dz: 0.6 + Math.sin(a) * 0.9 + Math.random(),
        sp: 1.4 + Math.random() * 2.6, g: Math.random() < 0.5 ? '0' : '1', s: 0.7 + Math.random() * 0.6, hue: Math.random(), m };
    }
  })();

  /* ---------- Scroll state ---------- */
  let active = -1, brk = 0, onScreen = false;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const smooth = (a, b, v) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
  function readScroll() {
    const vh = innerHeight;
    const line = vh * (matchMedia('(max-width: 900px)').matches ? 0.72 : 0.5);
    let best = -1, bestD = Infinity;
    steps.forEach((li, i) => {
      const r = li.getBoundingClientRect();
      const d = r.top > line ? r.top - line : (r.bottom < line ? line - r.bottom : 0);
      if (d < bestD) { bestD = d; best = i; }
    });
    const idx = steps[best]?.classList.contains('rk-end') ? 6 : best;
    if (idx !== active) {
      active = idx;
      steps.forEach((li, i) => li.classList.toggle('on', i === best));
    }
    const er = endStep.getBoundingClientRect();
    const small = matchMedia('(max-width: 900px)').matches;
    brk = reduce.matches ? 0 : clamp((vh * (small ? 0.98 : 0.95) - er.top) / (vh * (small ? 0.5 : 0.7)));
    fig.style.opacity = String(1 - smooth(0.7, 1, brk));
  }

  /* ---------- Render ---------- */
  function resize() {
    const r = cv.getBoundingClientRect();
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    F = Math.min(W * 3.1, H * 1.78);
    cx = W * 0.5; cy = H * 0.5;
    const f = box(0, 1, 0, 1, 0, 1).front;
    SIGN = area(f) > 0 ? 1 : -1;
  }

  function frame(now) {
    const t = now / 1000;
    if (!reduce.matches) {
      yaw = -0.52 + Math.sin(t * 0.22) * 0.22 + brk * 0.9;
      pitch = 0.2 + Math.sin(t * 0.17) * 0.04;
    }
    ctx.clearRect(0, 0, W, H);
    const solid = 1 - smooth(0.05, 0.5, brk);

    if (solid > 0.01) {
      ctx.globalAlpha = solid;
      // rack shell: back, floor and roof
      const R = RACK;
      const shell = box(R.x0, R.x1, R.y0, R.y1, R.z0, R.z1);
      poly([proj(R.x0, R.y0, R.z0), proj(R.x1, R.y0, R.z0), proj(R.x1, R.y1, R.z0), proj(R.x0, R.y1, R.z0)], C.bg, C.ln);
      ['left', 'right'].forEach((k) => { if (!visible(shell[k])) poly(shell[k], C.sf, C.ln); });
      poly(shell.bottom, C.sf, C.ln);
      // rails
      [[X0 - 0.06, X0], [X1, X1 + 0.06]].forEach(([a, b]) =>
        poly([proj(a, R.y0, ZF + 0.02), proj(b, R.y0, ZF + 0.02), proj(b, R.y1, ZF + 0.02), proj(a, R.y1, ZF + 0.02)], C.ln, null));

      // units, bottom to top, the highlighted one last
      const order = UNITS.slice().sort((a, b) => (a.step === active) - (b.step === active) || a.u - b.u);
      UNITS.forEach((m) => { m.slide += ((m.step === active ? 0.42 : 0) - m.slide) * (reduce.matches ? 1 : 0.12); });
      order.forEach((m) => {
        const z1 = ZF + m.slide, z0 = ZB + m.slide;
        const b = box(X0, X1, m.y0, m.y1, z0, z1);
        const on = m.step === active && m.slide > 0.05;
        if (visible(b.top)) poly(b.top, C.ln, C.ln2, 0.8);
        if (visible(b.left)) poly(b.left, C.sf, C.ln2, 0.8);
        if (visible(b.right)) poly(b.right, C.sf, C.ln2, 0.8);
        poly(b.front, m.kind === 'blank' ? C.sf : C.sf2, on ? C.cy : C.ln2, on ? 2 : 0.8);
        details(m, z1 + 0.001, t, solid);
        if (on) poly(b.front, null, C.cy, 1.2);
      });

      // shell top and near posts over the units
      if (visible(shell.top)) poly(shell.top, C.sf2, C.ln2);
      ctx.strokeStyle = C.ln2; ctx.lineWidth = 1.4;
      [[R.x0, R.z1], [R.x1, R.z1]].forEach(([x, z]) => {
        const a = proj(x, R.y0, z), b = proj(x, R.y1, z);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      });

      // traffic: packets running down the cable bundle on the right
      if (!reduce.matches) {
        const sw = UNITS[3], path = [UNITS[0], sw, UNITS[4], UNITS[7], UNITS[9]];
        ctx.fillStyle = C.cy;
        for (let k = 0; k < 7; k++) {
          const p = ((t * 0.35 + k / 7) % 1) * (path.length - 1);
          const i = Math.floor(p), f = p - i;
          const y = (path[i].y0 + path[i].y1) / 2 * (1 - f) + (path[i + 1].y0 + path[i + 1].y1) / 2 * f;
          const q = proj(X1 + 0.03, y, ZF + 0.06);
          ctx.beginPath(); ctx.arc(q[0], q[1], 2.4, 0, 7); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    // binary break-up
    if (brk > 0.01) {
      const show = smooth(0.02, 0.15, brk) * Math.pow(1 - smooth(0.45, 1, brk), 1.1);
      if (show > 0.01) {
        const e = Math.pow(brk, 1.5);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let lastFont = '';
        for (const p of parts) {
          const s = p.sp * e;
          const q = proj(p.x + p.dx * s, p.y + p.dy * s * 0.7 + (p.m ? p.m.slide * 0 : 0), p.z + p.dz * s);
          if (q[2] < 1) continue;
          const size = Math.max(6, Math.round((F / q[2]) * 0.085 * p.s));
          const font = size + 'px "IBM Plex Mono", ui-monospace, monospace';
          if (font !== lastFont) { ctx.font = font; lastFont = font; }
          ctx.globalAlpha = Math.min(1, show * (0.6 + 0.5 * p.s / 1.3));
          ctx.fillStyle = p.hue < 0.55 ? C.cy : (p.hue < 0.85 ? C.acc : C.ink);
          ctx.fillText(p.g, q[0], q[1]);
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  let raf = 0;
  const loop = (now) => { frame(now); raf = onScreen && !reduce.matches ? requestAnimationFrame(loop) : 0; };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  resize();
  readScroll();
  frame(performance.now());
  addEventListener('resize', () => { resize(); readScroll(); frame(performance.now()); }, { passive: true });
  addEventListener('scroll', () => { readScroll(); if (reduce.matches) frame(performance.now()); }, { passive: true });
  addEventListener('themechange', () => { readColors(); frame(performance.now()); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; if (onScreen && !reduce.matches) kick(); }, { rootMargin: '100px' }).observe(story);
  } else { onScreen = true; kick(); }
  reduce.addEventListener?.('change', () => { frame(performance.now()); kick(); });
})();
