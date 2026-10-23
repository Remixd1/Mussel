import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Link, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '../../src/components/layout/AppShell';
import { useHideDock } from '../../src/components/layout/dock';
import { ExerciseBlock } from '../../src/features/workout/ExerciseBlock';
import { initialCollapsed, setProgress } from '../../src/features/workout/format';
import { blankSet } from '../../src/lib/calc/workout';
import type { ChartData, SessionEntry } from '../../src/lib/types';

const chart: ChartData = {
  sourceScale: 'rpe',
  rpeValues: [10, 9, 8],
  rows: [{ reps: 5, percents: [0.86, 0.83, 0.8] }],
};

const entry = (name: string, done: boolean[]): SessionEntry => ({
  exerciseId: null,
  exerciseName: name,
  iconId: 'machine',
  maxKg: 100,
  restSec: 90,
  dropPercent: null,
  note: null,
  sets: done.map((d) => ({ ...blankSet(5, 8), done: d })),
});

describe('collapse helpers', () => {
  it('opens only the first exercise with sets left', () => {
    expect(
      initialCollapsed([entry('A', [true, true]), entry('B', [true, false]), entry('C', [false])]),
    ).toEqual([true, false, true]);
    expect(initialCollapsed([entry('A', [false]), entry('B', [false])])).toEqual([false, true]);
    // Everything done (e.g. resuming at the end): open the first.
    expect(initialCollapsed([entry('A', [true]), entry('B', [true])])).toEqual([false, true]);
    expect(initialCollapsed([])).toEqual([]);
  });

  it('describes progress', () => {
    expect(setProgress(entry('A', [true, false, false]).sets)).toBe('1/3 sets done');
    expect(setProgress(entry('A', [true, true]).sets)).toBe('All 2 sets done');
    expect(setProgress(entry('A', [false]).sets)).toBe('0/1 set done');
  });
});

function CollapsibleHarness() {
  const [collapsed, setCollapsed] = useState(false);
  const [e, setE] = useState(entry('Bench Press', [true, false, false]));
  return (
    <ExerciseBlock
      entries={[e]}
      index={0}
      chart={chart}
      units="kg"
      scale="rpe"
      onChange={setE}
      onRemove={vi.fn()}
      onSetDone={vi.fn()}
      collapsed={collapsed}
      onToggle={() => setCollapsed((c) => !c)}
    />
  );
}

describe('collapsible exercise block', () => {
  it('collapses to the header with progress, and expands again', () => {
    render(<CollapsibleHarness />);
    const toggle = screen.getByRole('button', { name: /bench press/i, expanded: true });
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(toggle).toHaveTextContent('1/3 sets done');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.queryByLabelText(/PR/)).not.toBeInTheDocument();
    // The exercise can still be removed or looked up while collapsed.
    expect(screen.getByRole('button', { name: 'Remove Bench Press' })).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('keeps the name as a heading for screen readers', () => {
    render(<CollapsibleHarness />);
    expect(screen.getByRole('heading', { name: /bench press/i })).toBeInTheDocument();
  });
});

function LiveWorkout() {
  useHideDock();
  return (
    <>
      <Link to="/">Home</Link>
      <p>Workout screen</p>
    </>
  );
}

describe('dock on the live workout', () => {
  it('hides the dock while the workout is open and brings it back on Home', () => {
    render(
      <MemoryRouter initialEntries={['/workout']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<p>Home screen</p>} />
            <Route path="/workout" element={<LiveWorkout />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Workout screen')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();
    expect(document.querySelector('main')).toHaveClass('app-main--no-dock');

    fireEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(screen.getByText('Home screen')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(document.querySelector('main')).not.toHaveClass('app-main--no-dock');
  });
});
