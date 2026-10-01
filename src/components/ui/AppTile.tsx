import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { GlyphProps } from '../icons';

export interface AppTileProps {
  to: string;
  label: string;
  Icon: ComponentType<GlyphProps>;
}

/** Home-screen style shortcut: a framed square icon with a label under it. */
export function AppTile({ to, label, Icon }: AppTileProps) {
  return (
    <Link to={to} className="px-app">
      <span className="px-app__frame">
        <Icon size={40} />
      </span>
      <span className="px-app__label">{label}</span>
    </Link>
  );
}

/** Four-column grid of AppTiles. */
export function AppGrid({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <nav className="px-apps" aria-label={label}>
      {children}
    </nav>
  );
}
