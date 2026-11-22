// GILDED HOUR — staged scenes for the screenshots. Each scene arranges the
// real world state (never a drawing trick), then lets the real simulation run
// a fixed number of steps, so the frozen frame is one the game itself reaches:
// cones, lasers, alarm and all. Same seed, same steps, same frame, every run.

import { stepWorld } from './sim.js';

const IDLE = { up: false, down: false, left: false, right: false, sneak: false, interact: false, aimX: 0, aimY: 0 };

function takeLoot(world, ids, bag) {
  for (const item of world.loot) if (ids.includes(item.id)) item.taken = true;
  world.bag = bag;
}

function placeGuard(world, name, x, y, angle) {
  const g = world.guards.find((guard) => guard.name === name);
  g.x = x; g.y = y; g.angle = angle;
  return g;
}

/** The cover: the thief mid-crossing in the gallery, a coin in the air, every
 *  required element in one frame — guards and their cones, a camera cone, loot
 *  with its price tags, the laser door beyond, and the alarm already warm. */
function stageCover(world) {
  world.mode = 'play';
  world.startedAt = 0;
  takeLoot(world, ['necklace', 'emerald'], 1000);
  world.player.x = 585; world.player.y = 452; world.player.angle = 0.3;
  placeGuard(world, 'Vex', 706, 262, 2.25);
  placeGuard(world, 'Maro', 268, 440, 0.1);
  placeGuard(world, 'Ilsa', 950, 300, 2.8);
  world.alarm = 34;
  world.coin = { x: 640, y: 462, tx: 726, ty: 486, t: 0.4, ringT: 0 };
  for (let i = 0; i < 30; i++) stepWorld(world, { ...IDLE, right: true, aimX: 900, aimY: 470 }, 1 / 120);
  world.alarm = 34; // the staged read, exactly as the HUD should show it
}

/** The vault: the thief through the laser door, the Opal glowing ahead, Ilsa
 *  turning toward him and the alarm at 62% — the night's tensest second. */
function stageVault(world) {
  world.mode = 'play';
  world.time = 46; // a moment when both laser grids burn (see sim.laserPhase)
  world.startedAt = 46 - 168;
  takeLoot(world, ['necklace', 'chalice', 'lady', 'coins', 'emerald'], 2450);
  world.player.x = 1056; world.player.y = 424; world.player.angle = 0;
  const ilsa = placeGuard(world, 'Ilsa', 1130, 268, 2.5);
  ilsa.spotGlow = 0.8;
  placeGuard(world, 'Vex', 500, 640, -0.6);
  placeGuard(world, 'Maro', 170, 300, 1.2);
  world.alarm = 62;
  for (let i = 0; i < 12; i++) stepWorld(world, { ...IDLE, aimX: 1136, aimY: 424 }, 1 / 120);
  world.alarm = 62;
  ilsa.spotGlow = 0.8;
}

/** The getaway: the results screen over the scene, the van door green. */
function stageGetaway(world) {
  world.mode = 'play';
  takeLoot(world, ['necklace', 'chalice', 'lady', 'harbour', 'cartographer', 'emerald', 'fan', 'coins', 'ingots', 'egg', 'opal'], 7800);
  world.hasOpal = true;
  world.bag = 7800;
  world.player.x = 180; world.player.y = 730;
  world.mode = 'won';
  world.endStats = { loot: 7800, time: 214, spotted: 1, peak: 58, ghost: false, note: 'getaway', title: 'CLEAN JOB' };
  for (let i = 0; i < 10; i++) stepWorld(world, IDLE, 1 / 120);
}

/** The title: the name and the whole contract over a living floor. */
function stageTitle(world) {
  world.mode = 'title';
  for (let i = 0; i < 360; i++) stepWorld(world, IDLE, 1 / 120);
}

export function stageShot(world, name) {
  if (name === 'cover') stageCover(world);
  else if (name === 'vault') stageVault(world);
  else if (name === 'getaway') stageGetaway(world);
  else stageTitle(world);
}
