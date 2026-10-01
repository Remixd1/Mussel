/**
 * Firestore data model (CLAUDE.md §6). Weights are canonical kg; effort is
 * canonical RPE (RIR input converts as RPE = 10 - RIR).
 */
import type { Timestamp } from 'firebase/firestore';

export type Units = 'lb' | 'kg';
export type EffortScale = 'rpe' | 'rir';
export type ThemePref = 'system' | 'light' | 'dark';

/** usernames/{usernameLower}: public, one per user, permanent. */
export interface UsernameClaim {
  uid: string;
  username: string;
}

export interface UserProfile {
  /** As typed at sign-up. Permanent. */
  username: string;
  /** Key into usernames/. Permanent. */
  usernameLower: string;
  subjectNumber: string;
  units: Units;
  effortScale: EffortScale;
  defaultRestSec: number;
  theme: ThemePref;
  announcerOn: boolean;
  soundOn: boolean;
  /** null = the built-in default chart. */
  activeChartId: string | null;
  activeProgramId: string | null;
  createdAt: Timestamp;
  onboardedAt: Timestamp | null;
}

/** One row of an effort chart: a rep count and its %1RM per effort column. */
export interface EffortChartRow {
  reps: number;
  /** Fractions 0..1 aligned to `rpeValues`; null where the chart is blank. */
  percents: (number | null)[];
}

/** The numbers of an RPE/RIR -> %1RM chart, independent of storage. */
export interface ChartData {
  sourceScale: EffortScale;
  /** Column headers as canonical RPE, descending. */
  rpeValues: number[];
  /** Rows sorted by reps, ascending. */
  rows: EffortChartRow[];
}

/** A stored chart. Rows are maps holding arrays (Firestore can't nest arrays). */
export interface EffortChart extends ChartData {
  name: string;
  sourceFileName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** What a program asks for on an exercise: an RPE (range), a back-off drop, or a load. */
export type Prescription =
  | { kind: 'rpe'; min: number; max: number }
  | { kind: 'percentDrop'; percent: number }
  | { kind: 'weight'; weightKg: number }
  | { kind: 'text' };

export interface ProgramExercise {
  /** As written in the sheet, e.g. "Comp Bench". */
  name: string;
  /** Seed exercise match, if any. */
  exerciseId: string | null;
  iconId: string;
  sets: number;
  /** null for special reps like DROPSET or AMRAP. */
  reps: { min: number; max: number } | null;
  repsText: string;
  prescription: Prescription;
  prescriptionText: string;
  note: string | null;
}

export interface ProgramDay {
  label: string;
  rest: boolean;
  exercises: ProgramExercise[];
}

/** A week is a "folder" of days. */
export interface ProgramWeek {
  label: string;
  /** null when created by "Repeat week". */
  sourceFileName: string | null;
  days: ProgramDay[];
}

/** users/{uid}/programs/{programId}: weeks/days/exercises nest as arrays of maps. */
export interface Program {
  name: string;
  weeks: ProgramWeek[];
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
