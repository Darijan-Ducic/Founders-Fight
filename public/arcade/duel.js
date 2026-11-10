export const MAX_HP = 180;
export const MAX_CHARGE = 100;
export const ROUND_SECONDS = 80;

// The release pose moves the launcher forward of its resting grip.
const indexLauncher = { offset: 46, catchOffset: 38, launchHeight: 80, dropSpeed: 252 };

export const weapons = {
  sam: {
    name: 'Neural Baton', type: 'arc', color: '#64eafa', maxHp: MAX_HP,
    damage: 19, range: 53, windup: .24, recovery: .34, height: 25,
    impact: { push: 5, stun: .14 },
    description: 'Fast close-range strikes. Close the gap and keep the pressure on.',
    ultimate: 'Neural Overload',
    ultimateAttack: { damage: 43, range: 87, height: 39 },
  },
  dario: {
    name: 'Prism Emitter', type: 'bolt', color: '#ecb4ff', maxHp: 166,
    damage: 17, range: 184, windup: .33, recovery: .49, height: 27,
    impact: { push: 6, stun: .15 },
    projectile: { speed: 218, radius: 3, stance: 126 },
    description: 'A quick energy bolt that travels across the arena. Jump over it.',
    ultimate: 'Spectrum Burst',
    ultimateAttack: { damage: 16, range: 252, projectile: { speed: 245, radius: 4, spread: [[1, 0], [.78, 7], [.61, -7]] } },
  },
  elon: {
    name: 'Booster Gauntlet', type: 'dash', color: '#ff8966', maxHp: 192,
    damage: 24, range: 81, windup: .38, recovery: .47, height: 26, advance: 36,
    impact: { push: 13, stun: .21 },
    description: 'A rocket-assisted punch that closes distance before impact.',
    ultimate: 'Starship Rush',
    ultimateAttack: { damage: 47, range: 152, advance: 98, height: 34 },
  },
  ellison: {
    name: 'Oracle Blade', type: 'slash', color: '#d7a1ff', maxHp: 176,
    damage: 22, range: 64, windup: .34, recovery: .46, height: 49,
    impact: { push: 9, stun: .18 },
    description: 'A rising slash that reaches fighters in the air.',
    ultimate: 'Oracle Breaker',
    ultimateAttack: { damage: 45, range: 103, height: 61 },
  },
  page: {
    name: 'Super Search', type: 'orb', color: '#8ee7a6', maxHp: 162,
    damage: 21, range: 212, windup: .42, recovery: .52, height: 26,
    impact: { push: 8, stun: .17 },
    projectile: { ...indexLauncher, speed: 184, radius: 9, stance: 150, returnSpeed: 310 },
    description: 'Launch a spinning Index Disc that can hit on either pass. Catch it to fire again.',
    ultimate: 'Full Index',
    ultimateAttack: { damage: 42, range: 322, projectile: { ...indexLauncher, speed: 215, radius: 13, returnSpeed: 330 } },
  },
  bezos: {
    name: 'Orbital Hammer', type: 'slam', color: '#a3b7ff', maxHp: 202,
    damage: 29, range: 135, windup: .52, recovery: .60, height: 12, direct: 50,
    impact: { push: 16, stun: .22 },
    projectile: { speed: 176, radius: 4, stance: 74, damage: 22, impact: { push: 9, stun: .17 } },
    description: 'A heavy impact up close. At range, send a lighter ground wave.',
    ultimate: 'Orbital Impact',
    ultimateAttack: { damage: 51, range: 230, direct: 70, projectile: { speed: 186, radius: 10, damage: 40 } },
  },
  buffett: {
    name: 'Bull Cane', type: 'reach', color: '#ffe287', maxHp: 184,
    damage: 20, tipDamage: 5, range: 76, windup: .30, recovery: .41, height: 22,
    impact: { push: 8, stun: .17 },
    description: 'A long thrust. The tip deals extra damage at full reach.',
    ultimate: 'Golden Bull Run',
    ultimateAttack: { damage: 42, range: 123, height: 28, impact: { push: 12, stun: .28 } },
  },
  napoleon: {
    name: 'Cavalry Saber', type: 'lunge', color: '#ffd9a6',
    damage: 25, range: 95, windup: .45, recovery: .52, height: 31, advance: 28,
    impact: { push: 11, stun: .19 },
    description: 'A deliberate saber lunge with a long reach and a clear windup.',
    ultimate: 'Imperial Charge',
    ultimateAttack: { damage: 49, range: 137, advance: 62, height: 52 },
  },
};

export const FLOOR = 223;
export const UNITS_PER_METER = 69;
export const JUMP_GRAVITY = 540;
export const PROJECTILE_OFFSET = 22;
export const DEFAULT_HURTBOX = { radius: 9, bottom: 5, top: 82 };
const LEFT = 33;
const RIGHT = 447;
const ARENA_WIDTH = 480;
const SEPARATION = 24;
const ADVANCE_TIME = .16;
const EPSILON = 1e-8;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const boundX = x => clamp(x, LEFT, RIGHT);

function fighter(profile, weapon, x, facing, difficulty) {
  const cpu = difficulty !== null;
  const maxHp = weapon.maxHp ?? MAX_HP;
  return {
    fighter: profile, weapon, x, facing, y: 0, vy: 0,
    hp: maxHp, maxHp, hit: 0, recoil: 0, impactFacing: 0, moving: false,
    charge: 0, ultimate: false,
    phase: 'ready', phaseTime: 0, phaseDuration: 0, attack: 0, attackProgress: 0, struck: false,
    attackOrigin: x,
    cooldown: cpu ? .3 : 0,
    windup: cpu ? Math.max(.34, weapon.windup + .10 - difficulty * .018) : weapon.windup,
    recovery: cpu ? weapon.recovery + .14 - difficulty * .014 : weapon.recovery,
    interruptBefore: cpu ? .48 - difficulty * .035 : .72,
    speed: cpu ? 83 + difficulty * 3 : 137,
    damageScale: cpu ? .94 + difficulty * .025 : 1,
  };
}

export function createArmedPlayer(profile, id, x) {
  return fighter(profile, weapons[id], x, 1, null);
}

export function createDuel(playerProfile, opponentProfile, playerId, opponentId, difficulty = 0) {
  return {
    player: createArmedPlayer(playerProfile, playerId, 128),
    opponent: fighter(opponentProfile, weapons[opponentId], 350, -1, clamp(difficulty, 0, 7)),
    remaining: ROUND_SECONDS,
    elapsed: 0,
    tactics: { pressure: 0, backstep: 0, evadeCooldown: 0 },
    effects: [],
    projectiles: [],
    result: null,
  };
}

function setPhase(actor, phase, time) {
  actor.phase = phase;
  actor.phaseDuration = actor.phaseTime = actor.attack = time;
  actor.attackProgress = 0;
  actor.struck = phase === 'recovery';
  if (phase === 'windup') actor.attackOrigin = actor.x;
  if (phase === 'ready') actor.ultimate = false;
}

export function canAttack(duel, actor) {
  return actor.phase === 'ready' && actor.cooldown === 0 && actor.hit === 0
    && (!actor.weapon.projectile?.returnSpeed || !duel.projectiles.some(shot => shot.owner === actor));
}

export function controlArmedPlayer(duel, action) {
  const { player, opponent } = duel;
  if (duel.result || player.hit > 0) return false;
  if (action === 'jump' && player.y === 0 && player.vy === 0) {
    player.vy = 239;
    return true;
  }
  const ultimate = action === 'ultimate' && player.charge === MAX_CHARGE;
  if ((action === 'attack' || ultimate) && canAttack(duel, player)) {
    player.facing = player.x <= opponent.x ? 1 : -1;
    player.ultimate = ultimate;
    if (ultimate) player.charge = 0;
    setPhase(player, 'windup', player.windup + (ultimate ? .27 : 0));
    return true;
  }
  return false;
}

export function act(duel, action) {
  const accepted = controlArmedPlayer(duel, action);
  if (accepted && action !== 'jump') duel.tactics.pressure = Math.min(3, duel.tactics.pressure + 1);
  return accepted;
}

function effect(duel, attacker, type, x, y, details) {
  const duration = type === 'hit' ? .44 : details.ultimate ? .38 : .22;
  duel.effects.push({ type, x, y, time: duration, duration, color: attacker.weapon.color,
    weaponType: attacker.weapon.type, ...details });
}

export function buildCharge(actor, amount) {
  actor.charge = Math.min(MAX_CHARGE, actor.charge + amount);
}

export function healthWinner(player, opponent) {
  const advantage = player.hp * opponent.maxHp - opponent.hp * player.maxHp;
  return advantage === 0 ? 'draw' : advantage > 0 ? 'player' : 'opponent';
}

export function interruptWindup(actor) {
  if (actor.phase !== 'windup' || actor.ultimate || actor.attackProgress >= actor.interruptBefore) return false;
  setPhase(actor, 'ready', 0);
  actor.cooldown = .24;
  return true;
}

function hit(duel, attacker, target, damage, { facing, ultimate, impact, y, tip = false }, blocked) {
  if (target.hp === 0 || blocked?.(facing, y)) return;
  const dealt = Math.min(target.hp, Math.round(damage * attacker.damageScale));
  const push = impact.push + (ultimate ? 5 : 0) + (tip ? 3 : 0);
  const stun = impact.stun + (ultimate ? .06 : 0);
  const counter = interruptWindup(target);
  target.hp -= dealt;
  target.hit = Math.max(target.hit, stun);
  target.impactFacing = facing;
  target.recoil = clamp(target.recoil + facing * push, -26, 26);
  if (attacker === duel.player && !ultimate) buildCharge(attacker, 24);
  if (target === duel.player) buildCharge(target, 12);
  effect(duel, attacker, 'hit', target.x - facing * 8, y, {
    facing, ultimate, push, damage: dealt, counter,
    target: target === duel.player ? 'player' : 'opponent',
    labelY: FLOOR - target.y - (target.bodyHeight ? target.bodyHeight + 10 : 126),
  });
}

export function attackLoadout(actor) {
  return actor.ultimate ? { ...actor.weapon, ...actor.weapon.ultimateAttack } : actor.weapon;
}

function strike(duel, actor, target, blocked) {
  const { facing, ultimate } = actor;
  const weapon = attackLoadout(actor);
  const distance = (target.x - actor.x) * facing;
  const reach = weapon.direct ?? weapon.range - (weapon.advance ?? 0);
  const launchHeight = weapon.direct ? 9 : actor.y + (weapon.projectile?.launchHeight ?? weapon.height);
  const contactY = FLOOR - actor.y - (weapon.direct ? 33 : 54);
  effect(duel, actor, ultimate ? 'ultimate' : 'strike', actor.x, weapon.projectile ? FLOOR - launchHeight : contactY,
    { facing, ultimate, origin: actor.attackOrigin, reach, offset: weapon.projectile?.offset });
  const inReach = distance >= 0 && distance <= reach + EPSILON;
  const sameHeight = Math.abs(actor.y - target.y) <= weapon.height;
  if ((!weapon.projectile || weapon.direct) && inReach && sameHeight) {
    const tip = weapon.tipDamage > 0 && distance > reach - 18;
    const feet = FLOOR - target.y;
    hit(duel, actor, target, weapon.damage + (tip ? weapon.tipDamage : 0), {
      facing, ultimate, impact: weapon.impact, y: clamp(contactY, feet - 90, feet - 12), tip,
    }, blocked);
    return true;
  }
  if (weapon.projectile) {
    const { speed, radius, spread = [[1, 0]], damage = weapon.damage, impact = weapon.impact,
      offset = PROJECTILE_OFFSET, returnSpeed, catchOffset, launchHeight: catchHeight, dropSpeed } = weapon.projectile;
    for (const [speedScale, lift] of spread) {
      const velocity = speed * speedScale;
      const muzzle = actor.x + facing * offset;
      const x = returnSpeed ? clamp(muzzle, radius, ARENA_WIDTH - radius) : muzzle;
      const range = weapon.range - offset;
      const distanceToEdge = facing > 0 ? ARENA_WIDTH - radius - x : x - radius;
      duel.projectiles.push({
        owner: actor,
        x,
        y: FLOOR - launchHeight - lift,
        vx: facing * velocity,
        radius,
        color: weapon.color,
        type: weapon.type,
        damage, impact,
        time: (returnSpeed ? Math.min(range, distanceToEdge) : range) / velocity,
        launchedAt: duel.elapsed,
        ultimate,
        ...(returnSpeed ? { returnSpeed, catchOffset, catchHeight, dropSpeed, cruiseY: FLOOR - actor.y - weapon.height - lift } : {}),
      });
    }
    return true;
  }
  return false;
}

function moveRecoil(actor, dt, bound = boundX) {
  if (actor.recoil === 0) return;
  const fraction = actor.hit <= dt ? 1 : dt / actor.hit;
  const shift = actor.recoil * fraction;
  const next = bound(actor.x + shift);
  actor.recoil = next === actor.x + shift ? actor.recoil - shift : 0;
  actor.x = next;
}

export function chargeReach(actor) {
  const { range, advance = 0 } = actor.ultimate ? actor.weapon.ultimateAttack : actor.weapon;
  return range - advance * (1 - Math.min(1, actor.phaseTime / ADVANCE_TIME));
}

function moveAdvance(actor, target, dt, bound = boundX) {
  if (actor.phase !== 'windup') return;
  const advance = actor.ultimate ? actor.weapon.ultimateAttack.advance : actor.weapon.advance;
  if (!advance) return;
  const active = Math.min(ADVANCE_TIME, actor.phaseTime) - Math.max(0, actor.phaseTime - dt);
  if (active <= 0) return;
  const space = Math.max(0, (target.x - actor.x) * actor.facing - SEPARATION);
  actor.x = bound(actor.x + actor.facing * Math.min(space, advance * active / ADVANCE_TIME));
}

function advancePhase(actor, dt) {
  actor.hit = Math.max(0, actor.hit - dt);
  actor.cooldown = Math.max(0, actor.cooldown - dt);
  if (actor.phase === 'ready') return false;
  actor.attack = actor.phaseTime = Math.max(0, actor.phaseTime - dt);
  if (actor.phaseTime > EPSILON) {
    actor.attackProgress = 1 - actor.phaseTime / actor.phaseDuration;
    return false;
  }
  if (actor.phase === 'windup') {
    setPhase(actor, 'recovery', actor.recovery + (actor.ultimate ? .25 : 0));
    return true;
  }
  setPhase(actor, 'ready', 0);
  return false;
}

export function jumpHeight(y, vy, dt) {
  return Math.max(0, y + vy * dt - JUMP_GRAVITY / 2 * dt * dt);
}

export function moveJump(actor, dt) {
  if (actor.y > 0 || actor.vy > 0) {
    actor.y = jumpHeight(actor.y, actor.vy, dt);
    actor.vy = actor.y > 0 ? actor.vy - JUMP_GRAVITY * dt : 0;
  }
}

function walkPlayer(player, dt, direction, bound) {
  player.moving = direction !== 0 && player.hit === 0;
  if (player.moving) {
    const pace = player.phase === 'ready' ? 1 : .57;
    player.x = bound(player.x + direction * player.speed * pace * dt);
  }
}

export function moveArmedPlayer(duel, dt, direction, bound) {
  const { player, opponent } = duel;
  moveJump(player, dt);
  moveRecoil(player, dt, bound);
  moveRecoil(opponent, dt, bound);
  if (player.phase === 'ready') player.facing = player.x <= opponent.x ? 1 : -1;
  const x = player.x;
  walkPlayer(player, dt, direction, bound);
  moveAdvance(player, opponent, dt, bound);
  return Math.sign(player.x - x);
}

function moveActors(duel, dt, direction) {
  const { player, opponent } = duel;
  moveJump(player, dt);
  const side = player.x <= opponent.x ? 1 : -1;
  moveRecoil(player, dt);
  moveRecoil(opponent, dt);
  const distance = Math.abs(opponent.x - player.x);
  if (player.phase === 'ready') player.facing = side;
  if (opponent.phase === 'ready') opponent.facing = -side;

  walkPlayer(player, dt, direction, boundX);

  moveOpponent(duel, dt, side, distance);
  moveAdvance(player, opponent, dt);
  moveAdvance(opponent, player, dt);

  if (player.y < 29 && (opponent.x - player.x) * side < SEPARATION) {
    const leftActor = side > 0 ? player : opponent;
    const rightActor = side > 0 ? opponent : player;
    leftActor.x = clamp((leftActor.x + rightActor.x - SEPARATION) / 2, LEFT, RIGHT - SEPARATION);
    rightActor.x = leftActor.x + SEPARATION;
  }
}

function moveOpponent(duel, dt, side, distance) {
  const { player, opponent, tactics } = duel;
  const weapon = opponent.weapon;
  const stance = weapon.projectile?.stance ?? weapon.range * .83;
  tactics.pressure = Math.max(0, tactics.pressure - dt * .65);
  tactics.evadeCooldown = Math.max(0, tactics.evadeCooldown - dt);
  opponent.moving = false;
  if (opponent.phase !== 'ready' || opponent.hit > 0) {
    tactics.backstep = 0;
    return;
  }

  const escapeRoom = side > 0 ? RIGHT - opponent.x : opponent.x - LEFT;
  const threatensMelee = !player.weapon.projectile && player.phase === 'windup'
    && player.attackProgress >= .15 && player.attackProgress < .55
    && player.facing === side && distance <= player.weapon.range + 6
    && Math.abs(player.y - opponent.y) <= player.weapon.height;
  if (tactics.backstep === 0 && tactics.evadeCooldown === 0
      && tactics.pressure >= 1.45 && escapeRoom >= 22 && threatensMelee) {
    tactics.backstep = .23;
    tactics.evadeCooldown = 2.5;
  }
  if (tactics.backstep > 0) {
    const travel = Math.min(tactics.backstep, dt) * 180;
    opponent.x = clamp(opponent.x + side * travel, LEFT, RIGHT);
    opponent.moving = travel > 0 && escapeRoom > 0;
    tactics.backstep = Math.max(0, tactics.backstep - dt);
    return;
  }

  const punish = player.phase === 'recovery' && !weapon.projectile && distance <= weapon.range;
  const inStance = distance <= stance + EPSILON;
  if (canAttack(duel, opponent) && (inStance || punish)) {
    setPhase(opponent, 'windup', opponent.windup);
  } else if (!inStance) {
    const speed = opponent.speed * (player.phase === 'recovery' ? 1.25 : 1);
    opponent.x = clamp(opponent.x - side * Math.min(distance - stance, speed * dt), LEFT, RIGHT);
    opponent.moving = true;
  }
}

export function projectileOverlapsHeight(height, radius, { bottom, top }) {
  return height + radius >= bottom && height - radius <= top;
}

export function projectileYAfter(shot, time) {
  if (shot.returning) return shot.y + shot.vy * time;
  if (shot.dropSpeed) return Math.min(shot.cruiseY, shot.y + shot.dropSpeed * time);
  return shot.y;
}

function projectileContact(duel, shot, fromX, fromY, blocked) {
  const { owner, radius, x, y, vx, damage, impact, ultimate } = shot;
  const target = owner === duel.player ? duel.opponent : duel.player;
  const hurtbox = target.hurtbox ?? DEFAULT_HURTBOX;
  const halfWidth = radius + hurtbox.radius;
  if (target.x < Math.min(fromX, x) - halfWidth || target.x > Math.max(fromX, x) + halfWidth) return false;
  const progress = x === fromX ? 1 : clamp((target.x - fromX) / (x - fromX), 0, 1);
  const contactY = fromY + (y - fromY) * progress;
  if (!projectileOverlapsHeight(FLOOR - contactY - target.y, radius, hurtbox)) return false;
  hit(duel, owner, target, damage, { facing: Math.sign(vx) || owner.facing, ultimate, impact, y: contactY }, blocked);
  return true;
}

function moveIndexDisc(duel, shot, dt, blocked) {
  if (!shot.returning) {
    const { x, y } = shot;
    const travel = Math.min(dt, shot.time);
    shot.x += shot.vx * travel;
    shot.y = projectileYAfter(shot, travel);
    shot.time -= travel;
    if (!shot.spent && projectileContact(duel, shot, x, y, blocked)) shot.spent = true;
    if (shot.time > EPSILON) return true;
    shot.returning = true;
    shot.turnedAt = duel.elapsed;
    dt -= travel;
  }

  const { owner, x, y, radius, returnSpeed, catchOffset, catchHeight } = shot;
  const dx = clamp(owner.x + owner.facing * catchOffset, radius, ARENA_WIDTH - radius) - x;
  const dy = FLOOR - owner.y - catchHeight - y;
  const duration = Math.hypot(dx, dy) / returnSpeed;
  if (duration <= EPSILON) return false;

  const travel = Math.min(dt, duration);
  shot.vx = dx / duration;
  shot.vy = dy / duration;
  shot.x += shot.vx * travel;
  shot.y = projectileYAfter(shot, travel);
  shot.time = duration - travel;
  if (travel > 0 && !shot.spent && projectileContact(duel, shot, x, y, blocked)) shot.spent = true;
  return shot.time > EPSILON;
}

function updateEffects(duel, dt, blocked) {
  for (const spark of duel.effects) spark.time -= dt;
  duel.effects = duel.effects.filter(spark => spark.time > 0);
  duel.projectiles = duel.projectiles.filter(projectile => {
    if (projectile.returnSpeed) return moveIndexDisc(duel, projectile, dt, blocked);
    const { y, vx } = projectile;
    const previous = projectile.x;
    const travelTime = Math.min(dt, projectile.time);
    projectile.x += vx * travelTime;
    projectile.time -= travelTime;
    if (projectileContact(duel, projectile, previous, y, blocked)) return false;
    return projectile.time > EPSILON && projectile.x >= 0 && projectile.x <= ARENA_WIDTH;
  });
}

export function stepArmedAttack(duel, dt, blocked) {
  const { player, opponent } = duel;
  buildCharge(player, dt * 1.8);
  updateEffects(duel, dt, blocked);
  if (opponent.hp > 0 && advancePhase(player, dt)) return strike(duel, player, opponent, blocked);
  return null;
}

function tick(duel, dt, direction) {
  const { player, opponent } = duel;
  duel.remaining = Math.max(0, duel.remaining - dt);
  duel.elapsed += dt;
  buildCharge(player, dt * 1.8);
  updateEffects(duel, dt);
  if (player.hp > 0 && opponent.hp > 0) {
    moveActors(duel, dt, direction);
    const playerStrikes = advancePhase(player, dt);
    const opponentStrikes = advancePhase(opponent, dt);
    if (playerStrikes) strike(duel, player, opponent);
    if (opponentStrikes) strike(duel, opponent, player);
  }
  const knockout = player.hp === 0 || opponent.hp === 0;
  if (knockout || duel.remaining <= EPSILON) {
    if (player.hp === 0) player.y = player.vy = 0;
    duel.result = {
      winner: healthWinner(player, opponent),
      reason: knockout ? 'ko' : 'time',
    };
  }
}

export function stepDuel(duel, dt, direction = 0) {
  // Bound each collision step so sparse browser frames cannot skip a hit.
  while (dt > EPSILON && !duel.result) {
    const step = Math.min(dt, duel.remaining, 1 / 120);
    tick(duel, step, Math.sign(direction));
    dt -= step;
  }
}
