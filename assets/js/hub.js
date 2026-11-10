/* Knowledge Hub: search and filter across lab explainers and published guides. */
(() => {
  'use strict';
  const list = document.getElementById('hub-list');
  const q = document.getElementById('hub-q');
  const filters = document.getElementById('hub-filters');
  const count = document.getElementById('hub-count');
  if (!list || !q || !filters) return;

  const CATEGORIES = ['IT troubleshooting', 'Networking', 'Microsoft 365', 'Windows administration', 'MikroTik',
    'Cybersecurity fundamentals', 'IT infrastructure', 'IT career development', 'Practical IT guides'];

  const items = [
    ...(window.LAB_TOPICS || []).map((t) => ({
      title: t.title, summary: t.intro, topic: t.topic, url: '../#lab-' + t.id,
      kind: 'Interactive explainer', extra: t.kind === 'stack' ? t.layers.length + ' layers' : t.steps.length + ' steps',
      text: [t.title, t.intro, t.short, ...(t.steps || []).map((s) => s.title + ' ' + s.text), ...(t.layers || []).map((l) => l.name + ' ' + l.ex + ' ' + l.what)].join(' '),
    })),
    ...(window.ARTICLES || []).map((a) => ({
      title: a.title, summary: a.summary, topic: a.topic, url: a.url, kind: 'Guide',
      extra: a.minutes ? a.minutes + ' min read' : '', text: a.title + ' ' + a.summary,
    })),
  ];

  const params = new URLSearchParams(location.search);
  let topic = CATEGORIES.includes(params.get('topic')) ? params.get('topic') : null;
  if (params.get('q')) q.value = params.get('q');

  const mk = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

  function renderFilters() {
    filters.innerHTML = '';
    const all = mk('button', 'chip', 'All topics');
    all.type = 'button';
    all.setAttribute('aria-pressed', String(!topic));
    all.addEventListener('click', () => { topic = null; update(); });
    filters.appendChild(all);
    CATEGORIES.forEach((c) => {
      const n = items.filter((i) => i.topic === c).length;
      const b = mk('button', 'chip', `${c} (${n})`);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(topic === c));
      b.addEventListener('click', () => { topic = topic === c ? null : c; update(); });
      filters.appendChild(b);
    });
  }

  function update() {
    const terms = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const res = items.filter((i) =>
      (!topic || i.topic === topic) && terms.every((t) => i.text.toLowerCase().includes(t)));
    list.innerHTML = '';
    res.forEach((i) => {
      const li = mk('li', 'hub-item');
      const a = mk('a'); a.href = i.url;
      const meta = mk('div', 'meta');
      meta.append(mk('span', 'tag', i.kind), mk('span', 'tag', i.topic));
      if (i.extra) meta.append(mk('span', 'tag', i.extra));
      a.append(mk('h3', null, i.title), mk('p', null, i.summary), meta);
      li.appendChild(a);
      list.appendChild(li);
    });
    if (!res.length) {
      const li = mk('li', 'hub-empty');
      li.textContent = topic && !terms.length
        ? `Nothing published in ${topic} yet. Try the Networking explainers in the meantime.`
        : 'No results. Try a broader word such as "network", "DNS" or "VPN", or clear the topic filter.';
      list.appendChild(li);
    }
    count.textContent = `${res.length} ${res.length === 1 ? 'item' : 'items'}${topic ? ' in ' + topic : ''}${terms.length ? ' matching "' + q.value.trim() + '"' : ''}`;
    renderFilters();
    const p = new URLSearchParams();
    if (topic) p.set('topic', topic);
    if (q.value.trim()) p.set('q', q.value.trim());
    history.replaceState?.(null, '', location.pathname + (p.toString() ? '?' + p : ''));
  }
  q.addEventListener('input', update);
  update();
})();
