/* Device Explorer 3D viewer (v4.6). Bundled with esbuild into assets/js/viewer3d.js:
     cd _build/src && npm i three esbuild && npx esbuild viewer3d.src.js --bundle --minify --format=esm --outfile=../../assets/js/viewer3d.js
   Drag to rotate, hover to inspect a part, slider to explode. Renders only while visible. */
import { WebGLRenderer, Scene, PerspectiveCamera, PMREMGenerator, DirectionalLight, HemisphereLight, Group, Box3, Vector3, Raycaster, Vector2, Color, SRGBColorSpace, ACESFilmicToneMapping } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function createViewer(host, hooks = {}) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
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
    holder.clear(); groups = []; meshes = []; spots = []; spotEls.forEach(e => e.remove()); spotEls = [];
  }
  async function load(url, cfg) {
    const my = ++token; clear();
    const gltf = await loader.loadAsync(url);
    if (my !== token) return false;
    const root = gltf.scene; holder.add(root); root.updateMatrixWorld(true);
    const list = []; root.traverse(o => { if (o.isMesh) list.push(o); });
    const gs = {};
    list.forEach(m => {
      const mat = Array.isArray(m.material) ? m.material[0] : m.material, mname = (mat && mat.name) || '';
      const gc = (cfg.groups || []).find(g => g.test(m.name, mname)) || { id: cfg.fallback || 'body', dir: [0, 0, 0] };
      m.material = Array.isArray(m.material) ? m.material.map(x => x.clone()) : m.material.clone();
      holder.attach(m); m.userData.gid = gc.id;
      const dir = typeof gc.dir === 'function' ? gc.dir(m.name) : gc.dir;
      (gs[gc.id] ||= { id: gc.id, meshes: [], dir }); gs[gc.id].meshes.push(m);
      m.userData.dir = dir; m.userData.base = m.position.clone();
      meshes.push(m);
    });
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
    meshes.forEach(m => { const on = id && m.userData.gid === id; (Array.isArray(m.material) ? m.material : [m.material]).forEach(mt => { if (mt.emissive) { mt.emissive.copy(on ? hl : new Color(0)); mt.emissiveIntensity = on ? .55 : 0; } }); });
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
  cv.addEventListener('pointermove', (ev) => { pending = ev; if (!hold) hold = requestAnimationFrame(() => { hold = 0; pick(pending); }); });
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
