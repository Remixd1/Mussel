import type { HTMLAttributes } from 'react';

export function PixelCard({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={['px-card', className].filter(Boolean).join(' ')} {...rest} />;
}
