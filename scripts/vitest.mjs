// Runs Vitest with a normalized working directory. All test scripts go
// through this:
//
//   node scripts/vitest.mjs run --config vitest.rules.config.ts
//
// On Windows the cwd can arrive with a lowercase drive letter (c:\ vs C:\),
// e.g. from VS Code terminals or `firebase emulators:exec`. Vite then loads
// vitest twice under different paths and every file fails with "Vitest failed
// to find the runner / current suite". Upper-casing the drive letter fixes it.

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const cwd = process.cwd().replace(/^[a-z]:/, (d) => d.toUpperCase());
process.chdir(cwd);

const vitestBin = join(cwd, 'node_modules', 'vitest', 'vitest.mjs');

const result = spawnSync(process.execPath, [vitestBin, ...process.argv.slice(2)], {
  cwd,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
