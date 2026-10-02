import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExercisePicker } from '../../src/features/workout/ExercisePicker';
import { GuideTile } from '../../src/features/exercises/GuideTile';

function renderPicker() {
  const onPick = vi.fn();
  const onClose = vi.fn();
  render(<ExercisePicker open onClose={onClose} onPick={onPick} />);
  return { onPick, onClose };
}

describe('ExercisePicker guide', () => {
  it('tapping an exercise opens its guide, and Add exercise picks it', () => {
    const { onPick, onClose } = renderPicker();
    fireEvent.click(screen.getByRole('button', { name: /^bench press$/i }));

    expect(screen.getByRole('dialog', { name: 'Bench Press' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /bench press: start and finish/i })).toBeInTheDocument();
    expect(screen.getByText('Chest')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /how to do it/i })).toBeInTheDocument();
    expect(onPick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Add exercise' }));
    expect(onPick).toHaveBeenCalledWith({ exerciseId: 'bench-press', name: 'Bench Press' });
    expect(onClose).toHaveBeenCalled();
  });

  it('Back returns to the list without picking', () => {
    const { onPick } = renderPicker();
    fireEvent.click(screen.getByRole('button', { name: /^deadlift$/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('dialog', { name: 'Add exercise' })).toBeInTheDocument();
    expect(onPick).not.toHaveBeenCalled();
  });

  it('custom names are still added directly', () => {
    const { onPick } = renderPicker();
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Zercher Squat' } });
    fireEvent.click(screen.getByRole('button', { name: /add “zercher squat”/i }));
    expect(onPick).toHaveBeenCalledWith({ exerciseId: null, name: 'Zercher Squat' });
  });
});

describe('GuideTile', () => {
  it('opens and closes the guide for seed exercises', () => {
    render(<GuideTile exerciseId="pullup" name="Pull-up" iconId="pullup" />);
    fireEvent.click(screen.getByRole('button', { name: 'How to do Pull-up' }));
    expect(screen.getByRole('dialog', { name: 'Pull-up' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a plain tile for custom exercises', () => {
    render(<GuideTile exerciseId={null} name="Zercher Squat" iconId="squat" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
