/* Portrait that assembles from fragments as it scrolls into view and breaks
   apart again as it leaves. Plain <img> is the fallback (no JS, reduced motion). */
(() => {
  'use strict';
  const box = document.getElementById('portrait');
  if (!box) return;
  const img = box.querySelector('img');
  const canvas = box.querySelector('canvas');
  const ctx = canvas?.getContext && canvas.getContext('2d');
  const rmq = matchMedia('(prefers-reduced-motion: reduce)');
  if (!img || !ctx || rmq.matches) return;

  const COLS = 7, ROWS = 9;
  let tiles = [], W = 0, H = 0, dpr = 1, ready = false, raf = 0, last = -1;

  // deterministic pseudo-random so the shatter looks the same on every visit
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function build() {
    tiles = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = (c + 0.5) / COLS - 0.5, cy = (r + 0.5) / ROWS - 0.5;
        tiles.push({
          c, r,
          dx: (cx * 1.6 + (rnd() - 0.5) * 0.9),
          dy: (cy * 1.4 + (rnd() - 0.5) * 0.8),
          rot: (rnd() - 0.5) * 1.4,
          delay: rnd() * 0.35 + Math.hypot(cx, cy) * 0.25,
        });
      }
    }
  }

  function size() {
    const r = box.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    last = -1;
    frame();
  }

  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const clamp = (v) => Math.max(0, Math.min(1, v));

  function progress() {
    const r = box.getBoundingClientRect();
    const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // 0 = centred
    return clamp(1 - (Math.abs(c) - 0.1) / 0.75);
  }

  function draw(p) {
    ctx.clearRect(0, 0, W, H);
    const iw = img.naturalWidth, ih = img.naturalHeight;
    if (p >= 0.999) { ctx.drawImage(img, 0, 0, W, H); return; }
    const tw = W / COLS, th = H / ROWS, sw = iw / COLS, sh = ih / ROWS;
    tiles.forEach((t) => {
      const local = ease(clamp((p - t.delay * (1 - p)) / (1 - t.delay * 0.5)));
      const k = 1 - local;
      if (local <= 0.001) return;
      ctx.save();
      ctx.globalAlpha = local;
      ctx.translate(t.c * tw + tw / 2 + t.dx * W * k, t.r * th + th / 2 + t.dy * H * k);
      ctx.rotate(t.rot * k);
      ctx.scale(1 - 0.35 * k, 1 - 0.35 * k);
      ctx.drawImage(img, t.c * sw, t.r * sh, sw + 0.5, sh + 0.5, -tw / 2, -th / 2, tw + 0.6, th + 0.6);
      ctx.restore();
    });
  }

  function frame() {
    raf = 0;
    if (!ready) return;
    const p = Math.round(progress() * 400) / 400;
    if (p !== last) { last = p; draw(p); }
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(frame); };

  function start() {
    build();
    box.classList.add('assembling');
    ready = true;
    size();
    addEventListener('scroll', request, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(box);
    else addEventListener('resize', size);
    rmq.addEventListener?.('change', (m) => {
      if (m.matches) { ready = false; box.classList.remove('assembling'); }
    });
  }

  if (img.complete && img.naturalWidth) start();
  else img.addEventListener('load', start, { once: true });
})();
