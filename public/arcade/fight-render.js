import { fighter } from './art.js';
import { chargeReach } from './duel.js';
import { paintIndexDisc } from './weapon-art.js';

const width = 480;
const floor = 223;
const light = '#fff0d5';
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

function line(c, color, weight, ...points) {
  c.strokeStyle = color;
  c.lineWidth = weight;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.stroke();
}

function drawTell(c, actor) {
  const { x, y, facing, weapon, attackProgress, ultimate } = actor;
  if (weapon.advance) {
    const tip = clamp(x + facing * chargeReach(actor), 25, width - 25);
    c.globalAlpha = .35 + attackProgress * .55;
    line(c, weapon.color, 1, [actor.attackOrigin, floor + 5], [tip, floor + 5]);
    line(c, weapon.color, 1.5, [tip - facing * 5, floor + 2], [tip, floor + 5], [tip - facing * 5, floor + 8]);
    c.globalAlpha = 1;
  }
  c.strokeStyle = weapon.color;
  c.lineWidth = ultimate ? 2.4 : 1.2;
  c.beginPath();
  c.arc(x + facing * 18, floor - y - 64, ultimate ? 17 : 10,
    -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * attackProgress);
  c.stroke();
}

export function drawArmedFighter(c, actor, elapsed, reducedMotion) {
  c.fillStyle = '#121222a8';
  c.beginPath();
  c.ellipse(actor.x, floor + 1, 18 - Math.min(actor.y / 8, 7), 4, 0, 0, Math.PI * 2);
  c.fill();

  if (actor.phase === 'windup') drawTell(c, actor);
  c.save();
  if (actor.hit > 0 && actor.hp > 0 && !reducedMotion) {
    c.translate(actor.x, floor - actor.y);
    c.rotate(actor.impactFacing * Math.min(.16, actor.hit * .7));
    c.translate(-actor.x, -floor + actor.y);
  }
  fighter(c, actor, elapsed);
  c.restore();
}

function drawProjectile(c, shot, elapsed, reducedMotion) {
  const { x, y, vx, color, type, radius, ultimate } = shot;
  const facing = Math.sign(vx);
  const trail = ultimate ? 24 : 15;
  if (type === 'slam') {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(x - trail * facing, y + radius);
    c.lineTo(x - 3 * facing, y + radius - 2);
    c.lineTo(x + 2 * facing, y - radius);
    c.lineTo(x + radius * facing, y + radius);
    c.fill();
    line(c, light, 1, [x - 3 * facing, y + radius - 2], [x + 2 * facing, y - radius]);
  } else if (type === 'orb') {
    c.save();
    const vy = shot.returning ? shot.vy : y < shot.cruiseY ? shot.dropSpeed : 0;
    const speed = Math.hypot(vx, vy) || 1;
    const tailX = x - vx / speed * trail;
    const tailY = y - vy / speed * trail;
    c.globalAlpha = shot.spent ? .46 : .76;
    line(c, shot.returning ? light : color, ultimate ? 3 : 1.8, [tailX, tailY], [x, y]);
    const turnAge = elapsed - (shot.turnedAt ?? -Infinity);
    if (turnAge < .18) {
      c.globalAlpha = 1 - turnAge / .18;
      c.strokeStyle = light;
      c.lineWidth = ultimate ? 2 : 1.2;
      c.beginPath();
      c.arc(x, y, radius + 3 + (reducedMotion ? 0 : turnAge * 32), 0, Math.PI * 2);
      c.stroke();
    }
    c.globalAlpha = shot.spent ? .84 : 1;
    c.translate(Math.round(x), Math.round(y));
    if (!reducedMotion) c.rotate(Math.floor((elapsed - shot.launchedAt) * 24) * .43);
    c.scale(radius / 12, radius / 12);
    paintIndexDisc(c, color, ultimate);
    c.restore();
  } else {
    line(c, color, radius, [x - trail * facing, y], [x, y]);
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(x - radius * facing, y - radius);
    c.lineTo(x + radius * facing, y);
    c.lineTo(x - radius * facing, y + radius);
    c.fill();
    line(c, light, 1.4, [x - radius * 2 * facing, y], [x + radius * facing, y]);
  }
}

function drawStrike(c, effect, progress) {
  const { x, y, facing, origin, reach, weaponType, ultimate, color, offset } = effect;
  const weight = ultimate ? 3.6 : 1.8;
  c.save();
  c.globalAlpha = 1 - progress;
  c.translate(x, y);
  c.scale(facing, 1);
  if (weaponType === 'slam') {
    c.strokeStyle = color;
    c.lineWidth = weight;
    c.beginPath();
    c.ellipse(22, 4, 11 + progress * (ultimate ? 34 : 19), 4 + progress * 6, 0, 0, 2 * Math.PI);
    c.stroke();
    line(c, light, weight * .55, [19, -13], [22, 2], [31, -4]);
  } else if (weaponType === 'orb') {
    c.translate(offset, 0);
    const flash = (ultimate ? 12 : 8) + progress * 9;
    c.strokeStyle = color;
    c.lineWidth = weight;
    c.beginPath();
    c.ellipse(0, 0, flash, flash * .72, 0, 0, Math.PI * 2);
    c.stroke();
    line(c, light, 1, [4, -flash * .42], [flash, 0], [flash + 5, 4]);
  } else if (weaponType === 'bolt') {
    line(c, color, weight, [23, -24], [30, -11], [23, 0], [38 + progress * 9, 0]);
    line(c, light, 1, [23, -9], [23, 0], [34, 0]);
  } else {
    if (weaponType === 'dash' || weaponType === 'lunge') {
      const pathStart = (origin - x) * facing;
      line(c, color, weight, [pathStart, 4], [15, 2], [reach - 1, -2]);
      line(c, color, weight * .6, [pathStart + 8, 12], [reach - 11, 8]);
    }
    if (weaponType === 'reach' || weaponType === 'dash') {
      line(c, color, weight, [reach * .37, 1], [reach, 1], [reach - 6, -3]);
      line(c, light, 1, [reach * .60, -2], [reach - 1, -2]);
    } else {
      c.strokeStyle = color;
      c.lineWidth = weight;
      c.beginPath();
      const curve = weaponType === 'slash' ? -.42 : .14;
      c.ellipse(reach * .49, 0, reach * .50, ultimate ? 29 : 16, curve, -1.22, 1.22);
      c.stroke();
      if (ultimate) {
        c.strokeStyle = light;
        c.lineWidth = 1.2;
        c.beginPath();
        c.ellipse(reach * .53, 0, reach * .48, 25, curve, -.95, .86);
        c.stroke();
      }
    }
  }
  c.restore();
}

function drawImpact(c, effect, progress, reducedMotion) {
  if (progress >= .65) return;
  const { color, facing, push, x, y, ultimate } = effect;
  const force = 7 + push * .62;
  const spread = reducedMotion ? force : force * (.55 + progress * 2.15);
  c.save();
  c.translate(x, y);
  c.scale(facing, 1);
  c.globalAlpha = 1 - progress / .65;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(-spread * .45, 0);
  c.lineTo(1, -spread * .61);
  c.lineTo(spread * .24, -2);
  c.lineTo(spread, 0);
  c.lineTo(spread * .28, 2);
  c.lineTo(0, spread * .65);
  c.fill();
  line(c, light, ultimate ? 2.2 : 1.4, [-4, 2], [0, -2], [spread * .61, 0]);
  for (let i = 0; i < 5; i++) {
    const angle = (i - 2) * .58;
    const px = Math.cos(angle) * spread;
    const py = Math.sin(angle) * spread;
    c.fillStyle = i % 2 ? color : light;
    c.fillRect(Math.round(px), Math.round(py), i % 2 ? 3 : 2, 1.5);
  }
  c.restore();
}

function drawDamage(c, hit, age, reducedMotion, viewTop) {
  const progress = 1 - (hit.time - age) / hit.duration;
  const x = clamp(hit.x + hit.facing * 8, 26, width - 26);
  const y = Math.max(viewTop + 18, hit.labelY - (reducedMotion ? 0 : progress * 12));
  c.save();
  c.globalAlpha = Math.min(1, (1 - progress) * 2.8);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = `bold ${hit.ultimate ? 15 : 12}px monospace`;
  c.strokeStyle = '#181320';
  c.lineWidth = 2.5;
  c.strokeText(String(hit.damage), x, y);
  c.fillStyle = hit.ultimate ? light : hit.color;
  c.fillText(String(hit.damage), x, y);
  if (hit.counter) {
    c.font = 'bold 8px monospace';
    c.strokeText('COUNTER', x, y - 10);
    c.fillText('COUNTER', x, y - 10);
  }
  c.restore();
}

export function drawWeaponEffects(c, duel, feedbackAge, reducedMotion, viewTop) {
  for (const shot of duel.projectiles) drawProjectile(c, shot, duel.elapsed, reducedMotion);
  let playerHit, rivalHit;
  for (const effect of duel.effects) {
    if (effect.time <= feedbackAge) continue;
    const progress = 1 - (effect.time - feedbackAge) / effect.duration;
    if (effect.type === 'hit') {
      drawImpact(c, effect, progress, reducedMotion);
      if (effect.target === 'player') playerHit = effect;
      else rivalHit = effect;
    } else {
      drawStrike(c, effect, progress);
    }
  }
  if (playerHit) drawDamage(c, playerHit, feedbackAge, reducedMotion, viewTop);
  if (rivalHit) drawDamage(c, rivalHit, feedbackAge, reducedMotion, viewTop);
}
