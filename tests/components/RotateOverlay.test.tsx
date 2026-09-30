import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RotateOverlay } from '../../src/components/layout/RotateOverlay';

function stubDevice({
  orientationType,
  coarse,
  mediaLandscape = false,
}: {
  orientationType?: string;
  coarse: boolean;
  mediaLandscape?: boolean;
}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('pointer: coarse') ? coarse : mediaLandscape,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  Object.defineProperty(window.screen, 'orientation', {
    configurable: true,
    value: orientationType
      ? {
          type: orientationType,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          lock: () => Promise.reject(new Error('not supported')),
        }
      : undefined,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const overlay = () => screen.queryByRole('alertdialog');

describe('RotateOverlay', () => {
  it('stays hidden on a phone held upright', () => {
    stubDevice({ orientationType: 'portrait-primary', coarse: true });
    render(<RotateOverlay />);
    expect(overlay()).toBeNull();
  });

  it('covers the app on a phone turned sideways', () => {
    stubDevice({ orientationType: 'landscape-primary', coarse: true });
    render(<RotateOverlay />);
    expect(overlay()).toBeInTheDocument();
    expect(overlay()).toHaveTextContent('upright testing position');
  });

  it('ignores the keyboard-squashed viewport when screen.orientation says portrait', () => {
    stubDevice({ orientationType: 'portrait-primary', coarse: true, mediaLandscape: true });
    render(<RotateOverlay />);
    expect(overlay()).toBeNull();
  });

  it('falls back to the media query without screen.orientation', () => {
    stubDevice({ coarse: true, mediaLandscape: true });
    render(<RotateOverlay />);
    expect(overlay()).toBeInTheDocument();
  });

  it('never shows on desktop (fine pointer), which reports landscape', () => {
    stubDevice({ orientationType: 'landscape-primary', coarse: false });
    render(<RotateOverlay />);
    expect(overlay()).toBeNull();
  });
});
