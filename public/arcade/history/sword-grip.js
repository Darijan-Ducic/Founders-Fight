// Along the hilt from the little finger to the index. Each finger has its own
// width, reach and curl so the fingertips press onto the wrap at different heights.
const curledFingers = [
  { x: -3.22, tip: .68, base: 2.43, width: .71, curl: -.02 },
  { x: -1.72, tip: .22, base: 3.18, width: .86, curl: .12 },
  { x: -.02, tip: -.19, base: 3.61, width: .99, curl: .13 },
  { x: 1.72, tip: -.62, base: 3.24, width: .92, curl: .24 },
];

export function swordGripPose(wrist, x, y, scale, ready, angle) {
  const dx = (wrist.x - x) / scale;
  const dy = (wrist.y - y) / scale;
  const restCosine = Math.cos(ready);
  const restSine = Math.sin(ready);
  const localX = dx * restCosine + dy * restSine;
  const localY = dy * restCosine - dx * restSine;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: wrist.x - scale * (localX * cosine - localY * sine),
    y: wrist.y - scale * (localX * sine + localY * cosine),
    wristX: localX,
    wristY: localY,
  };
}

export function skinLight(c, skin, x, y, bottom) {
  const shade = c.createRadialGradient(x - .42, y + .53, .08, x - .05, y + .65, bottom - y);
  shade.addColorStop(0, skin.light);
  shade.addColorStop(.38, skin.mid);
  shade.addColorStop(1, skin.shadow);
  return shade;
}

export function paintBentWrist(c, {image, x, y, acrossX, acrossY, half, overlap, scale}, bend) {
  const cosine = Math.cos(bend);
  const sine = Math.sin(bend);
  const outwardX = -acrossY * cosine - acrossX * sine;
  const outwardY = -acrossY * sine + acrossX * cosine;
  // The cross-section at the cut stays fixed. Only the direction into the
  // palm bends, so the painted contours and shading stay joined to the arm.
  c.transform(acrossX, acrossY, outwardX, outwardY, x, y);
  c.drawImage(image, -half * scale, -overlap * scale, image.width * scale, image.height * scale);
}

export function paintGripPalm(c, skin, wristX, wristY) {
  // The original bent wrist supplies the proximal part of the hand. Start
  // the painted palm inside that skin so there is no separate rounded cap.
  const rootY = wristY + 1.3;
  const blend = c.createLinearGradient(wristX, rootY, -.4, 3.5);
  blend.addColorStop(0, skin.wrist);
  blend.addColorStop(.36, skin.mid);
  blend.addColorStop(1, skin.shadow);
  c.beginPath();
  c.moveTo(wristX - 1.95, rootY + .25);
  c.quadraticCurveTo(wristX - 1.3, rootY - .85, wristX, rootY - .65);
  c.quadraticCurveTo(wristX + 1.6, rootY - .5, wristX + 2, rootY + .1);
  c.bezierCurveTo(2.7, -4.4, 4.15, -3.2, 4.05, -.9);
  c.bezierCurveTo(4.15, 1.6, 2.35, 3.9, -.5, 3.9);
  c.bezierCurveTo(-2.5, 3.9, -4.4, 2.5, -4.15, -.3);
  c.quadraticCurveTo(-4.1, -1.9, wristX - 1.95, rootY + .25);
  c.fillStyle = blend;
  c.fill();
  const light = c.createRadialGradient(wristX - .9, wristY + 1, .4, wristX - .9, wristY + 1, 5.5);
  light.addColorStop(0, skin.light + 'a8');
  light.addColorStop(.65, skin.mid + '00');
  light.addColorStop(1, skin.shadow + '54');
  c.fillStyle = light;
  c.fill();
}

export function paintSkinSurface(c, surface, x, y, width, height) {
  // Keep the original skin's painted variation inside the articulated shape.
  c.save();
  c.clip();
  c.globalAlpha *= .36;
  c.drawImage(surface, x, y, width, height);
  c.restore();
}

export function paintGripFingers(c, {skin, surface}, {pressure = 0} = {}) {
  // Curl four separate fingers over the near side of the handle. The dark
  // strip above the fingertips is exposed leather, with the thumb across it.
  const contact = c.createLinearGradient(0, -1.5, 0, 3.65);
  contact.addColorStop(0, skin.crease + 'ce');
  contact.addColorStop(.53, skin.crease + '9e');
  contact.addColorStop(1, skin.shadow + '38');
  c.lineCap = 'round';
  for (const {x, tip: restingTip, base, width, curl} of curledFingers) {
    const tip = restingTip - pressure * .34;
    const reach = base - tip;
    const pad = x + curl + pressure * .12;
    const joint = base - reach * .23;
    c.beginPath();
    c.moveTo(x - .88 * width, joint);
    c.bezierCurveTo(x - 1.12 * width, base - reach * .48, pad - .96 * width, tip + reach * .29,
      pad - .58 * width, tip + reach * .12);
    c.bezierCurveTo(pad - .33 * width, tip - reach * .055, pad + .36 * width, tip - reach * .06,
      pad + .71 * width, tip + reach * .13);
    c.bezierCurveTo(pad + 1.03 * width, tip + reach * .31, pad + .76 * width, tip + reach * .52,
      x + .65 * width, joint);
    c.bezierCurveTo(x + .52 * width, base + reach * .09, x - .41 * width, base + reach * .16,
      x - .88 * width, joint);
    c.fillStyle = skinLight(c, skin, pad, tip - .24, base + .44);
    c.strokeStyle = contact;
    c.lineWidth = .38;
    c.stroke();
    c.fill();
    paintSkinSurface(c, surface, -4.1, -.9, 7.8, 5.1);

    const fold = tip + reach * .63;
    const ridge = c.createRadialGradient(x - .28 * width, fold - .3, .06,
      x - .17 * width, fold - .2, width * .83);
    ridge.addColorStop(0, skin.light + '8c');
    ridge.addColorStop(.56, skin.light + '32');
    ridge.addColorStop(1, skin.mid + '00');
    c.fillStyle = ridge;
    c.fill();

    c.beginPath();
    c.moveTo(x - .65 * width, fold - reach * .085);
    c.quadraticCurveTo(x - .25 * width, fold + reach * .08, x + .4 * width, fold + reach * .035);
    c.strokeStyle = skin.crease + '76';
    c.lineWidth = .22;
    c.stroke();
    c.beginPath();
    c.moveTo(pad - .49 * width, tip + reach * .23);
    c.quadraticCurveTo(pad - .2 * width, tip + reach * .105, pad + .19 * width, tip + reach * .15);
    c.strokeStyle = skin.light + '63';
    c.lineWidth = .19;
    c.stroke();
  }

  c.beginPath();
  c.moveTo(-1.05, -2.85);
  c.bezierCurveTo(-.1, -4.15, 1.55, -4, 2.55, -3.15);
  c.bezierCurveTo(3.38, -2.45, 3.95, -1.32, 3.65, -.43);
  c.bezierCurveTo(3.36, .44, 2.23, .5, 1.94, -.35);
  c.quadraticCurveTo(1.67, -1.14, .8, -1.57);
  c.quadraticCurveTo(-.26, -1.72, -1.05, -2.85);
  const thumbContact = c.createLinearGradient(0, -3.6, 0, -.4);
  thumbContact.addColorStop(0, skin.crease + '00');
  thumbContact.addColorStop(.5, skin.crease + '48');
  thumbContact.addColorStop(1, skin.crease + 'c8');
  c.fillStyle = skinLight(c, skin, .9, -3, .7);
  c.strokeStyle = thumbContact;
  c.lineWidth = .38;
  c.stroke();
  c.fill();
  paintSkinSurface(c, surface, -1.2, -4.3, 5.3, 4.9);

  // The bent thumb casts a short crease just above the leather wrap.
  c.beginPath();
  c.moveTo(.81, -2.85);
  c.quadraticCurveTo(1.54, -2.64, 1.95, -2.03);
  c.strokeStyle = skin.crease + '6c';
  c.lineWidth = .23;
  c.stroke();

  // Only the thumbnail faces out. The other nails curl into the leather.
  const nail = c.createLinearGradient(2.68, -1.6, 3.36, -.62);
  nail.addColorStop(0, skin.light + '9a');
  nail.addColorStop(.68, skin.mid + 'ad');
  nail.addColorStop(1, skin.shadow + '42');
  c.beginPath();
  c.moveTo(2.61, -1.42);
  c.bezierCurveTo(2.78, -1.62, 3.08, -1.6, 3.28, -1.39);
  c.bezierCurveTo(3.52, -1.14, 3.58, -.81, 3.36, -.65);
  c.bezierCurveTo(3.12, -.55, 2.68, -.87, 2.61, -1.42);
  c.fillStyle = nail;
  c.fill();
  c.beginPath();
  c.moveTo(2.78, -1.44);
  c.quadraticCurveTo(3.06, -1.47, 3.22, -1.24);
  c.strokeStyle = skin.light + '80';
  c.lineWidth = .16;
  c.stroke();
}
