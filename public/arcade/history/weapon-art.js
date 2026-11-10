import {
  paintBowFingers, paintBowPalm, paintBowPinch, paintEquipmentPalm, paintPistolFingers, paintPistolPalm,
} from './equipment-grip.js';
import { pistolFlashTime, pistolMuzzle, pistolReady } from './boss-pose.js';
import { paintBentWrist, paintGripFingers, paintGripPalm, swordGripPose } from './sword-grip.js';

const ink = '#2a222b';
const edge = '#ead6b2';
const bowArrowRestY = -5.2;
const bowCatch = .72;

function ease(amount) {
  const t = Math.max(0, Math.min(1, amount));
  return t * t * (3 - 2 * t);
}

function shape(c, color, points, outline = 0) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  if (outline) {
    c.strokeStyle = ink;
    c.lineWidth = outline;
    c.lineJoin = 'round';
    c.stroke();
  }
  c.fillStyle = color;
  c.fill();
}

function line(c, color, width, points) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.stroke();
}

function bar(c, color, x, y, width, height) {
  c.fillStyle = color;
  c.fillRect(x, y, width, height);
}

function hilt(c, leather, brass, guard, pommel) {
  const wrap = c.createLinearGradient(0, -1.65, 0, 1.65);
  wrap.addColorStop(0, '#a18572');
  wrap.addColorStop(.26, leather);
  wrap.addColorStop(1, '#27202a');
  shape(c, wrap, [[-6.6,-1.65],[5.6,-1.45],[5.6,1.45],[-6.6,1.65]], .75);
  for (const x of [-6.1, -4.4, -2.7, -1, .7, 2.4, 4.1]) {
    line(c, '#e5c4a188', .5, [[x,-1.4],[x + .65,1.25]]);
  }
  const metal = c.createLinearGradient(0, -4.5, 1.7, 5.5);
  metal.addColorStop(0, '#e3bc7e');
  metal.addColorStop(.38, brass);
  metal.addColorStop(1, '#765139');
  shape(c, metal, [[-6,-1.6],[-4.85,-1.65],[-4.85,1.65],[-6,1.6]]);
  shape(c, metal, pommel, .85);
  shape(c, metal, guard, .85);
}

function paintSpear(c) {
  const wood = c.createLinearGradient(0, -2, 0, 2.1);
  wood.addColorStop(0, '#ac8062');
  wood.addColorStop(.36, '#795345');
  wood.addColorStop(1, '#4b3133');
  shape(c, wood, [[-49,-1.85],[45,-1.62],[45,1.62],[-49,2.05]], 1.15);
  line(c, '#d7a77984', .52, [[-46,-.96],[-13,-.83],[39,-.83]]);
  line(c, '#2c242d7f', .38, [[-39,.88],[-15,.67],[26,.7],[41,.63]]);

  const leather = c.createLinearGradient(0, -1.92, 0, 1.92);
  leather.addColorStop(0, '#715363');
  leather.addColorStop(.35, '#493849');
  leather.addColorStop(1, '#29242f');
  for (const [start, end] of [[-47,-24],[-12,12]]) {
    bar(c, leather, start, -1.88, end - start, 3.76);
    for (let x = start + 1; x < end - 1; x += 1.65) {
      line(c, '#27202b9a', .43, [[x + .37,-1.68],[x + 1.03,1.55]]);
      line(c, '#c6a48a70', .42, [[x,-1.58],[x + .64,1.58]]);
    }
  }

  const brass = c.createLinearGradient(0, -3.1, 0, 3.1);
  brass.addColorStop(0, '#dcb27a');
  brass.addColorStop(.39, '#aa7945');
  brass.addColorStop(1, '#63453a');
  shape(c, brass, [[-50,-2.35],[-47,-2.15],[-46,2.12],[-50,2.5]], .75);
  shape(c, brass, [[37,-2.2],[42,-2.8],[47,-2.2],[47,2.2],[42,2.8],[37,2.15]], .8);
  for (const x of [-25.3,-12,10.9,37.9,44.4]) bar(c, brass, x, -2.05, 1.05, 4.1);
  shape(c, '#416762', [[39.05,-.95],[40.6,-1.53],[43.64,-.86],[43.16,.82],[40.6,1.49],[39.1,.87]], .44);
  line(c, '#9bb49a', .43, [[39.68,-.77],[40.8,-1.04],[42.81,-.66]]);

  const blade = c.createLinearGradient(49, -4.8, 52, 4.8);
  blade.addColorStop(0, '#b5c8bd');
  blade.addColorStop(.54, '#77918b');
  blade.addColorStop(1, '#405b60');
  shape(c, blade, [[43,-1.9],[48,-4.75],[53,-4.2],[62,0],[53,4.1],[48,4.75],[43,1.9]], 1.12);
  shape(c, '#b1c2b4', [[44,0],[48.6,-4],[52.7,-3.6],[60.5,0],[50.7,.56]]);
  line(c, '#e3e9ce', .65, [[44.8,-1.23],[48.6,-4],[52.7,-3.6],[60,-.32]]);
  line(c, '#3a575d', .59, [[45,.38],[50.7,.56],[60.2,.13]]);
  line(c, '#91a99f', .41, [[47,3.55],[49.2,4.04],[53.5,3.44],[58.7,1.14]]);
}

function paintBowLimb(c, side, endX, endY, draw) {
  const bend = 1.62 * draw;
  c.save();
  c.scale(1, side * endY / 25);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(1.72,2);
  c.bezierCurveTo(1.5,6.32,-1.41,10.27,-4.66,14.07);
  c.bezierCurveTo(-7.64 - bend,17.43,-10.94 - bend,20.21,-10.72 - bend,22.27);
  c.quadraticCurveTo(-10.25 - bend,23.74,endX + .55,24.65);
  c.quadraticCurveTo(endX + 1.23,25.36,endX + .42,26.02);
  c.quadraticCurveTo(endX - .39,26.62,endX - 1.14,25.97);
  c.bezierCurveTo(-14.12 - bend,24.05,-14.38 - bend,21.08,-12.37 - bend,18.34);
  c.bezierCurveTo(-10.25 - bend,15.62,-6.81,12.24,-4.78,8.86);
  c.bezierCurveTo(-3.43,6.7,-2.22,4.55,-2.1,2.01);
  c.closePath();
  c.strokeStyle = ink;
  c.lineWidth = 1.08;
  c.stroke();
  const horn = c.createLinearGradient(1.3,2.4,endX - 2,24.25);
  horn.addColorStop(0, '#513638');
  horn.addColorStop(.3, '#9b5e48');
  horn.addColorStop(.57, '#753e38');
  horn.addColorStop(.81, '#4b3031');
  horn.addColorStop(1, '#73503d');
  c.fillStyle = horn;
  c.fill();
  c.clip();

  // An amber lamination runs along the inner edge of the lacquered limb.
  c.beginPath();
  c.moveTo(.71,2.34);
  c.bezierCurveTo(.32,6.44,-2.25,10.62,-5.51,14.4);
  c.bezierCurveTo(-8.26 - bend,17.58,-11.72 - bend,20.55,-11.44 - bend,22.53);
  c.quadraticCurveTo(-11.05 - bend,24.02,endX -.12,25.31);
  c.strokeStyle = '#422a30';
  c.lineWidth = 1.72;
  c.stroke();
  c.strokeStyle = '#d1a16d';
  c.lineWidth = .79;
  c.stroke();

  line(c, '#542e32', 1.48, [[-5.3,7.2],[.27,9.41]]);
  line(c, '#c78254', .61, [[-5.2,6.96],[.23,9.13]]);
  line(c, '#ddad75', .46, [[-5.52,7.92],[-.05,10.09]]);
  for (const offset of [.1,.75,1.39]) {
    line(c, '#b48a61', .62, [[endX - 4.25,24.49 - offset],[endX + .69,25.84 - offset]]);
  }
  line(c, '#ead4a3', .42, [[endX - 1.35,25.64],[endX + .64,26.2]]);
  c.restore();
}

function paintBow(c, draw, strikeAge, support) {
  const endX = -8.4 - 2.4 * draw;
  const endY = 25.75 - 2.3 * draw;
  const pull = ease(draw / bowCatch);
  const snap = strikeAge < .16 ? Math.sin(strikeAge * 48) * (1 - strikeAge / .16) * 1.45 : 0;
  const nock = [endX + (support.x - endX) * pull + snap, bowArrowRestY + (support.y - bowArrowRestY) * pull];
  line(c, '#29242c', 1.24, [[endX,-endY],nock,[endX,endY]]);
  line(c, '#d6c3a6', .63, [[endX,-endY],nock,[endX,endY]]);
  for (const sign of [-1, 1]) {
    paintBowLimb(c, sign, endX, endY, draw);
    line(c, '#cf9c66', .66, [[endX - 1.33, (endY - .61) * sign],[endX + .52, (endY + .31) * sign]]);
  }

  const wrap = c.createLinearGradient(-2.2, 0, 1.72, 0);
  wrap.addColorStop(0, '#735440');
  wrap.addColorStop(.39, '#523839');
  wrap.addColorStop(1, '#241e28');
  shape(c, wrap, [[-2.14,-5.27],[1.59,-5.14],[1.37,-2.37],[1.2,.41],[1.61,5.07],
    [-2.16,5.22],[-1.77,2.33],[-1.61,-.39],[-1.9,-3.46]], .71);
  for (const y of [-4.4,-2.75,-1.1,.55,2.2,3.85]) {
    line(c, '#231d287d', .55, [[-1.54,y + .31],[1.29,y + .84]]);
    line(c, '#c0997178', .41, [[-1.57,y],[1.32,y + .52]]);
  }
  line(c, '#b18159', .79, [[-2.05,-5.39],[1.57,-5.25]]);
  line(c, '#9e704f', .76, [[-2.09,5.25],[1.55,5.12]]);

  if (draw > 0) {
    const rise = bowArrowRestY - nock[1];
    const length = Math.hypot(nock[0], rise);
    const dx = -nock[0] / length;
    const dy = rise / length;
    const shaft = (along, side = 0) => [nock[0] + dx * along - dy * side, nock[1] + dy * along + dx * side];
    line(c, '#896342', 1.18, [nock, shaft(44)]);
    line(c, '#d7a771', .52, [shaft(6,-.27), shaft(44,-.27)]);
    shape(c, '#694044', [shaft(1.3,.15),shaft(2.92,1.36),shaft(4.85,1.19),shaft(7.25,.58),shaft(6.04,0)]);
    shape(c, '#a16650', [shaft(1.13,0),shaft(2.72,-1.78),shaft(5.08,-1.46),shaft(7.37,-.73),shaft(5.87,.25)]);
    line(c, '#d8a579', .47, [shaft(2.82,-1.32),shaft(4.96,-1.08),shaft(6.23,-.67)]);
    line(c, '#5e3c40', .35, [shaft(4.04,-.34),shaft(5.22,-.98)]);
    line(c, '#e6b987', .43, [shaft(1.05,-.57),shaft(1.05,.55)]);
    shape(c, '#c7c9b2', [shaft(42,-1.85),shaft(48),shaft(42,1.85),shaft(43,0)], .5);
    line(c, '#f0e7cf', .51, [shaft(42,-1.61),shaft(47.5)]);
  }
  return nock;
}

function paintPistol(c, _, strikeAge) {
  const recoil = 1.85 * Math.max(0, 1 - strikeAge / .145) ** 2;
  const steel = c.createLinearGradient(0, -7.7, 0, 1.6);
  steel.addColorStop(0, '#8c929b');
  steel.addColorStop(.2, '#565e69');
  steel.addColorStop(.62, '#343944');
  steel.addColorStop(1, '#252833');
  shape(c, steel, [[-4.93,-4.18],[10.67,-4.1],[8.52,-1.82],[2.14,-1.54],[-.8,4.97],
    [-5.63,4.6],[-4.54,-1.57],[-4.96,-2.72]], 1.02);
  shape(c, steel, [[8.69,-5.86],[19.95,-5.81],[20.4,-3.48],[9.66,-3.43]], .93);
  line(c, '#b0afb3', .53, [[10.5,-5.43],[19.56,-5.46]]);
  line(c, '#252a34', .5, [[10.8,-4.07],[19.43,-4.03]]);
  bar(c, '#41434d', 17.95, -6.54, 1.19, .81);
  line(c, '#77808b', .61, [[19.38,-5.63],[19.61,-3.82]]);

  c.save();
  c.translate(-recoil, 0);
  shape(c, steel, [[-4.83,-7.03],[9.55,-7.03],[11.45,-5.86],[10.46,-3.43],[-4.96,-3.29]], 1.03);
  line(c, '#c0bfc0', .59, [[-4.35,-6.55],[9.25,-6.55],[10.86,-5.55]]);
  line(c, '#1f222d', .65, [[-4.41,-3.61],[8.93,-3.67],[10.68,-4.17]]);
  bar(c, '#343641', -4.14, -7.87, 1.68, .9);
  for (const x of [-3.95,-3.05,-2.15,-1.25]) line(c, '#222733', .48, [[x,-5.93],[x - .33,-4.07]]);
  shape(c, '#4c515c', [[4.45,-5.87],[8.5,-5.91],[9.33,-4.45],[4.57,-4.31]], .51);
  line(c, '#a1a0a880', .32, [[-.22,-5.4],[2.55,-5.67]]);
  line(c, '#8a89917d', .32, [[5.1,-4.77],[7.93,-4.88]]);
  c.restore();

  const walnut = c.createLinearGradient(-4.8, -2.05, -.2, 4.93);
  walnut.addColorStop(0, '#866d60');
  walnut.addColorStop(.38, '#655047');
  walnut.addColorStop(1, '#3d3437');
  shape(c, walnut, [[-4.42,-1.49],[1,-1.33],[-.97,4.13],[-5.02,3.93]], .71);
  for (let y = -.7; y < 3.7; y += .79) line(c, '#332b32', .44, [[-4.47,y],[-1.38,y + .17]]);
  line(c, '#77727a', .57, [[-5.17,4.38],[-1.18,4.68]]);

  c.beginPath();
  c.moveTo(2.25,-1.9);
  c.lineTo(8.5,-1.92);
  c.quadraticCurveTo(8.28,.9,6.25,2.12);
  c.quadraticCurveTo(4.13,2.96,.43,2.11);
  c.strokeStyle = '#242631';
  c.lineWidth = 1.17;
  c.stroke();
  c.strokeStyle = '#6a707a';
  c.lineWidth = .48;
  c.stroke();
  c.beginPath();
  c.moveTo(5.01,-1.9);
  c.quadraticCurveTo(5.79,-.86,4.94,.3);
  c.strokeStyle = '#373841';
  c.lineWidth = .82;
  c.stroke();

  if (strikeAge < pistolFlashTime) {
    const {x, y} = pistolMuzzle;
    shape(c, '#df9b5f', [[x,y-1.35],[x+4.83,y-3.35],[x+3.83,y-.35],[x+11.83,y],
      [x+3.83,y+2.65],[x+4.83,y+5.65],[x,y+2.65]]);
    shape(c, edge, [[x,y-.35],[x+4.83,y-.35],[x+9.83,y],[x+3.83,y+1.65],[x,y+1.65]]);
  }
  if (strikeAge < .19) {
    const flight = strikeAge / .19;
    c.save();
    c.translate(5.2 - 5.5 * flight, -7.05 - 11.5 * flight + 4.7 * flight ** 2);
    c.rotate(.18 + 4.6 * flight);
    c.globalAlpha *= 1 - flight;
    shape(c, '#b48a58', [[-.97,-.4],[.78,-.4],[.97,.42],[-.97,.48]], .32);
    line(c, '#e5b777', .29, [[-.76,-.19],[.72,-.21]]);
    c.restore();
  }
}

const designs = {
  hook: {
    angles: [-.42, -1.05, .28],
    paint(c) {
      shape(c, '#84604a', [[5,-3],[18,-3],[25,-6],[30,-12],[30,-19],[34,-17],[37,-12],[38,-7],[35,-1],[29,3],[21,5],[6,4]], 1.8);
      shape(c, '#bd8c58', [[7,-2],[18,-2],[25,-5],[31,-12],[31,-17],[34,-15],[36,-10],[35,-5],[29,0],[20,3],[7,3]]);
      line(c, '#644f44', 1.1, [[10,0],[19,0],[26,-3],[32,-9],[33,-13]]);
      line(c, '#e3bb7d', 1.1, [[9,3],[21,4],[29,2],[34,-1],[37,-7],[36,-12]]);
      hilt(c, '#274751', '#ad7945', [[3.8,-2.7],[5.3,-3.2],[7,-2.7],[7.2,2.8],[5.4,3.4],[3.8,2.8]],
        [[-8.1,-1.5],[-7.3,-2.3],[-5.8,-1.7],[-5.8,1.7],[-7.3,2.3],[-8.1,1.5]]);
      line(c, '#dcb177', .8, [[5.1,-2.5],[5.4,2.6]]);
    },
  },
  guard: {
    angles: [-.31, -.86, .1],
    paint(c) {
      shape(c, '#6c6c73', [[6,-3.6],[24,-3.6],[33,0],[24,3.6],[6,3.6]], 1.6);
      shape(c, '#a9a5a0', [[7,-2.8],[24,-2.8],[32,0],[7,0]]);
      line(c, '#d7c3a1', .9, [[8,-2.8],[23,-2.8],[31,-.3]]);
      hilt(c, '#653b41', '#a6764f', [[4,-3.5],[5.7,-4],[7.4,-2.9],[7.4,2.9],[5.7,4],[4,3.5]],
        [[-8.2,-1.4],[-7.2,-2.5],[-5.8,-1.8],[-5.4,0],[-5.8,1.8],[-7.2,2.5],[-8.2,1.4]]);
      line(c, '#d7aa76', .65, [[5.5,-3.2],[6,-2.6],[6,2.6],[5.5,3.2]]);
    },
  },
  slam: {
    angles: [-.41, -1.34, .57],
    paint(c) {
      shape(c, '#536376', [[6,-4.4],[34,-4.4],[47,0],[34,4.4],[6,4.4]], 1.8);
      shape(c, '#9aa7b4', [[7,-3.5],[34,-3.5],[45,0],[7,0]]);
      line(c, '#3d4a63', 1, [[10,.9],[31,.9],[41,0]]);
      line(c, '#d4c9b7', .9, [[9,-3.5],[34,-3.5],[45,-.3]]);
      hilt(c, '#413f56', '#ae874c', [[3.3,-5.4],[4.7,-5.8],[7.1,-4.2],[8.3,-4.4],[7.4,-1.3],[7.4,1.3],
        [8.3,4.4],[7.1,4.2],[4.7,5.8],[3.3,5.4],[4.6,1.6],[4.6,-1.6]],
        [[-8.3,-1.5],[-7.3,-2.7],[-5.6,-2],[-5.6,2],[-7.3,2.7],[-8.3,1.5]]);
      shape(c, '#7897a5', [[-7.6,-1.1],[-6.7,-1.6],[-6.2,0],[-6.7,1.6],[-7.6,1.1]]);
      line(c, '#dbb473', .8, [[4.6,-5],[6.5,-3.6],[6.3,3.6],[4.6,5]]);
    },
  },
  bow: {
    angles: [.11, -.10, .04],
    palm: paintBowPalm,
    fingers: paintBowFingers,
    paint: paintBow,
  },
  saber: {
    angles: [-.28, -1.02, .14],
    paint(c) {
      shape(c, '#637386', [[6,-3],[25,-3.8],[38,-8],[46,-14],[43,-7],[36,-2],[24,1.7],[7,3.4]], 1.8);
      shape(c, '#a7b4bd', [[8,-2.4],[25,-3],[38,-7.4],[44,-12],[42,-7],[35,-2.9],[24,.5],[8,1.2]]);
      line(c, '#d9d4bf', .9, [[9,-2.4],[25,-3],[38,-7.4],[44,-12]]);
      hilt(c, '#3e4152', '#a98049', [[4.3,-3.5],[6.4,-4],[7.8,-3],[7.7,2.8],[5.4,4.9],[.6,6.1],
        [-4.6,5.7],[-7.7,3.3],[-8.5,1.4],[-7.1,1],[-6.1,2.8],[-4,4.2],[.5,4.5],[4.5,3.2],[4.9,1]],
        [[-8.5,-1.4],[-7.4,-2.1],[-5.9,-1.6],[-6.1,1.6],[-7.1,2.1],[-8.4,1.5]]);
      line(c, '#dbb579', .7, [[6.5,-3.2],[6.9,2.6],[4.9,4.1],[.6,5.3],[-4.4,4.9],[-6.9,2.9]]);
    },
  },
  pistol: {
    angles: [pistolReady, .14, -.06],
    palm: paintPistolPalm,
    fingers: paintPistolFingers,
    paint: paintPistol,
  },
};

function paintMountedWrist(c, wrist, torsoTransform, bend) {
  c.save();
  c.setTransform(torsoTransform);
  paintBentWrist(c, wrist.texture, bend);
  c.restore();
}

function paintSpearMount(c, chapter, scale, wind, strikeAge, {primary, support}) {
  const [frontX, frontY] = chapter.grip;
  const [backX, backY] = chapter.supportGrip;
  const restingAngle = Math.atan2(frontY - backY, frontX - backX);
  const spacing = Math.hypot(frontX - backX, frontY - backY);
  const pull = Math.min(1, wind * 2.5);
  const thrust = Math.max(0, (wind - .8) / .2);
  const settle = Math.max(0, 1 - strikeAge / .3);
  const lift = wind > 0 ? -.11 * pull + .05 * thrust ** 2 : -.06 * settle;
  const angle = restingAngle + lift;
  const halfX = Math.cos(angle) * spacing / 2;
  const halfY = Math.sin(angle) * spacing / 2;
  const centerX = (frontX + backX) / 2;
  const centerY = (frontY + backY) / 2;
  const x = (centerX + halfX) * scale;
  const y = (centerY + halfY) * scale;
  const rear = {x: (centerX - halfX) * scale, y: (centerY - halfY) * scale};
  const frontPose = swordGripPose(primary, x, y, scale, angle, angle);
  const rearPose = swordGripPose(support, rear.x, rear.y, scale, angle, angle);
  // Both hands stay on the shaft. The spear slides as Darius retracts and thrusts.
  const travel = wind > 0 ? -7.5 * pull + 16.5 * thrust ** 2 : 9 * settle;
  const pressure = wind > 0 ? .28 * pull + .72 * thrust ** 2 : settle;

  c.save();
  const torso = c.getTransform();
  c.translate(x, y);
  c.scale(scale, scale);
  c.rotate(angle);
  paintEquipmentPalm(c, primary.skin, frontPose.wristX, frontPose.wristY);
  paintMountedWrist(c, primary, torso, lift);
  c.save();
  c.translate(-spacing, 0);
  paintEquipmentPalm(c, support.skin, rearPose.wristX, rearPose.wristY);
  paintMountedWrist(c, support, torso, lift);
  c.restore();

  c.save();
  c.translate(travel, 0);
  paintSpear(c);
  c.restore();
  paintGripFingers(c, primary, {pressure: pressure * .62});
  c.translate(-spacing, 0);
  c.scale(1, -1);
  paintGripFingers(c, support, {pressure});
  c.restore();
  return {x, y, support: rear};
}

function bowHandPose(chapter, grip, scale, angle, draw, strikeAge) {
  const release = strikeAge < .19;
  const tension = release ? 1 : ease((draw - bowCatch) / (1 - bowCatch));
  const reach = ease((draw - .37) / (bowCatch - .37));
  const follow = release ? ease(strikeAge / .19) : 0;
  // The thumb hooks the string out in front of the fist, then pulls it back.
  const dx = chapter.supportGrip[0] + 4.1 - 2.4 * tension - 1.65 * follow - grip.x / scale;
  const dy = chapter.supportGrip[1] + .8 - .68 * tension + .42 * follow - grip.y / scale;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: dx * cosine + dy * sine,
    y: dy * cosine - dx * sine,
    opening: release ? ease(strikeAge / .062) : 1 - reach,
    opacity: release ? 1 - ease((strikeAge - .07) / .12) : reach,
  };
}

export function paintBossWeapon(c, chapter, scale, wind, strikeAge, hands, aimAngle) {
  if (chapter.pattern === 'spear') return paintSpearMount(c, chapter, scale, wind, strikeAge, hands);
  const {primary, support} = hands;
  const {angles: [ready, drawn, release], palm = paintGripPalm,
    fingers = paintGripFingers, paint} = designs[chapter.pattern];
  let angle = ready;
  if (aimAngle !== undefined) {
    angle = aimAngle;
  } else if (wind > 0) {
    const pull = Math.min(1, wind * 3);
    const swing = Math.max(0, (wind - .82) / .18);
    angle += (drawn - ready) * pull + (release - drawn) * swing ** 2;
  } else if (strikeAge < .30) {
    angle = release + (ready - release) * Math.min(1, strikeAge / .30);
  }
  const x = chapter.grip[0] * scale;
  const y = chapter.grip[1] * scale;
  const grip = swordGripPose(primary, x, y, scale, ready, angle);
  const draw = Math.min(1, wind * 1.65);
  const stringHand = support && bowHandPose(chapter, grip, scale, angle, draw, strikeAge);
  c.save();
  const torso = c.getTransform();
  c.translate(grip.x, grip.y);
  c.scale(scale, scale);
  c.rotate(angle);
  palm(c, primary.skin, grip.wristX, grip.wristY);
  paintMountedWrist(c, primary, torso, angle - ready);
  const nock = paint(c, draw, strikeAge, stringHand);
  fingers(c, primary, {strikeAge});

  let pinch;
  if (stringHand?.opacity) {
    const holding = draw >= bowCatch;
    const [fingerX, fingerY] = holding ? nock : [stringHand.x, stringHand.y];
    if (holding) {
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      pinch = {
        x: grip.x + scale * (fingerX * cosine - fingerY * sine),
        y: grip.y + scale * (fingerX * sine + fingerY * cosine),
      };
    }
    c.save();
    c.translate(fingerX, fingerY);
    c.rotate(Math.atan2(bowArrowRestY - fingerY, -fingerX));
    c.globalAlpha *= stringHand.opacity;
    paintBowPinch(c, support, stringHand.opening);
    c.restore();
  }
  c.restore();
  return {x: grip.x, y: grip.y, support: pinch};
}

export function paintBossShield(c, [x, y], scale, strike) {
  c.save();
  c.translate(x * scale, y * scale);
  c.scale(scale, scale);
  c.rotate(strike ? .18 : -.08);
  shape(c, '#69353a', [[-11,-17],[8,-17],[13,-12],[13,10],[8,16],[-8,18],[-12,13],[-12,-12]], 1.8);
  shape(c, '#9e4c45', [[-9,-14],[6,-14],[9,-11],[8,11],[5,14],[-7,15],[-9,12]]);
  shape(c, '#b3654c', [[-9,-14],[4,-14],[1,-9],[-5,13],[-8,14]]);
  line(c, '#ac8050', 1.3, [[-10,-16],[8,-16],[12,-11],[12,10],[8,15],[-8,17],[-11,13],[-11,-12],[-10,-16]]);
  line(c, '#bf9462', .85, [[-7,-7],[-3,-5],[7,-6],[10,-8]]);
  line(c, '#b78451', .85, [[-7,8],[-3,6],[7,6],[10,8]]);
  shape(c, '#a87f51', [[-4,-3],[1,-5],[6,-2],[6,3],[1,5],[-4,3]], 1.4);
  shape(c, '#cfaa76', [[-2,-2],[1,-3],[4,-1],[1,1],[-2,1]]);
  c.restore();
}
