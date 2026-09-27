import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { PICTOGRAM_REGISTRY } from '../icons';
import { ToastContext, type ToastOptions } from './toast-context';

interface ToastItem extends ToastOptions {
  id: number;
  message: string;
}

const DEFAULT_DURATION_MS = 3500;

/** Hosts the toast stack. Announcements go through an aria-live region. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, message, ...options }]);
      const duration = options.durationMs ?? DEFAULT_DURATION_MS;
      if (duration > 0) window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="px-toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const Icon = item.icon ? PICTOGRAM_REGISTRY[item.icon] : null;
  const tone = item.tone ?? 'default';
  return (
    <div className={`px-toast${tone === 'default' ? '' : ` px-toast--${tone}`}`}>
      {Icon ? (
        <Icon size={24} title="" className={item.icon === 'pr' ? 'px-blink-3' : undefined} />
      ) : null}
      <span className="px-toast__msg">{item.message}</span>
      {item.action ? (
        <button
          type="button"
          className="px-btn px-btn--secondary"
          onClick={() => {
            item.action?.onClick();
            onClose();
          }}
        >
          {item.action.label}
        </button>
      ) : null}
      <button type="button" className="px-toast__close" aria-label="Dismiss" onClick={onClose}>
        X
      </button>
    </div>
  );
}
