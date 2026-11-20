const ink = '#191823';
const steel = '#d3ced0';
const light = '#fcf0da';
export const googleColors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];

function shape(c, color, points) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  c.fill();
}

function bar(c, color, x, y, width, height) {
  c.fillStyle = color;
  c.fillRect(x, y, width, height);
}

const designs = {
  arc: {
    angles: [-.38, -1.28, -.06],
    paint(c, color) {
      shape(c, ink, [[-9,-4],[28,-5],[34,-2],[34,3],[29,6],[-9,5]]);
      bar(c, '#5d6e75', -7,-3,12,7);
      bar(c, '#38454f', 6,-4,23,8);
      for (let x = 8; x < 29; x += 7) {
        bar(c, color, x,-2,5,4);
        bar(c, light, x+1,-2,3,1);
      }
      bar(c, steel, 29,-3,4,7);
    },
  },
  bolt: {
    angles: [.19, -.47, .77],
    paint(c, color) {
      shape(c, ink, [[-10,-7],[-2,-11],[18,-11],[30,-5],[30,4],[19,7],[4,7],[1,12],[-7,10]]);
      shape(c, '#625874', [[-8,-6],[-1,-9],[17,-9],[27,-4],[27,3],[17,5],[3,5],[-1,10],[-5,8]]);
      shape(c, '#383147', [[0,4],[3,0],[18,0],[28,2],[20,6],[3,6],[-1,10]]);
      shape(c, color, [[10,-8],[21,-4],[17,3],[7,0]]);
      shape(c, light, [[10,-7],[20,-4],[13,-4],[8,-1]]);
      bar(c, steel, 26,-4,3,8);
    },
  },
  dash: {
    angles: [-.05, -.42, -.03],
    paint(c, color) {
      shape(c, ink, [[-14,-7],[-6,-11],[12,-11],[19,-6],[19,6],[12,11],[-7,9],[-14,5]]);
      shape(c, '#70594d', [[-12,-5],[-5,-9],[11,-9],[17,-5],[17,4],[11,8],[-6,7],[-12,4]]);
      bar(c, '#382e34', -11,-5,9,11);
      for (const y of [-5, 2]) {
        bar(c, color, -10,y,10,3);
        bar(c, light, -9,y,4,1);
      }
      shape(c, steel, [[9,-8],[15,-6],[17,-3],[17,4],[12,7],[9,6]]);
      bar(c, '#9c5446', 12,-4,4,2);
      bar(c, '#9c5446', 12,1,4,2);
    },
  },
  slash: {
    angles: [.42, 1.04, -.69],
    paint(c, color) {
      bar(c, ink, -9,-4,19,8);
      shape(c, '#b89d91', [[5,-7],[11,-9],[9,0],[11,9],[5,6]]);
      shape(c, ink, [[9,-5],[32,-7],[47,-3],[40,3],[10,5]]);
      shape(c, steel, [[10,-3],[32,-5],[44,-3],[38,1],[10,3]]);
      shape(c, color, [[11,0],[33,-2],[42,-3],[38,1],[11,2]]);
      bar(c, light, 14,-3,16,1);
    },
  },
  orb: {
    angles: [-.12, -.62, .1],
    paint(c, color, actor) {
      const charging = actor.phase === 'windup';
      const glow = charging ? actor.attackProgress : 0;
      bar(c, ink, -4,-3,9,7);
      bar(c, '#3a4356', -3,-2,7,5);
      c.translate(15, 0);
      shape(c, ink, [[-13,-6],[-6,-9],[9,-9],[15,-5],[15,5],[9,8],[-6,8],[-13,5]]);
      shape(c, '#e7ecf4', [[-11,-5],[-5,-7],[8,-7],[13,-4],[13,4],[8,6],[-5,6],[-11,4]]);
      shape(c, '#aeb8c8', [[-11,1],[13,1],[13,4],[8,6],[-5,6],[-11,4]]);
      bar(c, '#232a3a', -6,-4,13,4);
      googleColors.forEach((led, i) => {
        bar(c, led, -5 + i * 3,-3,2,2);
        if (glow > i * .25) bar(c, light, -5 + i * 3,-3,1,1);
      });
      shape(c, ink, [[12,-8],[17,-11],[19,-9],[15,-5]]);
      shape(c, ink, [[12,7],[17,10],[19,8],[15,4]]);
      bar(c, steel, 15,-9,3,1);
      bar(c, steel, 15,8,3,1);
      if (!actor.discsOut) {
        c.save();
        c.translate(20, 0);
        if (charging) c.rotate(actor.attackProgress * 9);
        c.scale(.62, .62);
        paintIndexDisc(c, color, actor.ultimate);
        c.restore();
      }
      if (glow > 0) {
        c.globalAlpha *= .25 + glow * .5;
        c.strokeStyle = actor.ultimate ? light : color;
        c.lineWidth = 1;
        c.beginPath();
        c.arc(20, 0, 9 + glow * 3, 0, Math.PI * 2);
        c.stroke();
      }
    },
  },
  slam: {
    angles: [-.51, -1.4, 1.01],
    paint(c, color) {
      bar(c, ink, -8,-4,44,8);
      bar(c, '#766462', -6,-2,38,4);
      bar(c, '#b29b83', 11,-2,2,4);
      shape(c, ink, [[27,-13],[44,-14],[53,-7],[53,7],[46,14],[28,14],[23,8],[23,-7]]);
      shape(c, '#4d5872', [[28,-11],[43,-12],[51,-6],[51,6],[45,12],[29,12],[25,7],[25,-6]]);
      shape(c, steel, [[46,-10],[51,-6],[51,6],[46,10],[43,8],[43,-8]]);
      bar(c, color, 35,-8,4,16);
      bar(c, light, 36,-5,2,4);
      bar(c, '#252c42', 26,-5,5,10);
    },
  },
  reach: {
    angles: [.68, -.45, -.03],
    paint(c, color) {
      shape(c, ink, [[-10,-4],[6,-5],[50,-2],[50,4],[-9,4]]);
      shape(c, '#a96d46', [[0,-2],[48,-1],[48,2],[0,3]]);
      bar(c, '#ebc687', 46,-1,5,3);
      shape(c, color, [[-11,-5],[-12,-11],[-8,-10],[-5,-7],[2,-7],[6,-11],[8,-10],[6,-4],[2,1],[-6,1]]);
      shape(c, '#815431', [[-7,-4],[-4,-2],[2,-2],[4,-4],[3,1],[-6,1]]);
      bar(c, light, -5,-6,6,1);
    },
  },
  lunge: {
    angles: [.51, -1.15, -.12],
    paint(c, color) {
      shape(c, ink, [[-10,-4],[8,-5],[30,-8],[47,-15],[45,-5],[31,1],[8,5],[-10,4]]);
      shape(c, steel, [[8,-3],[29,-6],[45,-13],[42,-6],[31,-1],[9,3]]);
      shape(c, light, [[10,-3],[29,-6],[45,-13],[36,-7],[30,-5],[10,-1]]);
      shape(c, color, [[-8,-1],[-6,4],[4,6],[7,3],[8,-6],[12,-7],[11,0],[8,8],[-4,8],[-10,3]]);
      bar(c, '#7b5945', -7,-2,11,4);
    },
  },
};

function disc(c, color, radius) {
  c.fillStyle = color;
  c.beginPath();
  c.arc(0, 0, radius, 0, Math.PI * 2);
  c.fill();
}

export function paintIndexDisc(c, color, ultimate) {
  if (ultimate) {
    c.save();
    c.globalAlpha *= .35;
    disc(c, color, 17);
    c.restore();
  }
  disc(c, ink, 13);
  googleColors.forEach((segment, i) => {
    const from = i * Math.PI / 2 + .1;
    const to = (i + 1) * Math.PI / 2 - .1;
    c.fillStyle = segment;
    c.beginPath();
    c.arc(0, 0, 12, from, to);
    c.arc(0, 0, 7.5, to, from, true);
    c.closePath();
    c.fill();
  });
  disc(c, ultimate ? '#fff2cb' : '#f2f5fb', 7);
  disc(c, '#1d2433', 5.2);
  c.strokeStyle = ultimate ? '#fff2cb' : color;
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(-.8, -.8, 2.4, 0, Math.PI * 2);
  c.moveTo(1, 1);
  c.lineTo(3.4, 3.4);
  c.stroke();
  c.strokeStyle = light;
  c.lineWidth = 1;
  c.beginPath();
  c.arc(0, 0, 10.5, 3.6, 4.5);
  c.stroke();
}

export function paintWeapon(c, actor, x, y) {
  const { type, color } = actor.weapon;
  const { angles: [ready, wind, release], paint } = designs[type];
  const progress = actor.attackProgress;
  let angle = ready;
  if (actor.phase === 'windup') {
    const swing = Math.max(0, (progress - .76) / .24);
    angle = ready + (wind - ready) * Math.min(1, progress * 3) + (release - wind) * swing ** 2;
  } else if (actor.phase === 'recovery') {
    angle = release + (ready - release) * Math.min(1, Math.max(0, progress - .16) * 1.65);
  }

  c.save();
  c.translate(x, y);
  c.rotate(angle);
  if (actor.ultimate) c.scale(1.07, 1.07);
  paint(c, color, actor);
  c.restore();
}
