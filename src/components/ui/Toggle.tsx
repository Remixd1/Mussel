export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Optional extra line under the label. */
  description?: string;
}

/** On/off switch: a full-width row, so the whole thing is the tap target. */
export function Toggle({ label, checked, onChange, description }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="px-toggle"
      onClick={() => onChange(!checked)}
    >
      <span className="px-toggle__text">
        <span>{label}</span>
        {description ? <span className="px-muted">{description}</span> : null}
      </span>
      <span className="px-toggle__switch" aria-hidden="true">
        <span className="px-toggle__knob" />
      </span>
    </button>
  );
}
