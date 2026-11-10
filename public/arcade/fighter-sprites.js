import { paintWeapon } from './weapon-art.js';
import { UNITS_PER_METER } from './duel.js';
import { matchFighterSkin } from './fighter-skin.js';

export const spriteDensity = 2;

function atlasImage(file){
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = new URL(file, import.meta.url).href;
  });
}

// Isolate the four painted silhouettes by alpha so a wide hat can cross a
// cell boundary without leaking into the neighboring portrait.
function splitAtlas(sheet){
  const canvas = document.createElement('canvas');
  const width = canvas.width = sheet.naturalWidth;
  const height = canvas.height = sheet.naturalHeight;
  const context = canvas.getContext('2d',{willReadFrequently:true});
  context.drawImage(sheet,0,0);
  const pixels = context.getImageData(0,0,width,height).data;
  const visited = new Uint8Array(width*height);
  const queue = new Int32Array(width*height);
  const sprites = [];

  for(let start=0;start<visited.length;start++){
    if(visited[start] || pixels[start*4+3]<120) continue;
    let count=0, left=width, top=height, right=0, bottom=0;
    function enqueue(index){
      if(visited[index] || pixels[index*4+3]<120) return;
      visited[index]=1;
      queue[count++]=index;
    }
    enqueue(start);
    for(let i=0;i<count;i++){
      const index=queue[i];
      const x=index%width, y=Math.floor(index/width);
      left=Math.min(left,x);
      right=Math.max(right,x);
      top=Math.min(top,y);
      bottom=Math.max(bottom,y);
      if(x>0) enqueue(index-1);
      if(x<width-1) enqueue(index+1);
      if(y>0) enqueue(index-width);
      if(y<height-1) enqueue(index+width);
    }
    if(count<width*height*.015) continue;
    const slot=Number(left+right>=width)+2*Number(top+bottom>=height);
    if((sprites[slot]?.count??0)>=count) continue;
    const sprite = document.createElement('canvas');
    sprite.width=right-left+1;
    sprite.height=bottom-top+1;
    const target=sprite.getContext('2d');
    const isolated=target.createImageData(sprite.width,sprite.height);
    for(let i=0;i<count;i++){
      const index=queue[i];
      const x=index%width-left, y=Math.floor(index/width)-top;
      const source=index*4, destination=(y*sprite.width+x)*4;
      isolated.data[destination]=pixels[source];
      isolated.data[destination+1]=pixels[source+1];
      isolated.data[destination+2]=pixels[source+2];
      isolated.data[destination+3]=pixels[source+3];
    }
    target.putImageData(isolated,0,0);
    sprites[slot]={canvas:sprite,count};
  }
  return sprites;
}

export async function loadSpriteAtlases(files) {
  const sheets = await Promise.all(files.map(atlasImage));
  const slots = [];
  for (const [index, sheet] of sheets.entries()) {
    if (!sheet) continue;
    splitAtlas(sheet).forEach(({ canvas }, slot) => {
      slots[index * 4 + slot] = canvas;
    });
  }
  return slots;
}

// Normalized landmarks on the unified sprites: hips, neckline, leg split,
// the forward fist, and the center of the face for the roster crop.
// Statures are working estimates. See references/founder-fight-art.md.
const rigs = [
  { stature: 173, torsoTaper: .15, axis: .48, collar: .227, hips: .566, split: .50, grip: [.855,.352], face: .49 }, // Sam
  { stature: 175, axis: .52, collar: .226, hips: .570, split: .52, grip: [.817,.350], face: .49 }, // Dario
  { stature: 187, axis: .50, collar: .208, hips: .589, split: .52, grip: [.86,.357], face: .48 }, // Elon
  { stature: 185, axis: .52, collar: .207, hips: .574, split: .53, grip: [.86,.352], face: .47 }, // Ellison
  { stature: 180, axis: .50, collar: .228, hips: .558, split: .51, grip: [.89,.350], face: .50 }, // Page
  { stature: 170, axis: .51, collar: .213, hips: .548, split: .52, grip: [.89,.346], face: .50 }, // Bezos
  { stature: 178, axis: .53, collar: .196, hips: .591, split: .53, grip: [.91,.342], face: .51 }, // Buffett
  { height: 126, axis: .49, collar: .211, hips: .602, split: .51, grip: [.89,.351], face: .49 }, // Napoleon
];

function surface(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function rasterize(source, logicalHeight) {
  const height = Math.round(logicalHeight * spriteDensity);
  const width = Math.round(source.width * height / source.height);
  const canvas = surface(width, height);
  const c = canvas.getContext('2d', { willReadFrequently: true });
  c.imageSmoothingQuality = 'high';
  c.drawImage(source, 0, 0, width, height);
  const pixels = c.getImageData(0, 0, width, height);
  for (let alpha = 3; alpha < pixels.data.length; alpha += 4) {
    pixels.data[alpha] = pixels.data[alpha] >= 128 ? 255 : 0;
  }
  c.putImageData(pixels, 0, 0);
  return canvas;
}

function taperWidth(rig, y) {
  const shoulder = Math.min(1, Math.max(0, (y - rig.collar) / .08));
  const waist = Math.min(1, Math.max(0, (rig.hips - y) / .14));
  return 1 - rig.torsoTaper * shoulder * waist;
}

function taperTorso(source, rig) {
  const { width, height } = source;
  const canvas = surface(width, height);
  const c = canvas.getContext('2d');
  const axis = width * rig.axis;
  // Taper the painted torso around its center, blending back to the original
  // silhouette at the collar and hips. The portrait uses the same artwork.
  for (let y = 0; y < height; y++) {
    const scale = taperWidth(rig, (y + .5) / height);
    c.drawImage(source, 0, y, width, 1, axis * (1 - scale), y, width * scale, 1);
  }
  return canvas;
}

export function prepareFighterSprite(source, index) {
  const rig = rigs[index];
  const [handX, handY] = rig.grip;
  const gripX = rig.torsoTaper
    ? rig.axis + (handX - rig.axis) * taperWidth(rig, handY)
    : handX;
  source = matchFighterSkin(source, index);
  if (rig.torsoTaper) source = taperTorso(source, rig);
  const logicalHeight = rig.stature ? rig.stature * UNITS_PER_METER / 100 : rig.height;
  const canvas = rasterize(source, logicalHeight);
  const { width, height } = canvas;
  // Keep the same face pixels and palette in the arena and the close-ups.
  const portraitSize = Math.round(height * rig.collar / .68);
  const portrait = surface(portraitSize, portraitSize);
  portrait.getContext('2d').drawImage(canvas,
    Math.round(portraitSize / 2 - width * rig.face), Math.round(portraitSize * .09));
  return {
    canvas,
    portrait,
    stature: rig.stature,
    axis: Math.round(width * rig.axis),
    shoulders: Math.round(height * rig.collar),
    hips: Math.round(height * rig.hips),
    split: Math.round(width * rig.split),
    gripX: Math.round(width * gripX),
    gripY: Math.round(height * handY),
  };
}

export function drawFittedPortrait(c, sprite) {
  c.save();
  c.resetTransform();
  c.imageSmoothingEnabled = false;
  const size = Math.min(c.canvas.width, c.canvas.height);
  c.drawImage(sprite.portrait, Math.round((c.canvas.width - size) / 2), 0, size, size);
  c.restore();
}

export function drawFittedFighter(c, sprite, actor, time, wind, strike) {
  const { canvas, axis, shoulders, hips, split, gripX, gripY } = sprite;
  const { width, height } = canvas;
  const stride = actor.moving ? Math.sin(time * 15) : 0;
  const bob = actor.moving ? -Math.abs(stride) * 2 : Math.sin(time * 4);
  const lean = wind ? -5 : strike ? 9 : actor.moving ? 3 : 0;
  const collarBand = shoulders + Math.round((hips - shoulders) * .36);
  const torsoWeight = y => Math.min(1, Math.max(0, (hips - y) / (hips - collarBand)));
  const legWeight = y => Math.max(0, (y - hips) / (height - hips));
  const sway = y => Math.round(lean * spriteDensity * torsoWeight(y));
  const sweep = y => Math.round(stride * spriteDensity * 5 * legWeight(y));
  const rise = y => Math.round(bob * spriteDensity * (1 - legWeight(y)));

  c.save();
  c.scale(1 / spriteDensity, 1 / spriteDensity);
  c.imageSmoothingEnabled = false;

  // Draw runs with the same pose offset together. The painted upper torso
  // travels as one piece while the legs stride and the waist bends.
  for (let y = 0; y < height;) {
    const offsetX = sway(y);
    const x = offsetX - axis;
    const strideX = sweep(y);
    const offsetY = rise(y);
    let end = y + 1;
    while (end < height && sway(end) === offsetX && sweep(end) === strideX && rise(end) === offsetY) end++;
    const top = y - height + offsetY;
    const sourceHeight = end - y;
    const targetHeight = end - height + rise(end) - top;
    if (targetHeight > 0) {
      if (strideX === 0) {
        c.drawImage(canvas, 0, y, width, sourceHeight, x, top, width, targetHeight);
      } else {
        c.drawImage(canvas, 0, y, split, sourceHeight, x - strideX, top, split, targetHeight);
        c.drawImage(canvas, split, y, width - split, sourceHeight,
          x + split + strideX, top, width - split, targetHeight);
      }
    }
    y = end;
  }
  c.restore();

  if (actor.weapon) {
    const x = (gripX - axis + sway(gripY)) / spriteDensity;
    const y = (gripY - height + rise(gripY)) / spriteDensity;
    paintWeapon(c, actor, x, y);
    // Preserve the front fingers when the weapon rotates across the hand.
    const edge = 2 * spriteDensity;
    c.drawImage(canvas, gripX - edge, gripY - edge, edge * 2, edge * 2, x - 2, y - 2, 4, 4);
  }
}
