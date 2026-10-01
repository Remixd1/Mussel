import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  block?: boolean;
  /** Leading icon (e.g. a glyph). Use with `aria-label` when there is no text. */
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  block = false,
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'px-btn',
    `px-btn--${variant}`,
    block && 'px-btn--block',
    icon && !children && 'px-btn--icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} {...rest}>
      {icon}
      {children}
    </button>
  );
}
