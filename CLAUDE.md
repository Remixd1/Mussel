# MUSSEL: Project Spec

> **Mussel** (as in the shellfish, pronounced like "muscle")
> A pixel-retro, mobile-only workout tracker built around **your own RPE/RIR chart**, styled as the testing wing of a fictional research lab: the **Bivalve Kinetics Laboratory**.
> Tagline: *"Results may vary. Gains may not."*

---

## 0. Instructions for Claude Code

- This file is the source of truth. It lives at the repo root as `CLAUDE.md`.
- The owner is on **Windows (PowerShell)**. Any terminal commands you give the owner to run manually must be PowerShell-compatible. npm scripts must work cross-platform (no bash-only syntax like `rm -rf` or `VAR=value cmd` in `package.json`; use packages like `rimraf` or `cross-env` if needed).
- Things only the owner can do (creating the Firebase project, enabling Google sign-in, pasting config values, logging into the Firebase CLI) should be listed as a clear checklist when you reach them. Stub them with placeholders so the build and tests still run before they're done.
- Firebase config values go in a `.env.local` file read via `import.meta.env.VITE_FIREBASE_*`. Commit a `.env.example` with the keys and empty values. Never commit `.env.local`.
- Work phase by phase (Section 12). Finish each phase's acceptance criteria before starting the next. Commit at the end of every phase with a clear message.
- Do not add dependencies beyond Section 2 without a stated reason in the commit message.
- Follow the IP guardrails in Section 15 strictly. All visual assets are original.
- **Commits are authored by the owner only. Do not add `Co-Authored-By` or any AI attribution trailers to commit messages or PR descriptions.**
- **Mobile only, portrait only.** Every screen is designed for phone widths 320px to 480px. There is no desktop or tablet layout (Section 3.9).

---

## 1. Overview

| Item | Decision |
|---|---|
| Platform | Installable PWA for phones (iOS Safari + Android Chrome via "Add to Home Screen"). Portrait only. |
| Core idea | The user uploads their own **RPE/RIR-to-%1RM chart** as a CSV. Mussel uses it to prescribe target weights and to estimate 1RMs from logged sets. |
| Users | Owner + small friend group. Each user's data is private to them. No shared/social features. |
| Cost target | $0 (Firebase Spark plan) |
| Auth | Google sign-in via Firebase Auth |
| Storage | Firestore, with offline persistence so the app works in a gym with no signal |
| Hosting | Firebase Hosting |
| Navigation | Four bottom tabs: **Home, Workout, Upload, Profile** |

**Core loop:** upload a chart (or use the built-in default), start a workout, pick an exercise, choose target reps and RPE/RIR, get a target weight from the chart, log what you actually did (weight, reps, RPE/RIR), rest timer runs between sets, finish, and your estimated 1RMs update from the chart.

---

## 2. Tech Stack (locked)

- **React 18 + Vite**, **TypeScript**
- **React Router v6**
- **Firebase JS SDK v11**: Auth, Firestore (`persistentLocalCache` + `persistentMultipleTabManager`)
- **vite-plugin-pwa** (Workbox) for manifest + service worker
- **date-fns** for date handling
- **Vitest** + **@testing-library/react** for unit/component tests
- **@firebase/rules-unit-testing** + Firebase Emulator Suite for security rule tests
- Fonts from Google Fonts (OFL licensed): **Press Start 2P** (headings/labels), **VT323** (body/numbers)

No UI component library and no chart library. CSV parsing is hand-written (no parsing dependency). The pixel look is built by hand with CSS tokens.

---

## 3. Design System

### 3.1 Concept

The app is the in-house fitness terminal of the **Bivalve Kinetics Laboratory (BKL)**, a fictional, slightly absurd research facility that studies "kinetic output of human subjects." Visual language: 1-bit clinical safety signage + chunky 8-bit UI + dot-matrix printouts. Tone: deadpan, dry, lightly sarcastic, never mean.

The user is addressed as **Subject #XXXX** (4-digit number generated at onboarding, e.g. `#0417`).

### 3.2 Color Tokens

Define in `src/styles/tokens.css` as CSS custom properties.

| Token | Light (default) | Dark | Use |
|---|---|---|---|
| `--bg` | `#EEF0E6` pearl | `#14161A` ink | App background |
| `--surface` | `#FFFFFF` | `#1E2A44` shell navy | Cards, tiles |
| `--ink` | `#14161A` | `#EEF0E6` | Text, icon strokes, borders |
| `--shell` | `#1E2A44` | `#34466B` | Primary buttons, header bar |
| `--tide` | `#3FA7A0` | `#4FC2BA` | Accent, active states |
| `--signal` | `#F2A541` | `#F2A541` | Targets, warnings, timer |
| `--alarm` | `#D9534F` | `#E36A66` | Destructive actions, parse errors |
| `--grid` | `#C9CCBF` | `#2A3550` | Dividers, chart-table grid, faint lab-grid background |

Theme follows `prefers-color-scheme`, with a manual override in Profile stored on the user profile.

### 3.3 Typography

- **Press Start 2P**: headings, nav labels, button labels, big numbers on the timer. 12px minimum for headings and buttons; 8 to 10px allowed only for nav labels and tile captions. Always uppercase. It is wide, so keep strings short.
- **VT323**: body text, inputs, set rows, chart tables. Base size 20px (it renders small), line-height 1.2.
- Numbers use `font-variant-numeric: tabular-nums` so columns line up.
- Fallback stack: `'Press Start 2P', ui-monospace, monospace` and `'VT323', ui-monospace, monospace`.

### 3.4 Pixel Rendering Rules

- `border-radius: 0` everywhere. No rounded corners.
- Borders are solid, 2px (small elements) or 4px (cards, tiles).
- Shadows are hard offsets, never blurred: `box-shadow: 4px 4px 0 var(--ink)`. Pressed buttons translate `2px 2px` and shrink the shadow to `2px 2px`.
- Icons and raster images: `image-rendering: pixelated`; SVGs use `shape-rendering="crispEdges"`.
- Icons render only at integer multiples of their grid (24px grid: 24, 48, 72, 96px; 16px glyphs: 16, 32, 48px).
- Animations use `steps()` timing, not smooth easing.
- Background: faint 8px lab grid using `--grid` (20% opacity).
- Optional CRT scanline overlay on the header only, toggleable, off when `prefers-reduced-motion`.

### 3.5 Pictogram Icon System (all original)

Style brief: square signage tile, 4px ink border, `--surface` fill, a single stick-figure pictogram in ink, plus one directional arrow or motion cue. Generic ISO safety-sign energy, drawn on a pixel grid.

**Construction rules**
- 24x24 grid SVG, `viewBox="0 0 24 24"`, built from `<rect>` pixels.
- Stick figure: head is a 4x4 block, torso and limbs are 2px wide, joints bend at 45 or 90 degrees only.
- Equipment drawn as simple blocks. Motion arrows: 2px shaft, 3-step pixel arrowhead. Speed lines: 1px dashes.
- One accent color max per icon (`--signal` for PR/warning icons only; everything else is pure ink).
- Pixel data lives in `src/components/icons/art.ts`; components in `src/components/icons/`, each accepting `size` and `title`. `<PictoTile icon="squat" />` draws the bordered tile.

**Pictograms (24px):** `squat`, `bench`, `deadlift`, `ohp`, `pullup`, `row`, `curl`, `pushup`, `lunge`, `plank`, `run`, `cycle`, `core`, `stretch`, `machine`, `rest`, `pr`, `form-warning`, `bodyweight`.

**Mascot:** `mussel`, 32x32, navy shell with pearl highlight, slightly open. Generates the PWA icons (`icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png` 180x180, `favicon.png`) with nearest-neighbor scaling via `npm run icons`.

**UI glyphs (16px, no tile):** `home`, `workout`, `upload`, `profile` (bottom nav), `add`, `delete`, `edit`, `history`, `chart`, `settings`, `check`, `timer`, `back`.

### 3.6 Core UI Components (`src/components/ui/`)

- `PixelButton`: variants `primary` (shell fill, pearl text), `secondary` (surface fill, ink border), `danger` (alarm). Hard shadow, press-down effect, min 44x44px tap target. Labels may wrap on narrow screens.
- `PixelCard`: surface fill, 4px border, hard shadow.
- `PictoTile`: bordered icon tile, optional caption underneath.
- `PixelInput` / `NumberStepper`: large VT323 numerals, `-` / `+` buttons (weight steps 5 lb or 2.5 kg, reps 1, RPE 0.5, RIR 1). `inputMode="decimal"` for the phone number pad.
- `Toast`: slides in with `steps(4)`, shows announcer copy (Section 3.7).
- `Modal`: full-width sheet from the bottom, hard border top.
- `BottomNav`: **4 tiles: Home, Workout, Upload, Profile**, active tile inverted (ink fill, pearl icon).
- `Printout`: dot-matrix receipt card for workout summaries: perforated edges, VT323 text, dashed separators, fake barcode footer.
- `ProgressMeter`: segmented block bar (10 segments), fills in steps.

### 3.7 Voice and Copy

Themed copy goes in **headers, empty states, toasts, and confirmations**. Form labels and inputs stay plain ("Reps", "Weight", "RPE") so the app is fast to use mid-set.

All copy lives in `src/copy/announcer.ts` as keyed strings, with a plain alternative for each. Profile has an **Announcer** toggle: off = plain copy everywhere.

Rules: deadpan and dry; jokes are about the lab, bureaucracy, and effort. **Never** comment on the user's body, weight, appearance, or eating. No guilt-tripping for missed days.

| Key | Themed | Plain |
|---|---|---|
| `signIn.title` | "IDENTIFY YOURSELF, SUBJECT." | "Sign in" |
| `home.empty` | "No sessions on file. The equipment is getting lonely." | "No workouts yet." |
| `session.start` | "Test session initiated. Please lift responsibly." | "Workout started." |
| `session.saved` | "Session logged. Your data has been filed, laminated, and ignored by management." | "Workout saved." |
| `session.discardConfirm` | "Abort this test? Results will be shredded." | "Discard this workout?" |
| `set.done` | "Trial recorded." | "Set logged." |
| `rest.done` | "Recovery interval concluded. Resume lifting." | "Rest over." |
| `chart.saved` | "Chart accepted. The lab will now pretend it understood it." | "Chart saved." |
| `chart.invalid` | "Chart rejected. The lab could not read your handwriting." | "Couldn't read that file." |
| `chart.offChart` | "Off the chart. Literally. No estimate available." | "Outside the chart's range." |
| `delete.confirm` | "Deleting is permanent. The lab will pretend this never happened." | "Delete permanently?" |
| `offline` | "Facility link lost. Results will transmit when connection is restored." | "Offline. Changes will sync later." |
| `streak.none` | "Welcome back, Subject. The lab did not notice you were gone." | "Welcome back." |
| `rotate.prompt` | "Please return the device to its upright testing position." | "Rotate your phone to portrait." |

### 3.8 Motion and Sound

- Stepped animations only; respect `prefers-reduced-motion` by disabling non-essential animation.
- Sound (off by default, toggle in Profile): 8-bit blips via Web Audio (square wave, no audio files). Events: set done (short blip), rest done (two-tone).
- Haptics: `navigator.vibrate` on rest-timer completion where supported (Android). iOS ignores it silently; don't error.

### 3.9 Mobile-Only Layout + Portrait Lock

- **Target widths:** 320px (iPhone SE 1st gen) up to 480px. Everything must fit at 320px with no horizontal scroll; test at 320, 360, 375, 390, 414, 430.
- Above 480px the app renders in a centered 480px column (header, content, nav, toasts all constrained). No wider layouts are designed.
- Use `100dvh`, and respect `env(safe-area-inset-*)` on all edges (notch, home indicator). Viewport meta includes `viewport-fit=cover`.
- **Portrait only:** manifest `orientation: "portrait"`; in standalone mode try `screen.orientation.lock('portrait')` (Android honors it; catch the rejection elsewhere). iOS can't lock, so when the device is in landscape, cover the app with a full-screen "rotate" overlay (`rotate.prompt` copy). Detect with `screen.orientation.type` (not the `(orientation)` media query, which flips when the Android keyboard opens), falling back to the media query only where `screen.orientation` is missing.
- Inputs use a font size ≥ 16px so iOS doesn't zoom on focus.

---

## 4. Terminology Map

| Concept | Nav label | Themed header |
|---|---|---|
| Home / dashboard | HOME | **Facility Status** |
| Active workout | WORKOUT | **Test in Progress** (a workout is a **Test Session**) |
| Chart upload + management | UPLOAD | **Chart Intake** |
| Profile + settings | PROFILE | **Subject File** (settings section: **Calibration**) |
| Set | | **Trial** (headers only; row labels say "Set") |
| RPE/RIR chart | | **Effort Chart** |
| Estimated 1RM | | **Estimated Max** |
| Rest timer | | **Recovery Interval** |
| User | | **Subject #XXXX** |

---

## 5. Features

### 5.1 Auth + Onboarding

- Google sign-in (Firebase Auth). Try `signInWithPopup`, fall back to `signInWithRedirect` (installed iOS PWAs block popups). `authDomain` must match the Firebase Hosting domain the app is served from. Test on a real iPhone in standalone mode.
- First sign-in creates `users/{uid}` with defaults and routes to `/onboarding`:
  - Display name (prefilled from Google)
  - Units: lb or kg
  - Effort scale: RPE or RIR (how the user prefers to enter effort)
  - Default rest time: 60 / 90 / 120 / 180s
  - Generates `subjectNumber` (random 4 digits, display-only)
- Returning users skip onboarding.

**Acceptance:** sign in/out works on Android Chrome, iOS Safari, and the iOS installed PWA. Profile doc is created once.

### 5.2 Upload: Effort Charts (the core feature)

An effort chart maps **(reps, RPE)** to **% of 1RM**. RIR and RPE are interchangeable: `RPE = 10 - RIR`.

**CSV format** (a downloadable template is offered on the Upload tab):

```
Reps,10,9.5,9,8.5,8,7.5,7
1,100,97.8,95.5,93.9,92.2,90.7,89.2
2,95.5,93.9,92.2,90.7,89.2,87.8,86.3
...
```

- First row: a label cell, then the column headers. Each following row: a row header, then percentages.
- **Scale:** if the label cell contains `RIR` (case-insensitive), effort values are RIR; otherwise RPE. Examples: `Reps`, `RPE`, `Reps\RPE`, `Reps/RIR`, `RIR`.
- **Orientation:** if the label cell starts with `Reps` (or is empty), rows are rep counts and columns are effort. If it starts with `RPE` or `RIR`, rows are effort and columns are rep counts, and the grid is transposed on import.
- Rep counts must be positive integers; effort values must be multiples of 0.5.
- Percentages may be written `87`, `87%`, or `0.87`. If every value is ≤ 1, treat all as fractions; otherwise all as percents. Mixed styles are an error.
- Delimiters: comma, semicolon (European Excel exports), or tab, auto-detected. Strip a UTF-8 BOM. Support quoted fields. Accept `,` as a decimal separator only when the delimiter is `;` or tab.
- Blank cells are allowed (not every chart fills every combination) and stored as `null`.
- Limits: file ≤ 100 KB, 1 to 30 rep rows, 1 to 21 effort columns, effort values within RPE 1 to 10 (or RIR 0 to 9).

**Validation:** hard errors (unreadable file, no numeric grid, percentages outside (0, 100], duplicate rows/columns, mixed percent styles) block saving and are listed with row/column references. Soft warnings (percent doesn't decrease as reps rise, or as RPE falls) are shown but don't block saving.

**Flow:** pick a `.csv` file (`<input type="file" accept=".csv,text/csv">`) → parsed preview grid (scrolls horizontally inside its card if wide) with errors/warnings → name the chart → save. Saved charts are listed; one is **active** (used by Workout). Charts can be renamed, set active, or deleted.

**Default chart:** before any upload, a built-in formula chart is active: effective reps `n = reps + (10 - RPE)`; `% = 1` if `n ≤ 1`, else `1 / (1 + n / 30)` (Epley with reps in reserve), reps 1 to 12, RPE 6 to 10 in 0.5 steps. Labeled "BKL Standard Issue" and marked as an approximation. It is not stored in Firestore.

**Lookup:** `chartPercent(chart, reps, rpe)` returns the percentage, linearly interpolating between neighbouring effort columns and neighbouring rep rows when the exact value isn't in the chart. Outside the chart's range, or when needed cells are blank, it returns `null` (UI shows `chart.offChart`).

**Acceptance:** the template round-trips (download, re-upload, identical grid); comma, semicolon, and tab CSVs exported from Excel, Google Sheets, and Numbers all parse; transposed charts parse; every hard error is reported with a location.

### 5.3 Workout: Test in Progress

- Start from Home ("START TEST SESSION") or the Workout tab when no session is active.
- Add exercise from the seed list (Section 5.6) or type a custom name.
- Each exercise block: `PictoTile`, name, **estimated max** (editable), and set rows: `Set # | Weight | Reps | RPE (or RIR) | [done ✓]`.
- **Target weight:** each set row can take a target (reps + RPE/RIR). Target weight = estimated max × `chartPercent`, rounded to the plate step (5 lb / 2.5 kg). Shown as a faded prefill the user can accept or overwrite.
- **Estimated max from a logged set:** `weight / chartPercent(reps, rpe)` using the active chart. The best estimate from the session's completed working sets updates that exercise's estimated max on finish.
- New set rows prefill from the previous set. Warmup toggle (warmups don't update estimated maxes).
- Tapping ✓ marks the set done and auto-starts the Recovery Interval.
- Reorder/remove exercises; delete sets. Session notes field.
- **Persistence:** the in-progress session is saved to `users/{uid}/meta/activeSession` (debounced ~1s) so a refresh, crash, or phone lock never loses it. On app open, resume it.
- **Finish:** writes the session doc, updates estimated maxes, deletes `activeSession`, shows the `Printout` summary. **Discard:** confirm modal, deletes `activeSession`.

**Acceptance:** a full workout can be logged fully offline (airplane mode), survives closing the app mid-session, and syncs when back online.

### 5.4 Recovery Interval / Rest Timer

- Big Press Start 2P countdown in a sticky bar above the nav, plus a `ProgressMeter`.
- **Timestamp-based:** store `endsAt`; display `endsAt - now`, so it stays correct after the phone sleeps.
- Controls: -15s, +15s, skip. On completion: toast (`rest.done`), optional sound + vibration.
- Default duration from profile.

### 5.5 Home: Facility Status

- Start or resume a test session (resume banner if `activeSession` exists).
- Active effort chart card (name, size, link to Upload).
- Estimated maxes for recently trained exercises.
- Last session `Printout` preview. Empty state: `home.empty`.

### 5.6 Exercise List

Seed list in code at `src/data/exercises.ts` (id, name, icon), used by the Workout exercise picker. No library screen and no custom-exercise collection: custom names are typed in the picker and stored on the session entry.

| id | Name | Icon |
|---|---|---|
| `back-squat` | Back Squat | `squat` |
| `front-squat` | Front Squat | `squat` |
| `deadlift` | Deadlift | `deadlift` |
| `rdl` | Romanian Deadlift | `deadlift` |
| `bench-press` | Bench Press | `bench` |
| `incline-bench` | Incline Bench Press | `bench` |
| `ohp` | Overhead Press | `ohp` |
| `pullup` | Pull-up | `pullup` |
| `barbell-row` | Barbell Row | `row` |
| `bicep-curl` | Bicep Curl | `curl` |
| `dip` | Dip | `pushup` |
| `lunge` | Walking Lunge | `lunge` |
| `leg-press` | Leg Press | `machine` |
| `lat-pulldown` | Lat Pulldown | `machine` |

### 5.7 Profile: Subject File

- Display name, Subject #, member since.
- **Calibration:** units (lb/kg, converts display everywhere instantly), effort scale (RPE/RIR), default rest time, theme (System/Light/Dark), announcer copy, sound, scanlines.
- Sign out. Delete account + all data (confirm twice, batched delete of subcollections, then `deleteUser`).

### 5.8 PWA + Offline

- Manifest: name "Mussel", `display: standalone`, `orientation: portrait`, theme/background colors from tokens, mascot icons including maskable.
- `apple-touch-icon` and `apple-mobile-web-app-status-bar-style` meta for iOS.
- **iOS install hint:** on iOS Safari when not standalone (`navigator.standalone !== true`), a dismissible banner ("Tap Share, then Add to Home Screen"). Dismissal remembered in localStorage.
- Offline banner via `navigator.onLine` + `online`/`offline` events, showing `offline` copy.
- Service worker `registerType: 'autoUpdate'`; "New lab firmware available, reload?" toast when an update is waiting.

---

## 6. Data Model (Firestore)

All user data lives under `users/{uid}`. Weights are stored canonically in **kg** (full precision, never rounded on write) and converted for display. Effort is stored canonically as **RPE** (RIR input is converted: `RPE = 10 - RIR`). Timestamps use Firestore `Timestamp`.

```ts
// users/{uid}
interface UserProfile {
  displayName: string;
  subjectNumber: string;        // "0417"
  units: 'lb' | 'kg';
  effortScale: 'rpe' | 'rir';   // input/display preference only
  defaultRestSec: number;       // 90
  theme: 'system' | 'light' | 'dark';
  announcerOn: boolean;         // true
  soundOn: boolean;             // false
  scanlinesOn: boolean;         // false
  activeChartId: string | null; // null = built-in default chart
  createdAt: Timestamp;
  onboardedAt: Timestamp | null;
}

// users/{uid}/charts/{chartId}
// Firestore can't nest arrays directly, so rows are maps holding arrays.
interface EffortChart {
  name: string;
  sourceScale: 'rpe' | 'rir';   // how the uploaded file labelled effort
  rpeValues: number[];          // column headers, canonical RPE, descending
  rows: { reps: number; percents: (number | null)[] }[];  // fractions 0..1, aligned to rpeValues
  sourceFileName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// users/{uid}/sessions/{sessionId}
interface Session {
  startedAt: Timestamp;
  endedAt: Timestamp;
  chartId: string | null;       // chart used for targets (null = default)
  notes: string;
  entries: SessionEntry[];
  totals: { volumeKg: number; setCount: number; durationSec: number };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface SessionEntry {
  exerciseId: string | null;    // seed id, or null for a custom name
  exerciseName: string;
  iconId: string;
  sets: SetRow[];
}

interface SetRow {
  weightKg?: number;
  reps?: number;
  rpe?: number;                 // canonical RPE, 0.5 steps
  target?: { reps: number; rpe: number; weightKg: number | null };
  done: boolean;
  isWarmup: boolean;
}

// users/{uid}/meta/activeSession
// Same shape as Session minus endedAt/totals, plus:
//   restTimer: { endsAt: Timestamp | null }

// users/{uid}/maxes/{exerciseKey}   (seed id, or "custom:" + lowercased name)
interface EstimatedMax {
  exerciseName: string;
  e1rmKg: number;
  source: 'manual' | 'session';
  sessionId: string | null;
  updatedAt: Timestamp;
}
```

**Indexes:** `sessions` ordered by `startedAt desc` (single-field, automatic).

---

## 7. Security Rules

`firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /{document=**} {
        allow read, write: if isOwner(userId);
      }
    }

    // Deny everything else by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Rule tests:** with the emulator, verify: user A can read/write own docs; user A cannot read or write user B's docs; unauthenticated requests are denied everywhere.

---

## 8. Routes / Screens

| Route | Tab | Screen | Notes |
|---|---|---|---|
| `/login` | none | Sign In | Mascot, wordmark, `signIn.title`, Google button |
| `/onboarding` | none | Subject Intake | Name, units, effort scale, rest default, shows Subject # |
| `/` | Home | Facility Status | Start/resume, active chart, estimated maxes, last Printout |
| `/workout` | Workout | Test in Progress | Logging UI + rest timer bar; start screen if no active session |
| `/workout/summary/:id` | Workout | Session Printout | Post-finish summary |
| `/upload` | Upload | Chart Intake | Upload CSV, preview, save; list/activate/delete charts; template download |
| `/upload/:chartId` | Upload | Chart Detail | Full grid view, rename, set active, delete |
| `/profile` | Profile | Subject File | Profile + Calibration settings, sign out, delete account |
| `/dev/kit` | none | Dev Kit | Hidden visual QA page |

Route guards: unauthenticated users go to `/login`; authenticated but not onboarded go to `/onboarding`.

---

## 9. Folder Structure

```
mussel/
├── CLAUDE.md
├── firebase.json / .firebaserc / firestore.rules / firestore.indexes.json
├── index.html / vite.config.ts / tsconfig*.json
├── public/                       # PWA icons (generated), licenses/
├── scripts/                      # generate-icons.mjs, run-rules-tests.mjs
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # router + guards
│   ├── styles/                   # tokens.css, base.css, pixel.css
│   ├── copy/announcer.ts
│   ├── data/exercises.ts         # seed exercise list
│   ├── lib/
│   │   ├── firebase.ts           # init, auth helpers
│   │   ├── db/                   # profile.ts, charts.ts, sessions.ts, activeSession.ts, maxes.ts
│   │   ├── calc/                 # pure: units.ts, volume.ts, e1rm.ts, effort.ts (chart lookup, targets, RPE<->RIR)
│   │   ├── csv/                  # pure: parseCsv.ts (tokenizer), parseEffortChart.ts (grid -> chart + errors)
│   │   └── sound.ts
│   ├── hooks/                    # useAuth, useProfile, useActiveSession, useRestTimer, useOnline, useOrientation, useCopy, useToast
│   ├── components/
│   │   ├── ui/                   # UI kit
│   │   ├── icons/                # pictograms, glyphs, mascot, registry
│   │   └── layout/               # AppShell, RotateOverlay
│   ├── features/
│   │   ├── workout/              # ExerciseBlock, SetRow, ExercisePicker, RestTimerBar, FinishModal
│   │   ├── upload/               # ChartDropzone, ChartPreview, ChartList
│   │   ├── home/
│   │   └── profile/
│   └── pages/                    # thin route components
└── tests/
    ├── calc/ csv/ components/ icons/
    └── rules/
```

---

## 10. Key Logic (pure and unit-tested)

- **Units:** `LB_PER_KG = 2.2046226218`. `toKg`, `fromKg`. Display: 1 decimal, trailing `.0` dropped. Plate step: 5 lb / 2.5 kg.
- **Effort:** `rirToRpe(rir) = 10 - rir`, `rpeToRir(rpe) = 10 - rpe`. RPE in 0.5 steps.
- **Chart lookup:** `chartPercent(chart, reps, rpe) => number | null` with bilinear interpolation inside the grid, `null` outside it or across blank cells.
- **Target weight:** `targetWeightKg(e1rmKg, chart, reps, rpe, unit)` = e1RM × percent, rounded to the plate step in the display unit, returned in kg.
- **Estimated max from a set:** `e1rmFromSet(chart, weightKg, reps, rpe) = weightKg / percent`, or `null`.
- **Default chart:** `defaultChart()` built from the formula in Section 5.2.
- **CSV:** `parseCsv(text) => string[][]` (delimiter detection, quotes, BOM, CRLF). `parseEffortChart(rows, fileName) => { chart | null, errors, warnings }`.
- **Volume:** `sum(reps * weightKg)` over sets where `done && !isWarmup`.
- **Session duration:** `endedAt - startedAt`, display capped at 5h.

---

## 11. Offline + Sync Behavior

- Firestore persistent cache handles offline reads/writes; writes queue and sync automatically.
- `serverTimestamp()` resolves late when offline; for ordering, also store client `startedAt` as `Timestamp.fromDate(new Date())`.
- `activeSession` writes are debounced (~1s).
- UI never blocks on a write promise while offline. Update local state optimistically, fire writes without awaiting in UI handlers, surface errors via toast.
- Chart parsing happens entirely on the device; uploading a chart works offline and syncs later.

---

## 12. Build Phases

### Phase 0: Foundation (done)
- Vite + React + TS scaffold, ESLint/Prettier, Firebase config + emulators, PWA manifest/service worker.
- Tokens, base/pixel CSS, UI kit, icon set, mascot, PWA icons, hidden `/dev/kit`.
- Four-tab shell (Home, Workout, Upload, Profile) with placeholder pages; mobile-only layout and portrait lock (Section 3.9).
- Security rules + emulator rule tests.

### Phase 1: Auth + Profile
- Google sign-in (popup + redirect fallback), onboarding, profile doc, route guards.
- Profile tab: settings persisted to the profile, theme applied, sign out.
- **Done when:** sign in/out works on Android and the iOS installed PWA; settings persist and apply instantly.

### Phase 2: Upload (Effort Charts)
- `parseCsv` + `parseEffortChart` + `chartPercent` + default chart, with thorough unit tests.
- Upload tab: file pick, preview grid, errors/warnings, save, list, activate, rename, delete, template download.
- **Done when:** acceptance in Section 5.2 passes, including real exports from Excel, Google Sheets, and Numbers.

### Phase 3: Workout + Home
- Session logging with chart-driven targets and estimated maxes, rest timer, `activeSession` persistence, finish + discard, Printout summary.
- Home tab: start/resume, active chart, estimated maxes, last session.
- **Done when:** a full workout can be logged offline on an iPhone installed PWA and on Android, survives app close mid-session, and syncs.

### Phase 4: Polish + Deploy
- Sound, haptics, scanlines, reduced motion, iOS install banner, update toast, offline banner.
- Accessibility pass (Section 13); Lighthouse mobile: installable, Performance ≥ 90, Accessibility ≥ 95.
- `firebase deploy`; README with live URL and screenshots.

---

## 13. Quality Bar

- **Accessibility:** WCAG AA contrast in both themes; every icon has `title`/`aria-label`; tap targets ≥ 44px; visible focus ring (2px `--tide` outline, offset 2px); timer announcements via `aria-live="polite"`; parse errors announced.
- **Performance:** fonts loaded with `display=swap` and preconnect; route-level code splitting (`React.lazy`) for non-Home tabs; icons are inline SVG.
- **Tests:** unit tests for everything in `lib/calc` and `lib/csv`; rules tests; component tests for `SetRow`, `NumberStepper`, `ChartPreview`, and `useRestTimer` (mock timers).
- **Code style:** ESLint + Prettier; no `any` without a comment; Firestore access only through `src/lib/db/*`.

---

## 14. Non-Goals (for now)

- Desktop/tablet layouts, landscape mode
- Excel/ODS/clipboard import (CSV only for now), program/routine spreadsheets
- Workout history browser, PR tracking, exercise library screen, progress charts, bodyweight log, test plans
- Social features, sharing between users
- Native builds or app store distribution; push notifications
- Integrations with other services (calendars, email, cloud drives)
- Nutrition tracking, AI coaching, payments

---

## 15. IP Guardrails (must follow)

The "science facility" vibe is an **original** theme. This repo is public and goes on a resume, so:

- Do not use any names, logos, characters, quotes, catchphrases, or UI from existing games or franchises. The lab is the **Bivalve Kinetics Laboratory** and nothing else.
- Do not trace, copy, or recreate existing game pictograms or signage. Every icon is drawn from scratch using the construction rules in Section 3.5.
- Do not ship third-party branded RPE charts as defaults. The built-in chart is formula-derived (Section 5.2); users upload their own.
- All copy strings are original (Section 3.7 is the style guide).
- Fonts must be OFL/open-licensed (Press Start 2P and VT323 are). License notices in `public/licenses/`.
- The mascot and wordmark are original.

---

## 16. README Checklist (for the portfolio)

- One-line pitch + live URL + 3 to 4 phone screenshots (Home, Upload preview, Workout with targets + timer, Printout)
- Tech stack and why (PWA to avoid app store fees; Firestore offline persistence for gyms with no signal; hand-written CSV parser)
- Architecture notes: effort-chart model and interpolation, canonical kg/RPE storage, pure calc layer, timestamp-based timer, security rules with emulator tests
- Setup instructions (Firebase project, emulators, env config, deploy)
- License (MIT) + font licenses

---

## 17. Owner Setup Checklist

1. Create a Firebase project at https://console.firebase.google.com (Google Analytics not needed).
2. Add a **Web app** and copy its config values into `.env.local` (use `.env.example` as the template).
3. **Authentication > Sign-in method:** enable Google.
4. **Firestore Database:** create it in production mode, region `northamerica-northeast2` (Toronto) or `nam5`.
5. Log into the Firebase CLI in PowerShell (`firebase-tools` is a dev dependency):
   ```powershell
   npx firebase login
   npx firebase use --add
   ```
6. Install Java (JDK 11+) for the Firestore emulator, e.g. `winget install EclipseAdoptium.Temurin.21.JDK`.
7. Deploy rules: `npx firebase deploy --only firestore:rules`
8. First deploy (Phase 4): `npm run build` then `npx firebase deploy --only hosting`
9. **Authentication > Settings > Authorized domains:** confirm the Hosting domain is listed.
