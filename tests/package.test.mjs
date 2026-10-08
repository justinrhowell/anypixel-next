import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const run = promisify(execFile);
const repo = fileURLToPath(new URL('../', import.meta.url));
test('packed CLI installs outside the checkout without pulling in browser dependencies', async (t) => {
  const temp = await mkdtemp(path.join(tmpdir(), 'anypixel packaged '));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const packed = await run(
    'npm',
    ['pack', '--ignore-scripts', '--json', '--pack-destination', temp],
    { cwd: repo },
  );
  const pack = JSON.parse(packed.stdout)[0];
  assert.ok(
    !pack.files.some((f) => f.path.includes('extensions/web') || f.path.includes('node_modules')),
  );
  await writeFile(path.join(temp, 'package.json'), '{"name":"consumer","private":true}');
  await run(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', path.join(temp, pack.filename)],
    { cwd: temp },
  );
  const cli = path.join(temp, 'node_modules/anypixel-next/dist/cli/index.js');
  await run(path.join(temp, 'node_modules/.bin/anypixel-next'), ['init'], { cwd: temp });
  const result = await run(
    process.execPath,
    [cli, 'context', '--task', 'Improve my screen', '--scope', 'src/screen.tsx', '--json'],
    { cwd: temp },
  );
  assert.ok(JSON.parse(result.stdout).result.passages.length);
  await assert.rejects(access(path.join(temp, 'node_modules/playwright')));
  await assert.rejects(access(path.join(temp, 'node_modules/anypixel-next-web')));
});
