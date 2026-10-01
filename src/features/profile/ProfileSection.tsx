import { useId, type ReactNode } from 'react';
import { PictoTile } from '../../components/ui';
import type { PictogramId } from '../../components/icons';

/** A titled block on the Profile tab. */
export function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className="profile-section px-card" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

/** Empty state for sections whose contents arrive in later phases. */
export function EmptyState({ icon, message }: { icon: PictogramId; message: string }) {
  return (
    <div className="profile-empty">
      <PictoTile icon={icon} size={48} title="" />
      <p>{message}</p>
    </div>
  );
}
