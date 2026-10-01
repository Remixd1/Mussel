# Mussel

> A clinical, mobile-only workout tracker built around **your own RPE/RIR chart**, from the
> testing wing of the **Bivalve Kinetics Laboratory**.
> _Results may vary. Gains may not._

Upload your RPE/RIR-to-%1RM chart as a CSV and Mussel turns it into target weights for every set,
and into estimated maxes from what you actually lifted. It's an installable phone PWA (iOS +
Android via "Add to Home Screen"), portrait only, with offline-first storage so it keeps working
in a gym with no signal. Four tabs: **Home, Workout, Upload, Profile**.

**Status:** Phase 0 (foundation). See [CLAUDE.md](CLAUDE.md) for the full spec and build phases.

## Tech stack

React 18 + TypeScript + Vite · React Router 6 · Firebase 11 (Auth, Firestore with persistent
offline cache, Hosting) · vite-plugin-pwa · date-fns · Vitest + Testing Library · Firestore rules
tests on the Emulator Suite. No UI or chart library and no CSV dependency: the clinical-signage look is
hand-built CSS and original inline-SVG pictograms, and the CSV parser is hand-written.

## Setup (Windows PowerShell)

Requirements: Node 22.18+ (or 24+), and Java 11+ for the Firestore emulator.

```powershell
npm install
Copy-Item .env.example .env.local   # then fill in your Firebase web app config
npm run dev
```

The app shell and the visual QA page at `/dev/kit` work before Firebase is configured.

### Scripts

| Script                            | What it does                                                      |
| --------------------------------- | ----------------------------------------------------------------- |
| `npm run dev`                     | Vite dev server                                                   |
| `npm run build`                   | Type-check and build to `dist/` (with service worker + manifest)  |
| `npm run preview`                 | Serve the production build                                        |
| `npm test`                        | Unit and component tests (Vitest)                                 |
| `npm run test:rules`              | Firestore security rule tests against the emulator (needs Java)   |
| `npm run test:integration`        | Account flows against the Auth + Firestore emulators (needs Java) |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                 |
| `npm run icons`                   | Regenerate the PWA PNG icons from the vector Mussel badge         |

### Firebase

1. Create a Firebase project, add a Web app, and copy its config into `.env.local`.
2. Enable **Authentication > Email/Password**, and create a **Firestore** database.
3. `npx firebase login`, then `npx firebase use --add` to select the project.
4. `npx firebase deploy --only firestore:rules`

To develop against local emulators instead (no Firebase project needed), set
`VITE_USE_EMULATORS=true` in `.env.local` and run `npx firebase emulators:start --only auth,firestore`
alongside `npm run dev`. Accounts you create then live only in the emulator.

## License

MIT, see [LICENSE](LICENSE). All pictograms, the mascot, and copy are original.

Fonts: [Barlow](https://fonts.google.com/specimen/Barlow) and
[Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed), under the SIL Open Font License 1.1
(notices in [public/licenses/OFL-fonts.txt](public/licenses/OFL-fonts.txt)).
