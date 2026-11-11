/* Md. Hossain — shared interface behaviour
   theme, navigation, language menu, progress, copy, contact composer, motion reel */
(() => {
  'use strict';
  const d = document;
  const root = d.documentElement;
  const L = Object.assign({
    copied: 'Email address copied',
    copyfail: 'Copy failed. The address is ',
    mailsubject: 'Website enquiry',
  }, window.I18N || {});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Theme ---------- */
  const themeBtn = d.getElementById('theme-btn');
  const syncThemeBtn = () => {
    const light = root.dataset.theme === 'light';
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', light
        ? (themeBtn.dataset.labelDark || 'Switch to dark theme')
        : (themeBtn.dataset.labelLight || 'Switch to light theme'));
    }
    const meta = d.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = light ? '#f3f6fb' : '#070d1a';
  };
  syncThemeBtn();
  themeBtn?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('mh-theme', next); } catch (_) { /* storage unavailable */ }
    syncThemeBtn();
    window.dispatchEvent(new CustomEvent('themechange'));
  });

  /* ---------- Mobile navigation ---------- */
  const menuBtn = d.getElementById('menu-btn');
  const nav = d.getElementById('site-nav');
  const setMenu = (open) => {
    if (!menuBtn || !nav) return;
    nav.classList.toggle('open', open);
    d.body.classList.toggle('nav-lock', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open
      ? (menuBtn.dataset.labelClose || 'Close menu')
      : (menuBtn.dataset.labelOpen || 'Open menu'));
  };
  menuBtn?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  /* ---------- Language menu (a <details> element; works without JS) ---------- */
  const lang = d.getElementById('lang');
  d.addEventListener('click', (e) => { if (lang?.open && !lang.contains(e.target)) lang.open = false; });
  d.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (lang?.open) { lang.open = false; lang.querySelector('summary')?.focus(); }
    if (nav?.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });
  matchMedia('(min-width: 1221px)').addEventListener?.('change', (m) => { if (m.matches) setMenu(false); });

  /* ---------- Header state + scroll progress ---------- */
  const header = d.querySelector('.site-header');
  const progress = d.getElementById('progress');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = root.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    header?.classList.toggle('scrolled', scrollY > 8);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Active section in navigation ---------- */
  const spyLinks = [...d.querySelectorAll('.nav-links a[data-spy]')];
  const sections = spyLinks.map((a) => d.getElementById(a.dataset.spy)).filter((s) => s && s.tagName === 'SECTION');
  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        spyLinks.forEach((a) => {
          if (a.dataset.spy === en.target.id) a.setAttribute('aria-current', 'true');
          else if (a.getAttribute('aria-current') !== 'page') a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Toast ---------- */
  const toast = d.getElementById('toast');
  let toastTimer;
  const say = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  /* ---------- Copy to clipboard ---------- */
  d.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        say(L.copied);
      } catch (_) {
        const ta = d.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        d.body.appendChild(ta); ta.select();
        let ok = false;
        try { ok = d.execCommand('copy'); } catch (_) { ok = false; }
        ta.remove();
        say(ok ? L.copied : L.copyfail + text);
      }
    });
  });

  /* ---------- Contact composer: builds an email, stores nothing ---------- */
  const form = d.getElementById('compose');
  if (form) {
    const err = d.getElementById('c-error');
    const done = d.getElementById('c-done');
    const count = d.getElementById('c-count');
    const msgEl = form.elements.message;
    const nf = new Intl.NumberFormat(root.lang || 'en', { useGrouping: false });
    const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const checks = { name: (v) => !!v.trim(), email: (v) => isEmail(v.trim()), message: (v) => !!v.trim() };

    /* Topic chips: each one drops a short opening line into the message, until the visitor has written their own */
    let starter = '';
    const applyStarter = () => {
      const radio = form.querySelector('input[name="topic"]:checked');
      if (!radio) return;
      const next = radio.dataset.starter || '';
      if (!msgEl.value.trim() || msgEl.value === starter) { msgEl.value = next; starter = next; updateCount(); }
    };
    form.querySelectorAll('input[name="topic"]').forEach((r) => r.addEventListener('change', applyStarter));

    /* Live character count and inline validation as the visitor moves through the fields */
    function updateCount() { count.textContent = nf.format(msgEl.value.length) + ' / ' + nf.format(msgEl.maxLength); }
    msgEl.addEventListener('input', updateCount);
    Object.keys(checks).forEach((f) => {
      const el = form.elements[f];
      el.addEventListener('blur', () => { if (el.value) el.setAttribute('aria-invalid', String(!checks[f](el.value))); });
      el.addEventListener('input', () => {
        if (el.getAttribute('aria-invalid') === 'true' && checks[f](el.value)) el.setAttribute('aria-invalid', 'false');
        if (done) done.hidden = true;
      });
    });
    applyStarter();
    updateCount();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const topic = form.querySelector('input[name="topic"]:checked').value;
      const msg = msgEl.value.trim();
      Object.keys(checks).forEach((f) => form.elements[f].setAttribute('aria-invalid', String(!checks[f](form.elements[f].value))));
      if (!checks.name(name) || !checks.email(email) || !checks.message(msg)) {
        err.hidden = false;
        if (done) done.hidden = true;
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      err.hidden = true;
      const subject = `${L.mailsubject}: ${topic}`;
      const body = `${msg}\n\n${name}\n${email}`;
      location.href = `mailto:mdhossain.cloud@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (done) done.hidden = false;  /* mail apps are not set up on every device: offer the address to copy */
    });
  }


  /* ---------- Local time in Dhaka (footer) ---------- */
  const clock = d.getElementById('dhaka-time');
  if (clock && window.Intl) {
    const fmt = new Intl.DateTimeFormat(root.lang || 'en', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dhaka' });
    const tick = () => { clock.textContent = fmt.format(new Date()) + ' (GMT+6)'; };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- Section headings: one quiet reveal ---------- */
  if ('IntersectionObserver' in window && !reduce.matches) {
    const heads = [...d.querySelectorAll('main .section .section-head')];
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -12% 0px' });
    heads.forEach((h) => {
      if (h.getBoundingClientRect().top > innerHeight) { h.classList.add('rv'); io.observe(h); }
    });
  }

  /* ---------- Guide pages: highlight the current section in the contents ---------- */
  const tocLinks = [...d.querySelectorAll('.toc a')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const tio = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      tocLinks.forEach((a) => a.removeAttribute('aria-current'));
      map.get(en.target.id)?.setAttribute('aria-current', 'true');
    }), { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((_, id) => { const h = d.getElementById(id); if (h) tio.observe(h); });
  }

  /* ---------- Motion reel: plays only on screen, never under reduced motion ---------- */
  const reel = d.getElementById('reel');
  if (reel && 'IntersectionObserver' in window) {
    let loaded = false;
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !reduce.matches) {
        if (!loaded) { reel.preload = 'auto'; reel.load(); loaded = true; }
        reel.play().catch(() => {});
      } else {
        reel.pause();
      }
    }, { threshold: 0.25 }).observe(reel);
  }
})();
