import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { parse as parseYaml, stringify as yaml } from 'yaml';
import picomatch from 'picomatch';
import {
  projectSchema,
  decisionSchema,
  contextSchema,
  recordRequest,
  contextRequest,
  type Decision,
} from './contracts.js';
import {
  inside,
  exists,
  installRoot,
  hash,
  json,
  newId,
  DesignError,
  withLock,
  publish,
} from './files.js';

export async function config(root: string) {
  return projectSchema.parse(
    JSON.parse(await fs.readFile(await inside(root, 'design/project.json'), 'utf8')),
  );
}
export async function init(root: string) {
  const target = await inside(root, 'design/project.json', true);
  await fs.mkdir(path.dirname(target), { recursive: true });
  if (await exists(target))
    throw new DesignError('CONFLICT', 'design/project.json already exists; it was preserved.');
  await fs.writeFile(
    target,
    json({
      schemaVersion: 1,
      packs: ['builtin:starter'],
      extensions: [],
      checks: [],
      allowedOrigins: [],
    }),
    { flag: 'wx' },
  );
  const lock = await lockPacks(root);
  return {
    project: target,
    lock,
    next: 'Add .anypixel/ to your project .gitignore. Run context to begin. Browser tools are optional.',
  };
}
export async function validatePack(directory: string) {
  const dir = await fs.realpath(directory);
  const raw = await fs.readFile(await inside(dir, 'pack.json'), 'utf8');
  const manifest = JSON.parse(raw);
  const schema = JSON.parse(
    await fs.readFile(path.join(installRoot, 'schemas/pack.schema.json'), 'utf8'),
  );
  const ajv = new Ajv2020({ strict: false });
  if (!ajv.validate<any>(schema, manifest))
    throw new DesignError('INVALID_INPUT', ajv.errorsText());
  const ids = new Set();
  const files: Record<string, string> = { 'pack.json': raw };
  for (const entry of manifest.entries) {
    if (!/\.(md|txt|json)$/i.test(entry.path))
      throw new DesignError(
        'INVALID_INPUT',
        `Data-only entries must be md/txt/json: ${entry.path}`,
      );
    if (ids.has(entry.id)) throw new DesignError('CONFLICT', `Duplicate pack entry: ${entry.id}`);
    ids.add(entry.id);
    files[entry.path] = await readText(dir, entry.path);
  }
  async function walk(relative: string) {
    const location = await inside(dir, relative);
    for (const entry of await fs.readdir(location, { withFileTypes: true })) {
      const file = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await walk(file);
      else {
        if (!/\.(md|txt|json)$/i.test(file))
          throw new DesignError(
            'INVALID_INPUT',
            `Data-only pack supports md/txt/json files in this alpha: ${file}`,
          );
        files[file] = await readText(dir, file);
      }
    }
  }
  for (const skill of manifest.skills) {
    await walk(skill);
    const body = files[`${skill}/SKILL.md`];
    const front = body?.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const metadata = front && parseYaml(front[1]);
    if (!metadata || metadata.name !== path.basename(skill) || !metadata.description)
      throw new DesignError('INVALID_INPUT', `Invalid skill metadata: ${skill}`);
  }
  return {
    manifest,
    files,
    inventory: Object.fromEntries(
      Object.entries(files)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([file, body]) => [file, hash(body)]),
    ),
  };
}
async function readText(root: string, relative: string) {
  const file = await inside(root, relative);
  const size = (await fs.stat(file)).size;
  if (size > 1024 * 1024)
    throw new DesignError('INVALID_INPUT', `Text file exceeds 1 MB: ${relative}`);
  return fs.readFile(file, 'utf8');
}
async function resolvedPacks(root: string) {
  const c = await config(root);
  const ids = new Set<string>();
  const entryIds = new Set<string>();
  const packs = [];
  for (const source of c.packs) {
    const directory =
      source === 'builtin:starter'
        ? path.join(installRoot, 'packs/starter')
        : path.resolve(root, source);
    const pack = await validatePack(directory);
    if (ids.has(pack.manifest.id))
      throw new DesignError('CONFLICT', `Duplicate pack: ${pack.manifest.id}`);
    for (const entry of pack.manifest.entries) {
      if (entryIds.has(entry.id))
        throw new DesignError('CONFLICT', `Duplicate entry ID across packs: ${entry.id}`);
      entryIds.add(entry.id);
    }
    ids.add(pack.manifest.id);
    packs.push({ source, ...pack });
  }
  return packs;
}
export async function lockPacks(root: string) {
  return withLock(root, 'pack-lock', async () => {
    const packs = await resolvedPacks(root);
    const data = {
      schemaVersion: 1,
      packs: packs.map((p) => ({
        source: p.source,
        id: p.manifest.id,
        version: p.manifest.version,
        files: p.inventory,
      })),
    };
    const target = await inside(root, 'design/packs.lock.json', true);
    const tmp = `${target}.${newId('tmp')}`;
    await fs.writeFile(tmp, json(data), { flag: 'wx' });
    await fs.rename(tmp, target);
    return data;
  });
}
export async function decisions(root: string): Promise<Decision[]> {
  const dir = await inside(root, 'design/decisions', true);
  if (!(await exists(dir))) return [];
  const rows = [];
  for (const file of (await fs.readdir(dir)).filter((f) => f.endsWith('.md')).sort()) {
    const body = await readText(dir, file);
    const match = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) throw new DesignError('INVALID_INPUT', `Malformed decision: ${file}`);
    const row = decisionSchema.parse({ ...parseYaml(match[1]), text: match[2].trim() });
    if (file !== `${row.id}.md`)
      throw new DesignError('INVALID_INPUT', `Decision ID does not match filename: ${file}`);
    rows.push(row);
  }
  const byId = new Map(rows.map((d) => [d.id, d]));
  for (const row of rows) {
    if (!row.supersedes) continue;
    const old = byId.get(row.supersedes);
    if (
      !old ||
      old.key !== row.key ||
      json(old.scope) !== json(row.scope) ||
      row.status !== 'accepted' ||
      old.status !== 'accepted'
    )
      throw new DesignError('CONFLICT', `Invalid supersession: ${row.id}`);
    const seen = new Set([row.id]);
    let cursor: Decision | undefined = old;
    while (cursor) {
      if (seen.has(cursor.id)) throw new DesignError('CONFLICT', 'Decision supersession cycle');
      seen.add(cursor.id);
      cursor = cursor.supersedes ? byId.get(cursor.supersedes) : undefined;
    }
  }
  return rows;
}
export async function record(root: string, input: unknown) {
  const request = recordRequest.parse(input);
  return withLock(root, 'decisions', async () => {
    const rows = await decisions(root);
    const { idempotencyKey: _, ...fields } = request;
    const row = decisionSchema.parse({
      ...fields,
      schemaVersion: 1,
      id: newId('dec'),
      createdAt: new Date().toISOString(),
    });
    if (row.supersedes) {
      const prior = rows.find((d) => d.id === row.supersedes);
      if (
        !prior ||
        prior.status !== 'accepted' ||
        row.status !== 'accepted' ||
        prior.key !== row.key ||
        json(prior.scope) !== json(row.scope) ||
        rows.some((d) => d.supersedes === prior.id)
      )
        throw new DesignError(
          'CONFLICT',
          'Supersession requires a current accepted decision with the same key and scope',
        );
    }
    const target = await inside(root, `design/decisions/${row.id}.md`, true);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const { text, ...metadata } = row;
    const tmp = `${target}.partial`;
    await fs.writeFile(tmp, `---\n${yaml(metadata)}---\n${text}\n`, { flag: 'wx' });
    await fs.rename(tmp, target);
    return { decision: row, path: path.relative(root, target) };
  });
}
export async function context(root: string, input: unknown) {
  const request = contextRequest.parse(input);
  const packs = await resolvedPacks(root);
  const lockText = await fs.readFile(await inside(root, 'design/packs.lock.json'), 'utf8');
  const expected = {
    schemaVersion: 1,
    packs: packs.map((p) => ({
      source: p.source,
      id: p.manifest.id,
      version: p.manifest.version,
      files: p.inventory,
    })),
  };
  if (json(JSON.parse(lockText)) !== json(expected))
    throw new DesignError(
      'CONFLICT',
      'Practice packs changed. Inspect changes, then run pack lock.',
    );
  const allDecisions = await decisions(root);
  const superseded = new Set(
    allDecisions.filter((d) => d.status === 'accepted').map((d) => d.supersedes),
  );
  const selected = allDecisions.filter(
    (d) =>
      d.status === 'accepted' &&
      !superseded.has(d.id) &&
      (!d.expiresAt || Date.parse(d.expiresAt) > Date.now()) &&
      d.scope.some((s) => picomatch(s, { dot: true })(request.scope)),
  );
  const keys = new Set<string>();
  for (const d of selected) {
    if (keys.has(d.key))
      throw new DesignError(
        'CONFLICT',
        `Multiple accepted decisions govern ${d.key}`,
        selected.filter((v) => v.key === d.key),
      );
    keys.add(d.key);
  }
  const passages: { id: string; path: string; sha256: string; text: string; reason: string }[] = [];
  const omitted: string[] = [];
  const snapshots: Record<string, string> = {};
  let bytes = 0;
  function add(id: string, file: string, body: string, reason: string, required: boolean) {
    snapshots[`sources/${hash(id)}.txt`] = body;
    const size = Buffer.byteLength(body);
    if (bytes + size > request.budget) {
      if (required)
        throw new DesignError(
          'INVALID_INPUT',
          'Required project context exceeds the budget. Narrow scope or increase budget.',
        );
      omitted.push(id);
      return;
    }
    bytes += size;
    passages.push({ id, path: file, sha256: hash(body), text: body, reason });
  }
  for (const name of ['brief.md', 'system.md']) {
    const file = `design/${name}`;
    if (await exists(await inside(root, file, true)))
      add(file, file, await readText(root, file), 'Explicit project guidance', true);
  }
  for (const d of selected)
    add(
      d.id,
      `design/decisions/${d.id}.md`,
      `${d.text}\nReason: ${d.reason}`,
      'Accepted decision matching task scope',
      true,
    );
  for (const pack of packs)
    for (const entry of pack.manifest.entries) {
      if (
        entry.scope &&
        !entry.scope.some((scope: string) => picomatch(scope, { dot: true })(request.scope))
      )
        continue;
      const body = pack.files[entry.path];
      if (
        entry.kind !== 'guide' &&
        !entry.topics.some((topic: string) =>
          request.task.toLowerCase().includes(topic.toLowerCase()),
        )
      ) {
        omitted.push(entry.id);
        snapshots[`sources/${hash(entry.id)}.txt`] = body;
        continue;
      }
      add(
        entry.id,
        `${pack.source}/${entry.path}`,
        body,
        `Practice ${pack.manifest.id}@${pack.manifest.version}`,
        false,
      );
    }
  const result = contextSchema.parse({
    schemaVersion: 1,
    id: newId('ctx'),
    task: request.task,
    scope: request.scope,
    createdAt: new Date().toISOString(),
    lockDigest: hash(lockText),
    passages,
    omitted,
  });
  await publish(root, result.id, result, snapshots);
  return result;
}
