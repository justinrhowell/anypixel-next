import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['--test', 'tests/browser.test.mjs'], {
  stdio: 'inherit',
  env: { ...process.env, RUN_BROWSER: '1' },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
