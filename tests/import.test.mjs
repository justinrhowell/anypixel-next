import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile, mkdir, symlink, open } from 'node:fs/promises';
import path from 'node:path';
import { execute } from '../dist/core/index.js';
import { project, editConfig, ok, configureFake } from './helpers.mjs';

const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG2kAAAAASUVORK5CYII=';
async function setup(t) {
  const root = await project(t);
  await editConfig(root, (c) => {
    c.extensions = [{ module: 'builtin:files', trusted: true }];
  });
  return root;
}

test('import preserves evidence after source changes and supports attributed visual review', async (t) => {
  const root = await setup(t);
  await writeFile(path.join(root, 'screen.png'), Buffer.from(png, 'base64'));
  const cap = await ok(
    'observe',
    {
      observer: 'files/import',
      input: { path: 'screen.png', description: 'A caller-supplied screen' },
    },
    root,
  );
  assert.equal(cap.sourceRevision, 'unknown');
  assert.equal(cap.metadata.origin, 'import');
  assert.equal(cap.metadata.suppliedDescription, 'A caller-supplied screen');
  assert.equal(cap.artifacts[0].kind, 'files/image');
  assert.match(cap.limitations.join(' '), /not independently verified/);
  await writeFile(path.join(root, 'screen.png'), 'source changed');
  assert.equal((await ok('read', { id: cap.id, artifact: cap.artifacts[0].id }, root)).base64, png);
  const ctx = await ok('context', { task: 'Review a reference', scope: 'src/page.tsx' }, root);
  const report = await ok(
    'review',
    {
      contextId: ctx.id,
      captureIds: [cap.id],
      assessments: [
        {
          id: 'example',
          author: 'test fixture',
          category: 'visual',
          basis: 'inferred',
          priority: 'low',
          claim: 'Example judgment',
          goalRelevance: 'Exercise reference review',
          evidence: [cap.artifacts[0].id],
          proposedAction: 'Discuss the reference',
          uncertainty: 'A fixture, not a real design critique',
        },
      ],
    },
    root,
  );
  assert.equal(report.findings[0].basis, 'inferred');
  assert.match(await readFile(report.reportPath, 'utf8'), new RegExp(png.replace(/[+]/g, '\\+')));
  await writeFile(path.join(root, '.anypixel/captures', cap.id, cap.artifacts[0].path), 'tampered');
  assert.equal((await execute('read', { id: cap.id }, root)).error.code, 'CONFLICT');
});

test('imported files cannot satisfy a check that requires measured capture artifacts', async (t) => {
  const root = await project(t);
  await configureFake(root);
  await editConfig(root, (c) => {
    c.extensions.push({ module: 'builtin:files', trusted: true });
  });
  await writeFile(
    path.join(root, 'facts.json'),
    '{"note":"caller-supplied, not a measured artifact"}',
  );
  const cap = await ok(
    'observe',
    { observer: 'files/import', input: { path: 'facts.json' } },
    root,
  );
  const ctx = await ok('context', { task: 'Check the reference' }, root);
  const report = await ok('review', { contextId: ctx.id, captureIds: [cap.id], ci: true }, root);
  assert.equal(report.exitCode, 2);
  assert.equal(report.coverage[0].result.status, 'not_assessed');
  assert.equal(report.findings.length, 0);
  const read = await ok('read', { id: cap.id, artifact: cap.artifacts[0].id }, root);
  assert.equal(read.mimeType, 'application/json');
  assert.equal(JSON.parse(read.text).note, 'caller-supplied, not a measured artifact');
});

test('import rejects paths outside the project, non-files, invalid formats, and oversized files', async (t) => {
  const root = await setup(t);
  const outside = await project(t);
  await writeFile(path.join(outside, 'private.txt'), 'outside');
  await symlink(path.join(outside, 'private.txt'), path.join(root, 'link.txt'));
  await mkdir(path.join(root, 'directory.txt'));
  await writeFile(path.join(root, 'bad.png'), 'not an image');
  await writeFile(path.join(root, 'bad.jpg'), 'not an image');
  await writeFile(path.join(root, 'bad.json'), '{');
  await writeFile(path.join(root, 'bad.txt'), Buffer.from([0xff]));
  await writeFile(path.join(root, 'empty.md'), '');
  const large = await open(path.join(root, 'large.txt'), 'w');
  await large.truncate(20 * 1024 * 1024 + 1);
  await large.close();
  for (const file of [
    '../private.txt',
    path.join(outside, 'private.txt'),
    'link.txt',
    'directory.txt',
    'bad.png',
    'bad.jpg',
    'bad.json',
    'bad.txt',
    'empty.md',
    'large.txt',
    'code.js',
    'missing.txt',
  ]) {
    const response = await execute(
      'observe',
      { observer: 'files/import', input: { path: file } },
      root,
    );
    assert.ok(response.error, file);
    assert.equal(response.result, undefined, file);
  }
  const forgedRoot = await execute(
    'observe',
    { observer: 'files/import', input: { path: 'private.txt', projectRoot: outside } },
    root,
  );
  assert.ok(forgedRoot.error);
});

test('import is explicitly configured and accepts valid text, Markdown, and JPEG references', async (t) => {
  const root = await project(t);
  const missing = await execute(
    'observe',
    { observer: 'files/import', input: { path: 'reference.txt' } },
    root,
  );
  assert.equal(missing.error.code, 'MISSING_DEPENDENCY');
  await editConfig(root, (c) => {
    c.extensions = [{ module: 'builtin:files', trusted: true }];
  });
  // Image validation promises a signature check only, not full decoding.
  for (const [name, data, mime] of [
    ['reference.txt', Buffer.from('Keep the action visible. 🪴'), 'text/plain'],
    ['reference.md', Buffer.from('# Reference\nKeep the action visible.'), 'text/markdown'],
    [
      'reference.jpeg',
      Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex'),
      'image/jpeg',
    ],
  ]) {
    await writeFile(path.join(root, name), data);
    const cap = await ok('observe', { observer: 'files/import', input: { path: name } }, root);
    const result = await ok('read', { id: cap.id, artifact: cap.artifacts[0].id }, root);
    assert.equal(result.mimeType, mime);
    assert.deepEqual(
      result.base64 ? Buffer.from(result.base64, 'base64') : Buffer.from(result.text),
      data,
    );
  }
});
