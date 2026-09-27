/**
 * Pixel data for every pictogram and UI glyph. Original artwork for the
 * Bivalve Kinetics Laboratory, drawn on integer grids per CLAUDE.md §3.5:
 *   - pictograms: 24x24 grid, 4x4 head, 2px limbs, 45/90 degree joints
 *   - UI glyphs: 16x16 grid, no tile
 *
 * Kept dependency-free (no imports) so Node scripts and tests can read it too.
 */

/** Ink is the default tone; `signal` is the single accent; `surface` punches holes. */
export type Tone = 'ink' | 'signal' | 'surface';

/** One filled rectangle of pixels: x, y, width, height, optional tone. */
export type Px = readonly [x: number, y: number, w: number, h: number, tone?: Tone];

export interface PixelArt {
  grid: number;
  px: readonly Px[];
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

/** A 2px-thick 45 degree line: `n` 2x2 blocks stepping by (dx, dy). */
function diag(x: number, y: number, n: number, dx: 1 | -1, dy: 1 | -1, tone?: Tone): Px[] {
  return Array.from({ length: n }, (_, i): Px => [x + i * dx, y + i * dy, 2, 2, tone]);
}

/** Up arrow: 3-step head with its tip at (x, y), then a 2px shaft of `len`. */
function arrowUp(x: number, y: number, len: number): Px[] {
  return [
    [x, y, 2, 1],
    [x - 1, y + 1, 4, 1],
    [x - 2, y + 2, 6, 1],
    [x, y + 3, 2, len],
  ];
}

/** Down arrow: 2px shaft of `len` from (x, y), then a 3-step head. */
function arrowDown(x: number, y: number, len: number): Px[] {
  return [
    [x, y, 2, len],
    [x - 2, y + len, 6, 1],
    [x - 1, y + len + 1, 4, 1],
    [x, y + len + 2, 2, 1],
  ];
}

/** Left arrow: 3-step head with its tip at (x, y), then a 2px shaft of `len`. */
function arrowLeft(x: number, y: number, len: number): Px[] {
  return [
    [x, y, 1, 2],
    [x + 1, y - 1, 1, 4],
    [x + 2, y - 2, 1, 6],
    [x + 3, y, len, 2],
  ];
}

/** Vertical double arrow (up + down heads) around a 2px shaft of `len`. */
function arrowUpDown(x: number, y: number, len: number): Px[] {
  const bottom = y + 3 + len;
  return [
    ...arrowUp(x, y, len),
    [x - 2, bottom, 6, 1],
    [x - 1, bottom + 1, 4, 1],
    [x, bottom + 2, 2, 1],
  ];
}

/** Chunky 8x8 wheel with a hub, top-left corner at (x, y). */
function wheel(x: number, y: number): Px[] {
  return [
    [x + 2, y, 4, 2],
    [x + 2, y + 6, 4, 2],
    [x, y + 2, 2, 4],
    [x + 6, y + 2, 2, 4],
    [x + 3, y + 3, 2, 2],
  ];
}

// ---------------------------------------------------------------------------
// Pictograms (24x24)
// ---------------------------------------------------------------------------

export const PICTOGRAM_IDS = [
  'squat',
  'bench',
  'deadlift',
  'ohp',
  'pullup',
  'row',
  'curl',
  'pushup',
  'lunge',
  'plank',
  'run',
  'cycle',
  'core',
  'stretch',
  'machine',
  'rest',
  'pr',
  'form-warning',
  'bodyweight',
] as const;

export type PictogramId = (typeof PICTOGRAM_IDS)[number];

const P = 24;

export const PICTOGRAMS: Record<PictogramId, PixelArt> = {
  // Deep squat, bar across the shoulders, down arrow beside.
  squat: {
    grid: P,
    px: [
      [8, 1, 4, 4], // head
      [9, 5, 2, 1], // neck
      [1, 6, 16, 2], // bar
      [2, 4, 2, 6], // plate
      [14, 4, 2, 6], // plate
      [8, 8, 2, 3], // torso, leaning back
      [7, 10, 2, 3],
      [6, 12, 2, 2],
      [6, 14, 8, 2], // thigh, parallel
      [12, 16, 2, 4], // shin
      [12, 20, 4, 2], // foot
      ...arrowDown(20, 5, 10),
    ],
  },

  // Lying on a flat bench, bar above the chest, up arrow.
  bench: {
    grid: P,
    px: [
      [1, 11, 4, 4], // head
      [5, 13, 9, 2], // torso
      [13, 13, 6, 2], // thigh
      [17, 15, 2, 5], // shin
      [17, 20, 4, 2], // foot
      [7, 7, 2, 6], // arm, locked out
      [1, 5, 14, 2], // bar
      [2, 3, 2, 6], // plate
      [12, 3, 2, 6], // plate
      [1, 15, 16, 2], // bench pad
      [3, 17, 2, 5], // bench leg
      [13, 17, 2, 5], // bench leg
      ...arrowUp(20, 2, 8),
    ],
  },

  // Hinged at the hips, bar at the shins, up arrow.
  deadlift: {
    grid: P,
    px: [
      [14, 2, 4, 4], // head
      ...diag(13, 6, 6, -1, 1), // torso
      ...diag(8, 12, 3, 1, 1), // thigh
      [10, 15, 2, 5], // shin
      [10, 20, 4, 2], // foot
      [13, 8, 2, 8], // arm
      [1, 16, 18, 2], // bar
      [2, 13, 2, 8], // plate
      [16, 13, 2, 8], // plate
      ...arrowUp(20, 2, 9),
    ],
  },

  // Standing, bar locked out overhead, up arrow.
  ohp: {
    grid: P,
    px: [
      [0, 1, 20, 2], // bar
      [1, 0, 2, 5], // plate
      [17, 0, 2, 5], // plate
      [4, 3, 2, 7], // arm
      [14, 3, 2, 7], // arm
      [4, 9, 12, 2], // shoulders
      [8, 4, 4, 4], // head
      [9, 8, 2, 1], // neck
      [9, 11, 2, 5], // torso
      [7, 15, 6, 2], // hips
      [7, 17, 2, 5], // leg
      [11, 17, 2, 5], // leg
      ...arrowUp(20, 9, 9),
    ],
  },

  // Hanging from a bar, up arrow.
  pullup: {
    grid: P,
    px: [
      [1, 2, 18, 2], // bar
      [4, 4, 2, 7], // arm
      [14, 4, 2, 7], // arm
      [8, 5, 4, 4], // head
      [9, 9, 2, 1], // neck
      [4, 10, 12, 2], // shoulders
      [9, 12, 2, 5], // torso
      [7, 16, 6, 1], // hips
      [7, 17, 2, 5], // leg
      [11, 17, 2, 5], // leg
      ...arrowUp(20, 6, 10),
    ],
  },

  // Seated pull toward the torso, horizontal arrow.
  row: {
    grid: P,
    px: [
      [3, 2, 4, 4], // head
      [4, 6, 2, 1], // neck
      [4, 7, 2, 8], // torso
      [2, 15, 8, 2], // seat
      [5, 17, 2, 5], // seat post
      [6, 13, 10, 2], // legs
      [16, 10, 2, 7], // foot plate
      [6, 8, 5, 2], // arms
      [11, 7, 2, 4], // handle
      [13, 8, 8, 1], // cable
      [21, 2, 2, 20], // stack
      ...arrowLeft(9, 19, 8),
    ],
  },

  // Dumbbell curl, forearm raised, curved arrow.
  curl: {
    grid: P,
    px: [
      [4, 1, 4, 4], // head
      [5, 5, 2, 9], // torso
      [7, 6, 3, 2], // shoulder
      [8, 8, 2, 4], // upper arm
      ...diag(9, 10, 4, 1, -1), // forearm, curled up
      [11, 3, 2, 4], // dumbbell plate
      [16, 3, 2, 4], // dumbbell plate
      [13, 4, 3, 2], // dumbbell handle
      [5, 14, 2, 6], // leg
      [5, 20, 4, 2], // foot
      // curved arrow sweeping up
      [12, 18, 4, 2],
      [16, 17, 2, 2],
      [17, 15, 2, 2],
      [18, 12, 2, 3],
      [17, 11, 4, 1],
      [18, 10, 2, 1],
    ],
  },

  // Push-up plank on hands, up/down double arrow.
  pushup: {
    grid: P,
    px: [
      [1, 19, 3, 2], // body line, toes to shoulders
      [3, 18, 3, 2],
      [5, 17, 3, 2],
      [7, 16, 3, 2],
      [9, 15, 3, 2],
      [11, 14, 3, 2],
      [13, 13, 3, 2],
      [16, 10, 4, 4], // head
      [14, 15, 2, 6], // arm
      [14, 21, 4, 1], // hand
      ...arrowUpDown(5, 2, 5),
    ],
  },

  // Split stance, back knee low.
  lunge: {
    grid: P,
    px: [
      [9, 1, 4, 4], // head
      [10, 5, 2, 8], // torso
      [12, 6, 2, 5], // arm
      [11, 12, 6, 2], // front thigh
      [15, 14, 2, 6], // front shin
      [15, 20, 4, 2], // front foot
      ...diag(9, 13, 5, -1, 1), // back thigh
      [1, 19, 5, 2], // back shin
      [1, 17, 2, 2], // back toes
    ],
  },

  // Forearm plank, tick marks above for time.
  plank: {
    grid: P,
    px: [
      [1, 19, 3, 2], // body line
      [3, 18, 3, 2],
      [5, 17, 3, 2],
      [7, 16, 3, 2],
      [9, 15, 3, 2],
      [11, 14, 4, 2],
      [15, 11, 4, 4], // head
      [13, 16, 2, 3], // upper arm
      [13, 19, 6, 2], // forearm
      // time ticks
      [3, 7, 18, 1],
      [3, 5, 1, 2],
      [7, 4, 1, 3],
      [11, 5, 1, 2],
      [15, 4, 1, 3],
      [19, 5, 1, 2],
    ],
  },

  // Mid-stride with speed lines behind.
  run: {
    grid: P,
    px: [
      [13, 1, 4, 4], // head
      [12, 5, 2, 3], // torso
      [11, 8, 2, 4],
      ...diag(13, 6, 3, 1, 1), // front upper arm
      ...diag(16, 7, 2, 1, -1), // front forearm
      ...diag(11, 7, 3, -1, 1), // back upper arm
      ...diag(8, 10, 2, -1, 1), // back forearm
      [12, 12, 5, 2], // front thigh, raised
      [15, 14, 2, 5], // front shin
      [15, 19, 3, 1], // front foot
      ...diag(10, 13, 5, -1, 1), // back leg
      [3, 18, 4, 2],
      // speed lines
      [0, 3, 2, 1],
      [3, 3, 3, 1],
      [1, 6, 4, 1],
      [0, 9, 2, 1],
      [3, 9, 2, 1],
    ],
  },

  // Riding a blocky bike, speed lines.
  cycle: {
    grid: P,
    px: [
      ...wheel(1, 14),
      ...wheel(15, 14),
      [6, 17, 6, 2], // chainstay
      [9, 11, 2, 7], // seat tube
      [9, 11, 8, 2], // top tube
      ...diag(11, 16, 5, 1, -1), // down tube
      [17, 9, 2, 8], // fork
      [15, 8, 5, 2], // handlebar
      [6, 9, 5, 2], // seat
      [13, 1, 4, 4], // head
      ...diag(8, 7, 4, 1, -1), // torso
      ...diag(12, 5, 4, 1, 1), // arm
      [10, 7, 3, 2], // thigh
      [12, 7, 2, 5], // shin
      // speed lines
      [0, 3, 3, 1],
      [1, 5, 4, 1],
      [0, 7, 3, 1],
    ],
  },

  // Crunch, curved arrow at the torso.
  core: {
    grid: P,
    px: [
      [2, 11, 4, 4], // head
      ...diag(7, 17, 3, -1, -1), // upper torso, curled up
      [8, 18, 6, 2], // lower torso
      ...diag(13, 17, 4, 1, -1), // thigh
      [17, 15, 2, 3], // shin
      [17, 18, 4, 2], // foot
      [7, 14, 5, 2], // arms reaching
      // curl arrow over the torso
      [7, 7, 5, 2],
      [12, 9, 2, 2],
      [4, 7, 1, 2],
      [5, 6, 1, 4],
      [6, 5, 1, 6],
    ],
  },

  // Forward fold reaching to the toes.
  stretch: {
    grid: P,
    px: [
      [7, 9, 2, 11], // leg
      [7, 20, 6, 2], // foot
      ...diag(8, 8, 5, 1, 1), // torso folded forward
      [14, 13, 4, 4], // head
      [11, 14, 2, 6], // arm to toes
      ...arrowDown(20, 3, 8),
    ],
  },

  // Seated at a cable stack.
  machine: {
    grid: P,
    px: [
      [10, 1, 13, 2], // top beam
      [21, 3, 2, 19], // upright
      [16, 12, 4, 2], // weight plates
      [16, 15, 4, 2],
      [16, 18, 4, 2],
      [18, 3, 1, 9], // stack cable
      [11, 3, 1, 3], // pull cable
      [8, 6, 6, 2], // handle
      [4, 3, 4, 4], // head
      [5, 7, 2, 8], // torso
      ...diag(7, 9, 3, 1, -1), // arm
      [2, 15, 8, 2], // seat
      [5, 17, 2, 5], // seat post
      [7, 13, 6, 2], // thigh
      [11, 15, 2, 5], // shin
      [11, 20, 4, 2], // foot
    ],
  },

  // Seated, hourglass beside.
  rest: {
    grid: P,
    px: [
      [3, 2, 4, 4], // head
      [4, 6, 2, 1], // neck
      [4, 7, 2, 8], // torso
      ...diag(6, 8, 4, 1, 1), // arm resting on knee
      [6, 13, 6, 2], // thigh
      [10, 15, 2, 5], // shin
      [10, 20, 4, 2], // foot
      [1, 15, 8, 2], // stool
      [2, 17, 2, 5],
      [6, 17, 2, 5],
      // hourglass
      [15, 6, 8, 2],
      [15, 20, 8, 2],
      [16, 8, 1, 4],
      [21, 8, 1, 4],
      [17, 12, 1, 1],
      [20, 12, 1, 1],
      [18, 13, 2, 2],
      [17, 15, 1, 1],
      [20, 15, 1, 1],
      [16, 16, 1, 4],
      [21, 16, 1, 4],
      [17, 10, 4, 1], // sand, top
      [18, 11, 2, 1],
      [18, 17, 2, 1], // sand, bottom
      [17, 18, 4, 2],
    ],
  },

  // Both arms raised, signal burst around.
  pr: {
    grid: P,
    px: [
      [10, 5, 4, 4], // head
      [9, 9, 6, 2], // shoulders
      ...diag(8, 8, 4, -1, -1), // arm
      ...diag(14, 8, 4, 1, -1), // arm
      [11, 11, 2, 5], // torso
      [9, 15, 6, 2], // hips
      [9, 17, 2, 5], // leg
      [13, 17, 2, 5], // leg
      // burst
      [11, 0, 2, 3, 'signal'],
      [2, 2, 2, 2, 'signal'],
      [20, 2, 2, 2, 'signal'],
      [0, 10, 3, 2, 'signal'],
      [21, 10, 3, 2, 'signal'],
      [3, 17, 2, 2, 'signal'],
      [19, 17, 2, 2, 'signal'],
    ],
  },

  // Rounded spine, signal warning triangle.
  'form-warning': {
    grid: P,
    px: [
      [5, 13, 2, 7], // leg
      [5, 20, 4, 2], // foot
      [5, 10, 2, 3], // spine, rounding over
      [6, 8, 2, 2],
      [8, 7, 3, 2],
      [11, 8, 2, 2],
      [13, 10, 4, 4], // head, drooping
      [10, 10, 2, 6], // arm
      // warning triangle
      [18, 1, 2, 1, 'signal'],
      [18, 2, 2, 1, 'signal'],
      [17, 3, 4, 1, 'signal'],
      [17, 4, 4, 1, 'signal'],
      [16, 5, 6, 1, 'signal'],
      [16, 6, 6, 1, 'signal'],
      [15, 7, 8, 1, 'signal'],
      [15, 8, 8, 1, 'signal'],
      [18, 3, 2, 3], // exclamation
      [18, 7, 2, 1],
    ],
  },

  // Bathroom scale with a small figure on it.
  bodyweight: {
    grid: P,
    px: [
      [10, 1, 4, 4], // head
      [8, 5, 8, 2], // shoulders
      [8, 7, 2, 4], // arm
      [14, 7, 2, 4], // arm
      [11, 7, 2, 4], // torso
      [9, 11, 6, 1], // hips
      [9, 12, 2, 4], // leg
      [13, 12, 2, 4], // leg
      [2, 16, 20, 6], // scale body
      [8, 17, 8, 2, 'surface'], // display window
      [11, 17, 2, 2], // needle
    ],
  },
};

// ---------------------------------------------------------------------------
// UI glyphs (16x16, no tile)
// ---------------------------------------------------------------------------

export const GLYPH_IDS = [
  'add',
  'delete',
  'edit',
  'history',
  'chart',
  'settings',
  'check',
  'timer',
  'back',
] as const;

export type GlyphId = (typeof GLYPH_IDS)[number];

const G = 16;

export const GLYPHS: Record<GlyphId, PixelArt> = {
  add: {
    grid: G,
    px: [
      [7, 2, 2, 12],
      [2, 7, 12, 2],
    ],
  },
  delete: {
    grid: G,
    px: [
      [6, 1, 4, 2], // handle
      [2, 3, 12, 2], // lid
      [3, 6, 2, 9], // can
      [11, 6, 2, 9],
      [3, 13, 10, 2],
      [7, 7, 2, 5], // slat
    ],
  },
  edit: {
    grid: G,
    px: [
      ...diag(4, 10, 9, 1, -1),
      ...diag(5, 11, 9, 1, -1),
      [2, 13, 2, 2], // tip
      [1, 15, 2, 1],
    ],
  },
  history: {
    grid: G,
    px: [
      [5, 1, 6, 2],
      [11, 3, 2, 2],
      [13, 5, 2, 6],
      [11, 11, 2, 2],
      [5, 13, 6, 2],
      [3, 11, 2, 2],
      [1, 5, 2, 6],
      [0, 3, 4, 1], // counter-clockwise arrowhead
      [1, 4, 2, 1],
      [7, 4, 2, 5], // hands
      [9, 7, 2, 2],
    ],
  },
  chart: {
    grid: G,
    px: [
      [1, 1, 2, 14], // y axis
      [1, 13, 14, 2], // x axis
      [5, 8, 2, 5],
      [8, 4, 2, 9],
      [11, 9, 2, 4],
    ],
  },
  settings: {
    grid: G,
    px: [
      [4, 4, 8, 8], // gear body
      [6, 6, 4, 4, 'surface'], // hole
      [7, 1, 2, 3], // teeth
      [7, 12, 2, 3],
      [1, 7, 3, 2],
      [12, 7, 3, 2],
      [2, 2, 2, 2],
      [12, 2, 2, 2],
      [2, 12, 2, 2],
      [12, 12, 2, 2],
    ],
  },
  check: {
    grid: G,
    px: [...diag(1, 7, 4, 1, 1), ...diag(5, 9, 9, 1, -1)],
  },
  timer: {
    grid: G,
    px: [
      [6, 0, 4, 2], // crown
      [7, 2, 2, 1],
      [5, 3, 6, 2], // ring
      [3, 4, 2, 2],
      [11, 4, 2, 2],
      [2, 6, 2, 5],
      [12, 6, 2, 5],
      [3, 11, 2, 2],
      [11, 11, 2, 2],
      [5, 13, 6, 2],
      [7, 6, 2, 4], // hand
    ],
  },
  back: {
    grid: G,
    px: [
      [2, 7, 12, 2], // shaft
      ...diag(3, 6, 4, 1, -1),
      ...diag(3, 8, 4, 1, 1),
    ],
  },
};
