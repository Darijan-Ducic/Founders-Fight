import { chapters, chapterNumber } from './roster.js';
import { footstep } from './gait.js';
import { UNITS_PER_METER } from '../duel.js';
import { GRIP_UNITS_PER_METER, pistolSocket } from './boss-pose.js';

export { GRIP_UNITS_PER_METER } from './boss-pose.js';

const frameCount = 24;
const rasterHeight = 320;
const prepared = new WeakMap();
const rigs = {
  hook: { hinge: .57, center: .47 },
  spear: { hinge: .79, center: .45, shoeDepth: .035 },
  guard: { hinge: .60, center: .53 },
  slam: { hinge: .63, center: .54 },
  bow: { hinge: .76, center: .47 },
  saber: { hinge: .57, center: .47 },
  pistol: { hinge: .57, center: .46 },
};

// Socket, cut and skin swatch coordinates are relative to each resting grip.
const weaponHands = {
  hook: {
    socket: [-3.15,-3.75], cut: [[-6.4,-2.3],[-.6,-5.35],[5.3,-3.6],[5.3,7],[-6.6,7]],
    swatches: { light: [-2,-2], mid: [1,-1], shadow: [0,2], crease: [-1,2] },
  },
  spear: {
    socket: [-2.35,-3.9], cut: [[-4.4,-1.7],[-.65,-5.65],[5.5,-4.2],[5.4,6],[-4.25,6]],
    swatches: { light: [-1.6,-3.1], mid: [1.1,-.6], shadow: [.7,3], crease: [-.25,1.45] },
  },
  guard: {
    socket: [-2.9,-3.25], cut: [[-5.55,-1.25],[-.65,-4.95],[5.5,-3.5],[5.5,7],[-4.7,7]],
    swatches: { light: [-2,-2], mid: [2,0], shadow: [-2,2], crease: [-1,2] },
  },
  slam: {
    socket: [-3.1,-4.15], cut: [[-5.9,-2.65],[-1.6,-6.05],[5.8,-4.8],[5.8,7],[-5.5,7]],
    swatches: { light: [-3,-4], mid: [-1,0], shadow: [0,2], crease: [-2,1] },
  },
  bow: {
    socket: [-.85,-4.25], cut: [[-4.1,-3.4],[2.4,-5.1],[4.6,-2.1],[4.7,6.5],[-4.1,6.5]],
    swatches: { light: [-1.65,-2.65], mid: [1.65,-.2], shadow: [.7,3.4], crease: [1.1,2.3] },
  },
  saber: {
    socket: [-.85,-4.4], cut: [[-4.15,-3.15],[1.3,-5.5],[4.9,-3.1],[4.9,6.6],[-4.25,6.6]],
    swatches: { light: [-2,-3], mid: [1,1], shadow: [2,0], crease: [-1,-1] },
  },
  pistol: {
    socket: pistolSocket, cut: [[-7.1,-4.95],[-3.25,-9.1],[1,-9.2],[7.7,-5],[8.2,3.5],[-6.8,3.5]],
    swatches: { light: [-2.2,-4.7], mid: [1.3,-3.2], shadow: [4.45,-1.15], crease: [2.45,-.95] },
  },
};

const supportHands = {
  spear: {
    socket: [-5.8,-1.7],
    cut: [[-6.5,1],[-5.7,-4.05],[-.7,-5.3],[3.7,-5.1],[7.8,-2.8],[7.8,1.5],[5.7,3.8],[2.8,5.4],[-2.7,3.5]],
    swatches: { light: [-1.9,-3], mid: [-2.5,-.5], shadow: [2.7,3.1], crease: [.1,1.7] },
    robeOffset: 11.2,
  },
  bow: {
    swatches: { light: [-1.8,-2.1], mid: [-1.2,-.05], shadow: [1.45,2.5], crease: [.65,1.9], wrist: [-3,-1.7] },
  },
};

function canvas(width, height) {
  const result = document.createElement('canvas');
  result.width = width;
  result.height = height;
  return result;
}

function sampleSkinTone(pixels, width, x, y) {
  // Average a small patch of opaque skin to smooth single-pixel color noise.
  const center = Math.round(y) * width + Math.round(x);
  const channels = [0, 0, 0];
  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      const pixel = (center + row * width + col) * 4;
      for (let channel = 0; channel < 3; channel++) channels[channel] += pixels[pixel + channel];
    }
  }
  return '#' + channels.map(value => Math.round(value / 9).toString(16).padStart(2, '0')).join('');
}

function prepareWristTexture(body, hand, wristX, wristY, units) {
  // Unwrap the original skin along the same line used to cut the hand from
  // the torso. The first row follows the arm edge in every pose.
  const [[leftX, leftY], [rightX, rightY]] = hand.cut;
  const span = Math.hypot(rightX - leftX, rightY - leftY);
  const acrossX = (rightX - leftX) / span;
  const acrossY = (rightY - leftY) / span;
  const outwardX = -acrossY;
  const outwardY = acrossX;
  const seam = ((leftX - hand.socket[0]) * outwardX + (leftY - hand.socket[1]) * outwardY) * units;
  const x = wristX + outwardX * seam;
  const y = wristY + outwardY * seam;
  const half = Math.ceil(3.8 * units);
  const overlap = 2;
  const image = canvas(half * 2, Math.ceil(4.4 * units) + overlap);
  const c = image.getContext('2d');
  c.setTransform(acrossX, outwardX, acrossY, outwardY,
    half - x * acrossX - y * acrossY, overlap - x * outwardX - y * outwardY);
  c.drawImage(body, 0, 0);
  c.resetTransform();
  const fade = c.createLinearGradient(0, overlap + units * 1.55, 0, image.height);
  fade.addColorStop(0, '#fff');
  fade.addColorStop(1, '#fff0');
  c.globalCompositeOperation = 'destination-in';
  c.fillStyle = fade;
  c.fillRect(0, 0, image.width, image.height);
  return { image, x, y, acrossX, acrossY, half, overlap };
}

function prepareGrip(sprite, c, hand, anchor, units, pixels) {
  const {body, width, height, top} = sprite;
  const x = Math.round(width / 2) + anchor[0] * units;
  const y = top + height + anchor[1] * units;
  const swatches = hand.socket ? { ...hand.swatches, wrist: hand.socket } : hand.swatches;
  const skin = Object.fromEntries(Object.entries(swatches).map(([tone, [dx, dy]]) => [
    tone, sampleSkinTone(pixels, width, x + dx * units, y + dy * units),
  ]));
  const surface = canvas(Math.ceil(5.4 * units), Math.ceil(5.4 * units));
  surface.getContext('2d').drawImage(body, 2.7 * units - x, 3 * units - y);
  if (!hand.cut) return {skin, surface};

  const wristX = x + hand.socket[0] * units;
  const wristY = y + hand.socket[1] * units;
  c.save();
  c.beginPath();
  c.moveTo(x + hand.cut[0][0] * units, y + hand.cut[0][1] * units);
  for (const [dx, dy] of hand.cut.slice(1)) c.lineTo(x + dx * units, y + dy * units);
  c.closePath();
  if (hand.robeOffset) {
    // Continue the folds behind the original splayed hand before closing it.
    c.clip();
    c.drawImage(body, 0, -hand.robeOffset * units);
  } else {
    c.globalCompositeOperation = 'destination-out';
    c.fill();
  }
  c.restore();

  const texture = prepareWristTexture(body, hand, wristX, wristY, units);
  return { wristX, wristY, texture, surface, skin };
}

function prepareWeaponHands(sprite, chapter, pixels) {
  const {body, width, height, top, hinge} = sprite;
  const units = (UNITS_PER_METER / GRIP_UNITS_PER_METER) * height / Math.round(chapter.stature * UNITS_PER_METER);
  const armedBody = canvas(width, top + hinge);
  const c = armedBody.getContext('2d');
  c.drawImage(body, 0, 0);
  const primary = prepareGrip(sprite, c, weaponHands[chapter.pattern], chapter.grip, units, pixels);
  const support = chapter.supportGrip && prepareGrip(sprite, c, supportHands[chapter.pattern], chapter.supportGrip, units, pixels);
  return {body: armedBody, primary, support};
}

const mix = (from, to, amount) => from + (to - from) * amount;
const smooth = amount => {
  const t = Math.max(0, Math.min(1, amount));
  return t * t * (3 - 2 * t);
};

function footBounds(pixels, width, rows, split, depth) {
  const rear = { sole: 1, edge: 0 };
  const front = { sole: 1, edge: width };
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] < 128) continue;
      (x < split ? rear : front).sole = y;
    }
  }
  // The lowest pixels identify the boots even when the robe covers the ankle.
  for (let y = Math.max(0, Math.min(rear.sole, front.sole) - depth); y < rows; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] < 128) continue;
      if (x < split && y >= rear.sole - depth) rear.edge = Math.max(rear.edge, x);
      if (x >= split && y >= front.sole - depth) front.edge = Math.min(front.edge, x);
    }
  }
  return [rear, front];
}

function legFrames(context, width, top, height, hinge, rig) {
  const rows = height - hinge;
  const pixels = context.getImageData(0, top + hinge, width, rows).data;
  const source = new Uint32Array(pixels.buffer);
  const split = Math.round(rig.center * width);
  const shoeDepth = Math.round(height * (rig.shoeDepth ?? .055));
  const [rear, front] = footBounds(pixels, width, rows, split, shoeDepth);
  const padding = Math.ceil(height * .07) + 1;
  const headroom = Math.round(height * .012);
  const frameHeight = rows + headroom;
  const ground = frameHeight - 1;
  const sheet = canvas(width + padding * 2, frameHeight * (frameCount + 1));
  const target = sheet.getContext('2d');
  const frame = target.createImageData(sheet.width, frameHeight);
  const output = new Uint32Array(frame.data.buffer);
  const poses = [];
  const rest = { offset: 0, lift: 0 };

  for (let index = 0; index <= frameCount; index++) {
    const standing = index === frameCount;
    const phase = index / frameCount;
    const rearStep = standing ? rest : footstep(phase);
    const frontStep = standing ? rest : footstep(phase + .5);
    const rearX = Math.round(rearStep.offset * height);
    const frontX = Math.round(frontStep.offset * height);
    const rearLift = Math.round(rearStep.lift * height);
    const frontLift = Math.round(frontStep.lift * height);
    const rise = standing ? 0 : Math.round(headroom * Math.sin((phase - .04) * Math.PI * 2) ** 2);
    const lean = standing ? 0 : Math.round(height * .012);
    poses.push({ lean, rise });
    const hip = headroom - rise;
    const softLeft = split + lean - width * .17;
    const softRight = split + lean + width * .17;
    const bootLeft = Math.max(softLeft, rear.edge + rearX + 2);
    const bootRight = Math.min(softRight, front.edge + frontX - 2);
    const firmY = ground - Math.max(rearLift, frontLift) - shoeDepth;
    output.fill(0);

    for (let y = hip; y < frameHeight; y++) {
      // The wide transition near the hips keeps the robe in one piece. The
      // transition narrows between the boots, where each shoe moves rigidly.
      const firm = smooth((y - hip) / (firmY - hip));
      const left = mix(softLeft, bootLeft, firm);
      const band = Math.max(1, mix(softRight, bootRight, firm) - left);
      for (let x = 0; x < sheet.width; x++) {
        const column = x - padding;
        const weight = smooth((column - left) / band);
        const offset = mix(rearX, frontX, weight);
        const lift = mix(rearLift, frontLift, weight);
        const ankle = ground - lift - shoeDepth;
        const sourceAnkle = mix(rear.sole, front.sole, weight) - shoeDepth;
        const progress = Math.min(1, (y - hip) / (ankle - hip));
        const flex = lift * .48 * 4 * progress * (1 - progress);
        const fromY = Math.round(sourceAnkle * progress + Math.max(0, y - ankle));
        const fromX = Math.round(column - mix(lean, offset, smooth(progress)) - flex);
        const sourceFoot = fromX < split ? rear : front;
        if (fromY >= 0 && fromY <= sourceFoot.sole - shoeDepth && fromX >= 0 && fromX < width) {
          output[y * sheet.width + x] = source[fromY * width + fromX];
        }
      }
    }

    // Copy each shoe from the original art at its own offset. The leg above
    // bends to meet it while the pixels at the sole move as one piece.
    const boots = [
      { sole: rear.sole, left: 0, right: split, x: rearX, lift: rearLift },
      { sole: front.sole, left: split, right: width, x: frontX, lift: frontLift },
    ];
    for (const boot of boots) {
      const top = ground - boot.lift - shoeDepth;
      for (let y = 0; y <= shoeDepth; y++) {
        const fromY = boot.sole - shoeDepth + y;
        for (let x = boot.left; x < boot.right; x++) {
          const pixel = fromY * width + x;
          if (pixels[pixel * 4 + 3] > 0) {
            output[(top + y) * sheet.width + padding + boot.x + x] = source[pixel];
          }
        }
      }
    }
    target.putImageData(frame, 0, index * frameHeight);
  }
  return { sheet, padding, headroom, frameHeight, poses };
}

export function prepareBossArt(image, chapter) {
  const existing = prepared.get(image);
  if (existing) return existing;

  const width = Math.round(image.naturalWidth / image.naturalHeight * rasterHeight);
  const body = canvas(width, rasterHeight);
  const context = body.getContext('2d', { willReadFrequently: true });
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, rasterHeight);
  const pixels = context.getImageData(0, 0, width, rasterHeight).data;
  let top = rasterHeight;
  let bottom = -1;
  for (let alpha = 3; alpha < pixels.length; alpha += 4) {
    if (pixels[alpha] < 128) continue;
    const y = Math.floor(alpha / (4 * width));
    top = Math.min(top, y);
    bottom = y;
  }
  if (bottom < top) throw new Error('Empty boss sprite');
  const height = bottom - top + 1;
  const rig = rigs[chapter.pattern];
  const hinge = Math.round(height * rig.hinge);
  const sprite = { body, width, height, top, hinge, ...legFrames(context, width, top, height, hinge, rig) };
  sprite.weaponHands = prepareWeaponHands(sprite, chapter, pixels);
  prepared.set(image, sprite);
  return sprite;
}

export function loadBossArt() {
  return Promise.all(chapters.map(async (chapter, index) => {
    const image = new Image();
    const extension = chapter.pattern === 'pistol' ? 'svg' : 'webp';
    image.src = new URL(`./fighters/${chapterNumber(index)}.${extension}`, import.meta.url).href;
    await image.decode();
    return prepareBossArt(image, chapter);
  }));
}

function drawTorso(context, sprite, scale, x, y, body = sprite.body) {
  context.drawImage(body, 0, sprite.top, sprite.width, sprite.hinge,
    x, y, sprite.width * scale, sprite.hinge * scale);
}

export function drawBossBody(context, sprite, height, phase, armed = false) {
  const scale = height / sprite.height;
  const x = -Math.round(sprite.width / 2) * scale;
  const frame = Math.round((phase ?? 0) * frameCount) % frameCount;
  const index = phase === undefined ? frameCount : (frame + frameCount) % frameCount;
  const pose = { x: sprite.poses[index].lean * scale, y: -sprite.poses[index].rise * scale };
  const body = armed ? sprite.weaponHands.body : undefined;
  drawTorso(context, sprite, scale, x + pose.x, -height + pose.y, body);
  context.drawImage(sprite.sheet, 0, index * sprite.frameHeight, sprite.sheet.width, sprite.frameHeight,
    x - sprite.padding * scale, (sprite.hinge - sprite.headroom) * scale - height,
    sprite.sheet.width * scale, sprite.frameHeight * scale);
  return pose;
}

function placeWrist(hand, scale, left, top) {
  if (!hand?.texture) return hand;
  const {texture} = hand;
  return {
    x: left + hand.wristX * scale,
    y: top + hand.wristY * scale,
    skin: hand.skin,
    surface: hand.surface,
    texture: {
      ...texture, x: left + texture.x * scale, y: top + texture.y * scale, scale,
    },
  };
}

export function bossWeaponHands(sprite, height) {
  const scale = height / sprite.height;
  const left = -Math.round(sprite.width / 2) * scale;
  const top = -height - sprite.top * scale;
  const {primary, support} = sprite.weaponHands;
  return {primary: placeWrist(primary, scale, left, top), support: placeWrist(support, scale, left, top)};
}
