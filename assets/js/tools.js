/* Free IT tools (v4.5): twelve small calculators and utilities that run entirely in the browser.
   Nothing is sent anywhere. Inspired by the simple, single-purpose layout of commontools.org. */
(() => {
  'use strict';
  const grid = document.getElementById('tools-grid');
  if (!grid) return;
  const $ = (s, r = document) => r.querySelector(s);
  const num = (v) => { const n = parseFloat(String(v).replace(/,/g, '')); return Number.isFinite(n) ? n : NaN; };
  const fmt = (n, d = 2) => Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: d }) : '—';
  const row = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dur = (s) => {
    if (!Number.isFinite(s)) return '—';
    if (s < 1) return '< 1 second';
    const u = [['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]]; const out = [];
    for (const [n, v] of u) { const q = Math.floor(s / v); if (q) { out.push(q + ' ' + n + (q > 1 ? 's' : '')); s -= q * v; } if (out.length === 2) break; }
    return out.join(' ');
  };

  /* ----- IPv4 helpers ----- */
  const ip2n = (s) => { const p = s.trim().split('.'); if (p.length !== 4 || p.some(x => !/^\d{1,3}$/.test(x) || +x > 255)) return null; return ((+p[0] << 24) >>> 0) + (+p[1] << 16) + (+p[2] << 8) + +p[3]; };
  const n2ip = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

  const TOOLS = [
    { id: 'subnet', t: 'Subnet calculator', d: 'Network, broadcast, mask and usable hosts for any IPv4 address with a CIDR prefix.', tags: 'ip cidr network vlan',
      html: `<label>IPv4 / prefix<input id="f" value="192.168.10.37/26" spellcheck="false" autocomplete="off"></label><dl class="out" id="o"></dl>`,
      run(r) {
        const m = r.f.value.trim().match(/^([\d.]+)\s*\/\s*(\d{1,2})$/); const ip = m && ip2n(m[1]); const p = m && +m[2];
        if (!m || ip === null || p > 32) return r.o.innerHTML = '<p class="bad">Enter an address like 192.168.10.37/26</p>';
        const mask = p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0, net = (ip & mask) >>> 0, bc = (net | ~mask) >>> 0;
        const hosts = p >= 31 ? (p === 32 ? 1 : 2) : Math.pow(2, 32 - p) - 2;
        const priv = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n2ip(ip));
        r.o.innerHTML = row('Network', n2ip(net) + '/' + p) + row('Subnet mask', n2ip(mask)) + row('Wildcard', n2ip(~mask >>> 0)) +
          row('Broadcast', n2ip(bc)) + row('First usable', p >= 31 ? n2ip(net) : n2ip(net + 1)) + row('Last usable', p >= 31 ? n2ip(bc) : n2ip(bc - 1)) +
          row('Usable hosts', fmt(hosts, 0)) + row('Type', priv ? 'Private (RFC 1918)' : 'Public or special-use');
      } },
    { id: 'transfer', t: 'File transfer time', d: 'How long a copy or backup takes at a given link speed, with a realistic efficiency factor.', tags: 'bandwidth backup speed',
      html: `<div class="two"><label>Size<input id="s" value="500" inputmode="decimal"></label><label>Unit<select id="su"><option>MB</option><option selected>GB</option><option>TB</option></select></div>
        <div class="two"><label>Link speed<input id="v" value="100" inputmode="decimal"></label><label>Unit<select id="vu"><option>Mbps</option><option>Gbps</option></select></label></div>
        <label><span>Real-world efficiency: <b id="ev">80</b>%</span><input id="e" type="range" min="30" max="100" value="80"></label><dl class="out" id="o"></dl>`,
      run(r) {
        const size = num(r.s.value) * { MB: 1e6, GB: 1e9, TB: 1e12 }[r.su.value] * 8, spd = num(r.v.value) * { Mbps: 1e6, Gbps: 1e9 }[r.vu.value] * r.e.value / 100;
        r.ev.textContent = r.e.value;
        r.o.innerHTML = Number.isFinite(size / spd) ? row('Estimated time', dur(size / spd)) + row('Effective speed', fmt(spd / 8e6, 1) + ' MB/s') : '<p class="bad">Enter numbers</p>';
      } },
    { id: 'cctv', t: 'CCTV storage calculator', d: 'Disk space for an IP camera system from camera count, bitrate and retention days.', tags: 'camera nvr surveillance storage',
      html: `<div class="two"><label>Cameras<input id="n" value="16" inputmode="numeric"></label><label>Bitrate per camera (kbps)<input id="b" value="4096" inputmode="numeric"></label></div>
        <div class="two"><label>Recording hours per day<input id="h" value="24" inputmode="decimal"></label><label>Retention (days)<input id="d" value="30" inputmode="numeric"></label></div><dl class="out" id="o"></dl>`,
      run(r) {
        const n = num(r.n.value), b = num(r.b.value), h = num(r.h.value), d = num(r.d.value);
        const gbDay = b * 1000 / 8 * 3600 * h * n / 1e9, tb = gbDay * d / 1000, withOverhead = tb * 1.2;
        r.o.innerHTML = Number.isFinite(tb) ? row('Per day', fmt(gbDay, 1) + ' GB') + row('Total for retention', fmt(tb, 2) + ' TB') + row('Plan for (+20% headroom)', fmt(withOverhead, 2) + ' TB') + row('Network load', fmt(b * n / 1000, 1) + ' Mbps') : '<p class="bad">Enter numbers</p>';
      } },
    { id: 'raid', t: 'RAID capacity', d: 'Usable space and fault tolerance for RAID 0, 1, 5, 6 and 10.', tags: 'disk storage server nas',
      html: `<div class="two"><label>Disks<input id="n" value="4" inputmode="numeric"></label><label>Size per disk (TB)<input id="s" value="4" inputmode="decimal"></label></div>
        <label>RAID level<select id="l"><option>0</option><option>1</option><option selected>5</option><option>6</option><option>10</option></select></label><dl class="out" id="o"></dl>`,
      run(r) {
        const n = Math.floor(num(r.n.value)), s = num(r.s.value), l = r.l.value;
        const min = { 0: 2, 1: 2, 5: 3, 6: 4, 10: 4 }[l];
        if (!(n >= min) || !(s > 0)) return r.o.innerHTML = `<p class="bad">RAID ${l} needs at least ${min} disks</p>`;
        const u = { 0: n * s, 1: s, 5: (n - 1) * s, 6: (n - 2) * s, 10: Math.floor(n / 2) * s }[l];
        const tol = { 0: 'None. One failed disk loses everything', 1: 'All but one disk', 5: '1 disk', 6: '2 disks', 10: '1 disk per mirrored pair' }[l];
        r.o.innerHTML = row('Usable space', fmt(u, 2) + ' TB') + row('Raw space', fmt(n * s, 2) + ' TB') + row('Efficiency', fmt(u / (n * s) * 100, 0) + '%') + row('Survives', tol) + '<p class="note">RAID is not a backup: it keeps a disk failure from stopping work, it does not protect against deletion or ransomware.</p>';
      } },
    { id: 'sla', t: 'Uptime and downtime (SLA)', d: 'What an uptime percentage really allows in downtime per year, month, week and day.', tags: 'availability 99.9 sla',
      html: `<label>Uptime %<input id="u" value="99.9" inputmode="decimal"></label><dl class="out" id="o"></dl>`,
      run(r) {
        const u = num(r.u.value); if (!(u > 0 && u <= 100)) return r.o.innerHTML = '<p class="bad">Enter a value between 0 and 100</p>';
        const f = (100 - u) / 100;
        r.o.innerHTML = row('Per year', dur(f * 365 * 86400)) + row('Per month (30 days)', dur(f * 30 * 86400)) + row('Per week', dur(f * 7 * 86400)) + row('Per day', dur(f * 86400));
      } },
    { id: 'base', t: 'Binary, decimal and hex', d: 'Convert a number between base 2, 8, 10 and 16, the quickest way to read masks and addresses.', tags: 'binary hex number',
      html: `<div class="two"><label>Value<input id="v" value="192" spellcheck="false"></label><label>Input base<select id="b"><option value="10" selected>Decimal</option><option value="2">Binary</option><option value="16">Hex</option><option value="8">Octal</option></select></label></div><dl class="out" id="o"></dl>`,
      run(r) {
        const b = +r.b.value, v = r.v.value.trim().replace(/^0[xb]/i, ''), ok = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[\da-f]+$/i }[b].test(v);
        if (!ok) return r.o.innerHTML = '<p class="bad">Not valid in that base</p>';
        const n = BigInt(b === 10 ? v : (b === 16 ? '0x' : b === 2 ? '0b' : '0o') + v);
        r.o.innerHTML = row('Decimal', n.toString(10)) + row('Binary', n.toString(2).replace(/\B(?=(\d{4})+(?!\d))/g, ' ')) + row('Hex', n.toString(16).toUpperCase()) + row('Octal', n.toString(8));
      } },
    { id: 'hash', t: 'Hash generator', d: 'SHA-1, SHA-256 and SHA-512 of any text, computed locally. Handy for checking file or message integrity.', tags: 'sha checksum security',
      html: `<label>Text<textarea id="t" rows="3" spellcheck="false">Hello, IT</textarea></label><dl class="out" id="o"></dl>`,
      async run(r) {
        const data = new TextEncoder().encode(r.t.value);
        const hex = async (a) => [...new Uint8Array(await crypto.subtle.digest(a, data))].map(x => x.toString(16).padStart(2, '0')).join('');
        const [a, b, c] = await Promise.all([hex('SHA-1'), hex('SHA-256'), hex('SHA-512')]);
        r.o.innerHTML = row('SHA-1', `<code>${a}</code>`) + row('SHA-256', `<code>${b}</code>`) + row('SHA-512', `<code>${c}</code>`);
      } },
    { id: 'password', t: 'Password generator', d: 'Strong random passwords from your browser’s secure random source. Nothing leaves this page.', tags: 'security random secret',
      html: `<label><span>Length: <b id="lv">16</b></span><input id="l" type="range" min="8" max="64" value="16"></label>
        <div class="checks"><label><input type="checkbox" id="u" checked> A–Z</label><label><input type="checkbox" id="w" checked> a–z</label><label><input type="checkbox" id="d" checked> 0–9</label><label><input type="checkbox" id="s" checked> Symbols</label></div>
        <div class="two"><button type="button" class="btn" id="g">Generate</button><button type="button" class="btn" id="c">Copy</button></div><dl class="out" id="o"></dl>`,
      init(r, redo) { r.g.onclick = redo; r.c.onclick = () => { const t = r.o.querySelector('code'); if (t && navigator.clipboard) navigator.clipboard.writeText(t.textContent).then(() => { r.c.textContent = 'Copied'; setTimeout(() => r.c.textContent = 'Copy', 1400); }, () => { }); }; },
      run(r, ev) {
        r.lv.textContent = r.l.value;
        if (ev && ev.type === 'input' && ev.target !== r.l && !ev.target.type) return;
        const sets = [[r.u, 'ABCDEFGHJKLMNPQRSTUVWXYZ'], [r.w, 'abcdefghijkmnopqrstuvwxyz'], [r.d, '23456789'], [r.s, '!@#$%^&*-_=+?']].filter(x => x[0].checked).map(x => x[1]);
        if (!sets.length) return r.o.innerHTML = '<p class="bad">Pick at least one set</p>';
        const all = sets.join(''), L = +r.l.value, buf = new Uint32Array(L + sets.length); crypto.getRandomValues(buf);
        const out = []; sets.forEach((s, i) => out.push(s[buf[i] % s.length])); for (let i = 0; out.length < L; i++) out.push(all[buf[sets.length + i] % all.length]);
        for (let i = out.length - 1; i > 0; i--) { const j = buf[i] % (i + 1);[out[i], out[j]] = [out[j], out[i]]; }
        const bits = Math.floor(L * Math.log2(all.length));
        r.o.innerHTML = row('Password', `<code>${esc(out.join(''))}</code>`) + row('Strength', `about ${bits} bits (${bits >= 80 ? 'very strong' : bits >= 60 ? 'strong' : 'moderate'})`);
      } },
    { id: 'base64', t: 'Base64 encode and decode', d: 'Convert text to Base64 and back, with correct UTF-8 handling.', tags: 'encode decode text',
      html: `<label>Text<textarea id="t" rows="3" spellcheck="false">IT support, Dhaka</textarea></label><div class="two"><button type="button" class="btn" id="e">Encode</button><button type="button" class="btn" id="dc">Decode</button></div><dl class="out" id="o"></dl>`,
      init(r) {
        const show = (v) => r.o.innerHTML = row('Result', `<code>${esc(v)}</code>`);
        r.e.onclick = () => show(btoa(String.fromCharCode(...new TextEncoder().encode(r.t.value))));
        r.dc.onclick = () => { try { show(new TextDecoder().decode(Uint8Array.from(atob(r.t.value.trim()), c => c.charCodeAt(0)))); } catch (e) { r.o.innerHTML = '<p class="bad">Not valid Base64</p>'; } };
      }, run() { } },
    { id: 'json', t: 'JSON formatter and validator', d: 'Paste JSON to validate it, pretty-print it or squash it onto one line.', tags: 'json format validate',
      html: `<label>JSON<textarea id="t" rows="4" spellcheck="false">{"site":"Dhaka","vlans":[10,20,30]}</textarea></label><div class="two"><button type="button" class="btn" id="p">Format</button><button type="button" class="btn" id="m">Minify</button></div><dl class="out" id="o"></dl>`,
      init(r) {
        const go = (sp) => { try { const v = JSON.stringify(JSON.parse(r.t.value), null, sp); r.t.value = v; r.o.innerHTML = '<p class="ok">Valid JSON</p>'; } catch (e) { r.o.innerHTML = `<p class="bad">${esc(e.message)}</p>`; } };
        r.p.onclick = () => go(2); r.m.onclick = () => go(0);
      }, run() { } },
    { id: 'epoch', t: 'Unix timestamp converter', d: 'Turn a Unix timestamp (seconds or milliseconds) into a readable date, or a date into a timestamp.', tags: 'time epoch date log',
      html: `<label>Timestamp<input id="t" value="${Math.floor(Date.now() / 1000)}" inputmode="numeric"></label><label>or date and time<input id="d" type="datetime-local"></label><dl class="out" id="o"></dl>`,
      run(r, ev) {
        if (ev && ev.target === r.d && r.d.value) { const ms = new Date(r.d.value).getTime(); if (Number.isFinite(ms)) r.t.value = Math.floor(ms / 1000); }
        let n = num(r.t.value); if (!Number.isFinite(n)) return r.o.innerHTML = '<p class="bad">Enter a number</p>';
        if (Math.abs(n) > 1e11) n = n / 1000; const d = new Date(n * 1000);
        r.o.innerHTML = row('UTC', d.toUTCString()) + row('Dhaka (UTC+6)', d.toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'medium' })) + row('Your device', d.toLocaleString()) + row('ISO 8601', d.toISOString());
      } },
    { id: 'ports', t: 'Common ports lookup', d: 'Search well-known TCP/UDP ports by number or service name.', tags: 'port tcp udp firewall',
      html: `<label>Port or service<input id="q" placeholder="443, rdp, dns…" autocomplete="off"></label><div class="ports" id="o"></div>`,
      run(r) {
        const P = [[20, 'FTP data', 'TCP'], [21, 'FTP control', 'TCP'], [22, 'SSH / SFTP', 'TCP'], [23, 'Telnet (insecure)', 'TCP'], [25, 'SMTP mail relay', 'TCP'], [53, 'DNS', 'TCP/UDP'], [67, 'DHCP server', 'UDP'], [68, 'DHCP client', 'UDP'], [80, 'HTTP', 'TCP'], [88, 'Kerberos', 'TCP/UDP'], [110, 'POP3', 'TCP'], [123, 'NTP time', 'UDP'], [135, 'RPC endpoint mapper', 'TCP'], [137, 'NetBIOS name', 'UDP'], [139, 'NetBIOS session', 'TCP'], [143, 'IMAP', 'TCP'], [161, 'SNMP', 'UDP'], [389, 'LDAP', 'TCP/UDP'], [443, 'HTTPS', 'TCP'], [445, 'SMB file sharing', 'TCP'], [465, 'SMTPS', 'TCP'], [514, 'Syslog', 'UDP'], [554, 'RTSP (IP cameras)', 'TCP/UDP'], [587, 'SMTP submission', 'TCP'], [636, 'LDAPS', 'TCP'], [993, 'IMAPS', 'TCP'], [995, 'POP3S', 'TCP'], [1194, 'OpenVPN', 'UDP'], [1701, 'L2TP', 'UDP'], [1723, 'PPTP', 'TCP'], [3306, 'MySQL', 'TCP'], [3389, 'RDP (Remote Desktop)', 'TCP'], [5060, 'SIP (IP telephony)', 'TCP/UDP'], [8291, 'MikroTik Winbox', 'TCP'], [8728, 'MikroTik API', 'TCP'], [51820, 'WireGuard', 'UDP']];
        const q = r.q.value.trim().toLowerCase(), list = P.filter(p => !q || String(p[0]).startsWith(q) || p[1].toLowerCase().includes(q));
        r.o.innerHTML = list.length ? '<table><tbody>' + list.map(p => `<tr><th scope="row">${p[0]}</th><td>${esc(p[1])}</td><td>${p[2]}</td></tr>`).join('') + '</tbody></table>' : '<p class="bad">No match</p>';
      } }
  ];

  /* ---------- render ---------- */
  TOOLS.forEach((tool, i) => {
    const card = document.createElement('article');
    card.className = 'tool'; card.id = tool.id; card.dataset.search = (tool.t + ' ' + tool.d + ' ' + tool.tags).toLowerCase();
    card.innerHTML = `<header><span class="tool-n">${String(i + 1).padStart(2, '0')}</span><h2>${tool.t}</h2></header><p class="tool-d">${tool.d}</p><div class="tool-body">${tool.html}</div>`;
    grid.append(card);
    const r = {}; card.querySelectorAll('[id]').forEach(n => { if (n !== card) { r[n.id] = n; n.removeAttribute('id'); } });
    const redo = (ev) => { try { const p = tool.run && tool.run(r, ev); if (p && p.catch) p.catch(() => { }); } catch (e) { /* keep the page alive */ } };
    card.addEventListener('input', redo);
    if (tool.init) tool.init(r, redo);
    redo();
  });

  /* ---------- filter ---------- */
  const q = document.getElementById('tools-q'), none = document.getElementById('tools-none'), count = document.getElementById('tools-count');
  if (q) q.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase(); let n = 0;
    grid.querySelectorAll('.tool').forEach(c => { const hit = !v || c.dataset.search.includes(v); c.hidden = !hit; if (hit) n++; });
    if (none) none.hidden = n > 0;
    if (count) count.textContent = n + ' of ' + TOOLS.length;
  });
  if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.classList.add('is-target'); }
})();
