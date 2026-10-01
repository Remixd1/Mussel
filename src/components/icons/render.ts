/**
 * Converts vector art into plain SVG element descriptions. Shared by the React
 * icon component and Node scripts (preview, tests), so it has no imports
 * beyond the art types.
 */
import type { Shape, Tone, VectorArt } from './art';

export interface SvgElement {
  tag: 'circle' | 'rect' | 'path' | 'polyline' | 'polygon';
  attrs: Record<string, string | number>;
}

export const TONE_COLOR: Record<Tone, string> = {
  ink: 'var(--ink)',
  signal: 'var(--signal)',
  surface: 'var(--surface)',
};

const round = (n: number) => Math.round(n * 100) / 100;

/** Triangle with its tip at (x,y), pointing along `angle` degrees. */
function arrowheadPoints(x: number, y: number, angle: number, size: number): string {
  const a = (angle * Math.PI) / 180;
  const back = { x: x - size * Math.cos(a), y: y - size * Math.sin(a) };
  const half = size * 0.55;
  const px = -Math.sin(a) * half;
  const py = Math.cos(a) * half;
  return [
    [x, y],
    [back.x + px, back.y + py],
    [back.x - px, back.y - py],
  ]
    .map(([u, v]) => `${round(u)},${round(v)}`)
    .join(' ');
}

function shapeElements(shape: Shape, art: VectorArt, color: (t: Tone) => string): SvgElement[] {
  const fill = color(shape.tone ?? 'ink');
  const headSize = art.grid * 0.15;
  const stroke = (w: number | undefined) => ({
    fill: 'none',
    stroke: fill,
    'stroke-width': w ?? art.stroke,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });

  if ('c' in shape) {
    const [cx, cy, r] = shape.c;
    return [{ tag: 'circle', attrs: { cx, cy, r, fill } }];
  }
  if ('ring' in shape) {
    const [cx, cy, r] = shape.ring;
    return [{ tag: 'circle', attrs: { cx, cy, r, ...stroke(shape.w) } }];
  }
  if ('l' in shape) {
    const points = [];
    for (let i = 0; i < shape.l.length; i += 2) points.push(`${shape.l[i]},${shape.l[i + 1]}`);
    return [{ tag: 'polyline', attrs: { points: points.join(' '), ...stroke(shape.w) } }];
  }
  if ('r' in shape) {
    const [x, y, width, height, rx = 0] = shape.r;
    return [{ tag: 'rect', attrs: { x, y, width, height, rx, fill } }];
  }
  if ('p' in shape) {
    return [
      {
        tag: 'path',
        attrs: shape.w === undefined ? { d: shape.p, fill } : { d: shape.p, ...stroke(shape.w) },
      },
    ];
  }
  if ('arrow' in shape) {
    const [x1, y1, x2, y2] = shape.arrow;
    const w = shape.w ?? art.stroke * 0.7;
    const size = Math.max(headSize, w * 2.4);
    const len = Math.hypot(x2 - x1, y2 - y1);
    // Stop the shaft inside the head so the round cap doesn't poke out.
    const t = (len - size * 0.6) / len;
    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    return [
      {
        tag: 'polyline',
        attrs: {
          points: `${x1},${y1} ${round(x1 + (x2 - x1) * t)},${round(y1 + (y2 - y1) * t)}`,
          ...stroke(w),
        },
      },
      { tag: 'polygon', attrs: { points: arrowheadPoints(x2, y2, angle, size), fill } },
    ];
  }
  const [x, y, angle] = shape.head;
  return [
    {
      tag: 'polygon',
      attrs: { points: arrowheadPoints(x, y, angle, shape.size ?? headSize), fill },
    },
  ];
}

export function artToElements(
  art: VectorArt,
  color: (tone: Tone) => string = (t) => TONE_COLOR[t],
): SvgElement[] {
  return art.shapes.flatMap((s) => shapeElements(s, art, color));
}

/** Standalone SVG markup (for previews and scripts). */
export function artToSvg(art: VectorArt, size: number, color?: (tone: Tone) => string): string {
  const body = artToElements(art, color)
    .map(({ tag, attrs }) => {
      const a = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${tag} ${a}/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${art.grid} ${art.grid}">${body}</svg>`;
}
