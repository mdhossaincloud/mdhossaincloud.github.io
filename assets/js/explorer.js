/* Device Explorer (v4.5): isometric exploded views of real network devices.
   Drag the bar to pull a device apart, hover or tap a part to learn what it does.
   Also powers the three small hero objects that explode and vanish on scroll.
   Dependency-free SVG. Generic educational models; no real configuration is shown. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const L = Object.assign({
    exTabs: 'Choose a device', exAssembled: 'Assembled', exExploded: 'Exploded', exBar: 'Drag to explode the device',
    exHint: 'Drag the bar to pull the device apart, then hover or tap a part to see what it does.',
    exWhat: 'What it does', exCheck: 'What I check', exParts: 'Parts'
  }, window.I18N || {});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const C = 0.866, H = 0.5;                       /* isometric constants */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  /* part: id, name, size [w,d,h], assembled position [x,y,z], explode offset [dx,dy,dz], colour, what, check */
  const DEVICES = {
    router: { name: 'Router', short: 'MikroTik-class', parts: [
      { id: 'base', n: 'Chassis and base plate', b: [8, 5, .6], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191',
        w: 'The case holds every board in place and carries heat away. Many routers rely on the metal body as a passive heat sink.',
        k: 'Ventilation and mounting. In a hot cabinet, temperature is the first thing I look at before blaming the router.' },
      { id: 'psu', n: 'Power input and regulators', b: [2.6, 1.8, .5], p: [.5, .5, .6], e: [-1.2, 1.8, 1.6], c: '#c9862e',
        w: 'Turns the supply (DC adapter or PoE-in) into the several stable voltages the CPU, memory and ports need.',
        k: 'Input voltage and adapter. A failing supply shows up as random reboots and “power failure” entries in the log.' },
      { id: 'pcb', n: 'Mainboard (PCB)', b: [7.2, 4.2, .25], p: [.4, .4, 1.1], e: [0, 0, 3.0], c: '#2f8f6b',
        w: 'The green board that every chip plugs into. Copper traces carry data between CPU, memory, switch chip and ports.',
        k: 'Rarely touched on site: board faults usually mean replacement, so I keep a tested config backup ready.' },
      { id: 'cpu', n: 'CPU and heat sink', b: [2.2, 2.2, .7], p: [3.2, 1.2, 1.35], e: [0, 0, 5.0], c: '#4d8dff',
        w: 'Runs the operating system and does the thinking: routing, NAT, firewall rules and VPN encryption.',
        k: 'CPU load. On RouterOS: /system resource print. High load often comes from firewall rules that skip the fast path.' },
      { id: 'ram', n: 'RAM and flash storage', b: [1.5, 1.1, .4], p: [5.9, 1.0, 1.35], e: [1.2, -.4, 4.2], c: '#8b9cff',
        w: 'RAM holds the live connection table and routes. Flash stores the firmware and the saved configuration.',
        k: 'Free memory and a recent configuration export. Flash survives power loss; RAM does not.' },
      { id: 'sw', n: 'Switch chip', b: [1.5, 1.5, .45], p: [1.0, 2.4, 1.35], e: [-1.2, 0, 4.2], c: '#3dd6e6',
        w: 'Moves frames between the LAN ports in hardware, so ordinary local traffic never burdens the CPU.',
        k: 'VLAN and bridge settings. If hardware offload is off, local traffic falls back to the CPU and slows down.' },
      { id: 'eth', n: 'Ethernet ports and magnetics', b: [5.6, 1.1, 1.0], p: [1.0, 3.6, 1.35], e: [0, 1.6, 6.6], c: '#9aa8c2',
        w: 'RJ45 sockets with isolation transformers. They negotiate speed and duplex with whatever is plugged in.',
        k: 'Link lights, cable test and negotiated speed. A link stuck at 100 Mbps usually means a bad cable or crimp.' },
      { id: 'cover', n: 'Top cover and status LEDs', b: [8, 5, .6], p: [0, 0, 2.4], e: [0, 0, 9.6], c: '#6c7e9f',
        w: 'Closes the box and shows power, link and activity on LEDs, the quickest health check there is.',
        k: 'LED pattern first, before any login. Steady link, blinking activity, no amber warning.' }
    ] },
    switch: { name: 'Managed PoE switch', short: 'LAN core', parts: [
      { id: 'base', n: 'Rack chassis', b: [10, 4.4, .5], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191',
        w: 'A 19-inch metal case that bolts into the rack and channels airflow from front to back.',
        k: 'Rack screws, clear vents and cable strain relief. Blocked airflow shortens a switch’s life.' },
      { id: 'psu', n: 'Power supply and PoE budget', b: [2.6, 2.0, .9], p: [.4, .4, .5], e: [-1.4, 1.6, 1.5], c: '#c9862e',
        w: 'Converts mains power for the electronics and supplies the PoE budget shared by all powered ports (cameras, phones, access points).',
        k: 'PoE budget. Adding one more camera than the budget allows makes ports drop or stay dark.' },
      { id: 'pcb', n: 'Mainboard (PCB)', b: [9.4, 3.8, .25], p: [.3, .3, 1.4], e: [0, 0, 3.0], c: '#2f8f6b',
        w: 'Connects the switching chip, management CPU, memory and every port circuit.',
        k: 'Board faults are replacement jobs; the configuration backup is what saves the time.' },
      { id: 'asic', n: 'Switching ASIC and heat sink', b: [2.2, 2.2, .7], p: [3.4, .9, 1.65], e: [0, 0, 5.0], c: '#4d8dff',
        w: 'Forwards frames at wire speed and keeps the MAC address table, the list of which device sits behind which port.',
        k: 'The MAC table when a device “disappears”: show it, find the port, then check cable and VLAN.' },
      { id: 'cpu', n: 'Management CPU and flash', b: [1.7, 1.7, .5], p: [6.2, 1.2, 1.65], e: [.8, 0, 4.2], c: '#8b9cff',
        w: 'A small processor that runs the web and command-line interface, VLAN and spanning-tree logic. It does not forward traffic.',
        k: 'Config backup and firmware version. A busy management CPU slows the admin page, not the network.' },
      { id: 'sfp', n: 'SFP+ uplink cages', b: [2.2, 1.2, .8], p: [7.2, 2.6, 1.65], e: [1.2, 1.2, 6.2], c: '#3dd6e6',
        w: 'Slots for fibre or direct-attach modules, used for fast uplinks between switches or to the router.',
        k: 'Module type and light levels. Mixed or unsupported modules are a common cause of “no link”.' },
      { id: 'ports', n: 'RJ45 PoE ports', b: [6.4, 1.1, 1.0], p: [.7, 3.0, 1.65], e: [0, 1.6, 6.6], c: '#9aa8c2',
        w: 'Copper ports that carry data and, on PoE ports, electrical power for powered devices over the same cable.',
        k: 'Port status, speed, PoE draw and errors. Rising CRC errors point to a bad cable.' },
      { id: 'cover', n: 'Top cover and vents', b: [10, 4.4, .5], p: [0, 0, 2.7], e: [0, 0, 9.4], c: '#6c7e9f',
        w: 'Protects the board and shapes the airflow; the front panel LEDs mirror port state.',
        k: 'Amber LEDs on a port, or a whole row dark, tell me where to start before opening the web page.' }
    ] },
    ap: { name: 'Wi-Fi access point', short: 'Wireless', parts: [
      { id: 'mount', n: 'Mounting plate', b: [6, 6, .4], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191',
        w: 'Fixes the unit to a ceiling or wall and sets its height, which matters as much as its settings for coverage.',
        k: 'Mount high and central, clear of metal. Coverage problems are often placement problems.' },
      { id: 'pd', n: 'PoE input and power regulation', b: [2.2, 1.8, .5], p: [.6, 3.6, .4], e: [-1.2, 1.2, 1.4], c: '#c9862e',
        w: 'Receives power and data over one network cable and converts it for the radios and processor.',
        k: 'The switch port’s PoE class and cable length. Weak PoE makes radios downshift or reboot.' },
      { id: 'pcb', n: 'Mainboard (PCB)', b: [5.2, 5.2, .22], p: [.4, .4, .85], e: [0, 0, 2.6], c: '#2f8f6b',
        w: 'Carries the processor, radios and the wired Ethernet connection.',
        k: 'Firmware version and uptime; frequent reboots usually trace back to power or firmware.' },
      { id: 'soc', n: 'SoC (controller CPU)', b: [1.8, 1.8, .6], p: [1.0, 1.2, 1.07], e: [-.8, 0, 4.4], c: '#4d8dff',
        w: 'Runs the access point software: client association, roaming, VLAN tagging and security.',
        k: 'Connected-client count. Too many clients on one AP is a capacity problem, not a signal problem.' },
      { id: 'radio', n: 'Wi-Fi radios (2.4 and 5 GHz)', b: [2.2, 1.4, .4], p: [3.0, 1.6, 1.07], e: [1.2, 0, 4.4], c: '#3dd6e6',
        w: 'Two radios: 2.4 GHz reaches further through walls, 5 GHz is faster over shorter range.',
        k: 'Channel and signal level. Neighbouring networks on the same channel are the usual cause of slow Wi-Fi.' },
      { id: 'ant', n: 'Antenna array', b: [4, .5, 1.1], p: [1.0, 4.5, 1.07], e: [0, 1.2, 6.4], c: '#8b9cff',
        w: 'Printed or internal antennas that shape where the signal goes; a ceiling unit radiates downward.',
        k: 'Orientation and obstructions. Do not hide it above a metal ceiling tile or inside a cabinet.' },
      { id: 'dome', n: 'Cover and status LED', b: [6, 6, .5], p: [0, 0, 2.3], e: [0, 0, 9.0], c: '#6c7e9f',
        w: 'The plastic cover is transparent to radio waves; the LED shows boot, ready and fault states.',
        k: 'The LED state, then the controller’s view of the device.' }
    ] },
    camera: { name: 'IP camera (dome)', short: 'CCTV', parts: [
      { id: 'base', n: 'Mount base and cable entry', b: [5, 5, .5], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191',
        w: 'Attaches to the ceiling or wall and holds the network cable. A weather seal keeps moisture out.',
        k: 'Seal and cable gland. Water in the housing kills more outdoor cameras than anything else.' },
      { id: 'pcb', n: 'Main board (SoC and memory)', b: [4.2, 4.2, .25], p: [.4, .4, .5], e: [0, 0, 1.8], c: '#2f8f6b',
        w: 'The processor compresses video (H.264 / H.265), runs the web server and speaks the network protocols.',
        k: 'Stream settings. Bitrate and frame rate decide both picture quality and how much storage you need.' },
      { id: 'sd', n: 'microSD slot', b: [1.0, 1.3, .2], p: [3.2, .6, .75], e: [1.2, -.8, 3.0], c: '#c9862e',
        w: 'Optional local recording, a safety net when the network to the recorder drops.',
        k: 'Card health and write endurance. Use cards rated for continuous recording.' },
      { id: 'sensor', n: 'Image sensor board', b: [2.2, 2.2, .3], p: [1.4, 1.4, .75], e: [0, 0, 3.8], c: '#4d8dff',
        w: 'Turns light into a digital image. A bigger sensor gathers more light, which helps at night.',
        k: 'Image quality at night and against bright windows (wide dynamic range).' },
      { id: 'lens', n: 'Lens assembly', b: [1.6, 1.6, 1.4], p: [1.7, 1.7, 1.05], e: [0, 0, 5.8], c: '#3dd6e6',
        w: 'Focuses the scene on the sensor. Focal length sets the field of view: short is wide, long is zoomed in.',
        k: 'Focus and field of view at install time. A dirty or fogged lens looks like a camera fault.' },
      { id: 'ir', n: 'Infrared LEDs', b: [.8, 3.4, .3], p: [.3, .8, 1.05], e: [-1.6, 0, 4.8], c: '#e0556b',
        w: 'Invisible light that lets the camera see in the dark. Black-and-white night mode is switched on by a light sensor.',
        k: 'Reflection from nearby walls or the dome glare. Mount away from surfaces that bounce IR back.' },
      { id: 'dome', n: 'Dome cover', b: [5, 5, .6], p: [0, 0, 2.5], e: [0, 0, 8.2], c: '#6c7e9f',
        w: 'A clear, impact-resistant dome that protects the lens and hides which way the camera points.',
        k: 'Scratches and condensation. Clean it as part of preventive maintenance.' }
    ] }
  };

  /* ---------- geometry ---------- */
  const proj = (x, y, z) => [(x - y) * C, (x + y) * H - z];
  const hexRGB = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const shade = (hex, f) => {
    const [r, g, b] = hexRGB(hex);
    const m = (v) => Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1));
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  };
  const pts = (a, s, ox, oy) => a.map(([x, y]) => (x * s + ox).toFixed(1) + ',' + (y * s + oy).toFixed(1)).join(' ');
  const cur = (pt, t) => [pt.p[0] + pt.e[0] * t, pt.p[1] + pt.e[1] * t, pt.p[2] + pt.e[2] * t];

  function fit(dev, W, Hh, padR, ts) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    dev.parts.forEach(pt => (ts || [0, 1]).forEach(t => {
      const [x, y, z] = cur(pt, t), [w, d, h] = pt.b;
      [[x, y, z], [x + w, y, z], [x, y + d, z], [x + w, y + d, z], [x, y, z + h], [x + w, y, z + h], [x, y + d, z + h], [x + w, y + d, z + h]]
        .forEach(v => { const q = proj(...v); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    }));
    const s = Math.min((W - padR - 24) / (x1 - x0), (Hh - 24) / (y1 - y0));
    return { s, ox: 12 - x0 * s + ((W - padR - 24) - (x1 - x0) * s) / 2, oy: 12 - y0 * s + ((Hh - 24) - (y1 - y0) * s) / 2, right: 12 + (x1 - x0) * s + ((W - padR - 24) - (x1 - x0) * s) / 2 };
  }

  /* ---------- one drawable device ---------- */
  function createModel(svg, key, opt) {
    const dev = DEVICES[key];
    const W = opt.w, Hh = opt.h, padR = opt.labels ? 230 : 0;
    const f = fit(dev, W, Hh, padR, opt.fitT);
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    svg.textContent = '';
    const mk = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
    const gLead = mk('g', { 'class': 'dx-leads' }), gParts = mk('g', {}), gLab = mk('g', { 'class': 'dx-labels' });
    svg.append(gLead, gParts, gLab);
    const items = dev.parts.map(pt => {
      const g = mk('g', { 'class': 'dx-part', 'data-id': pt.id, tabindex: opt.interactive ? '0' : '-1' });
      if (opt.interactive) { g.setAttribute('role', 'button'); g.setAttribute('aria-label', pt.n); }
      const top = mk('polygon', { fill: shade(pt.c, 1.3) }), left = mk('polygon', { fill: pt.c }), right = mk('polygon', { fill: shade(pt.c, .68) });
      [top, left, right].forEach(p => { p.setAttribute('stroke', 'rgba(5,12,28,.55)'); p.setAttribute('stroke-width', '.8'); p.setAttribute('stroke-linejoin', 'round'); });
      g.append(left, right, top);
      const lead = mk('line', { 'class': 'dx-lead' });
      gLead.append(lead);
      let lab = null, con = null;
      if (opt.labels) {
        con = mk('polyline', { 'class': 'dx-con', fill: 'none' });
        gLab.append(con);
        lab = mk('text', { 'class': 'dx-lab', 'text-anchor': 'start' });
        lab.textContent = pt.n;
        gLab.append(lab);
      }
      return { pt, g, top, left, right, lead, lab, con };
    });
    let order = '';
    function render(t, active) {
      const sorted = items.map(it => { const [x, y, z] = cur(it.pt, t); return { it, k: z * 3 + (x + y) * .9 + it.pt.b[2] * .2 }; })
        .sort((a, b) => a.k - b.k);
      const o = sorted.map(s => s.it.pt.id).join();
      if (o !== order) { order = o; sorted.forEach(s => gParts.append(s.it.g)); }
      items.forEach(it => {
        const [x, y, z] = cur(it.pt, t), [w, d, h] = it.pt.b;
        const P = (a, b, c) => proj(a, b, c);
        it.top.setAttribute('points', pts([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], f.s, f.ox, f.oy));
        it.left.setAttribute('points', pts([P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)], f.s, f.ox, f.oy));
        it.right.setAttribute('points', pts([P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)], f.s, f.ox, f.oy));
        const c0 = proj(it.pt.p[0] + w / 2, it.pt.p[1] + d / 2, it.pt.p[2] + h / 2), c1 = proj(x + w / 2, y + d / 2, z + h / 2);
        it.lead.setAttribute('x1', (c0[0] * f.s + f.ox).toFixed(1)); it.lead.setAttribute('y1', (c0[1] * f.s + f.oy).toFixed(1));
        it.lead.setAttribute('x2', (c1[0] * f.s + f.ox).toFixed(1)); it.lead.setAttribute('y2', (c1[1] * f.s + f.oy).toFixed(1));
        it.lead.style.opacity = (clamp(t * 3) * .5).toFixed(2);
        it.g.classList.toggle('is-on', active === it.pt.id);
        it.g.classList.toggle('is-dim', !!active && active !== it.pt.id);
      });
      if (opt.labels) {
        /* labels sit in a right-hand column, spaced so they never overlap */
        const want = items.map(it => { const [x, y, z] = cur(it.pt, t), [w, d, h] = it.pt.b; const c1 = proj(x + w / 2, y + d / 2, z + h / 2); const r = proj(x + w, y + d / 2, z + h / 2); return { it, y: c1[1] * f.s + f.oy, rx: r[0] * f.s + f.ox, ry: r[1] * f.s + f.oy }; }).sort((a, b) => a.y - b.y);
        const GAP = 21; for (let i = 1; i < want.length; i++) want[i].ly = Math.max(want[i].y, (want[i - 1].ly ?? want[i - 1].y) + GAP); want[0].ly = want[0].y;
        const over = want[want.length - 1].ly - (Hh - 14); if (over > 0) want.forEach(w => w.ly -= over);
        const op = clamp((t - .2) * 3).toFixed(2), lx = f.right + 26;
        want.forEach(w => {
          w.it.lab.setAttribute('x', lx.toFixed(1)); w.it.lab.setAttribute('y', (w.ly + 5).toFixed(1)); w.it.lab.style.opacity = op;
          w.it.lab.classList.toggle('is-on', active === w.it.pt.id);
          w.it.con.setAttribute('points', `${w.rx.toFixed(1)},${w.ry.toFixed(1)} ${(lx - 14).toFixed(1)},${w.ly.toFixed(1)} ${(lx - 5).toFixed(1)},${w.ly.toFixed(1)}`);
          w.it.con.style.opacity = (op * .8).toFixed(2); w.it.con.classList.toggle('is-on', active === w.it.pt.id);
        });
      }
    }
    return { items, render, dev };
  }

  /* ---------- Device Explorer section ---------- */
  function initExplorer() {
    const tabs = document.getElementById('dx-tabs'), svg = document.getElementById('dx-svg'),
      panel = document.getElementById('dx-panel'), range = document.getElementById('dx-range'),
      list = document.getElementById('dx-parts'), stage = document.getElementById('dx-stage');
    if (!tabs || !svg || !panel || !range || !list) return;
    let key = 'router', t = 0, active = null, model = null, touched = false, pinned = null;

    const setPanel = (id) => {
      const pt = id && DEVICES[key].parts.find(p => p.id === id);
      panel.classList.toggle('is-idle', !pt);
      if (!pt) { panel.innerHTML = ''; const h = document.createElement('p'); h.className = 'dx-hint'; h.textContent = L.exHint; panel.append(h); return; }
      panel.innerHTML = '';
      const h = document.createElement('h3'); h.textContent = pt.n;
      const a = document.createElement('p'); a.innerHTML = '<b></b> ';
      a.firstChild.textContent = L.exWhat; a.append(pt.w);
      const b = document.createElement('p'); b.innerHTML = '<b></b> ';
      b.firstChild.textContent = L.exCheck; b.append(pt.k);
      panel.append(h, a, b);
    };
    const setActive = (id) => { active = id; setPanel(id); model.render(t, active); list.querySelectorAll('button').forEach(bt => bt.classList.toggle('is-on', bt.dataset.id === id)); };
    const setT = (v) => { t = clamp(v); range.value = Math.round(t * 100); range.style.setProperty('--p', Math.round(t * 100) + '%'); model.render(t, active); };

    function build() {
      model = createModel(svg, key, { w: 760, h: 520, labels: true, interactive: true });
      list.textContent = '';
      DEVICES[key].parts.slice().reverse().forEach(pt => {
        const li = document.createElement('li'), bt = document.createElement('button');
        bt.type = 'button'; bt.dataset.id = pt.id; bt.textContent = pt.n;
        bt.addEventListener('mouseenter', () => setActive(pt.id));
        bt.addEventListener('focus', () => setActive(pt.id));
        bt.addEventListener('click', () => { pinned = pt.id; setActive(pt.id); });
        li.append(bt); list.append(li);
      });
      model.items.forEach(it => {
        it.g.addEventListener('mouseenter', () => setActive(it.pt.id));
        it.g.addEventListener('focus', () => setActive(it.pt.id));
        it.g.addEventListener('click', () => { pinned = it.pt.id; setActive(it.pt.id); });
      });
      svg.addEventListener('mouseleave', () => setActive(pinned));
      active = null; pinned = null; setPanel(null); model.render(t, null);
      svg.setAttribute('aria-label', DEVICES[key].name + ': ' + L.exBar);
    }

    Object.keys(DEVICES).forEach((k, i, arr) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'dx-tab-' + k; b.setAttribute('aria-selected', k === key ? 'true' : 'false'); b.tabIndex = k === key ? 0 : -1;
      b.innerHTML = '<span></span><small></small>'; b.firstChild.textContent = DEVICES[k].name; b.lastChild.textContent = DEVICES[k].short;
      b.addEventListener('click', () => select(k));
      b.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return; e.preventDefault();
        const n = arr[(i + d + arr.length) % arr.length]; select(n); document.getElementById('dx-tab-' + n).focus();
      });
      tabs.append(b);
    });
    function select(k) {
      key = k; tabs.querySelectorAll('button').forEach(b => { const on = b.id === 'dx-tab-' + k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
      build();
    }
    range.addEventListener('input', () => { touched = true; setT(range.value / 100); });
    build();
    setT(0);

    /* gentle first-view hint: open to ~40% once, unless the visitor already used the bar */
    if (!reduce.matches && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((en) => {
        if (!en[0].isIntersecting) return; io.disconnect();
        if (touched) return;
        const t0 = performance.now();
        (function step(now) { if (touched) return; const p = clamp((now - t0) / 1400); setT(ease(p) * .42); if (p < 1) requestAnimationFrame(step); })(t0);
      }, { threshold: .45 });
      io.observe(stage || svg);
    }
  }

  /* ---------- Hero objects: hover to open, scroll to explode and vanish ---------- */
  function initHero() {
    const host = document.querySelector('.hero-visual');
    if (!host || !matchMedia('(min-width: 901px)').matches) return;
    const spec = [['router', 'ho-a', 760, 520], ['camera', 'ho-b', 520, 420], ['ap', 'ho-c', 520, 420]];
    const objs = spec.map(([k, cls, w, h]) => {
      const wrap = document.createElement('div'); wrap.className = 'hero-obj ' + cls;
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      wrap.append(svg); host.append(wrap);
      const m = createModel(svg, k, { w, h, labels: false, interactive: false, fitT: [0, .5] });
      const o = { wrap, m, t: 0, target: 0, hover: false };
      wrap.addEventListener('mouseenter', () => { o.hover = true; kick(); });
      wrap.addEventListener('mouseleave', () => { o.hover = false; kick(); });
      m.render(0, null);
      return o;
    });
    let prog = 0, raf = 0;
    const loop = () => {
      raf = 0; let busy = false;
      objs.forEach(o => {
        const goal = Math.max(o.hover ? .5 : 0, prog);
        const d = goal - o.t;
        o.t = reduce.matches ? goal : (Math.abs(d) < .002 ? goal : o.t + d * .14);
        if (Math.abs(goal - o.t) > .002) busy = true;
        o.m.render(o.t, null);
        o.wrap.style.opacity = (1 - clamp((prog - .45) / .5)).toFixed(3);
        o.wrap.style.transform = `translateY(${(-prog * 36).toFixed(1)}px)`;
        o.wrap.style.pointerEvents = prog > .85 ? 'none' : '';
      });
      if (busy) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const onScroll = () => {
      const hero = host.closest('.hero') || host;
      const p = clamp(scrollY / (hero.offsetHeight * .8));
      if (p !== prog) { prog = p; kick(); }
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    /* gentle entrance so the objects read as live */
    if (!reduce.matches) { objs.forEach((o, i) => setTimeout(() => { o.t = .0; o.hover = true; kick(); setTimeout(() => { o.hover = false; kick(); }, 700); }, 500 + i * 260)); }
  }

  const start = () => { initExplorer(); initHero(); };
  if (document.readyState !== 'loading') start(); else document.addEventListener('DOMContentLoaded', start);
})();
