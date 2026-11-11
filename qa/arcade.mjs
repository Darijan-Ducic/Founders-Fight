import assert from 'node:assert/strict';
import { chromium, devices } from 'playwright';
import { ROUND_SECONDS, weapons as loadouts } from '../public/arcade/duel.js';
import { chapters } from '../public/arcade/history/roster.js';

const url = process.env.ARCADE_URL ?? 'http://127.0.0.1:5173/arcade/';
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
const observe = page => page.on('pageerror', error => errors.push(error.message));

async function trackDuel(page) {
  // Read actual fight state in QA without adding a debug API to the game.
  await page.route('**/arcade/history/duel.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `
      export * from './duel.js?qa-source';
      import { startDuel as create } from './duel.js?qa-source';
      export function startDuel(...args) {
        const duel = create(...args);
        window.__qaDuel = duel;
        return duel;
      }
    `,
  }));
}

async function assertArenaFits(page, viewport) {
  await page.setViewportSize(viewport);
  await page.clock.runFor(48);
  assert.ok(await page.evaluate(() => {
    const arena = document.querySelector('#arena').getBoundingClientRect();
    const canvas = document.querySelector('#stage');
    const stage = canvas.getBoundingClientRect();
    const chargeRows = [...document.querySelectorAll('.ultimate-status')];
    const weapon = document.querySelector('#boss-weapon');
    return arena.width === innerWidth && arena.height === innerHeight
      && stage.width === innerWidth && stage.height >= innerHeight * .65
      && Math.abs(canvas.width / canvas.height - stage.width / stage.height) < .025
      && chargeRows.every(row => row.scrollWidth <= row.clientWidth + 1)
      && weapon.getBoundingClientRect().right <= innerWidth
      && document.documentElement.scrollWidth === innerWidth
      && document.documentElement.scrollHeight === innerHeight;
  }), 'the arena fits ' + JSON.stringify(viewport));
}

function playerState(page) {
  return page.evaluate(() => {
    const { x, y, phase, ultimate } = window.__qaDuel.player;
    return { x, y, phase, ultimate };
  });
}

async function assertFighterPantsStayJoined(page) {
  const torn = await page.evaluate(async () => {
    const { loadFighterArt, roster } = await import('./art.js');
    const { drawFittedFighter, spriteDensity } = await import('./fighter-sprites.js');
    const sprites = await loadFighterArt();
    return sprites.flatMap((sprite, index) => {
      const { width, height } = sprite.canvas;
      const padding = 16;
      const pose = document.createElement('canvas');
      pose.width = width + 2 * padding;
      pose.height = height + 2 * padding;
      const c = pose.getContext('2d', { willReadFrequently: true });
      const top = padding + sprite.hips;
      const rows = Math.floor((height - sprite.hips) / 2);
      function joinedDepth(moving, time) {
        c.clearRect(0, 0, pose.width, pose.height);
        c.setTransform(spriteDensity, 0, 0, spriteDensity, padding + sprite.axis, padding + height);
        drawFittedFighter(c, sprite, { moving }, time, false, false);
        c.resetTransform();
        const { data } = c.getImageData(padding + sprite.split - 1, top, 2, rows);
        for (let row = rows - 1; row >= 0; row--) {
          if (data[row * 8 + 3] && data[row * 8 + 7]) return row;
        }
        return -1;
      }
      const standing = joinedDepth(false, 0);
      const walking = joinedDepth(true, Math.PI / 30);
      // The outward step may lift the hips by up to two game pixels.
      return standing >= 0 && walking >= standing - 2 * spriteDensity ? [] : [roster[index].name];
    });
  });
  assert.deepEqual(torn, [], 'every founder keeps the painted pants joined at the widest step');
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await desktop.newPage();
  observe(page);
  await trackDuel(page);
  await page.clock.install();
  await page.goto(url, { waitUntil: 'networkidle' });
  assert.equal(await page.title(), 'Founders Fight');
  await assertFighterPantsStayJoined(page);

  const backdropUrl = () => page.locator('#arena').evaluate(arena => arena.style.getPropertyValue('--stage-backdrop'));
  const cards = page.locator('#roster .card');
  assert.equal(await cards.count(), 7);
  const weapons = new Set();
  const ultimates = new Set();
  const health = new Set();
  for (const card of await cards.all()) {
    const name = await card.locator('strong').textContent();
    assert.equal(await card.textContent(), name);
    assert.ok(await card.locator('canvas.fighter-portrait').evaluate(canvas =>
      canvas.getContext('2d').getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data[3] === 255), name);
    await card.click();
    assert.equal(await page.locator('#player-name').textContent(), name);
    const hp = await page.locator('#player-hp').evaluate(meter => meter.max);
    health.add(hp);
    weapons.add(await page.locator('#player-weapon').textContent());
    ultimates.add(await page.locator('#ultimate-status').getAttribute('title'));
    await page.getByRole('button', { name: 'Back to fighters' }).click();
    assert.equal(await card.evaluate(button => button === document.activeElement), true);
  }
  assert.equal(weapons.size, 7);
  assert.equal(ultimates.size, 7);
  assert.equal(health.size, 7);
  await page.getByRole('button', { name: /Dario Amodei/ }).press('Enter');
  assert.equal(await page.locator('#stage').getAttribute('aria-label'), 'Duel in ' + chapters[0].place);
  assert.equal(await page.locator('#player-health').textContent(), `${loadouts.dario.maxHp} / ${loadouts.dario.maxHp}`);
  assert.equal(await page.locator('#boss-health').textContent(), `${chapters[0].maxHp} / ${chapters[0].maxHp}`);
  assert.equal(await page.locator('.arena-top').getByText(/\b\d+ DMG\b/).count(), 0);
  assert.equal(await page.locator('#clock').textContent(), String(ROUND_SECONDS));
  assert.equal(await page.locator('#announce').textContent(), '3');
  assert.equal(await page.locator('#round-number').textContent(), 'Round 1 / 7');
  assert.equal(await page.locator('#boss-name').textContent(), 'Ramesses II');
  assert.match(await backdropUrl(), /\/history\/stages\/giza-dawn\.webp/);
  await page.keyboard.press('f');
  assert.equal((await playerState(page)).phase, 'ready');
  assert.deepEqual(await page.locator('#arena button:visible').evaluateAll(buttons => buttons.map(button => button.id)),
    ['back', 'ultimate-status']);
  for (const [side, healthId, ultimateId] of [
    ['.player-score', '#player-hp', '#ultimate-status'],
    ['.opponent-score', '#boss-hp', '#boss-ultimate-status'],
  ]) {
    const name = await page.locator(`${side} .combatant-label`).boundingBox();
    const health = await page.locator(healthId).boundingBox();
    const charge = await page.locator(ultimateId).boundingBox();
    assert.ok(health.y >= name.y + name.height + 6);
    assert.ok(charge.y >= health.y + health.height + 6);
  }
  assert.equal(await page.locator('.arena-top').getByText(chapters[0].place, { exact: true }).count(), 0);
  await assertArenaFits(page, { width: 1280, height: 800 });

  const stage = page.locator('#stage');
  const backdrop = () => stage.evaluate(canvas => {
    const c = canvas.getContext('2d');
    return c.getImageData(canvas.width * .5, canvas.height * .3, 8, 8).data.join(',');
  });
  await page.clock.runFor(3200);
  const temple = await backdrop();
  await page.keyboard.press('+');
  await page.clock.runFor(32);
  assert.notEqual(await backdrop(), temple);
  await page.keyboard.press('-');

  await page.keyboard.press('Escape');
  const dialog = page.getByRole('dialog');
  assert.equal(await dialog.isVisible(), true);
  const pausedClock = await page.locator('#clock').textContent();
  await page.clock.runFor(1400);
  assert.equal(await page.locator('#clock').textContent(), pausedClock);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'choose');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'primary');
  await dialog.getByRole('button', { name: 'Resume', exact: true }).click();

  const ultimate = page.locator('#ultimate-status');
  const bossHp = () => page.locator('#boss-hp').evaluate(meter => meter.value);
  let rivalJumped = false;
  for (let attempt = 0; attempt < 65 && (await ultimate.getAttribute('aria-disabled')) === 'true'; attempt++) {
    if ((await playerState(page)).phase === 'ready') await page.keyboard.press('f');
    await page.clock.runFor(175);
    rivalJumped ||= await page.evaluate(() => window.__qaDuel.opponent.y > 0);
  }
  assert.ok(rivalJumped, 'Ramesses jumps during a real fight');
  assert.equal(await ultimate.getAttribute('aria-disabled'), 'false');
  await page.keyboard.press('g');
  await page.clock.runFor(180);
  assert.ok((await playerState(page)).ultimate);
  assert.ok((await page.locator('#ultimate-charge').evaluate(meter => meter.value)) < 10);
  await page.clock.runFor(510);
  assert.ok(await page.evaluate(() => window.__qaDuel.effects.some(effect => effect.type === 'ultimate')));
  await page.clock.runFor(940);

  async function winRound() {
    for (let attempt = 0; attempt < 72 && !(await dialog.isVisible()); attempt++) {
      if (await ultimate.getAttribute('aria-disabled') === 'false') await page.keyboard.press('g');
      else if ((await playerState(page)).phase === 'ready') await page.keyboard.press('f');
      await page.clock.runFor(175);
    }
    assert.equal(await bossHp(), 0);
    assert.deepEqual(await dialog.getByRole('button').allTextContents(), ['Next Round']);
    const desktopSize = page.viewportSize();
    for (const viewport of [desktopSize, { width: 390, height: 844 }, { width: 568, height: 320 }]) {
      await page.setViewportSize(viewport);
      const panel = await dialog.locator('.dialog').boundingBox();
      assert.ok(panel, 'the victory panel is visible');
      const offsetX = panel.x + (panel.width - viewport.width) / 2;
      const offsetY = panel.y + (panel.height - viewport.height) / 2;
      assert.ok(Math.abs(offsetX) <= 1 && Math.abs(offsetY) <= 1,
        `victory panel offset (${offsetX}, ${offsetY}) px at ${viewport.width} × ${viewport.height}`);
    }
    await page.setViewportSize(desktopSize);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('id'), 'primary');
    await dialog.getByRole('button', { name: 'Next Round', exact: true }).click();
  }
  await winRound();
  assert.equal(await page.locator('#boss-name').textContent(), 'Darius the Great');
  assert.match(await backdropUrl(), /\/history\/stages\/royal-terrace\.webp/);
  assert.equal(await stage.getAttribute('aria-label'), 'Duel in Persepolis Terrace');
  assert.equal(await page.locator('#round-number').textContent(), 'Round 2 / 7');
  assert.equal(await page.locator('#ultimate-charge').evaluate(meter => meter.value), 0);
  await page.clock.runFor(80);
  assert.notEqual(await backdrop(), temple);

  let rivalCast = false;
  for (let step = 0; step < 48 && !(await page.locator('#select').isVisible()); step++) {
    await page.clock.runFor(500);
    if (await page.locator('#boss-ultimate-status').getAttribute('data-state') === 'casting') {
      rivalCast ||= (await page.locator('#boss-warning').textContent()).includes('Ultimate incoming');
    }
  }
  assert.ok(rivalCast, 'Darius charges, telegraphs and casts his Ultimate');
  assert.equal(await page.locator('#select').isVisible(), true);
  assert.match(await page.locator('#campaign-notice').textContent(), /Defeated by Darius the Great in round 2/);
  assert.equal(await page.locator(':focus strong').textContent(), 'Dario Amodei');

  await page.getByRole('button', { name: /Elon Musk/ }).click();
  assert.equal(await page.locator('#round-number').textContent(), 'Round 1 / 7');
  assert.equal(await page.locator('#player-name').textContent(), 'Elon Musk');
  assert.equal(await page.locator('#boss-name').textContent(), 'Ramesses II');
  assert.equal(await page.locator('#player-hp').evaluate(meter => meter.value), loadouts.elon.maxHp);
  assert.equal(await page.locator('#boss-hp').evaluate(meter => meter.value), chapters[0].maxHp);
  await desktop.close();
  console.log('Desktop: distinct stats, rival jump and Ultimate, player Ultimate, round advance and loss reset');

  const { defaultBrowserType: _engine, ...phone } = devices['iPhone 13'];
  const mobile = await browser.newContext(phone);
  const touch = await mobile.newPage();
  observe(touch);
  await trackDuel(touch);
  await touch.clock.install();
  await touch.goto(url);
  await touch.getByRole('button', { name: /Elon Musk/ }).tap();
  await touch.clock.runFor(3200);
  const session = await mobile.newCDPSession(touch);
  const bounds = await touch.locator('#stage').boundingBox();
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const send = (type, touchPoints) => session.send('Input.dispatchTouchEvent', { type, touchPoints });
  const point = (dx = 0, dy = 0, id = 0) => ({ x: center.x + dx, y: center.y + dy, id });

  const beforeDrag = await playerState(touch);
  await send('touchStart', [point()]);
  await send('touchMove', [point(-38)]);
  await touch.clock.runFor(100);
  await send('touchEnd', []);
  assert.ok((await playerState(touch)).x < beforeDrag.x);

  await send('touchStart', [point()]);
  await send('touchMove', [point(0, -45)]);
  await send('touchEnd', []);
  await touch.clock.runFor(100);
  assert.ok((await playerState(touch)).y > 0);

  const points = radius => [point(-radius, 0, 0), point(radius, 0, 1)];
  await send('touchStart', points(28));
  await send('touchMove', points(48));
  await send('touchEnd', []);
  assert.equal((await playerState(touch)).phase, 'ready', 'pinching never attacks');

  await send('touchStart', [point()]);
  await send('touchEnd', []);
  await touch.clock.runFor(32);
  assert.equal((await playerState(touch)).phase, 'windup');
  await session.detach();

  for (const viewport of [
    { width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 568, height: 320 }, { width: 740, height: 360 },
  ]) await assertArenaFits(touch, viewport);

  await touch.getByRole('button', { name: 'Back to fighters' }).tap();
  await touch.getByRole('button', { name: /Larry Ellison/ }).tap();
  await touch.clock.runFor(3200);
  await touch.evaluate(() => { window.__qaDuel.player.charge = 100; });
  await touch.clock.runFor(32);
  assert.equal(await touch.locator('#ultimate-value').textContent(), 'Ready');
  await touch.locator('#ultimate-status').tap();
  await touch.clock.runFor(32);
  assert.ok((await playerState(touch)).ultimate);
  assert.ok((await touch.locator('#ultimate-charge').evaluate(meter => meter.value)) < 10);
  console.log('Touch: tap attack and Ultimate, drag movement, swipe jump, pinch, and full-window layout');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
