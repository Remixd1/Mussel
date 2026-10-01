import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ExerciseBlock } from '../../src/features/workout/ExerciseBlock';
import { blankSet } from '../../src/lib/calc/workout';
import type { ChartData, SessionEntry } from '../../src/lib/types';

const chart: ChartData = {
  sourceScale: 'rpe',
  rpeValues: [10, 9, 8],
  rows: [
    { reps: 3, percents: [0.92, 0.88, 0.85] },
    { reps: 5, percents: [0.86, 0.83, 0.8] },
  ],
};

const start: SessionEntry = {
  exerciseId: 'back-squat',
  exerciseName: 'Back Squat',
  iconId: 'squat',
  maxKg: 200,
  restSec: 120,
  dropPercent: null,
  note: null,
  sets: [blankSet(5, 8)],
};

function Harness({
  scale = 'rpe' as 'rpe' | 'rir',
  onSetDone = vi.fn(),
  initial = start,
}: {
  scale?: 'rpe' | 'rir';
  onSetDone?: () => void;
  initial?: SessionEntry;
}) {
  const [entry, setEntry] = useState(initial);
  return (
    <>
      <ExerciseBlock
        entries={[entry]}
        index={0}
        chart={chart}
        units="kg"
        scale={scale}
        onChange={setEntry}
        onRemove={vi.fn()}
        onSetDone={onSetDone}
      />
      <output data-testid="state">{JSON.stringify(entry)}</output>
    </>
  );
}

const state = () => JSON.parse(screen.getByTestId('state').textContent!) as SessionEntry;
const set1 = () => screen.getByRole('listitem');

describe('ExerciseBlock', () => {
  it('suggests PR x chart% for the set reps and RPE', () => {
    render(<Harness />);
    // 200 kg x 0.80 (5 @ 8) = 160 kg.
    expect(within(set1()).getByText('160 kg')).toBeInTheDocument();
  });

  it('updates the suggestion when RPE or the PR change', () => {
    render(<Harness />);
    fireEvent.change(within(set1()).getByLabelText('RPE'), { target: { value: '9' } });
    expect(within(set1()).getByText('165 kg')).toBeInTheDocument(); // 200 x .83 = 166 -> 165
    fireEvent.change(screen.getByLabelText('PR (kg)'), { target: { value: '220' } });
    expect(within(set1()).getByText('182.5 kg')).toBeInTheDocument(); // 220 x .83 = 182.6 -> 182.5
  });

  it('shows RIR when the user prefers it, storing RPE', () => {
    render(<Harness scale="rir" />);
    const rir = within(set1()).getByLabelText('RIR');
    expect(rir).toHaveValue('2');
    fireEvent.change(rir, { target: { value: '1' } });
    expect(state().sets[0].rpe).toBe(9);
  });

  it('ticking done locks in the suggestion as the weight and starts rest', () => {
    const onSetDone = vi.fn();
    render(<Harness onSetDone={onSetDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark set 1 done' }));
    expect(state().sets[0]).toMatchObject({ done: true, weightKg: 160 });
    expect(onSetDone).toHaveBeenCalledTimes(1);
  });

  it('adjusts weight by the plate step from the suggestion', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'More weight' }));
    expect(state().sets[0].weightKg).toBe(162.5);
    fireEvent.click(screen.getByRole('button', { name: 'Less weight' }));
    fireEvent.click(screen.getByRole('button', { name: 'Less weight' }));
    expect(state().sets[0].weightKg).toBe(157.5);
  });

  it('adds sets copying the last one, and removes them', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '+ Add set' }));
    expect(state().sets).toHaveLength(2);
    expect(state().sets[1]).toMatchObject({ reps: 5, rpe: 8, done: false });
    fireEvent.click(screen.getByRole('button', { name: 'Remove set 2' }));
    expect(state().sets).toHaveLength(1);
  });

  it("changes this exercise's rest timer in 15 s steps", () => {
    render(<Harness />);
    expect(screen.getByText('2:00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '15 seconds more rest' }));
    expect(state().restSec).toBe(135);
    fireEvent.click(screen.getByRole('button', { name: '15 seconds less rest' }));
    fireEvent.click(screen.getByRole('button', { name: '15 seconds less rest' }));
    expect(state().restSec).toBe(105);
  });

  it('shows a dash when there is no PR to suggest from', () => {
    render(<Harness initial={{ ...start, maxKg: null }} />);
    expect(within(set1()).getByText('—')).toBeInTheDocument();
  });
});
