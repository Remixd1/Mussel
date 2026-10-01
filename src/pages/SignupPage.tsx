import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, TextField } from '../components/ui';
import { useCopy } from '../hooks/useCopy';
import { useUsernameAvailability, type Availability } from '../hooks/useUsernameAvailability';
import { signUp } from '../lib/auth';
import { authErrorMessage } from '../lib/authErrors';
import { isFirebaseAvailable } from '../lib/firebase';
import {
  PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateUsername,
} from '../lib/validation';
import { FirebaseUnavailableNotice } from '../features/auth/FirebaseUnavailableNotice';
import '../features/auth/auth.css';

type Field = 'email' | 'username' | 'password' | 'confirm';
type Errors = Partial<Record<Field, string | null>>;

const AVAILABILITY_HINT: Record<Availability, string> = {
  idle: `${USERNAME_MIN}-${USERNAME_MAX} letters, numbers, or underscores.`,
  checking: 'Checking...',
  available: 'Available.',
  taken: 'Taken. Try another.',
  unknown: `${USERNAME_MIN}-${USERNAME_MAX} letters, numbers, or underscores.`,
};

export default function SignupPage() {
  const copy = useCopy();
  const [values, setValues] = useState({ email: '', username: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const availability = useUsernameAvailability(values.username);

  const validate = (field: Field, v = values): string | null => {
    switch (field) {
      case 'email':
        return validateEmail(v.email);
      case 'username':
        return validateUsername(v.username);
      case 'password':
        return validatePassword(v.password);
      case 'confirm':
        return validatePasswordConfirm(v.password, v.confirm);
    }
  };

  const set = (field: Field) => (e: ChangeEvent<HTMLInputElement>) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    // Once a field has shown an error, re-check it as the user fixes it.
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: validate(field, next) }));
  };

  const blur = (field: Field) => () => {
    if (values[field]) setErrors((prev) => ({ ...prev, [field]: validate(field) }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {
      email: validate('email'),
      username:
        validate('username') ?? (availability === 'taken' ? 'That username is taken.' : null),
      password: validate('password'),
      confirm: validate('confirm'),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setFormError(null);
    setBusy(true);
    try {
      // On success the guard routes to Subject Intake; this page unmounts.
      await signUp({ email: values.email, username: values.username, password: values.password });
    } catch (err) {
      const message = authErrorMessage(err);
      if (message === 'That username is taken.') setErrors((p) => ({ ...p, username: message }));
      else setFormError(message);
      setBusy(false);
    }
  };

  const usernameHint =
    errors.username || !values.username ? AVAILABILITY_HINT.idle : AVAILABILITY_HINT[availability];

  return (
    <section className="auth-page">
      <h1>{copy('signUp.title')}</h1>
      {!isFirebaseAvailable ? <FirebaseUnavailableNotice /> : null}

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={values.email}
          onChange={set('email')}
          onBlur={blur('email')}
          error={errors.email}
        />
        <TextField
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={USERNAME_MAX}
          value={values.username}
          onChange={set('username')}
          onBlur={blur('username')}
          error={errors.username ?? (availability === 'taken' ? 'That username is taken.' : null)}
          hint={availability === 'taken' ? undefined : usernameHint}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={set('password')}
          onBlur={blur('password')}
          error={errors.password}
          hint={errors.password ? undefined : `At least ${PASSWORD_MIN} characters.`}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={values.confirm}
          onChange={set('confirm')}
          onBlur={blur('confirm')}
          error={errors.confirm}
        />
        {formError ? (
          <p className="form-error" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" block disabled={busy || !isFirebaseAvailable}>
          {busy ? 'Registering...' : 'Create account'}
        </Button>
      </form>

      <div className="auth-links">
        <p>
          Already on file? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
}
