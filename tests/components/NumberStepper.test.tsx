import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NumberStepper } from '../../src/components/ui/NumberStepper';

function Harness({
  initial,
  step,
  min,
  onChange,
}: {
  initial: number | null;
  step: number;
  min?: number;
  onChange?: (v: number | null) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <NumberStepper
      label="Weight"
      value={value}
      step={step}
      min={min}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}

const input = () => screen.getByLabelText('Weight') as HTMLInputElement;

describe('NumberStepper', () => {
  it('uses a decimal keypad', () => {
    render(<Harness initial={100} step={5} />);
    expect(input()).toHaveAttribute('inputmode', 'decimal');
  });

  it('steps up and down by the step', () => {
    render(<Harness initial={100} step={5} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase Weight' }));
    expect(input().value).toBe('105');
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }));
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }));
    expect(input().value).toBe('95');
  });

  it('snaps off-grid values to the step grid', () => {
    render(<Harness initial={47.5} step={5} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase Weight' }));
    expect(input().value).toBe('50');
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }));
    expect(input().value).toBe('45');
  });

  it('handles 2.5 kg steps without float drift', () => {
    render(<Harness initial={0} step={2.5} />);
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Increase Weight' }));
    }
    expect(input().value).toBe('17.5');
  });

  it('absorbs float noise from unit conversion', () => {
    render(<Harness initial={225.0000001} step={5} />);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }));
    expect(input().value).toBe('220');
  });

  it('never goes below min', () => {
    const onChange = vi.fn();
    render(<Harness initial={2.5} step={5} min={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Weight' }));
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(screen.getByRole('button', { name: 'Decrease Weight' })).toBeDisabled();
  });

  it('starts from zero when empty', () => {
    render(<Harness initial={null} step={1} />);
    expect(input().value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Increase Weight' }));
    expect(input().value).toBe('1');
  });

  it('accepts typed values, including a comma decimal', () => {
    const onChange = vi.fn();
    render(<Harness initial={null} step={2.5} onChange={onChange} />);
    fireEvent.change(input(), { target: { value: '62,5' } });
    expect(onChange).toHaveBeenLastCalledWith(62.5);
    fireEvent.change(input(), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('ignores unparseable input without clobbering the value', () => {
    const onChange = vi.fn();
    render(<Harness initial={100} step={5} onChange={onChange} />);
    fireEvent.change(input(), { target: { value: 'abc' } });
    expect(onChange).not.toHaveBeenCalled();
  });
});
