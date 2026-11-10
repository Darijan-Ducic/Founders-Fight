const ink = '#191823';
const steel = '#d3ced0';
const light = '#fcf0da';

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

function octagon(radius) {
  const cut = Math.round(radius * .43);
  return [[-cut,-radius],[cut,-radius],[radius,-cut],[radius,cut],[cut,radius],[-cut,radius],[-radius,cut],[-radius,-cut]];
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
    angles: [-.15, -.57, .08],
    paint(c, color, actor) {
      c.translate(9, 0);
      shape(c, ink, [[-15,-4],[-9,-9],[6,-10],[14,-6],[17,-2],[16,4],[8,9],[-8,9],[-15,5]]);
      shape(c, '#3c524d', [[-13,-3],[-8,-7],[5,-8],[13,-4],[15,-1],[14,3],[7,7],[-7,7],[-13,4]]);
      shape(c, '#79a48a', [[-12,-3],[-8,-7],[5,-8],[13,-4],[15,-1],[13,2],[6,4],[-7,4],[-12,2]]);
      shape(c, '#243630', [[-7,-2],[-3,-5],[7,-5],[13,-2],[13,1],[7,3],[-4,3]]);
      bar(c, '#b8d1ba', -6,-7,9,1);
      bar(c, '#8fada0', 6,5,4,1);
      bar(c, color, 1,-2,8,2);
      if (actor.phase === 'windup') {
        c.globalAlpha *= .9 * actor.attackProgress;
        bar(c, light, 2,-2,6,2);
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

export function paintIndexDisc(c, color, ultimate) {
  shape(c, ink, octagon(12));
  shape(c, ultimate ? light : color, octagon(11));
  shape(c, '#334c45', octagon(8));
  shape(c, '#557469', octagon(5));
  bar(c, ultimate ? '#fff2cb' : '#c0d5c2', -3,-2,6,4);
  bar(c, light, -4,-11,5,1);
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
