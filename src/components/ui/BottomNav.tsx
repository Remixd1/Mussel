import type { ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeGlyph, ProfileGlyph, UploadGlyph, WorkoutGlyph, type GlyphProps } from '../icons';

interface NavItem {
  to: string;
  label: string;
  /** Themed screen name, announced to assistive tech. */
  name: string;
  Icon: ComponentType<GlyphProps>;
  end?: boolean;
}

const ITEMS: NavItem[] = [
  { to: '/', label: 'Home', name: 'Home: Facility Status', Icon: HomeGlyph, end: true },
  { to: '/workout', label: 'Workout', name: 'Workout: Test in Progress', Icon: WorkoutGlyph },
  { to: '/upload', label: 'Upload', name: 'Upload: Chart Intake', Icon: UploadGlyph },
  { to: '/profile', label: 'Profile', name: 'Profile: Subject File', Icon: ProfileGlyph },
];

/** The dock: four framed icon tiles on a grey rounded bar. */
export function BottomNav() {
  return (
    <nav className="px-nav" aria-label="Main">
      <div className="px-nav__dock">
        {ITEMS.map(({ to, label, name, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="px-nav__tile" aria-label={name}>
            <span className="px-nav__plate">
              <span className="px-nav__icon">
                <Icon size={26} />
              </span>
            </span>
            <span className="px-nav__label" aria-hidden="true">
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
