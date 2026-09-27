// Renders the 32x32 mussel mascot into the PWA icon PNGs with nearest-neighbor
// scaling. No image dependencies: a minimal PNG encoder over node:zlib.
//
//   npm run icons
//
// Requires Node 22.18+ / 23.6+ (native TypeScript type stripping for the import below).

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MUSSEL_MAP, MUSSEL_PALETTE } from '../src/components/icons/mussel-art.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

const PEARL = '#EEF0E6';
const INK = '#14161A';

function hexToRgba(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * @param size   output edge in px
 * @param scale  integer multiplier for each mascot pixel
 * @param opts.bg      background hex, or null for transparent
 * @param opts.border  border width in px (ink), 0 for none
 */
function render(size, scale, { bg = PEARL, border = 0 } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const put = (x, y, rgba) => {
    const i = (y * size + x) * 4;
    px[i] = rgba[0];
    px[i + 1] = rgba[1];
    px[i + 2] = rgba[2];
    px[i + 3] = rgba[3];
  };
  if (bg) {
    const c = hexToRgba(bg);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) put(x, y, c);
  }
  if (border) {
    const c = hexToRgba(INK);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        if (x < border || y < border || x >= size - border || y >= size - border) put(x, y, c);
  }
  const art = 32 * scale;
  const off = Math.floor((size - art) / 2);
  MUSSEL_MAP.forEach((row, my) => {
    [...row].forEach((ch, mx) => {
      const hex = MUSSEL_PALETTE[ch];
      if (!hex) return;
      const c = hexToRgba(hex);
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) put(off + mx * scale + dx, off + my * scale + dy, c);
    });
  });
  return encodePng(size, px);
}

const outputs = [
  // "any" icons: pearl tile with an ink border, echoing the PictoTile look.
  ['icon-192.png', render(192, 5, { border: 8 })],
  ['icon-512.png', render(512, 14, { border: 20 })],
  // iOS ignores transparency and crops its own corners; keep it opaque, no border.
  ['apple-touch-icon.png', render(180, 5)],
  // Maskable: art stays inside the 80% safe zone, full-bleed background.
  ['icon-512-maskable.png', render(512, 10)],
  ['favicon.png', render(64, 2, { bg: null })],
];

mkdirSync(publicDir, { recursive: true });
for (const [name, buf] of outputs) {
  writeFileSync(join(publicDir, name), buf);
  console.log(`wrote public/${name} (${buf.length} bytes)`);
}
