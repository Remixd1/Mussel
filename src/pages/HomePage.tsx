import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PlayGlyph } from '../components/icons';
import { Card } from '../components/ui';
import { useCopy } from '../hooks/useCopy';
import { useNow } from '../hooks/useNow';
import { useProfile } from '../hooks/useProfile';
import { usePrograms } from '../hooks/usePrograms';
import { useActiveSession, useSessions } from '../hooks/useWorkoutData';
import { weekStats } from '../lib/calc/stats';
import { formatWeight } from '../lib/calc/units';
import { FriendsFeed } from '../features/home/FriendsFeed';
import { ThemeToggle } from '../features/home/ThemeToggle';
import '../features/home/home.css';

/** Facility Status: kept simple. Start/resume, this week, friends. */
export default function HomePage() {
  const copy = useCopy();
  const profile = useProfile();
  const now = useNow(60_000);
  const active = useActiveSession();
  const sessions = useSessions(60);
  const programs = usePrograms();

  const stats = weekStats(sessions.status === 'ready' ? sessions.data : [], now);
  const program =
    programs.status === 'ready'
      ? programs.data.find((p) => p.id === profile.activeProgramId)
      : undefined;
  const inProgress = active.status === 'ready' ? active.data : null;

  return (
    <div className="px-stack">
      <div className="home-head">
        <div>
          <p className="px-display">Subject #{profile.subjectNumber}</p>
          <h1>Facility Status</h1>
        </div>
        <ThemeToggle />
      </div>

      {inProgress ? (
        <Link to="/workout" className="resume-banner">
          <span>
            <span className="px-display">Test in progress</span>
            <span className="resume-banner__title">{inProgress.title}</span>
          </span>
          <span className="resume-banner__go">Resume</span>
        </Link>
      ) : (
        <Link to="/workout" className="px-btn px-btn--primary px-btn--block">
          <PlayGlyph size={20} /> Start workout
        </Link>
      )}

      <Card className="week-widget" aria-label="This week">
        <p className="px-display">This week</p>
        <div className="week-widget__grid">
          <div className="stat">
            <span className="stat__value px-num">{stats.workouts}</span>
            <span className="stat__label">{stats.workouts === 1 ? 'workout' : 'workouts'}</span>
          </div>
          <div className="stat">
            <span className="stat__value px-num">{stats.sets}</span>
            <span className="stat__label">{stats.sets === 1 ? 'set' : 'sets'}</span>
          </div>
          <div className="stat stat--wide">
            <span className="stat__value px-num">
              {formatWeight(stats.volumeKg, profile.units).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </span>
            <span className="stat__label">{profile.units} volume</span>
          </div>
        </div>
        <hr className="px-rule" />
        <dl className="week-widget__facts">
          <div>
            <dt>Last workout</dt>
            <dd>{stats.lastWorkout ? format(stats.lastWorkout, 'EEE d MMM') : '—'}</dd>
          </div>
          <div>
            <dt>Program</dt>
            <dd>{program ? program.name : <Link to="/upload">Upload one</Link>}</dd>
          </div>
        </dl>
        {sessions.status === 'ready' && !sessions.data.length ? (
          <p className="px-muted home-empty">{copy('home.empty')}</p>
        ) : null}
      </Card>

      <FriendsFeed />
    </div>
  );
}
