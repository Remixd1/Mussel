import { useState, type FormEvent } from 'react';
import { Modal, PixelButton, PixelInput } from '../../components/ui';
import { useCopy } from '../../hooks/useCopy';
import { useToast } from '../../hooks/useToast';
import { deleteAccount, signOut } from '../../lib/auth';
import { authErrorMessage } from '../../lib/authErrors';

type Dialog = 'none' | 'logout' | 'delete-confirm' | 'delete-password';

/** Log out, and the two-step, password-confirmed account deletion. */
export function AccountActions() {
  const copy = useCopy();
  const toast = useToast();
  const [dialog, setDialog] = useState<Dialog>('none');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setDialog('none');
    setPassword('');
    setError(null);
  };

  const onLogout = async () => {
    setBusy(true);
    try {
      // The guard sends the user to /login once Auth reports signed out.
      await signOut();
    } catch (err) {
      toast.show(authErrorMessage(err), { tone: 'alarm' });
      setBusy(false);
    }
  };

  const onDelete = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(password);
      toast.show(copy('account.deleted'));
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="px-stack">
      <PixelButton block variant="secondary" onClick={() => setDialog('logout')}>
        Log out
      </PixelButton>
      <PixelButton block variant="danger" onClick={() => setDialog('delete-confirm')}>
        Delete account
      </PixelButton>

      <Modal
        open={dialog === 'logout'}
        onClose={close}
        title="Log out"
        actions={
          <>
            <PixelButton variant="secondary" onClick={close} disabled={busy}>
              Cancel
            </PixelButton>
            <PixelButton onClick={onLogout} disabled={busy}>
              {busy ? 'Leaving...' : 'Log out'}
            </PixelButton>
          </>
        }
      >
        <p>{copy('signOut.confirm')}</p>
      </Modal>

      <Modal
        open={dialog === 'delete-confirm'}
        onClose={close}
        title="Delete account"
        actions={
          <>
            <PixelButton variant="secondary" onClick={close}>
              Cancel
            </PixelButton>
            <PixelButton variant="danger" onClick={() => setDialog('delete-password')}>
              Continue
            </PixelButton>
          </>
        }
      >
        <p>{copy('delete.confirm')}</p>
        <p>Your account, username, charts, and workouts will be erased.</p>
      </Modal>

      <Modal open={dialog === 'delete-password'} onClose={close} title="Confirm deletion">
        <form className="px-stack" onSubmit={onDelete} noValidate>
          <p>Enter your password to permanently delete your account.</p>
          <PixelInput
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />
          <div className="px-modal__actions">
            <PixelButton variant="secondary" onClick={close} disabled={busy}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" variant="danger" disabled={busy}>
              {busy ? 'Deleting...' : 'Delete forever'}
            </PixelButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
