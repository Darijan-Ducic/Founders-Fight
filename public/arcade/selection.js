import { roster } from './roster.js';

const grid = document.getElementById('roster');
const status = document.getElementById('selection-status');
const fightStatus = document.getElementById('campaign-loading');
const retry = document.getElementById('campaign-retry');
let campaign;
let starting = false;
let lastFighter;
let reloadRequired = false;

function loadCampaign() {
  campaign ??= import('./game.js').catch(error => {
    reloadRequired = true;
    throw error;
  });
  return campaign;
}

async function chooseFighter(id) {
  if (starting) return;
  starting = true;
  lastFighter = id;
  retry.hidden = true;
  fightStatus.hidden = true;
  grid.setAttribute('aria-busy', 'true');
  const pending = setTimeout(() => {
    fightStatus.textContent = 'Loading the fight…';
    fightStatus.hidden = false;
  }, 180);
  try {
    const { startCampaign } = await loadCampaign();
    await startCampaign(id);
    fightStatus.hidden = true;
  } catch {
    fightStatus.textContent = 'The fight could not load.';
    fightStatus.hidden = false;
    retry.hidden = false;
  } finally {
    clearTimeout(pending);
    grid.removeAttribute('aria-busy');
    starting = false;
  }
}

async function decodeImage(file) {
  const image = new Image();
  image.src = new URL(file, import.meta.url).href;
  await image.decode();
  return image;
}

async function decodePortraitSheet(file) {
  const sheet = await decodeImage(file);
  if (sheet.naturalWidth !== sheet.naturalHeight * roster.length) {
    throw new Error('Invalid portrait sheet dimensions');
  }
  return sheet;
}

function fighterCard(profile, index, sheet, paintFallback) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card';
  card.dataset.fighter = profile.id;
  card.addEventListener('click', () => void chooseFighter(profile.id));

  const portrait = document.createElement('span');
  portrait.className = 'fighter-portrait';
  portrait.setAttribute('aria-hidden', 'true');
  if (sheet) {
    const art = document.createElement('span');
    art.className = 'portrait-art';
    art.style.setProperty('--portrait-position', `${index * 100 / (roster.length - 1)}%`);
    portrait.append(art);
  } else if (paintFallback) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 112;
    paintFallback(canvas, profile, index);
    portrait.append(canvas);
  }
  const name = document.createElement('strong');
  name.textContent = profile.name;
  card.append(portrait, name);
  return card;
}

async function loadSelection() {
  const pending = setTimeout(() => { status.hidden = false; }, 350);
  const [sheet, backdrop] = await Promise.all([
    decodePortraitSheet('./selection-portraits.webp')
      .catch(() => decodePortraitSheet('./selection-portraits.png')).catch(() => null),
    decodeImage('./selection-manifesto.webp').catch(() => null),
  ]);
  const paintFallback = sheet ? null : await import('./art.js').then(art => art.portrait, () => null);
  if (sheet) grid.style.setProperty('--portrait-sheet', `url("${sheet.src}")`);
  grid.append(...roster.map((profile, index) => fighterCard(profile, index, sheet, paintFallback)));
  clearTimeout(pending);
  status.hidden = true;
  document.body.classList.toggle('selection-backdrop-ready', Boolean(backdrop));
  document.body.classList.remove('selection-loading');

  // Let the completed roster paint before preparing the first fight.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    void loadCampaign().then(({ prepareCampaign }) => prepareCampaign()).catch(() => {});
  }));
}

retry.addEventListener('click', () => {
  if (reloadRequired) window.location.reload();
  else void chooseFighter(lastFighter);
});
void loadSelection();
