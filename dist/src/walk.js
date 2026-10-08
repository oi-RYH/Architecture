// The essay is ordinary HTML; neither navigation nor its content waits for WebGL.
const $ = id => document.getElementById(id);
const chapters = [...document.querySelectorAll('[data-chapter]')];
const links = [...document.querySelectorAll('.chapter-nav a')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const names = ['땅과 만나는 자리', '나무가 이어지는 방식', '지붕 아래의 짜임', '다시, 하나의 근정전'];
const captions = ['낮게 바라보기 · 기단과 월대', '연결을 따라 보기 · 목조가구', '올려다보기 · 공포와 처마', '한 걸음 물러서기 · 근정전 전체'];
let scene, scheduled = false, active = -1, positions = [], state = { progress: 0, visible: false };
let loading = false, attempt = 0;
function measure() {
  const scroll = window.scrollY;
  positions = chapters.map(el => el.getBoundingClientRect().top + scroll);
  update();
}
function update() {
  scheduled = false;
  // A small tolerance beyond scroll-padding avoids retaining the previous chapter
  // when mobile anchor positions land on fractional CSS pixels.
  const y = window.scrollY + (innerWidth <= 680 ? 110 : innerHeight * .24);
  const visible = window.scrollY > $('cover').offsetHeight - innerHeight * .35
    && window.scrollY < document.querySelector('.colophon').offsetTop;
  let i = 0;
  while (i < positions.length - 1 && y >= positions[i + 1]) i++;
  const fraction = i < positions.length - 1 ? Math.max(0, Math.min(1, (y - positions[i]) / (positions[i + 1] - positions[i]))) : 0;
  // Hold each observation before traveling into the next one; never auto-advance.
  const travel = Math.max(0, Math.min(1, (fraction - .42) / .5));
  const eased = travel * travel * (3 - 2 * travel);
  const progress = reduced.matches ? i : i + eased;
  state = { progress, visible };
  document.body.classList.toggle('in-story', visible);
  if (active !== i) {
    active = i;
    links.forEach((link, index) => index === i ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    $('stage-number').textContent = `0${i + 1}`;
    $('stage-name').textContent = names[i];
    $('view-caption').textContent = captions[i];
    $('visual-stage').dataset.chapter = String(i);
    if (i !== 3) setExploring(false);
  }
  if (!visible) setExploring(false);
  scene?.setStory(state);
}
function requestUpdate() { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }
function setExploring(value) {
  if (value && !scene) return;
  document.body.classList.toggle('exploring', value);
  $('leave-explore').hidden = !value;
  $('enter-explore').setAttribute('aria-pressed', String(value));
  $('walk-scene').tabIndex = value ? 0 : -1;
  scene?.setInteractive(value);
}
async function connectScene() {
  if (loading) return;
  loading = true;
  const id = ++attempt;
  $('scene-error').hidden = true;
  const timeout = setTimeout(() => { if (id === attempt && !scene) $('scene-error').hidden = false; }, 90000);
  try {
    const { createWalkScene } = await import('./walk-scene.js');
    scene = await createWalkScene($('walk-scene'), { reduced: reduced.matches });
    document.body.classList.add('scene-ready');
    $('scene-error').hidden = true;
    $('explore-tools').hidden = false;
    $('stage-format').textContent = '3D · HERITAGE ASSET 2023';
    scene.setStory(state);
    scene.layers.forEach((layer, index) => {
      const button = document.createElement('button');
      button.textContent = `${String(index + 1).padStart(2, '0')} ${layer.name}`;
      button.dataset.layer = layer.id;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        scene.select(layer.id);
        $('layer-explanation').textContent = layer.description;
        $('layer-buttons').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      });
      $('layer-buttons').append(button);
    });
    $('layer-buttons').querySelector('[data-layer="roof"]').click();
    measure();
  } catch (error) {
    console.error('Walk 3D unavailable', error);
    $('scene-error').hidden = false;
  } finally {
    clearTimeout(timeout);
    loading = false;
  }
}
$('enter-explore').addEventListener('click', () => {
  setExploring(true);
  $('walk-scene').focus({ preventScroll: true });
});
$('leave-explore').addEventListener('click', () => { setExploring(false); $('enter-explore').focus({ preventScroll: true }); });
$('reset-view').addEventListener('click', () => scene?.reset());
$('retry-scene').addEventListener('click', () => location.reload());
addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('exploring')) {
    setExploring(false); $('enter-explore').focus({ preventScroll: true });
  }
});
addEventListener('scroll', requestUpdate, { passive: true });
addEventListener('resize', measure);
reduced.addEventListener('change', () => { scene?.setReduced(reduced.matches); update(); });
new ResizeObserver(measure).observe(document.querySelector('.story'));
document.querySelectorAll('details').forEach(el => el.addEventListener('toggle', measure));
addEventListener('walk-context-lost', () => {
  setExploring(false);
  document.body.classList.remove('scene-ready');
  $('explore-tools').hidden = true;
  $('scene-error').hidden = false;
});
measure();
connectScene();
