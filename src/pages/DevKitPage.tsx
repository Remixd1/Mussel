/**
 * Hidden visual QA route (/dev/kit): every icon at every size and every UI
 * kit component, in the current theme. Not linked from the app.
 */
import { useState } from 'react';
import {
  GLYPH_IDS,
  GLYPH_REGISTRY,
  MusselLogo,
  PICTOGRAM_IDS,
  PICTOGRAM_REGISTRY,
  type GlyphSize,
  type MusselSize,
  type PictogramSize,
} from '../components/icons';
import {
  Modal,
  NumberStepper,
  PictoTile,
  PixelButton,
  PixelCard,
  PixelInput,
  Printout,
  PrintoutRow,
  PrintoutRule,
  ProgressMeter,
} from '../components/ui';
import { ANNOUNCER, type CopyKey } from '../copy/announcer';
import { AnnouncerContext, useCopy } from '../hooks/useCopy';
import { useToast } from '../hooks/useToast';
import { AddGlyph, CheckGlyph, DeleteGlyph } from '../components/icons';

const PICTO_SIZES: PictogramSize[] = [24, 48, 72, 96];
const GLYPH_SIZES: GlyphSize[] = [16, 32, 48];
const MUSSEL_SIZES: MusselSize[] = [32, 64, 96, 128];
type Theme = 'system' | 'light' | 'dark';

function setTheme(theme: Theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

export default function DevKitPage() {
  const [theme, setThemeState] = useState<Theme>(
    (document.documentElement.dataset.theme as Theme | undefined) ?? 'system',
  );
  const [announcerOn, setAnnouncerOn] = useState(true);

  return (
    <AnnouncerContext.Provider value={announcerOn}>
      <div className="px-stack">
        <h1>Dev Kit</h1>
        <PixelCard className="px-row">
          <span className="px-display">Theme</span>
          {(['system', 'light', 'dark'] as const).map((t) => (
            <PixelButton
              key={t}
              variant={theme === t ? 'primary' : 'secondary'}
              aria-pressed={theme === t}
              onClick={() => {
                setTheme(t);
                setThemeState(t);
              }}
            >
              {t}
            </PixelButton>
          ))}
          <PixelButton
            variant="secondary"
            aria-pressed={announcerOn}
            onClick={() => setAnnouncerOn((v) => !v)}
          >
            Announcer {announcerOn ? 'on' : 'off'}
          </PixelButton>
        </PixelCard>

        <IconsSection />
        <ButtonsSection />
        <TilesSection />
        <InputsSection />
        <FeedbackSection />
        <PrintoutSection />
        <CopySection />
        <ScanlineSection />
      </div>
    </AnnouncerContext.Provider>
  );
}

function IconsSection() {
  return (
    <>
      <h2>Mascot</h2>
      <PixelCard className="px-row" style={{ alignItems: 'flex-end' }}>
        {MUSSEL_SIZES.map((s) => (
          <figure key={s} style={{ margin: 0, textAlign: 'center' }}>
            <MusselLogo size={s} />
            <figcaption className="px-muted">{s}</figcaption>
          </figure>
        ))}
      </PixelCard>

      <h2>Pictograms</h2>
      <PixelCard style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>id</th>
              {PICTO_SIZES.map((s) => (
                <th key={s}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PICTOGRAM_IDS.map((id) => {
              const Icon = PICTOGRAM_REGISTRY[id];
              return (
                <tr key={id} style={{ borderTop: '2px dashed var(--grid)' }}>
                  <td style={{ paddingRight: 12 }}>{id}</td>
                  {PICTO_SIZES.map((s) => (
                    <td key={s} style={{ padding: 6, verticalAlign: 'middle' }}>
                      <Icon size={s} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </PixelCard>

      <h2>UI glyphs</h2>
      <PixelCard style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {GLYPH_IDS.map((id) => {
              const Glyph = GLYPH_REGISTRY[id];
              return (
                <tr key={id} style={{ borderTop: '2px dashed var(--grid)' }}>
                  <td style={{ paddingRight: 12 }}>{id}</td>
                  {GLYPH_SIZES.map((s) => (
                    <td key={s} style={{ padding: 6 }}>
                      <Glyph size={s} title={id} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </PixelCard>
    </>
  );
}

function ButtonsSection() {
  return (
    <>
      <h2>Buttons</h2>
      <PixelCard className="px-stack">
        <div className="px-row">
          <PixelButton>Primary</PixelButton>
          <PixelButton variant="secondary">Secondary</PixelButton>
          <PixelButton variant="danger">Danger</PixelButton>
          <PixelButton disabled>Disabled</PixelButton>
        </div>
        <div className="px-row">
          <PixelButton icon={<AddGlyph />}>Add</PixelButton>
          <PixelButton variant="secondary" icon={<CheckGlyph />} aria-label="Done" />
          <PixelButton variant="danger" icon={<DeleteGlyph />} aria-label="Delete" />
        </div>
        <PixelButton block>Start test session</PixelButton>
      </PixelCard>
    </>
  );
}

function TilesSection() {
  const [active, setActive] = useState<string>('squat');
  return (
    <>
      <h2>Picto tiles</h2>
      <PixelCard className="px-row" style={{ alignItems: 'flex-start' }}>
        {PICTO_SIZES.map((s) => (
          <PictoTile key={s} icon="deadlift" size={s} label={`${s}px`} />
        ))}
      </PixelCard>
      <PixelCard className="px-row">
        {(['squat', 'bench', 'pullup', 'run'] as const).map((id) => (
          <PictoTile
            key={id}
            icon={id}
            size={48}
            label={id}
            active={active === id}
            onClick={() => setActive(id)}
          />
        ))}
      </PixelCard>
    </>
  );
}

function InputsSection() {
  const [weight, setWeight] = useState<number | null>(135);
  const [reps, setReps] = useState<number | null>(8);
  const [name, setName] = useState('');
  return (
    <>
      <h2>Inputs</h2>
      <PixelCard className="px-stack">
        <PixelInput
          label="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Subject"
        />
        <NumberStepper label="Weight" value={weight} onChange={setWeight} step={5} suffix="lb" />
        <NumberStepper label="Reps" value={reps} onChange={setReps} step={1} />
        <p className="px-muted px-num">
          weight={String(weight)} reps={String(reps)}
        </p>
      </PixelCard>
    </>
  );
}

function FeedbackSection() {
  const toast = useToast();
  const copy = useCopy();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0.6);
  return (
    <>
      <h2>Toast / Modal / Meter</h2>
      <PixelCard className="px-stack">
        <div className="px-row">
          <PixelButton variant="secondary" onClick={() => toast.show(copy('set.done'))}>
            Toast
          </PixelButton>
          <PixelButton
            variant="secondary"
            onClick={() => toast.show(copy('pr.hit'), { tone: 'signal', icon: 'pr' })}
          >
            PR toast
          </PixelButton>
          <PixelButton
            variant="secondary"
            onClick={() => toast.show(copy('offline'), { tone: 'alarm', icon: 'form-warning' })}
          >
            Alarm toast
          </PixelButton>
          <PixelButton
            variant="secondary"
            onClick={() =>
              toast.show(copy('update.ready'), {
                durationMs: 0,
                action: { label: 'Reload', onClick: () => undefined },
              })
            }
          >
            Update toast
          </PixelButton>
          <PixelButton variant="danger" onClick={() => setOpen(true)}>
            Modal
          </PixelButton>
        </div>
        <ProgressMeter value={progress} label="Recovery interval" />
        <ProgressMeter value={progress} label="Recovery interval" tone="signal" />
        <div className="px-row">
          <PixelButton variant="secondary" onClick={() => setProgress((p) => Math.max(0, p - 0.1))}>
            -10%
          </PixelButton>
          <PixelButton variant="secondary" onClick={() => setProgress((p) => Math.min(1, p + 0.1))}>
            +10%
          </PixelButton>
        </div>
      </PixelCard>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm"
        actions={
          <>
            <PixelButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </PixelButton>
            <PixelButton variant="danger" onClick={() => setOpen(false)}>
              Discard
            </PixelButton>
          </>
        }
      >
        <p>{copy('session.discardConfirm')}</p>
      </Modal>
    </>
  );
}

function PrintoutSection() {
  return (
    <>
      <h2>Printout</h2>
      <Printout
        title="Test Session Report"
        subtitle="Subject #0417 / 2026-09-27"
        code="bkl-7f3a9c2e"
      >
        <PrintoutRow label="Back Squat" value="3 x 5 @ 225" />
        <PrintoutRow label="Bench Press" value="3 x 8 @ 155" />
        <PrintoutRow label="Barbell Row" value="3 x 8 @ 135" />
        <PrintoutRule />
        <PrintoutRow label="Volume" value="12,345 lb" />
        <PrintoutRow label="Duration" value="58 min" />
        <PrintoutRule />
        <div className="px-row">
          <PictoTile icon="pr" size={24} title="" />
          <span>ANOMALY: Back Squat e1RM</span>
        </div>
      </Printout>
    </>
  );
}

function CopySection() {
  const copy = useCopy();
  return (
    <>
      <h2>Announcer copy</h2>
      <PixelCard>
        {(Object.keys(ANNOUNCER) as CopyKey[]).map((key) => (
          <PrintoutRow
            key={key}
            label={<span className="px-muted">{key}</span>}
            value={copy(key)}
          />
        ))}
      </PixelCard>
    </>
  );
}

function ScanlineSection() {
  return (
    <>
      <h2>Scanlines</h2>
      <div
        className="app-header px-scanlines"
        style={{ position: 'relative', border: '4px solid var(--ink)' }}
      >
        <MusselLogo size={32} title="" />
        <span className="app-header__wordmark">MUSSEL</span>
      </div>
    </>
  );
}
