// GILDED HOUR — every pixel: floors, cones, cameras, lasers, loot, the crew,
// the HUD and the title / getaway / caught screens. Canvas 2D only, no assets:
// the art-deco look (deep teal, brass, burgundy) is drawn from shapes so that
// safe cover, danger and loot read at a glance, even shrunk to a thumbnail.

import { VIEW, WALLS, COVERS, ROOMS, EXIT_ZONE, OPAL_PEDESTAL } from './level.js';
import { lineOfSight, laserPhase } from './sim.js';
import { LASER_GRIDS } from './level.js';

const GOLD = '#d8a94e';
const GOLD_BRIGHT = '#ffd76a';
const INK = '#0c1a24';

let floorPatterns = null;

function makeFloorPatterns() {
  const patterns = {};
  for (const room of ROOMS) {
    const tile = document.createElement('canvas');
    tile.width = 64; tile.height = 64;
    const g = tile.getContext('2d');
    g.fillStyle = room.tone;
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(216,169,78,0.13)';
    g.lineWidth = 2;
    g.strokeRect(1, 1, 62, 62);
    g.fillStyle = 'rgba(255,255,255,0.05)';
    g.beginPath(); g.arc(32, 32, 5, 0, Math.PI * 2); g.fill();
    patterns[room.name] = tile;
  }
  return patterns;
}

function rayDistance(x, y, angle, maxDist) {
  // Nearest solid along a ray, by stepping the slab test per solid.
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let best = maxDist;
  for (const r of [...WALLS, ...COVERS]) {
    let tmin = 0, tmax = best;
    if (Math.abs(dx) < 1e-9) { if (x < r.x || x > r.x + r.w) continue; }
    else {
      let t1 = (r.x - x) / dx, t2 = (r.x + r.w - x) / dx;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmax < tmin) continue;
    }
    if (Math.abs(dy) < 1e-9) { if (y < r.y || y > r.y + r.h) continue; }
    else {
      let t1 = (r.y - y) / dy, t2 = (r.y + r.h - y) / dy;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmax < tmin) continue;
    }
    if (tmin > 0 && tmin < best) best = tmin;
  }
  return best;
}

function drawCone(ctx, x, y, angle, halfAngle, length, color) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / steps;
    const d = rayDistance(x, y, a, length);
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawFloors(ctx) {
  if (!floorPatterns) floorPatterns = makeFloorPatterns();
  for (const room of ROOMS) {
    const pat = ctx.createPattern(floorPatterns[room.name], 'repeat');
    ctx.save();
    ctx.translate(room.x, room.y);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, room.w, room.h);
    ctx.restore();
    ctx.fillStyle = 'rgba(216,169,78,0.55)';
    ctx.font = '600 11px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(room.name, room.x + 10, room.y + 18);
  }
}

function drawWallsAndCover(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = '#08131b';
    ctx.fillRect(w.x, w.y + 3, w.w, w.h);
    ctx.fillStyle = '#42586a';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = GOLD;
    ctx.fillRect(w.x, w.y, w.w, 2);
  }
  for (const c of COVERS) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(c.x + 3, c.y + 4, c.w, c.h);
    if (c.kind === 'sofa') {
      ctx.fillStyle = '#6d2438';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#8a2f47';
      ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
    } else if (c.kind === 'planter') {
      ctx.fillStyle = '#7a5a2e';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#2e7d4f';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3fa065';
      ctx.beginPath(); ctx.arc(c.x + c.w / 2 - 6, c.y + c.h / 2 - 5, 8, 0, Math.PI * 2); ctx.fill();
    } else if (c.kind === 'statue') {
      ctx.fillStyle = '#5b6b78';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 10, 0, Math.PI * 2); ctx.fill();
    } else if (c.kind === 'crate') {
      ctx.fillStyle = '#8a6a34';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = '#5f4720';
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    } else if (c.kind === 'desk') {
      ctx.fillStyle = '#4a3220';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = GOLD;
      ctx.fillRect(c.x, c.y, c.w, 3);
    } else { // plinth
      ctx.fillStyle = '#31424f';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    }
  }
}

function drawLootItem(ctx, item, time) {
  if (item.taken) return;
  const { x, y } = item;
  const pulse = 0.75 + 0.25 * Math.sin(time * 3 + x);
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = GOLD_BRIGHT;
  ctx.shadowBlur = 10 * pulse;
  if (item.kind === 'painting') {
    ctx.fillStyle = '#5f4720';
    ctx.fillRect(-26, -18, 52, 36);
    ctx.fillStyle = item.id === 'harbour' ? '#c96f2e' : item.id === 'cartographer' ? '#7a9e43' : '#2e7d8a';
    ctx.fillRect(-21, -13, 42, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.arc(-6, -3, 5, 0, Math.PI * 2); ctx.fill();
  } else if (item.kind === 'opal') {
    ctx.fillStyle = '#ff7a3c';
    ctx.beginPath();
    ctx.moveTo(0, -17); ctx.lineTo(12, -5); ctx.lineTo(8, 14); ctx.lineTo(-8, 14); ctx.lineTo(-12, -5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(6, -3); ctx.lineTo(0, 8); ctx.lineTo(-6, -3); ctx.closePath(); ctx.fill();
  } else if (item.kind === 'gem' || item.kind === 'egg') {
    ctx.fillStyle = item.kind === 'gem' ? '#37d99a' : '#5aa2ff';
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(-3, -4, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
  } else if (item.kind === 'coins' || item.kind === 'ingots') {
    ctx.fillStyle = GOLD_BRIGHT;
    for (let i = 0; i < 3; i++) ctx.fillRect(-13 + i * 10, 2 - (i % 2) * 7, 9, 6);
    ctx.fillRect(-9, -12, 9, 6); ctx.fillRect(2, -12, 9, 6);
  } else if (item.kind === 'chalice') {
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.beginPath();
    ctx.moveTo(-9, -11); ctx.lineTo(9, -11); ctx.lineTo(4, 2); ctx.lineTo(-4, 2);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(-2, 2, 4, 7); ctx.fillRect(-8, 9, 16, 3);
  } else if (item.kind === 'necklace') {
    ctx.strokeStyle = '#f2f2f2';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, -2, 10, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 9, 3.4, 0, Math.PI * 2); ctx.fill();
  } else { // fan
    ctx.fillStyle = '#f0e6d2';
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.arc(0, 10, 15, -2.4, -0.7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b09a6a'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const a = -2.3 + i * 0.5;
      ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(Math.cos(a) * 15, 10 + Math.sin(a) * 15); ctx.stroke();
    }
  }
  ctx.restore();
  // Value tag: readable even on the shrunk contact sheet.
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(6,12,17,0.72)';
  const label = `$${item.value}`;
  const w = ctx.measureText(label).width + 8;
  ctx.fillRect(x - w / 2, y + 15, w, 14);
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.fillText(label, x, y + 26);
}

function drawExitAndPedestal(ctx, world) {
  // The opal's pedestal, brass on violet carpet.
  ctx.fillStyle = '#57406e';
  ctx.fillRect(OPAL_PEDESTAL.x, OPAL_PEDESTAL.y, OPAL_PEDESTAL.w, OPAL_PEDESTAL.h);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(OPAL_PEDESTAL.x + 3, OPAL_PEDESTAL.y + 3, OPAL_PEDESTAL.w - 6, OPAL_PEDESTAL.h - 6);
  // Getaway door in the foyer floor.
  ctx.fillStyle = world.hasOpal ? '#2e7d4f' : '#23343f';
  ctx.fillRect(EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.w, EXIT_ZONE.h);
  ctx.strokeStyle = world.hasOpal ? '#7ae7a0' : GOLD;
  ctx.strokeRect(EXIT_ZONE.x + 2, EXIT_ZONE.y + 2, EXIT_ZONE.w - 4, EXIT_ZONE.h - 4);
  ctx.fillStyle = '#e8f2f8';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(world.hasOpal ? 'GETAWAY — HOLD E' : 'GETAWAY VAN', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + 26);
}

function drawLasers(ctx, world) {
  for (const grid of LASER_GRIDS) {
    const phase = laserPhase(grid, world.time);
    // Emitters on both walls of the doorway.
    ctx.fillStyle = '#222';
    ctx.fillRect(grid.x - 14, grid.y1 - 8, 6, 8);
    ctx.fillRect(grid.x + 8, grid.y1 - 8, 6, 8);
    ctx.fillRect(grid.x - 14, grid.y2, 6, 8);
    ctx.fillRect(grid.x + 8, grid.y2, 6, 8);
    if (phase === 'off') continue;
    const alpha = phase === 'on' ? 0.95 : (Math.sin(world.time * 22) > 0 ? 0.4 : 0.08);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ff3b30';
    ctx.shadowColor = '#ff3b30';
    ctx.shadowBlur = 9;
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 3; i++) {
      const y = grid.y1 + ((grid.y2 - grid.y1) * i) / 2;
      ctx.beginPath(); ctx.moveTo(grid.x - 30, y); ctx.lineTo(grid.x + 30, y); ctx.stroke();
    }
    ctx.restore();
  }
}

function drawCameras(ctx, world) {
  for (const c of world.cameras) {
    const dark = c.disabledT > 0;
    drawCone(ctx, c.x, c.y, c.angle, 0.28, 216, dark ? 'rgba(120,130,140,0.10)' : c.seesNow ? 'rgba(255,70,60,0.20)' : 'rgba(110,220,255,0.13)');
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = '#101c26';
    ctx.fillRect(-7, -13, 14, 10);
    ctx.rotate(c.angle + Math.PI / 2);
    ctx.fillStyle = dark ? '#5a666f' : '#dfe9f0';
    ctx.fillRect(-5, -2, 10, 13);
    ctx.fillStyle = dark ? '#333' : '#ff3b30';
    ctx.beginPath(); ctx.arc(0, 9, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawGuards(ctx, world) {
  for (const g of world.guards) {
    drawCone(ctx, g.x, g.y, g.angle, 0.46, 196, g.seesNow ? 'rgba(255,80,60,0.22)' : 'rgba(255,190,80,0.15)');
  }
  for (const g of world.guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0, 5, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = g.state === 'chase' ? '#a02334' : '#7c2233';
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cap brim toward facing.
    ctx.rotate(g.angle);
    ctx.fillStyle = '#2b2f38';
    ctx.fillRect(2, -8, 12, 16);
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.fillRect(11, -8, 3, 16);
    ctx.restore();
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(232,242,248,0.85)';
    ctx.fillText(g.name.toUpperCase(), g.x, g.y - 20);
    if (g.spotGlow > 0.25) {
      ctx.font = '900 22px system-ui, sans-serif';
      ctx.fillStyle = '#ff5d5d';
      ctx.fillText('!', g.x, g.y - 30);
    }
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(0, 5, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#123c3a';
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = GOLD_BRIGHT;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.rotate(p.angle);
  // Hood point and the glint of a mask.
  ctx.fillStyle = '#0a2422';
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(2, -7); ctx.lineTo(2, 7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(4, -4, 5, 2.4); ctx.fillRect(4, 1.6, 5, 2.4);
  ctx.restore();
  if (p.sneaking) {
    ctx.strokeStyle = 'rgba(122,231,255,0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  if (p.grabId) {
    const item = world.loot.find((l) => l.id === p.grabId);
    if (item) {
      ctx.strokeStyle = GOLD_BRIGHT;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.grabT / item.grabTime));
      ctx.stroke();
    }
  }
}

function drawCoinAndNoise(ctx, world) {
  if (world.coin) {
    const c = world.coin;
    ctx.fillStyle = GOLD_BRIGHT;
    ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6a1e';
    ctx.stroke();
  }
  if (world.noise) {
    const n = world.noise;
    const r = 26 + 12 * Math.sin(world.time * 9);
    ctx.strokeStyle = 'rgba(255,215,106,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(n.x, n.y, Math.max(8, r), 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(n.x, n.y, Math.max(4, r * 0.55), 0, Math.PI * 2); ctx.stroke();
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, VIEW.width, VIEW.hudHeight);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, VIEW.hudHeight - 3, VIEW.width, 3);
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.font = '700 21px Georgia, serif';
  ctx.fillText('GILDED HOUR', 16, 28);
  ctx.fillStyle = 'rgba(232,242,248,0.75)';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('the Aurum Casino job', 16, 48);

  ctx.font = '700 19px system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(`LOOT $${world.bag.toLocaleString('en-US')}`, 210, 40);
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = world.hasOpal ? '#7ae7a0' : 'rgba(232,242,248,0.6)';
  ctx.fillText(world.hasOpal ? '◆ SUNFIRE OPAL IN THE BAG' : '◇ the Opal still sits in the VAULT', 420, 40);

  // The alarm meter: the one number that ends the night.
  const ax = 770, aw = 250;
  ctx.fillStyle = 'rgba(232,242,248,0.85)';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('ALARM', ax, 20);
  ctx.fillStyle = '#26333d';
  ctx.fillRect(ax, 26, aw, 16);
  const frac = world.alarm / 100;
  const grad = ctx.createLinearGradient(ax, 0, ax + aw, 0);
  grad.addColorStop(0, '#ffb03a');
  grad.addColorStop(0.65, '#ff7a3c');
  grad.addColorStop(1, '#ff3b30');
  ctx.fillStyle = grad;
  ctx.fillRect(ax, 26, aw * frac, 16);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax, 26, aw, 16);
  ctx.fillStyle = '#fff';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(`${Math.round(world.alarm)}%`, ax + aw + 8, 39);

  // Gadgets and the clock.
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillStyle = '#ffd76a';
  ctx.fillText(`● coins ×${world.gadgets.coins}`, 1080, 24);
  ctx.fillStyle = '#7ae7ff';
  ctx.fillText(`⚡ EMP ×${world.gadgets.emp}`, 1080, 46);
  const t = Math.max(0, world.time - world.startedAt);
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(Math.floor(t % 60)).padStart(2, '0');
  ctx.fillStyle = '#fff';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${mm}:${ss}`, 1270, 24);
  ctx.textAlign = 'left';
}

function panel(ctx, title, titleColor, lines) {
  ctx.fillStyle = 'rgba(5,10,15,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = 'rgba(10,22,32,0.92)';
  ctx.fillRect(340, 190, 600, 400);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(340, 190, 600, 400);
  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = '700 52px Georgia, serif';
  ctx.fillText(title, 640, 268);
  ctx.font = '15px system-ui, sans-serif';
  let y = 312;
  for (const line of lines) {
    ctx.fillStyle = line.color || 'rgba(232,242,248,0.92)';
    ctx.font = line.bold ? '700 17px system-ui, sans-serif' : '15px system-ui, sans-serif';
    ctx.fillText(line.text, 640, y);
    y += line.gap || 24;
  }
  ctx.textAlign = 'left';
}

function drawScreens(ctx, world) {
  if (world.mode === 'title') {
    panel(ctx, 'GILDED HOUR', GOLD_BRIGHT, [
      { text: 'One thief. One casino vault. One Sunfire Opal.', bold: true, gap: 34 },
      { text: 'Cross the foyer and gallery, slip the counting room, beat the laser' },
      { text: 'grid, lift the Opal — then get back to the van. Fill your bag on the way.', gap: 34 },
      { text: 'MOVE  WASD / arrows      SNEAK  Shift (slower, harder to spot)' },
      { text: 'GRAB & GETAWAY  hold E      TOSS COIN  click (lure a guard)' },
      { text: 'EMP PULSE  F or right-click (cameras dark 6s, +6 alarm)', gap: 34 },
      { text: 'Seen by a cone or a camera, the ALARM climbs. At 100% the night is over.' },
      { text: 'Lasers trip +35. A guard who grabs you at high alarm ends it too.', gap: 40 },
      { text: 'CLICK OR PRESS ENTER TO BEGIN', bold: true, color: GOLD_BRIGHT },
    ]);
  } else if (world.mode === 'won' || world.mode === 'caught') {
    const s = world.endStats;
    if (!s) return;
    const mm = String(Math.floor(s.time / 60)).padStart(2, '0');
    const ss = String(Math.floor(s.time % 60)).padStart(2, '0');
    if (world.mode === 'won') {
      panel(ctx, 'CLEAN GETAWAY', '#7ae7a0', [
        { text: s.title, bold: true, color: GOLD_BRIGHT, gap: 38 },
        { text: `Loot fenced:  $${s.loot.toLocaleString('en-US')}`, bold: true },
        { text: `Time inside:  ${mm}:${ss}` },
        { text: `Times spotted:  ${s.spotted}      Alarm peak:  ${s.peak}%`, gap: 40 },
        { text: 'The Sunfire Opal is already a legend. The casino denies everything.', gap: 40 },
        { text: 'CLICK OR PRESS ENTER TO PLAY AGAIN', bold: true, color: GOLD_BRIGHT },
      ]);
    } else {
      panel(ctx, 'CAUGHT', '#ff5d5d', [
        { text: s.note === 'alarm' ? 'The alarm hit 100% — lockdown. Every door sealed at once.' : 'A guard got a hand on you with the alarm already screaming.', bold: true, gap: 38 },
        { text: `Loot in the bag:  $${s.loot.toLocaleString('en-US')} (all of it evidence now)` },
        { text: `Time inside:  ${mm}:${ss}      Times spotted:  ${s.spotted}`, gap: 40 },
        { text: 'Read the cones before you move. The coins are not just money — throw one.', gap: 40 },
        { text: 'CLICK OR PRESS ENTER TO TRY AGAIN', bold: true, color: GOLD_BRIGHT },
      ]);
    }
  }
}

export function drawWorld(ctx, world) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawFloors(ctx);
  drawExitAndPedestal(ctx, world);
  for (const item of world.loot) drawLootItem(ctx, item, world.time);
  drawWallsAndCover(ctx);
  drawLasers(ctx, world);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawCoinAndNoise(ctx, world);
  if (world.mode !== 'title') drawPlayer(ctx, world);
  // Floaters last, above everything.
  ctx.textAlign = 'center';
  for (const f of world.floaters) {
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.globalAlpha = Math.max(0, 1 - f.t / 1.6);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  drawHud(ctx, world);
  drawScreens(ctx, world);
}
