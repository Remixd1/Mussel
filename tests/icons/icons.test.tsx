import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GLYPHS, PICTOGRAMS, type PixelArt } from '../../src/components/icons/art';
import { MUSSEL_MAP, MUSSEL_PALETTE } from '../../src/components/icons/mussel-art';
import {
  GLYPH_IDS,
  GLYPH_REGISTRY,
  PICTOGRAM_IDS,
  PICTOGRAM_REGISTRY,
} from '../../src/components/icons';
import { PictoTile } from '../../src/components/ui/PictoTile';

function outOfBounds(art: PixelArt) {
  return art.px.filter(
    ([x, y, w, h]) =>
      ![x, y, w, h].every(Number.isInteger) ||
      x < 0 ||
      y < 0 ||
      w <= 0 ||
      h <= 0 ||
      x + w > art.grid ||
      y + h > art.grid,
  );
}

describe('pixel art', () => {
  it.each(PICTOGRAM_IDS)('pictogram %s is on the 24px grid, in bounds', (id) => {
    expect(PICTOGRAMS[id].grid).toBe(24);
    expect(outOfBounds(PICTOGRAMS[id])).toEqual([]);
  });

  it.each(GLYPH_IDS)('glyph %s is on the 16px grid, in bounds', (id) => {
    expect(GLYPHS[id].grid).toBe(16);
    expect(outOfBounds(GLYPHS[id])).toEqual([]);
  });

  it('uses the signal accent only on PR and warning icons', () => {
    const withSignal = PICTOGRAM_IDS.filter((id) =>
      PICTOGRAMS[id].px.some(([, , , , tone]) => tone === 'signal'),
    );
    expect(withSignal.sort()).toEqual(['form-warning', 'pr']);
  });

  it('mascot map is 32x32 and uses only palette colors', () => {
    expect(MUSSEL_MAP).toHaveLength(32);
    for (const row of MUSSEL_MAP) {
      expect(row).toHaveLength(32);
      for (const ch of row) expect(ch === '.' || ch in MUSSEL_PALETTE).toBe(true);
    }
  });
});

describe('icon registry', () => {
  it('registers every pictogram and glyph', () => {
    expect(Object.keys(PICTOGRAM_REGISTRY).sort()).toEqual([...PICTOGRAM_IDS].sort());
    expect(Object.keys(GLYPH_REGISTRY).sort()).toEqual([...GLYPH_IDS].sort());
  });

  it('renders an accessible, crisp-edged SVG at the requested size', () => {
    const Squat = PICTOGRAM_REGISTRY.squat;
    render(<Squat size={72} title="Back squat" />);
    const svg = screen.getByRole('img', { name: 'Back squat' });
    expect(svg).toHaveAttribute('width', '72');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('shape-rendering', 'crispEdges');
  });

  it('hides decorative icons from assistive tech', () => {
    const { container } = render(<PictoTile icon="bench" label="Bench" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Bench')).toBeInTheDocument();
  });
});
