import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { AddGlyph, ChartGlyph, HistoryGlyph, SettingsGlyph, SquatIcon } from '../icons';

interface NavItem {
  to: string;
  label: string;
  /** Full name for assistive tech when the visible label is abbreviated. */
  name: string;
  icon: ReactNode;
  end?: boolean;
}

const ITEMS: NavItem[] = [
  { to: '/', label: 'Status', name: 'Facility Status', icon: <ChartGlyph size={32} />, end: true },
  { to: '/session', label: 'Log', name: 'Test in Progress', icon: <AddGlyph size={32} /> },
  { to: '/archive', label: 'Archive', name: 'Archive', icon: <HistoryGlyph size={32} /> },
  {
    to: '/library',
    label: 'Library',
    name: 'Protocol Library',
    icon: <SquatIcon size={24} title="" />,
  },
  { to: '/calibration', label: 'Calib', name: 'Calibration', icon: <SettingsGlyph size={32} /> },
];

export function BottomNav() {
  return (
    <nav className="px-nav" aria-label="Main">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className="px-nav__tile"
          aria-label={item.name}
        >
          <span className="px-nav__icon">{item.icon}</span>
          <span className="px-nav__label" aria-hidden="true">
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
