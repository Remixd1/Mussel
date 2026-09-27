import { useId, type InputHTMLAttributes } from 'react';

export interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function PixelInput({ label, id, className, ...rest }: PixelInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="px-field">
      <label className="px-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input id={inputId} className={['px-input', className].filter(Boolean).join(' ')} {...rest} />
    </div>
  );
}
