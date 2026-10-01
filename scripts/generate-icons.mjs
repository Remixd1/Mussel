// Rasterizes the vector Mussel badge (src/components/icons/mussel-art.ts) into
// the PWA icon PNGs. No image dependencies: anti-aliased by 4x4 supersampling,
// encoded with a minimal PNG writer over node:zlib.
//
//   npm run icons
//
// Requires Node 22.18+ / 23.6+ (native TypeScript type stripping for the import below).

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MUSSEL_BADGE } from '../src/components/icons/mussel-art.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

// Mirrors the light theme in src/styles/tokens.css.
const INK = [0x15, 0x18, 0x1b];
const PAPER = [0xff, 0xff, 0xff];
const SAMPLES = 4;

function insidePolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function bounds(pts) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

const shellBox = bounds(MUSSEL_BADGE.shell);
const cutouts = MUSSEL_BADGE.cutouts.map((pts) => ({ pts, box: bounds(pts) }));
const inBox = (x, y, b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;

/** Is badge point (x, y) in a 100x100 box inked? */
function inked(x, y, withRing) {
  const { ring } = MUSSEL_BADGE;
  if (withRing && Math.abs(Math.hypot(x - ring.cx, y - ring.cy) - ring.r) <= ring.width / 2) {
    return true;
  }
  if (!inBox(x, y, shellBox) || !insidePolygon(x, y, MUSSEL_BADGE.shell)) return false;
  return !cutouts.some((c) => inBox(x, y, c.box) && insidePolygon(x, y, c.pts));
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = size * 4;
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * @param size        output edge in px
 * @param badgeScale  badge diameter as a fraction of the icon edge
 * @param opts.bg     paper background (true) or transparent (false)
 * @param opts.ring   draw the badge ring
 */
function render(size, badgeScale, { bg = true, ring = true } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const badgePx = size * badgeScale;
  const offset = (size - badgePx) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const bx = ((x + (sx + 0.5) / SAMPLES - offset) / badgePx) * 100;
          const by = ((y + (sy + 0.5) / SAMPLES - offset) / badgePx) * 100;
          if (inked(bx, by, ring)) hits++;
        }
      }
      const a = hits / (SAMPLES * SAMPLES);
      const i = (y * size + x) * 4;
      if (bg) {
        for (let c = 0; c < 3; c++) px[i + c] = Math.round(PAPER[c] * (1 - a) + INK[c] * a);
        px[i + 3] = 255;
      } else {
        for (let c = 0; c < 3; c++) px[i + c] = INK[c];
        px[i + 3] = Math.round(a * 255);
      }
    }
  }
  return encodePng(size, px);
}

const outputs = [
  ['icon-192.png', render(192, 0.86)],
  ['icon-512.png', render(512, 0.86)],
  // iOS ignores transparency and rounds its own corners; keep it opaque.
  ['apple-touch-icon.png', render(180, 0.8)],
  // Maskable: badge stays inside the 80% safe-zone circle.
  ['icon-512-maskable.png', render(512, 0.62)],
  ['favicon.png', render(64, 1, { bg: false })],
];

mkdirSync(publicDir, { recursive: true });
for (const [name, buf] of outputs) {
  writeFileSync(join(publicDir, name), buf);
  console.log(`wrote public/${name} (${buf.length} bytes)`);
}
