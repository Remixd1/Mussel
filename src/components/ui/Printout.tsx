import type { ReactNode } from 'react';

export interface PrintoutProps {
  title: string;
  subtitle?: string;
  /** Seed for the fake barcode + code line (e.g. a session id). */
  code?: string;
  children?: ReactNode;
  className?: string;
}

/** Lab test-report card for session summaries: header band, rows, barcode. */
export function Printout({ title, subtitle, code, children, className }: PrintoutProps) {
  return (
    <article className={['px-printout', className].filter(Boolean).join(' ')}>
      <header>
        <div className="px-printout__head">{title}</div>
        {subtitle ? <div className="px-printout__sub">{subtitle}</div> : null}
      </header>
      <div className="px-printout__body">
        {children}
        {code ? (
          <footer>
            <Barcode seed={code} />
            <div className="px-printout__code">{code.slice(0, 12).toUpperCase()}</div>
          </footer>
        ) : null}
      </div>
    </article>
  );
}

export function PrintoutRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="px-printout__row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function PrintoutRule() {
  return <hr className="px-printout__rule" />;
}

/** 1-bit bars derived deterministically from the seed. Decorative only. */
function Barcode({ seed }: { seed: string }) {
  const bars: { x: number; w: number }[] = [];
  let h = 2166136261;
  let x = 0;
  for (let i = 0; x < 92; i++) {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    const w = (h % 3) + 1;
    if (i % 2 === 0) bars.push({ x, w });
    x += w + ((h >> 4) % 2);
  }
  return (
    <svg
      className="px-printout__barcode"
      viewBox="0 0 96 20"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {bars.map((b, i) => (
        <rect key={i} x={b.x + 2} y={0} width={b.w} height={20} fill="var(--ink)" />
      ))}
    </svg>
  );
}
