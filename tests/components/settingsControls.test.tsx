import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SegmentedControl } from '../../src/components/ui/SegmentedControl';
import { Toggle } from '../../src/components/ui/Toggle';

describe('SegmentedControl', () => {
  function Units() {
    const [units, setUnits] = useState<'lb' | 'kg'>('lb');
    return (
      <SegmentedControl
        label="Units"
        value={units}
        options={[
          { value: 'lb', label: 'lb' },
          { value: 'kg', label: 'kg' },
        ]}
        onChange={setUnits}
      />
    );
  }

  it('is a labelled radio group with one option checked', () => {
    render(<Units />);
    expect(screen.getByRole('group', { name: 'Units' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'lb' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'kg' })).not.toBeChecked();
  });

  it('changes selection', () => {
    render(<Units />);
    fireEvent.click(screen.getByRole('radio', { name: 'kg' }));
    expect(screen.getByRole('radio', { name: 'kg' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'lb' })).not.toBeChecked();
  });
});

describe('Toggle', () => {
  function Sound() {
    const [on, setOn] = useState(false);
    return <Toggle label="Sound" checked={on} onChange={setOn} />;
  }

  it('is a switch that flips on tap', () => {
    render(<Sound />);
    const sw = screen.getByRole('switch', { name: 'Sound' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });
});
