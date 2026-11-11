/* Motion polish for the home pages: decoration only, no content is created or changed.
   Everything here is skipped under prefers-reduced-motion, and pages work without it. */
(() => {
  'use strict';
  const d = document;
  const root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const lang = root.lang || 'en';

  /* ---------- 1. Cursor spotlight on cards (hover devices only) ---------- */
  const SPOT = '.svc, .skill-group, .project, .cred, .figures > div';
  if (fine.matches) {
    let raf = 0, last = null;
    d.addEventListener('pointermove', (e) => {
      const el = e.target.closest ? e.target.closest(SPOT) : null;
      if (!el) return;
      last = { el, x: e.clientX, y: e.clientY };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = last.el.getBoundingClientRect();
        last.el.style.setProperty('--mx', (last.x - r.left) + 'px');
        last.el.style.setProperty('--my', (last.y - r.top) + 'px');
      });
    }, { passive: true });
  }

  /* ---------- 2. Magnetic primary buttons ---------- */
  if (fine.matches && !reduce.matches) {
    d.querySelectorAll('.btns .btn, .engage .btn.primary').forEach((b) => {
      b.setAttribute('data-mag', '');
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        b.style.setProperty('--tx', (dx * 6).toFixed(1) + 'px');
        b.style.setProperty('--ty', (dy * 4).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', () => {
        b.style.removeProperty('--tx');
        b.style.removeProperty('--ty');
      });
    });
  }

  if (!reduce.matches && 'IntersectionObserver' in window) {
    /* ---------- 3. Staggered entrance for cards and rows below the fold ---------- */
    const GROUPS = [
      ['.svc-grid > li', true], ['.skill-grid > .skill-group', true],
      ['.projects > .project', false], ['.engage-list > li', false],
      ['.figures > div', false], ['.creds > .cred', false], ['.timeline > .role', false],
    ];
    const reveal = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      reveal.unobserve(el);
      el.classList.add('fx-on');
      if (el.classList.contains('skill-group')) {
        el.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--i', i));
        el.classList.add('boot');
      }
      /* hand the element back to its normal CSS once the entrance is over */
      setTimeout(() => {
        el.classList.remove('fx-in', 'fx-inner', 'fx-on');
        el.style.removeProperty('--d');
      }, 1900);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    GROUPS.forEach(([sel, inner]) => {
      d.querySelectorAll(sel).forEach((el, i) => {
        if (el.getBoundingClientRect().top < innerHeight * 0.98) return;
        el.classList.add('fx-in');
        if (inner) el.classList.add('fx-inner');
        el.style.setProperty('--d', ((i % 4) * 0.08).toFixed(2) + 's');
        reveal.observe(el);
      });
    });

    /* ---------- 4. Figures count up (works with Bengali digits too) ---------- */
    const BN = '০১২৩৪৫৬৭৮৯';
    const countUp = (el, delay) => {
      const orig = el.textContent;
      const m = orig.replace(/[০-৯]/g, (c) => BN.indexOf(c)).match(/^([^0-9]*)(\d+(?:\.\d+)?)(.*)$/);
      if (!m) return;
      const pre = m[1], num = m[2], post = m[3];
      const target = parseFloat(num);
      const dec = (num.split('.')[1] || '').length;
      const nf = new Intl.NumberFormat(lang, { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: false });
      el.textContent = pre + nf.format(0) + post;
      setTimeout(() => {
        const t0 = performance.now(), dur = 1500;
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          el.textContent = pre + nf.format(target * (1 - Math.pow(1 - p, 3))) + post;
          if (p < 1) requestAnimationFrame(tick); else el.textContent = orig;
        };
        requestAnimationFrame(tick);
      }, delay);
    };
    const figs = d.querySelector('.figures');
    if (figs) {
      const fio = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return;
        fio.disconnect();
        figs.querySelectorAll('b').forEach((b, i) => countUp(b, i * 140));
      }, { threshold: 0.4 });
      fio.observe(figs);
    }

    /* ---------- 5. Experience timeline draws itself as you scroll ---------- */
    const tl = d.querySelector('.timeline');
    if (tl) {
      const roles = [...tl.querySelectorAll('.role')];
      let ticking = false;
      const update = () => {
        ticking = false;
        const vh = innerHeight, r = tl.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh * 0.62 - r.top) / r.height));
        tl.style.setProperty('--p', p.toFixed(3));
        roles.forEach((ro) => ro.classList.toggle('passed', ro.getBoundingClientRect().top + 8 < vh * 0.62));
      };
      addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      addEventListener('resize', update);
      update();
    }
  }

  /* ---------- 6. Floating contact button: after the hero, until the contact section ---------- */
  const fab = d.getElementById('fab');
  const contact = d.getElementById('contact');
  if (fab && contact) {
    let t = false;
    const check = () => {
      t = false;
      const show = scrollY > innerHeight * 0.7 && contact.getBoundingClientRect().top > innerHeight * 0.85;
      fab.classList.toggle('show', show);
      fab.tabIndex = show ? 0 : -1;
    };
    addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(check); } }, { passive: true });
    addEventListener('resize', check);
    check();
  }
})();
