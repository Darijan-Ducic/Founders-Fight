import { drawBossBody, loadBossArt } from './boss-art.js';
import { chapters, chapterNumber } from './roster.js';

const lineup = document.getElementById('lineup');
const status = document.getElementById('lineup-status');
const scroller = document.getElementById('lineup-scroller');
const walk = document.getElementById('walk-cycle');
const zoomIn = document.getElementById('zoom-in');
const zoomOut = document.getElementById('zoom-out');
const zoomLevel = document.getElementById('zoom-level');
const pixelsPerMeter = 132;
const minZoom = 75;
const maxZoom = 175;
const zoomStep = 25;
let zoom = 100;

function setZoom(value) {
  zoom = Math.max(minZoom, Math.min(maxZoom, value));
  lineup.style.setProperty('--lineup-zoom', zoom / 100);
  zoomLevel.value = `${zoom}%`;
  zoomOut.disabled = zoom === minZoom;
  zoomIn.disabled = zoom === maxZoom;
}

function opponentColumn(chapter, sprite, index) {
  const figure = document.createElement('figure');
  figure.className = 'opponent';
  figure.style.setProperty('--accent', chapter.accent);
  const round = document.createElement('span');
  round.className = 'opponent-round';
  round.textContent = chapterNumber(index);
  round.setAttribute('aria-hidden', 'true');

  const body = document.createElement('canvas');
  body.width = 184;
  body.height = 276;
  body.setAttribute('aria-hidden', 'true');
  const context = body.getContext('2d');
  context.translate(body.width / 2, body.height);
  context.imageSmoothingEnabled = false;

  const caption = document.createElement('figcaption');
  const name = document.createElement('strong');
  name.textContent = chapter.name;
  const stature = document.createElement('b');
  stature.textContent = `≈${Math.round(chapter.stature * 100)} cm`;
  const evidence = document.createElement('small');
  evidence.textContent = chapter.evidence;
  caption.append(name, stature, evidence);
  figure.append(round, body, caption);

  const height = Math.round(chapter.stature * pixelsPerMeter);
  const paint = phase => {
    context.clearRect(-body.width / 2, -body.height, body.width, body.height);
    drawBossBody(context, sprite, height, phase);
  };
  return { figure, paint };
}

async function loadLineup() {
  const sprites = await loadBossArt();
  const columns = chapters.map((chapter, index) => opponentColumn(chapter, sprites[index], index));
  lineup.replaceChildren(...columns.map(({ figure }) => figure));
  const paint = phase => columns.forEach(column => column.paint(phase));
  paint();

  let frame = 0;
  let started;
  function animate(time) {
    started ??= time;
    paint((time - started) / 920);
    frame = requestAnimationFrame(animate);
  }
  walk.addEventListener('click', () => {
    const playing = frame === 0;
    walk.setAttribute('aria-pressed', String(playing));
    if (playing) {
      started = undefined;
      frame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      paint();
    }
  });

  zoomIn.addEventListener('click', () => setZoom(zoom + zoomStep));
  zoomOut.addEventListener('click', () => setZoom(zoom - zoomStep));
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === '+' || event.key === '=') setZoom(zoom + zoomStep);
    else if (event.key === '-' || event.key === '−') setZoom(zoom - zoomStep);
  });
  setZoom(100);
  status.hidden = true;
  scroller.hidden = false;
  walk.parentElement.hidden = false;
}

loadLineup().catch(() => {
  status.textContent = 'The historical opponents could not load. Reload to try again.';
});
