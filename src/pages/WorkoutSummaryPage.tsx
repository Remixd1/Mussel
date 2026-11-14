import { Link, useLocation, useParams } from 'react-router-dom';
import { useSession } from '../hooks/useWorkoutData';
import { SaveAsRoutine } from '../features/workout/SaveAsRoutine';
import { SessionReport } from '../features/workout/SessionReport';
import '../features/workout/workout.css';

/** A finished workout as a lab report. */
export default function WorkoutSummaryPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  // Offered once, straight after finishing (not when reopened from history).
  const justFinished = (location.state as { finished?: boolean } | null)?.finished === true;
  const live = useSession(id);
  if (live.status === 'loading') return <p className="px-muted">Loading…</p>;
  if (live.status === 'error' || !live.data) {
    return (
      <div className="px-stack">
        <h1>Report not found</h1>
        <Link to="/workout">Back to Workout</Link>
      </div>
    );
  }
  return (
    <div className="px-stack">
      <h1>Test Report</h1>
      <SessionReport session={live.data} />
      {justFinished ? <SaveAsRoutine session={live.data} /> : null}
      <Link to="/workout" className="px-btn px-btn--primary px-btn--block">
        Done
      </Link>
    </div>
  );
}
