import { paintSkinSurface, skinLight } from './sword-grip.js';

export function paintEquipmentPalm(c, skin, wristX, wristY) {
  const length = Math.hypot(wristX, wristY);
  const towardX = -wristX / length;
  const towardY = -wristY / length;
  const acrossX = -towardY;
  const acrossY = towardX;
  const rootX = wristX + towardX * 1.35;
  const rootY = wristY + towardY * 1.35;
  const blend = c.createLinearGradient(rootX, rootY, 1.1, 3.7);
  blend.addColorStop(0, skin.wrist);
  blend.addColorStop(.36, skin.mid);
  blend.addColorStop(1, skin.shadow);
  c.beginPath();
  c.moveTo(rootX + acrossX * 1.85, rootY + acrossY * 1.85);
  c.quadraticCurveTo(rootX - towardX * .8, rootY - towardY * .8,
    rootX - acrossX * 1.85, rootY - acrossY * 1.85);
  c.lineTo(-acrossX * 2.6, -acrossY * 2.6);
  c.lineTo(acrossX * 2.6, acrossY * 2.6);
  c.closePath();
  c.moveTo(4.03, .12);
  c.ellipse(0, .12, 4.03, 3.55, 0, 0, Math.PI * 2);
  c.fillStyle = blend;
  c.fill();
}

export function paintBowPalm(c, skin, wristX, wristY) {
  const skinShade = c.createLinearGradient(wristX, wristY, 1.7, 4.1);
  skinShade.addColorStop(0, skin.wrist);
  skinShade.addColorStop(.43, skin.mid);
  skinShade.addColorStop(1, skin.shadow);
  c.beginPath();
  c.moveTo(wristX - 1.61,wristY + .96);
  c.quadraticCurveTo(wristX - 1.43,wristY - .47,wristX + .62,wristY + .1);
  c.bezierCurveTo(1.49,-3.83,2.76,-2.48,2.33,-.19);
  c.bezierCurveTo(2.06,1.98,1.75,4.26,.12,4.18);
  c.bezierCurveTo(-1.85,4.2,-2.88,2.65,-2.79,.92);
  c.quadraticCurveTo(-2.8,-1.05,wristX - 1.61,wristY + .96);
  c.fillStyle = skinShade;
  c.fill();
}

export function paintPistolPalm(c, skin, wristX, wristY) {
  const shade = c.createLinearGradient(wristX, wristY, -.7, 4.1);
  shade.addColorStop(0, skin.wrist);
  shade.addColorStop(.49, skin.mid);
  shade.addColorStop(1, skin.shadow);
  c.beginPath();
  c.moveTo(wristX - 1.08,wristY + 1.28);
  c.quadraticCurveTo(wristX - 1.47,wristY - .44,wristX + .51,wristY - .9);
  c.bezierCurveTo(-4.82,-4.88,-3.32,-3.55,-2.66,-2.48);
  c.bezierCurveTo(-1.64,-1.72,.24,-1.16,.38,.34);
  c.bezierCurveTo(.65,1.67,.26,3.58,-.86,3.98);
  c.bezierCurveTo(-2.47,4.27,-4.22,3.71,-4.66,2.39);
  c.bezierCurveTo(-5.06,1.18,-5.68,-1.03,wristX - 1.08,wristY + 1.28);
  c.fillStyle = shade;
  c.fill();
}

function shadePad(c, hand, x, top, bottom, surface) {
  c.closePath();
  c.strokeStyle = hand.skin.crease + '96';
  c.lineWidth = .39;
  c.stroke();
  c.fillStyle = skinLight(c, hand.skin, x, top, bottom);
  c.fill();
  paintSkinSurface(c, hand.surface, ...surface);
}

export function paintBowFingers(c, hand) {
  const {skin} = hand;
  // Keep the web above the wrap and let the four pads curl back around its edge.
  c.beginPath();
  c.moveTo(-2.32,-3.39);
  c.bezierCurveTo(-2.21,-4.21,-.62,-4.49,.05,-3.85);
  c.bezierCurveTo(.68,-3.37,.48,-2.54,.18,-2.06);
  c.bezierCurveTo(.74,-1.73,1.75,-2.02,2.45,-1.58);
  c.bezierCurveTo(3.3,-1.11,3.16,-.3,2.55,-.02);
  c.bezierCurveTo(3.1,.18,3.12,.97,2.5,1.23);
  c.bezierCurveTo(2.96,1.52,2.82,2.24,2.28,2.5);
  c.bezierCurveTo(2.47,3,2.12,3.54,1.59,3.73);
  c.bezierCurveTo(.99,3.98,.55,3.6,.59,3.08);
  c.quadraticCurveTo(.09,2.65,.39,2.06);
  c.quadraticCurveTo(-.17,1.51,.24,.91);
  c.quadraticCurveTo(-.18,.46,.24,-.11);
  c.quadraticCurveTo(-.16,-.59,.25,-1.18);
  c.bezierCurveTo(-.56,-1.17,-1.15,-1.81,-1.19,-2.43);
  c.quadraticCurveTo(-1.31,-3.05,-2.32,-3.39);
  shadePad(c, hand, .7,-3.9,4.29,[-2.46,-4.28,5.65,8.37]);

  const folds = c.createLinearGradient(.12,0,2.82,0);
  folds.addColorStop(0, skin.shadow + '30');
  folds.addColorStop(.67, skin.shadow + 'b8');
  folds.addColorStop(1, skin.shadow + '44');
  c.beginPath();
  c.moveTo(.59,-.2); c.quadraticCurveTo(1.32,-.35,2.48,-.08);
  c.moveTo(.57,1.03); c.quadraticCurveTo(1.38,.86,2.42,1.2);
  c.moveTo(.7,2.23); c.quadraticCurveTo(1.33,2.13,2.19,2.45);
  c.strokeStyle = folds;
  c.lineWidth = .24;
  c.stroke();

  c.beginPath();
  c.moveTo(-.64,-3.43);
  c.quadraticCurveTo(-.17,-3.31,-.25,-2.86);
  c.moveTo(1.38,-1.31);
  c.quadraticCurveTo(1.76,-1.4,2.16,-1.17);
  c.strokeStyle = skin.light + '81';
  c.lineWidth = .26;
  c.stroke();
}

export function paintBowPinch(c, hand, opening) {
  // The thumb and bent index meet at the nock. The rest of the hand is
  // already present in the sprite under the string.
  c.save();
  c.translate(.53 * opening, -.88 * opening);
  c.rotate(-.13 * opening);
  c.beginPath();
  c.moveTo(-3.1, -.86);
  c.bezierCurveTo(-2.76, -2.44, -.72, -2.15, .38, -1.52);
  c.bezierCurveTo(1.11,-1.23,1.1,-.49,.66,-.12);
  c.bezierCurveTo(.28,.29,-.85,.13,-1.1,-.21);
  c.quadraticCurveTo(-1.6,-.42,-2.5,-.48);
  shadePad(c, hand, -1.1,-2.18,.4,[-3.1,-2.4,4.4,2.87]);

  c.beginPath();
  c.moveTo(-.91,-1.83);
  c.quadraticCurveTo(-.49,-1.29,-.67,-.36);
  c.strokeStyle = '#584738';
  c.lineWidth = .81;
  c.stroke();
  c.strokeStyle = '#b99861';
  c.lineWidth = .37;
  c.stroke();
  c.restore();

  c.save();
  c.translate(.88 * opening, .88 * opening);
  c.rotate(.15 * opening);
  c.beginPath();
  c.moveTo(-2.74, .38);
  c.bezierCurveTo(-1.82,-.3,-.83,-.19,.18,.21);
  c.bezierCurveTo(.99,.51,1.03,1.11,.46,1.5);
  c.bezierCurveTo(.07,1.83,-.49,1.71,-.85,1.44);
  c.quadraticCurveTo(-1.65,1.88,-2.9,1.53);
  shadePad(c, hand, -.45,.02,2.06,[-3.05,-.1,4.35,2.3]);
  c.beginPath();
  c.moveTo(-.82,.42);
  c.quadraticCurveTo(-.62,.77,-.71,1.2);
  c.strokeStyle = hand.skin.crease + '6b';
  c.lineWidth = .21;
  c.stroke();
  c.restore();
}

export function paintPistolFingers(c, hand, {strikeAge = Infinity} = {}) {
  const {skin} = hand;
  const squeeze = Math.max(0, 1 - strikeAge / .125) ** 2;
  const curl = squeeze * .34;
  // The palm will cover the base of the index, leaving its bend inside the guard.
  c.beginPath();
  c.moveTo(-2.77,-1.05);
  c.bezierCurveTo(-1.44,-1.74,1.29,-1.89,3.17,-1.52);
  c.bezierCurveTo(4.41,-1.36,4.73 - curl,-.82,4.46 - curl,-.31 + curl);
  c.bezierCurveTo(4.27 - curl,.04 + curl,3.93 - curl,.24 + curl,3.64,.14 + curl);
  c.quadraticCurveTo(3.28,.02 + curl,3.49,-.51 + curl * .5);
  c.bezierCurveTo(2.28,-.69,1.07,-.54,-.15,-.14);
  c.quadraticCurveTo(-1.74,.36,-2.77,-1.05);
  shadePad(c, hand, 1.71,-1.85,.78,[-3,-2.17,7.86,3.19]);

  c.beginPath();
  c.moveTo(2.43,-1.44);
  c.quadraticCurveTo(2.6,-1.12,2.54,-.79);
  c.strokeStyle = skin.crease + '71';
  c.lineWidth = .19;
  c.stroke();
  c.beginPath();
  c.moveTo(2.92,-1.2);
  c.quadraticCurveTo(3.42,-1.27,3.86 - curl,-.99);
  c.strokeStyle = skin.light + '58';
  c.lineWidth = .21;
  c.stroke();

  // Thumb, web and lower fingers share one silhouette around the backstrap.
  const lift = squeeze * .13;
  c.beginPath();
  c.moveTo(-5.39,-2.85);
  c.bezierCurveTo(-4.64,-3.68,-3.41,-3.15,-2.62,-2.68);
  c.bezierCurveTo(-1.67,-2.22,-.79,-1.87,-.64,-1.29);
  c.bezierCurveTo(-.52,-.83,-1.12,-.58,-1.68,-.71);
  c.quadraticCurveTo(-2.26,-.82,-2.95,-.99);
  c.quadraticCurveTo(-2.67,-.48,-1.94,-.28);
  c.bezierCurveTo(-.79,-.31,1.08,-.46 - lift,1.45,.19 - lift);
  c.bezierCurveTo(1.81,.74 - lift,1.41,1.25 - lift,1.01,1.43 - lift);
  c.bezierCurveTo(1.44,1.79 - lift,1.18,2.54 - lift,.68,2.76 - lift);
  c.bezierCurveTo(.9,3.27 - lift,.48,3.91 - lift,-.03,4.1 - lift);
  c.bezierCurveTo(-.92,4.46,-2.6,4.14,-3.48,3.76);
  c.bezierCurveTo(-4.5,3.28,-4.65,1.84,-4.72,.76);
  c.quadraticCurveTo(-5.35,.02,-5.29,-.97);
  c.quadraticCurveTo(-5.85,-1.97,-5.39,-2.85);
  shadePad(c, hand, -3.07,-3.54,4.67,[-5.45,-3.8,7.13,8.36]);

  c.save();
  c.clip();
  const heel = c.createRadialGradient(-4.1,2.91,.21,-3.52,2.59,3.04);
  heel.addColorStop(0, skin.shadow + '83');
  heel.addColorStop(.62, skin.shadow + '28');
  heel.addColorStop(1, skin.shadow + '00');
  c.fillStyle = heel;
  c.fillRect(-5.87,-.64,7.67,5.27);
  for (const [x, y, width] of [[.23,.51,1.03],[-.06,1.91,.96],[-.48,3.18,.8]]) {
    const pad = y - lift;
    const shine = c.createRadialGradient(x - .21,pad - .22,.05,x,pad,width);
    shine.addColorStop(0, skin.light + '80');
    shine.addColorStop(.68, skin.light + '33');
    shine.addColorStop(1, skin.light + '00');
    c.fillStyle = shine;
    c.fillRect(x - width,pad - width,2 * width,2 * width);
  }
  c.restore();

  const creases = c.createLinearGradient(-4.24,0,1.35,0);
  creases.addColorStop(0, skin.shadow + '00');
  creases.addColorStop(.6, skin.shadow + '92');
  creases.addColorStop(1, skin.shadow + 'b6');
  c.beginPath();
  c.moveTo(-3.73,1.19); c.bezierCurveTo(-2.85,1.51,-.32,1.08 - lift,1.04,1.4 - lift);
  c.moveTo(-3.97,2.52); c.bezierCurveTo(-2.9,2.91,-.57,2.4 - lift,.7,2.72 - lift);
  c.strokeStyle = creases;
  c.lineWidth = .25;
  c.stroke();

  c.beginPath();
  c.moveTo(-2.05,-1.98);
  c.quadraticCurveTo(-1.66,-1.9,-1.24,-1.52);
  c.quadraticCurveTo(-1.07,-1.23,-1.45,-1.13);
  c.quadraticCurveTo(-1.94,-1.21,-2.05,-1.98);
  c.fillStyle = skin.light + '6a';
  c.fill();
  c.beginPath();
  c.moveTo(-3.83,-2.64);
  c.quadraticCurveTo(-3.35,-2.56,-3.08,-2.17);
  c.moveTo(-3.85,-1.49);
  c.quadraticCurveTo(-3.58,-.86,-2.72,-.5);
  c.strokeStyle = skin.shadow + '71';
  c.lineWidth = .2;
  c.stroke();
}
