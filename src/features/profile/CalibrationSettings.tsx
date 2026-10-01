import { SegmentedControl, Toggle } from '../../components/ui';
import { useUser } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useToast } from '../../hooks/useToast';
import { updateProfile, type ProfilePatch } from '../../lib/db/profile';
import { EFFORT_OPTIONS, REST_OPTIONS, THEME_OPTIONS, UNIT_OPTIONS } from './settingsOptions';

/** Settings save on change. Offline-safe: the local snapshot updates at once. */
export function CalibrationSettings() {
  const user = useUser();
  const profile = useProfile();
  const toast = useToast();

  const save = (patch: ProfilePatch) => {
    updateProfile(user.uid, patch).catch(() =>
      toast.show("Couldn't save that setting. Try again.", { tone: 'alarm' }),
    );
  };

  return (
    <div className="px-stack">
      <SegmentedControl
        label="Units"
        value={profile.units}
        options={UNIT_OPTIONS}
        onChange={(units) => save({ units })}
      />
      <SegmentedControl
        label="Effort scale"
        value={profile.effortScale}
        options={EFFORT_OPTIONS}
        onChange={(effortScale) => save({ effortScale })}
      />
      <SegmentedControl
        label="Default rest"
        value={profile.defaultRestSec}
        options={REST_OPTIONS}
        onChange={(defaultRestSec) => save({ defaultRestSec })}
      />
      <SegmentedControl
        label="Theme"
        value={profile.theme}
        options={THEME_OPTIONS}
        onChange={(theme) => save({ theme })}
      />
      <div>
        <Toggle
          label="Announcer"
          description="Lab-themed messages"
          checked={profile.announcerOn}
          onChange={(announcerOn) => save({ announcerOn })}
        />
        <Toggle
          label="Sound"
          description="8-bit blips"
          checked={profile.soundOn}
          onChange={(soundOn) => save({ soundOn })}
        />
        <Toggle
          label="Scanlines"
          description="CRT effect on the header"
          checked={profile.scanlinesOn}
          onChange={(scanlinesOn) => save({ scanlinesOn })}
        />
      </div>
    </div>
  );
}
