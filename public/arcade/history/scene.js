import { drawArmedFighter, drawWeaponEffects } from '../fight-render.js';
import { FLOOR as floor } from '../duel.js';
import { spriteDensity } from '../fighter-sprites.js';
import { paintStage, stages } from '../stages.js';
import { GRIP_UNITS_PER_METER, bossWeaponHands, drawBossBody, prepareBossArt } from './boss-art.js';
import { bossBodyPose, pistolAngle } from './boss-pose.js';
import { clamp } from './duel.js';
import { paintBossShield, paintBossWeapon } from './weapon-art.js';

const stageWidth = 480;
const stageHeight = 270;

function polygon(c, color, points) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  c.fill();
}

function rect(c, color, x, y, w, h) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

function line(c, color, width, points) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.stroke();
}

function pillars(c, color, xs, top, base, width) {
  for (const x of xs) {
    rect(c, color, x, top, width, base - top);
    rect(c, '#ffffff14', x + 3, top + 8, 3, base - top - 15);
    rect(c, color, x - 4, top, width + 8, 8);
    rect(c, color, x - 4, base - 6, width + 8, 6);
  }
}

const scenery = {
  hook(c, color) {
    polygon(c, color, [[29,187],[98,84],[169,187]]);
    polygon(c, '#ffffff12', [[98,84],[169,187],[114,187]]);
    polygon(c, color, [[249,188],[330,88],[416,188]]);
    pillars(c, '#533444', [8,58,402,452], 73, 196, 20);
    rect(c, '#7b4e4b', 0, 68, 95, 9);
    rect(c, '#7b4e4b', 385, 68, 95, 9);
  },
  spear(c, color) {
    pillars(c, color, [15,75,135,325,385,445], 76, 190, 16);
    rect(c, color, 0, 70, 164, 7);
    rect(c, color, 317, 70, 163, 7);
    for (let i = 0; i < 6; i++) rect(c, '#70878d', 169 - i * 10, 157 + i * 6, 142 + i * 20, 2);
  },
  guard(c, color) {
    rect(c, '#bb8279', 0, 164, 480, 28);
    rect(c, color, 0, 134, 480, 11);
    for (let x = 11; x < 480; x += 59) {
      rect(c, color, x, 144, 12, 41);
      rect(c, '#f1b18d50', x + 16, 172, 20, 1);
    }
    pillars(c, '#47314b', [25,435], 65, 194, 16);
  },
  slam(c, color) {
    rect(c, color, 0, 59, 480, 135);
    for (let x = 29; x < 460; x += 59) {
      polygon(c, '#a298a1', [[x,169],[x,112],[x+13,95],[x+26,112],[x+26,169]]);
      rect(c, '#564962', x + 12, 108, 2, 61);
      rect(c, '#564962', x, 129, 26, 2);
    }
    pillars(c, '#3d314a', [0,58,119,344,403,463], 51, 197, 17);
  },
  bow(c, color) {
    for (const x of [25,97,331,404]) {
      polygon(c, color, [[x,186],[x+5,164],[x+21,153],[x+44,164],[x+48,186]]);
      line(c, '#d0c3a158', 1, [[x+5,164],[x+44,164]]);
      rect(c, '#232c3b', x + 17, 175, 9, 11);
    }
    for (let x = 0; x < 480; x += 9) {
      line(c, color, 1, [[x,198],[x+3,190-x%7]]);
    }
  },
  pistol(c, color) {
    rect(c, color, 0, 0, 480, 196);
    polygon(c, '#1d2430', [[0,0],[480,0],[332,70],[146,70]]);
    polygon(c, '#5c5054', [[0,196],[146,70],[146,180],[0,214]]);
    polygon(c, '#4f494f', [[480,196],[332,70],[332,180],[480,214]]);
    rect(c, '#191d28', 198, 105, 84, 86);
    rect(c, '#3e4147', 205, 110, 70, 81);
    for (const x of [120,240,360]) {
      const light = c.createRadialGradient(x, 66, 2, x, 66, 48);
      light.addColorStop(0, '#ffbd6466');
      light.addColorStop(1, '#ffbd6400');
      rect(c, light, x-48, 18, 96, 96);
      rect(c, '#ffcd92', x-8, 64, 16, 3);
    }
  },
};

export async function loadStageArt(chapter) {
  if (!chapter.stageArt) return null;
  const image = new Image();
  image.src = new URL(`./stages/${chapter.stageArt}`, import.meta.url).href;
  try {
    await image.decode();
    return image;
  } catch {
    return null;
  }
}

export function backdrop(chapter) {
  const canvas = document.createElement('canvas');
  canvas.width = stageWidth;
  canvas.height = stageHeight;
  const c = canvas.getContext('2d');
  if (chapter.pattern === 'saber') {
    paintStage(c, stages.napoleon);
    return canvas;
  }
  const [sky, horizon, rock, stone] = chapter.colors;
  const gradient = c.createLinearGradient(0, 0, 0, 202);
  gradient.addColorStop(0, sky);
  gradient.addColorStop(1, horizon);
  rect(c, gradient, 0, 0, 480, 207);
  for (let i = 0; i < 50; i++) rect(c, '#ffe5bd50', (i*139+11)%480, (i*53+4)%92, i%7===0?2:1, 1);
  c.fillStyle = chapter.accent;
  c.beginPath();
  c.arc(326, 56, 21, 0, Math.PI * 2);
  c.fill();
  polygon(c, '#23223b6d', [[0,146],[54,119],[112,143],[192,112],[272,138],[319,124],[370,146],[449,114],[480,134],[480,197],[0,197]]);
  scenery[chapter.pattern](c, rock);

  rect(c, rock, 0, 195, 480, 75);
  for (const [i, y] of [197, 206, 218, 234, 255].entries()) {
    const step = 27 + i * 12;
    const depth = 7 + i * 3;
    for (let x = i % 2 ? -step / 2 : 0; x < 480; x += step) {
      polygon(c, stone, [[x,y],[x+step-2,y],[x+step+2,y+depth],[x-3,y+depth]]);
      rect(c, '#e8bda324', x, y, step-3, 1);
    }
  }
  return canvas;
}

function shadow(c, x, lift) {
  c.fillStyle = '#1918279c';
  c.beginPath();
  c.ellipse(x, floor, 21 - lift / 9, 4, 0, 0, Math.PI * 2);
  c.fill();
}

const steel = '#f3dfbc';

function drawBoss(c, duel, sprite, reducedMotion) {
  const {opponent: boss, chapter} = duel;
  const {move} = boss;
  const wind = move && !boss.struck;
  const special = move === chapter.special;
  const burst = move && move === chapter.finalPhase?.attack;
  const charge = wind ? clamp(boss.attack / boss.windup, 0, 1) : 0;
  const lastBeat = move?.beats?.[duel.strikeIndex - 1]?.at ?? 0;
  const strikeAge = boss.struck ? boss.attack - boss.windup - lastBeat : Infinity;
  const strike = strikeAge < .17;
  const shield = chapter.pattern === 'guard' && !boss.evade && duel.elapsed >= boss.recoverUntil
    && (!move || wind || (special && strike));
  const height = Math.round(boss.bodyHeight);
  const poseScale = boss.bodyHeight / (chapter.stature * GRIP_UNITS_PER_METER);
  const body = bossBodyPose(boss, wind, strike);
  const walking = !reducedMotion && boss.moving && boss.y === 0 && boss.hit === 0 && boss.hp > 0;
  if ((special || burst || boss.intent) && wind) {
    c.strokeStyle = chapter.accent;
    c.lineWidth = burst ? 3 : 2;
    c.globalAlpha = .35 + charge * .65;
    c.beginPath();
    c.ellipse(boss.x, floor, 24 + charge * 12, 5 + charge * 4, 0, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  }
  if (boss.evade?.kind === 'step' && boss.moving) {
    const tail = -boss.evade.direction;
    line(c, chapter.accent + '9a', 1.5, [[boss.x + tail * 12, floor - 4], [boss.x + tail * 31, floor - 4]]);
    line(c, chapter.accent + '65', 1, [[boss.x + tail * 17, floor - 10], [boss.x + tail * 36, floor - 10]]);
  }
  c.save();
  c.translate(body.x, body.y);
  c.scale(boss.facing, 1);
  c.rotate(body.angle);
  if (boss.hit > 0) c.globalAlpha = .7;
  const art = prepareBossArt(sprite, chapter);
  const hands = bossWeaponHands(art, height);
  const torso = drawBossBody(c, art, height, walking ? boss.gait : undefined, true);
  c.translate(torso.x, torso.y);
  if (shield) paintBossShield(c, chapter.shieldGrip, poseScale, strike);
  const holdingAim = boss.struck && duel.strikeIndex < (move?.beats?.length ?? 1);
  const aim = chapter.pattern === 'pistol' ?
    pistolAngle(move ? boss.pistolPitch : undefined, charge, strikeAge, body.angle, holdingAim) : undefined;
  paintBossWeapon(c, chapter, poseScale, charge, strikeAge, hands, aim);
  c.restore();
}

function shotTrail(shot, length) {
  const y = floor - shot.y;
  if (shot.vx === undefined) return [[shot.x - length * shot.facing,y + 1],[shot.x,y]];
  const distance = Math.hypot(shot.x - shot.launchX, shot.y - shot.launchY);
  const tailTime = Math.min(length, distance) / shot.speed;
  return [[shot.x - shot.vx * tailTime,y + shot.vy * tailTime],[shot.x,y]];
}

function impact(c, x, y, facing, heavy, progress) {
  const fade = Math.max(0, 1 - progress * 2.6);
  const size = (heavy ? 10 : 6) + progress * (heavy ? 34 : 26);
  c.save();
  c.globalAlpha = fade;
  for (const [index, angle] of [-1.2, -.72, -.27, .19, .66, 1.14].entries()) {
    const dx = Math.cos(angle) * facing;
    const dy = Math.sin(angle);
    const start = size * (.35 + index % 2 * .17);
    const end = size + index % 3 * 2;
    line(c, index % 2 === 0 ? '#fff4ce' : '#ffb066', heavy ? 2.5 : 1.5,
      [[x + dx * start, y + dy * start], [x + dx * end, y + dy * end]]);
  }
  c.restore();
}

export function render(c, duel, background, sprite, zoom, feedbackAge = 0, reducedMotion = false) {
  const {player, opponent: boss, chapter, volley, sparks} = duel;
  const time = reducedMotion ? 0 : duel.time;
  const width = stageWidth;
  const height = stageHeight;
  const canvas = c.canvas;
  const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
  const viewHeight = aspect > 0 ? Math.round(clamp(width / aspect, 120, 1100)) : height;
  const pixelHeight = viewHeight * spriteDensity;
  if (canvas.width !== width * spriteDensity) canvas.width = width * spriteDensity;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  c.clearRect(0, 0, canvas.width, canvas.height);

  const separation = Math.abs(player.x - boss.x);
  const headroom = Math.max(138 + player.y, boss.bodyHeight + boss.y + 18);
  const framing = clamp(viewHeight / height, 1, 1.65);
  const scale = Math.min(zoom * framing, width / (separation + 84), (viewHeight - 14) / (headroom + 32));
  const halfWidth = width / (2 * scale);
  const center = halfWidth >= width / 2 ? width / 2 : clamp((player.x + boss.x) / 2, halfWidth, width - halfWidth);
  const screenFloor = clamp(viewHeight / 2 + (floor - height / 2) * scale,
    headroom * scale + 6, viewHeight - 26 * scale);
  const viewTop = floor - screenFloor / scale;
  const viewBottom = floor + (viewHeight - screenFloor) / scale;

  c.save();
  c.imageSmoothingEnabled = false;
  c.scale(spriteDensity, spriteDensity);
  c.translate(width / 2, screenFloor);
  c.scale(scale, scale);
  c.translate(-center, -floor);
  c.drawImage(background, 0, 0, width, height);
  // Blend visible edges of the plate into the full-window backdrop.
  c.save();
  c.globalCompositeOperation = 'destination-out';
  for (const [edge, inside] of [[0, 20], [height, height - 18]]) {
    if (edge < viewTop || edge > viewBottom) continue;
    const fade = c.createLinearGradient(0, edge, 0, inside);
    fade.addColorStop(0, '#000');
    fade.addColorStop(1, '#0000');
    rect(c, fade, 0, Math.min(edge, inside), width, Math.abs(edge - inside));
  }
  c.restore();
  for (let i = 0; i < 24; i++) {
    const life = (time * (.05 + i%4*.012) + i*.43) % 1;
    rect(c, chapter.accent + '7a', (i*119+life*31)%480, 210-life*(25+i%7*12), 1+i%2, 1);
  }
  shadow(c, boss.x, boss.y);
  drawBoss(c, duel, sprite, reducedMotion);
  drawArmedFighter(c, player, time, reducedMotion);
  for (const shot of volley) {
    const length = shot.kind === 'round' ? 20 : shot.kind === 'wave' ? 10 : shot.kind === 'arrow' ? 18 : 12;
    const width = (shot.kind === 'wave' ? 4 : 2) + (shot.special ? 2 : 0);
    const trail = shotTrail(shot, length);
    const [, [headX, headY]] = trail;
    line(c, chapter.accent, width, trail);
    rect(c, steel, headX - 1, headY - 1, 3, 2);
  }
  for (const spark of sparks) {
    if (spark.life <= feedbackAge) continue;
    const {x, y, color, duration, label, kind, origin, facing, special, reach, heavy} = spark;
    const life = spark.life - feedbackAge;
    const progress = 1 - life / duration;
    c.globalAlpha = life / duration;
    if (label) {
      if (kind === 'impact') impact(c, x, floor-y, facing, heavy, progress);
      c.font = 'bold 12px monospace';
      c.textAlign = 'center';
      c.strokeStyle = '#221928';
      c.lineWidth = 3;
      c.strokeText(label, x, floor-y-14-progress*18);
      c.fillStyle = color;
      c.fillText(label, x, floor-y-14-progress*18);
    } else if (kind === 'slash') {
      const tip = x + facing * reach;
      if (origin !== x) line(c, color, special ? 5 : 2, [[origin,floor-y+7],[x,floor-y+7]]);
      if (chapter.pattern === 'spear') {
        line(c, color, special ? 4 : 2, [[x+facing*15,floor-y],[tip,floor-y]]);
      } else {
        c.strokeStyle = color;
        c.lineWidth = special ? 4 : 2;
        c.beginPath();
        c.ellipse(x + facing * reach * .45, floor-y, reach*.55, special ? 25 : 16,
          .16 * facing, facing === 1 ? -1.4 : Math.PI-1.4, facing === 1 ? 1.4 : Math.PI+1.4);
        c.stroke();
      }
    } else {
      const spread = 3 + progress * 12;
      for (let i = 0; i < 6; i++) {
        rect(c, color, x + Math.cos(i) * spread, floor-y + Math.sin(i) * spread, 2, 2);
      }
    }
  }
  c.globalAlpha = 1;
  drawWeaponEffects(c, duel, feedbackAge, reducedMotion, viewTop);
  c.restore();
}
