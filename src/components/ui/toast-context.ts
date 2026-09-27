import { createContext } from 'react';
import type { PictogramId } from '../icons';

export type ToastTone = 'default' | 'signal' | 'alarm';

export interface ToastOptions {
  tone?: ToastTone;
  icon?: PictogramId;
  /** Auto-dismiss after this many ms. 0 keeps it until closed. */
  durationMs?: number;
  action?: { label: string; onClick: () => void };
}

export interface ToastApi {
  show: (message: string, options?: ToastOptions) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);
