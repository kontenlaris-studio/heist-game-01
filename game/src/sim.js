// GILDED HOUR — the simulation: thief, guards, cameras, lasers and the alarm.
// Fixed-step and seeded, so a staged scene (see shots.js) lands on the same
// frame every run, in Node and in the browser alike.

import { WALLS, COVERS, LOOT, PATROLS, CAMERAS, LASER_GRIDS, PLAYER_START, EXIT_ZONE } from './level.js';

export const STEP = 1 / 120;

const GUARD_SIGHT = 196;
const GUARD_HALF_ANGLE = 0.46; // radians, ~26 degrees
const CAMERA_SIGHT = 216;
const CAMERA_HALF_ANGLE = 0.28; // ~16 degrees
const PLAYER_RADIUS = 13;

/** A tiny seeded RNG (mulberry32): same seed, same night, every run. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const solids = [...WALLS, ...COVERS];

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle at all?
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; }
    else {
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return true;
}

/** True when nothing solid stands between two points. */
export function lineOfSight(x1, y1, x2, y2) {
  for (const r of solids) if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
  return true;
}

function collides(x, y, radius) {
  for (const r of solids) {
    const nx = Math.max(r.x, Math.min(x, r.x + r.w));
    const ny = Math.max(r.y, Math.min(y, r.y + r.h));
    const dx = x - nx, dy = y - ny;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

function moveWithCollision(body, dx, dy, radius) {
  if (!collides(body.x + dx, body.y, radius)) body.x += dx;
  if (!collides(body.x, body.y + dy, radius)) body.y += dy;
}

function angleLerp(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Laser state at a moment: 'on', 'warn' (about to switch on) or 'off'. */
export function laserPhase(grid, time) {
  const t = (time + grid.offset) % grid.period;
  const onFor = grid.period * 0.58;
  if (t < onFor) return 'on';
  if (t > grid.period - 0.45) return 'warn';
  return 'off';
}

export function createWorld(seed) {
  const rng = makeRng(seed);
  return {
    mode: 'title',
    time: 0,
    seed,
    rng,
    player: { x: PLAYER_START.x, y: PLAYER_START.y, angle: -Math.PI / 2, moving: false, sneaking: false, grabId: null, grabT: 0 },
    guards: PATROLS.map((p, i) => ({
      name: p.name, x: p.waypoints[0][0], y: p.waypoints[0][1],
      angle: Math.PI / 2, waypoints: p.waypoints, wp: 1 % p.waypoints.length,
      speed: p.speed, state: 'patrol', pauseT: i * 0.7, seesNow: false, wasSeeing: false,
      spotGlow: 0, huntX: 0, huntY: 0, huntT: 0, lookPhase: rng() * 6,
    })),
    cameras: CAMERAS.map((c) => ({ ...c, angle: (c.from + c.to) / 2 * Math.PI / 180, seesNow: false, disabledT: 0 })),
    loot: LOOT.map((l) => ({ ...l, taken: false })),
    bag: 0,
    hasOpal: false,
    alarm: 0,
    alarmPeak: 0,
    timesSpotted: 0,
    gadgets: { coins: 3, emp: 2 },
    coin: null,          // a tossed coin, in flight or ringing on the floor
    noise: null,         // {x, y, t} the ringing point guards react to
    floaters: [],        // rising text: "+$500", "SPOTTED!", ...
    events: [],          // sound cues for audio.js: 'coin', 'emp', 'grab', ...
    startedAt: 0,
    endStats: null,
  };
}

function addFloater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, t: 0 });
  if (world.floaters.length > 14) world.floaters.shift();
}

function catchPlayer(world, why) {
  world.mode = 'caught';
  world.endStats = stats(world, why);
  world.events.push('caught');
}

function stats(world, note) {
  const ghost = world.alarmPeak <= 30 && world.timesSpotted === 0;
  return {
    loot: world.bag,
    time: world.time - world.startedAt,
    spotted: world.timesSpotted,
    peak: Math.round(world.alarmPeak),
    ghost,
    note,
    title: note === 'getaway'
      ? (ghost ? 'GHOST — IN AND OUT UNSEEN' : world.timesSpotted <= 2 ? 'CLEAN JOB' : 'A NOISY NIGHT')
      : 'CAUGHT',
  };
}

function guardSeesPlayer(world, g) {
  const p = world.player;
  const dx = p.x - g.x, dy = p.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_SIGHT) return 0;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), g.angle)) > GUARD_HALF_ANGLE) return 0;
  if (!lineOfSight(g.x, g.y, p.x, p.y)) return 0;
  // Closer and upright reads faster; sneaking in the open still reads, slowly.
  const closeness = 1 - dist / GUARD_SIGHT;
  return (0.35 + closeness * 1.15) * (p.sneaking ? 0.55 : 1);
}

function cameraSeesPlayer(world, c) {
  if (c.disabledT > 0) return 0;
  const p = world.player;
  const dx = p.x - c.x, dy = p.y - c.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA_SIGHT) return 0;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), c.angle)) > CAMERA_HALF_ANGLE) return 0;
  if (!lineOfSight(c.x, c.y, p.x, p.y)) return 0;
  return 0.5 * (p.sneaking ? 0.6 : 1);
}

function stepGuard(world, g, dt) {
  const p = world.player;
  const seeRate = world.mode === 'play' ? guardSeesPlayer(world, g) : 0;
  g.seesNow = seeRate > 0;
  if (g.seesNow && !g.wasSeeing) {
    world.timesSpotted += 1;
    addFloater(world, g.x, g.y - 30, '!', '#ff5d5d');
    world.events.push('spot');
  }
  g.wasSeeing = g.seesNow;
  g.spotGlow = Math.max(0, g.spotGlow - dt * 2) + (g.seesNow ? dt * 3 : 0);
  if (g.spotGlow > 1) g.spotGlow = 1;

  if (g.seesNow) world.alarm = Math.min(100, world.alarm + seeRate * 34 * dt);

  let tx = null, ty = null, speed = g.speed;
  if (g.seesNow && world.alarm > 45) {
    // Convinced: close in on the thief.
    tx = p.x; ty = p.y; speed = 121;
    g.state = 'chase';
  } else if (g.state === 'chase' && !g.seesNow) {
    g.state = 'patrol';
  } else if (world.noise && g.state !== 'investigate') {
    const d = Math.hypot(world.noise.x - g.x, world.noise.y - g.y);
    if (d < 280) { g.state = 'investigate'; g.huntX = world.noise.x; g.huntY = world.noise.y; g.huntT = 0; }
  }

  if (g.state === 'investigate') {
    tx = g.huntX; ty = g.huntY; speed = 96;
    if (Math.hypot(tx - g.x, ty - g.y) < 8) {
      g.huntT += dt;
      g.angle += Math.sin(world.time * 1.7 + g.lookPhase) * dt * 1.4; // look around
      if (g.huntT > 1.8) { g.state = 'patrol'; }
      tx = null;
    }
  } else if (g.state === 'patrol') {
    const wp = g.waypoints[g.wp];
    tx = wp[0]; ty = wp[1];
    if (Math.hypot(tx - g.x, ty - g.y) < 6) {
      if (g.pauseT > 0) { g.pauseT -= dt; tx = null; g.angle += Math.sin(world.time * 0.9 + g.lookPhase) * dt * 0.8; }
      else { g.wp = (g.wp + 1) % g.waypoints.length; g.pauseT = 0.7; }
    }
  }

  if (tx !== null) {
    const dx = tx - g.x, dy = ty - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const want = Math.atan2(dy, dx);
      g.angle = angleLerp(g.angle, want, Math.min(1, dt * 7));
      const step = Math.min(dist, speed * dt);
      moveWithCollision(g, Math.cos(want) * step, Math.sin(want) * step, 13);
    }
  }

  // A guard who lays a hand on the thief ends the night, if he is sure.
  if (world.mode === 'play' && world.alarm > 55 && Math.hypot(p.x - g.x, p.y - g.y) < 24) {
    catchPlayer(world, 'grabbed');
  }
}

function stepPlayer(world, input, dt) {
  const p = world.player;
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  p.sneaking = !!input.sneak;
  p.moving = dx !== 0 || dy !== 0;
  if (p.moving) {
    const len = Math.hypot(dx, dy);
    const speed = p.sneaking ? 74 : 136;
    moveWithCollision(p, (dx / len) * speed * dt, (dy / len) * speed * dt, PLAYER_RADIUS);
    p.angle = Math.atan2(dy, dx);
  } else if (input.aimX !== undefined) {
    p.angle = Math.atan2(input.aimY - p.y, input.aimX - p.x);
  }

  // Grabbing: stand at a piece and hold E; big pieces take longer.
  p.grabId = null;
  if (input.interact) {
    for (const item of world.loot) {
      if (item.taken) continue;
      if (Math.hypot(item.x - p.x, item.y - p.y) < 40) {
        p.grabId = item.id;
        p.grabT += dt;
        if (p.grabT >= item.grabTime) {
          item.taken = true;
          world.bag += item.value;
          if (item.opal) world.hasOpal = true;
          addFloater(world, item.x, item.y - 26, `+$${item.value} ${item.name}`, '#ffd76a');
          world.events.push('grab');
          p.grabT = 0;
        }
        break;
      }
    }
  }
  if (!input.interact || !p.grabId) p.grabT = p.grabId ? p.grabT : 0;

  // The getaway: stand at the van door with the Opal and press E.
  if (input.interact && world.hasOpal &&
      p.x > EXIT_ZONE.x && p.x < EXIT_ZONE.x + EXIT_ZONE.w && p.y > EXIT_ZONE.y) {
    world.mode = 'won';
    world.endStats = stats(world, 'getaway');
    world.events.push('win');
  }
}

function stepGadgets(world, input, dt) {
  // Coin toss: a thrown coin flies to the aim point, then rings for 2.4 s.
  if (input.tossCoin && world.gadgets.coins > 0 && !world.coin) {
    world.gadgets.coins -= 1;
    world.coin = { x: world.player.x, y: world.player.y, tx: input.aimX, ty: input.aimY, t: 0, ringT: 0 };
    world.events.push('coin');
  }
  if (world.coin) {
    const c = world.coin;
    if (c.ringT === 0) {
      c.t += dt * 2.4;
      c.x += (c.tx - c.x) * Math.min(1, dt * 10);
      c.y += (c.ty - c.y) * Math.min(1, dt * 10);
      if (c.t >= 1) { c.ringT = 0.001; world.noise = { x: c.tx, y: c.ty, t: 2.4 }; }
    } else {
      c.ringT += dt;
      if (c.ringT > 2.4) world.coin = null;
    }
  }
  if (world.noise) {
    world.noise.t -= dt;
    if (world.noise.t <= 0) world.noise = null;
  }
  // EMP: one pulse kills every camera for six seconds. It costs a charge and
  // the pulse itself is not silent: +6 alarm.
  if (input.emp && world.gadgets.emp > 0) {
    world.gadgets.emp -= 1;
    for (const c of world.cameras) c.disabledT = 6;
    world.alarm = Math.min(100, world.alarm + 6);
    world.events.push('emp');
    addFloater(world, world.player.x, world.player.y - 30, 'EMP — CAMERAS DARK', '#7ae7ff');
  }
  for (const c of world.cameras) if (c.disabledT > 0) c.disabledT -= dt;
}

function stepLasers(world) {
  const p = world.player;
  for (const grid of LASER_GRIDS) {
    if (laserPhase(grid, world.time) !== 'on') continue;
    // The beams span the doorway vertically; crossing the line trips them.
    if (Math.abs(p.x - grid.x) < 10 && p.y > grid.y1 - 6 && p.y < grid.y2 + 6 && !world.laserTripCd) {
      world.alarm = Math.min(100, world.alarm + 35);
      world.laserTripCd = 1.2;
      addFloater(world, grid.x, grid.y1 - 14, 'LASER TRIPPED!', '#ff5d5d');
      world.events.push('laser');
    }
  }
  if (world.laserTripCd) { world.laserTripCd -= STEP; if (world.laserTripCd < 0) world.laserTripCd = 0; }
}

/** Advance the whole world one fixed step. Input edges (tossCoin, emp) are
 *  consumed by the caller setting them for exactly one step. */
export function stepWorld(world, input, dt) {
  world.time += dt;
  world.events.length = 0;

  // Cameras sweep on a sine between their two stops, play or title alike.
  for (const c of world.cameras) {
    const swing = (Math.sin(world.time * (Math.PI * 2 / c.period)) + 1) / 2;
    const deg = c.from + (c.to - c.from) * swing;
    c.angle = deg * Math.PI / 180;
    if (world.mode === 'play') {
      const rate = cameraSeesPlayer(world, c);
      c.seesNow = rate > 0;
      if (c.seesNow) world.alarm = Math.min(100, world.alarm + rate * 26 * dt);
    } else c.seesNow = false;
  }

  for (const g of world.guards) stepGuard(world, g, dt);

  if (world.mode === 'play') {
    stepPlayer(world, input, dt);
    stepGadgets(world, input, dt);
    stepLasers(world);
    if (!world.guards.some((g) => g.seesNow) && !world.cameras.some((c) => c.seesNow)) {
      world.alarm = Math.max(0, world.alarm - 4.5 * dt);
    }
    world.alarmPeak = Math.max(world.alarmPeak, world.alarm);
    if (world.alarm >= 100) catchPlayer(world, 'alarm');
  }

  for (const f of world.floaters) { f.t += dt; f.y -= 22 * dt; }
  world.floaters = world.floaters.filter((f) => f.t < 1.6);
}
