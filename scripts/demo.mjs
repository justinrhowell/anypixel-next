import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { init, execute } from '../dist/core/index.js';
const repo = fileURLToPath(new URL('../', import.meta.url));
const root = path.join(repo, '.anypixel', 'demo', new Date().toISOString().replace(/[:.]/g, '-'));
await mkdir(root, { recursive: true });
await init(root);
let page = await readFile(path.join(repo, 'examples/demo/before.html'), 'utf8');
const server = createServer((_req, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(page);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
async function run(op, input) {
  const response = await execute(op, input, root);
  if (response.error) throw new Error(JSON.stringify(response.error));
  return response.result;
}
try {
  const url = `http://127.0.0.1:${server.address().port}`;
  await writeFile(
    path.join(root, 'web.mjs'),
    `export {default} from ${JSON.stringify(new URL('../extensions/web/index.mjs', import.meta.url).href)};`,
  );
  await writeFile(
    path.join(root, 'design/project.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        packs: ['builtin:starter'],
        extensions: [{ module: './web.mjs', trusted: true }],
        checks: [{ id: 'web/axe' }],
        allowedOrigins: [url],
      },
      null,
      2,
    ),
  );
  const ctx = await run('context', {
    task: 'Make the invitation form easier to understand and operate.',
    scope: 'src/invite.tsx',
  });
  const input = {
    url,
    state: 'invitation form',
    viewport: { width: 900, height: 800 },
    channel: process.env.BROWSER_CHANNEL ?? 'chromium',
  };
  const initial = await run('observe', { observer: 'web/browser', input });
  const before = await run('review', { contextId: ctx.id, captureIds: [initial.id], ci: true });
  page = page
    .replace('<input id="email"', '<label for="email">Email address</label><input id="email"')
    .replace('<button type="submit">', '<button type="submit">Send invitation ');
  await writeFile(path.join(root, 'after.html'), page);
  const changed = await run('observe', { observer: 'web/browser', input });
  const after = await run('review', {
    contextId: ctx.id,
    captureIds: [changed.id],
    baseReviewId: before.id,
    ci: true,
  });
  await run('record', {
    key: 'content/invitation-action',
    scope: ['src/invite.tsx'],
    status: 'accepted',
    text: 'Use the visible action label “Send invitation”.',
    reason: 'The action should be clear without interpreting an icon.',
    evidence: [after.id],
    acceptance: {
      actor: 'demonstration fixture',
      source: 'Scripted acceptance example; not a real user approval.',
    },
  });
  const next = await run('context', {
    task: 'Improve the invitation error state',
    scope: 'src/invite.tsx',
  });
  const summary = {
    project: root,
    before: before.reportPath,
    after: after.reportPath,
    findingsBefore: before.findings.length,
    findingsAfter: after.findings.length,
    rememberedDecision: next.passages.find((p) => p.id.startsWith('dec_'))?.text,
    limitation:
      'Scripted fixture demonstrates plumbing and measured repairs, not independent design-quality validation.',
  };
  await writeFile(path.join(root, 'demo.json'), JSON.stringify(summary, null, 2));
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
} finally {
  await new Promise((resolve) => server.close(resolve));
}
