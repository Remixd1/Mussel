import { formatWeight } from '../../lib/calc/units';
import type { ProgramExercise, Units } from '../../lib/types';

/** "3 × 6-8" */
export function formatSetsReps(e: ProgramExercise): string {
  return `${e.sets} × ${e.repsText || '?'}`;
}

/** "RPE 5-6", "−15%", "100 kg", or the text as written. */
export function formatPrescription(e: ProgramExercise, units: Units): string {
  const p = e.prescription;
  switch (p.kind) {
    case 'rpe':
      return p.min === p.max ? `RPE ${p.min}` : `RPE ${p.min}-${p.max}`;
    case 'percentDrop':
      return `−${p.percent}%`;
    case 'weight':
      return `${formatWeight(p.weightKg, units)} ${units}`;
    case 'text':
      return e.prescriptionText;
  }
}
