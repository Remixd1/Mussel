import { PICTOGRAM_REGISTRY, type PictogramId, type PictogramSize } from '../icons';

export interface PictoTileProps {
  icon: PictogramId;
  size?: PictogramSize;
  /** Visible label under the tile (Press Start 2P). Also used as the icon title. */
  label?: string;
  /** Accessible title when there is no visible label. */
  title?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/** A pictogram in a square signage frame. Interactive when `onClick` is set. */
export function PictoTile({
  icon,
  size = 48,
  label,
  title,
  active = false,
  onClick,
  className,
}: PictoTileProps) {
  const Icon = PICTOGRAM_REGISTRY[icon];
  const classes = ['px-tile', size === 24 && 'px-tile--sm', active && 'px-tile--active', className]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <span className="px-tile__frame">
        {/* When labelled visibly, the label names the tile; the icon is decorative. */}
        <Icon size={size} title={label ? '' : (title ?? undefined)} />
      </span>
      {label ? <span className="px-tile__label">{label}</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} aria-pressed={active}>
        {content}
      </button>
    );
  }
  return <span className={classes}>{content}</span>;
}
