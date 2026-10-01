import {
  CalendarGlyph,
  ClipboardGlyph,
  FriendsGlyph,
  HistoryGlyph,
  ProfileGlyph,
  SettingsGlyph,
  UploadGlyph,
  WorkoutGlyph,
} from '../components/icons';
import { AppTile, Card } from '../components/ui';
import { useCopy } from '../hooks/useCopy';
import { StatusWidget } from '../features/home/StatusWidget';
import { SubjectWidget } from '../features/home/SubjectWidget';
import '../features/home/home.css';

/** Facility Status: a widget board with home-screen style shortcuts. */
export default function HomePage() {
  const copy = useCopy();
  return (
    <div className="px-stack">
      <h1 className="visually-hidden">Facility Status</h1>
      <StatusWidget />

      <nav className="home-grid" aria-label="Shortcuts">
        <SubjectWidget />
        <AppTile to="/workout" label="Workout" Icon={WorkoutGlyph} />
        <AppTile to="/upload" label="Upload" Icon={UploadGlyph} />
        <AppTile to="/profile#history" label="History" Icon={HistoryGlyph} />
        <AppTile to="/profile#friends" label="Friends" Icon={FriendsGlyph} />
        <AppTile to="/profile#workouts" label="Workouts" Icon={ClipboardGlyph} />
        <AppTile to="/upload" label="Charts" Icon={CalendarGlyph} />
        <AppTile to="/profile#calibration" label="Settings" Icon={SettingsGlyph} />
        <AppTile to="/profile" label="Profile" Icon={ProfileGlyph} />
      </nav>

      <Card>
        <p className="px-display">Last test session</p>
        <p className="home-empty">{copy('home.empty')}</p>
      </Card>
    </div>
  );
}
