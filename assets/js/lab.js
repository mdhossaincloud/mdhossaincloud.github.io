/* Infrastructure Lab: tabbed, step-through explainers rendered as SVG/HTML. */
(() => {
  'use strict';
  const topics = window.LAB_TOPICS || [];
  const tabs = document.getElementById('lab-tabs');
  const stage = document.getElementById('lab-stage');
  if (!tabs || !stage || !topics.length) return;

  const SVGNS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const ICON = {
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  };
  const el = (tag, attrs = {}, ns) => {
    const n = ns ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  };

  let current = null;
  let timer = null;
  let anim = null;

  /* ---------- Tabs ---------- */
  topics.forEach((t, i) => {
    const b = el('button', { type: 'button', role: 'tab', id: 'lab-tab-' + t.id, 'aria-controls': 'lab-stage', 'aria-selected': 'false', tabindex: '-1' });
    b.innerHTML = `<span></span><small></small>`;
    b.firstChild.textContent = t.title;
    b.lastChild.textContent = t.short;
    b.addEventListener('click', () => select(i, true));
    tabs.appendChild(b);
  });
  tabs.addEventListener('keydown', (e) => {
    const idx = topics.indexOf(current);
    let n = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (idx + 1) % topics.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (idx - 1 + topics.length) % topics.length;
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = topics.length - 1;
    if (n !== null) { e.preventDefault(); select(n, true); tabs.children[n].focus(); }
  });

  function select(i, user) {
    stopAuto();
    const t = topics[i];
    current = t;
    [...tabs.children].forEach((b, j) => {
      b.setAttribute('aria-selected', String(i === j));
      b.tabIndex = i === j ? 0 : -1;
    });
    stage.setAttribute('aria-labelledby', 'lab-tab-' + t.id);
    stage.innerHTML = '';
    const top = el('div', { class: 'lab-top' });
    const h = el('h3'); h.textContent = t.title;
    const p = el('p'); p.textContent = t.intro;
    top.append(h, p);
    stage.appendChild(top);
    t.kind === 'stack' ? renderStack(t) : renderFlow(t);
    if (user && history.replaceState) history.replaceState(null, '', '#lab-' + t.id);
  }

  /* ---------- Layered models ---------- */
  function renderStack(t) {
    const wrap = el('div', { class: 'stack' });
    const list = el('div', { class: 'stack-list', role: 'group', 'aria-label': t.title + ' layers' });
    const detail = el('div', { class: 'stack-detail', 'aria-live': 'polite' });
    t.layers.forEach((L, i) => {
      const b = el('button', { type: 'button', 'aria-pressed': 'false' });
      b.innerHTML = '<b></b><span></span><small></small>';
      b.children[0].textContent = 'L' + L.n;
      b.children[1].textContent = L.name;
      b.children[2].textContent = L.pdu;
      b.addEventListener('click', () => show(i));
      list.appendChild(b);
    });
    function show(i) {
      const L = t.layers[i];
      [...list.children].forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
      detail.innerHTML = '';
      const h = el('h4'); h.textContent = `Layer ${L.n}: ${L.name}`;
      const p = el('p'); p.textContent = L.what; p.className = 'muted';
      const dl = el('dl');
      [['Unit of data', L.pdu], ['Examples', L.ex], ['What I check when it breaks here', L.check]].forEach(([k, v]) => {
        const dt = el('dt'); dt.textContent = k;
        const dd = el('dd'); dd.textContent = v;
        dl.append(dt, dd);
      });
      detail.append(h, p, dl);
    }
    wrap.append(list, detail);
    stage.appendChild(wrap);
    show(0);
  }

  /* ---------- Step-through flows ---------- */
  function renderFlow(t) {
    const box = el('div', { class: 'lab-canvas' });
    const svg = el('svg', { viewBox: '-10 0 780 320', role: 'img', 'aria-label': `${t.title} diagram: ${t.nodes.map((n) => n.label).join(', ')}` }, true);
    const pos = Object.fromEntries(t.nodes.map((n) => [n.id, n]));

    (t.zones || []).forEach((z) => {
      svg.appendChild(el('rect', { class: 'lx-zone', x: z.x, y: 110, width: z.w, height: 110, rx: 12 }, true));
      const lab = el('text', { class: 'lx-label', x: z.x + 10, y: 236 }, true); lab.textContent = z.label;
      svg.appendChild(lab);
    });

    const edgeEls = {};
    t.edges.forEach(([a, b, label, style]) => {
      const A = pos[a], B = pos[b];
      const key = [a, b].sort().join('|');
      if (edgeEls[key]) return;
      const line = el('line', { class: 'lx-edge' + (style === 'dash' ? ' dash' : ''), x1: A.x, y1: A.y, x2: B.x, y2: B.y }, true);
      svg.appendChild(line);
      edgeEls[key] = line;
      if (label) {
        const tx = el('text', { class: 'lx-label', x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 - 8, 'text-anchor': 'middle' }, true);
        tx.textContent = label;
        svg.appendChild(tx);
      }
    });

    const nodeEls = {};
    t.nodes.forEach((n) => {
      const g = el('g', { class: 'lx-node', transform: `translate(${n.x} ${n.y})` }, true);
      const w = Math.max(124, Math.max(n.label.length * 7.6, n.sub.length * 6.9) + 22);
      g.appendChild(el('rect', { x: -w / 2, y: -25, width: w, height: 50, rx: 9 }, true));
      const a = el('text', { 'text-anchor': 'middle', y: -3 }, true); a.textContent = n.label;
      const b = el('text', { class: 'sub', 'text-anchor': 'middle', y: 14 }, true); b.textContent = n.sub;
      g.append(a, b);
      svg.appendChild(g);
      nodeEls[n.id] = g;
    });

    const pkt = el('circle', { class: 'lx-pkt', r: 6, cx: -100, cy: -100 }, true);
    const ring = el('circle', { class: 'lx-pkt-ring', r: 30, cx: -100, cy: -100, opacity: 0 }, true);
    svg.append(ring, pkt);
    box.appendChild(svg);
    stage.appendChild(box);

    // footer: step text + controls
    const foot = el('div', { class: 'lab-foot' });
    const txt = el('div');
    const count = el('p', { class: 'lab-step-count' });
    const title = el('p', { class: 'lab-step-title' });
    const body = el('p', { class: 'lab-step-text' });
    txt.append(count, title, body);
    const ctr = el('div', { class: 'lab-controls' });
    const bPrev = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Previous step' }); bPrev.innerHTML = ICON.prev;
    const bPlay = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Play all steps' }); bPlay.innerHTML = ICON.play;
    const bNext = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Next step' }); bNext.innerHTML = ICON.next;
    ctr.append(bPrev, bPlay, bNext);
    foot.append(txt, ctr);
    stage.appendChild(foot);

    let step = 0;
    function go(i) {
      step = Math.max(0, Math.min(t.steps.length - 1, i));
      const s = t.steps[step];
      count.textContent = `Step ${step + 1} of ${t.steps.length}`;
      title.textContent = s.title;
      body.textContent = s.text;
      bPrev.disabled = step === 0;
      bNext.disabled = step === t.steps.length - 1;
      Object.values(nodeEls).forEach((g) => g.classList.remove('on'));
      Object.values(edgeEls).forEach((l) => l.classList.remove('on'));
      nodeEls[s.from]?.classList.add('on');
      nodeEls[s.to]?.classList.add('on');
      edgeEls[[s.from, s.to].sort().join('|')]?.classList.add('on');
      animate(pos[s.from], pos[s.to]);
    }
    function animate(A, B) {
      if (anim) cancelAnimationFrame(anim);
      if (A === B) {
        pkt.setAttribute('cx', A.x); pkt.setAttribute('cy', A.y - 34);
        ring.setAttribute('cx', A.x); ring.setAttribute('cy', A.y);
        if (reduce.matches) { ring.setAttribute('opacity', .8); ring.setAttribute('r', 40); return; }
        const t0 = performance.now();
        const f = (now) => {
          const k = Math.min(1, (now - t0) / 900);
          ring.setAttribute('r', 28 + k * 22);
          ring.setAttribute('opacity', (1 - k).toFixed(2));
          if (k < 1) anim = requestAnimationFrame(f);
        };
        anim = requestAnimationFrame(f);
        return;
      }
      ring.setAttribute('opacity', 0);
      if (reduce.matches) { pkt.setAttribute('cx', B.x); pkt.setAttribute('cy', B.y - 34); return; }
      const t0 = performance.now();
      const dur = 900;
      const f = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        pkt.setAttribute('cx', A.x + (B.x - A.x) * e);
        pkt.setAttribute('cy', A.y + (B.y - A.y) * e);
        if (k < 1) anim = requestAnimationFrame(f);
        else { pkt.setAttribute('cy', B.y - 34); }
      };
      anim = requestAnimationFrame(f);
    }
    bPrev.addEventListener('click', () => { stopAuto(); go(step - 1); });
    bNext.addEventListener('click', () => { stopAuto(); go(step + 1); });
    bPlay.addEventListener('click', () => {
      if (timer) { stopAuto(); return; }
      if (step === t.steps.length - 1) go(0);
      bPlay.innerHTML = ICON.pause; bPlay.setAttribute('aria-label', 'Pause');
      timer = setInterval(() => {
        if (step >= t.steps.length - 1) { stopAuto(); return; }
        go(step + 1);
      }, reduce.matches ? 6000 : 3800);
      stopAuto.btn = bPlay;
    });
    go(0);
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
    if (stopAuto.btn) { stopAuto.btn.innerHTML = ICON.play; stopAuto.btn.setAttribute('aria-label', 'Play all steps'); }
  }

  /* ---------- Deep links: #lab-<id> ---------- */
  function fromHash() {
    const m = location.hash.match(/^#lab-([a-z0-9]+)$/);
    const i = m ? topics.findIndex((t) => t.id === m[1]) : -1;
    if (i >= 0) {
      select(i, false);
      document.getElementById('lab')?.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
      return true;
    }
    return false;
  }
  if (!fromHash()) select(0, false);
  addEventListener('hashchange', fromHash);
})();
