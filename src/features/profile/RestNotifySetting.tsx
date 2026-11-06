import { useState } from 'react';
import { Toggle } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import {
  disableRestNotifications,
  enableRestNotifications,
  notifySupport,
  restNotificationsOn,
} from '../../lib/restNotify';

/** Per-device opt-in for the lock-screen rest timer (CLAUDE.md §5.4). */
export function RestNotifySetting() {
  const toast = useToast();
  const [on, setOn] = useState(restNotificationsOn);
  const support = notifySupport();

  if (support !== 'supported') {
    return (
      <div className="px-toggle px-toggle--static">
        <span className="px-toggle__text">
          <span>Lock-screen rest timer</span>
          <span className="px-muted">
            {support === 'needs-install'
              ? 'On iPhone, add Mussel to your Home Screen first (Share, then Add to Home Screen).'
              : "This browser can't show notifications."}
          </span>
        </span>
      </div>
    );
  }

  return (
    <Toggle
      label="Lock-screen rest timer"
      description="Time left between sets, shown as a notification"
      checked={on}
      onChange={async (next) => {
        if (!next) {
          disableRestNotifications();
          setOn(false);
          return;
        }
        const result = await enableRestNotifications();
        if (result === 'granted') {
          setOn(true);
        } else {
          toast.show(
            'Notifications are blocked for Mussel. Allow them in your phone settings, then try again.',
            { tone: 'alarm', durationMs: 6000 },
          );
        }
      }}
    />
  );
}
