import { loadFighterArt, portrait, roster } from './art.js';
import { canAttack, MAX_CHARGE, ROUND_SECONDS, weapons } from './duel.js';
import { action, advance, startDuel } from './history/duel.js';
import { chapters, chapterNumber } from './history/roster.js';
import { backdrop, loadStageArt, render } from './history/scene.js';
import { prepareStages } from './stages.js';

const byId = id => document.getElementById(id);
const game = byId('game');
const select = byId('select');
const arena = byId('arena');
const stage = byId('stage');
const menu = byId('menu');
const primary = byId('primary');
const choose = byId('choose');
const announce = byId('announce');
const context = stage.getContext('2d');
const notice = byId('campaign-notice');
const loading = byId('campaign-loading');
const retryLoading = byId('campaign-retry');
const warning = byId('boss-warning');
const playControls = [stage, arena.querySelector('.arena-top')];

const ids = ['sam', 'dario', 'elon', 'ellison', 'page', 'bezos', 'buffett'];
const profiles = Object.fromEntries(ids.map((id, index) => [id, roster[index]]));
const selectionAccents = {
  sam: '#87b5a2',
  dario: '#d97757',
  elon: '#a3adb9',
  ellison: '#c74634',
  page: '#6b9bf0',
  bezos: '#ff9900',
  buffett: '#8b9ec3',
};
const resultHold = .34;
const number = value => String(value).padStart(2, '0');
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hud = Object.fromEntries([
  'clock', 'player-hp', 'boss-hp', 'player-current', 'boss-current',
  'ultimate-charge', 'ultimate-value', 'boss-ultimate-charge', 'boss-ultimate-value',
].map(id => [id, byId(id)]));
const ultimateStatus = byId('ultimate-status');
const bossUltimate = byId('boss-ultimate-status');
const keys = {
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'jump', KeyF: 'attack', KeyG: 'ultimate',
};
const held = new Map();
const fingers = new Map();

let selected = ids[0];
let chapterIndex = 0;
let duel;
let background;
let roundArt = [];
let state = 'select';
let paused = false;
let feedbackAge = 0;
let zoom = 1;
let pinch;
let touchDirection = 0;
let frameId = 0;
let previous;
let nextAction;

const setText = (element, value) => {
  if (element && element.textContent !== String(value)) element.textContent = value;
};

const cards = ids.map((id, index) => {
  const profile = profiles[id];
  const button = document.createElement('button');
  button.type = 'button';
  button.disabled = true;
  button.className = 'card';
  button.style.setProperty('--accent', profile.accent);
  const face = document.createElement('canvas');
  face.className = 'fighter-portrait';
  face.width = face.height = 112;
  face.setAttribute('aria-hidden', 'true');
  const name = document.createElement('strong');
  name.textContent = profile.name;
  button.append(face, name);
  button.addEventListener('click', () => {
    if (state !== 'select') return;
    selected = id;
    startRound(0);
  });
  byId('roster').append(button);
  portrait(face, profile, index);
  return { id, button, face };
});

const selectionSheets = ['selection-backdrops.svg', 'selection-portraits.png'].map(file => {
  const image = new Image();
  image.src = new URL(file, import.meta.url).href;
  return image;
});
Promise.all(selectionSheets.map(image => image.decode())).then(() => {
  const size = selectionSheets[0].naturalHeight;
  if (selectionSheets.some(image => image.naturalHeight !== size || image.naturalWidth !== size * cards.length)) return;
  cards.forEach(({ id, button, face }, index) => {
    face.width = face.height = size;
    const faceContext = face.getContext('2d');
    for (const image of selectionSheets) {
      faceContext.drawImage(image, index * size, 0, size, size, 0, 0, size, size);
    }
    button.style.setProperty('--accent', selectionAccents[id]);
  });
}).catch(() => {
  // Keep the procedural portraits if either selection sheet fails to decode.
});

loadFighterArt().then(() => {
  if (state !== 'select') requestRender();
}).catch(() => {
  // Keep the procedural arena sprites if an atlas fails to decode.
});
async function loadCampaign() {
  loading.hidden = false;
  setText(loading, 'Loading historical opponents…');
  retryLoading.hidden = true;
  try {
    const artwork = chapters.map(async (chapter, index) => {
      const sprite = new Image();
      const extension = index === chapters.length - 1 ? 'svg' : 'webp';
      sprite.src = new URL(`./history/fighters/${chapterNumber(index)}.${extension}`, import.meta.url);
      const [, plate] = await Promise.all([sprite.decode(), loadStageArt(chapter)]);
      return { sprite, plate };
    });
    [roundArt] = await Promise.all([Promise.all(artwork), prepareStages()]);
    for (const { button } of cards) button.disabled = false;
    loading.hidden = true;
  } catch {
    setText(loading, 'The historical opponents could not load.');
    retryLoading.hidden = false;
  }
}

retryLoading.addEventListener('click', loadCampaign);
void loadCampaign();

function clearInput() {
  held.clear();
  touchDirection = 0;
  fingers.clear();
  pinch = undefined;
}

function startRound(index) {
  const chapter = chapters[index];
  const { plate } = roundArt[index];
  const entering = state === 'select';
  chapterIndex = index;
  duel = startDuel(profiles[selected], chapter, selected);
  background = plate ?? backdrop(chapter);
  feedbackAge = 0;
  if (!motion.matches) duel.player.y = 114;
  if (entering) zoom = 1;
  state = 'countdown';
  paused = false;
  previous = undefined;
  clearInput();
  select.hidden = true;
  notice.hidden = true;
  arena.hidden = false;
  game.classList.add('in-fight');
  setMenuOpen(false);
  arena.style.setProperty('--stage-accent', chapter.accent);
  const backdropUrl = plate?.src ?? background.toDataURL('image/webp', .62);
  arena.style.setProperty('--stage-backdrop', `url("${backdropUrl}")`);
  stage.setAttribute('aria-label', 'Duel in ' + chapter.place);
  setText(byId('player-name'), profiles[selected].name);
  setText(byId('boss-name'), chapter.name);
  setText(byId('player-weapon'), weapons[selected].name);
  setText(byId('boss-weapon'), chapter.weapon);
  const ultimateLabel = 'Activate ' + weapons[selected].ultimate + ' (G)';
  ultimateStatus.title = ultimateLabel;
  ultimateStatus.setAttribute('aria-label', ultimateLabel);
  bossUltimate.title = `${chapter.special.name} · ${chapter.special.damage} damage per hit`;
  setText(byId('round-number'), `Round ${index + 1} / ${chapters.length}`);
  hud['player-hp'].max = duel.player.maxHp;
  hud['boss-hp'].max = duel.opponent.maxHp;
  setText(byId('player-total'), ' / ' + duel.player.maxHp);
  setText(byId('boss-total'), ' / ' + duel.opponent.maxHp);
  setText(announce, '3');
  updateHud();
  if (entering) window.scrollTo(0, 0);
  focusStage();
  requestRender();
}

function focusStage() {
  stage.tabIndex = 0;
  stage.focus({ preventScroll: true });
}

function showRoster(message = '') {
  state = 'select';
  chapterIndex = 0;
  duel = undefined;
  nextAction = undefined;
  paused = false;
  clearInput();
  setMenuOpen(false);
  arena.hidden = true;
  game.classList.remove('in-fight');
  select.hidden = false;
  notice.hidden = !message;
  setText(notice, message);
  cards.find(card => card.id === selected)?.button.focus();
  window.scrollTo(0, 0);
}

function setMenuOpen(open) {
  menu.hidden = !open;
  for (const element of playControls) element.inert = open;
}

function showMenu(label, title, detail, action, handler, view = '') {
  setText(byId('menu-label'), label);
  setText(byId('menu-title'), title);
  setText(byId('menu-detail'), detail);
  setText(primary, action);
  menu.dataset.view = view;
  nextAction = handler;
  choose.hidden = state === 'result';
  setMenuOpen(true);
  if (!document.hidden) primary.focus({ preventScroll: true });
}

function togglePause() {
  if (state !== 'countdown' && state !== 'fight') return;
  paused = !paused;
  clearInput();
  if (paused) {
    showMenu('Round on hold', 'Paused', duel.chapter.special.cue, 'Resume', togglePause);
  } else {
    setMenuOpen(false);
    previous = undefined;
    focusStage();
    requestRender();
  }
}

function finishRound() {
  const { winner } = duel.result;
  const { chapter } = duel;
  const round = chapterIndex + 1;
  if (winner !== 'player') {
    const outcome = winner === 'draw' ? `Round ${round} was a draw.` : `Defeated by ${chapter.name} in round ${round}.`;
    showRoster(`${outcome} Choose a fighter and play again.`);
    return;
  }

  state = 'result';
  setText(announce, '');
  const next = chapters[chapterIndex + 1];
  if (next) {
    showMenu(`Round ${round} of ${chapters.length}`, 'You win',
      `Next round against ${next.name} at ${next.place}.`, 'Next Round', () => startRound(chapterIndex + 1), 'round-win');
  } else {
    showMenu(`Round ${round} of ${chapters.length} Cleared`, 'You Won the Game!',
      `${duel.player.fighter.name} defeated all ${chapters.length} historical opponents.`,
      'Choose Fighter', showRoster, 'campaign-win');
  }
}

function incomingAttack() {
  const { opponent, strikeIndex } = duel;
  const { move } = opponent;
  if (state !== 'fight' || paused || !move) return '';
  if (opponent.struck) return move.beats?.[strikeIndex]?.warning ?? '';
  if (move.name) return move.name + ' · Ultimate incoming';
  if (opponent.intent === 'high') return move.projectile ? 'Aimed shot · Jump late' : 'High strike · Stay low';
  return opponent.intent === 'counter' ? 'Counter incoming' : '';
}

function updateHud() {
  const { player, opponent, remaining } = duel;
  const hp = Math.ceil(player.hp);
  const rivalHp = Math.ceil(opponent.hp);
  setText(hud.clock, number(Math.ceil(remaining)));
  if (hud['player-hp'].value !== hp) hud['player-hp'].value = hp;
  if (hud['boss-hp'].value !== rivalHp) hud['boss-hp'].value = rivalHp;
  setText(hud['player-current'], hp);
  setText(hud['boss-current'], rivalHp);
  const cue = incomingAttack();
  setText(warning, cue);
  warning.hidden = !cue;

  const ready = state === 'fight' && !paused && canAttack(duel, player);
  const charge = Math.floor(player.charge);
  const ultimateReady = charge === MAX_CHARGE && ready;
  if (hud['ultimate-charge'].value !== charge) hud['ultimate-charge'].value = charge;
  const chargeLabel = ultimateReady ? 'Ready' : charge === MAX_CHARGE ? 'Full' : charge + '%';
  setText(hud['ultimate-value'], chargeLabel);
  if (ultimateStatus.getAttribute('aria-disabled') !== String(!ultimateReady)) {
    ultimateStatus.setAttribute('aria-disabled', String(!ultimateReady));
  }

  const bossCharge = Math.floor(opponent.charge);
  const bossCasting = opponent.move === duel.chapter.special;
  const bossReady = bossCharge === MAX_CHARGE && duel.elapsed >= duel.tactics.nextUltimate;
  if (hud['boss-ultimate-charge'].value !== bossCharge) hud['boss-ultimate-charge'].value = bossCharge;
  setText(hud['boss-ultimate-value'], bossCasting ? 'Cast' : bossReady ? 'Ready' : bossCharge + '%');
  const bossState = bossCasting ? 'casting' : bossReady ? 'ready' : 'charging';
  if (bossUltimate.dataset.state !== bossState) bossUltimate.dataset.state = bossState;
}

function direction() {
  const input = [...held.values()];
  return Number(input.includes('right') || touchDirection > 0)
    - Number(input.includes('left') || touchDirection < 0);
}

function perform(kind) {
  if (state === 'fight' && !paused) action(duel, kind);
}

function update(dt) {
  if (state === 'countdown') {
    advance(duel, 0, dt);
    const countdown = duel.countdown;
    const fall = Math.max(0, 1 - (3 - countdown) / .58);
    duel.player.y = motion.matches ? 0 : 114 * fall ** 2;
    setText(announce, countdown > 0 ? String(Math.ceil(countdown)) : 'FIGHT!');
    if (countdown === 0) state = 'fight';
  } else if (state === 'fight') {
    advance(duel, direction(), dt);
    if (duel.elapsed >= .65) setText(announce, '');
    if (duel.result) {
      state = 'ending';
      clearInput();
      setText(announce, duel.result.reason === 'ko' ? 'K.O.' : 'TIME UP');
    }
  } else if (state === 'ending') {
    feedbackAge += dt;
    if (feedbackAge >= resultHold) finishRound();
  }
}

function frame(now) {
  frameId = 0;
  if (state === 'select') return;
  const dt = previous === undefined ? 0 : clamp((now - previous) / 1000, 0, .045);
  previous = now;
  if (!paused) update(dt);
  if (state === 'select') return;
  updateHud();
  render(context, duel, background, roundArt[chapterIndex].sprite, zoom, feedbackAge, motion.matches);
  if (!paused && state !== 'result') requestRender();
}

function requestRender() {
  if (!frameId) frameId = requestAnimationFrame(frame);
}

new ResizeObserver(() => {
  if (state !== 'select') requestRender();
}).observe(stage);

function changeZoom(amount) {
  zoom = clamp(zoom + amount, 1, 1.36);
  requestRender();
}

byId('back').addEventListener('click', () => showRoster());
choose.addEventListener('click', () => showRoster());
primary.addEventListener('click', () => nextAction?.());
ultimateStatus.addEventListener('click', () => {
  if (ultimateStatus.getAttribute('aria-disabled') === 'false') perform('ultimate');
  focusStage();
});

document.addEventListener('keydown', event => {
  if (state === 'select' || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === 'Escape') {
    if (!event.repeat) togglePause();
    return;
  }
  if (!menu.hidden && event.key === 'Tab') {
    event.preventDefault();
    (!choose.hidden && document.activeElement === primary ? choose : primary).focus();
    return;
  }
  if (paused || state === 'ending' || state === 'result') return;
  if (event.key === '+' || event.key === '=' || event.key === '-') {
    event.preventDefault();
    changeZoom(event.key === '-' ? -.12 : .12);
  }
  const action = keys[event.code];
  if (!action || (event.code === 'Space' && event.target.closest?.('button'))) return;
  event.preventDefault();
  if (!held.has(event.code)) perform(action);
  if (state === 'fight') held.set(event.code, action);
});
document.addEventListener('keyup', event => held.delete(event.code));
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !paused && (state === 'countdown' || state === 'fight')) togglePause();
  if (!document.hidden && !menu.hidden && state !== 'select') primary.focus({ preventScroll: true });
});

function fingerDistance() {
  const [a, b] = fingers.values();
  return Math.hypot(a.x - b.x, a.y - b.y);
}
// Chrome exposes trackpad pinch as a wheel event with the control flag set.
stage.addEventListener('wheel', event => {
  if (!event.ctrlKey || !menu.hidden) return;
  event.preventDefault();
  changeZoom(-event.deltaY * .008);
}, { passive: false });
stage.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch' || fingers.size >= 2 || !menu.hidden) return;
  stage.setPointerCapture(event.pointerId);
  fingers.set(event.pointerId, {
    x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY,
  });
  if (fingers.size === 2) {
    for (const finger of fingers.values()) finger.gesture = 'pinch';
    pinch = { distance: fingerDistance(), zoom };
    touchDirection = 0;
  }
});
stage.addEventListener('pointermove', event => {
  const finger = fingers.get(event.pointerId);
  if (!finger) return;
  finger.x = event.clientX;
  finger.y = event.clientY;
  if (pinch?.distance > 0) {
    zoom = clamp(pinch.zoom * fingerDistance() / pinch.distance, 1, 1.36);
    requestRender();
    return;
  }
  if (state !== 'fight') return;
  const dx = finger.x - finger.startX;
  const dy = finger.y - finger.startY;
  if (!finger.gesture && Math.abs(dy) >= 22 && Math.abs(dy) > Math.abs(dx)) {
    finger.gesture = 'vertical';
    if (dy < 0) perform('jump');
  }
  if (!finger.gesture && Math.abs(dx) >= 14) finger.gesture = 'move';
  if (finger.gesture === 'move') touchDirection = Math.abs(dx) < 10 ? 0 : Math.sign(dx);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  stage.addEventListener(type, event => {
    const finger = fingers.get(event.pointerId);
    if (!finger) return;
    if (type === 'pointerup' && !finger.gesture
        && Math.hypot(event.clientX - finger.startX, event.clientY - finger.startY) < 14) {
      perform('attack');
    }
    fingers.delete(event.pointerId);
    pinch = undefined;
    touchDirection = 0;
  });
}
setText(hud.clock, number(ROUND_SECONDS));
