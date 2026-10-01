import { GLYPHS, type GlyphId } from './art';
import { VectorIcon } from './VectorIcon';

/** UI glyphs are vector line art; 20 to 28px is typical. */
export type GlyphSize = number;

export interface GlyphProps {
  size?: GlyphSize;
  title?: string;
  className?: string;
}

function glyph(id: GlyphId) {
  function Glyph({ size = 20, title, className }: GlyphProps) {
    return <VectorIcon art={GLYPHS[id]} size={size} title={title} className={className} />;
  }
  Glyph.displayName = `Glyph(${id})`;
  return Glyph;
}

export const HomeGlyph = glyph('home');
export const WorkoutGlyph = glyph('workout');
export const UploadGlyph = glyph('upload');
export const ProfileGlyph = glyph('profile');
export const FriendsGlyph = glyph('friends');
export const ClipboardGlyph = glyph('clipboard');
export const CalendarGlyph = glyph('calendar');
export const AddGlyph = glyph('add');
export const DeleteGlyph = glyph('delete');
export const EditGlyph = glyph('edit');
export const HistoryGlyph = glyph('history');
export const ChartGlyph = glyph('chart');
export const SettingsGlyph = glyph('settings');
export const CheckGlyph = glyph('check');
export const TimerGlyph = glyph('timer');
export const BackGlyph = glyph('back');
