/** Firestore data model (CLAUDE.md §6). Weights are canonical kg. */
import type { Timestamp } from 'firebase/firestore';

export type Units = 'lb' | 'kg';
export type ThemePref = 'system' | 'light' | 'dark';
export type TrackingType = 'weight_reps' | 'reps_only' | 'duration' | 'distance_duration';
export type ExerciseCategory =
  'Legs' | 'Posterior' | 'Push' | 'Pull' | 'Core' | 'Cardio' | 'Mobility' | 'Other';

export interface UserProfile {
  displayName: string;
  subjectNumber: string;
  units: Units;
  defaultRestSec: number;
  theme: ThemePref;
  announcerOn: boolean;
  soundOn: boolean;
  scanlinesOn: boolean;
  createdAt: Timestamp;
  onboardedAt: Timestamp | null;
}

export interface SetRow {
  reps?: number;
  weightKg?: number;
  durationSec?: number;
  distanceM?: number;
  done: boolean;
  isWarmup: boolean;
}

export interface SessionEntry {
  exerciseId: string;
  exerciseName: string;
  iconId: string;
  trackingType: TrackingType;
  sets: SetRow[];
}

export interface PrHit {
  exerciseId: string;
  kind: 'maxWeight' | 'e1rm' | 'repsAtWeight' | 'sessionVolume';
  valueKg?: number;
  reps?: number;
}

export interface SessionTotals {
  volumeKg: number;
  setCount: number;
  durationSec: number;
}

export interface Session {
  startedAt: Timestamp;
  endedAt: Timestamp;
  planId: string | null;
  notes: string;
  entries: SessionEntry[];
  totals: SessionTotals;
  prsHit: PrHit[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActiveSession extends Omit<Session, 'endedAt' | 'totals' | 'prsHit'> {
  restTimer: { endsAt: Timestamp | null };
}

export interface ExercisePrs {
  maxWeightKg: number;
  maxWeightSessionId: string;
  bestE1rmKg: number;
  bestE1rmSessionId: string;
  repsAtWeight: Record<string, number>;
  bestSessionVolumeKg: number;
  updatedAt: Timestamp;
}

export interface CustomExercise {
  name: string;
  category: ExerciseCategory;
  iconId: string;
  trackingType: TrackingType;
  createdAt: Timestamp;
}

export interface TestPlan {
  name: string;
  entries: { exerciseId: string; targetSets: number; targetReps: number }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BodyweightEntry {
  weightKg: number;
  date: string;
  createdAt: Timestamp;
}
