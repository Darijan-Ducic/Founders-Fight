import { FLOOR } from '../duel.js';
import { swordGripPose } from './sword-grip.js';

export const GRIP_UNITS_PER_METER = 65;
export const pistolSocket = [-4.7, -6.5];
export const pistolMuzzle = {x: 20.17, y: -4.65};
export const pistolReady = .37;
export const pistolFlashTime = .065;

export function bossBodyPose(boss, winding = false, striking = false) {
  const x = Math.round(boss.x);
  const y = FLOOR - Math.round(boss.y);
  if (boss.hp <= 0) return {x, y: y - 9, angle: -1.33};
  if (boss.hit > 0) {
    return {x: x + boss.impactFacing * 2, y, angle: boss.impactFacing * boss.facing * .12};
  }
  if (boss.evade?.kind === 'jump') return {x, y, angle: boss.evade.direction * boss.facing * .12};
  return {x, y, angle: striking ? .14 : winding ? -.10 : 0};
}

function rotate(x, y, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {x: x * cosine - y * sine, y: x * sine + y * cosine};
}

function pistolMount(chapter, boss) {
  const scale = boss.bodyHeight / (chapter.stature * GRIP_UNITS_PER_METER);
  const x = chapter.grip[0] * scale;
  const y = chapter.grip[1] * scale;
  const wrist = {x: x + pistolSocket[0] * scale, y: y + pistolSocket[1] * scale};
  return {scale, x, y, wrist};
}

export function aimPistol(chapter, boss, targetX, height, level) {
  if (level) return 0;
  const body = bossBodyPose(boss, false, true);
  const {scale, x, y, wrist} = pistolMount(chapter, boss);
  const pivot = rotate(wrist.x, wrist.y, body.angle);
  const forward = Math.max(70, (targetX - body.x) * boss.facing - pivot.x);
  const down = FLOOR - height - body.y - pivot.y;
  const grip = swordGripPose(wrist, x, y, scale, pistolReady, pistolReady);
  // Aim along the bore, which is slightly offset from the wrist pivot.
  const boreOffset = (pistolMuzzle.y - grip.wristY) * scale;
  const pitch = Math.atan2(down, forward) - Math.asin(boreOffset / Math.hypot(forward, down));
  return Math.max(.045, Math.min(.40, pitch));
}

export function pistolAngle(pitch, wind, strikeAge, bodyAngle, holdingAim) {
  if (pitch === undefined) return pistolReady;
  const aimed = pitch - bodyAngle;
  const blend = wind > 0 ? Math.min(1, wind * 3) : holdingAim ? 1 :
    1 - Math.max(0, Math.min(1, (strikeAge - pistolFlashTime) / (.30 - pistolFlashTime)));
  return pistolReady + (aimed - pistolReady) * blend;
}

export function launchPistolRound(chapter, boss, pitch, speed) {
  const body = bossBodyPose(boss, false, true);
  const {scale, x, y, wrist} = pistolMount(chapter, boss);
  const angle = pitch - body.angle;
  const grip = swordGripPose(wrist, x, y, scale, pistolReady, angle);
  const muzzle = rotate(pistolMuzzle.x * scale, pistolMuzzle.y * scale, angle);
  const local = rotate(grip.x + muzzle.x, grip.y + muzzle.y, body.angle);
  const launchX = body.x + boss.facing * local.x;
  const launchY = FLOOR - body.y - local.y;
  return {x: launchX, y: launchY, launchX, launchY, vx: boss.facing * speed * Math.cos(pitch), vy: -speed * Math.sin(pitch)};
}
