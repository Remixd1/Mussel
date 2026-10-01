import { useActiveSession } from '../hooks/useWorkoutData';
import { ActiveWorkout } from '../features/workout/ActiveWorkout';
import { WorkoutStart } from '../features/workout/WorkoutStart';
import '../features/upload/upload.css';
import '../features/workout/workout.css';

/** Workout tab: the workout in progress, or ways to start one. */
export default function WorkoutPage() {
  const active = useActiveSession();
  if (active.status === 'loading') return <p className="px-muted">Loading…</p>;
  if (active.status === 'ready' && active.data) {
    // Keyed by start time: a new workout gets fresh local state.
    return <ActiveWorkout key={active.data.startedAt.toMillis()} initial={active.data} />;
  }
  return <WorkoutStart />;
}
