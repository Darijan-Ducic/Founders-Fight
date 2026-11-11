import {
  attackLoadout, chargeReach, FLOOR, jumpHeight, moveJump, PROJECTILE_OFFSET, projectileOverlapsHeight, projectileYAfter,
} from '../duel.js';

const stepSpeed = 185;
const stepDuration = .22;
const readWindow = .36;

function incomingProjectile(duel, reaction) {
  const {player, opponent: boss, elapsed} = duel;
  const {hurtbox} = boss;
  let nearest;
  for (const shot of duel.projectiles) {
    if (shot.owner !== player || shot.spent || elapsed - shot.launchedAt < reaction) continue;
    const facing = Math.sign(shot.vx);
    const distance = (boss.x - shot.x) * facing - shot.radius - hurtbox.radius;
    const time = distance / Math.abs(shot.vx);
    if (time <= 0 || time > Math.min(readWindow, shot.time)) continue;
    const height = FLOOR - projectileYAfter(shot, time) - boss.y;
    if (!projectileOverlapsHeight(height, shot.radius, hurtbox)) continue;
    if (!nearest || time < nearest.time) nearest = {time, lift: height + shot.radius - hurtbox.bottom + 1, shot};
  }
  return nearest;
}

function visibleWindup(duel, reaction) {
  const {player, opponent: boss} = duel;
  if (player.phase !== 'windup' || player.phaseDuration - player.phaseTime < reaction) return;
  const weapon = attackLoadout(player);
  const gap = (boss.x - player.x) * player.facing;
  const time = player.phaseTime;
  if (gap <= 0 || time > readWindow) return;
  const playerHeight = jumpHeight(player.y, player.vy, time);
  const reach = weapon.direct ?? (weapon.projectile ? 0 : chargeReach(player));
  if (gap <= reach && playerHeight <= weapon.height) {
    return {time, lift: playerHeight + weapon.height + 1, step: reach - gap + 4};
  }

  const projectile = weapon.projectile;
  if (!projectile || gap > weapon.range) return;
  const {hurtbox} = boss;
  const {speed, radius, spread = [[1, 0]], offset = PROJECTILE_OFFSET, dropSpeed = 0} = projectile;
  const launchHeight = weapon.direct ? 9 : playerHeight + weapon.height;
  const travel = Math.max(0, gap - offset - radius - hurtbox.radius);
  let nearest;
  for (const [speedScale, lift] of spread) {
    const flightTime = travel / (speed * speedScale);
    const arrival = time + flightTime;
    const aboveLane = Math.max(0, (projectile.launchHeight ?? weapon.height) - weapon.height - dropSpeed * flightTime);
    const height = launchHeight + lift + aboveLane - boss.y;
    if (arrival > readWindow || !projectileOverlapsHeight(height, radius, hurtbox)) continue;
    if (!nearest || arrival < nearest.time) nearest = {time: arrival, lift: height + radius - hurtbox.bottom + 1};
  }
  return nearest;
}

function chooseEvade(duel, away, space) {
  const {chapter, player, opponent: boss} = duel;
  const {jump, preferStep, reaction} = chapter.tactics;
  const shot = incomingProjectile(duel, reaction);
  const windup = visibleWindup(duel, reaction);
  const threat = shot && (!windup || shot.time < windup.time) ? shot : windup;
  if (!threat) return;

  const {time, lift, step, shot: bolt} = threat;
  const jumpClearance = jumpHeight(0, jump, time);
  const canJump = jumpClearance > lift;
  const canStep = step !== undefined && Math.min(space, stepSpeed * Math.min(time, stepDuration)) >= step;
  if (canStep && (preferStep || !canJump)) return {kind: 'step', direction: away, speed: stepSpeed};
  if (canJump) {
    const speed = Math.min(112, chapter.speed + 23);
    // A forward leap reaches a direct bolt sooner. Check clearance at that earlier crossing.
    if (bolt && !bolt.returnSpeed && !chapter.attack.projectile && Math.sign(bolt.vx) === away
        && Math.abs(player.x - boss.x) > chapter.attack.reach + 30) {
      const boltSpeed = Math.abs(bolt.vx);
      const crossing = time * boltSpeed / (boltSpeed + speed);
      if (jumpHeight(0, jump, crossing) > lift + 3) return {kind: 'jump', direction: -away, speed, approach: true};
    }
    const direction = step === undefined ? 0 : space > 30 ? away : -away;
    return {kind: 'jump', direction, speed};
  }
}

function drift(duel, dt, bound) {
  const {opponent: boss, player} = duel;
  const {direction, speed, approach} = boss.evade;
  const room = approach ? Math.max(0, (player.x - boss.x) * direction - 30) : Infinity;
  const x = bound(boss.x + direction * Math.min(room, speed * dt));
  boss.moving = x !== boss.x;
  boss.x = x;
}

export function stepBossDefense(duel, dt, bound) {
  const {opponent: boss, player, chapter, tactics, elapsed} = duel;
  moveJump(boss, dt);
  if (boss.evade) {
    const {kind, until} = boss.evade;
    const done = kind === 'jump' ? boss.y === 0 && boss.vy === 0 : elapsed >= until || boss.hit > 0;
    if (done) {
      boss.evade = null;
      boss.recoverUntil = elapsed + Math.max(.12, chapter.tactics.reaction + .03);
      boss.facing = Math.sign(player.x - boss.x) || boss.facing;
    } else if (boss.hit === 0) {
      drift(duel, dt, bound);
    }
    return true;
  }

  if (elapsed < boss.recoverUntil) return true;
  if (boss.hit > 0 || elapsed < tactics.nextEvade
      || (boss.move && (boss.move === chapter.special || boss.attack > boss.windup * .50))) return false;

  const away = Math.sign(boss.x - player.x) || 1;
  const space = Math.abs(bound(boss.x + away * 480) - boss.x);
  const evade = chooseEvade(duel, away, space);
  if (!evade) return false;

  boss.facing = -away;
  boss.move = null;
  boss.intent = null;
  boss.attack = 0;
  boss.struck = false;
  boss.evade = {...evade, until: elapsed + stepDuration};
  if (evade.kind === 'jump') {
    boss.vy = chapter.tactics.jump;
    moveJump(boss, dt);
  }
  drift(duel, dt, bound);
  duel.strikeIndex = 0;
  tactics.retreatUntil = 0;
  tactics.nextEvade = elapsed + chapter.tactics.evadeCooldown;
  tactics.nextRetreat = Math.max(tactics.nextRetreat, elapsed + 1);
  return true;
}
