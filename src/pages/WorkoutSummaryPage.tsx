import { Link, useParams } from 'react-router-dom';
import { useSession } from '../hooks/useWorkoutData';
import { SessionReport } from '../features/workout/SessionReport';
import '../features/workout/workout.css';

/** A finished workout as a lab report. */
export default function WorkoutSummaryPage() {
  const { id = '' } = useParams();
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
      <Link to="/workout" className="px-btn px-btn--primary px-btn--block">
        Done
      </Link>
    </div>
  );
}
