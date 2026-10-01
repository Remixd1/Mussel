import { format } from 'date-fns';
import { MusselLogo } from '../components/icons';
import { useUser } from '../hooks/useAuth';
import { useCopy } from '../hooks/useCopy';
import { useProfile } from '../hooks/useProfile';
import { AccountActions } from '../features/profile/AccountActions';
import { CalibrationSettings } from '../features/profile/CalibrationSettings';
import { EmptyState, ProfileSection } from '../features/profile/ProfileSection';
import '../features/profile/profile.css';

export default function ProfilePage() {
  const user = useUser();
  const profile = useProfile();
  const copy = useCopy();
  const memberSince = profile.createdAt ? format(profile.createdAt.toDate(), 'MMM yyyy') : null;

  return (
    <div className="px-stack">
      <h1>Subject File</h1>

      <section className="px-card subject-card" aria-label="Subject">
        <MusselLogo size={64} title="" />
        <div className="subject-card__text">
          <p className="subject-card__name">{profile.username}</p>
          <p className="px-num">Subject #{profile.subjectNumber}</p>
          <p className="px-muted subject-card__email">{user.email}</p>
          {memberSince ? <p className="px-muted">On file since {memberSince}</p> : null}
        </div>
      </section>

      <ProfileSection title="Workouts">
        <EmptyState icon="squat" message={copy('profile.noWorkouts')} />
      </ProfileSection>

      <ProfileSection title="History">
        <EmptyState icon="rest" message={copy('profile.noHistory')} />
      </ProfileSection>

      <ProfileSection title="Friends">
        <EmptyState icon="pr" message={copy('profile.noFriends')} />
      </ProfileSection>

      <ProfileSection title="Calibration">
        <CalibrationSettings />
      </ProfileSection>

      <ProfileSection title="Account">
        <AccountActions />
      </ProfileSection>
    </div>
  );
}
