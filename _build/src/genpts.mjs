import { NodeIO } from '@gltf-transform/core';
import sharp from 'sharp';
import fs from 'fs';
const io = new NodeIO();
const rnd = (() => { let s = 12345; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
const texCache = new Map();
async function texData(tex) {
  if (texCache.has(tex)) return texCache.get(tex);
  const out = await sharp(Buffer.from(tex.getImage())).ensureAlpha().resize({ width: 256, height: 256, fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  texCache.set(tex, out); return out;
}
const lin2s = (v) => Math.round(255 * Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2));
function mulMat(m, x, y, z) { return [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]]; }
async function cloud(file, N, skip, yFix) {
  const doc = await io.read(file); const tris = []; let totalW = 0;
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue; const M = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial(); const mname = mat ? mat.getName() : ''; if (skip && skip.test(mname)) continue;
      const pos = prim.getAttribute('POSITION').getArray(); const uvA = prim.getAttribute('TEXCOORD_0'); const uv = uvA ? uvA.getArray() : null;
      const idx = prim.getIndices() ? prim.getIndices().getArray() : null; const nT = idx ? idx.length / 3 : pos.length / 9;
      const bf = mat ? mat.getBaseColorFactor() : [.6, .6, .6, 1]; const tex = mat ? mat.getBaseColorTexture() : null;
      const startIdx = tris.length, primTris = []; let primArea = 0, primW = 0;
      for (let t = 0; t < nT; t++) {
        const i0 = idx ? idx[t*3] : t*3, i1 = idx ? idx[t*3+1] : t*3+1, i2 = idx ? idx[t*3+2] : t*3+2;
        const P = [i0, i1, i2].map(i => mulMat(M, pos[i*3], pos[i*3+1], pos[i*3+2]));
        const a = [P[1][0]-P[0][0], P[1][1]-P[0][1], P[1][2]-P[0][2]], b = [P[2][0]-P[0][0], P[2][1]-P[0][1], P[2][2]-P[0][2]];
        const cx = a[1]*b[2]-a[2]*b[1], cy = a[2]*b[0]-a[0]*b[2], cz = a[0]*b[1]-a[1]*b[0]; const area = Math.hypot(cx, cy, cz) / 2; if (area <= 0) continue;
        const w = Math.pow(area, .62); primArea += area; primW += w;
        primTris.push({ P, uv: uv ? [i0, i1, i2].map(i => [uv[i*2], uv[i*2+1]]) : null, w, bf, tex });
      }
      const share = Math.pow(primArea, .55);
      primTris.forEach(t => { t.w = t.w / (primW || 1) * share; tris.push(t); });
    }
  }
  const cum = new Float64Array(tris.length); let acc = 0; tris.forEach((t, i) => { acc += t.w; cum[i] = acc; });
  const pts = [];
  for (let n = 0; n < N; n++) {
    const r = rnd() * acc; let lo = 0, hi = tris.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < r) lo = m + 1; else hi = m; }
    const T = tris[lo]; let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const p = [0, 1, 2].map(k => T.P[0][k] + u * (T.P[1][k] - T.P[0][k]) + v * (T.P[2][k] - T.P[0][k]));
    let col = [lin2s(T.bf[0]), lin2s(T.bf[1]), lin2s(T.bf[2])];
    if (T.tex && T.uv) {
      const tu = (1 - u - v) * T.uv[0][0] + u * T.uv[1][0] + v * T.uv[2][0], tv = (1 - u - v) * T.uv[0][1] + u * T.uv[1][1] + v * T.uv[2][1];
      const d = await texData(T.tex); const X = Math.floor(((tu % 1) + 1) % 1 * (d.info.width - 1)), Y = Math.floor(((tv % 1) + 1) % 1 * (d.info.height - 1)); const o = (Y * d.info.width + X) * 4;
      col = [Math.round(d.data[o] * T.bf[0]), Math.round(d.data[o+1] * T.bf[1]), Math.round(d.data[o+2] * T.bf[2])];
    }
    pts.push({ p, col });
  }
  return norm(pts, yFix);
}
function norm(pts, yFix) {
  const mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9]; pts.forEach(({p}) => p.forEach((v, i) => { mn[i] = Math.min(mn[i], v); mx[i] = Math.max(mx[i], v); }));
  const c = mn.map((v, i) => (v + mx[i]) / 2), s = Math.max(...mx.map((v, i) => v - mn[i]));
  return pts.map(({p, col}) => { let q = p.map((v, i) => (v - c[i]) / s); if (yFix) q = yFix(q); return { p: q, col: lift(col) }; });
}
function lift(c) { const L = (c[0]*.3+c[1]*.59+c[2]*.11); const k = L < 150 ? (150 - L) / 150 * .85 : 0; return [Math.round(c[0]+(120-c[0])*k+12), Math.round(c[1]+(165-c[1])*k+12), Math.round(c[2]+(225-c[2])*k+16)].map(v => Math.min(255, v)); }
/* router from my own boxes (z up in source, converted to y up) */
function boxCloud(parts, N) {
  const pts = []; let tot = 0; const faces = [];
  parts.forEach(pt => { const [w, d, h] = pt.b, [x, y, z] = pt.p; const A = [[w*d,'T'],[w*h,'F'],[d*h,'R'],[w*d,'B'],[w*h,'K'],[d*h,'L']]; A.forEach(([a, f]) => { const wt = Math.pow(a, .75); faces.push({ pt, f, wt }); tot += wt; }); });
  for (let n = 0; n < N; n++) {
    let r = rnd() * tot, F = faces[0]; for (const f of faces) { r -= f.wt; if (r <= 0) { F = f; break; } }
    const [w, d, h] = F.pt.b, [x, y, z] = F.pt.p; const a = rnd(), b = rnd(); let p, sh = 1;
    if (F.f === 'T') { p = [x + a*w, y + b*d, z + h]; sh = 1.25; } else if (F.f === 'B') { p = [x + a*w, y + b*d, z]; sh = .5; }
    else if (F.f === 'F') { p = [x + a*w, y + d, z + b*h]; sh = 1.0; } else if (F.f === 'K') { p = [x + a*w, y, z + b*h]; sh = .6; }
    else if (F.f === 'R') { p = [x + w, y + a*d, z + b*h]; sh = .75; } else { p = [x, y + a*d, z + b*h]; sh = .7; }
    const hex = F.pt.c, base = [1,3,5].map(i => parseInt(hex.slice(i, i+2), 16)); let col = base.map(v => Math.round(Math.min(255, v * sh)));
    /* RJ45 ports (dark teal) and green LEDs on the front */
    if (F.pt.id === 'eth' && F.f === 'F' && b > .2 && b < .75) { const k = Math.floor(a * 5); if ((a * 5 - k) > .15 && (a * 5 - k) < .85) col = [12, 18, 34]; }
    if (F.pt.id === 'cover' && F.f === 'F' && a < .3 && b > .3 && b < .65) col = [79, 211, 157];
    pts.push({ p: [p[0], p[2], p[1]], col });
  }
  return norm(pts, null);
}
const routerParts = [
 { id:'base', b:[8,5,.6], p:[0,0,0], c:'#5f7191' }, { id:'psu', b:[2.6,1.8,.5], p:[.5,.5,.6], c:'#c9862e' }, { id:'pcb', b:[7.2,4.2,.25], p:[.4,.4,1.1], c:'#2f8f6b' },
 { id:'cpu', b:[2.2,2.2,.7], p:[3.2,1.2,1.35], c:'#4d8dff' }, { id:'ram', b:[1.5,1.1,.4], p:[5.9,1.0,1.35], c:'#8b9cff' }, { id:'sw', b:[1.5,1.5,.45], p:[1.0,2.4,1.35], c:'#3dd6e6' },
 { id:'eth', b:[5.6,1.1,1.0], p:[1.0,3.6,1.35], c:'#9aa8c2' }, { id:'cover', b:[8,5,.6], p:[0,0,2.4], c:'#6c7e9f' } ];
const pc = await cloud('/home/mdhossain/3d-models/pc.glb', 3000, /^GlassM$/);
const laptop = await cloud('/home/mdhossain/3d-models/laptop.glb', 2200, null);
const router = boxCloud(routerParts, 2200);
const enc = (arr) => { const pos = new Int16Array(arr.length * 3), col = new Uint8Array(arr.length * 3); arr.forEach((o, i) => { for (let k = 0; k < 3; k++) { pos[i*3+k] = Math.round(o.p[k] * 30000); col[i*3+k] = o.col[k]; } }); return { n: arr.length, p: Buffer.from(pos.buffer).toString('base64'), c: Buffer.from(col.buffer).toString('base64') }; };
const out = { pc: enc(pc), laptop: enc(laptop), router: enc(router) };
const ext = (a) => [0,1,2].map(i => { const v = a.map(o => o.p[i]); return [Math.min(...v).toFixed(2), Math.max(...v).toFixed(2)]; });
console.log('pc', ext(pc), 'laptop', ext(laptop), 'router', ext(router));
fs.writeFileSync('/home/mdhossain/mdhossaincloud.github.io/assets/js/hero-points.js', '/* Hero particle clouds (v4.7): points sampled from the CC BY 4.0 PC and laptop models (see Device Explorer credits) and from the site\'s own router model. Positions Int16 /30000, colours RGB bytes, base64. Generated by _build/src/genpts.mjs. */\nwindow.HERO_PTS=' + JSON.stringify(out) + ';\n');
console.log(fs.statSync('/home/mdhossain/mdhossaincloud.github.io/assets/js/hero-points.js').size);
