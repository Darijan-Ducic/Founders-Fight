import { loadFighterArt, roster } from './art.js';
import { drawFittedFighter, drawFittedPortrait, spriteDensity } from './fighter-sprites.js';

const lineup = document.getElementById('lineup');
const scroller = document.getElementById('lineup-scroller');
const status = document.getElementById('lineup-status');
const zoomIn = document.getElementById('zoom-in');
const zoomOut = document.getElementById('zoom-out');
const zoomLevel = document.getElementById('zoom-level');
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

function makeCanvas(className, width, height) {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  canvas.width = width;
  canvas.height = height;
  canvas.setAttribute('aria-hidden', 'true');
  return canvas;
}

function fighterColumn(profile, sprite) {
  const figure = document.createElement('figure');
  figure.className = 'lineup-fighter';
  const body = makeCanvas('lineup-body', 172, 282);
  const bodyContext = body.getContext('2d');
  bodyContext.translate(body.width / 2, body.height);
  bodyContext.scale(spriteDensity, spriteDensity);
  drawFittedFighter(bodyContext, sprite, {}, 0, false, false);

  const caption = document.createElement('figcaption');
  const name = document.createElement('strong');
  name.textContent = profile.name;
  const stature = document.createElement('span');
  stature.textContent = `≈${sprite.stature} cm`;
  const face = makeCanvas('lineup-face', sprite.portrait.width, sprite.portrait.height);
  drawFittedPortrait(face.getContext('2d'), sprite);
  caption.append(name, stature, face);
  figure.append(body, caption);
  return figure;
}

status.textContent = 'Loading arena sprites…';
try {
  const sprites = await loadFighterArt();
  if (sprites.some(sprite => !sprite)) throw new Error('Missing arena sprite');
  lineup.replaceChildren(...roster.map((profile, index) => fighterColumn(profile, sprites[index])));
  status.hidden = true;
  scroller.hidden = false;
  zoomIn.parentElement.hidden = false;
  setZoom(100);

  zoomIn.addEventListener('click', () => setZoom(zoom + zoomStep));
  zoomOut.addEventListener('click', () => setZoom(zoom - zoomStep));
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === '+' || event.key === '=') setZoom(zoom + zoomStep);
    else if (event.key === '-' || event.key === '−') setZoom(zoom - zoomStep);
  });
} catch {
  status.textContent = 'The arena sprites could not load. Refresh to try again.';
}
