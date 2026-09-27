# MUSSEL: Project Spec

> **Mussel** (as in the shellfish, pronounced like "muscle")
> A pixel-retro workout tracker styled as the testing wing of a fictional research lab: the **Bivalve Kinetics Laboratory**.
> Tagline: *"Results may vary. Gains may not."*

---

## 0. Instructions for Claude Code

- This file is the source of truth. Put it at the repo root as `CLAUDE.md` (or `docs/SPEC.md` and reference it from `CLAUDE.md`).
- **The repo starts empty** (only this file). Scaffold the whole project from scratch in Phase 0. Do not assume any existing code.
- The owner is on **Windows (PowerShell)**. Any terminal commands you give the owner to run manually must be PowerShell-compatible. npm scripts must work cross-platform (no bash-only syntax like `rm -rf` or `VAR=value cmd` in `package.json`; use packages like `rimraf` or `cross-env` if needed).
- Things only the owner can do (creating the Firebase project, enabling Google sign-in, pasting config values, logging into the Firebase CLI) should be listed as a clear checklist when you reach them. Stub them with placeholders so the build and tests still run before they're done.
- Firebase config values go in a `.env.local` file read via `import.meta.env.VITE_FIREBASE_*`. Commit a `.env.example` with the keys and empty values. Never commit `.env.local`.
- Work phase by phase (Section 12). Finish each phase's acceptance criteria before starting the next. Commit at the end of every phase with a clear message.
- Do not add dependencies beyond Section 2 without a stated reason in the commit message.
- Follow the IP guardrails in Section 15 strictly. All visual assets are original.
- **Commits are authored by the owner only. Do not add `Co-Authored-By` or any AI attribution trailers to commit messages or PR descriptions.**

---

## 1. Overview

| Item | Decision |
|---|---|
| Platform | Installable PWA (iOS Safari + Android Chrome via "Add to Home Screen") |
| Users | Owner + small friend group. Each user's data is private to them. No shared/social features. |
| Cost target | $0 (Firebase Spark plan) |
| Auth | Google sign-in via Firebase Auth |
| Storage | Firestore, with offline persistence so the app works in a gym with no signal |
| Hosting | Firebase Hosting |

**Core loop:** open app, start a session, add exercises, log sets (reps + weight), rest timer runs between sets, finish session, see PRs and progress over time.

---

## 2. Tech Stack (locked)

- **React 18 + Vite**
- **TypeScript**: convert the scaffold to TS in Phase 0 (stronger portfolio signal, safer data model)
- **React Router v6**
- **Firebase JS SDK v11**: Auth, Firestore (`persistentLocalCache` + `persistentMultipleTabManager`)
- **vite-plugin-pwa** (Workbox) for manifest + service worker
- **Recharts** for progress charts (restyled to look pixel/stepped)
- **date-fns** for date handling
- **Vitest** + **@testing-library/react** for unit/component tests
- **@firebase/rules-unit-testing** + Firebase Emulator Suite for security rule tests
- Fonts from Google Fonts (OFL licensed): **Press Start 2P** (headings/labels), **VT323** (body/numbers)

No UI component library. The pixel look is built by hand with CSS tokens.

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
| `--tide` | `#3FA7A0` | `#4FC2BA` | Accent, active states, chart lines |
| `--signal` | `#F2A541` | `#F2A541` | PRs, warnings, timer |
| `--alarm` | `#D9534F` | `#E36A66` | Destructive actions |
| `--grid` | `#C9CCBF` | `#2A3550` | Dividers, chart grid, faint lab-grid background |

Theme follows `prefers-color-scheme`, with a manual override in Settings stored on the user profile.

### 3.3 Typography

- **Press Start 2P**: headings, nav labels, button labels, big numbers on the timer. Min size 12px. Always uppercase. It is wide, so keep strings short.
- **VT323**: body text, inputs, set rows, history details. Base size 20px (it renders small), line-height 1.2.
- Numbers (reps, weight) use `font-variant-numeric: tabular-nums` so columns line up.
- Fallback stack: `'Press Start 2P', ui-monospace, monospace` and `'VT323', ui-monospace, monospace`.

### 3.4 Pixel Rendering Rules

- `border-radius: 0` everywhere. No rounded corners.
- Borders are solid, 2px (small elements) or 4px (cards, tiles).
- Shadows are hard offsets, never blurred: `box-shadow: 4px 4px 0 var(--ink)`. Pressed buttons translate `2px 2px` and shrink the shadow to `2px 2px`.
- Icons and raster images: `image-rendering: pixelated`; SVGs use `shape-rendering="crispEdges"`.
- Icons render only at integer multiples of their grid (24px grid: 24, 48, 72, 96px).
- Animations use `steps()` timing, not smooth easing (e.g. `animation: blink 1s steps(2) infinite`).
- Background: faint 8px lab grid using `--grid` via `background-image` linear gradients (subtle, 20% opacity).
- Optional CRT scanline overlay on the header only, toggleable, off when `prefers-reduced-motion`.

### 3.5 Pictogram Icon System (all original)

Style brief: square signage tile, 4px ink border, `--surface` fill, a single stick-figure pictogram in ink, plus one directional arrow or motion cue. Think generic ISO safety-sign energy, drawn on a pixel grid.

**Construction rules**
- 24x24 grid SVG, `viewBox="0 0 24 24"`, built from `<rect>` pixels or crisp-edged paths.
- Stick figure: head is a 4x4 block, torso and limbs are 2px wide, joints can bend at 45 or 90 degrees only.
- Equipment (bar, plates, dumbbells, bench) drawn as simple blocks.
- Motion arrows: 2px shaft, 3-step pixel arrowhead. Speed lines: 1px dashes.
- One accent color max per icon (`--signal` for PR/warning icons only; everything else is pure ink).
- Implemented as React components in `src/components/icons/`, each accepting `size` (24 | 48 | 72 | 96) and `title` (for `aria-label`). A single `<PictoTile icon="squat" />` wrapper draws the bordered tile.

**Icon set (build all in Phase 0; the list maps to exercise categories in Section 5.4)**

| id | Depicts |
|---|---|
| `squat` | Figure in deep squat, bar across shoulders, down arrow beside |
| `bench` | Figure lying on flat bench, bar above chest, up arrow |
| `deadlift` | Figure hinged at hips, bar at shins, up arrow |
| `ohp` | Standing figure, bar locked out overhead, up arrow |
| `pullup` | Figure hanging from a horizontal bar, up arrow above head |
| `row` | Figure bent over, pulling bar toward torso, horizontal arrow |
| `curl` | Figure with dumbbell, forearm raised, curved arrow |
| `pushup` | Figure in plank position on hands, down/up double arrow |
| `lunge` | Figure in split stance, back knee low |
| `plank` | Figure in forearm plank, small tick marks above (time) |
| `run` | Figure mid-stride with 1px speed lines behind |
| `cycle` | Figure on a blocky bike, speed lines |
| `core` | Figure doing a crunch, curved arrow at torso |
| `stretch` | Figure reaching to toes |
| `machine` | Figure seated at a cable stack (generic machine exercise) |
| `rest` | Figure seated, pixel hourglass beside |
| `pr` | Figure with both arms raised, `--signal` burst lines around |
| `form-warning` | Figure with curved spine, `--signal` warning triangle |
| `bodyweight` | Pixel bathroom scale with a small figure standing on it |
| `mussel` | App mascot/logo: 32x32 pixel mussel shell, navy with pearl highlight, slightly open |
| UI glyphs | `add`, `delete`, `edit`, `history`, `chart`, `settings`, `check`, `timer`, `back` (16x16, no tile) |

The `mussel` mascot also generates the PWA icons (`public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png` 180x180, plus a `maskable` 512 variant with safe padding). Export them with nearest-neighbor scaling.

### 3.6 Core UI Components (`src/components/ui/`)

- `PixelButton`: variants `primary` (shell fill, pearl text), `secondary` (surface fill, ink border), `danger` (alarm). Hard shadow, press-down effect, min 44x44px tap target.
- `PixelCard`: surface fill, 4px border, hard shadow.
- `PictoTile`: bordered icon tile, optional label underneath in Press Start 2P 10-12px.
- `PixelInput` / `NumberStepper`: large VT323 numerals, `-` / `+` buttons on each side (weight steps by 5 lb or 2.5 kg, reps by 1). `inputMode="decimal"` so phones show the number pad.
- `Toast`: slides in with `steps(4)`, shows announcer copy (Section 3.7).
- `Modal`: full-width sheet from bottom on mobile, hard border top.
- `BottomNav`: 5 tiles (Status, Log, Archive, Library, Calibration), active tile inverted (ink fill, pearl icon).
- `Printout`: dot-matrix receipt style card used for session summaries: perforated edges (repeating pixel notches), VT323 text, dashed separators, a fake barcode footer made of 1-bit bars.
- `ProgressMeter`: segmented block bar (10 segments), fills in steps.

### 3.7 Voice and Copy

Themed copy goes in **headers, empty states, toasts, and confirmations**. Form labels and inputs stay plain ("Reps", "Weight") so the app is fast to use mid-set.

All copy lives in `src/copy/announcer.ts` as keyed strings, with a plain alternative for each. Settings has an **Announcer** toggle: off = plain copy everywhere.

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
| `pr.hit` | "ANOMALY DETECTED: new personal record. Please remain calm." | "New PR!" |
| `delete.confirm` | "Deleting is permanent. The lab will pretend this never happened." | "Delete permanently?" |
| `offline` | "Facility link lost. Results will transmit when connection is restored." | "Offline. Changes will sync later." |
| `streak.none` | "Welcome back, Subject. The lab did not notice you were gone." | "Welcome back." |

### 3.8 Motion and Sound

- Motion: stepped animations only; respect `prefers-reduced-motion` by disabling all non-essential animation.
- Sound (off by default, toggle in Settings): tiny 8-bit blips generated with the Web Audio API (square wave oscillator, no audio files). Events: set done (short blip), rest done (two-tone), PR (ascending arpeggio).
- Haptics: `navigator.vibrate` on rest-timer completion where supported (Android). iOS ignores it silently; don't error.

---

## 4. Terminology Map

| Concept | In-app label (headers/nav) |
|---|---|
| Dashboard | **Facility Status** |
| Workout session | **Test Session** |
| Active workout screen | **Test in Progress** |
| Set | **Trial** (in headers only; row labels say "Set") |
| Exercise library | **Protocol Library** |
| Routine/template | **Test Plan** |
| History | **Archive** |
| Personal record | **Anomaly** / Record |
| Rest timer | **Recovery Interval** |
| Settings | **Calibration** |
| User | **Subject #XXXX** |

---

## 5. Features

### 5.1 Auth + Onboarding (Phase 1)

- Google sign-in (Firebase Auth).
- **iOS standalone gotcha:** `signInWithPopup` can fail inside an installed iOS PWA. Implement: try popup, fall back to `signInWithRedirect` on failure. Follow Firebase's redirect best-practices doc so `authDomain` matches the Firebase Hosting domain the app is served from. Test on a real iPhone in standalone mode before calling Phase 1 done.
- First sign-in creates `users/{uid}` with defaults and routes to `/onboarding`:
  - Display name (prefilled from Google)
  - Units: lb or kg
  - Default rest time: 60 / 90 / 120 / 180s
  - Generates `subjectNumber` (random 4 digits, display-only, not unique-enforced)
- Returning users skip onboarding.

**Acceptance:** sign in/out works on desktop Chrome, Android Chrome, iOS Safari, and iOS installed PWA. Profile doc is created once.

### 5.2 Active Session Logging (Phase 1, the core feature)

- "START TEST SESSION" on Facility Status, either empty or from a Test Plan.
- Add exercise: opens Protocol Library picker (search + category filter by icon).
- Each exercise block shows its `PictoTile`, name, and set rows: `Set # | Weight | Reps | [done ✓]`.
- New set row prefills with the previous set's weight/reps. "Last time" hint shows the most recent session's sets for that exercise in faded text.
- Toggle a set as warmup (excluded from volume and PRs).
- Tapping ✓ marks the set done and auto-starts the Recovery Interval.
- Reorder/remove exercises; delete sets with swipe or a delete button.
- Session notes field.
- **Persistence:** the in-progress session is saved to `users/{uid}/meta/activeSession` (debounced ~1s) so a refresh, crash, or phone lock never loses it. On app open, if an active session exists, resume it.
- **Finish:** writes the session doc, computes totals + PRs (Section 10), deletes `activeSession`, shows the `Printout` summary.
- **Discard:** confirm modal, deletes `activeSession`.

**Acceptance:** can log a full workout fully offline (airplane mode), close and reopen the app mid-session without losing data, and it syncs when back online.

### 5.3 Recovery Interval / Rest Timer (Phase 1)

- Big Press Start 2P countdown in a sticky bottom bar above the nav, plus a `ProgressMeter`.
- **Timestamp-based**, not interval-counting: store `endsAt`; display `endsAt - now`. This keeps it correct after the phone sleeps or the tab is backgrounded.
- Controls: -15s, +15s, skip.
- On completion: toast (`rest.done`), optional sound + vibration.
- Default duration from profile; per-exercise override optional (Phase 4).

### 5.4 Protocol Library (Phase 3)

- Seed library in code at `src/data/exercises.ts`, with stable string ids. Categories map to icons:

| id | Name | Category | Icon |
|---|---|---|---|
| `back-squat` | Back Squat | Legs | `squat` |
| `front-squat` | Front Squat | Legs | `squat` |
| `leg-press` | Leg Press | Legs | `machine` |
| `lunge` | Walking Lunge | Legs | `lunge` |
| `rdl` | Romanian Deadlift | Posterior | `deadlift` |
| `deadlift` | Deadlift | Posterior | `deadlift` |
| `hip-thrust` | Hip Thrust | Posterior | `bench` |
| `leg-curl` | Leg Curl | Posterior | `machine` |
| `bench-press` | Bench Press | Push | `bench` |
| `incline-db-press` | Incline DB Press | Push | `bench` |
| `ohp` | Overhead Press | Push | `ohp` |
| `lateral-raise` | Lateral Raise | Push | `ohp` |
| `pushup` | Push-up | Push | `pushup` |
| `dip` | Dip | Push | `pushup` |
| `tricep-pushdown` | Tricep Pushdown | Push | `machine` |
| `pullup` | Pull-up | Pull | `pullup` |
| `lat-pulldown` | Lat Pulldown | Pull | `machine` |
| `barbell-row` | Barbell Row | Pull | `row` |
| `cable-row` | Seated Cable Row | Pull | `row` |
| `bicep-curl` | Bicep Curl | Pull | `curl` |
| `face-pull` | Face Pull | Pull | `machine` |
| `plank` | Plank | Core | `plank` |
| `crunch` | Cable Crunch | Core | `core` |
| `hanging-leg-raise` | Hanging Leg Raise | Core | `pullup` |
| `treadmill` | Treadmill | Cardio | `run` |
| `bike` | Stationary Bike | Cardio | `cycle` |
| `stretch` | Mobility / Stretch | Mobility | `stretch` |

- Exercise `trackingType`: `weight_reps` (default), `reps_only` (push-up, pull-up), `duration` (plank), `distance_duration` (cardio). Set row inputs adapt to the type.
- Users can create custom exercises (name, category, icon from the set, tracking type) stored in `users/{uid}/exercises`.
- Exercise detail page: PRs, e1RM chart, recent sessions containing it.

### 5.5 Archive / History (Phase 2)

- List of sessions, newest first, grouped by week. Each row: date, duration, exercise icons (up to 5 `PictoTile`s at 24px), total volume.
- Session detail: `Printout` view with all sets; edit (re-opens in the logging UI) and delete (confirm, then recompute affected PRs).
- Pagination via Firestore `limit` + `startAfter` (20 per page).

### 5.6 Anomalies / PRs (Phase 2)

Tracked per exercise (non-warmup, completed sets only):
- Heaviest weight lifted (any reps)
- Best estimated 1RM (Epley, reps ≤ 12 only)
- Most reps at a given weight (stored as a map keyed by weight)
- Best single-session volume

On session finish, detect new PRs, write them, and show a `pr.hit` toast with the `pr` pictogram flashing in `--signal` (stepped blink, 3 cycles). Session doc stores `prsHit` for the Printout.

### 5.7 Progress Charts (Phase 3)

- Per exercise: best e1RM per session over time; top-set weight over time.
- Global: weekly total volume (bar chart), sessions per week.
- Pixel styling for Recharts: `type="stepAfter"` lines, `strokeWidth={2}`, custom square dots (4x4 rect), dashed `--grid` gridlines, VT323 tick labels, `isAnimationActive={false}`.
- Range filter: 4W / 12W / 1Y / ALL.

### 5.8 Test Plans / Routines (Phase 4)

- Create a named plan: ordered exercises with target sets and target reps.
- Start a session from a plan (prefills blocks and empty set rows).
- "Save as Test Plan" from any finished session.

### 5.9 Bodyweight Log (Phase 4, optional)

- Simple date + weight entry, one per day, plus a stepped line chart.
- Neutral presentation: no goal-shaming copy, no color coding up/down as good/bad. Just data.

### 5.10 Calibration / Settings (Phases 1 to 5)

- Units (lb/kg, converts display everywhere instantly)
- Default rest time
- Theme: System / Light / Dark
- Announcer copy on/off
- Sound on/off
- Scanline effect on/off
- **Export data** as JSON (all user collections) for backup
- Delete account + all data (confirm twice, uses a batched delete of subcollections, then `deleteUser`)
- Sign out

### 5.11 PWA + Offline (Phase 5 polish, basics from Phase 0)

- Manifest: name "Mussel", short_name "Mussel", `display: standalone`, theme/background colors from tokens, icons from the mascot including maskable.
- `apple-touch-icon` link and `apple-mobile-web-app-status-bar-style` meta for iOS.
- **iOS install hint:** if on iOS Safari and not in standalone mode (`navigator.standalone !== true`), show a dismissible banner with pixel-art instructions ("Tap Share, then Add to Home Screen"). Remember dismissal in localStorage.
- Offline banner using `navigator.onLine` + `online`/`offline` events, showing the `offline` copy.
- Service worker `registerType: 'autoUpdate'`; show a "New lab firmware available, reload?" toast when an update is waiting.
- Lighthouse PWA/installability checks pass.

---

## 6. Data Model (Firestore)

All user data lives under `users/{uid}`. Weights are stored canonically in **kg** (full precision, never rounded on write) and converted for display. Timestamps use Firestore `Timestamp`.

```ts
// users/{uid}
interface UserProfile {
  displayName: string;
  subjectNumber: string;        // "0417"
  units: 'lb' | 'kg';
  defaultRestSec: number;       // 90
  theme: 'system' | 'light' | 'dark';
  announcerOn: boolean;         // true
  soundOn: boolean;             // false
  scanlinesOn: boolean;         // false
  createdAt: Timestamp;
  onboardedAt: Timestamp | null;
}

// users/{uid}/sessions/{sessionId}
interface Session {
  startedAt: Timestamp;
  endedAt: Timestamp;
  planId: string | null;
  notes: string;
  entries: SessionEntry[];
  totals: { volumeKg: number; setCount: number; durationSec: number };
  prsHit: PrHit[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface SessionEntry {
  exerciseId: string;           // seed id or custom exercise doc id
  exerciseName: string;         // denormalized so history survives renames/deletes
  iconId: string;
  trackingType: 'weight_reps' | 'reps_only' | 'duration' | 'distance_duration';
  sets: SetRow[];
}

interface SetRow {
  reps?: number;
  weightKg?: number;
  durationSec?: number;
  distanceM?: number;
  done: boolean;
  isWarmup: boolean;
}

interface PrHit {
  exerciseId: string;
  kind: 'maxWeight' | 'e1rm' | 'repsAtWeight' | 'sessionVolume';
  valueKg?: number;
  reps?: number;
}

// users/{uid}/meta/activeSession
// Same shape as Session minus endedAt/totals/prsHit, plus:
//   restTimer: { endsAt: Timestamp | null }

// users/{uid}/prs/{exerciseId}
interface ExercisePrs {
  maxWeightKg: number;
  maxWeightSessionId: string;
  bestE1rmKg: number;
  bestE1rmSessionId: string;
  repsAtWeight: Record<string, number>;   // key: weightKg rounded to 0.01 as string
  bestSessionVolumeKg: number;
  updatedAt: Timestamp;
}

// users/{uid}/exercises/{exerciseId}   (custom exercises only)
interface CustomExercise {
  name: string;
  category: 'Legs' | 'Posterior' | 'Push' | 'Pull' | 'Core' | 'Cardio' | 'Mobility' | 'Other';
  iconId: string;
  trackingType: SessionEntry['trackingType'];
  createdAt: Timestamp;
}

// users/{uid}/plans/{planId}
interface TestPlan {
  name: string;
  entries: { exerciseId: string; targetSets: number; targetReps: number }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// users/{uid}/bodyweight/{yyyy-MM-dd}
interface BodyweightEntry {
  weightKg: number;
  date: string;                  // same as doc id
  createdAt: Timestamp;
}
```

**Indexes:** `sessions` ordered by `startedAt desc` (single-field, automatic). Queries for "recent sessions containing exercise X" are done client-side over the last N sessions to avoid array-of-objects index issues at this scale.

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

**Rule tests (Phase 0):** with the emulator, verify: user A can read/write own docs; user A cannot read or write user B's docs; unauthenticated requests are denied everywhere.

---

## 8. Routes / Screens

| Route | Screen | Notes |
|---|---|---|
| `/login` | Sign In | Mascot, wordmark, `signIn.title`, Google button |
| `/onboarding` | Subject Intake | Units, rest default, name, shows assigned Subject # |
| `/` | Facility Status | Start session CTA, resume banner if active session, this week's stats (sessions, volume), last session Printout preview, recent Anomalies |
| `/session` | Test in Progress | Active logging UI + rest timer bar |
| `/session/summary/:id` | Session Printout | Post-finish summary with PRs |
| `/archive` | Archive | Session history list |
| `/archive/:id` | Session Detail | Printout, edit, delete |
| `/library` | Protocol Library | Search, category tiles, custom exercise create |
| `/library/:exerciseId` | Protocol Detail | PRs, charts, recent sets |
| `/plans` | Test Plans | List + create |
| `/plans/:planId` | Plan Editor | |
| `/bodyweight` | Bodyweight Log | Phase 4 |
| `/calibration` | Settings | |

Route guards: unauthenticated users go to `/login`; authenticated but not onboarded go to `/onboarding`.

---

## 9. Folder Structure

```
mussel/
├── CLAUDE.md                     # this spec
├── firebase.json
├── .firebaserc
├── firestore.rules
├── firestore.indexes.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-512-maskable.png
│   └── apple-touch-icon.png
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # router + guards
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── base.css              # resets, fonts, lab grid bg, safe-area insets
│   │   └── pixel.css             # shared pixel utilities
│   ├── copy/
│   │   └── announcer.ts
│   ├── data/
│   │   └── exercises.ts          # seed library
│   ├── lib/
│   │   ├── firebase.ts           # init, auth helpers (popup + redirect fallback)
│   │   ├── db/                   # one file per collection: sessions.ts, prs.ts, plans.ts, profile.ts, activeSession.ts, exercises.ts, bodyweight.ts
│   │   ├── calc/                 # pure functions: volume.ts, e1rm.ts, prs.ts, units.ts
│   │   ├── sound.ts              # Web Audio blips
│   │   └── export.ts             # JSON export
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── useActiveSession.ts
│   │   ├── useRestTimer.ts
│   │   ├── useOnline.ts
│   │   └── useCopy.ts            # returns themed or plain string based on profile
│   ├── components/
│   │   ├── ui/                   # PixelButton, PixelCard, PictoTile, NumberStepper, Toast, Modal, BottomNav, Printout, ProgressMeter
│   │   ├── icons/                # one component per pictogram + index.ts registry
│   │   └── charts/               # PixelLineChart, PixelBarChart wrappers over Recharts
│   ├── features/
│   │   ├── session/              # ExerciseBlock, SetRow, ExercisePicker, RestTimerBar, FinishModal
│   │   ├── archive/
│   │   ├── library/
│   │   ├── plans/
│   │   ├── bodyweight/
│   │   └── settings/
│   └── pages/                    # thin route components composing features
└── tests/
    ├── calc/                     # Vitest unit tests
    └── rules/                    # Firestore rules tests
```

---

## 10. Key Logic (in `src/lib/calc/`, pure and unit-tested)

- **Units:** `LB_PER_KG = 2.2046226218`. `toKg(value, unit)`, `fromKg(kg, unit)`. Display rounding: 1 decimal, trailing `.0` dropped. Stepper increments: 5 lb or 2.5 kg.
- **Volume:** `sum(reps * weightKg)` over sets where `done && !isWarmup` and `trackingType === 'weight_reps'`.
- **e1RM (Epley):** `weightKg * (1 + reps / 30)` for `1 <= reps <= 12`; for `reps === 1` return `weightKg`; otherwise `null`.
- **PR detection:** `detectPrs(session, currentPrs) => { updatedPrs, prsHit }`. Pure function; the db layer writes the result in one `writeBatch` together with the session doc and the `activeSession` delete.
- **PR recompute on edit/delete:** recompute that exercise's PRs from all its sessions (fine at this scale; fetch sessions client-side and filter).
- **Session duration:** `endedAt - startedAt`, capped display at 5h (people forget to finish).

---

## 11. Offline + Sync Behavior

- Firestore persistent cache handles offline reads/writes; writes queue and sync automatically.
- `serverTimestamp()` resolves late when offline; for ordering, also store client `startedAt` as a regular `Timestamp.fromDate(new Date())`.
- `activeSession` writes are debounced (~1s) to limit write counts.
- UI never blocks on a write promise resolving while offline (Firestore write promises only resolve once the server acknowledges). Update local state optimistically and fire writes without awaiting in UI handlers; surface errors via toast.

---

## 12. Build Phases

### Phase 0: Foundation
- **Project setup from scratch:**
  - `npm create vite@latest . -- --template react-ts` in the repo root (keep `CLAUDE.md`).
  - Install every dependency from Section 2.
  - `.gitignore` covering `node_modules/`, `dist/`, `.env.local`, `.env*.local`, `.firebase/`, `firebase-debug.log`, `firestore-debug.log`, `coverage/`.
  - ESLint + Prettier configured; `npm run lint` and `npm run format` scripts.
  - Scripts: `dev`, `build`, `preview`, `test`, `test:rules` (runs rules tests against the emulator via `firebase emulators:exec`), `lint`.
  - `firebase.json` configured for Hosting (`dist`, SPA rewrite to `/index.html`), Firestore rules, and emulators (Auth + Firestore). `.firebaserc` with a placeholder project id.
  - `src/lib/firebase.ts` reads config from env vars; in dev, connects to emulators when `VITE_USE_EMULATORS=true`.
  - `vite.config.ts` with `@vitejs/plugin-react` and `vite-plugin-pwa` configured per Section 5.11.
  - README stub with setup steps (fleshed out in Phase 5).
  - `LICENSE` (MIT, copyright Remus).
- Router shell with all routes from Section 8 as placeholder pages.
- Tokens, fonts, base/pixel CSS, all UI kit components, full icon set + mascot + PWA icons.
- A hidden `/dev/kit` route rendering every component and icon at every size (visual QA).
- Security rules + rule tests passing against the emulator.
- **Done when:** `npm run dev` runs with no errors, `npm run test` and `npm run lint` pass, `npm run test:rules` passes against the emulator, `/dev/kit` shows every icon crisp at 24/48/72/96, and `npm run build && npm run preview` serves an installable PWA with the Mussel icon. End the phase by giving the owner the Firebase setup checklist (Section 17).

### Phase 1: Core Logging
- Auth (popup + redirect fallback), onboarding, profile, route guards.
- Active session end-to-end with `activeSession` persistence, rest timer, finish + discard.
- Facility Status with start/resume.
- **Done when:** a full workout can be logged offline on an iPhone installed PWA and on Android, survives app close mid-session, and syncs.

### Phase 2: Archive + Anomalies
- History list with pagination, session detail Printout, edit, delete.
- PR detection, storage, recompute on edit/delete, PR toast + animation.
- **Done when:** PR calc unit tests pass for edge cases (warmups ignored, ties are not PRs, deleting the PR session reverts to the next best).

### Phase 3: Library + Progress
- Seed library, search/filter, custom exercises, tracking types.
- Protocol detail page with charts; global weekly volume chart on Facility Status.
- **Done when:** charts render stepped/pixel style in both themes and range filters work.

### Phase 4: Plans, Bodyweight, Export
- Test Plans CRUD, start from plan, save session as plan.
- Bodyweight log + chart.
- JSON export, delete account.

### Phase 5: Polish + Deploy
- Sound, haptics, scanlines, reduced-motion handling, iOS install banner, update toast, offline banner.
- Accessibility pass (Section 13).
- Lighthouse: PWA installable, Performance ≥ 90 on mobile, Accessibility ≥ 95.
- `firebase deploy` to Hosting; README updated with live URL and screenshots.

---

## 13. Quality Bar

- **Accessibility:** WCAG AA contrast in both themes; every icon has `title`/`aria-label`; tap targets ≥ 44px; visible focus ring (2px `--tide` outline, offset 2px); timer announcements via `aria-live="polite"`.
- **Performance:** fonts loaded with `display=swap` and preconnect; route-level code splitting (`React.lazy`) for charts and library pages; icons are inline SVG components (no image requests).
- **Tests:** unit tests for everything in `lib/calc`; rules tests; component tests for `SetRow`, `NumberStepper`, and `useRestTimer` (mock timers).
- **Code style:** ESLint + Prettier; no `any` without a comment; Firestore access only through `src/lib/db/*`, never directly from components.

---

## 14. Non-Goals

- Social features, leaderboards, sharing workouts between users
- Native iOS/Android builds or app store distribution
- Push notifications (revisit later; iOS web push needs the app installed and adds complexity)
- Nutrition/calorie tracking
- AI coaching or generated workouts
- Payments of any kind

---

## 15. IP Guardrails (must follow)

The "science facility" vibe is an **original** theme. This repo is public and goes on a resume, so:

- Do not use any names, logos, characters, quotes, catchphrases, or UI from existing games or franchises. The lab is the **Bivalve Kinetics Laboratory** and nothing else.
- Do not trace, copy, or recreate existing game pictograms or signage. Every icon is drawn from scratch using the construction rules in Section 3.5.
- All copy strings are original (Section 3.7 is the style guide; new strings follow the same voice).
- Fonts must be OFL/open-licensed (Press Start 2P and VT323 are). Include their license notices in `public/licenses/` or the README.
- The mascot and wordmark are original.

---

## 16. README Checklist (for the portfolio)

- One-line pitch + live URL + 3 to 4 screenshots (Status, Test in Progress with timer, Printout with a PR, chart)
- Tech stack and why (PWA to avoid app store fees on iOS and Android; Firestore offline persistence for gyms with no signal)
- Architecture notes: data model, canonical-kg storage, pure calc layer, timestamp-based timer, security rules with emulator tests
- Setup instructions (Firebase project, emulators, env config, deploy)
- License (MIT recommended) + font licenses

---

## 17. Owner Setup Checklist (manual steps, give this to the owner at the end of Phase 0)

1. Create a Firebase project at https://console.firebase.google.com (Google Analytics not needed).
2. Add a **Web app** to the project and copy its config values into `.env.local` (use `.env.example` as the template).
3. **Authentication > Sign-in method:** enable Google.
4. **Firestore Database:** create it in production mode, region `northamerica-northeast2` (Toronto) or `nam5`.
5. Install and log into the Firebase CLI in PowerShell:
   ```powershell
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```
6. Install Java (JDK 11+) if not already installed; the Firestore emulator needs it.
7. Deploy rules: `firebase deploy --only firestore:rules`
8. First deploy (can wait until Phase 5): `npm run build` then `firebase deploy --only hosting`
9. **Authentication > Settings > Authorized domains:** confirm the Hosting domain is listed (it's added automatically for `*.web.app` / `*.firebaseapp.com`).
