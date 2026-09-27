// Launched by `npm run test:rules` inside `firebase emulators:exec`.
//
// On Windows, emulators:exec can hand its child a lowercase drive letter
// (c:\ vs C:\). Vite then resolves vitest twice under different paths and
// fails with "Vitest failed to find the runner". Normalize the cwd first.

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const cwd = process.cwd().replace(/^[a-z]:/, (d) => d.toUpperCase());
process.chdir(cwd);

const vitestBin = join(cwd, 'node_modules', 'vitest', 'vitest.mjs');

const result = spawnSync(
  process.execPath,
  [vitestBin, 'run', '--config', 'vitest.rules.config.ts', ...process.argv.slice(2)],
  { cwd, stdio: 'inherit' },
);
process.exit(result.status ?? 1);
