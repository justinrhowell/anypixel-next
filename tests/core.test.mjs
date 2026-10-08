import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile, mkdir, symlink, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execute, init, lockPacks } from '../dist/core/index.js';
import { worker } from '../dist/core/extensions.js';
import { hash, json } from '../dist/core/files.js';
import { recordRequest } from '../dist/core/contracts.js';
import { project, editConfig, ok, configureFake, fakeExtension } from './helpers.mjs';
const repo = fileURLToPath(new URL('../', import.meta.url));
const accepted = {
  key: 'layout/invoices',
  scope: ['src/invoices/**'],
  status: 'accepted',
  text: 'Keep amounts aligned in a table.',
  reason: 'People compare invoice amounts.',
  acceptance: { actor: 'test user', source: 'explicit test instruction' },
};

test('context works without browser dependencies and init preserves an existing project', async (t) => {
  const root = await project(t);
  const ctx = await ok(
    'context',
    { task: 'Improve the onboarding screen', scope: 'src/onboarding.tsx' },
    root,
  );
  assert.match(ctx.passages[0].text, /primary action/);
  await assert.rejects(init(root), /already exists/);
  const loaded = await ok('read', { id: ctx.id, artifact: 'starter/practice' }, root);
  assert.match(loaded.text, /primary action/);
});
test('scope, rejected proposals, expiry and project isolation determine memory retrieval', async (t) => {
  const root = await project(t);
  const d = await ok('record', accepted, root);
  await ok(
    'record',
    { ...accepted, key: 'layout/expired', expiresAt: '2020-01-01T00:00:00.000Z' },
    root,
  );
  await ok('record', { ...accepted, key: 'layout/rejected', status: 'rejected' }, root);
  const matching = await ok(
    'context',
    { task: 'Invoice table', scope: 'src/invoices/page.tsx' },
    root,
  );
  assert.equal(matching.passages.filter((p) => p.id.startsWith('dec_')).length, 1);
  assert.ok(matching.passages.some((p) => p.id === d.decision.id));
  const other = await ok('context', { task: 'Onboarding', scope: 'src/onboarding.tsx' }, root);
  assert.ok(!other.passages.some((p) => p.id.startsWith('dec_')));
  const isolated = await project(t);
  assert.equal(
    (await execute('read', { id: d.decision.id }, isolated)).error.code,
    'INVALID_INPUT',
  );
});
test('accepted decisions require attestation; supersession replaces active guidance', async (t) => {
  const root = await project(t);
  assert.equal(
    (await execute('record', { ...accepted, acceptance: undefined }, root)).error.code,
    'INVALID_INPUT',
  );
  const old = await ok('record', accepted, root);
  const next = await ok(
    'record',
    { ...accepted, text: 'Use a task-specific comparison list.', supersedes: old.decision.id },
    root,
  );
  const ctx = await ok('context', { task: 'Invoices', scope: 'src/invoices/page.tsx' }, root);
  assert.ok(ctx.passages.some((p) => p.id === next.decision.id));
  assert.ok(!ctx.passages.some((p) => p.id === old.decision.id));
  const wrong = await execute(
    'record',
    { ...accepted, scope: ['other/**'], supersedes: next.decision.id },
    root,
  );
  assert.equal(wrong.error.code, 'CONFLICT');
});
test('conflicting active decisions stop prescriptive context and malformed decisions are visible', async (t) => {
  const root = await project(t);
  await ok('record', accepted, root);
  await ok('record', { ...accepted, text: 'Use cards.' }, root);
  assert.equal(
    (await execute('context', { task: 'Invoices', scope: 'src/invoices/page.tsx' }, root)).error
      .code,
    'CONFLICT',
  );
  await writeFile(path.join(root, 'design/decisions/broken.md'), 'not frontmatter');
  assert.equal(
    (await execute('context', { task: 'Home', scope: 'src/home.tsx' }, root)).error.code,
    'INVALID_INPUT',
  );
});
test('idempotency prevents duplicate decisions and rejects changed input', async (t) => {
  const root = await project(t);
  const input = { ...accepted, idempotencyKey: 'one-choice' };
  const one = await execute('record', input, root);
  const two = await execute('record', input, root);
  assert.deepEqual(one, two);
  assert.equal(
    (await execute('record', { ...input, text: 'Different' }, root)).error.code,
    'CONFLICT',
  );
});
test('an interrupted idempotent operation is not silently repeated', async (t) => {
  const root = await project(t);
  const input = recordRequest.parse({ ...accepted, idempotencyKey: 'interrupted' });
  const file = path.join(root, '.anypixel', `request-${hash('record:interrupted')}.json`);
  await writeFile(file, json({ digest: hash(json(input)), state: 'started' }));
  const response = await execute('record', input, root);
  assert.equal(response.error.code, 'CONFLICT');
  assert.match(response.error.message, /interrupted/);
});
test('pack edits require explicit relocking; external guidance needs no engine change', async (t) => {
  const root = await project(t);
  await cp(path.join(repo, 'examples/dense-product-ui'), path.join(root, 'pack'), {
    recursive: true,
  });
  await editConfig(root, (c) => c.packs.push('./pack'));
  await lockPacks(root);
  const ctx = await ok(
    'context',
    { task: 'Compare invoice tables', scope: 'src/invoices.tsx' },
    root,
  );
  assert.ok(ctx.passages.some((p) => p.id === 'dense/comparison'));
  const file = path.join(root, 'pack/skills/improve-dense-screen/references/comparison.md');
  await writeFile(file, 'New local practice.');
  assert.equal(
    (await execute('context', { task: 'Compare invoice tables' }, root)).error.code,
    'CONFLICT',
  );
  await lockPacks(root);
  assert.ok(
    (await ok('context', { task: 'Compare invoice tables' }, root)).passages.some(
      (p) => p.text === 'New local practice.',
    ),
  );
});
test('required project guidance cannot silently fall out of a small context budget', async (t) => {
  const root = await project(t);
  await writeFile(path.join(root, 'design/brief.md'), 'Important constraint. '.repeat(100));
  assert.equal(
    (await execute('context', { task: 'Review', budget: 1000 }, root)).error.code,
    'INVALID_INPUT',
  );
});
test('external extension produces verifiable evidence and optional CI policy', async (t) => {
  const root = await project(t);
  await configureFake(root);
  const ctx = await ok('context', { task: 'Review' }, root);
  const cap = await ok('observe', { observer: 'test/capture', input: {} }, root);
  const report = await ok('review', { contextId: ctx.id, captureIds: [cap.id], ci: true }, root);
  assert.equal(report.exitCode, 1);
  assert.equal(report.findings[0].basis, 'measured');
  assert.match(await readFile(report.reportPath, 'utf8'), /Fixture issue/);
  await writeFile(path.join(root, `.anypixel/captures/${cap.id}/artifacts/0`), 'tampered');
  assert.equal((await execute('read', { id: cap.id }, root)).error.code, 'CONFLICT');
});
test('missing evidence, unknown checks and thrown checks produce incomplete reports', async (t) => {
  const root = await project(t);
  await configureFake(root);
  const ctx = await ok('context', { task: 'Review' }, root);
  const missing = await ok('review', { contextId: ctx.id }, root);
  assert.equal(missing.exitCode, 2);
  assert.equal(missing.coverage[0].result.status, 'not_assessed');
  const cap = await ok('observe', { observer: 'test/capture', input: {} }, root);
  const unknown = await ok(
    'review',
    { contextId: ctx.id, captureIds: [cap.id], checks: [{ id: 'other/check' }] },
    root,
  );
  assert.equal(unknown.exitCode, 2);
  await configureFake(
    root,
    fakeExtension.replace(
      'async evaluate(input){return',
      "async evaluate(input){throw new Error('fixture crash');return",
    ),
  );
  const crashed = await ok('review', { contextId: ctx.id, captureIds: [cap.id] }, root);
  assert.equal(crashed.coverage[0].result.status, 'error');
  assert.equal(crashed.exitCode, 2);
});
test('host cannot manufacture measured findings or nonexistent evidence', async (t) => {
  const root = await project(t);
  const ctx = await ok('context', { task: 'Review' }, root);
  const f = {
    id: 'fake',
    author: 'host',
    category: 'visual',
    basis: 'measured',
    priority: 'high',
    claim: 'Bad design',
    goalRelevance: 'Test',
    evidence: ['missing'],
    proposedAction: 'Change',
    uncertainty: '',
  };
  assert.equal(
    (await execute('review', { contextId: ctx.id, assessments: [f] }, root)).error.code,
    'INVALID_INPUT',
  );
  assert.equal(
    (
      await execute(
        'review',
        { contextId: ctx.id, assessments: [{ ...f, basis: 'inferred' }] },
        root,
      )
    ).error.code,
    'INVALID_INPUT',
  );
});
test('HTML escapes host content and differing captures do not claim equivalent comparison', async (t) => {
  const root = await project(t);
  await configureFake(root);
  const ctx = await ok('context', { task: '<script>alert(1)</script>' }, root);
  const cap = await ok('observe', { observer: 'test/capture', input: { state: 'one' } }, root);
  const first = await ok('review', { contextId: ctx.id, captureIds: [cap.id] }, root);
  const other = await ok('observe', { observer: 'test/capture', input: { state: 'two' } }, root);
  const second = await ok(
    'review',
    { contextId: ctx.id, captureIds: [other.id], baseReviewId: first.id },
    root,
  );
  assert.match(second.comparison, /No equivalent-state/);
  assert.ok(!(await readFile(second.reportPath, 'utf8')).includes('<script>'));
});
test('paths and symlinks cannot escape project storage', async (t) => {
  const root = await project(t);
  const outside = await project(t);
  await mkdir(path.join(root, 'design/decisions'));
  await symlink(
    path.join(outside, 'design/project.json'),
    path.join(root, 'design/decisions/external.md'),
  );
  assert.equal((await execute('context', { task: 'Review' }, root)).error.code, 'OUT_OF_SCOPE');
  assert.equal((await execute('read', { id: '../../outside' }, root)).error.code, 'INVALID_INPUT');
});
test('extension cancellation and timeout terminate unresponsive workers', async (t) => {
  const root = await project(t);
  const module = path.join(root, 'slow.mjs');
  await writeFile(
    module,
    "export default {apiVersion:1,id:'test/slow',version:'1',observers:{'test/slow':{inputSchema:{type:'object'},async observe(){await new Promise(()=>{})}}}};",
  );
  const request = {
    module: new URL(`file://${module}`).href,
    action: 'observe',
    id: 'test/slow',
    input: {},
    allowedOrigins: [],
  };
  await assert.rejects(worker(request, undefined, 100), /timed out/);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 100);
  await assert.rejects(worker(request, controller.signal), /cancelled/);
});
