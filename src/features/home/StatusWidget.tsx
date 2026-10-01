import { format } from 'date-fns';
import { CalendarGlyph, MusselLogo, TimerGlyph } from '../../components/icons';
import { ProgressMeter } from '../../components/ui';
import { useNow } from '../../hooks/useNow';
import { dayElapsed, weekElapsed } from '../../lib/calc/time';

/** Facility clock: badge, date, big time, and how much of the week/day has passed. */
export function StatusWidget() {
  const now = useNow();
  return (
    <section className="px-card status-widget" aria-label="Facility clock">
      <div className="status-widget__brand">
        <MusselLogo size={38} title="" />
        <span className="status-widget__wordmark">
          <span>Mussel</span>
          <span>Bivalve Kinetics Lab</span>
        </span>
      </div>
      <p className="status-widget__date">{format(now, 'MMM d, yyyy')}</p>
      <p className="status-widget__time px-num">
        <time dateTime={now.toISOString()}>{format(now, 'h:mm a')}</time>
      </p>
      <div className="status-widget__meters">
        <ProgressMeter
          label="Week elapsed"
          tone="signal"
          value={weekElapsed(now)}
          icon={<CalendarGlyph size={28} />}
        />
        <ProgressMeter
          label="Day elapsed"
          tone="tide"
          value={dayElapsed(now)}
          icon={<TimerGlyph size={28} />}
        />
      </div>
    </section>
  );
}
