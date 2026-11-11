const arrow = {kind: 'arrow', height: 20, speed: 248};
const round = {kind: 'round', height: 24, speed: 410};
const wave = {kind: 'wave', height: 8, speed: 180};

export const chapters = [
  {
    name: 'Ramesses II', era: '1274 BCE', place: 'Temple of the Sun', weapon: 'Khopesh',
    stature: 1.69, evidence: 'Mummy-based estimate', accent: '#f1b862',
    stageArt: 'giza-dawn.webp',
    colors: ['#40284b', '#d18650', '#6f443d', '#7b594f'],
    pattern: 'hook', grip: [29, -53], speed: 86, maxHp: 180,
    tactics: {reaction: .15, pressure: 1.32, jump: 230, evadeCooldown: 2.20, high: true},
    attack: {reach: 55, windup: .50, recovery: .53, damage: 20, push: 6},
    special: {
      name: 'Sunhook', reach: 70, windup: .84, recovery: 1.02, damage: 23,
      beats: [{at: 0, push: -18}, {at: .28, reach: 79}],
      cue: 'Jump over both slashes. The first can pull you into the second.',
    },
  },
  {
    name: 'Darius the Great', era: '520 BCE', place: 'Persepolis Terrace', weapon: 'Royal Spear',
    stature: 1.78, evidence: 'Artistic estimate', accent: '#54dac9',
    stageArt: 'royal-terrace.webp',
    colors: ['#182842', '#557b89', '#324650', '#53516c'],
    pattern: 'spear', grip: [27, -55], supportGrip: [-6, -63], speed: 80, maxHp: 200,
    tactics: {reaction: .135, pressure: 1.38, space: 54, high: true, jump: 235, evadeCooldown: 2.02, preferStep: true},
    attack: {reach: 82, windup: .48, recovery: .39, damage: 23, push: 11},
    special: {
      name: 'Royal Skewer', reach: 133, windup: 1.02, recovery: 1.10, damage: 34,
      cue: 'The spear covers a long lane. Jump over the thrust and close in.',
    },
  },
  {
    name: 'Julius Caesar', era: '49 BCE', place: 'Forum Overlook', weapon: 'Gladius',
    stature: 1.70, evidence: 'Artistic estimate', accent: '#fa8077',
    stageArt: 'forum-overlook.webp',
    colors: ['#332744', '#b45e60', '#443142', '#625063'],
    pattern: 'guard', grip: [28, -54], shieldGrip: [-6, -60], speed: 92, maxHp: 225,
    tactics: {reaction: .12, pressure: 1.40, high: true, jump: 219, evadeCooldown: 1.88, preferStep: true},
    attack: {reach: 52, lunge: 17, windup: .46, recovery: .56, damage: 27, push: 15},
    special: {
      name: 'Shield Breaker', reach: 77, lunge: 29, windup: .85, recovery: 1.22, damage: 40,
      beats: [{at: 0, push: 30, stun: .29}],
      cue: 'Bait the shield charge. His guard drops while he recovers.',
    },
  },
  {
    name: 'Charlemagne', era: '800 CE', place: 'Vineyard Ramparts', weapon: 'Joyeuse',
    stature: 1.84, evidence: 'Skeletal estimate', accent: '#e6c975',
    stageArt: 'vineyard-ramparts.webp',
    colors: ['#202b49', '#675878', '#34344b', '#555269'],
    pattern: 'slam', grip: [34, -57], speed: 85, maxHp: 250,
    tactics: {reaction: .105, pressure: 1.44, high: true, jump: 223, evadeCooldown: 1.74, preferStep: true},
    attack: {reach: 67, windup: .64, recovery: .51, damage: 30, push: 19, stun: .22},
    special: {
      name: 'Joyeuse Quake', reach: 123, windup: 1.10, recovery: 1.28, damage: 44,
      projectile: wave, beats: [{at: 0}, {at: 0, reverse: true}],
      cue: 'Jump when Joyeuse lands. The shockwave travels in both directions.',
    },
  },
  {
    name: 'Genghis Khan', era: '1206 CE', place: 'Steppe Muster', weapon: 'Composite Bow',
    stature: 1.72, evidence: 'Artistic estimate', accent: '#c0e791',
    stageArt: 'steppe-muster.webp',
    colors: ['#233e4b', '#7a967e', '#354f46', '#4d5953'],
    pattern: 'bow', grip: [22, -53], supportGrip: [-13, -55], speed: 86, maxHp: 275,
    tactics: {reaction: .09, pressure: 1.42, space: 92, high: true, jump: 246, evadeCooldown: 1.60},
    attack: {reach: 258, windup: .49, recovery: .41, damage: 34, projectile: arrow},
    special: {
      name: 'Steppe Volley', reach: 305, windup: .95, recovery: 1.07, damage: 48,
      projectile: arrow, beats: [{at: 0, height: 13}, {at: 0, height: 27}, {at: 0, height: 40}],
      cue: 'Three arrows spread vertically. Time a high jump over the volley.',
    },
  },
  {
    name: 'Napoleon Bonaparte', era: '1812 CE', place: 'Fontainebleau Court', weapon: 'Cavalry Saber',
    stature: 1.69, evidence: 'Historical measurement', accent: '#9db9fd',
    stageArt: 'fontainebleau-court.webp',
    colors: ['#242142', '#826377', '#413449', '#575064'],
    pattern: 'saber', grip: [19.25, -50.75], speed: 99, maxHp: 300,
    tactics: {reaction: .08, pressure: 1.50, space: 55, high: true, jump: 242, evadeCooldown: 1.49},
    attack: {reach: 88, lunge: 37, windup: .47, recovery: .39, damage: 38, push: 12},
    special: {
      name: 'Imperial Charge', reach: 169, lunge: 116, windup: 1.04, recovery: 1.15, damage: 52,
      beats: [{at: 0}, {at: .68, reach: 58, lunge: 0}],
      cue: 'Jump across the charge. The follow-up slash catches landings in front.',
    },
  },
  {
    name: 'Adolf Hitler', era: '1945 CE', place: 'Berlin Bunker', weapon: 'Walther P38',
    stature: 1.75, evidence: 'Historical account estimate', accent: '#e68d74',
    colors: ['#171f2a', '#5a4141', '#332a33', '#494750'],
    pattern: 'pistol', grip: [25, -58], speed: 86, maxHp: 320,
    tactics: {reaction: .065, pressure: 1.46, space: 105, high: true, jump: 233, evadeCooldown: 1.38, preferStep: true},
    attack: {reach: 310, windup: .59, recovery: .58, damage: 42, projectile: round, push: 10},
    special: {
      name: 'Bunker Barrage', reach: 355, windup: .98, recovery: 1.30, damage: 56,
      projectile: round, beats: [{at: 0}, {at: .18}, {at: .36}, {at: .54}],
      cue: 'Four shots travel low. Get behind him or time the jump, then punish the reload.',
    },
  },
];

export const chapterNumber = index => String(index + 1).padStart(2, '0');
