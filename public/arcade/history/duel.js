import {
  buildCharge, controlArmedPlayer, createArmedPlayer, healthWinner, interruptWindup,
  DEFAULT_HURTBOX, FLOOR, MAX_CHARGE, moveArmedPlayer, projectileOverlapsHeight, ROUND_SECONDS,
  stepArmedAttack, UNITS_PER_METER,
} from '../duel.js';
import { aimPistol, launchPistolRound } from './boss-pose.js';
import { stepBossDefense } from './defense.js';
import { BOSS_STRIDE_RATIO } from './gait.js';

const minX = 27;
const maxX = 453;
const habitWindow = 4.5;
const epsilon = 1e-8;
const ultimateCooldown = 5.4;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const bound = x => clamp(x, minX, maxX);

export function startDuel(fighter, chapter, weaponId = 'sam') {
  const maxHp = chapter.maxHp;
  const bodyHeight = chapter.stature * UNITS_PER_METER;
  const hurtbox = {...DEFAULT_HURTBOX, top: bodyHeight * .68};
  const opponent = {x: 365, facing: -1, y: 0, vy: 0, hp: maxHp, maxHp, bodyHeight, hurtbox, hit: 0, recoil: 0,
    impactFacing: 0, attack: 0, struck: false, moving: false, gait: 0, charge: 36, evade: null, recoverUntil: 0};
  return {
    chapter, player: createArmedPlayer(fighter, weaponId, 116),
    opponent,
    countdown: 3, remaining: ROUND_SECONDS, time: 0, elapsed: 0, phase: 'countdown', result: null,
    volley: [], sparks: [], effects: [], projectiles: [], strikeIndex: 0,
    tactics: {jumps: [], attacks: [], whiffAt: -Infinity, nextHigh: 0, retreatUntil: 0, nextRetreat: 0,
      nextEvade: 0, nextUltimate: 0},
  };
}

export function action(duel, kind) {
  if (duel.phase !== 'fight' || !controlArmedPlayer(duel, kind)) return false;
  remember(kind === 'jump' ? duel.tactics.jumps : duel.tactics.attacks, duel.elapsed);
  return true;
}

function remember(events, now) {
  if (events.length === 3) events.shift();
  events.push(now);
}

function flash(duel, x, y, color, options = {}) {
  const duration = options.label ? .55 : options.kind ? .30 : .22;
  duel.sparks.push({x, y, color, life: duration, duration, ...options});
}

function damage(duel, target, amount, direction, x, y, {push = 8, stun = .18, heavy = false} = {}) {
  const dealt = Math.min(target.hp, amount);
  if (dealt === 0) return;
  target.hp -= dealt;
  target.hit = stun;
  target.x = bound(target.x + direction * push);
  target.impactFacing = direction;
  interruptWindup(target);
  buildCharge(target, 12);
  if (!heavy) buildCharge(duel.opponent, 24);
  flash(duel, x, y, '#ffb066', {
    kind: 'impact', label: String(dealt), facing: direction, heavy,
  });
}

function shieldBlocks(duel, facing, y) {
  const {opponent: boss, chapter} = duel;
  if (chapter.pattern !== 'guard' || facing === boss.facing || boss.evade || duel.elapsed < boss.recoverUntil) return false;
  if (boss.struck && duel.strikeIndex === beatsFor(boss.move).length) return false;
  flash(duel, boss.x + boss.facing * 12, FLOOR - y, '#a6e3ff', {label: 'BLOCK'});
  return true;
}

const singleStrike = [{at: 0}];
const beatsFor = move => move.beats ?? singleStrike;

function bossStrike(duel, move, beat) {
  const {opponent: boss, player, chapter} = duel;
  const {damage: amount, projectile} = move;
  const lunge = beat.lunge ?? move.lunge ?? 0;
  const reach = beat.reach ?? move.reach;
  const special = move === chapter.special;
  const high = boss.intent === 'high';
  if (projectile) {
    const facing = beat.reverse ? -boss.facing : boss.facing;
    const height = beat.height ?? projectile.height;
    const shot = {...projectile, facing, damage: amount, special, push: move.push, stun: move.stun};
    if (projectile.kind === 'round') {
      boss.pistolPitch ??= aimPistol(chapter, boss, player.x, height, high);
      Object.assign(shot, launchPistolRound(chapter, boss, boss.pistolPitch, projectile.speed));
    } else {
      shot.x = boss.x + facing * 18;
      shot.y = high ? 45 : height;
      flash(duel, shot.x, shot.y, chapter.accent);
    }
    duel.volley.push(shot);
    return;
  }

  const forward = (player.x - boss.x) * boss.facing;
  const origin = boss.x;
  boss.x = bound(boss.x + boss.facing * Math.min(lunge, Math.max(0, forward - 23)));
  flash(duel, boss.x, high ? 77 : 45, chapter.accent, {
    kind: 'slash', origin, facing: boss.facing, special, reach: reach - lunge,
  });
  const inHeight = high ? player.y >= 22 : player.y < 24;
  if (forward >= 0 && forward <= reach && inHeight) {
    damage(duel, player, amount, boss.facing, player.x - boss.facing * 6, high ? 76 : 48,
      {...move, ...beat, heavy: special});
  }
}

function repeatsAttacks(tactics, elapsed, reaction) {
  return tactics.attacks.length === 3
    && elapsed - tactics.attacks[0] < 2.1
    && elapsed - tactics.attacks.at(-1) >= reaction;
}

function retreat(duel, distance, rushed, dt) {
  const {opponent: boss, chapter, tactics, elapsed} = duel;
  const {space = 0} = chapter.tactics;
  const escapeRoom = boss.facing > 0 ? boss.x - minX : maxX - boss.x;
  if (elapsed >= tactics.nextRetreat && escapeRoom > 29 && distance < space
      && (chapter.attack.projectile || rushed)) {
    tactics.retreatUntil = elapsed + .27;
    tactics.nextRetreat = elapsed + 2.1;
  }
  if (escapeRoom <= 0) tactics.retreatUntil = 0;
  if (elapsed >= tactics.retreatUntil) return false;
  const step = Math.min(escapeRoom, 167 * dt);
  boss.x -= boss.facing * step;
  boss.moving = true;
  return true;
}

function startBossMove(duel, distance, direction, dt) {
  const {opponent: boss, player, chapter, tactics, elapsed} = duel;
  boss.facing = player.x < boss.x ? -1 : 1;
  const {reaction, pressure, high: readsJumps} = chapter.tactics;
  const rushed = repeatsAttacks(tactics, elapsed, reaction);
  if (boss.hit > 0 || retreat(duel, distance, rushed, dt)) return;
  const special = boss.charge === MAX_CHARGE && elapsed >= tactics.nextUltimate
    && player.y < 18 && distance <= chapter.special.reach - 6;
  const move = special ? chapter.special : chapter.attack;
  if (distance > move.reach - 6) {
    const pace = direction === boss.facing ? pressure : 1.12;
    boss.moving = true;
    boss.x = bound(boss.x + boss.facing * chapter.speed * pace * dt);
    return;
  }

  const secondLastJump = tactics.jumps.at(-2) ?? -Infinity;
  const lastJump = tactics.jumps.at(-1) ?? -Infinity;
  const jumpHabit = elapsed - secondLastJump <= habitWindow && elapsed - lastJump >= reaction;
  const high = !special && readsJumps && jumpHabit && elapsed >= tactics.nextHigh;
  const sinceWhiff = elapsed - tactics.whiffAt;
  const whiff = sinceWhiff >= reaction && sinceWhiff < .48;
  const pressureCounter = rushed && player.attack > 0 && distance <= 50;
  const counter = !special && !high && (whiff || pressureCounter);
  if (high) tactics.nextHigh = elapsed + 2.8;
  if (counter) tactics.whiffAt = -Infinity;
  if (special) {
    boss.charge = 0;
    tactics.nextUltimate = elapsed + ultimateCooldown;
  }
  boss.move = move;
  boss.intent = high ? 'high' : counter ? 'counter' : null;
  if (move.projectile?.kind === 'round') {
    boss.pistolPitch = aimPistol(chapter, boss, player.x, move.projectile.height, high);
  }
  boss.windup = counter ? Math.max(.35, move.windup - .18) : move.windup;
  boss.attack = 0;
  boss.struck = false;
  duel.strikeIndex = 0;
}

function updateBoss(duel, direction, dt) {
  const {opponent: boss, player} = duel;
  if (!boss.move) startBossMove(duel, Math.abs(player.x - boss.x), direction, dt);
  if (!boss.move) return;

  const move = boss.move;
  boss.attack += dt;
  const strike = boss.attack - boss.windup;
  const beats = beatsFor(move);
  while (beats[duel.strikeIndex] && strike >= beats[duel.strikeIndex].at && player.hp > 0) {
    bossStrike(duel, move, beats[duel.strikeIndex++]);
    boss.struck = true;
  }
  if (strike >= beats.at(-1).at + move.recovery) {
    if (move === duel.chapter.attack) buildCharge(boss, 12);
    boss.move = null;
    boss.intent = null;
    boss.attack = 0;
    boss.struck = false;
  }
}

function movePistolRound(duel, shot, dt) {
  const {player} = duel;
  const {x, y, vx, vy, facing} = shot;
  const wallTime = ((facing > 0 ? 480 : 0) - x) / vx;
  const floorTime = vy < 0 ? -y / vy : Infinity;
  const end = Math.min(wallTime, floorTime);
  if (end <= 0) return false;
  const travel = Math.min(dt, end);

  const hurtbox = player.hurtbox ?? DEFAULT_HURTBOX;
  const roundRadius = 3;
  const width = hurtbox.radius + roundRadius;
  const forward = (player.x - x) * facing;
  const speed = Math.abs(vx);
  // Intersect the times spent inside the horizontal and vertical bounds of the hurtbox.
  let enter = Math.max(0, (forward - width) / speed);
  let exit = Math.min(travel, (forward + width) / speed);
  if (vy !== 0) {
    const bottom = (player.y + hurtbox.bottom - roundRadius - y) / vy;
    const top = (player.y + hurtbox.top + roundRadius - y) / vy;
    enter = Math.max(enter, Math.min(bottom, top));
    exit = Math.min(exit, Math.max(bottom, top));
  }
  const contact = enter <= exit && (vy !== 0 || projectileOverlapsHeight(y - player.y, roundRadius, hurtbox));
  const time = contact ? enter : travel;
  shot.x = x + vx * time;
  shot.y = y + vy * time;
  if (!contact) return travel < end;
  if (player.hit === 0) damage(duel, player, shot.damage, facing, shot.x, shot.y,
    {push: shot.push, stun: shot.stun, heavy: shot.special});
  return false;
}

function moveShots(duel, dt) {
  const {player} = duel;
  duel.volley = duel.volley.filter(shot => {
    if (shot.vx !== undefined) return movePistolRound(duel, shot, dt);
    const oldX = shot.x;
    shot.x += shot.speed * dt * shot.facing;
    const low = Math.min(oldX, shot.x) - 12;
    const high = Math.max(oldX, shot.x) + 12;
    if (player.x >= low && player.x <= high && player.y < shot.y + 3) {
      if (player.hit === 0) damage(duel, player, shot.damage, shot.facing, player.x - shot.facing * 6, shot.y,
        {push: shot.push, stun: shot.stun, heavy: shot.special});
      return false;
    }
    return shot.x > 0 && shot.x < 480;
  });
}

function tick(duel, direction, dt) {
  duel.time += dt;
  const {player, opponent: boss} = duel;
  if (duel.phase === 'countdown') {
    duel.countdown = Math.max(0, duel.countdown - dt);
    if (duel.countdown <= epsilon) {
      duel.countdown = 0;
      duel.phase = 'fight';
    }
    return;
  }

  duel.elapsed += dt;
  duel.remaining = Math.max(0, duel.remaining - dt);
  duel.sparks = duel.sparks.filter(spark => (spark.life -= dt) > 0);
  boss.hit = Math.max(0, boss.hit - dt);
  boss.moving = false;
  buildCharge(boss, dt * 2.2);
  const bossStartX = boss.x;
  const side = player.x <= boss.x ? 1 : -1;
  const movement = moveArmedPlayer(duel, dt, direction, bound);
  const defending = stepBossDefense(duel, dt, bound);
  if (Math.abs(player.y - boss.y) < 29 && (boss.x - player.x) * side < 23) {
    const midpoint = clamp((player.x + boss.x) / 2, minX + 11.5, maxX - 11.5);
    player.x = midpoint - side * 11.5;
    boss.x = midpoint + side * 11.5;
  }
  const bossHp = boss.hp;
  const contact = stepArmedAttack(duel, dt, (facing, y) => shieldBlocks(duel, facing, y));
  if (contact === false) duel.tactics.whiffAt = duel.elapsed;
  buildCharge(boss, (bossHp - boss.hp) * .72);
  if (boss.hp > 0) {
    if (!defending) updateBoss(duel, movement, dt);
    moveShots(duel, dt);
  }
  if (boss.moving && boss.y === 0 && boss.hit === 0) {
    boss.gait += (boss.x - bossStartX) * boss.facing / (boss.bodyHeight * BOSS_STRIDE_RATIO);
  }
  const knockout = player.hp === 0 || boss.hp === 0;
  if (knockout || duel.remaining <= epsilon) {
    duel.phase = 'result';
    duel.result = {winner: healthWinner(player, boss), reason: knockout ? 'ko' : 'time'};
    if (player.hp === 0) player.y = player.vy = 0;
    if (boss.hp === 0) boss.y = boss.vy = 0;
  }
}

export function advance(duel, direction, dt) {
  while (dt > epsilon && !duel.result) {
    const step = Math.min(dt, 1 / 120, duel.phase === 'fight' ? duel.remaining : Infinity);
    tick(duel, Math.sign(direction), step);
    dt -= step;
  }
}
