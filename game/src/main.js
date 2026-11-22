// GILDED HOUR — the browser boot: canvas, keyboard and mouse, a fixed-step
// loop (120 Hz simulation, decoupled from the frame rate), and the staged
// screenshot scenes (?shot=cover|title|vault|getaway&seed=N) that freeze a
// real frame of the game and flag it ready for capture.

import { createWorld, stepWorld, STEP } from './sim.js';
import { drawWorld } from './render.js';
import { stageShot } from './shots.js';
import { initAudio, playCue, alarmBeep } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? 7) || 7;

let world = createWorld(seed);
const input = {
  up: false, down: false, left: false, right: false, sneak: false, interact: false,
  aimX: world.player.x + 40, aimY: world.player.y,
  tossCoin: false, emp: false,
};

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak', KeyE: 'interact',
};

function startOrRestart() {
  if (world.mode === 'title') { world.mode = 'play'; world.startedAt = world.time; }
  else if (world.mode === 'won' || world.mode === 'caught') {
    world = createWorld(seed);
    world.mode = 'play';
    world.startedAt = 0;
  }
}

addEventListener('keydown', (e) => {
  initAudio();
  if (e.code === 'Enter') startOrRestart();
  if (e.code === 'KeyF') input.emp = true;
  const k = KEYMAP[e.code];
  if (k) { input[k] = true; e.preventDefault(); }
});
addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k) input[k] = false;
});

function toGameCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}
canvas.addEventListener('mousemove', (e) => {
  const p = toGameCoords(e);
  input.aimX = p.x; input.aimY = p.y;
});
canvas.addEventListener('mousedown', (e) => {
  initAudio();
  const p = toGameCoords(e);
  input.aimX = p.x; input.aimY = p.y;
  if (world.mode !== 'play') { startOrRestart(); return; }
  if (e.button === 2) input.emp = true;
  else input.tossCoin = true;
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Staged screenshot mode: arrange the scene, draw one frame, flag ready.
if (params.has('shot')) {
  stageShot(world, params.get('shot'));
  drawWorld(ctx, world);
  document.body.dataset.shotReady = params.get('shot');
} else {
  let last = performance.now();
  let acc = 0;
  let lastBeepAt = 0;
  function frame(now) {
    acc += Math.min(0.25, (now - last) / 1000);
    last = now;
    while (acc >= STEP) {
      stepWorld(world, input, STEP);
      for (const ev of world.events) playCue(ev);
      input.tossCoin = false;
      input.emp = false;
      acc -= STEP;
    }
    if (world.mode === 'play' && world.alarm > 55 && now - lastBeepAt > (world.alarm > 85 ? 300 : 620)) {
      alarmBeep(world.alarm);
      lastBeepAt = now;
    }
    drawWorld(ctx, world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
