// GILDED HOUR — level layout for the Aurum Casino vault house.
// One floor, three wings, drawn and simulated on a single 1280x800 screen so a
// single frame can show the whole job: the foyer the thief slips in through,
// the gallery with its paintings, the counting room, and the vault chamber
// where the Sunfire Opal waits behind a laser grid.

export const VIEW = { width: 1280, height: 800, hudHeight: 64 };

// Walls are solid rectangles. Door gaps are simply where no wall is drawn.
export const WALLS = [
  // Outer shell
  { x: 0, y: 64, w: 1280, h: 16 },
  { x: 0, y: 784, w: 1280, h: 16 },
  { x: 0, y: 64, w: 16, h: 736 },
  { x: 1264, y: 64, w: 16, h: 736 },
  // Divider A: foyer | gallery, door at y 404..476
  { x: 336, y: 64, w: 16, h: 340 },
  { x: 336, y: 476, w: 16, h: 324 },
  // Divider B: gallery | counting room, door at y 404..476
  { x: 848, y: 64, w: 16, h: 340 },
  { x: 848, y: 476, w: 16, h: 324 },
  // Divider C: counting room | vault chamber, door at y 388..460
  { x: 1008, y: 64, w: 16, h: 324 },
  { x: 1008, y: 460, w: 16, h: 340 },
  // Gallery shelf walls: they split the gallery into two routes, high and low
  { x: 560, y: 240, w: 176, h: 16 },
  { x: 640, y: 560, w: 150, h: 16 },
];

// Cover blocks sight and movement: sofas, planters, plinths, desks, crates.
export const COVERS = [
  { x: 190, y: 560, w: 120, h: 36, kind: 'sofa' },
  { x: 240, y: 180, w: 44, h: 44, kind: 'planter' },
  { x: 440, y: 300, w: 52, h: 52, kind: 'plinth' },
  { x: 440, y: 520, w: 52, h: 52, kind: 'plinth' },
  { x: 640, y: 404, w: 44, h: 44, kind: 'statue' },
  { x: 736, y: 300, w: 52, h: 52, kind: 'plinth' },
  { x: 736, y: 520, w: 52, h: 52, kind: 'plinth' },
  { x: 896, y: 600, w: 52, h: 52, kind: 'crate' },
  { x: 1080, y: 240, w: 72, h: 36, kind: 'desk' },
  { x: 1080, y: 560, w: 72, h: 36, kind: 'desk' },
];

// Rooms, for floor tinting and the little brass name plates.
export const ROOMS = [
  { x: 16, y: 80, w: 320, h: 704, name: 'FOYER', tone: '#1d3a4a' },
  { x: 352, y: 80, w: 496, h: 704, name: 'GALLERY', tone: '#274b5c' },
  { x: 864, y: 80, w: 144, h: 704, name: 'COUNTING ROOM', tone: '#1d3a4a' },
  { x: 1024, y: 80, w: 240, h: 704, name: 'VAULT', tone: '#3a2c46' },
];

// Everything worth stealing. `opal: true` marks the objective: no getaway
// without it. `grabTime` is how long the thief must stand and work at it.
export const LOOT = [
  { id: 'necklace', name: 'Pearl Necklace', value: 400, x: 84, y: 150, kind: 'necklace', grabTime: 0.4 },
  { id: 'chalice', name: 'Golden Chalice', value: 650, x: 268, y: 692, kind: 'chalice', grabTime: 0.4 },
  { id: 'lady', name: '“Lady in Teal”', value: 500, x: 470, y: 116, kind: 'painting', grabTime: 0.5 },
  { id: 'harbour', name: '“Harbour Dusk”', value: 750, x: 700, y: 116, kind: 'painting', grabTime: 0.5 },
  { id: 'cartographer', name: '“The Cartographer”', value: 900, x: 606, y: 700, kind: 'painting', grabTime: 0.5 },
  { id: 'emerald', name: 'Teardrop Emerald', value: 600, x: 466, y: 326, kind: 'gem', grabTime: 0.6 },
  { id: 'fan', name: 'Ivory Fan', value: 350, x: 762, y: 326, kind: 'fan', grabTime: 0.4 },
  { id: 'coins', name: 'Stacks of House Coins', value: 300, x: 922, y: 626, kind: 'coins', grabTime: 0.5 },
  { id: 'ingots', name: 'Gold Ingots', value: 800, x: 1116, y: 578, kind: 'ingots', grabTime: 0.7 },
  { id: 'egg', name: 'Sapphire Egg', value: 550, x: 1116, y: 258, kind: 'egg', grabTime: 0.6 },
  { id: 'opal', name: 'THE SUNFIRE OPAL', value: 2000, x: 1136, y: 424, kind: 'opal', grabTime: 1.2, opal: true },
];

// Guard patrols: waypoint loops, walked in order, with a short pause and a
// look-around at each stop. Routes cross doorways on purpose.
export const PATROLS = [
  { name: 'Vex', waypoints: [[420, 180], [800, 180], [800, 660], [420, 660]], speed: 62 },
  { name: 'Maro', waypoints: [[150, 700], [150, 440], [600, 440], [600, 700]], speed: 58 },
  { name: 'Ilsa', waypoints: [[936, 160], [936, 424], [1150, 424], [1150, 180], [1150, 424], [936, 424], [936, 690]], speed: 66 },
];

// Wall cameras: fixed mounts, sweeping between two angles (degrees, 0 = east,
// positive clockwise because the y axis points down).
export const CAMERAS = [
  { name: 'Cam A', x: 322, y: 96, from: 95, to: 175, period: 7 },
  { name: 'Cam B', x: 608, y: 96, from: 55, to: 125, period: 9 },
  { name: 'Cam C', x: 1250, y: 96, from: 185, to: 265, period: 8 },
];

// Laser grids. Each cycles on -> warning blink -> off on its own period; the
// doorway grid and the opal's own grid run out of phase.
export const LASER_GRIDS = [
  { id: 'door', x: 1016, y1: 396, y2: 452, period: 4.6, offset: 0 },
  { id: 'opal', x: 1092, y1: 388, y2: 460, period: 5.8, offset: 2.4 },
];

export const PLAYER_START = { x: 180, y: 706 };
export const EXIT_ZONE = { x: 108, y: 742, w: 144, h: 42 };
export const OPAL_PEDESTAL = { x: 1104, y: 392, w: 64, h: 64 };
