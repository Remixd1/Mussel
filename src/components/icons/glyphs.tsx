import { GLYPHS, type GlyphId } from './art';
import { PixelIcon } from './PixelIcon';

/** UI glyphs render on their 16px grid. */
export type GlyphSize = 16 | 32 | 48;

export interface GlyphProps {
  size?: GlyphSize;
  title?: string;
  className?: string;
}

function glyph(id: GlyphId) {
  function Glyph({ size = 16, title, className }: GlyphProps) {
    return <PixelIcon art={GLYPHS[id]} size={size} title={title} className={className} />;
  }
  Glyph.displayName = `Glyph(${id})`;
  return Glyph;
}

export const AddGlyph = glyph('add');
export const DeleteGlyph = glyph('delete');
export const EditGlyph = glyph('edit');
export const HistoryGlyph = glyph('history');
export const ChartGlyph = glyph('chart');
export const SettingsGlyph = glyph('settings');
export const CheckGlyph = glyph('check');
export const TimerGlyph = glyph('timer');
export const BackGlyph = glyph('back');
