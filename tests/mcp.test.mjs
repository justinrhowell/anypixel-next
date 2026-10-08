import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { project, configureFake, fakeExtension } from './helpers.mjs';
const cli = fileURLToPath(new URL('../dist/cli/index.js', import.meta.url));

test('official MCP client: discovery, shared core results, working directory and reconnect', async (t) => {
  const root = await project(t);
  await configureFake(root);
  async function connect() {
    const client = new Client({ name: 'anypixel-integration-test', version: '1.0.0' });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cli, 'mcp'],
      cwd: root,
      stderr: 'pipe',
    });
    await client.connect(transport);
    return client;
  }
  let client = await connect();
  try {
    const list = await client.listTools();
    assert.deepEqual(list.tools.map((t) => t.name).sort(), [
      'design_context',
      'design_observe',
      'design_read',
      'design_record',
      'design_review',
    ]);
    const response = await client.callTool({
      name: 'design_context',
      arguments: { task: 'Review from MCP', scope: 'src/page.tsx' },
    });
    assert.ok(!response.isError);
    const ctx = response.structuredContent.result;
    assert.match(ctx.id, /^ctx_/);
    const observed = await client.callTool({
      name: 'design_observe',
      arguments: { observer: 'test/capture', input: {} },
    });
    assert.ok(!observed.isError);
    const cap = observed.structuredContent.result;
    const report = await client.callTool({
      name: 'design_review',
      arguments: { contextId: ctx.id, captureIds: [cap.id] },
    });
    assert.equal(report.structuredContent.result.findings.length, 1);
    await client.close();
    client = await connect();
    const read = await client.callTool({ name: 'design_read', arguments: { id: ctx.id } });
    assert.equal(read.structuredContent.result.task, 'Review from MCP');
  } finally {
    await client.close();
  }
});

test('MCP returns image content and propagates cancellation to the operation', async (t) => {
  const root = await project(t);
  const png =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG2kAAAAASUVORK5CYII=';
  const code = fakeExtension
    .replace("artifactKinds:['test/data']", "artifactKinds:['test/data','web/screenshot']")
    .replace(
      "artifacts:[{id:'facts'",
      `artifacts:[{id:'image',kind:'web/screenshot',mimeType:'image/png',base64:'${png}'},{id:'facts'`,
    );
  await configureFake(root, code);
  const client = new Client({ name: 'anypixel-image-test', version: '1.0.0' });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [cli, 'mcp', '--project', root],
      cwd: root,
      stderr: 'pipe',
    }),
  );
  try {
    const response = await client.callTool({
      name: 'design_observe',
      arguments: { observer: 'test/capture', input: {} },
    });
    const cap = response.structuredContent.result;
    const read = await client.callTool({
      name: 'design_read',
      arguments: { id: cap.id, artifact: cap.artifacts[0].id },
    });
    assert.equal(read.content[0].type, 'image');
    assert.equal(read.content[0].data, png);
    await writeFile(
      path.join(root, 'extension.mjs'),
      code.replace('async observe(){return', 'async observe(){await new Promise(()=>{});return'),
    );
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 200);
    await assert.rejects(
      client.callTool(
        { name: 'design_observe', arguments: { observer: 'test/capture', input: {} } },
        { signal: controller.signal },
      ),
    );
  } finally {
    await client.close();
  }
});
