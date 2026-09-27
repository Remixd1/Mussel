import type { ReactNode } from 'react';
import { useCopy } from '../hooks/useCopy';
import { PictoTile } from '../components/ui';
import type { PictogramId } from '../components/icons';

/** Stand-in for screens built in later phases. */
export function Placeholder({
  title,
  icon = 'rest',
  phase,
  children,
}: {
  title: string;
  icon?: PictogramId;
  phase: number;
  children?: ReactNode;
}) {
  const copy = useCopy();
  return (
    <section className="px-stack">
      <h1>{title}</h1>
      <div className="px-card px-stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <PictoTile icon={icon} size={72} title="" />
        <p>{copy('placeholder.body')}</p>
        <p className="px-muted">Scheduled for phase {phase}.</p>
        {children}
      </div>
    </section>
  );
}
