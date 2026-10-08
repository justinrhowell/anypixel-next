import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const installRoot = fileURLToPath(new URL('../../', import.meta.url));
export const version = JSON.parse(await fs.readFile(path.join(installRoot, 'package.json'), 'utf8')).version as string;
export class DesignError extends Error {
  constructor(public code: string, message: string, public details: unknown = undefined) { super(message); }
}
export const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
export const newId = (prefix: string) => `${prefix}_${randomUUID()}`;
export const exists = async (p: string) => { try { await fs.access(p); return true; } catch { return false; } };

export async function inside(root: string, relative: string, create = false): Promise<string> {
  const base = await fs.realpath(root);
  const resolved = path.resolve(base, relative);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) throw new DesignError('OUT_OF_SCOPE', `Path is outside the configured root: ${relative}`);
  let walk = resolved;
  while (!(await exists(walk))) { const next = path.dirname(walk); if (next === walk) break; walk = next; }
  const real = await fs.realpath(walk);
  if (real !== base && !real.startsWith(base + path.sep)) throw new DesignError('OUT_OF_SCOPE', `Symlink escapes the configured root: ${relative}`);
  if (!create) await fs.access(resolved);
  return resolved;
}
export async function projectRoot(input = process.cwd()): Promise<string> {
  let dir = await fs.realpath(input);
  while (true) {
    if (await exists(path.join(dir, 'design/project.json'))) return dir;
    if (await exists(path.join(dir, '.git')) || path.dirname(dir) === dir) throw new DesignError('INVALID_INPUT', 'No design/project.json found. Run anypixel-next init in your project.');
    dir = path.dirname(dir);
  }
}
export async function stateRoot(root: string) {
  const dir = await inside(root, '.anypixel', true);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}
const kindOf = (id: string) => {
  if (!/^(ctx|cap|rev)_[0-9a-f-]{36}$/.test(id)) throw new DesignError('INVALID_INPUT', 'Invalid artifact ID');
  return { ctx: 'contexts', cap: 'captures', rev: 'reviews' }[id.slice(0,3)]!;
};
export async function publish(root: string, id: string, doc: unknown, files: Record<string, Buffer | string> = {}) {
  const state = await stateRoot(root);
  const parent = await inside(state, kindOf(id), true); await fs.mkdir(parent, { recursive: true });
  const tmp = await fs.mkdtemp(path.join(parent, '.partial-'));
  try {
    const all = { ...files, 'document.json': json(doc) };
    const inventory: Record<string, { sha256: string; bytes: number }> = {};
    for (const [name, data] of Object.entries(all)) {
      const target = await inside(tmp, name, true); await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, data, { flag: 'wx' }); inventory[name] = { sha256: hash(data), bytes: Buffer.byteLength(data) };
    }
    await fs.writeFile(path.join(tmp, 'manifest.json'), json({ schemaVersion: 1, files: inventory }), { flag: 'wx' });
    const target = path.join(parent, id);
    if (await exists(target)) throw new DesignError('CONFLICT', 'Artifact already exists');
    await fs.rename(tmp, target); return target;
  } catch (error) { await fs.rm(tmp, { recursive: true, force: true }); throw error; }
}
export async function bundle(root: string, id: string) {
  const dir = await inside(root, `.anypixel/${kindOf(id)}/${id}`);
  const manifest = JSON.parse(await fs.readFile(await inside(dir, 'manifest.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || !manifest.files?.['document.json']) throw new DesignError('INVALID_INPUT', 'Unsupported or invalid artifact manifest');
  for (const [file, expected] of Object.entries(manifest.files) as [string, { sha256: string; bytes: number }][]) {
    const bytes = await fs.readFile(await inside(dir, file));
    if (bytes.length !== expected.bytes || hash(bytes) !== expected.sha256) throw new DesignError('CONFLICT', `Artifact verification failed: ${id}/${file}`);
  }
  return { dir, manifest, document: JSON.parse(await fs.readFile(path.join(dir, 'document.json'), 'utf8')) };
}
export async function withLock<T>(root: string, key: string, fn: () => Promise<T>): Promise<T> {
  const state = await stateRoot(root);
  const file = await inside(state, `${hash(key)}.lock`, true);
  let handle;
  try { handle = await fs.open(file, 'wx'); } catch { throw new DesignError('CONFLICT', 'Another write is active. Retry after it finishes.'); }
  try { await handle.writeFile(json({ pid: process.pid, createdAt: new Date().toISOString() })); return await fn(); }
  finally { await handle.close(); await fs.rm(file, { force: true }); }
}
