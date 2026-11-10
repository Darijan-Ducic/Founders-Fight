import assert from 'node:assert/strict';
import test from 'node:test';
import { act, chargeReach, createDuel, MAX_CHARGE, ROUND_SECONDS, stepDuel, weapons } from '../public/arcade/duel.js';

function setup(playerId, opponentId, distance) {
  const duel = createDuel({}, {}, playerId, opponentId);
  duel.player.x = 80;
  duel.opponent.x = duel.player.x + distance;
  return duel;
}

test('each signature weapon winds up, lands one hit and recovers', () => {
  assert.equal(new Set(Object.values(weapons).map(({ type }) => type)).size, 8);
  for (const [id, weapon] of Object.entries(weapons)) {
    const distance = weapon.type === 'slam' || weapon.type === 'bolt' || weapon.type === 'orb' ? 90 : 40;
    const duel = setup(id, 'page', distance);
    duel.opponent.cooldown = 5;

    assert.equal(act(duel, 'attack'), true, id);
    assert.equal(act(duel, 'attack'), false, id);
    stepDuel(duel, weapon.windup - .03);
    assert.equal(duel.opponent.hp, duel.opponent.maxHp, id);
    assert.equal(duel.player.phase, 'windup', id);
    stepDuel(duel, .06);
    assert.equal(duel.player.phase, 'recovery', id);
    assert.equal(duel.player.struck, true, id);
    stepDuel(duel, 1.5);
    const damage = weapon.projectile?.damage ?? weapon.damage;
    assert.equal(duel.opponent.hp, duel.opponent.maxHp - damage, id);
    assert.equal(duel.player.phase, 'ready', id);
    assert.equal(duel.projectiles.length, 0, id);
  }
});

test('Super Search returns after contact and waits for the catch before rearming', () => {
  const duel = setup('page', 'sam', 95);
  duel.opponent.speed = 0;
  duel.opponent.cooldown = 10;
  assert.equal(act(duel, 'attack'), true);
  stepDuel(duel, weapons.page.windup + weapons.page.recovery + .02);
  assert.equal(duel.player.phase, 'ready');
  assert.equal(duel.opponent.hp, duel.opponent.maxHp - weapons.page.damage);
  assert.equal(duel.projectiles.length, 1);
  assert.equal(act(duel, 'attack'), false);

  stepDuel(duel, 1.2, -1);
  assert.ok(duel.player.x < 80);
  assert.equal(duel.opponent.hp, duel.opponent.maxHp - weapons.page.damage);
  assert.equal(duel.projectiles.length, 0);
  assert.equal(act(duel, 'attack'), true);
});

test('an empowered Index Disc turns at the arena edge and returns to a jumping owner', () => {
  const duel = setup('page', 'sam', 50);
  duel.player.x = 392;
  duel.opponent.x = 442;
  duel.opponent.speed = 0;
  duel.opponent.cooldown = 10;
  duel.player.charge = MAX_CHARGE;

  assert.equal(act(duel, 'ultimate'), true);
  for (let i = 0; i < 160 && !duel.projectiles[0]?.returning; i++) stepDuel(duel, 1 / 120);
  const disc = duel.projectiles[0];
  assert.ok(disc?.returning && disc.ultimate);
  assert.ok(disc.x + disc.radius <= 480 + 1e-6);
  assert.equal(act(duel, 'jump'), true);
  stepDuel(duel, .85, -1);
  assert.equal(duel.projectiles.length, 0);
});

test('a charge travels before contact and lands only within its advertised reach', () => {
  const { windup, range, damage, advance } = weapons.elon;
  for (const offset of [0, 1]) {
    const duel = setup('elon', 'page', range + offset);
    const start = duel.player.x;
    duel.opponent.cooldown = 5;
    assert.equal(act(duel, 'attack'), true);
    assert.equal(chargeReach(duel.player), range);
    stepDuel(duel, windup - .18);
    assert.equal(duel.player.x, start);
    stepDuel(duel, .10);
    assert.ok(duel.player.x > start && duel.player.x < start + advance);
    assert.ok(Math.abs(duel.player.x + chargeReach(duel.player) - start - range) < 1e-6);
    assert.equal(duel.opponent.hp, duel.opponent.maxHp);
    stepDuel(duel, .09);
    assert.ok(Math.abs(duel.player.x - start - advance) < 1e-6);
    assert.equal(duel.opponent.hp, offset === 0 ? duel.opponent.maxHp - damage : duel.opponent.maxHp);
  }
});

test('the charge tell follows the remaining reach while moving during windup', () => {
  const duel = setup('elon', 'dario', 185);
  duel.opponent.speed = 0;
  duel.opponent.cooldown = 5;
  duel.player.charge = MAX_CHARGE;
  act(duel, 'ultimate');
  const originalTip = duel.player.x + chargeReach(duel.player);
  assert.ok(originalTip < duel.opponent.x);
  stepDuel(duel, .6, 1);
  assert.ok(duel.player.x + chargeReach(duel.player) > duel.opponent.x);
  stepDuel(duel, .051, 1);
  assert.equal(duel.opponent.hp, duel.opponent.maxHp - weapons.elon.ultimateAttack.damage);
});

test('heavy contact gives more recoil than a baton hit and the arena bounds hold', () => {
  const pushes = [];
  for (const id of ['sam', 'bezos']) {
    const duel = setup(id, 'page', 39);
    duel.opponent.cooldown = 5;
    const start = duel.opponent.x;
    act(duel, 'attack');
    stepDuel(duel, weapons[id].windup);
    const impact = duel.effects.find(({ type }) => type === 'hit');
    assert.equal(impact.damage, weapons[id].damage);
    assert.equal(duel.opponent.x, start, 'recoil starts on the next physics step');
    stepDuel(duel, .06);
    assert.ok(duel.opponent.x > start && duel.opponent.x < start + impact.push);
    stepDuel(duel, .24);
    assert.ok(Math.abs(duel.opponent.x - start - impact.push) < 1e-6);
    pushes.push(impact.push);
  }
  assert.ok(pushes[1] > pushes[0]);

  const corner = setup('bezos', 'page', 39);
  corner.player.x = 404;
  corner.opponent.x = 443;
  corner.opponent.cooldown = 5;
  act(corner, 'attack');
  stepDuel(corner, .95);
  assert.equal(corner.opponent.x, 447);
  assert.equal(corner.opponent.recoil, 0);
});

test('ground-wave feedback matches the collision height and actual damage on KO', () => {
  const duel = setup('bezos', 'page', 100);
  duel.opponent.cooldown = 5;
  duel.opponent.hp = 6;
  act(duel, 'attack');
  stepDuel(duel, 1.2);
  const hit = duel.effects.find(({ type }) => type === 'hit');
  assert.deepEqual(duel.result, { winner: 'player', reason: 'ko' });
  assert.equal(hit.damage, 6);
  assert.equal(hit.y, 214);
});

test('every rival can attack on reaching its stance without a rounding stall', () => {
  for (const opponent of Object.keys(weapons)) {
    const duel = createDuel({}, {}, 'sam', opponent, 3);
    stepDuel(duel, 6);
    assert.ok(duel.player.hp < duel.player.maxHp, opponent);
  }
});

test('a well-timed jump clears a visible energy bolt', () => {
  const grounded = setup('sam', 'dario', 124);
  const jumping = setup('sam', 'dario', 124);
  for (const duel of [grounded, jumping]) {
    duel.opponent.cooldown = 0;
    stepDuel(duel, .72);
    assert.equal(duel.projectiles.length, 1);
  }
  assert.equal(act(jumping, 'jump'), true);
  assert.equal(act(jumping, 'jump'), false);
  stepDuel(grounded, .52);
  stepDuel(jumping, .52);
  assert.ok(grounded.player.hp < grounded.player.maxHp);
  assert.equal(jumping.player.hp, jumping.player.maxHp);
});

test('a cross-up avoids a strike aimed before the jump', () => {
  const duel = setup('sam', 'ellison', 24);
  duel.opponent.cooldown = 0;
  stepDuel(duel, .05);
  assert.equal(duel.opponent.phase, 'windup');
  assert.equal(act(duel, 'jump'), true);
  stepDuel(duel, .43, 1);
  assert.ok(duel.player.x > duel.opponent.x);
  assert.equal(duel.opponent.facing, -1);
  assert.equal(duel.player.hp, duel.player.maxHp);
});

test('each ultimate consumes a full meter only when accepted and lands an empowered strike', () => {
  assert.equal(new Set(Object.values(weapons).map(({ ultimate }) => ultimate)).size, 8);
  for (const [id, weapon] of Object.entries(weapons)) {
    const distance = weapon.projectile ? 93 : 40;
    const duel = setup(id, 'page', distance);
    duel.opponent.cooldown = 5;

    assert.equal(act(duel, 'ultimate'), false, id);
    duel.player.charge = MAX_CHARGE;
    assert.equal(act(duel, 'attack'), true, id);
    assert.equal(act(duel, 'ultimate'), false, id);
    assert.equal(duel.player.charge, MAX_CHARGE, id);
    // Use a separate round to exercise the ultimate without the normal strike.
    const charged = setup(id, 'page', distance);
    charged.opponent.cooldown = 5;
    charged.player.charge = MAX_CHARGE;
    assert.equal(act(charged, 'ultimate'), true, id);
    assert.equal(charged.player.charge, 0, id);
    assert.equal(charged.player.ultimate, true, id);
    stepDuel(charged, weapon.windup + .2);
    assert.equal(charged.opponent.hp, charged.opponent.maxHp, id);
    assert.equal(charged.player.phase, 'windup', id);
    stepDuel(charged, .1);
    assert.ok(charged.effects.some(({ type, ultimate }) => type === 'ultimate' && ultimate), id);
    if (id === 'dario') {
      const volley = charged.projectiles.filter(({ ultimate }) => ultimate);
      assert.equal(volley.length, 3);
      assert.equal(new Set(volley.map(({ y }) => y)).size, 3);
    }
    stepDuel(charged, 1.5);
    assert.ok(charged.opponent.hp < charged.opponent.maxHp - weapon.damage, id);
    assert.equal(charged.player.ultimate, false, id);
  }
});

test('ordinary hits charge the ultimate during a round and the next round starts empty', () => {
  const duel = setup('dario', 'page', 90);
  duel.opponent.cooldown = 10;
  assert.equal(duel.player.charge, 0);
  for (let i = 0; i < 4; i++) {
    assert.equal(act(duel, 'attack'), true);
    stepDuel(duel, 1.2);
  }
  assert.equal(duel.player.charge, MAX_CHARGE);
  assert.ok(duel.opponent.hp > 0);
  assert.equal(setup('dario', 'page', 90).player.charge, 0);
});

test('a KO or timeout finalizes the round once and a new round restores both fighters', () => {
  const knockout = setup('sam', 'napoleon', 32);
  knockout.opponent.hp = weapons.sam.damage;
  act(knockout, 'attack');
  stepDuel(knockout, .5);
  assert.deepEqual(knockout.result, { winner: 'player', reason: 'ko' });
  const elapsed = knockout.elapsed;
  stepDuel(knockout, 10);
  assert.equal(knockout.elapsed, elapsed);
  assert.equal(act(knockout, 'jump'), false);

  const timeout = setup('bezos', 'buffett', 300);
  timeout.opponent.cooldown = ROUND_SECONDS + 1;
  assert.equal(timeout.player.hp, timeout.player.maxHp);
  assert.equal(timeout.opponent.hp, timeout.opponent.maxHp);
  assert.equal(timeout.remaining, ROUND_SECONDS);
  stepDuel(timeout, ROUND_SECONDS);
  assert.deepEqual(timeout.result, { winner: 'draw', reason: 'time' });
});
