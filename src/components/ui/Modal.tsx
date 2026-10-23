import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  /** Buttons rendered in the footer row. */
  actions?: ReactNode;
}

/** Bottom sheet on mobile, centered dialog on wider screens. */
export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  // Callers often pass an inline onClose, so it changes on every parent
  // render. Read it through a ref: if it were an effect dependency, each
  // re-render would restore focus and refocus the first field, which on a
  // phone closes and reopens the keyboard (e.g. mid-workout, where the
  // clock and rest timer re-render constantly).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const sheet = sheetRef.current;
    const first = sheet?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (first ?? sheet)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="px-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className="px-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
        {actions ? <div className="px-modal__actions">{actions}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
