# MUSSEL: Project Spec

> **Mussel** (as in the shellfish, pronounced like "muscle")
> A clinical, mobile-only workout tracker built around **your own training program and RPE chart**, styled as the testing wing of a fictional research lab: the **Bivalve Kinetics Laboratory**.
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
| Core idea | The user uploads their own **training program** (a spreadsheet exported as CSV: days, exercises, sets, reps, prescribed RPE) and optionally their **RPE-to-%1RM chart**. Mussel turns the program into pre-filled workouts, suggests weights from the chart, and estimates 1RMs from logged sets. |
| Users | Owner + small friend group. Data is private except finished workouts, which accepted friends can see (Section 5.9). |
| Cost target | $0 (Firebase Spark plan) |
| Auth | Email + password accounts via Firebase Auth, each with a unique username. Sign-in persists on the device until the user logs out. |
| Storage | Firestore, with offline persistence so the app works in a gym with no signal |
| Hosting | Firebase Hosting |
| Navigation | Four bottom tabs: **Home, Workout, Upload, Profile** |

**Core loop:** upload a program (and optionally a chart; the built-in chart is the fallback), start today's workout pre-filled from the program, see a suggested weight for each prescribed RPE, log what you actually did (weight, reps, RPE/RIR), rest timer runs between sets, finish, and your estimated 1RMs update.

---

## 2. Tech Stack (locked)

- **React 18 + Vite**, **TypeScript**
- **React Router v6**
- **Firebase JS SDK v11**: Auth, Firestore (`persistentLocalCache` + `persistentMultipleTabManager`)
- **vite-plugin-pwa** (Workbox) for manifest + service worker
- **date-fns** for date handling
- **Vitest** + **@testing-library/react** for unit/component tests
- **@firebase/rules-unit-testing** + Firebase Emulator Suite for security rule tests
- Font from Google Fonts (OFL licensed): **Nunito Sans**

No UI component library and no chart library. CSV parsing is hand-written (no parsing dependency). The look is built by hand with CSS tokens and inline SVG.

---

## 3. Design System

### 3.1 Concept

The app is the in-house fitness terminal of the **Bivalve Kinetics Laboratory (BKL)**, a fictional, slightly absurd research facility that studies "kinetic output of human subjects." Visual language: **a test-facility phone home screen**: a plain white background, framed "widget" panels with big bold numbers, home-screen style shortcut tiles (a black-framed square icon with a label underneath), rounded orange/blue pill gauges, and a grey dock at the bottom. ISO-style safety pictograms for exercises. Tone: deadpan, dry, lightly sarcastic, never mean.

The user is addressed as **Subject #XXXX** (4-digit number generated at onboarding, e.g. `#0417`).

### 3.2 Color Tokens

Define in `src/styles/tokens.css` as CSS custom properties.

| Token | Light (default) | Dark | Use |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#000000` | App background |
| `--surface` | `#FFFFFF` | `#000000` | Panels, tiles, plates |
| `--ink` | `#000000` | `#FFFFFF` | Text, icons, frames |
| `--muted` | `#5F646A` | `#9BA1A7` | Secondary text |
| `--shell` / `--on-shell` | `#111214` / white | `#EEF0F1` / `#111214` | Primary buttons |
| `--signal` (orange) | `#EE7A2A` | `#F28C42` | Pill gauges, targets, warnings, timer |
| `--tide` (blue; `--tide-ink` for text) | `#3D9BE0` (`#1769A8`) | `#5BB0EC` (`#7FC2F2`) | Pill gauges, active toggles, focus |
| `--alarm` | `#D64541` | `#E8645F` | Destructive actions, errors |
| `--dock` | `#DCDEDF` | `#24272B` | Bottom dock |
| `--grid` | `#D6D9DC` | `#2C3035` | Hairline dividers |

Theme follows `prefers-color-scheme`, with a manual override in Profile stored on the user profile.

### 3.3 Typography

- **Nunito Sans** (400 to 900), one family for everything, mixed case. Page titles 800 to 900 weight; big readouts (clock, Subject #, timer) 900 with slightly tight tracking; small widget labels ("SUBJECT", "LAST TEST SESSION") in spaced caps.
- Base size 17px, inputs 18px (≥ 16px so iOS doesn't zoom).
- Numbers use `font-variant-numeric: tabular-nums` so columns line up.
- Fallback stack: `'Nunito Sans', 'Avenir Next', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.

### 3.4 Rendering Rules

- Plain background, no texture. Panels and tiles are white with **thick black frames**: 4px (`--frame`) for widgets, cards, and icon tiles; 3px (`--frame-sm`) for controls.
- Square corners everywhere, except the deliberately rounded pieces: pill gauges, toggles, the dock, and the white plates in the dock.
- No drop shadows. Pressed buttons nudge down 1px; pressed tiles tint slightly.
- No app header bar: each screen starts with its own big title (Home starts with the clock widget). Content clears the safe areas and the floating dock.
- Motion: short eased transitions (~120 to 300ms, `--ease`); respect `prefers-reduced-motion`.
- Icons are inline vector SVG and scale to any size.

### 3.5 Pictogram Icon System (all original)

Style brief: square white signage tile, ink frame, a single solid stick figure, plus one directional arrow or motion cue. Generic ISO safety-sign style, drawn from scratch.

**Construction rules**
- 48x48 `viewBox`. Vector shapes only: solid circles, round-capped/joined polylines, rects, paths (`src/components/icons/art.ts`, rendered by `render.ts`).
- Figure: solid round head (r ≈ 4.2), limbs and torso ≈ 4.4 wide with round caps; joints may bend at any natural angle.
- Equipment as simple solid blocks. Motion arrows ≈ 2.4 to 3 wide with a solid triangular head. Speed lines ≈ 2.4 wide.
- One accent color max per icon (`--signal` for PR/warning icons only; everything else is ink).
- Components in `src/components/icons/` accept `size` and `title`. `<PictoTile icon="squat" />` draws the framed tile; an active tile inverts (ink fill, paper figure).

**Pictograms:** `squat`, `bench`, `deadlift`, `ohp`, `pullup`, `row`, `curl`, `pushup`, `lunge`, `plank`, `run`, `cycle`, `core`, `stretch`, `machine`, `rest`, `pr`, `form-warning`, `bodyweight`.

**Logo: the Mussel badge.** A flat, single-color mussel shell, tilted up to the right with the hinge at the lower left and the valves slightly parted at the rim, inside a thin ring. Details (opening, seam, highlight) are negative space. Geometry is computed in `src/components/icons/mussel-art.ts` and shared by `<MusselLogo>` and `npm run icons`, which rasterizes the PWA icons (`icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `favicon.png`). Wordmark: "MUSSEL" in Nunito Sans 900, letter-spaced, over "BIVALVE KINETICS LAB(ORATORY)" in spaced caps.

**UI glyphs (24x24 line icons, ~2.2 stroke, no tile):** `home`, `workout`, `upload`, `profile` (dock), `friends`, `clipboard`, `calendar`, `add`, `delete`, `edit`, `history`, `chart`, `settings`, `check`, `timer`, `back`.

### 3.6 Core UI Components (`src/components/ui/`)

- `Button`: variants `primary` (shell fill), `secondary` (surface fill, ink frame), `danger` (alarm). Bold mixed-case label, min 48px tap target. Labels may wrap on narrow screens.
- `Card`: white widget panel with a 4px ink frame.
- `AppTile` / `AppGrid`: home-screen shortcut: a square, 4px-framed tile with a line glyph, label underneath; laid out in a 4-column grid.
- `PictoTile`: framed pictogram tile, optional caption underneath.
- `TextField` / `NumberStepper`: labelled fields with error/hint text; the stepper has large bold numerals and `-` / `+` buttons (weight steps 5 lb or 2.5 kg, reps 1, RPE 0.5, RIR 1). `inputMode="decimal"` for the phone number pad.
- `SegmentedControl` (radio group, inverted selection) and `Toggle` (rounded switch, blue when on) for settings.
- `Toast`: framed panel with a thick colored left edge (tide / signal / alarm), slides in; shows announcer copy (Section 3.7).
- `Modal`: full-width sheet from the bottom, ink rule on top.
- `BottomNav` (the dock): a floating grey rounded bar holding **4 tiles: Home, Workout, Upload, Profile**, each a white rounded plate with a black-framed square glyph and a small label; the active tile's square inverts (ink fill, paper icon).
- `Printout`: lab test-report card for workout summaries: black header band, ruled rows, fake barcode footer.
- `ProgressMeter`: rounded pill gauge (orange or blue fill) with the reading printed inside and an optional glyph beside it.

### 3.7 Voice and Copy

Themed copy goes in **headers, empty states, toasts, and confirmations**. Form labels and inputs stay plain ("Reps", "Weight", "RPE") so the app is fast to use mid-set.

All copy lives in `src/copy/announcer.ts` as keyed strings, with a plain alternative for each. Profile has an **Announcer** toggle: off = plain copy everywhere.

Rules: deadpan and dry; jokes are about the lab, bureaucracy, and effort. **Never** comment on the user's body, weight, appearance, or eating. No guilt-tripping for missed days.

| Key | Themed | Plain |
|---|---|---|
| `signIn.title` | "IDENTIFY YOURSELF, SUBJECT." | "Sign in" |
| `signUp.title` | "NEW SUBJECT REGISTRATION." | "Create account" |
| `signOut.confirm` | "Leave the facility? Your data stays filed." | "Log out?" |
| `reset.sent` | "Password reset dispatched. Check your inbox, Subject." | "Password reset email sent." |
| `profile.noWorkouts` | "No saved workouts. The filing cabinet echoes." | "No saved workouts yet." |
| `profile.noHistory` | "No test sessions on record." | "No workout history yet." |
| `profile.noFriends` | "No associates on file. The lab respects your privacy." | "No friends yet." |
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

- Short eased transitions only; respect `prefers-reduced-motion` by disabling non-essential animation.
- Sound (off by default, toggle in Profile): short lab beeps via Web Audio (no audio files). Events: set done (short beep), rest done (two-tone).
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
| Workout history | | **Test Records** |
| Friends | | **Associates** |
| User | | **Subject #XXXX** (and their username) |

---

## 5. Features

### 5.1 Auth + Onboarding

- **Accounts are email + password** (Firebase Auth Email/Password provider). No third-party sign-in.
- **Create account** (`/signup`): email, username, password, confirm password.
  - Username: 3 to 20 characters, letters, digits, underscore; unique case-insensitively; displayed as typed.
  - Password: at least 8 characters.
  - Availability is checked as the user types (debounced read of `usernames/{lower}`), and enforced atomically on submit.
  - Submit: create the Auth user, then one transaction claims `usernames/{lower}` and creates `users/{uid}` with defaults. If the username was taken in the meantime (or the transaction fails), delete the just-created Auth user so the email can be reused, and show the error.
- **Sign in** (`/login`): email + password. "Forgot password?" sends a Firebase reset email to the entered address.
- **Stay signed in:** Auth persistence is `indexedDBLocalPersistence` (fallback `browserLocalPersistence`), so a returning user on the same device goes straight into the app, including offline. Sign-in only ends on Log out (or account deletion).
- Auth errors map to plain, friendly messages (wrong password, email in use, weak password, no network, too many attempts).
- After account creation, route to `/onboarding` (Subject Intake):
  - Units: lb or kg
  - Effort scale: RPE or RIR (how the user prefers to enter effort)
  - Default rest time: 60 / 90 / 120 / 180s
  - Shows the generated `subjectNumber` (random 4 digits, display-only)
- Returning users skip onboarding.

**Acceptance:** create account, log out, sign in, and forgot-password all work on Android Chrome, iOS Safari, and the iOS installed PWA; reopening the app on the same device skips sign-in (also offline); duplicate usernames are rejected without leaving an orphaned Auth account; profile doc is created once.

### 5.2 Upload (the core feature)

The Upload tab imports two kinds of CSV, detected automatically: **training programs** (5.2a) and **effort charts** (5.2b). A program file that also contains a chart in plain cells imports both.

#### 5.2a Training programs

A program is a set of **weeks**, and each week is a folder of **days** (workouts or rest days). Users import one week per CSV, add more weeks by uploading more files into the same program, or **repeat a week** (copy it as the next week).

**Recognised sheet layout** (the owner's coaching spreadsheet is the reference fixture, `tests/fixtures/five-day-split-week1.csv`):

- Blank rows and columns anywhere are ignored.
- A **day label** cell matching `Day <n>` starts a day. If the same row says `Rest`, it's a rest day.
- A **header row** contains `Sets` and `Reps` cells and a prescription cell containing `RPE` (e.g. `PRESCRIBED RPE/ WEIGHT`). Columns are located from this row; logging columns (`Weight Used`, `RPE Used`, `Est. 1RM`) are recognised and ignored on import.
- **Exercise rows** follow a header row: exercise name in the leftmost text column before `Sets`, then sets, reps, prescription. A blank row or the next day label ends the block.
- **Reps:** `3`, `6-8`, `8-12`, or special text like `DROPSET`/`AMRAP` (kept as text, no number).
- **Prescription:** RPE `8`, range `5-6` or `9-10` (0.5 steps, 1 to 10); `@8` and `RPE 8` also accepted; `-15%` = a back-off **percent drop** from that exercise's previous set; a load like `100kg`/`225lb` = fixed **weight**. Anything else is kept as text with a warning.
- Short notes in the coach-notes column beside an exercise row (e.g. `7.5kg`) are attached to that exercise. Column headings like `NOTES FROM ME` / `YOUR NOTES` are ignored.
- **Day numbering repairs (with a warning):** a header block with no day label gets the next number; a day number that repeats or goes backwards is renumbered to follow the previous day.
- Exercise names are matched to the seed list (5.6) when possible and always get a pictogram from keywords (bench, squat, row, curl...); unmatched names fall back to `machine`.
- An **embedded chart** is looked for near a cell containing `RPE` and `CHART`: a numeric reps x RPE grid in plain cells is imported as an effort chart (5.2b). If the label exists but no numbers are found, warn that the chart is probably an image in the original sheet and must be typed into cells or uploaded separately.
- **Errors** (block saving): no Sets/Reps header found, no exercises found, file over 200 KB. **Warnings**: repaired day labels, unreadable prescriptions or reps, chart label without numbers.

**Flow:** pick a `.csv` → preview (week summary, each day with exercises as `3 x 3 @ RPE 5-6`, warnings) → choose **Save as new program** (name defaults to the file name without the week suffix) or **Add to program** (pick an existing one; becomes its next week). Programs list → program detail (weeks as folders, each opens its days) with **Set active**, **Repeat last week**, **Add week from CSV**, rename, delete week, delete program. A downloadable template CSV shows the layout.

**Acceptance:** the reference fixture imports as 7 days (5 workouts, 2 rest) with the right exercises, sets, reps, and prescriptions, repairs flagged; a second week can be added from CSV or by repeating; the template round-trips.

#### 5.2b Effort charts

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

**Acceptance:** comma, semicolon, and tab CSVs exported from Excel, Google Sheets, and Numbers all parse; transposed charts parse; every hard error is reported with a location.

### 5.3 Workout: Routines + Test in Progress

**Start screen** (Workout tab with no active session):
- **Start empty workout.**
- **Your routines:** each starts a pre-filled workout; edit or delete from the routine editor.
- **New routine:** routine editor (`/workout/routines/new`): name, exercises picked from the exercise list (5.6) or typed as custom names, and per exercise a set count, reps, RPE (or RIR), and rest time.
- **From your program:** the active program's weeks and days; start any workout day directly.
- **Import a program as routines** (on the program page, per week): creates one routine per workout day, named "<program> · <day>", carrying sets, reps (lower bound of a range), RPE (lower bound), and notes.

**Exercise block** (in a workout):
- Pictogram, name, and a **PR** field: the lift's current 1RM / max (prefilled from `maxes`, editable; edits are saved on finish).
- **Rest timer** for this exercise (stepper, 15 s steps; defaults to the profile's default rest).
- **Set rows:** `# | Reps | RPE (or RIR) | Suggested | Weight | ✓`.
  - **Suggested** = PR × `chartPercent(reps, RPE)` from the active chart, rounded to the plate step; "—" when off the chart or no PR.
  - **Weight** starts at the suggestion and is fully adjustable (stepper: 5 lb / 2.5 kg).
  - **✓** marks the set done and starts the exercise's rest timer.
- **Add set** (copies the last set), remove set, remove exercise. Program exercises with a `-15%` drop suggest 85% of the previous set's weight.
- **Add exercise** opens the exercise picker (search + custom name).
- Session notes field.

**Persistence:** the in-progress session is saved to `users/{uid}/meta/activeSession` (debounced ~1 s) so a refresh, crash, or phone lock never loses it. On app open it resumes, and Home shows a resume banner.

**Finish:** writes the session doc (totals: volume, working sets, duration), updates `maxes` (the PR field if edited; otherwise raised if a completed set's chart-estimated 1RM beats it), deletes `activeSession`, and opens the `Printout` summary (`/workout/summary/:id`). **Discard:** confirm modal, deletes `activeSession`.

**Acceptance:** a full workout can be logged fully offline (airplane mode), survives closing the app mid-session, and syncs when back online; suggested weights match the chart; routines can be built, edited, imported from a program, and started.

### 5.4 Recovery Interval / Rest Timer

- Sticky bar above the dock: big bold countdown, the exercise name, and a pill `ProgressMeter`.
- **Timestamp-based:** store `endsAt`; display `endsAt - now`, so it stays correct after the phone sleeps.
- Controls: -15 s, +15 s, skip. Duration comes from the exercise's rest setting. On completion: toast (`rest.done`), vibration where supported, optional sound.

### 5.5 Home: Facility Status

Kept simple:
- Title row with a **dark mode toggle** (sun/moon): flips the whole app between pure white-on-black and black-on-white and saves it as the profile theme (Profile still offers Auto).
- **Resume banner** when a workout is in progress; otherwise **Start workout**.
- **This week** widget: workouts this week, volume this week, last workout date, active program.
- **Friends' workouts:** the latest finished workouts of accepted friends (username, date, exercises with top sets), newest first. Empty state links to adding friends in Profile.

### 5.6 Exercise List

Seed list in code at `src/data/exercises.ts` (id, name, category, icon), used by the routine editor and the workout picker, grouped by category. Generic for now and meant to grow. Custom names are typed in the picker and stored on the routine/session entry (no custom-exercise collection). Program imports match names to seed ids by keyword where confident.

Categories and entries: **Legs** (Back Squat, Front Squat, Leg Press, Leg Extension, Leg Curl, Walking Lunge, Calf Raise), **Posterior** (Deadlift, Romanian Deadlift, Hip Thrust), **Push** (Bench Press, Incline Bench Press, Overhead Press, Dip, Push-up, Chest Fly, Lateral Raise, Tricep Pushdown), **Pull** (Pull-up, Lat Pulldown, Barbell Row, Seated Cable Row, Bicep Curl, Face Pull), **Core** (Plank, Cable Crunch).

### 5.7 Profile: Subject File

Sections, top to bottom:

- **Subject card:** username, Subject #, email, member since.
- **Workouts:** the user's routines (open in the editor; New routine).
- **History (Test Records):** past sessions, newest first (20 at a time, "Load more"), each opening its `Printout`.
- **Friends (Associates):** add a friend by username, incoming requests (accept / decline), outgoing requests (cancel), friends list (remove). See 5.9.
- **Calibration:** units (lb/kg, converts display everywhere instantly), effort scale (RPE/RIR), default rest time, theme (Auto/Light/Dark), announcer copy, sound. Changes save immediately (optimistic, offline-safe).
- **Account:** **Log out** (confirm with `signOut.confirm`). Delete account + all data (confirm twice, re-enter password; deletes subcollections, the username claim, friend links on both sides, and pending friend requests, then `deleteUser`).

### 5.9 Friends

- **Add by username:** looks up `usernames/{lower}`, then creates `friendRequests/{fromUid}_{toUid}`. Not yourself, not existing friends, one pending request per pair.
- **Accept:** one batch writes `users/{me}/friends/{them}` and `users/{them}/friends/{me}` and deletes the request. **Decline / cancel:** delete the request. **Remove:** delete both friend docs.
- **Visibility:** friends can read each other's finished **sessions** (including notes). Nothing else: not profiles, programs, charts, maxes, or the active workout.
- Friendship works offline for reading; adding/accepting needs a connection (shown via toast on failure).

### 5.8 PWA + Offline

- Manifest: name "Mussel", `display: standalone`, `orientation: portrait`, theme/background colors from tokens, mascot icons including maskable.
- `apple-touch-icon` and `apple-mobile-web-app-status-bar-style` meta for iOS.
- **iOS install hint:** on iOS Safari when not standalone (`navigator.standalone !== true`), a dismissible banner ("Tap Share, then Add to Home Screen"). Dismissal remembered in localStorage.
- Offline banner via `navigator.onLine` + `online`/`offline` events, showing `offline` copy.
- Service worker `registerType: 'autoUpdate'`; "New lab firmware available, reload?" toast when an update is waiting.

---

## 6. Data Model (Firestore)

All user data lives under `users/{uid}`, except the public username index. Weights are stored canonically in **kg** (full precision, never rounded on write) and converted for display. Effort is stored canonically as **RPE** (RIR input is converted: `RPE = 10 - RIR`). Timestamps use Firestore `Timestamp`. Email lives only in Firebase Auth, never in Firestore.

```ts
// usernames/{usernameLower}   (public username index; one per user, immutable)
interface UsernameClaim {
  uid: string;
  username: string;             // as typed, e.g. "SquatQueen"
}

// users/{uid}
interface UserProfile {
  username: string;             // as typed
  usernameLower: string;        // key into usernames/, never changes
  subjectNumber: string;        // "0417"
  units: 'lb' | 'kg';
  effortScale: 'rpe' | 'rir';   // input/display preference only
  defaultRestSec: number;       // 90
  theme: 'system' | 'light' | 'dark';
  announcerOn: boolean;         // true
  soundOn: boolean;             // false
  activeChartId: string | null; // null = built-in default chart
  activeProgramId: string | null;
  createdAt: Timestamp;
  onboardedAt: Timestamp | null;
}

// users/{uid}/programs/{programId}
// One document per program; weeks/days/exercises nest as arrays of maps.
interface Program {
  name: string;
  weeks: ProgramWeek[];          // in order; a week is a "folder" of days
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ProgramWeek {
  label: string;                 // "Week 1"
  sourceFileName: string | null; // null when created by "Repeat week"
  days: ProgramDay[];
}

interface ProgramDay {
  label: string;                 // "Day 1"
  rest: boolean;
  exercises: ProgramExercise[];
}

interface ProgramExercise {
  name: string;                  // as written, e.g. "Comp Bench"
  exerciseId: string | null;     // seed match, if any
  iconId: string;
  sets: number;
  reps: { min: number; max: number } | null;  // null for DROPSET/AMRAP etc.
  repsText: string;              // as written: "6-8"
  prescription:
    | { kind: 'rpe'; min: number; max: number }
    | { kind: 'percentDrop'; percent: number }
    | { kind: 'weight'; weightKg: number }
    | { kind: 'text' };
  prescriptionText: string;      // as written: "5-6", "-15%"
  note: string | null;
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
  title: string;
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
  maxKg: number | null;         // the PR field used for suggestions
  restSec: number;              // this exercise's rest timer
  dropPercent: number | null;   // program back-off (e.g. 15 for "-15%")
  note: string | null;
  sets: SetRow[];
}

interface SetRow {
  reps: number | null;
  rpe: number | null;           // canonical RPE, 0.5 steps
  weightKg: number | null;      // what was actually used
  done: boolean;
}

// users/{uid}/meta/activeSession
// Same shape as Session minus endedAt/totals/createdAt/updatedAt, plus:
//   title: string;              // routine or program day name, or "Workout"
//   restTimer: { endsAt: Timestamp | null; durationSec: number; exerciseName: string | null }

// users/{uid}/routines/{routineId}
interface Routine {
  name: string;
  entries: {
    exerciseId: string | null;
    exerciseName: string;
    iconId: string;
    sets: number;
    reps: number | null;
    rpe: number | null;
    restSec: number;
    dropPercent: number | null;   // program back-off, e.g. 15
    note: string | null;
  }[];
  source: { programId: string; week: string; day: string } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// users/{uid}/friends/{friendUid}      (my accepted friends)
interface Friend { username: string; since: Timestamp }

// friendRequests/{fromUid}_{toUid}     (top level; pending only)
interface FriendRequest {
  from: string; to: string;
  fromUsername: string; toUsername: string;
  createdAt: Timestamp;
}

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
    function signedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return signedIn() && request.auth.uid == userId;
    }

    function userDoc(uid) {
      return /databases/$(database)/documents/users/$(uid);
    }

    function usernameDoc(name) {
      return /databases/$(database)/documents/usernames/$(name);
    }

    function friendDoc(owner, friend) {
      return /databases/$(database)/documents/users/$(owner)/friends/$(friend);
    }

    function requestDoc(from, to) {
      return /databases/$(database)/documents/friendRequests/$(from + '_' + to);
    }

    // The owner has the caller in their friends list.
    function isFriendOf(owner) {
      return signedIn() && exists(friendDoc(owner, request.auth.uid));
    }

    // Public username index. Anyone may check whether a single name is taken
    // (needed before sign-up), but nobody can list the collection.
    match /usernames/{name} {
      allow get: if true;
      allow list: if false;
      // Claimed in the same transaction that creates the owner's profile.
      allow create: if signedIn()
        && name.matches('^[a-z0-9_]{3,20}$')
        && request.resource.data.keys().hasOnly(['uid', 'username'])
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.username.lower() == name
        && getAfter(userDoc(request.auth.uid)).data.usernameLower == name;
      allow update: if false;
      allow delete: if signedIn() && resource.data.uid == request.auth.uid;
    }

    // Pending friend requests. Id is "<fromUid>_<toUid>". Only the two people
    // involved can see or delete one; only the sender can create it.
    match /friendRequests/{requestId} {
      allow get, list, delete: if signedIn()
        && (resource.data.from == request.auth.uid || resource.data.to == request.auth.uid);
      allow create: if signedIn()
        && request.resource.data.keys().hasOnly(['from', 'to', 'fromUsername', 'toUsername', 'createdAt'])
        && request.resource.data.from == request.auth.uid
        && request.resource.data.to != request.auth.uid
        && requestId == request.auth.uid + '_' + request.resource.data.to
        && exists(userDoc(request.resource.data.to))
        && request.resource.data.fromUsername == get(userDoc(request.auth.uid)).data.username
        && request.resource.data.toUsername == get(userDoc(request.resource.data.to)).data.username
        && !exists(friendDoc(request.auth.uid, request.resource.data.to));
      allow update: if false;
    }

    match /users/{userId} {
      allow read, delete: if isOwner(userId);
      // The profile can only be created alongside the owner's username claim.
      allow create: if isOwner(userId)
        && getAfter(usernameDoc(request.resource.data.usernameLower)).data.uid == userId;
      // Usernames are permanent.
      allow update: if isOwner(userId)
        && request.resource.data.usernameLower == resource.data.usernameLower
        && request.resource.data.username == resource.data.username;

      // Friends list. The owner manages it. Someone else may add themselves
      // only to accept a request the owner sent them, and may remove themselves.
      match /friends/{friendId} {
        allow create: if signedIn()
          && request.auth.uid == friendId
          && exists(requestDoc(userId, friendId))
          && request.resource.data.keys().hasOnly(['username', 'since'])
          && request.resource.data.username == get(userDoc(friendId)).data.username;
        allow delete: if signedIn() && request.auth.uid == friendId;
      }

      // Finished workouts are visible to accepted friends.
      match /sessions/{sessionId} {
        allow read: if isFriendOf(userId);
      }

      // Everything under the profile belongs to the owner. A bare
      // {document=**} would also match zero segments, i.e. the profile
      // itself, and bypass the checks above.
      match /{subcollection}/{document=**} {
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

**Rule tests:** with the emulator, verify: user A can read/write own docs; user A cannot read or write user B's docs; unauthenticated requests are denied everywhere except single username lookups; the username-claim rules (one per user, permanent, no listing); friend requests can only be created by the real sender with real usernames, seen and deleted only by the two people involved; a friend entry can only be self-added to accept a pending request; friends can read finished sessions and nothing else; strangers and ex-friends can't.

---

## 8. Routes / Screens

| Route | Tab | Screen | Notes |
|---|---|---|---|
| `/login` | none | Sign In | Mascot, wordmark, `signIn.title`, email + password, forgot password, link to sign up |
| `/signup` | none | Create Account | `signUp.title`, email, username (live availability), password + confirm |
| `/onboarding` | none | Subject Intake | Units, effort scale, rest default, shows Subject # |
| `/` | Home | Facility Status | Clock widget, Subject widget, shortcut tiles, last Printout (start/resume + maxes in Phase 3) |
| `/workout` | Workout | Test in Progress | Start screen (empty, routines, program days) or the active workout + rest timer bar |
| `/workout/routines/new`, `/workout/routines/:id` | Workout | Routine Editor | Name, exercises, sets/reps/RPE/rest per exercise |
| `/workout/summary/:id` | Workout | Session Printout | Post-finish summary |
| `/upload` | Upload | Chart Intake | Upload CSV (program or chart), preview, save; programs and charts lists; template download |
| `/upload/programs/:programId` | Upload | Program | Weeks as folders, days, set active, repeat week, add week, rename, delete |
| `/upload/charts/:chartId` | Upload | Chart Detail | Full grid view, rename, set active, delete |
| `/profile` | Profile | Subject File | Subject card, Workouts, History, Friends, Calibration, Log out, delete account |
| `/dev/kit` | none | Dev Kit | Hidden visual QA page (reachable signed out) |

Route guards: unauthenticated users go to `/login`; authenticated but not onboarded go to `/onboarding`; signed-in users visiting `/login` or `/signup` go to `/`. While Auth restores a cached session, show a splash (never flash the login screen).

---

## 9. Folder Structure

```
mussel/
├── CLAUDE.md
├── firebase.json / .firebaserc / firestore.rules / firestore.indexes.json
├── index.html / vite.config.ts / tsconfig*.json
├── public/                       # PWA icons (generated), licenses/
├── scripts/                      # generate-icons.mjs, vitest.mjs (drive-letter-safe test runner)
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # router + guards
│   ├── styles/                   # tokens.css, base.css, utilities.css
│   ├── copy/announcer.ts
│   ├── data/exercises.ts         # seed exercise list
│   ├── lib/
│   │   ├── firebase.ts           # init (auth persistence, offline cache, emulators)
│   │   ├── auth.ts               # sign up / in / out, password reset, delete account, error messages
│   │   ├── validation.ts         # pure: email, username, password rules
│   │   ├── db/                   # usernames.ts, profile.ts, account.ts, programs.ts, charts.ts, sessions.ts, activeSession.ts, maxes.ts
│   │   ├── calc/                 # pure: units.ts, volume.ts, e1rm.ts, effort.ts (chart lookup, targets, RPE<->RIR)
│   │   ├── csv/                  # pure: parseCsv.ts (tokenizer), parseProgram.ts (sheet -> program week + chart + issues), parseEffortChart.ts (grid -> chart + issues)
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
- **CSV:** `parseCsv(text) => string[][]` (delimiter detection, quotes, BOM, CRLF). `parseProgramSheet(rows) => { week | null, chart | null, issues }`. `parseEffortChart(rows) => { chart | null, issues }`. `detectCsvKind(rows) => "program" | "chart" | "unknown"`.
- **Exercises:** `matchExercise(name) => seed id | null`, `iconForExercise(name) => PictogramId` (keyword rules).
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
- Tokens, base CSS, UI kit, icon set, logo, PWA icons, hidden `/dev/kit`.
- Four-tab shell (Home, Workout, Upload, Profile) with placeholder pages; mobile-only layout and portrait lock (Section 3.9).
- Security rules + emulator rule tests.

### Phase 1: Auth + Profile
- Email/password accounts with unique usernames (Section 5.1): create account, sign in, forgot password, persistent sign-in, onboarding, route guards.
- Profile tab (Section 5.7): subject card, Workouts / History / Friends sections with empty states, Calibration settings persisted and applied instantly (theme, announcer), Log out, delete account.
- Rules + emulator tests for the username index; integration tests of sign-up/sign-in/delete against the Auth + Firestore emulators.
- **Done when:** Section 5.1 acceptance passes on Android and the iOS installed PWA; settings persist and apply instantly.

### Phase 2: Upload (Programs + Effort Charts)
- `parseCsv`, `parseProgramSheet` (reference fixture), `parseEffortChart`, `chartPercent`, default chart, exercise matching, with thorough unit tests.
- Upload tab: programs (import, add week, repeat week, browse weeks/days, set active) and charts.
- Upload tab: file pick, preview grid, errors/warnings, save, list, activate, rename, delete, template download.
- **Done when:** acceptance in Sections 5.2a and 5.2b passes, including the owner's real program export.

### Phase 3: Workout + Home
- Routines (build from the exercise list, edit, import a program week as routines), workout logging with PR / RPE / suggested weight / adjustable weight / per-exercise rest timers, `activeSession` persistence, finish + discard, Printout summary, maxes.
- Friends (5.9) with security rules and emulator tests.
- Home: dark mode toggle, resume/start, this-week stats, friends' workouts. Profile: Workouts, History, Friends sections.
- **Done when:** a full workout can be logged offline on an iPhone installed PWA and on Android, survives app close mid-session, and syncs.

### Phase 4: Polish + Deploy
- Sound, haptics, reduced motion, iOS install banner, update toast, offline banner.
- Accessibility pass (Section 13); Lighthouse mobile: installable, Performance ≥ 90, Accessibility ≥ 95.
- `firebase deploy`; README with live URL and screenshots.

---

## 13. Quality Bar

- **Accessibility:** WCAG AA contrast in both themes; every icon has `title`/`aria-label`; tap targets ≥ 44px; visible focus ring (2px `--tide` outline, offset 2px); timer announcements via `aria-live="polite"`; parse errors announced.
- **Performance:** fonts loaded with `display=swap` and preconnect; route-level code splitting (`React.lazy`) for non-Home tabs; icons are inline SVG.
- **Tests:** unit tests for everything in `lib/calc`, `lib/csv`, and `lib/validation`; rules tests; emulator integration tests for auth flows; component tests for route guards, `SetRow`, `NumberStepper`, `ChartPreview`, and `useRestTimer` (mock timers).
- **Code style:** ESLint + Prettier; no `any` without a comment; Firestore access only through `src/lib/db/*`.

---

## 14. Non-Goals (for now)

- Desktop/tablet layouts, landscape mode
- Excel/ODS/clipboard import (CSV only for now); reading charts from images
- PR tracking, exercise library screen, progress charts, bodyweight log
- Social features beyond a Friends list (feeds, leaderboards, sharing); Friends scope is still to be defined
- Third-party sign-in (Google, Apple, etc.)
- Native builds or app store distribution; push notifications
- Integrations with other services (calendars, email, cloud drives)
- Nutrition tracking, AI coaching, payments

---

## 15. IP Guardrails (must follow)

The "science facility" vibe is an **original** theme. This repo is public and goes on a resume, so:

- Do not use any names, logos, characters, quotes, catchphrases, or UI from existing games or franchises. The lab is the **Bivalve Kinetics Laboratory** and nothing else.
- In particular, nothing from Valve's *Portal* / Aperture Science: not the Aperture logo or its iris mark, none of its signage pictograms (companion cube, cake, turrets, portals, etc.), and not the orange/blue portal-jumping figure silhouettes, even as tracing references. Orange and blue as plain accent colors are fine. Generic clinical/ISO safety-sign styling is fine; their specific artwork and marks are not.
- Do not trace, copy, or recreate existing game pictograms or signage. Every icon is drawn from scratch using the construction rules in Section 3.5.
- Do not ship third-party branded RPE charts as defaults. The built-in chart is formula-derived (Section 5.2); users upload their own.
- All copy strings are original (Section 3.7 is the style guide).
- Fonts must be OFL/open-licensed (Nunito Sans is). License notices in `public/licenses/`.
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
3. **Authentication > Sign-in method:** enable **Email/Password** (leave "Email link" off). Optionally customise the password-reset email under **Authentication > Templates**.
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
