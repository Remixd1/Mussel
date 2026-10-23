import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../../src/components/ui';

/**
 * A parent that re-renders on demand and passes a fresh inline onClose each
 * time, like the live workout screen (clock, rest timer, save echoes).
 */
function Harness({ onClose = () => undefined }: { onClose?: () => void }) {
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setTick((t) => t + 1)}>
        Re-render {tick}
      </button>
      <button type="button" onClick={() => setOpen(true)}>
        Opener
      </button>
      <Modal
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        title="Add exercise"
      >
        <label>
          Search
          <input />
        </label>
      </Modal>
    </>
  );
}

describe('Modal focus', () => {
  it('keeps focus in the field when the parent re-renders with a new onClose', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Search');
    input.focus();
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
    const blurSpy = vi.spyOn(HTMLElement.prototype, 'blur');

    for (let i = 0; i < 5; i++) {
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /re-render/i, hidden: true }));
      });
    }

    // A re-render must not move focus away and back (that's what flickered the
    // phone keyboard): no focus() calls and the field is still focused.
    expect(focusSpy).not.toHaveBeenCalled();
    expect(blurSpy).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
    focusSpy.mockRestore();
    blurSpy.mockRestore();
  });

  it('still calls the latest onClose on Escape', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /re-render/i, hidden: true }));
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('focuses the first field when it opens and restores focus when it closes', () => {
    render(<Harness />);
    expect(document.activeElement).toBe(screen.getByLabelText('Search'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
