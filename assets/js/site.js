/* Md. Hossain — shared interface behaviour (theme, navigation, progress, copy) */
(() => {
  'use strict';
  const d = document;
  const root = d.documentElement;

  /* ---------- Theme ---------- */
  const themeBtn = d.getElementById('theme-btn');
  const syncThemeBtn = () => {
    const light = root.dataset.theme === 'light';
    themeBtn?.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
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
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav?.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });
  matchMedia('(min-width: 1081px)').addEventListener?.('change', (m) => { if (m.matches) setMenu(false); });

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
  const sections = spyLinks
    .map((a) => d.getElementById(a.dataset.spy))
    .filter((s) => s && s.tagName === 'SECTION');
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

  /* ---------- Copy to clipboard ---------- */
  const toast = d.getElementById('toast');
  let toastTimer;
  const say = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  d.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        say('Email address copied');
      } catch (_) {
        const ta = d.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        d.body.appendChild(ta); ta.select();
        let ok = false;
        try { ok = d.execCommand('copy'); } catch (_) { ok = false; }
        ta.remove();
        say(ok ? 'Email address copied' : 'Copy failed. The address is ' + text);
      }
    });
  });
})();
