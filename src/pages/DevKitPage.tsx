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
} from '../components/icons';
import {
  Modal,
  NumberStepper,
  PictoTile,
  Button,
  Card,
  TextField,
  Printout,
  PrintoutRow,
  PrintoutRule,
  ProgressMeter,
} from '../components/ui';
import { ANNOUNCER, type CopyKey } from '../copy/announcer';
import { AnnouncerContext, useCopy } from '../hooks/useCopy';
import { useToast } from '../hooks/useToast';
import { AddGlyph, CheckGlyph, DeleteGlyph } from '../components/icons';

const PICTO_SIZES = [24, 48, 72, 96];
const GLYPH_SIZES = [20, 26, 40];
const MUSSEL_SIZES = [32, 64, 96, 128];
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
        <Card className="px-row">
          <span className="px-display">Theme</span>
          {(['system', 'light', 'dark'] as const).map((t) => (
            <Button
              key={t}
              variant={theme === t ? 'primary' : 'secondary'}
              aria-pressed={theme === t}
              onClick={() => {
                setTheme(t);
                setThemeState(t);
              }}
            >
              {t}
            </Button>
          ))}
          <Button
            variant="secondary"
            aria-pressed={announcerOn}
            onClick={() => setAnnouncerOn((v) => !v)}
          >
            Announcer {announcerOn ? 'on' : 'off'}
          </Button>
        </Card>

        <IconsSection />
        <ButtonsSection />
        <TilesSection />
        <InputsSection />
        <FeedbackSection />
        <PrintoutSection />
        <CopySection />
      </div>
    </AnnouncerContext.Provider>
  );
}

function IconsSection() {
  return (
    <>
      <h2>Mascot</h2>
      <Card className="px-row" style={{ alignItems: 'flex-end' }}>
        {MUSSEL_SIZES.map((s) => (
          <figure key={s} style={{ margin: 0, textAlign: 'center' }}>
            <MusselLogo size={s} />
            <figcaption className="px-muted">{s}</figcaption>
          </figure>
        ))}
      </Card>

      <h2>Pictograms</h2>
      <Card style={{ overflowX: 'auto' }}>
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
      </Card>

      <h2>UI glyphs</h2>
      <Card style={{ overflowX: 'auto' }}>
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
      </Card>
    </>
  );
}

function ButtonsSection() {
  return (
    <>
      <h2>Buttons</h2>
      <Card className="px-stack">
        <div className="px-row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="px-row">
          <Button icon={<AddGlyph />}>Add</Button>
          <Button variant="secondary" icon={<CheckGlyph />} aria-label="Done" />
          <Button variant="danger" icon={<DeleteGlyph />} aria-label="Delete" />
        </div>
        <Button block>Start test session</Button>
      </Card>
    </>
  );
}

function TilesSection() {
  const [active, setActive] = useState<string>('squat');
  return (
    <>
      <h2>Picto tiles</h2>
      <Card className="px-row" style={{ alignItems: 'flex-start' }}>
        {PICTO_SIZES.map((s) => (
          <PictoTile key={s} icon="deadlift" size={s} label={`${s}px`} />
        ))}
      </Card>
      <Card className="px-row">
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
      </Card>
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
      <Card className="px-stack">
        <TextField
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
      </Card>
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
      <Card className="px-stack">
        <div className="px-row">
          <Button variant="secondary" onClick={() => toast.show(copy('set.done'))}>
            Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.show(copy('chart.saved'), { tone: 'signal', icon: 'pr' })}
          >
            Signal toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.show(copy('offline'), { tone: 'alarm', icon: 'form-warning' })}
          >
            Alarm toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.show(copy('update.ready'), {
                durationMs: 0,
                action: { label: 'Reload', onClick: () => undefined },
              })
            }
          >
            Update toast
          </Button>
          <Button variant="danger" onClick={() => setOpen(true)}>
            Modal
          </Button>
        </div>
        <ProgressMeter value={progress} label="Recovery interval" />
        <ProgressMeter value={progress} label="Recovery interval" tone="signal" />
        <div className="px-row">
          <Button variant="secondary" onClick={() => setProgress((p) => Math.max(0, p - 0.1))}>
            -10%
          </Button>
          <Button variant="secondary" onClick={() => setProgress((p) => Math.min(1, p + 0.1))}>
            +10%
          </Button>
        </div>
      </Card>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm"
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Discard
            </Button>
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
      <Card>
        {(Object.keys(ANNOUNCER) as CopyKey[]).map((key) => (
          <PrintoutRow
            key={key}
            label={<span className="px-muted">{key}</span>}
            value={copy(key)}
          />
        ))}
      </Card>
    </>
  );
}
