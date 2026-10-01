import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { formatClock, useRestTimer } from '../../src/hooks/useRestTimer';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useRestTimer', () => {
  it('is idle without an end time', () => {
    const { result } = renderHook(() => useRestTimer(null, 90, vi.fn()));
    expect(result.current).toEqual({ running: false, remainingSec: 0, fraction: 0 });
  });

  it('counts down from the end timestamp', () => {
    const endsAt = Date.now() + 90_000;
    const { result } = renderHook(() => useRestTimer(endsAt, 90, vi.fn()));
    expect(result.current.remainingSec).toBe(90);
    expect(result.current.fraction).toBe(1);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.remainingSec).toBe(60);
    expect(result.current.fraction).toBeCloseTo(2 / 3, 5);
  });

  it('stays correct across a long sleep (no tick counting)', () => {
    const endsAt = Date.now() + 90_000;
    const { result } = renderHook(() => useRestTimer(endsAt, 90, vi.fn()));
    act(() => {
      // Jump the clock without firing intervals in between, like a locked phone.
      vi.setSystemTime(Date.now() + 80_000);
      vi.advanceTimersByTime(250);
    });
    expect(result.current.remainingSec).toBe(10);
  });

  it('calls onDone exactly once when it reaches zero', () => {
    const onDone = vi.fn();
    const endsAt = Date.now() + 5_000;
    const { result } = renderHook(() => useRestTimer(endsAt, 5, onDone));
    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(result.current.running).toBe(false);
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('restarts when given a new end time (+15 s)', () => {
    const onDone = vi.fn();
    let endsAt = Date.now() + 10_000;
    const { result, rerender } = renderHook(() => useRestTimer(endsAt, 10, onDone));
    endsAt += 15_000;
    rerender();
    expect(result.current.remainingSec).toBe(25);
  });
});

describe('formatClock', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [65, '1:05'],
    [180, '3:00'],
  ])('%i -> %s', (s, text) => expect(formatClock(s)).toBe(text));
});
