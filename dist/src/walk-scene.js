import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LAYERS, MODEL_CONFIG } from './layers.js?v=architecture-2';
import { loadDetailedArchitecture, warmArchitecture } from './model-preload.js?v=architecture-2';
import { disposeArchitecture } from './model-loader.js?v=architecture-2';

// A separate presentation using the unchanged full-detail assets and loader.
// These are editorial observation positions, not a reconstructed walking route.
const POSES = [
  { position: [13, 2.2, 20], target: [0, 1.5, 0] },
  { position: [11, 4.7, 16], target: [0, 4, 0] },
  { position: [9, 2.7, 12.5], target: [0, 4.2, 0] },
  { position: [24, 19, 29], target: [0, 4.3, 0] }
];
export async function createWalkScene(host, { reduced = false } = {}) {
  let renderer, model, controls, observer, frameId;
  let interactive = false, visible = false, dirty = true, progress = 0;
  let explosion = 0, explosionTarget = 0, previousExplosion = -1;
  let width = 1, height = 1, last = performance.now(), disposed = false;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(36, 1, .1, 220);
  const position = new T.Vector3(), target = new T.Vector3();
  const otherPosition = new T.Vector3(), otherTarget = new T.Vector3();
  const offset = new T.Vector3();
  function pose(value) {
    const index = Math.min(3, Math.floor(value));
    const next = Math.min(3, index + 1), t = value - index;
    target.fromArray(POSES[index].target).lerp(otherTarget.fromArray(POSES[next].target), t);
    position.fromArray(POSES[index].position).lerp(otherPosition.fromArray(POSES[next].position), t);
    // Fit portrait hosts without sacrificing source geometry or texture quality.
    const fit = Math.max(1, .9 / camera.aspect);
    position.sub(target).multiplyScalar(fit).add(target);
    camera.position.copy(position);
    controls.target.copy(target);
    controls.update();
    dirty = true;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    observer?.disconnect(); controls?.dispose();
    if (model) disposeArchitecture(model);
    renderer?.dispose(); renderer?.domElement.remove();
  }
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(max-width:680px)').matches ? 1 : 1.5));
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    host.append(renderer.domElement);
    // Capture desktop wheel before OrbitControls: retain the project's established
    // wheel=structure, Ctrl+wheel=zoom convention; native two-finger touch can zoom.
    host.addEventListener('wheel', event => {
      if (!interactive) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1);
      if (event.ctrlKey) zoom(Math.exp(Math.max(-120, Math.min(120, delta)) * .005));
      else explosionTarget = T.MathUtils.clamp(explosionTarget + delta / 1800, 0, 1);
    }, { capture: true, passive: false });
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enableDamping = true;
    controls.dampingFactor = .07;
    controls.minDistance = 4;
    controls.maxDistance = 110;
    controls.maxPolarAngle = Math.PI * .65;
    controls.addEventListener('change', () => { dirty = true; });
    scene.add(new T.HemisphereLight('#d4e6ee', '#8a8580', 2.5));
    const sun = new T.DirectionalLight('#fff0d3', 3.2);
    sun.position.set(10, 20, 12); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 24, bottom: -20, near: 1, far: 65 });
    sun.shadow.bias = -.001; sun.shadow.normalBias = .04;
    scene.add(sun);
    const rim = new T.DirectionalLight('#86b5c3', 1);
    rim.position.set(-12, 12, -8); scene.add(rim);
    const floor = new T.Mesh(new T.PlaneGeometry(180, 180), new T.ShadowMaterial({ color: '#464131', opacity: .11 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.04; floor.receiveShadow = true; scene.add(floor);
    function resize() {
      width = Math.max(1, host.clientWidth); height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix();
      if (!interactive) pose(progress);
      dirty = true;
    }
    observer = new ResizeObserver(resize); observer.observe(host); resize();
    const started = performance.now();
    // Progress remains machine-readable; the visible experience is actual content.
    const report = message => { host.dataset.preparation = message; };
    host.setAttribute('aria-busy', 'true');
    model = await loadDetailedArchitecture({ ...MODEL_CONFIG, renderer }, LAYERS, report);
    scene.add(model.root);
    await warmArchitecture(renderer, scene, camera, model, report);
    host.setAttribute('aria-busy', 'false');
    host.dataset.preloaded = 'true';
    host.dataset.modelLoadMs = String(Math.round(performance.now() - started));
    host.dataset.lod = 'disabled';
    host.dataset.detailLayers = String(model.layers.length);
    host.dataset.textureAudit = JSON.stringify(model.textureAudit);
    delete host.dataset.preparation;
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    host.dataset.triangles = String(renderer.info.render.triangles);
    host.dataset.drawCalls = String(renderer.info.render.calls);
    function zoom(factor) {
      offset.copy(camera.position).sub(controls.target);
      const distance = T.MathUtils.clamp(offset.length() * factor, 4, 110);
      camera.position.copy(controls.target).add(offset.normalize().multiplyScalar(distance));
      controls.update(); dirty = true;
    }
    // Function declaration is hoisted within this block; wheel dispatch only occurs
    // after preparation/activation, so the scene and controls are fully initialized.
    host.addEventListener('keydown', event => {
      if (!interactive || event.ctrlKey || event.metaKey || event.altKey) return;
      if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        offset.copy(camera.position).sub(controls.target).applyAxisAngle(new T.Vector3(0, 1, 0), event.key === 'ArrowLeft' ? -.12 : .12);
        camera.position.copy(controls.target).add(offset); controls.update(); dirty = true;
      } else if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault(); explosionTarget = T.MathUtils.clamp(explosionTarget + (event.key === 'ArrowUp' ? .1 : -.1), 0, 1);
      } else if (['+', '=', '-', '_'].includes(event.key)) {
        event.preventDefault(); zoom(['+', '='].includes(event.key) ? .9 : 1.1);
      } else if (event.key.toLowerCase() === 'r') { event.preventDefault(); reset(); }
    });
    host.setAttribute('aria-label', '근정전 정밀 3D 모델. 드래그 회전, 휠 구조 펼치기, 핀치 또는 Ctrl+휠 확대. 키보드 좌우 회전, 위아래 구조, +와 - 확대, R 초기화, Esc 이야기로 복귀.');
    renderer.domElement.addEventListener('webglcontextlost', event => {
      event.preventDefault(); visible = false; host.dataset.preloaded = 'false';
      dispatchEvent(new Event('walk-context-lost'));
    });
    function frame(now) {
      if (disposed) return;
      frameId = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, .05); last = now;
      if (!visible || document.hidden) return;
      explosion = reduced ? explosionTarget : T.MathUtils.damp(explosion, explosionTarget, 9, dt);
      if (Math.abs(explosion - explosionTarget) < .0001) explosion = explosionTarget;
      if (Math.abs(explosion - previousExplosion) > .00001) {
        const shift = previousExplosion < 0 ? 0 : (explosion - previousExplosion) * 4.9;
        if (interactive) { camera.position.y += shift; controls.target.y += shift; }
        for (const layer of model.layers) layer.group.position.copy(layer.origin).addScaledVector(offset.fromArray(layer.definition.offset), explosion / model.scale);
        previousExplosion = explosion; dirty = true; renderer.shadowMap.needsUpdate = true;
        host.dataset.explosion = explosion.toFixed(3);
      }
      controls.update();
      if (dirty) { renderer.render(scene, camera); dirty = false; }
    }
    function reset() {
      controls.enableDamping = false; controls.update();
      explosionTarget = 0; explosion = 0; previousExplosion = -1;
      pose(interactive ? 3 : progress);
      controls.enableDamping = true;
      dirty = true;
    }
    frameId = requestAnimationFrame(frame);
    addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, { once: true });
    return {
      layers: LAYERS,
      setStory(next) {
        visible = next.visible;
        if (!interactive && Math.abs(progress - next.progress) > .0001) { progress = next.progress; pose(progress); }
        host.dataset.cameraProgress = next.progress.toFixed(3);
      },
      setInteractive(value) {
        if (interactive === value) return;
        interactive = value; controls.enabled = value;
        controls.maxPolarAngle = Math.PI * (value ? .49 : .65);
        if (value) { progress = 3; pose(3); }
        else { reset(); }
        host.dataset.interactive = String(value);
      },
      setReduced(value) { reduced = value; },
      select(id) {
        model.layers.forEach(layer => layer.group.traverse(object => {
          if (!object.isMesh) return;
          for (const material of [].concat(object.material)) if (material.emissive) {
            material.emissive.set(layer.definition.id === id ? '#8c642c' : '#000000');
            material.emissiveIntensity = .035;
          }
        }));
        dirty = true; host.dataset.selected = id;
      },
      reset, dispose
    };
  } catch (error) { dispose(); throw error; }
}
