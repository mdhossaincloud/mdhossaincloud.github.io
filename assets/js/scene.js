/* ==========================================================================
   3D infrastructure scene — dependency-free.
   A small 3D world (cloud, three office sites, devices, links) is rotated and
   perspective-projected in JavaScript, then drawn with Canvas 2D. This gives
   real depth, parallax and hit-testing without shipping a WebGL library.
   ========================================================================== */
(() => {
  'use strict';
  const canvas = document.getElementById('scene');
  const frame = document.getElementById('scene-frame');
  if (!canvas || !frame) return;
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) { frame.classList.add('no-scene'); return; }

  const tip = document.getElementById('scene-tip');
  const chips = [...document.querySelectorAll('.scene-legend .chip')];
  const rmq = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = rmq.matches;

  /* ---------- Device catalogue ---------- */
  const TYPES = {
    cloud:  { cat: 'servers',   name: 'Cloud services',         role: 'Microsoft 365 and other SaaS: email, identity and files, reached over the internet.' },
    isp:    { cat: 'routing',   name: 'Internet / ISP',          role: 'Public network that links every office. Link health and ISP escalation live here.' },
    fw:     { cat: 'routing',   name: 'Edge firewall & router',  role: 'Filters traffic, performs NAT and terminates the site-to-site VPN tunnels.' },
    rt:     { cat: 'routing',   name: 'Branch router',           role: 'MikroTik-class edge router: internet breakout, routing and the VPN tunnel back to head office.' },
    sw:     { cat: 'switching', name: 'Core / access switch',    role: 'Connects wired devices and keeps traffic separated into VLANs.' },
    srv:    { cat: 'servers',   name: 'Server',                  role: 'On-premises services such as file shares, directory or management tools.' },
    ap:     { cat: 'wireless',  name: 'Wi-Fi access point',      role: 'Wireless coverage. Channel planning and authentication decide how reliable it feels.' },
    pc:     { cat: 'endpoints', name: 'Workstation',             role: 'Where most support work ends: set-up, access, updates and troubleshooting.' },
    cam:    { cat: 'cctv',      name: 'IP camera',               role: 'Powered over Ethernet (PoE), streaming video to the NVR on its own VLAN.' },
    nvr:    { cat: 'cctv',      name: 'NVR',                     role: 'Network video recorder: records the cameras and keeps footage for the retention period.' },
  };

  /* ---------- Translations (window.I18N is set on non-English pages) ---------- */
  const L = window.I18N || {};
  if (L.types) Object.keys(L.types).forEach((k) => { if (TYPES[k]) { TYPES[k].name = L.types[k][0]; TYPES[k].role = L.types[k][1]; } });

  /* ---------- World model ---------- */
  const nodes = [];
  const edges = [];
  const add = (type, x, y, z, site) => { const n = { type, x, y, z, site, p: null }; nodes.push(n); return n; };
  const link = (a, b, kind) => edges.push({ a, b, kind });

  const SITES = [
    { name: 'Head office', a: -Math.PI / 2, hq: true },
    { name: 'Branch office A', a: Math.PI / 6 },
    { name: 'Branch office B', a: (5 * Math.PI) / 6 },
  ];
  if (L.sites) SITES.forEach((st, i) => { if (L.sites[i]) st.name = L.sites[i]; });
  const R = 2.25;
  const cloud = add('cloud', 0, 2.05, 0, 'Internet');
  const isp = add('isp', 0, 1.05, 0, 'Internet');
  link(cloud, isp, 'wan');

  const platforms = [];
  const edgeRouters = [];

  SITES.forEach((s) => {
    const cx = Math.cos(s.a) * R;
    const cz = Math.sin(s.a) * R;
    // local frame: u = tangent, v = radial (pointing away from centre)
    const vx = Math.cos(s.a), vz = Math.sin(s.a);
    const ux = -vz, uz = vx;
    const P = (lu, ly, lv) => [cx + ux * lu + vx * lv, ly, cz + uz * lu + vz * lv];
    platforms.push({ s, corners: [P(-.8, 0, -.8), P(.8, 0, -.8), P(.8, 0, .8), P(-.8, 0, .8)], label: P(0, 0, 1.18) });

    const edge = add(s.hq ? 'fw' : 'rt', ...P(0, .22, -.5), s.name);
    const sw = add('sw', ...P(0, .12, .05), s.name);
    const ap = add('ap', ...P(-.52, .3, -.1), s.name);
    const pc1 = add('pc', ...P(-.38, .08, .55), s.name);
    const pc2 = add('pc', ...P(.12, .08, .6), s.name);
    const nvr = add('nvr', ...P(.55, .08, -.18), s.name);
    const cam1 = add('cam', ...P(.62, .42, .35), s.name);
    link(isp, edge, 'wan');
    link(edge, sw, 'lan');
    link(sw, ap, 'lan');
    link(sw, pc1, 'lan');
    link(sw, pc2, 'lan');
    link(sw, nvr, 'cctv');
    link(sw, cam1, 'cctv');
    if (s.hq) {
      const srv = add('srv', ...P(.5, .2, .55), s.name);
      const cam2 = add('cam', ...P(-.65, .42, .45), s.name);
      link(sw, srv, 'lan');
      link(sw, cam2, 'cctv');
    }
    edgeRouters.push(edge);
  });
  // site-to-site VPN tunnels (hub and spoke to head office)
  link(edgeRouters[0], edgeRouters[1], 'vpn');
  link(edgeRouters[0], edgeRouters[2], 'vpn');

  /* ---------- Colours from CSS tokens ---------- */
  let C = {};
  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    C = {
      ink: v('--ink'), mu: v('--mu'), ln: v('--ln'), ln2: v('--ln-2'), sf: v('--sf'), sf2: v('--sf-2'),
      acc: v('--acc'), cy: v('--cy'), ok: v('--ok'), warn: v('--warn'), bg: v('--bg'),
      cat: { routing: v('--acc'), switching: '#8b9cff', wireless: v('--cy'), servers: v('--ok'), cctv: v('--warn'), endpoints: '#c792ea' },
    };
  };
  readColors();

  /* ---------- Camera & projection ---------- */
  let W = 0, H = 0, dpr = 1, F = 1;
  const cam = { yaw: -0.35, pitch: 0.66, dist: 13, tyaw: 0, tpitch: 0, oyaw: 0, opitch: 0 };
  let scrollPitch = 0;

  function project(x, y, z) {
    const cy = Math.cos(cam.yaw + cam.oyaw), sy = Math.sin(cam.yaw + cam.oyaw);
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;
    const p = cam.pitch + cam.opitch + scrollPitch;
    const cp = Math.cos(p), sp = Math.sin(p);
    const y2 = (y - 0.55) * cp + z1 * sp;
    const z2 = -(y - 0.55) * sp + z1 * cp;
    const s = F / (cam.dist + z2);
    return { x: W / 2 + x1 * s, y: H * 0.37 - y2 * s, s, z: z2 };
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    F = Math.min(W * 2.12, H * 2.5);
    draw();
  }

  /* ---------- Interaction state ---------- */
  let hover = null;
  let focusCat = null;
  const isDim = (cat) => focusCat && cat !== focusCat;
  const edgeCat = (e) => e.kind === 'vpn' || e.kind === 'wan' ? 'routing' : e.kind === 'cctv' ? 'cctv' : 'switching';

  /* ---------- Packets (data in motion) ---------- */
  const packets = [];
  function spawnPacket() {
    const e = edges[(Math.random() * edges.length) | 0];
    packets.push({ e, t: 0, dir: Math.random() < .5 ? 1 : -1, v: e.kind === 'vpn' ? 0.007 : 0.011 });
  }

  function pointOnEdge(e, t) {
    const a = e.a, b = e.b;
    if (e.kind === 'vpn') {
      // quadratic arc lifted above the ground plane
      const mx = (a.x + b.x) / 2 * 0.55, mz = (a.z + b.z) / 2 * 0.55, my = 0.95;
      const u = 1 - t;
      return [u * u * a.x + 2 * u * t * mx + t * t * b.x, u * u * a.y + 2 * u * t * my + t * t * b.y, u * u * a.z + 2 * u * t * mz + t * t * b.z];
    }
    return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t];
  }

  /* ---------- Glyphs ---------- */
  function glyph(n, p, alpha, hot) {
    const t = TYPES[n.type];
    const col = C.cat[t.cat];
    const k = Math.max(0.55, Math.min(1.4, p.s / 58));
    ctx.globalAlpha = alpha;
    ctx.lineWidth = hot ? 2.2 : 1.4;
    ctx.strokeStyle = col;
    ctx.fillStyle = hot ? col : C.sf2;
    const x = p.x, y = p.y;
    ctx.beginPath();
    switch (n.type) {
      case 'cloud': {
        const r = 15 * k;
        ctx.moveTo(x - r * 1.6, y + r * .55);
        ctx.arc(x - r * .9, y + r * .05, r * .6, Math.PI * .6, Math.PI * 1.55);
        ctx.arc(x, y - r * .25, r * .85, Math.PI * 1.1, Math.PI * 1.95);
        ctx.arc(x + r * .95, y + r * .1, r * .62, Math.PI * 1.45, Math.PI * .45);
        ctx.closePath();
        break;
      }
      case 'isp': ctx.arc(x, y, 9 * k, 0, Math.PI * 2); break;
      case 'fw': ctx.roundRect ? ctx.roundRect(x - 13 * k, y - 8 * k, 26 * k, 16 * k, 3 * k) : ctx.rect(x - 13 * k, y - 8 * k, 26 * k, 16 * k); break;
      case 'rt': ctx.arc(x, y, 10 * k, 0, Math.PI * 2); break;
      case 'sw': ctx.rect(x - 15 * k, y - 5 * k, 30 * k, 10 * k); break;
      case 'srv': ctx.rect(x - 7 * k, y - 13 * k, 14 * k, 26 * k); break;
      case 'ap': ctx.arc(x, y, 6 * k, 0, Math.PI * 2); break;
      case 'pc': ctx.rect(x - 9 * k, y - 6 * k, 18 * k, 12 * k); break;
      case 'cam': ctx.moveTo(x - 9 * k, y - 5 * k); ctx.lineTo(x + 9 * k, y); ctx.lineTo(x - 9 * k, y + 5 * k); ctx.closePath(); break;
      case 'nvr': ctx.rect(x - 12 * k, y - 4.5 * k, 24 * k, 9 * k); break;
    }
    ctx.fill(); ctx.stroke();
    // inner details
    ctx.strokeStyle = hot ? C.bg : col;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (n.type === 'rt' || n.type === 'isp') { ctx.moveTo(x - 5 * k, y); ctx.lineTo(x + 5 * k, y); ctx.moveTo(x, y - 5 * k); ctx.lineTo(x, y + 5 * k); }
    if (n.type === 'fw') { ctx.moveTo(x - 13 * k, y); ctx.lineTo(x + 13 * k, y); ctx.moveTo(x - 4 * k, y - 8 * k); ctx.lineTo(x - 4 * k, y); ctx.moveTo(x + 5 * k, y); ctx.lineTo(x + 5 * k, y + 8 * k); }
    if (n.type === 'sw') { for (let i = -2; i <= 2; i++) { ctx.moveTo(x + i * 5 * k, y - 1.5 * k); ctx.lineTo(x + i * 5 * k, y + 1.5 * k); } }
    if (n.type === 'srv') { ctx.moveTo(x - 4 * k, y - 6 * k); ctx.lineTo(x + 4 * k, y - 6 * k); ctx.moveTo(x - 4 * k, y); ctx.lineTo(x + 4 * k, y); }
    if (n.type === 'ap') { ctx.arc(x, y, 11 * k, Math.PI * 1.2, Math.PI * 1.8); ctx.moveTo(x + 15 * k * Math.cos(Math.PI * 1.2), y + 15 * k * Math.sin(Math.PI * 1.2)); ctx.arc(x, y, 15 * k, Math.PI * 1.2, Math.PI * 1.8); }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* ---------- Frame ---------- */
  function draw() {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    nodes.forEach((n) => { n.p = project(n.x, n.y, n.z); });

    // platforms (far first)
    const plats = platforms.map((pl) => {
      const pts = pl.corners.map((c) => project(c[0], c[1], c[2]));
      return { pl, pts, z: pts.reduce((a, b) => a + b.z, 0) / 4 };
    }).sort((a, b) => b.z - a.z);
    plats.forEach(({ pl, pts }) => {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = C.sf;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C.ln2;
      ctx.lineWidth = 1;
      ctx.stroke();
      // inner grid lines for a floor-plan feel
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const t = i / 4;
        const a = lerp2(pts[0], pts[1], t), b = lerp2(pts[3], pts[2], t);
        const c = lerp2(pts[0], pts[3], t), d = lerp2(pts[1], pts[2], t);
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // edges
    edges.forEach((e) => {
      const cat = edgeCat(e);
      const dim = isDim(cat);
      const hot = hover && (e.a === hover || e.b === hover);
      ctx.globalAlpha = dim ? 0.12 : hot ? 1 : e.kind === 'vpn' ? 0.85 : 0.55;
      ctx.strokeStyle = e.kind === 'vpn' ? C.acc : hot ? C.cy : e.kind === 'cctv' ? C.warn : C.ln2;
      ctx.lineWidth = e.kind === 'vpn' ? 1.8 : hot ? 1.8 : 1.1;
      ctx.setLineDash(e.kind === 'wan' ? [4, 5] : []);
      ctx.beginPath();
      if (e.kind === 'vpn') {
        for (let i = 0; i <= 28; i++) {
          const q = project(...pointOnEdge(e, i / 28));
          i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
        }
      } else {
        ctx.moveTo(e.a.p.x, e.a.p.y); ctx.lineTo(e.b.p.x, e.b.p.y);
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // VPN label at the midpoint of the first tunnel
    const vpn = edges.find((e) => e.kind === 'vpn');
    if (vpn && !isDim('routing')) {
      const m = project(...pointOnEdge(vpn, 0.5));
      ctx.fillStyle = C.acc;
      ctx.font = '400 11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(L.vpn || 'site-to-site VPN', m.x, m.y - 8);
    }

    // packets
    packets.forEach((pk) => {
      const t = pk.dir > 0 ? pk.t : 1 - pk.t;
      const q = project(...pointOnEdge(pk.e, t));
      const dim = isDim(edgeCat(pk.e));
      ctx.globalAlpha = dim ? 0.15 : 0.95;
      ctx.fillStyle = pk.e.kind === 'vpn' ? C.acc : C.cy;
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(1.6, q.s / 38), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // devices, far to near
    [...nodes].sort((a, b) => b.p.z - a.p.z).forEach((n) => {
      const cat = TYPES[n.type].cat;
      const depthFade = Math.max(0.55, Math.min(1, 1.25 - (n.p.z + 3) / 10));
      glyph(n, n.p, isDim(cat) ? 0.18 : depthFade, n === hover || (focusCat === cat));
    });

    // site labels on top, with a halo so they stay readable over devices
    ctx.font = '500 12px "IBM Plex Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Hind Siliguri", "Nirmala UI", "Noto Sans Bengali", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    platforms.forEach((pl) => {
      const lp = project(...pl.label);
      const x = Math.min(W - 50, Math.max(50, lp.x));
      ctx.lineWidth = 4; ctx.strokeStyle = C.bg; ctx.strokeText(pl.s.name, x, lp.y + 4);
      ctx.fillStyle = C.mu; ctx.fillText(pl.s.name, x, lp.y + 4);
    });
  }

  function lerp2(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }

  /* ---------- Animation loop ---------- */
  let running = false, visible = true, last = 0, raf = 0;
  function tick(ts) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(48, ts - (last || ts));
    last = ts;
    cam.yaw += dt * 0.00009;
    cam.oyaw += (cam.tyaw - cam.oyaw) * 0.06;
    cam.opitch += (cam.tpitch - cam.opitch) * 0.06;
    if (Math.random() < 0.06 && packets.length < 14) spawnPacket();
    for (let i = packets.length - 1; i >= 0; i--) {
      packets[i].t += packets[i].v * dt / 16;
      if (packets[i].t >= 1) packets.splice(i, 1);
    }
    draw();
    raf = requestAnimationFrame(tick);
  }
  function start() {
    if (reduce || running || !visible || document.hidden) return;
    running = true; last = 0;
    raf = requestAnimationFrame(tick);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  /* ---------- Pointer: parallax + hit testing ---------- */
  function pick(mx, my) {
    let best = null, bd = 22 * 22;
    nodes.forEach((n) => {
      if (!n.p) return;
      const dx = n.p.x - mx, dy = n.p.y - my, dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = n; }
    });
    return best;
  }
  function showTip(n) {
    if (!tip) return;
    if (!n) { tip.classList.remove('show'); return; }
    const t = TYPES[n.type];
    tip.innerHTML = '';
    const b = document.createElement('b'); b.textContent = t.name;
    const s = document.createElement('span'); s.textContent = (n.site && n.site !== 'Internet' ? n.site + '. ' : '') + t.role;
    tip.append(b, s);
    const tw = 250;
    let x = n.p.x + 16, y = n.p.y + 12;
    if (x + tw > W) x = Math.max(4, n.p.x - tw - 16);
    if (y + 90 > H) y = Math.max(4, n.p.y - 96);
    tip.style.transform = `translate(${x}px, ${y}px)`;
    tip.classList.add('show');
  }
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    if (!reduce && e.pointerType === 'mouse') {
      cam.tyaw = ((mx / W) - 0.5) * 0.5;
      cam.tpitch = ((my / H) - 0.5) * -0.18;
    }
    const n = pick(mx, my);
    if (n !== hover) {
      hover = n;
      canvas.style.cursor = n ? 'pointer' : 'default';
      showTip(n);
      if (!running) draw();
    }
  });
  canvas.addEventListener('pointerleave', () => {
    hover = null; cam.tyaw = 0; cam.tpitch = 0; showTip(null);
    if (!running) draw();
  });
  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const r = canvas.getBoundingClientRect();
    const n = pick(e.clientX - r.left, e.clientY - r.top);
    hover = n; showTip(n);
    if (!running) draw();
  });

  /* ---------- Legend chips (keyboard-accessible highlighting) ---------- */
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const cat = chip.dataset.cat;
      focusCat = focusCat === cat ? null : cat;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat === focusCat)));
      if (!running) draw();
    });
  });

  /* ---------- Scroll-linked tilt ---------- */
  const hero = canvas.closest('.hero');
  addEventListener('scroll', () => {
    if (!hero || reduce) return;
    const r = hero.getBoundingClientRect();
    const prog = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    scrollPitch = prog * 0.38;
    if (!running && visible) draw();
  }, { passive: true });

  /* ---------- Lifecycle ---------- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => {
      visible = en[0].isIntersecting;
      visible ? start() : stop();
    }, { rootMargin: '80px' }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  rmq.addEventListener?.('change', (m) => {
    reduce = m.matches;
    if (reduce) { stop(); packets.length = 0; cam.oyaw = cam.opitch = scrollPitch = 0; draw(); } else start();
  });
  window.addEventListener('themechange', () => { readColors(); draw(); });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(frame);
  else addEventListener('resize', resize);

  if (document.fonts?.ready) document.fonts.ready.then(() => draw());
  resize();
  start();
})();
