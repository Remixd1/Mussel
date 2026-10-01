import { useState, type FormEvent } from 'react';
import { Button, Modal, TextField } from '../../components/ui';
import { useUser } from '../../hooks/useAuth';
import { useCopy } from '../../hooks/useCopy';
import { useProfile } from '../../hooks/useProfile';
import { useToast } from '../../hooks/useToast';
import { useFriendRequests, useFriends } from '../../hooks/useWorkoutData';
import {
  acceptFriendRequest,
  deleteFriendRequest,
  FriendError,
  removeFriend,
  sendFriendRequest,
} from '../../lib/db/friends';
import type { WithId } from '../../lib/db/programs';
import type { Friend } from '../../lib/types';

const NETWORK = "Couldn't reach the lab. Check your connection and try again.";

/** Add friends by username, answer requests, and manage the list (CLAUDE.md §5.9). */
export function FriendsPanel() {
  const user = useUser();
  const profile = useProfile();
  const copy = useCopy();
  const toast = useToast();
  const friends = useFriends();
  const incoming = useFriendRequests('incoming');
  const outgoing = useFriendRequests('outgoing');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<WithId<Friend> | null>(null);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await sendFriendRequest({ uid: user.uid, username: profile.username }, name);
      toast.show(`Request sent to ${name.trim().replace(/^@/, '')}.`);
      setName('');
    } catch (err) {
      setError(err instanceof FriendError ? err.message : NETWORK);
    } finally {
      setBusy(false);
    }
  };

  const fail = () => toast.show(NETWORK, { tone: 'alarm' });
  const friendList = friends.status === 'ready' ? friends.data : [];
  const inList = incoming.status === 'ready' ? incoming.data : [];
  const outList = outgoing.status === 'ready' ? outgoing.data : [];

  return (
    <div className="px-stack">
      <form className="friend-add" onSubmit={onAdd} noValidate>
        <TextField
          label="Add by username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="username"
          error={error}
        />
        <Button type="submit" disabled={busy || !name.trim()}>
          {busy ? 'Sending…' : 'Send'}
        </Button>
      </form>

      {inList.length ? (
        <div className="px-stack">
          <p className="px-display">Requests</p>
          <ul className="friend-list">
            {inList.map((r) => (
              <li key={r.id} className="friend-row">
                <span className="friend-row__name">{r.fromUsername}</span>
                <span className="friend-row__actions">
                  <Button onClick={() => acceptFriendRequest(user.uid, r).catch(fail)}>
                    Accept
                  </Button>
                  <Button variant="secondary" onClick={() => deleteFriendRequest(r).catch(fail)}>
                    Decline
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {outList.length ? (
        <div className="px-stack">
          <p className="px-display">Waiting on</p>
          <ul className="friend-list">
            {outList.map((r) => (
              <li key={r.id} className="friend-row">
                <span className="friend-row__name">{r.toUsername}</span>
                <span className="friend-row__actions">
                  <Button variant="secondary" onClick={() => deleteFriendRequest(r).catch(fail)}>
                    Cancel
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="px-stack">
        <p className="px-display">Friends</p>
        {friendList.length ? (
          <ul className="friend-list">
            {friendList.map((f) => (
              <li key={f.id} className="friend-row">
                <span className="friend-row__name">{f.username}</span>
                <span className="friend-row__actions">
                  <Button variant="secondary" onClick={() => setRemoving(f)}>
                    Remove
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-muted">{copy('profile.noFriends')}</p>
        )}
        <p className="px-muted friend-privacy">
          Friends can see your finished workouts (including notes). Nothing else is shared.
        </p>
      </div>

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove friend"
        actions={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (removing) removeFriend(user.uid, removing.id).catch(fail);
                setRemoving(null);
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        <p>Remove {removing?.username}? You'll stop seeing each other's workouts.</p>
      </Modal>
    </div>
  );
}
