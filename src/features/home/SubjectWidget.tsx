import { Link } from 'react-router-dom';
import { MusselLogo } from '../../components/icons';
import { useProfile } from '../../hooks/useProfile';

const DEFAULT_CHART_NAME = 'BKL Standard Issue';

/** Square widget: Subject #, username, effort scale, rest, and the active chart. */
export function SubjectWidget() {
  const profile = useProfile();
  return (
    <Link to="/profile" className="px-card subject-widget" aria-label="Your subject file">
      <span className="px-display">Subject</span>
      <span className="subject-widget__number px-num">#{profile.subjectNumber}</span>
      <span className="subject-widget__name">{profile.username}</span>
      <hr className="px-rule" />
      <span className="subject-widget__facts">
        <span>{profile.effortScale.toUpperCase()}</span>
        <span className="subject-widget__divider" aria-hidden="true" />
        <span>Rest {profile.defaultRestSec}s</span>
      </span>
      <span className="subject-widget__foot">
        <MusselLogo size={26} title="" />
        <span className="subject-widget__chart">
          {profile.activeChartId ? 'Custom chart' : DEFAULT_CHART_NAME}
        </span>
      </span>
    </Link>
  );
}
