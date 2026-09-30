import type { ComponentType } from 'react';
import type { GlyphId, PictogramId } from './art';
import * as G from './glyphs';
import * as P from './pictograms';

export { PICTOGRAM_IDS, GLYPH_IDS } from './art';
export type { PictogramId, GlyphId } from './art';
export type { PictogramProps, PictogramSize } from './pictograms';
export type { GlyphProps, GlyphSize } from './glyphs';
export { MusselLogo, type MusselSize } from './MusselLogo';
export * from './pictograms';
export * from './glyphs';

/** Pictogram registry: exercise data refers to icons by string id. */
export const PICTOGRAM_REGISTRY: Record<PictogramId, ComponentType<P.PictogramProps>> = {
  squat: P.SquatIcon,
  bench: P.BenchIcon,
  deadlift: P.DeadliftIcon,
  ohp: P.OhpIcon,
  pullup: P.PullupIcon,
  row: P.RowIcon,
  curl: P.CurlIcon,
  pushup: P.PushupIcon,
  lunge: P.LungeIcon,
  plank: P.PlankIcon,
  run: P.RunIcon,
  cycle: P.CycleIcon,
  core: P.CoreIcon,
  stretch: P.StretchIcon,
  machine: P.MachineIcon,
  rest: P.RestIcon,
  pr: P.PrIcon,
  'form-warning': P.FormWarningIcon,
  bodyweight: P.BodyweightIcon,
};

export const GLYPH_REGISTRY: Record<GlyphId, ComponentType<G.GlyphProps>> = {
  home: G.HomeGlyph,
  workout: G.WorkoutGlyph,
  upload: G.UploadGlyph,
  profile: G.ProfileGlyph,
  add: G.AddGlyph,
  delete: G.DeleteGlyph,
  edit: G.EditGlyph,
  history: G.HistoryGlyph,
  chart: G.ChartGlyph,
  settings: G.SettingsGlyph,
  check: G.CheckGlyph,
  timer: G.TimerGlyph,
  back: G.BackGlyph,
};

export function isPictogramId(id: string): id is PictogramId {
  return id in PICTOGRAM_REGISTRY;
}
