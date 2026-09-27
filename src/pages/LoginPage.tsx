import { MusselLogo } from '../components/icons';
import { PixelButton } from '../components/ui';
import { useCopy } from '../hooks/useCopy';

export default function LoginPage() {
  const copy = useCopy();
  return (
    <section className="px-stack" style={{ alignItems: 'center', textAlign: 'center' }}>
      <MusselLogo size={128} />
      <h1 style={{ fontSize: 24 }}>MUSSEL</h1>
      <p className="px-muted">Bivalve Kinetics Laboratory</p>
      <h2>{copy('signIn.title')}</h2>
      <PixelButton disabled title="Sign-in arrives in phase 1">
        Sign in with Google
      </PixelButton>
      <p className="px-muted">Results may vary. Gains may not.</p>
    </section>
  );
}
