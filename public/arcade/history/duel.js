import {
  buildCharge, controlArmedPlayer, createArmedPlayer, faceOpponent, healthWinner, interruptWindup,
  DEFAULT_HURTBOX, FLOOR, jumpHeight, MAX_CHARGE, moveArmedPlayer, projectileOverlapsHeight, ROUND_SECONDS,
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
const followUpDelay = .15;
const followUpCooldown = 2.55;
const committedWindup = .23;
const familiarJumpWindup = .17;
const lowStrikeHeight = 24;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const bound = x => clamp(x, minX, maxX);

export function startDuel(fighter, chapter, weaponId = 'sam') {
  const maxHp = chapter.maxHp;
  const bodyHeight = chapter.stature * UNITS_PER_METER;
  const hurtbox = {...DEFAULT_HURTBOX, top: bodyHeight * .68};
  const charge = chapter.tactics.startingCharge ?? 36;
  const opponent = {x: 365, facing: -1, y: 0, vy: 0, hp: maxHp, maxHp, bodyHeight, hurtbox, hit: 0, recoil: 0,
    impactFacing: 0, attack: 0, struck: false, moving: false, gait: 0, charge, evade: null, recoverUntil: 0,
    followUpAt: 0};
  return {
    chapter, player: createArmedPlayer(fighter, weaponId, 116),
    opponent,
    countdown: 3, remaining: ROUND_SECONDS, time: 0, elapsed: 0, phase: 'countdown', result: null,
    volley: [], sparks: [], effects: [], projectiles: [], strikeIndex: 0,
    tactics: {jumps: [], attacks: [], whiffAt: -Infinity, nextHigh: 0, retreatUntil: 0, nextRetreat: 0,
      nextEvade: 0, nextUltimate: 0, nextFollowUp: 0, turnAt: 0},
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
const isRegularMove = (chapter, move) => move === chapter.attack || move === chapter.finalPhase?.attack;

function bossStrike(duel, move, beat) {
  const {opponent: boss, player, chapter} = duel;
  const {damage: amount, projectile} = move;
  const lunge = beat.lunge ?? move.lunge ?? 0;
  const reach = beat.reach ?? move.reach;
  const special = move === chapter.special;
  const high = boss.intent === 'high';
  if (projectile) {
    const facing = beat.reverse ? -boss.facing : boss.facing;
    const shot = {...projectile, facing, damage: amount, special, push: move.push, stun: move.stun};
    if (projectile.kind === 'round') {
      if (boss.pistolPitch === undefined) aimBossPistol(duel);
      Object.assign(shot, launchPistolRound(chapter, boss, boss.pistolPitch, projectile.speed));
      // At point-blank range the target can overlap the barrel at discharge.
      const contact = pistolContactTime(player, shot, -shot.barrelTime, 0);
      if (contact !== null) {
        hitPistolRound(duel, shot, contact);
        return;
      }
    } else {
      shot.x = boss.x + facing * 18;
      shot.y = high ? 45 : (beat.height ?? projectile.height);
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
  const inHeight = high ? player.y >= 22 : player.y < lowStrikeHeight;
  const inRange = forward >= 0 && forward <= reach;
  if (inRange && inHeight) {
    damage(duel, player, amount, boss.facing, player.x - boss.facing * 6, high ? 76 : 48,
      {...move, ...beat, heavy: special});
  }
  return inRange && !high && !inHeight;
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

function aimBossPistol(duel) {
  const {opponent: boss, player, chapter} = duel;
  const projectile = boss.move.projectile;
  if (projectile?.kind === 'round') {
    const high = boss.intent === 'high';
    const raisedBurst = high && boss.move === chapter.finalPhase?.attack;
    boss.pistolPitch = aimPistol(chapter, boss, player.x, raisedBurst ? 43 : projectile.height, high && !raisedBurst);
  }
}

function hasJumpHabit(duel) {
  return duel.elapsed - (duel.tactics.jumps.at(-2) ?? -Infinity) <= habitWindow;
}

function readJumpAtImpact(duel, move, gap, windup) {
  const {player, chapter, tactics, elapsed} = duel;
  const lastJump = tactics.jumps.at(-1) ?? -Infinity;
  const reaction = chapter.tactics.reaction * (hasJumpHabit(duel) ? .75 : 1);
  if (player.y <= 0 || elapsed - lastJump < reaction) return 0;

  const {projectile} = move;
  const muzzleOffset = projectile?.kind === 'round' ? 56 : 18;
  const flight = projectile ? Math.max(0, gap - muzzleOffset) / projectile.speed : 0;
  return jumpHeight(player.y, player.vy, windup + flight);
}

function canAimHigh(duel, move, height) {
  return duel.chapter.tactics.high && duel.elapsed >= duel.tactics.nextHigh
    && (move.projectile?.kind !== 'arrow' || height < 48);
}

function beginBossMove(duel, move, intent, windup = move.windup) {
  const {opponent: boss, tactics} = duel;
  boss.move = move;
  boss.intent = intent;
  aimBossPistol(duel);
  boss.windup = windup;
  boss.attack = 0;
  boss.struck = false;
  boss.followUpAt = 0;
  duel.strikeIndex = 0;
  tactics.turnAt = 0;
  tactics.retreatUntil = 0;
}

function startBossMove(duel, distance, direction, dt) {
  const {opponent: boss, player, chapter, tactics, elapsed} = duel;
  boss.facing = player.x < boss.x ? -1 : 1;
  const {finalPhase} = chapter;
  const normal = finalPhase && boss.hp <= boss.maxHp * finalPhase.healthRatio ? finalPhase.attack : chapter.attack;
  const {reaction, pressure, evadeCooldown} = chapter.tactics;
  const rushed = repeatsAttacks(tactics, elapsed, reaction);
  const recovering = player.phase === 'recovery' && player.phaseDuration - player.phaseTime >= reaction;
  const withinReach = distance <= normal.reach - 6;
  const punishRecovery = recovering && withinReach;
  if (boss.hit > 0 || (!punishRecovery && retreat(duel, distance, rushed, dt))) return;
  const special = boss.charge === MAX_CHARGE && elapsed >= tactics.nextUltimate
    && player.y < 18 && distance <= chapter.special.reach - 6;
  const move = special ? chapter.special : normal;
  if (distance > move.reach - 6) {
    const pace = direction === boss.facing || recovering ? pressure : 1.18;
    boss.moving = true;
    boss.x = bound(boss.x + boss.facing * chapter.speed * pace * dt);
    return;
  }

  const sinceWhiff = elapsed - tactics.whiffAt;
  const whiff = sinceWhiff >= reaction && sinceWhiff < .48;
  const pressureCounter = rushed && player.attack > 0 && withinReach;
  const counter = !special && (whiff || pressureCounter || punishRecovery);
  const windup = counter ? Math.max(.35, move.windup - .18) : move.windup;
  const airborneAtImpact = !special ? readJumpAtImpact(duel, move, distance, windup) : 0;
  const expectsJump = move.projectile && player.y === 0 && hasJumpHabit(duel)
    && elapsed - (tactics.jumps.at(-1) ?? -Infinity) >= reaction;
  const high = !special && (airborneAtImpact >= lowStrikeHeight || expectsJump)
    && canAimHigh(duel, move, airborneAtImpact);
  if (airborneAtImpact >= lowStrikeHeight && !high) return;
  if (high) tactics.nextHigh = elapsed + evadeCooldown;
  if (counter) tactics.whiffAt = -Infinity;
  if (special) {
    boss.charge = 0;
    tactics.nextUltimate = elapsed + (chapter.tactics.ultimateCooldown ?? ultimateCooldown);
  }
  beginBossMove(duel, move, high ? 'high' : counter ? 'counter' : null, windup);
}

function adjustWindup(duel, direction, dt) {
  const {opponent: boss, player, chapter, tactics, elapsed} = duel;
  const lead = boss.windup - boss.attack;
  const canTurn = lead >= committedWindup;
  if (!isRegularMove(chapter, boss.move) || boss.hit > 0
      || (!canTurn && (lead < familiarJumpWindup || !hasJumpHabit(duel)))) return;

  const targetSide = Math.sign(player.x - boss.x) || boss.facing;
  const turned = targetSide !== boss.facing;
  if (turned) {
    if (!canTurn) return;
    tactics.turnAt ||= elapsed + chapter.tactics.reaction;
    if (elapsed < tactics.turnAt) return;
    boss.facing = targetSide;
  }
  tactics.turnAt = 0;
  const gap = Math.abs(player.x - boss.x);
  const height = readJumpAtImpact(duel, boss.move, gap, lead);
  const lift = boss.intent !== 'high' && gap <= boss.move.reach && height >= lowStrikeHeight
    && canAimHigh(duel, boss.move, height);
  if (lift) {
    boss.intent = 'high';
    tactics.nextHigh = elapsed + chapter.tactics.evadeCooldown;
  }
  if (turned || lift) aimBossPistol(duel);

  if (!canTurn) return;
  let spacing = Math.max(0, gap - boss.move.reach * .78);
  if (boss.move.projectile) {
    const preferred = (chapter.tactics.space ?? 0) * .72;
    spacing = direction === -boss.facing ? Math.min(0, gap - preferred) : 0;
  }
  const travel = clamp(spacing, -chapter.speed * dt, chapter.speed * dt);
  const x = bound(boss.x + boss.facing * travel);
  boss.moving = x !== boss.x;
  boss.x = x;
}

function startFollowUp(duel) {
  const {opponent: boss, player, chapter, tactics, elapsed} = duel;
  if (!boss.followUpAt || elapsed < boss.followUpAt) return;
  boss.followUpAt = 0;
  const forward = (player.x - boss.x) * boss.facing;
  if (boss.hit > 0 || forward < 0 || forward > chapter.followUp.reach) return;

  beginBossMove(duel, chapter.followUp, 'follow-up');
  tactics.nextFollowUp = elapsed + followUpCooldown;
}

function updateBoss(duel, direction, dt) {
  const {opponent: boss, player, chapter, tactics, elapsed} = duel;
  if (!boss.move) startBossMove(duel, Math.abs(player.x - boss.x), direction, dt);
  if (!boss.move) return;

  startFollowUp(duel);
  adjustWindup(duel, direction, dt);
  const move = boss.move;
  boss.attack += dt;
  const strike = boss.attack - boss.windup;
  const beats = beatsFor(move);
  while (beats[duel.strikeIndex] && strike >= beats[duel.strikeIndex].at && player.hp > 0) {
    const jumped = bossStrike(duel, move, beats[duel.strikeIndex++]);
    boss.struck = true;
    if (jumped && move === chapter.attack && chapter.followUp && elapsed >= tactics.nextFollowUp) {
      boss.followUpAt = elapsed + followUpDelay;
    }
  }
  if (strike >= beats.at(-1).at + move.recovery) {
    if (isRegularMove(chapter, move)) buildCharge(boss, 12);
    boss.move = null;
    boss.intent = null;
    boss.attack = 0;
    boss.struck = false;
  }
}

function pistolContactTime(player, shot, startTime, endTime) {
  const {x, y, vx, vy, facing} = shot;
  const hurtbox = player.hurtbox ?? DEFAULT_HURTBOX;
  const roundRadius = 3;
  const width = hurtbox.radius + roundRadius;
  const forward = (player.x - x) * facing;
  const speed = Math.abs(vx);
  // Intersect the times spent inside the horizontal and vertical bounds of the hurtbox.
  let enter = Math.max(startTime, (forward - width) / speed);
  let exit = Math.min(endTime, (forward + width) / speed);
  if (vy !== 0) {
    const bottom = (player.y + hurtbox.bottom - roundRadius - y) / vy;
    const top = (player.y + hurtbox.top + roundRadius - y) / vy;
    enter = Math.max(enter, Math.min(bottom, top));
    exit = Math.min(exit, Math.max(bottom, top));
  }
  return enter <= exit && (vy !== 0 || projectileOverlapsHeight(y - player.y, roundRadius, hurtbox)) ? enter : null;
}

function hitPistolRound(duel, shot, time = 0) {
  const {player} = duel;
  if (player.hit === 0) damage(duel, player, shot.damage, shot.facing,
    shot.x + shot.vx * time, shot.y + shot.vy * time,
    {push: shot.push, stun: shot.stun, heavy: shot.special});
}

function movePistolRound(duel, shot, dt) {
  const {x, y, vx, vy, facing} = shot;
  const wallTime = ((facing > 0 ? 480 : 0) - x) / vx;
  const floorTime = vy < 0 ? -y / vy : Infinity;
  const end = Math.min(wallTime, floorTime);
  if (end <= 0) return false;
  const travel = Math.min(dt, end);
  const contact = pistolContactTime(duel.player, shot, 0, travel);
  const time = contact ?? travel;
  shot.x = x + vx * time;
  shot.y = y + vy * time;
  if (contact === null) return travel < end;
  hitPistolRound(duel, shot);
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
  faceOpponent(player, boss);
  const bossHp = boss.hp;
  const contact = stepArmedAttack(duel, dt, (facing, y) => shieldBlocks(duel, facing, y));
  if (contact === false) duel.tactics.whiffAt = duel.elapsed;
  buildCharge(boss, (bossHp - boss.hp) * .72);
  if (boss.hp > 0) {
    if (!defending) updateBoss(duel, movement, dt);
    moveShots(duel, dt);
  }
  faceOpponent(player, boss);
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
