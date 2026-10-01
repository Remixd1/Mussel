import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GLYPHS, PICTOGRAMS, type Shape, type VectorArt } from '../../src/components/icons/art';
import { MUSSEL_BADGE } from '../../src/components/icons/mussel-art';
import { artToElements } from '../../src/components/icons/render';
import {
  GLYPH_IDS,
  GLYPH_REGISTRY,
  MusselLogo,
  PICTOGRAM_IDS,
  PICTOGRAM_REGISTRY,
} from '../../src/components/icons';
import { PictoTile } from '../../src/components/ui/PictoTile';

/** Every coordinate a shape places on the canvas. */
function coords(shape: Shape): number[] {
  if ('c' in shape) return [shape.c[0], shape.c[1]];
  if ('ring' in shape) return [shape.ring[0], shape.ring[1]];
  if ('l' in shape) return [...shape.l];
  if ('r' in shape) {
    const [x, y, w, h] = shape.r;
    return [x, y, x + w, y + h];
  }
  if ('p' in shape) return (shape.p.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  if ('arrow' in shape) return [...shape.arrow];
  return [shape.head[0], shape.head[1]];
}

function outOfBounds(art: VectorArt): number[] {
  return art.shapes.flatMap(coords).filter((n) => !Number.isFinite(n) || n < 0 || n > art.grid);
}

describe('pictograms', () => {
  it.each(PICTOGRAM_IDS)('%s stays on its 48x48 canvas', (id) => {
    expect(PICTOGRAMS[id].grid).toBe(48);
    expect(outOfBounds(PICTOGRAMS[id])).toEqual([]);
  });

  it.each(PICTOGRAM_IDS)('%s has a solid round head (signage figure)', (id) => {
    expect(PICTOGRAMS[id].shapes.some((s) => 'c' in s && s.c[2] >= 4)).toBe(true);
  });

  it('uses the signal accent only on PR and warning signs', () => {
    const withSignal = PICTOGRAM_IDS.filter((id) =>
      PICTOGRAMS[id].shapes.some((s) => s.tone === 'signal'),
    );
    expect(withSignal.sort()).toEqual(['form-warning', 'pr']);
  });
});

describe('glyphs', () => {
  it.each(GLYPH_IDS)('%s stays on its 24x24 canvas', (id) => {
    expect(GLYPHS[id].grid).toBe(24);
    expect(outOfBounds(GLYPHS[id])).toEqual([]);
  });
});

describe('vector renderer', () => {
  it('turns an arrow into a shaft and a solid head', () => {
    const els = artToElements({ grid: 48, stroke: 4, shapes: [{ arrow: [10, 40, 10, 10] }] });
    expect(els.map((e) => e.tag)).toEqual(['polyline', 'polygon']);
    expect(els[0].attrs['stroke-linecap']).toBe('round');
  });

  it('maps tones to theme colors', () => {
    const [el] = artToElements({ grid: 48, stroke: 4, shapes: [{ c: [1, 1, 1], tone: 'signal' }] });
    expect(el.attrs.fill).toBe('var(--signal)');
  });
});

describe('mussel badge', () => {
  const all = [MUSSEL_BADGE.shell, ...MUSSEL_BADGE.cutouts].flat();

  it('keeps the shell and its cutouts inside the ring', () => {
    const { cx, cy, r, width } = MUSSEL_BADGE.ring;
    const inner = r - width / 2;
    for (const [x, y] of MUSSEL_BADGE.shell) {
      expect(Math.hypot(x - cx, y - cy)).toBeLessThan(inner);
    }
    for (const [x, y] of all) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeLessThanOrEqual(100);
    }
  });

  it('renders as an accessible SVG with its cutouts masked out', () => {
    const { container } = render(<MusselLogo size={64} />);
    expect(screen.getByRole('img', { name: 'Mussel' })).toHaveAttribute('width', '64');
    const mask = container.querySelector('mask');
    expect(mask?.querySelectorAll('polygon')).toHaveLength(MUSSEL_BADGE.cutouts.length);
    expect(container.querySelector('polygon[mask]')).not.toBeNull();
  });

  it('is hidden from assistive tech when decorative', () => {
    const { container } = render(<MusselLogo title="" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('icon registry', () => {
  it('registers every pictogram and glyph', () => {
    expect(Object.keys(PICTOGRAM_REGISTRY).sort()).toEqual([...PICTOGRAM_IDS].sort());
    expect(Object.keys(GLYPH_REGISTRY).sort()).toEqual([...GLYPH_IDS].sort());
  });

  it('renders an accessible SVG at the requested size', () => {
    const Squat = PICTOGRAM_REGISTRY.squat;
    render(<Squat size={72} title="Back squat" />);
    const svg = screen.getByRole('img', { name: 'Back squat' });
    expect(svg).toHaveAttribute('width', '72');
    expect(svg).toHaveAttribute('viewBox', '0 0 48 48');
  });

  it('hides icons in labelled tiles from assistive tech', () => {
    const { container } = render(<PictoTile icon="bench" label="Bench" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Bench')).toBeInTheDocument();
  });
});
