import { Link } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';
import { Card } from '../../components/ui';
import { useProfile } from '../../hooks/useProfile';
import { useFriends, useFriendsFeed } from '../../hooks/useWorkoutData';
import { formatWeight } from '../../lib/calc/units';
import type { SessionEntry } from '../../lib/types';

/** The heaviest completed set of an exercise, e.g. "3 × 100 kg". */
function topSet(e: SessionEntry, units: 'lb' | 'kg'): string | null {
  const done = e.sets.filter((s) => s.done);
  if (!done.length) return null;
  const best = done.reduce((a, b) => ((b.weightKg ?? 0) > (a.weightKg ?? 0) ? b : a));
  return best.weightKg != null
    ? `${best.reps ?? '?'} × ${formatWeight(best.weightKg, units)} ${units}`
    : `${best.reps ?? '?'} reps`;
}

/** Home: friends' latest finished workouts. */
export function FriendsFeed() {
  const { units } = useProfile();
  const friends = useFriends();
  const feed = useFriendsFeed(3);
  const hasFriends = friends.status === 'ready' && friends.data.length > 0;

  return (
    <section aria-labelledby="friends-feed-heading" className="px-stack">
      <h2 id="friends-feed-heading">Friends' workouts</h2>
      {friends.status === 'ready' && !hasFriends ? (
        <Card>
          <p>
            No associates on file. <Link to="/profile#friends">Add friends</Link> to see their
            workouts here.
          </p>
        </Card>
      ) : null}
      {hasFriends && !feed.loading && !feed.items.length ? (
        <p className="px-muted">Your friends haven't logged a workout yet.</p>
      ) : null}
      <ul className="feed">
        {feed.items.slice(0, 10).map(({ friendUid, username, session }) => (
          <li key={`${friendUid}:${session.id}`}>
            <Card className="feed-card">
              <div className="feed-card__head">
                <span className="feed-card__user">{username}</span>
                <span className="px-muted">
                  {formatDistanceToNowStrict(session.startedAt.toDate(), { addSuffix: true })}
                </span>
              </div>
              <p className="feed-card__title">{session.title}</p>
              <ul className="feed-card__lifts px-num">
                {session.entries.slice(0, 4).map((e, i) => {
                  const top = topSet(e, units);
                  return top ? (
                    <li key={i}>
                      <span>{e.exerciseName}</span>
                      <span>{top}</span>
                    </li>
                  ) : null;
                })}
              </ul>
              <p className="px-muted feed-card__totals">
                {session.totals.setCount} sets · {formatWeight(session.totals.volumeKg, units)}{' '}
                {units}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
