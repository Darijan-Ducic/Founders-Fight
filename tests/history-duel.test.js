import assert from 'node:assert/strict';
import { test } from 'node:test';
import { action, advance, startDuel } from '../public/arcade/history/duel.js';
import {
  DEFAULT_HURTBOX, FLOOR, JUMP_GRAVITY, MAX_CHARGE, MAX_HP, ROUND_SECONDS, UNITS_PER_METER, weapons,
} from '../public/arcade/duel.js';
import { chapters } from '../public/arcade/history/roster.js';
import { BOSS_STRIDE_RATIO, footstep } from '../public/arcade/history/gait.js';

const step = 1 / 120;
function tickUntil(duel, condition) {
  for (let i = 0; i < 600 && !condition(); i++) advance(duel, 0, step);
  assert.ok(condition(), `${duel.chapter.name} did not reach the expected combat state`);
}

test('Historical bosses use their listed stature on the founders’ scale', () => {
  for (const chapter of chapters) {
    assert.equal(startDuel({}, chapter).opponent.bodyHeight, chapter.stature * UNITS_PER_METER, chapter.name);
  }
});

test('The supporting foot stays planted as the body advances or backs up', () => {
  for (const phase of [.05, .1, .24, .46, .55, -.82]) {
    for (const distance of [-.002, .002]) {
      const from = footstep(phase);
      const to = footstep(phase + distance);
      assert.equal(from.lift, 0);
      assert.equal(to.lift, 0);
      assert.ok(Math.abs(to.offset - from.offset + distance * BOSS_STRIDE_RATIO) < 1e-9);
    }
  }
  for (let index = 0; index < 24; index++) {
    assert.ok(footstep(index / 24).lift === 0 || footstep(index / 24 + .5).lift === 0);
  }
});

test('Each boss advances its gait on the ground and holds it during a jump', () => {
  for (const chapter of chapters) {
    const duel = startDuel({}, chapter);
    const { player, opponent: boss } = duel;
    player.x = 30;
    boss.x = 450;
    advance(duel, 0, 3);
    assert.equal(boss.gait, 0, chapter.name);

    advance(duel, 0, .12);
    assert.ok(boss.gait > 0 && boss.x < 450, chapter.name);
    const gait = boss.gait;
    const takeoff = boss.x;
    boss.evade = { kind: 'jump', direction: -1, speed: chapter.speed };
    boss.vy = chapter.tactics.jump;
    advance(duel, 0, .12);
    assert.ok(boss.y > 0 && boss.x < takeoff, chapter.name);
    assert.equal(boss.gait, gait, chapter.name);
  }
});

test('Historical bosses reset to distinct health and use their weapon and special damage', () => {
  assert.deepEqual(chapters.map(chapter => chapter.maxHp), [180, 200, 225, 250, 275, 300, 320]);
  for (const chapter of chapters) {
    const duel = startDuel({}, chapter);
    assert.equal(duel.player.hp, MAX_HP);
    assert.equal(duel.player.maxHp, MAX_HP);
    assert.equal(duel.remaining, ROUND_SECONDS);
    assert.equal(duel.opponent.hp, chapter.maxHp);
    assert.equal(duel.opponent.maxHp, chapter.maxHp);
    duel.phase = 'fight';
    duel.player.x = duel.opponent.x - 40;

    tickUntil(duel, () => duel.player.hp < duel.player.maxHp);
    assert.equal(duel.player.hp, duel.player.maxHp - chapter.attack.damage);
    tickUntil(duel, () => duel.opponent.move === chapter.special);
    const before = duel.player.hp;
    tickUntil(duel, () => duel.player.hp < before);
    assert.equal(duel.player.hp, before - chapter.special.damage);
    assert.equal(startDuel({}, chapter).opponent.charge, chapter.tactics.startingCharge ?? 36);
  }
});

test('Landed strikes emit a directional impact and a shield block emits no damage impact', () => {
  const caesar = chapters.find(chapter => chapter.pattern === 'guard');
  const duel = startDuel({}, caesar);
  duel.phase = 'fight';
  duel.player.x = duel.opponent.x - 30;
  action(duel, 'attack');
  tickUntil(duel, () => duel.sparks.some(spark => spark.label === 'BLOCK'));
  assert.equal(duel.opponent.hp, caesar.maxHp);
  assert.equal(duel.sparks.some(spark => spark.kind === 'impact'), false);

  tickUntil(duel, () => duel.player.hp < duel.player.maxHp);
  const impact = duel.sparks.find(spark => spark.kind === 'impact');
  assert.equal(impact.facing, -1);
  assert.equal(impact.label, String(caesar.attack.damage));
  assert.equal(impact.heavy, false);
});

test('Joyeuse Quake travels both ways and Steppe Volley uses three heights', () => {
  const [charlemagne, genghis] = chapters.filter(chapter => ['slam', 'bow'].includes(chapter.pattern));
  for (const chapter of [charlemagne, genghis]) {
    const duel = startDuel({}, chapter);
    duel.phase = 'fight';
    duel.opponent.charge = MAX_CHARGE;
    duel.player.x = duel.opponent.x - 100;
    tickUntil(duel, () => duel.volley.length > 0);
    assert.ok(duel.volley.every(shot => shot.special));
    if (chapter === charlemagne) {
      assert.deepEqual(duel.volley.map(shot => shot.facing).sort(), [-1, 1]);
    } else {
      assert.deepEqual(duel.volley.map(shot => shot.y), [13, 27, 40]);
    }
  }
});

test('Timeout compares each fighter’s remaining health percentage', () => {
  const charlemagne = chapters.find(chapter => chapter.pattern === 'slam');
  for (const [offset, winner] of [[10, 'player'], [0, 'draw'], [-10, 'opponent']]) {
    const duel = startDuel({}, charlemagne);
    duel.phase = 'fight';
    duel.remaining = step;
    duel.player.hp = duel.player.maxHp / 2 + offset;
    duel.opponent.hp = charlemagne.maxHp / 2;
    advance(duel, 0, step);
    assert.equal(duel.phase, 'result');
    assert.deepEqual(duel.result, {winner, reason: 'time'});
  }
});

test('The round ends before a weapon that would land after the buzzer', () => {
  const duel = startDuel({}, chapters[0]);
  duel.phase = 'fight';
  duel.player.x = duel.opponent.x - 35;
  duel.player.hp = 10;
  duel.opponent.hp = 18;
  action(duel, 'attack');
  duel.player.phaseTime = .008;
  duel.remaining = .001;
  advance(duel, 0, .04);
  assert.deepEqual(duel.result, {winner: 'opponent', reason: 'time'});
  assert.equal(duel.opponent.hp, 18);
});

test('A boss waits for visible takeoff and reads a familiar jump faster', () => {
  const chapter = chapters[2];
  const duel = startDuel({}, chapter);
  const {player, opponent: boss} = duel;
  duel.phase = 'fight';
  duel.elapsed = 2;
  duel.tactics.jumps.push(.5, 1.5);
  player.x = boss.x - 36;
  advance(duel, 0, chapter.attack.windup - .28);
  assert.equal(boss.move, chapter.attack);
  assert.equal(boss.intent, null);
  assert.ok(action(duel, 'jump'));
  tickUntil(duel, () => boss.struck);
  assert.equal(boss.intent, 'high');
  assert.equal(player.hp, player.maxHp - chapter.attack.damage);
});

test('A missed weapon strike can be countered after a reaction delay', () => {
  const napoleon = chapters.find(chapter => chapter.pattern === 'saber');
  const duel = startDuel({}, napoleon);
  duel.phase = 'fight';
  action(duel, 'attack');
  tickUntil(duel, () => Number.isFinite(duel.tactics.whiffAt));
  tickUntil(duel, () => duel.elapsed >= duel.tactics.whiffAt + napoleon.tactics.reaction);
  duel.player.x = duel.opponent.x - 54;
  advance(duel, 0, step);
  assert.equal(duel.opponent.intent, 'counter');
  assert.ok(duel.opponent.windup >= .35 && duel.opponent.windup < napoleon.attack.windup);
});

test('A boss can punish a visible recovery after a landed attack', () => {
  const duel = startDuel({}, chapters[1]);
  const {player, opponent: boss} = duel;
  duel.phase = 'fight';
  player.x = boss.x - 40;
  boss.recoverUntil = .42;
  assert.ok(action(duel, 'attack'));

  tickUntil(duel, () => boss.move);
  assert.equal(player.phase, 'recovery');
  assert.ok(boss.hp < boss.maxHp);
  assert.equal(boss.intent, 'counter');
  assert.ok(boss.windup < duel.chapter.attack.windup);
});

test('Darius punishes a visible recovery at spear range', () => {
  const duel = startDuel({}, chapters[1], 'dario');
  const {player, opponent: boss} = duel;
  duel.phase = 'fight';
  player.x = boss.x - 69;
  player.phase = 'recovery';
  player.phaseDuration = .49;
  player.phaseTime = .25;
  advance(duel, 0, step);

  assert.equal(boss.intent, 'counter');
  assert.ok(boss.windup < duel.chapter.attack.windup);
});

test('Late swordsmen follow an evaded swing with a second tell and a committed sweep', () => {
  for (const [chapter, evadeFollowUp] of [chapters[3], chapters[5]].flatMap(chapter =>
    [false, true].map(evade => [chapter, evade]))) {
    const duel = startDuel({}, chapter);
    const {player, opponent: boss} = duel;
    duel.phase = 'fight';
    player.x = boss.x - 36;
    advance(duel, 0, chapter.attack.windup - .15);
    assert.ok(action(duel, 'jump'));
    tickUntil(duel, () => boss.struck);
    assert.equal(player.hp, player.maxHp);

    const firstStrike = duel.elapsed;
    tickUntil(duel, () => boss.move === chapter.followUp && !boss.struck);
    assert.equal(boss.intent, 'follow-up');
    assert.ok(duel.elapsed >= firstStrike + .13);
    assert.ok(boss.windup - boss.attack >= .4);
    if (evadeFollowUp) player.x = boss.x + 36;
    tickUntil(duel, () => boss.struck);
    assert.equal(player.hp, player.maxHp - (evadeFollowUp ? 0 : chapter.followUp.damage));
  }
});

test('Bosses can turn toward an early cross but commit their facing before striking', () => {
  for (const chapter of chapters) {
    for (const late of [false, true]) {
      const duel = startDuel({}, chapter);
      const {player, opponent: boss} = duel;
      duel.phase = 'fight';
      boss.x = 240;
      player.x = boss.x - 40;
      duel.tactics.nextRetreat = 2;
      advance(duel, 0, step);
      assert.equal(boss.move, chapter.attack, chapter.name);
      if (late) advance(duel, 0, boss.windup - .12);
      player.x = boss.x + 40;
      if (late) {
        tickUntil(duel, () => boss.struck);
        assert.equal(boss.facing, -1, chapter.name);
        assert.equal(player.hp, player.maxHp, chapter.name);
      } else {
        advance(duel, 0, chapter.tactics.reaction / 2);
        assert.equal(boss.facing, -1, chapter.name);
        advance(duel, 0, chapter.tactics.reaction / 2 + 2 * step);
        assert.equal(boss.facing, 1, chapter.name);
        assert.equal(boss.struck, false, chapter.name);
      }
    }
  }
});

test('Ramesses adjusts to an early jump but a late jump clears his committed swing', () => {
  const chapter = chapters[0];
  for (const late of [false, true]) {
    const duel = startDuel({}, chapter);
    const {player, opponent: boss} = duel;
    duel.phase = 'fight';
    player.x = boss.x - 38;
    advance(duel, 0, late ? chapter.attack.windup - .15 : .04);
    assert.ok(action(duel, 'jump'));

    tickUntil(duel, () => boss.struck);
    assert.equal(boss.intent, late ? null : 'high');
    assert.equal(player.hp, player.maxHp - (late ? 0 : chapter.attack.damage));
  }
});

test('A melee boss steps into reach as the player backs away during the windup', () => {
  const duel = startDuel({}, chapters[0]);
  const {player, opponent: boss} = duel;
  duel.phase = 'fight';
  player.x = boss.x - 46;
  advance(duel, 0, step);
  assert.equal(boss.move, duel.chapter.attack);
  const start = boss.x;
  advance(duel, -1, .15);
  assert.ok(boss.x < start - 6);
  assert.equal(boss.moving, true);
  assert.equal(boss.struck, false);
});

test('Genghis Khan opens a gap before shooting and stops backing away at the wall', () => {
  const genghis = chapters.find(chapter => chapter.pattern === 'bow');
  const duel = startDuel({}, genghis);
  duel.phase = 'fight';
  duel.player.x = duel.opponent.x - 65;
  const start = duel.opponent.x;
  advance(duel, 0, step);
  assert.ok(duel.opponent.x > start);
  assert.equal(duel.opponent.move, undefined);

  duel.opponent.x = 453;
  duel.player.x = 100;
  advance(duel, 0, step);
  assert.equal(duel.tactics.retreatUntil, 0);
  const afterWall = duel.opponent.x;
  assert.ok(afterWall < 453);
  advance(duel, 0, step);
  assert.ok(duel.opponent.x < afterWall);
  duel.player.x = duel.opponent.x - 65;
  advance(duel, 0, step);
  assert.equal(duel.opponent.move, genghis.attack);
});

test('A ranged boss gives ground while aiming when the player rushes in', () => {
  const chapter = chapters[4];
  const duel = startDuel({}, chapter);
  const {player, opponent: boss} = duel;
  duel.phase = 'fight';
  duel.tactics.nextRetreat = 2;
  player.x = boss.x - 48;
  const start = boss.x;
  advance(duel, 1, .16);
  assert.equal(boss.move, chapter.attack);
  assert.equal(boss.struck, false);
  assert.ok(boss.x > start + 8);
});

test('Aimed arrows can be cleared by jumping near the projectile arrival', () => {
  const genghis = chapters.find(chapter => chapter.pattern === 'bow');
  for (const jump of [false, true]) {
    const duel = startDuel({}, genghis);
    duel.phase = 'fight';
    duel.elapsed = 2.1;
    duel.tactics.jumps.push(.7, 1.7);
    duel.player.x = duel.opponent.x - 115;
    if (jump) {
      tickUntil(duel, () => duel.opponent.move === genghis.attack && duel.opponent.windup - duel.opponent.attack <= .07);
      assert.ok(action(duel, 'jump'));
    }
    tickUntil(duel, () => duel.volley.length > 0);
    assert.equal(duel.opponent.intent, 'high');
    assert.equal(duel.volley[0].y, 45);
    for (let i = 0; i < 65; i++) advance(duel, 0, step);
    assert.equal(duel.player.hp, duel.player.maxHp - (jump ? 0 : genghis.attack.damage));
  }
});

test('Pistol rounds leave the muzzle and keep their initial direction', () => {
  const pistol = chapters.find(chapter => chapter.pattern === 'pistol');
  for (const facing of [-1, 1]) {
    for (const level of [false, true]) {
      const duel = startDuel({}, pistol);
      duel.phase = 'fight';
      duel.opponent.x = facing === 1 ? 115 : 365;
      duel.player.x = duel.opponent.x + 249 * facing;
      if (level) {
        duel.elapsed = 2.1;
        duel.tactics.jumps.push(.7, 1.7);
      }
      tickUntil(duel, () => duel.volley.length > 0);
      const shot = duel.volley[0];
      const {launchX, launchY, vx, vy} = shot;
      assert.ok((launchX - duel.opponent.x) * facing > 40);
      assert.ok(launchY > 45);
      assert.equal(Math.sign(vx), facing);
      assert.ok(level ? Math.abs(vy) < 1e-9 : vy < 0);
      if (!level) {
        const aimedHeight = launchY + (duel.player.x - launchX) * vy / vx;
        assert.ok(Math.abs(aimedHeight - pistol.attack.projectile.height) < 1e-7);
      }
      for (let i = 0; i < 24; i++) {
        assert.ok(duel.volley.includes(shot));
        assert.equal(shot.vx, vx);
        assert.equal(shot.vy, vy);
        assert.ok(Math.abs((shot.x - launchX) * vy - (shot.y - launchY) * vx) < 1e-7);
        advance(duel, 0, step);
      }
      tickUntil(duel, () => !duel.volley.includes(shot));
      assert.equal(duel.player.hp, duel.player.maxHp - pistol.attack.damage);
    }
  }
});

test('A pistol discharge hits a fighter inside the barrel reach at either wall', () => {
  const pistol = chapters.at(-1);
  for (const facing of [-1, 1]) {
    for (const gap of [23, 36]) {
      for (const move of [pistol.attack, pistol.finalPhase.attack, pistol.special]) {
        const duel = startDuel({}, pistol);
        const {player, opponent: boss} = duel;
        duel.phase = 'fight';
        boss.x = facing === 1 ? 27 : 453;
        player.x = boss.x + gap * facing;
        const targetX = player.x;
        if (move === pistol.special) boss.charge = MAX_CHARGE;
        if (move === pistol.finalPhase.attack) boss.hp = boss.maxHp / 2;
        tickUntil(duel, () => boss.struck);
        assert.equal(player.hp, player.maxHp - move.damage);
        assert.equal(duel.volley.length, 0);
        const impact = duel.sparks.find(spark => spark.kind === 'impact');
        assert.equal(impact.facing, facing);
        assert.ok(Math.abs(impact.x - targetX) <= DEFAULT_HURTBOX.radius + 3);
      }
    }
  }
});

test('The final boss switches to a double shot after finishing an attack at half health', () => {
  const pistol = chapters.at(-1);
  const duel = startDuel({}, pistol);
  const {player, opponent: boss} = duel;
  duel.phase = 'fight';
  player.x = boss.x - 130;
  boss.charge = 0;
  advance(duel, 0, step);
  assert.equal(boss.move, pistol.attack);

  boss.hp = boss.maxHp / 2;
  tickUntil(duel, () => boss.struck);
  assert.equal(boss.move, pistol.attack);
  tickUntil(duel, () => boss.move?.beats?.length === 2);
  assert.equal(boss.move, pistol.finalPhase.attack);
  assert.equal(duel.strikeIndex, 0);
});

test('The final double shot keeps its aim and gives a reload opening', () => {
  const pistol = chapters.at(-1);
  const duel = startDuel({}, pistol);
  const {player, opponent: boss} = duel;
  duel.phase = 'fight';
  boss.x = 240;
  boss.hp = boss.maxHp / 2;
  player.x = boss.x - 130;

  tickUntil(duel, () => duel.strikeIndex === 1);
  const firstShot = duel.elapsed;
  const facing = boss.facing;
  player.x = boss.x + 36;
  tickUntil(duel, () => duel.strikeIndex === 2);
  assert.ok(duel.elapsed - firstShot >= .50);
  assert.equal(boss.facing, facing);
  assert.equal(duel.volley.at(-1).facing, facing);
  assert.equal(player.hp, player.maxHp);
  advance(duel, 0, .40);
  assert.equal(boss.move, pistol.finalPhase.attack);
  assert.equal(duel.strikeIndex, 2);
});

test('A single jump can clear the first raised round and still get caught by the second', () => {
  const pistol = chapters.at(-1);
  const duel = startDuel({}, pistol);
  const {player, opponent: boss} = duel;
  duel.phase = 'fight';
  duel.elapsed = 2.1;
  duel.tactics.jumps.push(.7, 1.7);
  boss.hp = boss.maxHp / 2;

  tickUntil(duel, () => duel.volley.length === 1);
  assert.equal(boss.intent, 'high');
  const [first] = duel.volley;
  const heightAtPlayer = first.launchY + (player.x - first.launchX) * first.vy / first.vx;
  assert.ok(Math.abs(heightAtPlayer - 43) < 1e-7);
  assert.ok(action(duel, 'jump'));
  tickUntil(duel, () => first.x < player.x - 12);
  assert.equal(player.hp, player.maxHp);
  tickUntil(duel, () => player.hp < player.maxHp);
  assert.equal(duel.strikeIndex, 2);
  assert.equal(player.hp, player.maxHp - pistol.finalPhase.attack.damage);
});

test('A pistol impact lands on the line as it grazes an airborne fighter', () => {
  const pistol = chapters.find(chapter => chapter.pattern === 'pistol');
  for (const facing of [-1, 1]) {
    const duel = startDuel({}, pistol);
    duel.phase = 'fight';
    duel.opponent.x = facing === 1 ? 115 : 365;
    duel.player.x = duel.opponent.x + 249 * facing;
    tickUntil(duel, () => duel.volley.length > 0);
    const [shot] = duel.volley;
    advance(duel, 0, 12 * step);

    // The round enters the side of the hurtbox before descending below it within the same step.
    const contactX = shot.x + shot.vx * step / 4;
    const contactY = shot.y + shot.vy * step / 4;
    const lowerEdge = shot.y + shot.vy * step / 2;
    const roundRadius = 3;
    duel.player.x = contactX + facing * (DEFAULT_HURTBOX.radius + roundRadius);
    duel.player.y = lowerEdge - DEFAULT_HURTBOX.bottom + roundRadius + JUMP_GRAVITY / 2 * step ** 2;
    advance(duel, 0, step);

    assert.equal(duel.player.hp, duel.player.maxHp - pistol.attack.damage);
    assert.ok(!duel.volley.includes(shot));
    const spark = duel.sparks.find(spark => spark.kind === 'impact');
    assert.ok(Math.abs(spark.x - contactX) < 1e-7);
    assert.ok(Math.abs(spark.y - contactY) < 1e-7);
  }
});

test('Pistol rounds stay on their line when the player jumps across the shooter', () => {
  const pistol = chapters.find(chapter => chapter.pattern === 'pistol');
  for (const facing of [-1, 1]) {
    const duel = startDuel({}, pistol);
    const {player, opponent: boss} = duel;
    duel.phase = 'fight';
    boss.x = facing === 1 ? 220 : 260;
    // Be above his shoulder by the discharge, clear of the barrel in front.
    player.x = boss.x + 50 * facing;
    duel.tactics.nextRetreat = 2;

    const jumpLead = .26;
    advance(duel, 0, pistol.attack.windup - jumpLead);
    assert.ok(action(duel, 'jump'));
    advance(duel, -facing, jumpLead + step);
    const [shot] = duel.volley;
    assert.ok(shot);
    const {launchX, launchY, vx, vy} = shot;
    let crossed = false;
    for (let i = 0; i < 120 && duel.volley.includes(shot); i++) {
      advance(duel, -facing, step);
      if (duel.volley.includes(shot) && (player.x - boss.x) * facing < 0) crossed = true;
      assert.ok(Math.abs((shot.x - launchX) * vy - (shot.y - launchY) * vx) < 1e-7);
    }
    assert.ok(crossed, 'The player changes sides while the round is still flying');
    assert.ok(!duel.volley.includes(shot) && Math.abs(shot.y) < 1e-7, 'The round reaches the floor');
    assert.equal(player.hp, player.maxHp);
  }
});

test('The historical ladder raises damage and health and quickens defense at every stage', () => {
  assert.deepEqual(chapters.map(chapter => chapter.pattern), ['hook', 'spear', 'guard', 'slam', 'bow', 'saber', 'pistol']);
  for (const [index, chapter] of chapters.slice(1).entries()) {
    const previous = chapters[index];
    assert.ok(chapter.maxHp > previous.maxHp, chapter.name);
    assert.ok(chapter.attack.damage > previous.attack.damage, chapter.name);
    assert.ok(chapter.special.damage > previous.special.damage, chapter.name);
    assert.ok(chapter.tactics.reaction < previous.tactics.reaction, chapter.name);
    assert.ok(chapter.tactics.evadeCooldown < previous.tactics.evadeCooldown, chapter.name);
  }
});

test('A full boss Ultimate casts in range, spends charge, and respects cooldown and elevation', () => {
  for (const chapter of chapters) {
    for (const mode of ['cast', 'cooldown', 'airborne']) {
      const duel = startDuel({}, chapter);
      duel.phase = 'fight';
      duel.opponent.charge = MAX_CHARGE;
      duel.opponent.x = 453;
      duel.player.x = 413;
      if (mode === 'cooldown') duel.tactics.nextUltimate = 5;
      if (mode === 'airborne') duel.player.y = 40;
      advance(duel, 0, step);
      assert.equal(duel.opponent.move, mode === 'cast' ? chapter.special : chapter.attack, chapter.name);
      assert.equal(duel.opponent.charge, mode === 'cast' ? 0 : MAX_CHARGE, chapter.name);
      if (mode === 'cast') assert.ok(duel.tactics.nextUltimate > duel.elapsed);
    }
  }
});

function putBoltInFlight(duel, launchedAt, height = 27) {
  const {player, opponent: boss} = duel;
  duel.projectiles.push({
    owner: player, x: boss.x - 62, y: FLOOR - height, vx: 240, radius: 3,
    damage: 17, impact: weapons.dario.impact, time: .9, launchedAt,
  });
}

test('A projectile can hit the boss in the upper body and pass above it at base stature', () => {
  const charlemagne = chapters.find(chapter => chapter.pattern === 'slam');
  for (const [height, damage] of [[85, 17], [96, 0]]) {
    const duel = startDuel({}, charlemagne, 'dario');
    duel.phase = 'fight';
    duel.opponent.recoverUntil = 1;
    putBoltInFlight(duel, 0, height);
    tickUntil(duel, () => duel.projectiles.length === 0);
    assert.equal(duel.opponent.hp, charlemagne.maxHp - damage);
  }
});

test('Every rival physically jumps over a visible incoming bolt, then leaves a landing opening', () => {
  for (const chapter of chapters) {
    const duel = startDuel({}, chapter, 'dario');
    duel.phase = 'fight';
    duel.elapsed = .3;
    duel.opponent.x = 300;
    const boss = duel.opponent;
    putBoltInFlight(duel, 0);
    const bolt = duel.projectiles[0];
    advance(duel, 0, step);
    assert.equal(boss.evade.kind, 'jump', chapter.name);
    assert.ok(boss.vy > 0);
    tickUntil(duel, () => bolt.x >= boss.x);
    assert.ok(boss.y > 27, chapter.name);
    assert.equal(boss.hp, boss.maxHp, chapter.name);
    tickUntil(duel, () => !boss.evade);
    assert.ok(boss.recoverUntil > duel.elapsed);
    assert.equal(boss.move, null);
  }
});

test('A melee boss can close distance while jumping a visible bolt', () => {
  const duel = startDuel({}, chapters[0], 'dario');
  const boss = duel.opponent;
  duel.phase = 'fight';
  duel.elapsed = .3;
  boss.x = 300;
  putBoltInFlight(duel, 0);
  duel.projectiles[0].x = boss.x - 76;
  const start = boss.x;
  advance(duel, 0, .26);
  assert.equal(boss.evade?.kind, 'jump');
  assert.ok(boss.x < start - 15);
  assert.equal(boss.hp, boss.maxHp);
});

test('Ramesses can jump an Index Disc on its way out and get hit on its return', () => {
  const duel = startDuel({}, chapters[0], 'page');
  const boss = duel.opponent;
  duel.phase = 'fight';
  boss.x = duel.player.x + 160;

  assert.equal(action(duel, 'attack'), true);
  tickUntil(duel, () => boss.evade?.kind === 'jump');
  tickUntil(duel, () => duel.projectiles[0]?.returning);
  assert.equal(boss.hp, boss.maxHp);
  assert.ok(duel.projectiles[0].vx < 0);

  tickUntil(duel, () => boss.hp < boss.maxHp);
  assert.equal(boss.hp, boss.maxHp - weapons.page.damage);
  tickUntil(duel, () => duel.projectiles.length === 0);
});

test('Rivals respect reaction time and cannot cancel a committed Ultimate to evade', () => {
  const ramesses = chapters[0];
  for (const mode of ['unseen', 'committed']) {
    const duel = startDuel({}, ramesses, 'dario');
    duel.phase = 'fight';
    duel.elapsed = .3;
    duel.opponent.x = 300;
    putBoltInFlight(duel, mode === 'unseen' ? .29 : 0);
    if (mode === 'committed') {
      duel.opponent.move = ramesses.special;
      duel.opponent.windup = ramesses.special.windup;
      duel.opponent.attack = .1;
    }
    advance(duel, 0, step);
    assert.equal(duel.opponent.evade, null);
    assert.equal(duel.opponent.vy, 0);
    if (mode === 'committed') assert.equal(duel.opponent.move, ramesses.special);
  }
});

test('The spear fighter steps away from a visible rising slash before it reaches him', () => {
  const duel = startDuel({}, chapters[1], 'ellison');
  duel.phase = 'fight';
  const boss = duel.opponent;
  duel.player.x = boss.x - 61;
  const x = boss.x;
  assert.equal(action(duel, 'attack'), true);
  tickUntil(duel, () => boss.evade?.kind === 'step');
  tickUntil(duel, () => duel.player.struck);
  assert.ok(boss.x > x + 6);
  assert.equal(boss.hp, boss.maxHp);
  assert.ok(duel.tactics.nextEvade > duel.elapsed);
});

test('The spear fighter reads a descending thrust before it reaches striking height', () => {
  const duel = startDuel({}, chapters[1], 'buffett');
  const { player, opponent: boss } = duel;
  duel.phase = 'fight';
  player.x = boss.x - 70;
  player.y = 29;
  player.vy = -160;
  assert.equal(action(duel, 'attack'), true);
  player.phaseTime = .11;
  advance(duel, 0, step);
  assert.ok(player.y > player.weapon.height);
  assert.equal(boss.evade?.kind, 'step');
  tickUntil(duel, () => player.struck);
  assert.equal(boss.hp, boss.maxHp);
});

test('A jump begins before the same physics tick advances a close thrust', () => {
  const duel = startDuel({}, chapters[0], 'buffett');
  duel.phase = 'fight';
  duel.player.x = duel.opponent.x - 23;
  assert.equal(action(duel, 'attack'), true);
  tickUntil(duel, () => duel.player.struck);
  assert.ok(duel.opponent.y > weapons.buffett.height);
  assert.equal(duel.opponent.hp, duel.opponent.maxHp);
});

test('Imperial Charge keeps its facing for the follow-up slash', () => {
  const napoleon = chapters.find(chapter => chapter.pattern === 'saber');
  const duel = startDuel({}, napoleon);
  duel.phase = 'fight';
  duel.opponent.charge = MAX_CHARGE;
  duel.player.x = duel.opponent.x - 60;
  tickUntil(duel, () => duel.opponent.struck);
  assert.equal(duel.player.hp, duel.player.maxHp - napoleon.special.damage);
  assert.equal(duel.strikeIndex, 1);

  const facing = duel.opponent.facing;
  const chargeEnd = duel.opponent.x;
  duel.player.x = duel.opponent.x - facing * 35;
  tickUntil(duel, () => duel.strikeIndex === 2);
  assert.equal(duel.player.hp, duel.player.maxHp - napoleon.special.damage);
  assert.equal(duel.opponent.x, chargeEnd);
  assert.equal(duel.opponent.facing, facing);
});

test('Founders keep their signature weapon and charged Ultimate against historical bosses', () => {
  const ramesses = chapters[0];
  const founders = Object.entries(weapons).filter(([id]) => id !== 'napoleon');
  assert.equal(new Set(founders.map(([, weapon]) => weapon.maxHp)).size, founders.length);
  assert.equal(new Set(founders.map(([, weapon]) => weapon.damage)).size, founders.length);
  for (const [id, weapon] of founders) {
    const duel = startDuel({}, ramesses, id);
    assert.equal(duel.player.weapon, weapon);
    assert.equal(duel.player.hp, weapon.maxHp);
    assert.equal(action(duel, 'attack'), false);
    advance(duel, 0, 3);
    assert.equal(duel.phase, 'fight');
    assert.equal(action(duel, 'ultimate'), false);
    duel.player.charge = 100;
    duel.player.x = duel.opponent.x - 38;
    duel.opponent.recoverUntil = duel.elapsed + 2;
    assert.equal(action(duel, 'ultimate'), true);
    assert.equal(duel.player.charge, 0);
    tickUntil(duel, () => duel.opponent.hp < ramesses.maxHp);
    assert.ok(duel.effects.some(effect => effect.ultimate && effect.damage > 0), id);
  }
});
