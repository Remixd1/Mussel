import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Validation message; marks the field invalid and is announced. */
  error?: string | null;
  /** Helper text or live status under the field (e.g. username availability). */
  hint?: ReactNode;
}

export function PixelInput({ label, id, className, error, hint, ...rest }: PixelInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className="px-field">
      <label className="px-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={['px-input', error && 'px-input--invalid', className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...rest}
      />
      {hint ? (
        <span id={hintId} className="px-field__hint" aria-live="polite">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="px-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
