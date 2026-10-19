/* ============================================================
   Cyber Command v2 — interactions
   ============================================================ */
(() => {
  const d = document;
  const r = d.documentElement;
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;

  r.classList.add('js');

  /* ---------- Theme ---------- */
  try {
    const saved = localStorage.getItem('th');
    if (saved) r.dataset.theme = saved;
  } catch (_) {}

  const themeBtn = d.getElementById('theme');
  themeBtn?.addEventListener('click', () => {
    const isDark = r.dataset.theme
      ? r.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = isDark ? 'light' : 'dark';
    r.dataset.theme = next;
    try { localStorage.setItem('th', next); } catch (_) {}
    dispatchEvent(new Event('resize'));
  });

  /* ---------- Scroll progress bar ---------- */
  const progress = d.getElementById('progress');
  const updateProgress = () => {
    const max = d.documentElement.scrollHeight - innerHeight;
    const pct = max > 0 ? (scrollY / max) * 100 : 0;
    progress.style.width = pct + '%';
  };
  addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- Navbar shrink on scroll ---------- */
  const nav = d.getElementById('nav');
  addEventListener('scroll', () => {
    nav.classList.toggle('sc', scrollY > 20);
  }, { passive: true });

  /* ---------- Section reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  d.querySelectorAll('.rv').forEach((el) => io.observe(el));

  /* ---------- Nav active-link spy ---------- */
  const links = [...d.querySelectorAll('.links a')];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((a) =>
          a.getAttribute('href') === '#' + e.target.id
            ? a.setAttribute('aria-current', 'true')
            : a.removeAttribute('aria-current')
        );
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  d.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));

  /* ---------- Stat count-up ---------- */
  if (!rm) {
    d.querySelectorAll('[data-n]').forEach((el) => {
      const target = +el.dataset.n;
      let start = null;
      el.textContent = '0';
      const step = (ts) => {
        start = start ?? ts;
        const p = Math.min((ts - start) / 900, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- Cursor spotlight in hero ---------- */
  if (canHover && !rm) {
    const hero = d.querySelector('.hero');
    if (hero) {
      hero.addEventListener('mousemove', (e) => {
        const b = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (e.clientX - b.left) + 'px');
        hero.style.setProperty('--my', (e.clientY - b.top) + 'px');
      });
    }
  }

  /* ---------- Magnetic buttons ---------- */
  if (canHover && !rm) {
    d.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const b = btn.getBoundingClientRect();
        const x = (e.clientX - b.left - b.width / 2) * 0.18;
        const y = (e.clientY - b.top - b.height / 2) * 0.18;
        btn.style.transform = `translate(${x}px, ${y}px) translateY(-2px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- Diagram interactions ---------- */
  const INFO = {
    m365: 'Cloud services such as email and identity. Admin work covers accounts, groups, licences and access.',
    net: 'The public network. Offices reach cloud services and each other through ISP links — link health and ISP coordination matter.',
    fw: 'Controls which traffic may enter or leave a network. Good rules keep services reachable and everything else out.',
    rt: 'Routes traffic between networks and links offices together. One routing change can affect a whole site.',
    sw: 'Connects wired devices and separates traffic with VLANs, so a problem in one segment stays contained.',
    wf: 'Wireless access points. Coverage, channel planning and authentication decide how reliable Wi-Fi feels.',
    us: 'Workstations, laptops and printers. Most support work ends here: setup, access, updates and troubleshooting.',
    cc: 'IP cameras recording to NVRs. They need a stable network, enough storage and regular preventive checks.'
  };

  const info = d.getElementById('info');
  const nodes = [...d.querySelectorAll('.nd')];
  nodes.forEach((node) => {
    const activate = () => {
      nodes.forEach((n) => n.classList.remove('on'));
      node.classList.add('on');
      if (info) info.textContent = INFO[node.dataset.k] || '';
    };
    node.addEventListener('mouseenter', activate);
    node.addEventListener('focus', activate);
    node.addEventListener('click', activate);
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });

  /* ---------- Copy email ---------- */
  const cpBtn = d.getElementById('cp');
  cpBtn?.addEventListener('click', async () => {
    const original = cpBtn.textContent;
    try {
      await navigator.clipboard.writeText('mdhossain.cloud@gmail.com');
      cpBtn.textContent = 'Copied ✓';
    } catch (_) {
      cpBtn.textContent = 'mdhossain.cloud@gmail.com';
    }
    setTimeout(() => { cpBtn.textContent = original; }, 2200);
  });

  /* ---------- Canvas particle network ---------- */
  function initNetwork(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, particles = [], visible = true, pulse = null;

    function resize() {
      const k = devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * k;
      canvas.height = h * k;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      const count = Math.max(12, Math.min(32, (w * h / 16000) | 0));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18
      }));
    }

    function draw() {
      const style = getComputedStyle(r);
      const acc = style.getPropertyValue('--acc').trim();
      const ln = style.getPropertyValue('--ln').trim();
      const edges = [];
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          if (dx * dx + dy * dy < 18000) {
            edges.push([particles[i], particles[j]]);
          }
        }
      }

      ctx.strokeStyle = ln;
      ctx.lineWidth = 1;
      edges.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      ctx.fillStyle = acc;
      ctx.globalAlpha = 0.5;
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (!rm) {
        if (!pulse && edges.length && Math.random() < 0.015) {
          pulse = { edge: edges[(Math.random() * edges.length) | 0], t: 0 };
        }
        if (pulse) {
          const [a, b] = pulse.edge;
          pulse.t += 0.02;
          ctx.beginPath();
          ctx.arc(
            a.x + (b.x - a.x) * pulse.t,
            a.y + (b.y - a.y) * pulse.t,
            4, 0, Math.PI * 2
          );
          ctx.fill();
          if (pulse.t >= 1) pulse = null;
        }

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        });
      }
    }

    function loop() {
      if (visible) draw();
      requestAnimationFrame(loop);
    }

    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(canvas);
    addEventListener('resize', () => { resize(); draw(); });
    resize();
    draw();
    if (!rm) loop();
  }

  initNetwork(d.getElementById('c1'));
  initNetwork(d.getElementById('c2'));
})();
