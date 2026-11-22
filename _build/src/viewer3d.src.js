/* Device Explorer 3D viewer (v4.6). Bundled with esbuild into assets/js/viewer3d.js:
     cd _build/src && npm i three esbuild && npx esbuild viewer3d.src.js --bundle --minify --format=esm --outfile=../../assets/js/viewer3d.js
   Drag to rotate, hover to inspect a part, slider to explode. Renders only while visible. */
import { WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, DirectionalLight, HemisphereLight, Group, Box3, Vector3, Raycaster, Vector2, Color, Mesh, BufferAttribute, SRGBColorSpace, ACESFilmicToneMapping } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { MeshStandardMaterial, CylinderGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';


/* ---------- procedural 3D devices (own work, no third-party model) ---------- */
const MAT = (c, o = {}) => { const m = new MeshStandardMaterial({ color: c, roughness: o.r ?? .5, metalness: o.m ?? .1, emissive: o.e || 0, emissiveIntensity: o.ei || 0 }); m.userData.e0 = [m.emissive.clone(), m.emissiveIntensity]; return m; };
const bx = (w, h, d, mt, x, y, z, r = .04) => { const m = new Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), mt); m.position.set(x, y, z); return m; };
const cy = (rt, rb, h, mt, x, y, z, n = 28) => { const m = new Mesh(new CylinderGeometry(rt, rb, h, n), mt); m.position.set(x, y, z); return m; };
const put = (L, gid, dir, ...ms) => ms.forEach(m => { m.userData.gid = gid; m.userData.dir = dir; m.userData.base = m.position.clone(); L.push(m); });
function buildDevice(kind) {
  const L = [], white = MAT(0xeef2f9, { r: .32 }), dark = MAT(0x1c2536, { r: .55 }), green = MAT(0x2f8f6b), silver = MAT(0xc3ccdc, { m: .75, r: .3 }), black = MAT(0x090d16, { r: .7 }),
    led = MAT(0x1dd6a0, { e: 0x1dd6a0, ei: 1.6 }), ledB = MAT(0x4d8dff, { e: 0x4d8dff, ei: 1.6 }), gold = MAT(0xc9862e, { m: .4, r: .4 });
  if (kind === 'router') {
    put(L, 'base', [0, -.55, 0], bx(6, .22, 4, dark, 0, -.5, 0, .1), ...[[-2.5, -1.6], [2.5, -1.6], [-2.5, 1.6], [2.5, 1.6]].map(([x, z]) => cy(.22, .26, .1, black, x, -.66, z, 16)));
    put(L, 'pcb', [0, .4, 0], bx(5.5, .08, 3.5, green, 0, -.3, 0, .02), ...[[-1.8, .8, .8, .5], [1.6, -.9, .7, .6], [-.4, -1.1, .5, .4], [2.0, 1.0, .6, .5]].map(([x, z, w, d]) => bx(w, .08, d, black, x, -.22, z, .02)));
    put(L, 'cpu', [0, 1.0, 0], bx(1.1, .07, 1.3, silver, -.5, -.18, 0, .02), ...Array.from({ length: 8 }, (_, i) => bx(.06, .28, 1.2, silver, -.95 + i * .13, 0, 0, .02)));
    put(L, 'ports', [0, .3, 1.0], bx(3.7, .4, .5, black, -.3, -.05, 1.62, .05), ...Array.from({ length: 5 }, (_, i) => bx(.52, .26, .1, i ? silver : MAT(0xf2b44c, { m: .4 }), -1.85 + i * .68, -.05, 1.9, .03)), ...Array.from({ length: 5 }, (_, i) => bx(.08, .05, .05, i < 3 ? led : ledB, -1.85 + i * .68, .14, 1.9, .01)));
    put(L, 'antennas', [0, 1.5, -.6], ...[-2.2, 0, 2.2].flatMap(x => [bx(.22, .22, .22, dark, x, .25, -1.9, .06), cy(.09, .11, 2.2, black, x, 1.35, -1.95, 14)]));
    put(L, 'cover', [0, 1.7, 0], bx(6, .42, 4, white, 0, .1, 0, .16), ...Array.from({ length: 9 }, (_, i) => bx(3.4, .02, .09, dark, 0, .32, -.9 + i * .22, .01)), ...Array.from({ length: 4 }, (_, i) => bx(.1, .06, .02, i < 3 ? led : ledB, -2.3 + i * .35, .1, 2.02, .01)));
  } else if (kind === 'switch') {
    put(L, 'base', [0, -.5, 0], bx(8, .2, 3.2, dark, 0, -.5, 0, .08));
    put(L, 'pcb', [0, .35, 0], bx(7.4, .07, 2.7, green, 0, -.3, 0, .02), ...[[-2.2, .4, 1, .7], [1.4, -.5, .8, .6]].map(([x, z, w, d]) => bx(w, .08, d, black, x, -.22, z, .02)));
    put(L, 'psu', [-1.6, .9, .6], bx(1.9, .5, 1.5, gold, -2.7, -.0, -.5, .06), cy(.5, .5, .12, black, -2.7, .28, -.5, 18));
    put(L, 'asic', [0, 1.1, 0], bx(1.5, .08, 1.5, silver, .6, -.18, -.2, .02), ...Array.from({ length: 9 }, (_, i) => bx(.05, .3, 1.4, silver, -.1 + i * .17, .0, -.2, .02)));
    put(L, 'sfp', [1.2, .5, 1.1], ...[0, 1].map(i => bx(.7, .34, .6, silver, 3.0, -.05, 1.1 - i * .0 + 0, .03)).map((m, i) => { m.position.x = 2.5 + i * .85; m.position.z = 1.15; return m; }));
    put(L, 'ports', [0, .3, 1.1], ...Array.from({ length: 12 }, (_, i) => bx(.42, .32, .3, black, -3.3 + i * .5, -.05, 1.55, .03)), ...Array.from({ length: 12 }, (_, i) => bx(.07, .04, .04, i % 3 ? led : ledB, -3.3 + i * .5, .14, 1.72, .01)));
    put(L, 'cover', [0, 1.6, 0], bx(8, .4, 3.2, white, 0, .1, 0, .14), ...Array.from({ length: 12 }, (_, i) => bx(4.6, .02, .08, dark, -.6, .31, -1.2 + i * .2, .01)));
  } else {
    put(L, 'base', [0, -.5, 0], cy(2, 2, .18, dark, 0, -.5, 0, 48));
    put(L, 'pcb', [0, .35, 0], cy(1.75, 1.75, .07, green, 0, -.3, 0, 48), bx(.8, .08, .8, black, -.5, -.22, .3, .02), bx(.7, .08, .6, black, .7, -.22, -.4, .02));
    put(L, 'soc', [0, 1.0, 0], bx(.9, .14, .9, silver, -.4, -.12, .2, .03), bx(.5, .1, .5, MAT(0x3dd6e6, { m: .3 }), .9, -.14, -.5, .03));
    put(L, 'antennas', [0, 1.5, 0], ...[0, 1, 2].map(i => { const a = i * 2.094 + .4, m = bx(1.2, .06, .35, MAT(0xb8c2d4, { m: .6 }), Math.cos(a) * 1.15, -.1, Math.sin(a) * 1.15, .02); m.rotation.y = -a; return m; }));
    put(L, 'cover', [0, 2.0, 0], cy(1.9, 2.05, .55, white, 0, .05, 0, 56), cy(.34, .34, .06, led, 0, .35, 0, 24));
  }
  return L;
}

export function createViewer(host, hooks = {}) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const cv = renderer.domElement; cv.className = 'dx-gl'; cv.setAttribute('aria-hidden', 'true'); host.append(cv);
  const scene = new Scene();
  const pm = new PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const key = new DirectionalLight(0xffffff, 1.5); key.position.set(4, 6, 5); scene.add(key, new HemisphereLight(0xbcd0ff, 0x101828, .5));
  const cam = new PerspectiveCamera(32, 1, .1, 100);
  const controls = new OrbitControls(cam, cv);
  Object.assign(controls, { enableZoom: false, enablePan: false, enableDamping: true, dampingFactor: .08, autoRotate: true, autoRotateSpeed: 1.1, minPolarAngle: .3, maxPolarAngle: Math.PI - .5 });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || (() => { try { return localStorage.getItem('dx-still') === '1'; } catch (e) { return false; } })(); if (reduce) controls.autoRotate = false;
  const holder = new Group(); scene.add(holder);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const ray = new Raycaster(), ptr = new Vector2();

  let groups = [], meshes = [], spots = [], spotEls = [], s = 1, t = 0, activeId = null, dragging = false, visible = true, raf = 0, token = 0, hold = 0;
  const hl = new Color(0x3dd6e6);

  function clear() {
    holder.traverse(o => { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach(mt => { for (const k in mt) { if (mt[k] && mt[k].isTexture) mt[k].dispose(); } mt.dispose(); }); } });
    holder.clear(); groups = []; meshes = []; spots = []; spotEls.forEach(e => e.remove()); spotEls = [];
  }
  async function load(url, cfg) {
    const my = ++token; clear();
    const proc = cfg.build ? buildDevice(cfg.build) : null;
    const gltf = proc ? null : await loader.loadAsync(url);
    if (my !== token) return false;
    const root = proc ? new Group() : gltf.scene; holder.add(root); root.updateMatrixWorld(true);
    const list = []; if (!proc) root.traverse(o => { if (o.isMesh) list.push(o); });
    const gs = {}, buckets = new Map();
    if (proc) proc.forEach(m => { holder.add(m); meshes.push(m); (gs[m.userData.gid] ||= { id: m.userData.gid, meshes: [], dir: m.userData.dir }).meshes.push(m); });
    list.forEach(m => {
      const mat = Array.isArray(m.material) ? m.material[0] : m.material, mname = (mat && mat.name) || '';
      const gc = (cfg.groups || []).find(g => g.test(m.name, mname)) || { id: cfg.fallback || 'body', dir: [0, 0, 0] };
      const dir = typeof gc.dir === 'function' ? gc.dir(m.name) : gc.dir;
      const geo = m.geometry.clone();
      ['position', 'normal', 'uv'].forEach(n => { const at = geo.attributes[n]; if (at && !(at.array instanceof Float32Array)) { const f = new Float32Array(at.count * at.itemSize); for (let i = 0; i < at.count; i++) for (let k = 0; k < at.itemSize; k++) f[i * at.itemSize + k] = at.getComponent(i, k); geo.setAttribute(n, new BufferAttribute(f, at.itemSize)); } });
      geo.applyMatrix4(m.matrixWorld);
      const bk = gc.id + '|' + JSON.stringify(dir) + '|' + mat.uuid;
      let bu = buckets.get(bk); if (!bu) { bu = { gid: gc.id, dir, mat, geos: [] }; buckets.set(bk, bu); }
      bu.geos.push(geo);
    });
    /* one draw call per (group, material): keeps hover and explode fast even for 1,000-part models */
    buckets.forEach(bu => {
      bu.geos.forEach(g => { Object.keys(g.attributes).forEach(n => { if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n); }); if (!g.attributes.normal) g.computeVertexNormals(); if (!g.attributes.uv) g.setAttribute('uv', new BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); });
      const idx = bu.geos.filter(g => g.index).length; if (idx && idx !== bu.geos.length) bu.geos = bu.geos.map(g => g.index ? g.toNonIndexed() : g);
      const geo = bu.geos.length === 1 ? bu.geos[0] : mergeGeometries(bu.geos, false); if (!geo) return;
      const mt = bu.mat.clone();
      if (mt.transmission > 0) { mt.transmission = 0; mt.transparent = true; mt.opacity = .22; mt.depthWrite = false; }
      const mesh = new Mesh(geo, mt); mesh.userData.gid = bu.gid; mesh.userData.dir = bu.dir; mesh.userData.base = mesh.position.clone();
      holder.add(mesh); meshes.push(mesh); (gs[bu.gid] ||= { id: bu.gid, meshes: [], dir: bu.dir }).meshes.push(mesh);
    });
    list.forEach(m => m.geometry.dispose());
    root.removeFromParent();
    if (cfg.rot) holder.rotation.set(...cfg.rot); else holder.rotation.set(0, 0, 0);
    holder.scale.setScalar(1); holder.position.set(0, 0, 0); holder.updateMatrixWorld(true);
    const box = new Box3().setFromObject(holder), size = box.getSize(new Vector3()), c = box.getCenter(new Vector3());
    s = 3.6 / Math.max(size.x, size.y, size.z);
    holder.scale.setScalar(s); holder.position.copy(c).multiplyScalar(-s).applyEuler(holder.rotation).add(new Vector3(0, 0, 0));
    /* recentre after rotation using world box */
    holder.updateMatrixWorld(true); const wb = new Box3().setFromObject(holder); holder.position.sub(wb.getCenter(new Vector3()));
    groups = Object.values(gs); spots = cfg.spots || [];
    spots.forEach(sp => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'dx-spot'; b.setAttribute('aria-label', sp.n); b.dataset.id = sp.id;
      b.addEventListener('mouseenter', () => setActive(sp.id, true)); b.addEventListener('focus', () => setActive(sp.id, true));
      b.addEventListener('mouseleave', () => setActive(null, true)); b.addEventListener('click', () => { hooks.onPick && hooks.onPick(sp.id); });
      host.append(b); spotEls.push(b);
    });
    cam.position.set(...(cfg.cam || [4.5, 2.5, 5.3])); controls.target.set(0, 0, 0); controls.update();
    setExplode(0); resize(); start(); return true;
  }
  function setExplode(v) {
    t = v;
    meshes.forEach(m => { const d = m.userData.dir; if (!d) return; m.position.copy(m.userData.base).addScaledVector(new Vector3(d[0], d[1], d[2]), v / s); });
    kick();
  }
  function setActive(id, fromUI) {
    if (id === activeId) return; activeId = id;
    meshes.forEach(m => { const on = id && m.userData.gid === id; (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => { if (mt.emissive) { const e0 = mt.userData.e0; mt.emissive.copy(on ? hl : (e0 ? e0[0] : new Color(0))); mt.emissiveIntensity = on ? .55 : (e0 ? e0[1] : 0); } }); });
    spotEls.forEach(e => e.classList.toggle('is-on', e.dataset.id === id));
    controls.autoRotate = !reduce && !id && !dragging;
    hooks.onActive && hooks.onActive(id); kick();
  }
  const rect = () => cv.getBoundingClientRect();
  function pick(ev) {
    if (dragging || !meshes.length) return;
    const r = rect(); ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, cam); const hit = ray.intersectObjects(meshes, false)[0];
    if (hit) setActive(hit.object.userData.gid); else if (!spotEls.some(e => e.matches(':hover'))) setActive(null);
  }
  let pending = null;
  cv.addEventListener('pointermove', (ev) => { pending = ev; if (!hold) hold = setTimeout(() => { hold = 0; requestAnimationFrame(() => pick(pending)); }, 45); });
  cv.addEventListener('pointerleave', () => { if (!dragging) setActive(null); });
  cv.addEventListener('pointerdown', () => { dragging = true; cv.classList.add('is-drag'); controls.autoRotate = false; });
  addEventListener('pointerup', () => { if (dragging) { dragging = false; cv.classList.remove('is-drag'); controls.autoRotate = !reduce && !activeId; } });
  cv.addEventListener('click', (ev) => { if (activeId && hooks.onPick) hooks.onPick(activeId); });

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); kick();
  }
  new ResizeObserver(resize).observe(host);
  const io = new IntersectionObserver(en => { visible = en[0].isIntersecting; if (visible) kick(); }); io.observe(host);
  const v = new Vector3();
  function frame() {
    raf = 0; controls.update(); renderer.render(scene, cam);
    const w = host.clientWidth, h = host.clientHeight;
    spots.forEach((sp, i) => { v.set(...sp.pos).applyMatrix4(holder.matrixWorld).project(cam); const el = spotEls[i]; el.style.transform = `translate(${((v.x + 1) / 2 * w).toFixed(1)}px, ${((1 - v.y) / 2 * h).toFixed(1)}px)`; el.style.opacity = v.z < 1 ? 1 : 0; });
    if (visible && (controls.autoRotate || dragging || controlsMoving())) raf = requestAnimationFrame(frame);
  }
  let lastAz = 0, lastPol = 0;
  function controlsMoving() { const a = controls.getAzimuthalAngle(), p = controls.getPolarAngle(), mv = Math.abs(a - lastAz) > 1e-4 || Math.abs(p - lastPol) > 1e-4; lastAz = a; lastPol = p; return mv; }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
  function start() { kick(); }
  controls.addEventListener('change', kick);
  return {
    load, setExplode, setActive, resize,
    get active() { return activeId; },
    dispose() { cancelAnimationFrame(raf); renderer.dispose(); cv.remove(); },
    canvas: cv
  };
}
