import { useId, type ReactNode } from 'react';
import { PictoTile } from '../../components/ui';
import type { PictogramId } from '../../components/icons';

/** A titled block on the Profile tab. `id` makes it linkable (/profile#history). */
export function ProfileSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section id={id} className="profile-section px-card" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
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
