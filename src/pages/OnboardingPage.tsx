import { useState } from 'react';
import { Button, Card, SegmentedControl } from '../components/ui';
import { useUser } from '../hooks/useAuth';
import { useCopy } from '../hooks/useCopy';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../hooks/useToast';
import { completeOnboarding } from '../lib/db/profile';
import type { EffortScale, Units } from '../lib/types';
import { EFFORT_OPTIONS, REST_OPTIONS, UNIT_OPTIONS } from '../features/profile/settingsOptions';
import '../features/auth/auth.css';

export default function OnboardingPage() {
  const user = useUser();
  const profile = useProfile();
  const copy = useCopy();
  const toast = useToast();
  const [units, setUnits] = useState<Units>(profile.units);
  const [effortScale, setEffortScale] = useState<EffortScale>(profile.effortScale);
  const [rest, setRest] = useState(profile.defaultRestSec);

  const onBegin = () => {
    // Don't await: offline, the write only resolves once it syncs. The local
    // snapshot updates at once and the guard moves on to Home.
    completeOnboarding(user.uid, { units, effortScale, defaultRestSec: rest }).catch(() =>
      toast.show("Couldn't save your settings. Try again.", { tone: 'alarm' }),
    );
  };

  return (
    <section className="auth-page">
      <h1>{copy('intake.title')}</h1>
      <Card className="px-stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <p>Welcome, {profile.username}. You have been assigned</p>
        <p className="subject-number">SUBJECT #{profile.subjectNumber}</p>
      </Card>
      <p>{copy('intake.body')}</p>
      <SegmentedControl label="Units" value={units} options={UNIT_OPTIONS} onChange={setUnits} />
      <SegmentedControl
        label="Effort scale"
        value={effortScale}
        options={EFFORT_OPTIONS}
        onChange={setEffortScale}
      />
      <SegmentedControl
        label="Default rest"
        value={rest}
        options={REST_OPTIONS}
        onChange={setRest}
      />
      <Button block onClick={onBegin}>
        Begin testing
      </Button>
    </section>
  );
}
