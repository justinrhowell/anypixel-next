import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execute } from '../dist/core/index.js';
import { project, editConfig, ok } from './helpers.mjs';
const repo = fileURLToPath(new URL('../', import.meta.url));
test(
  'live browser: capture, fix, compare and reuse a decision',
  { skip: !process.env.RUN_BROWSER },
  async (t) => {
    const root = await project(t);
    let html = await readFile(path.join(repo, 'examples/demo/before.html'), 'utf8');
    const server = createServer((_req, res) => {
      res.setHeader('content-type', 'text/html');
      res.end(html);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const url = `http://127.0.0.1:${server.address().port}`;
    await writeFile(
      path.join(root, 'web.mjs'),
      `export {default} from ${JSON.stringify(new URL('../extensions/web/index.mjs', import.meta.url).href)};`,
    );
    await editConfig(root, (c) => {
      c.extensions = [{ module: './web.mjs', trusted: true }];
      c.checks = [{ id: 'web/axe' }];
      c.allowedOrigins = [url];
    });
    const ctx = await ok(
      'context',
      { task: 'Help users invite a teammate', scope: 'src/invite.tsx' },
      root,
    );
    const input = {
      url,
      state: 'invitation form',
      viewport: { width: 900, height: 800 },
      channel: process.env.BROWSER_CHANNEL ?? 'chromium',
    };
    const first = await ok('observe', { observer: 'web/browser', input }, root);
    assert.equal(first.artifacts.length, 3);
    assert.equal(first.sourceRevision, 'unknown');
    const before = await ok(
      'review',
      { contextId: ctx.id, captureIds: [first.id], ci: true },
      root,
    );
    assert.ok(before.findings.some((f) => f.id.endsWith('/label')));
    assert.equal(before.exitCode, 1);
    html = html
      .replace('<input id="email"', '<label for="email">Email address</label><input id="email"')
      .replace('<button type="submit">', '<button type="submit">Send invitation ');
    const second = await ok('observe', { observer: 'web/browser', input }, root);
    const after = await ok(
      'review',
      { contextId: ctx.id, captureIds: [second.id], baseReviewId: before.id, ci: true },
      root,
    );
    assert.ok(
      !after.findings.some((f) => f.id.endsWith('/label') || f.id.endsWith('/button-name')),
    );
    assert.equal(after.exitCode, 0);
    assert.match(after.comparison, /Capture requests match/);
    const image = await ok('read', { id: second.id, artifact: second.artifacts[0].id }, root);
    assert.equal(image.mimeType, 'image/png');
    await ok(
      'record',
      {
        key: 'content/invitation-action',
        scope: ['src/invite.tsx'],
        status: 'accepted',
        text: 'Use a visible Send invitation label.',
        reason: 'The action should be clear without interpreting an icon.',
        acceptance: { actor: 'test fixture owner', source: 'explicit fixture acceptance' },
        evidence: [after.id],
      },
      root,
    );
    assert.ok(
      (
        await ok('context', { task: 'Adjust the invitation form', scope: 'src/invite.tsx' }, root)
      ).passages.some((p) => p.text.includes('visible Send invitation')),
    );
    const denied = await execute(
      'observe',
      { observer: 'web/browser', input: { ...input, url: 'http://127.0.0.1:1' } },
      root,
    );
    assert.ok(denied.error);
    assert.match(denied.error.message, /origin/);
  },
);
