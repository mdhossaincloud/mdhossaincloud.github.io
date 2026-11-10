/* CCTV storage calculator: Storage (GB) = Mbps x 3600 x hours x days / 8 / 1000 per camera. */
(() => {
  'use strict';
  const box = document.getElementById('cctv-calc');
  if (!box) return;
  const total = document.getElementById('calc-total');
  const detail = document.getElementById('calc-detail');
  const num = (n) => { const v = parseFloat(box.querySelector(`[name="${n}"]`).value); return isFinite(v) && v > 0 ? v : 0; };
  const nf = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
  const nf0 = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
  const show = (gb) => gb >= 1000 ? nf.format(gb / 1000) + ' TB' : nf0.format(gb) + ' GB';
  function update() {
    const per = num('rate') * 3600 * Math.min(24, num('hours')) * num('days') / 8 / 1000;
    const all = per * num('cams');
    total.textContent = show(all);
    detail.textContent = `${show(per)} per camera · ${show(all * 1.2)} with 20% headroom`;
  }
  box.addEventListener('input', update);
  update();
})();
