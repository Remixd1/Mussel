/**
 * Firestore data model (CLAUDE.md §6). Weights are canonical kg; effort is
 * canonical RPE (RIR input converts as RPE = 10 - RIR).
 */
import type { Timestamp } from 'firebase/firestore';

export type Units = 'lb' | 'kg';
export type EffortScale = 'rpe' | 'rir';
export type ThemePref = 'system' | 'light' | 'dark';

export interface UserProfile {
  displayName: string;
  subjectNumber: string;
  units: Units;
  effortScale: EffortScale;
  defaultRestSec: number;
  theme: ThemePref;
  announcerOn: boolean;
  soundOn: boolean;
  scanlinesOn: boolean;
  /** null = the built-in default chart. */
  activeChartId: string | null;
  createdAt: Timestamp;
  onboardedAt: Timestamp | null;
}

/** One row of an effort chart: a rep count and its %1RM per effort column. */
export interface EffortChartRow {
  reps: number;
  /** Fractions 0..1 aligned to `rpeValues`; null where the chart is blank. */
  percents: (number | null)[];
}

/** An RPE/RIR -> %1RM chart. Rows are maps holding arrays (Firestore can't nest arrays). */
export interface EffortChart {
  name: string;
  sourceScale: EffortScale;
  /** Column headers as canonical RPE, descending. */
  rpeValues: number[];
  rows: EffortChartRow[];
  sourceFileName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SetTarget {
  reps: number;
  rpe: number;
  weightKg: number | null;
}

export interface SetRow {
  weightKg?: number;
  reps?: number;
  /** Canonical RPE, 0.5 steps. */
  rpe?: number;
  target?: SetTarget;
  done: boolean;
  isWarmup: boolean;
}

export interface SessionEntry {
  /** Seed exercise id, or null for a custom name typed in the picker. */
  exerciseId: string | null;
  exerciseName: string;
  iconId: string;
  sets: SetRow[];
}

export interface SessionTotals {
  volumeKg: number;
  setCount: number;
  durationSec: number;
}

export interface Session {
  startedAt: Timestamp;
  endedAt: Timestamp;
  /** Chart used for targets; null = the built-in default. */
  chartId: string | null;
  notes: string;
  entries: SessionEntry[];
  totals: SessionTotals;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActiveSession extends Omit<Session, 'endedAt' | 'totals'> {
  restTimer: { endsAt: Timestamp | null };
}

/** users/{uid}/maxes/{exerciseKey}: seed id, or "custom:" + lowercased name. */
export interface EstimatedMax {
  exerciseName: string;
  e1rmKg: number;
  source: 'manual' | 'session';
  sessionId: string | null;
  updatedAt: Timestamp;
}
