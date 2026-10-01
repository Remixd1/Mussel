import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MusselLogo } from '../components/icons';
import { Button, TextField } from '../components/ui';
import { useCopy } from '../hooks/useCopy';
import { useToast } from '../hooks/useToast';
import { sendPasswordReset, signIn } from '../lib/auth';
import { authErrorMessage } from '../lib/authErrors';
import { isFirebaseAvailable } from '../lib/firebase';
import { validateEmail } from '../lib/validation';
import { FirebaseUnavailableNotice } from '../features/auth/FirebaseUnavailableNotice';
import '../features/auth/auth.css';

export default function LoginPage() {
  const copy = useCopy();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const badEmail = validateEmail(email);
    setEmailError(badEmail);
    if (badEmail) return;
    if (!password) {
      setError('Enter your password.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // On success the guard redirects; this page unmounts.
      await signIn(email, password);
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const onForgot = async () => {
    const badEmail = validateEmail(email);
    if (badEmail) {
      setEmailError('Enter your email above, then tap "Forgot password?" again.');
      return;
    }
    setEmailError(null);
    setBusy(true);
    try {
      await sendPasswordReset(email);
      toast.show(copy('reset.sent'));
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-page__brand">
        <MusselLogo size={112} title="" />
        <p className="auth-page__wordmark">Mussel</p>
        <p className="auth-page__lab">Bivalve Kinetics Laboratory</p>
      </div>
      <h1>{copy('signIn.title')}</h1>
      {!isFirebaseAvailable ? <FirebaseUnavailableNotice /> : null}

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" block disabled={busy || !isFirebaseAvailable}>
          {busy ? 'Checking...' : 'Sign in'}
        </Button>
      </form>

      <div className="auth-links">
        <button
          type="button"
          className="link-btn"
          onClick={onForgot}
          disabled={busy || !isFirebaseAvailable}
        >
          Forgot password?
        </button>
        <p>
          New subject? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
