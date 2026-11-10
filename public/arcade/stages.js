import { courtyard } from './art.js';

const WIDTH = 480;
const HEIGHT = 270;
const HORIZON = 191;
const TAU = Math.PI * 2;

export const stages = {
  sam: {
    id: 'sam', name: 'Model Vault', location: 'San Francisco', accent: '#6deaf2',
    description: 'A sealed research vault with a live model at its core.',
    sky: ['#081422', '#28516a'], floor: ['#345766', '#101d2c'], light: '#5ce4ff',
  },
  dario: {
    id: 'dario', name: 'Alignment Observatory', location: 'Pacific Coast', accent: '#ff9cbf',
    description: 'A mountaintop listening station just after sunset.',
    sky: ['#1c1838', '#aa5d7a'], floor: ['#644b67', '#261d33'], light: '#ff9eb9',
  },
  elon: {
    id: 'elon', name: 'Launch Complex', location: 'Gulf Coast', accent: '#ff9c61',
    description: 'The launch platform is hot and the rocket is on the pad.',
    sky: ['#271a31', '#cf6a50'], floor: ['#82605a', '#322631'], light: '#ffb870',
  },
  ellison: {
    id: 'ellison', name: 'Cloud Citadel', location: 'Hawaiian Coast', accent: '#bfadff',
    description: 'A glass fortress above an island caught in a summer storm.',
    sky: ['#171f42', '#6e5979'], floor: ['#594b75', '#221e3a'], light: '#ae97fb',
  },
  page: {
    id: 'page', name: 'Index Garden', location: 'Silicon Valley', accent: '#a2ef98',
    description: 'A transit garden built around a living map of the city.',
    sky: ['#142e36', '#6c9774'], floor: ['#4f7059', '#223b37'], light: '#b8ed84',
  },
  bezos: {
    id: 'bezos', name: 'Orbital Dock', location: 'Low Earth Orbit', accent: '#91baff',
    description: 'A cargo bay with a window onto the dark side of Earth.',
    sky: ['#060c21', '#25294b'], floor: ['#454e77', '#171f38'], light: '#8ecfff',
  },
  buffett: {
    id: 'buffett', name: 'Berkshire Exchange', location: 'Omaha', accent: '#f5ce7e',
    description: 'An Art Deco trading hall after the closing bell.',
    sky: ['#231f29', '#695141'], floor: ['#755d4b', '#322a2e'], light: '#ffd88a',
  },
  napoleon: {
    id: 'napoleon', name: 'Imperial Courtyard', location: 'Paris', accent: '#ffbf75',
    description: 'A torchlit palace courtyard on the night of the final duel.',
    light: '#ffbb72',
  },
};

function rectangle(c, fill, x, y, width, height) {
  c.fillStyle = fill;
  c.fillRect(x, y, width, height);
}

function polygon(c, fill, points) {
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  c.fill();
}

function line(c, color, points, width = 1) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.stroke();
}

function disc(c, fill, x, y, radius) {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(x, y, radius, 0, TAU);
  c.fill();
}

function gradient(c, top, bottom, y, height) {
  const fill = c.createLinearGradient(0, y, 0, y + height);
  fill.addColorStop(0, top);
  fill.addColorStop(1, bottom);
  return fill;
}

function glow(c, color, x, y, radius, opacity = '55') {
  const fill = c.createRadialGradient(x, y, 0, x, y, radius);
  fill.addColorStop(0, color + opacity);
  fill.addColorStop(1, color + '00');
  rectangle(c, fill, x - radius, y - radius, radius * 2, radius * 2);
}

function pixels(c, color, x, y, width, height, count, seed = 0) {
  for (let i = 1; i <= count; i++) {
    const dx = ((i * 137 + i * i * 13 + seed * 73) % width);
    const dy = ((i * 47 + i * i * 7 + seed * 61) % height);
    rectangle(c, color, x + dx, y + dy, i % 6 === 0 ? 2 : 1, 1);
  }
}

function floor(c, stage, vanishingX = 240) {
  rectangle(c, gradient(c, ...stage.floor, HORIZON, HEIGHT - HORIZON), 0, HORIZON, WIDTH, HEIGHT - HORIZON);
  rectangle(c, stage.light + '80', 0, HORIZON, WIDTH, 1);
  rectangle(c, '#0b122774', 0, HORIZON + 1, WIDTH, 2);
  for (let x = -380; x <= 840; x += 64) {
    const upperX = Math.round(vanishingX + (x - vanishingX) * .28);
    line(c, '#10152773', [[upperX, HORIZON + 3], [x, HEIGHT]], 2);
  }
  for (const y of [199, 209, 227, 253]) {
    rectangle(c, '#11172688', 0, y, WIDTH, 1);
    rectangle(c, stage.light + '1c', 0, y + 1, WIDTH, 1);
  }
  pixels(c, stage.light + '24', 0, 195, WIDTH, 73, 96);
}

function mountains(c, color, ridge) {
  polygon(c, color, [[0, HORIZON], ...ridge, [WIDTH, HORIZON]]);
}

function modelVault(c, stage) {
  glow(c, stage.light, 228, 109, 162, '60');
  const chamber = [[191, 45], [287, 45], [328, 77], [328, 163], [283, 183], [191, 183], [152, 162], [152, 77]];
  polygon(c, '#142b3c', chamber);
  line(c, '#285a70', [...chamber, chamber[0]], 3);
  for (const y of [58, 74, 90, 106, 122, 138, 154, 170]) {
    rectangle(c, '#4774876b', 166, y, 150, 1);
  }
  for (const x of [179, 203, 227, 251, 275, 299]) rectangle(c, '#4774876b', x, 58, 1, 112);
  glow(c, stage.light, 238, 115, 88, '62');
  const top = [238, 68], right = [284, 107], bottom = [238, 154], left = [192, 107], center = [238, 112];
  polygon(c, '#4dcaed52', [top, right, bottom, left]);
  polygon(c, '#a5fcf844', [top, center, left]);
  polygon(c, '#9af8e978', [top, right, center]);
  polygon(c, '#8bc9f735', [left, center, bottom]);
  line(c, '#96faf2', [top, right, bottom, left, top, center, bottom]);
  line(c, '#a3f2ff', [left, center, right]);
  line(c, '#b5f7f18c', [[214, 87], [260, 87], [261, 131], [215, 131], [214, 87]]);
  for (const x of [14, 54, 94, 346, 386, 426]) {
    const y = 50 + Math.abs(x - 222) % 30;
    rectangle(c, '#0d1a2b', x, y, 36, 187 - y);
    rectangle(c, '#25455d', x + 3, y + 4, 30, 183 - y);
    for (let slot = y + 12; slot < 175; slot += 12) {
      rectangle(c, '#122536', x + 6, slot, 24, 9);
      rectangle(c, '#4f7a8e', x + 8, slot + 2, 18, 1);
      rectangle(c, slot % 5 ? '#4b9fa7' : '#b3ffbb', x + 9, slot + 5, 2, 2);
      rectangle(c, '#3e5f74', x + 16, slot + 5, 10, 2);
    }
  }
  polygon(c, '#0c1c2a', [[0, 0], [480, 0], [480, 27], [321, 16], [159, 16], [0, 27]]);
  line(c, '#347788', [[0, 27], [159, 17], [321, 17], [480, 27]], 2);
  rectangle(c, '#71dceac0', 206, 17, 68, 2);
  rectangle(c, '#152637', 0, 183, WIDTH, 8);
  floor(c, stage);
}

function observatory(c, stage) {
  glow(c, '#ffab9b', 357, 108, 148, '58');
  pixels(c, '#faabc878', 0, 12, WIDTH, 87, 37);
  disc(c, '#e88ba1', 359, 108, 34);
  disc(c, '#ffc4ad', 359, 108, 31);
  for (const y of [111, 119, 126, 131, 136]) rectangle(c, '#cc78987e', 317, y, 84, 2);
  mountains(c, '#785273', [[0, 137], [54, 106], [76, 117], [118, 101], [168, 135], [200, 112], [218, 118], [265, 96], [307, 124], [343, 116], [381, 132], [432, 108], [480, 126]]);
  mountains(c, '#503954', [[0, 153], [54, 129], [106, 154], [153, 136], [211, 157], [272, 132], [330, 159], [380, 144], [429, 162], [480, 142]]);
  mountains(c, '#30283f', [[0, 174], [68, 151], [102, 171], [145, 163], [196, 182], [273, 161], [312, 173], [362, 164], [411, 176], [480, 155]]);
  polygon(c, '#4e3c59', [[45, 180], [69, 138], [107, 139], [123, 180]]);
  polygon(c, '#29263f', [[58, 180], [76, 141], [86, 142], [76, 180]]);
  rectangle(c, '#956785', 48, 176, 74, 4);
  c.save();
  c.translate(82, 113);
  c.rotate(-.47);
  polygon(c, '#4f3551', [[-54, -13], [-38, 17], [-13, 30], [16, 30], [43, 13], [51, -13]]);
  line(c, '#9b6281', [[-47, -9], [-32, 15], [-9, 24], [15, 24], [34, 13], [45, -9]], 2);
  c.beginPath();
  c.ellipse(0, -11, 53, 19, 0, 0, TAU);
  c.fillStyle = '#ac748b';
  c.fill();
  c.beginPath();
  c.ellipse(0, -10, 49, 14, 0, 0, TAU);
  c.fillStyle = '#66475f';
  c.fill();
  line(c, '#dc98ab', [[-41, -12], [-23, -21], [5, -23], [35, -19], [48, -13]]);
  line(c, '#d692a5', [[-21, -1], [0, -36], [24, -3]], 2);
  glow(c, '#ffd8cb', 0, -37, 14, 'a0');
  rectangle(c, '#ffe2d4', -2, -39, 4, 4);
  c.restore();
  rectangle(c, '#362b45', 0, 179, WIDTH, 12);
  rectangle(c, '#ad788d', 0, 181, WIDTH, 2);
  for (let x = 8; x < 480; x += 26) rectangle(c, '#715674', x, 179, 2, 12);
  floor(c, stage, 96);
}

function launchComplex(c, stage) {
  glow(c, '#ffc681', 126, 128, 128, '7a');
  disc(c, '#ffb676', 127, 130, 37);
  for (const [y, width] of [[114, 221], [127, 238], [135, 195], [147, 194], [151, 169]]) {
    rectangle(c, '#bc695eb7', 24, y, width, 2);
  }
  mountains(c, '#9a5859', [[0, 147], [52, 138], [92, 148], [139, 136], [189, 153], [241, 143], [303, 156], [348, 151], [397, 140], [450, 143], [480, 137]]);
  mountains(c, '#5f414d', [[0, 166], [65, 152], [96, 154], [138, 168], [197, 157], [236, 162], [294, 163], [331, 153], [380, 163], [437, 153], [480, 158]]);
  for (const [x, height] of [[42, 59], [209, 36], [399, 147], [435, 89]]) {
    const y = 184 - height;
    rectangle(c, '#513742', x, y, 5, height);
    rectangle(c, '#513742', x + 19, y, 5, height);
    for (let step = y; step + 15 < 184; step += 16) {
      rectangle(c, '#845253', x, step, 24, 3);
      line(c, '#825252', [[x + 3, step + 2], [x + 21, step + 17]], 2);
    }
    rectangle(c, '#de7770', x + 2, y - 3, 3, 2);
  }
  rectangle(c, '#7b5455', 370, 65, 51, 5);
  line(c, '#573b43', [[373, 71], [399, 93]], 3);
  polygon(c, '#513845', [[308, 183], [318, 117], [330, 94], [361, 96], [373, 119], [386, 183]]);
  polygon(c, '#b68883', [[319, 175], [325, 126], [337, 109], [355, 109], [365, 128], [374, 175]]);
  polygon(c, '#302b40', [[330, 171], [330, 70], [334, 47], [347, 27], [357, 47], [363, 69], [363, 173]]);
  polygon(c, '#dcb0a2', [[333, 170], [333, 71], [338, 49], [347, 33], [355, 51], [360, 69], [360, 173]]);
  polygon(c, '#ffe0b9', [[338, 164], [338, 65], [343, 47], [347, 37], [350, 50], [350, 164]]);
  rectangle(c, '#7b5d68', 333, 79, 27, 4);
  rectangle(c, '#745864', 333, 154, 27, 8);
  rectangle(c, '#f5c7a4', 342, 60, 10, 3);
  rectangle(c, '#527491', 343, 55, 8, 6);
  glow(c, '#ff984f', 346, 173, 49, '76');
  rectangle(c, '#302b3b', 0, 177, 480, 14);
  rectangle(c, '#c68765', 0, 180, 480, 2);
  floor(c, stage, 345);
  for (let x = 0; x < 480; x += 24) {
    polygon(c, '#d49a6959', [[x, 204], [x + 10, 204], [x + 16, 208], [x + 6, 208]]);
  }
}

function cloudCitadel(c, stage) {
  glow(c, '#ebb9ef', 220, 97, 143, '46');
  const cloud = ['#5b5074', '#625475', '#755e82'];
  for (let i = 0; i < 14; i++) {
    const x = (i * 173) % 492 - 36;
    const y = 55 + (i * 29) % 70;
    rectangle(c, cloud[i % cloud.length] + '7d', x, y, 40 + i % 5 * 17, 3 + i % 3 * 2);
  }
  line(c, '#b7a1d98c', [[197, 48], [182, 73], [194, 72], [165, 115]]);
  mountains(c, '#3b3b5b', [[0, 137], [71, 116], [127, 151], [176, 151], [223, 166], [277, 149], [330, 132], [367, 137], [419, 109], [480, 139]]);
  rectangle(c, gradient(c, '#554c76', '#373a5c', 147, 44), 0, 147, WIDTH, 44);
  for (let i = 0; i < 27; i++) {
    const x = (i * 73 + 29) % 475;
    rectangle(c, '#c7a6ec63', x, 150 + (i * 29) % 34, 3 + i % 7 * 3, 1);
  }
  for (const [x, y, width, inset] of [[36, 55, 64, 17], [100, 89, 51, 12], [330, 79, 54, 10], [382, 39, 70, 19]]) {
    polygon(c, '#231e3b', [[x, y + inset], [x + inset, y], [x + width, y + inset], [x + width, 186], [x, 186]]);
    polygon(c, '#67587e', [[x + 3, y + inset], [x + inset, y + 3], [x + inset, 186], [x + 3, 186]]);
    polygon(c, '#3e365b', [[x + inset + 2, y + 4], [x + width - 2, y + inset + 2], [x + width - 2, 186], [x + inset + 2, 186]]);
    for (let row = y + inset + 7; row < 176; row += 8) {
      for (let column = x + inset + 6; column < x + width - 6; column += 8) {
        rectangle(c, (row + column) % 3 === 0 ? '#c6a9ed' : '#817197', column, row, 4, 2);
      }
    }
    line(c, '#b8a3db90', [[x, y + inset], [x + inset, y], [x + width, y + inset]]);
  }
  polygon(c, '#2e2948', [[0, 183], [83, 178], [193, 182], [283, 182], [399, 178], [480, 183], [480, 191], [0, 191]]);
  line(c, '#c5a8ec88', [[0, 183], [83, 178], [193, 182], [283, 182], [399, 178], [480, 183]]);
  floor(c, stage);
}

function indexGarden(c, stage) {
  glow(c, '#fbdb9d', 240, 110, 166, '63');
  rectangle(c, '#9bad80', 0, 137, WIDTH, 42);
  for (let i = 0; i < 31; i++) {
    const x = i * 16;
    const y = 124 - (i * 23) % 24;
    rectangle(c, i % 3 ? '#779681' : '#648878', x, y, 12, 179 - y);
    rectangle(c, '#b3c29a', x + 2, y + 2, 3, 14);
  }
  for (const x of [-100, 25, 150, 275, 400]) {
    line(c, '#0f3a3e', [[x - 34, 168], [x + 3, 70], [x + 56, 26], [x + 110, 70], [x + 145, 168]], 4);
    line(c, '#94b99a7c', [[x - 31, 168], [x + 6, 71], [x + 56, 30], [x + 107, 71], [x + 142, 168]]);
  }
  line(c, '#326561', [[0, 71], [480, 71]], 3);
  line(c, '#327268', [[0, 111], [480, 111]], 2);
  rectangle(c, '#1f4d4c', 0, 145, WIDTH, 11);
  rectangle(c, '#a0c895', 0, 147, WIDTH, 2);
  for (const x of [55, 171, 309, 419]) rectangle(c, '#406b60', x, 154, 5, 31);
  polygon(c, '#efcf8c', [[248, 137], [260, 130], [340, 130], [354, 137], [354, 144], [248, 144]]);
  rectangle(c, '#41596a', 262, 134, 75, 5);
  for (const x of [277, 296, 315, 333]) rectangle(c, '#d4b882', x, 133, 2, 7);
  for (const [x, y, size] of [[19, 162, 36], [80, 172, 26], [399, 163, 32], [456, 150, 44]]) {
    rectangle(c, '#544957', x - 2, y, 4, 35);
    polygon(c, '#1e5247', [[x - size, y + 3], [x - size + 8, y - 18], [x - 7, y - 22], [x + 8, y - 18], [x + 20, y - 26], [x + size, y - 8], [x + size - 4, y + 6]]);
    polygon(c, '#5b8e5c', [[x - size + 4, y - 2], [x - size + 11, y - 18], [x - 7, y - 22], [x + 8, y - 18], [x + 20, y - 26], [x + size - 3, y - 10], [x + 7, y - 9]]);
    pixels(c, '#a1ba71', x - 16, y - 16, 32, 10, 12, x);
  }
  rectangle(c, '#294f49', 0, 182, WIDTH, 9);
  rectangle(c, '#b6cd8d', 0, 184, WIDTH, 2);
  floor(c, stage);
}

function orbitalDock(c, stage) {
  pixels(c, '#bad4ff83', 4, 17, 472, 165, 88);
  glow(c, '#7cb2ff', 346, 159, 130, '7a');
  c.save();
  c.beginPath();
  c.arc(345, 191, 133, 0, TAU);
  c.clip();
  rectangle(c, gradient(c, '#679adb', '#263c72', 57, 165), 190, 56, 290, 141);
  for (const [x, y, width, height] of [[233, 133, 115, 22], [303, 94, 83, 18], [280, 155, 110, 28], [393, 125, 96, 22]]) {
    polygon(c, '#90acbf7d', [[x, y + height], [x + 13, y + 5], [x + 42, y + 2], [x + 60, y - 5], [x + width, y + 7], [x + width - 20, y + height]]);
    line(c, '#cbdbeb72', [[x + 12, y + 4], [x + 31, y], [x + 43, y + 3], [x + 67, y - 4], [x + width - 4, y]]);
  }
  rectangle(c, gradient(c, '#24345900', '#0e1631d9', 110, 81), 200, 110, 280, 81);
  c.restore();
  c.beginPath();
  c.arc(345, 191, 133, Math.PI, TAU);
  c.lineWidth = 2;
  c.strokeStyle = '#acdaff9c';
  c.stroke();
  polygon(c, '#b6c5e1', [[101, 108], [134, 103], [148, 98], [162, 99], [171, 104], [152, 109], [128, 116], [113, 114]]);
  polygon(c, '#4a6084', [[123, 107], [128, 92], [136, 92], [143, 106], [137, 109]]);
  rectangle(c, '#73d4ff', 111, 111, 7, 2);
  glow(c, '#78ceff', 106, 112, 18, 'a0');
  polygon(c, '#151e37', [[0, 0], [95, 0], [37, 42], [37, 142], [84, 176], [397, 176], [443, 142], [443, 42], [387, 0], [480, 0], [480, 193], [0, 193]]);
  const frame = [[95, 0], [37, 42], [37, 142], [84, 176], [397, 176], [443, 142], [443, 42], [387, 0]];
  line(c, '#414e73', frame, 6);
  line(c, '#92b3de', frame, 1);
  for (const [x, direction] of [[3, 1], [477, -1]]) {
    line(c, '#304267', [[x, 43], [x + direction * 21, 57], [x + direction * 21, 139], [x, 151]], 4);
    for (let y = 66; y < 138; y += 11) rectangle(c, y % 3 ? '#6985b7' : '#f9a982', x + direction * 12, y, 2, 5);
  }
  rectangle(c, '#4f6085', 84, 181, 312, 2);
  floor(c, stage, 240);
  for (const x of [35, 425]) rectangle(c, '#dceaf899', x, 216, 20, 2);
}

function berkshireExchange(c, stage) {
  glow(c, stage.light, 240, 90, 168, '55');
  polygon(c, '#201f2b', [[0, 0], [480, 0], [480, 36], [300, 24], [180, 24], [0, 36]]);
  const corners = [[12, 112], [12, 172], [468, 172], [468, 112]];
  line(c, '#9e754a', corners, 3);
  for (const x of [34, 120, 207, 294, 380]) {
    const left = x - 4;
    const width = 70;
    rectangle(c, '#302936', left, 40, width, 127);
    rectangle(c, '#766053', left + 4, 44, width - 8, 119);
    rectangle(c, '#372f40', left + 7, 47, width - 14, 113);
    rectangle(c, gradient(c, '#2d3b4c', '#74707b', 50, 108), left + 10, 50, width - 20, 107);
    for (let i = 0; i < 7; i++) {
      const dx = left + 12 + i * 6;
      const y = 97 + (i * 17 + x) % 28;
      rectangle(c, '#4c4a5c', dx, y, 4, 154 - y);
      rectangle(c, '#9a887b', dx + 1, y + 4, 1, 4);
    }
    rectangle(c, '#93806a', left + 35, 46, 1, 114);
    rectangle(c, '#93806a', left + 9, 108, width - 18, 1);
  }
  rectangle(c, '#312b31', 0, 122, WIDTH, 23);
  rectangle(c, '#c19a61', 0, 122, WIDTH, 2);
  rectangle(c, '#ac8558', 0, 143, WIDTH, 2);
  for (let i = 0; i < 12; i++) {
    const x = 15 + i * 40;
    const color = i % 4 ? '#acbe78' : '#c48471';
    rectangle(c, '#756b50', x, 130, 12, 1);
    rectangle(c, color, x + 2, 135, 5, 2);
    line(c, color, [[x + 14, 137], [x + 19, 134], [x + 22, 135], [x + 27, i % 4 ? 131 : 139]]);
  }
  for (const x of [17, 110, 197, 283, 370, 463]) {
    rectangle(c, '#46373a', x - 4, 26, 8, 96);
    rectangle(c, '#a37c5a', x - 2, 28, 1, 94);
    glow(c, '#ffc17c', x, 82, 29, '65');
    rectangle(c, '#d5a267', x - 3, 74, 6, 16);
    rectangle(c, '#ffe1a0', x - 1, 76, 2, 10);
  }
  rectangle(c, '#40313a', 0, 171, WIDTH, 20);
  rectangle(c, '#896a55', 0, 174, WIDTH, 2);
  floor(c, stage);
  polygon(c, '#d1a36f43', [[207, 192], [273, 192], [322, 270], [158, 270]]);
  line(c, '#e8b67767', [[207, 192], [158, 270]]);
  line(c, '#e8b67767', [[273, 192], [322, 270]]);
}

const painters = {
  sam: modelVault,
  dario: observatory,
  elon: launchComplex,
  ellison: cloudCitadel,
  page: indexGarden,
  bezos: orbitalDock,
  buffett: berkshireExchange,
};

let courtyardPlate;
let loading;

export function prepareStages() {
  if (!loading) {
    loading = new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        courtyardPlate = image;
        resolve();
      };
      image.onerror = () => resolve();
      image.src = new URL('./courtyard.webp', import.meta.url).href;
    });
  }
  return loading;
}

export function paintStage(c, stage) {
  c.save();
  if (stage.id === 'napoleon') {
    if (courtyardPlate) {
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = 'high';
      c.drawImage(courtyardPlate, 0, 0, WIDTH, HEIGHT);
    } else {
      courtyard(c);
    }
  } else {
    rectangle(c, gradient(c, ...stage.sky, 0, HORIZON), 0, 0, WIDTH, HEIGHT);
    painters[stage.id](c, stage);
  }
  rectangle(c, gradient(c, '#0b0d23b0', '#0b0d2300', 0, 71), 0, 0, WIDTH, 71);
  rectangle(c, gradient(c, '#080d2000', '#080d2048', 236, 34), 0, 236, WIDTH, 34);
  c.restore();
}

export function paintStageAtmosphere(c, stage, time) {
  const rising = stage.id === 'napoleon' || stage.id === 'elon';
  c.save();
  for (let i = 0; i < 20; i++) {
    const progress = (time * (.08 + (i % 5) * .023) + i * .37) % 1;
    const x = rising
      ? (i % 2 ? 36 : stage.id === 'elon' ? 351 : 444) + ((i * 13) % 54 - 27) * progress
      : (i * 197 + progress * 114) % WIDTH;
    const y = rising ? 181 - progress * (30 + (i * 7) % 57) : 72 + (i * 61) % 109;
    c.globalAlpha = Math.sin(progress * Math.PI) * (rising ? .68 : .42);
    rectangle(c, stage.light, Math.round(x), Math.round(y), i % 6 === 0 ? 2 : 1, 1);
  }
  c.restore();
}
