import { useEffect, useMemo, useState } from 'react';
import { defaultChart, DEFAULT_CHART_NAME } from '../lib/calc/effort';
import {
  subscribeFriendRequests,
  subscribeFriends,
  subscribeFriendSessions,
} from '../lib/db/friends';
import type { WithId } from '../lib/db/programs';
import { subscribeRoutines } from '../lib/db/routines';
import {
  subscribeActiveSession,
  subscribeMaxes,
  subscribeSession,
  subscribeSessions,
} from '../lib/db/sessions';
import type {
  ActiveSession,
  ChartData,
  EstimatedMax,
  Friend,
  FriendRequest,
  Routine,
  Session,
} from '../lib/types';
import { useUser } from './useAuth';
import { useLive } from './useLive';
import { useProfile } from './useProfile';
import { useCharts } from './usePrograms';

export function useRoutines() {
  const { uid } = useUser();
  return useLive<WithId<Routine>[]>(`routines:${uid}`, (ok, err) =>
    subscribeRoutines(uid, ok, err),
  );
}

export function useActiveSession() {
  const { uid } = useUser();
  return useLive<ActiveSession | null>(`active:${uid}`, (ok, err) =>
    subscribeActiveSession(uid, ok, err),
  );
}

export function useSessions(count: number) {
  const { uid } = useUser();
  return useLive<WithId<Session>[]>(`sessions:${uid}:${count}`, (ok, err) =>
    subscribeSessions(uid, count, ok, err),
  );
}

export function useSession(id: string) {
  const { uid } = useUser();
  return useLive<WithId<Session> | null>(`session:${uid}:${id}`, (ok, err) =>
    subscribeSession(uid, id, ok, err),
  );
}

export function useMaxes() {
  const { uid } = useUser();
  return useLive<Record<string, EstimatedMax>>(`maxes:${uid}`, (ok, err) =>
    subscribeMaxes(uid, ok, err),
  );
}

export function useFriends() {
  const { uid } = useUser();
  return useLive<WithId<Friend>[]>(`friends:${uid}`, (ok, err) => subscribeFriends(uid, ok, err));
}

export function useFriendRequests(direction: 'incoming' | 'outgoing') {
  const { uid } = useUser();
  return useLive<WithId<FriendRequest>[]>(`requests:${direction}:${uid}`, (ok, err) =>
    subscribeFriendRequests(uid, direction, ok, err),
  );
}

export interface FeedItem {
  friendUid: string;
  username: string;
  session: WithId<Session>;
}

/** Friends' latest finished sessions, merged newest first. */
export function useFriendsFeed(perFriend = 3): { loading: boolean; items: FeedItem[] } {
  const friends = useFriends();
  const list = useMemo(() => (friends.status === 'ready' ? friends.data : []), [friends]);
  const key = list.map((f) => f.id).join(',');
  const [byFriend, setByFriend] = useState<Record<string, WithId<Session>[]>>({});

  useEffect(() => {
    const unsubs = list.map((f) =>
      subscribeFriendSessions(
        f.id,
        perFriend,
        (sessions) => setByFriend((prev) => ({ ...prev, [f.id]: sessions })),
        // A friend who just removed us: their sessions simply stop showing.
        () => setByFriend((prev) => ({ ...prev, [f.id]: [] })),
      ),
    );
    return () => unsubs.forEach((u) => u());
    // `key` captures the friend list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, perFriend]);

  const items = useMemo(
    () =>
      list
        .flatMap((f) =>
          (byFriend[f.id] ?? []).map((session) => ({
            friendUid: f.id,
            username: f.username,
            session,
          })),
        )
        .sort((a, b) => b.session.startedAt.toMillis() - a.session.startedAt.toMillis()),
    [list, byFriend],
  );
  return { loading: friends.status === 'loading', items };
}

/** The chart to use for suggestions: the active uploaded chart, else the built-in one. */
export function useActiveChart(): { chart: ChartData; name: string; id: string | null } {
  const profile = useProfile();
  const charts = useCharts();
  return useMemo(() => {
    const id = profile.activeChartId;
    const found =
      id && charts.status === 'ready' ? charts.data.find((c) => c.id === id) : undefined;
    return found
      ? { chart: found, name: found.name, id: found.id }
      : { chart: defaultChart(), name: DEFAULT_CHART_NAME, id: null };
  }, [profile.activeChartId, charts]);
}
