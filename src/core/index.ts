import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ZodError } from 'zod';
import {
  requests,
  captureSchema,
  contextSchema,
  reviewSchema,
  observationSchema,
  checkResultSchema,
  type Operation,
  type Finding,
} from './contracts.js';
import {
  projectRoot,
  inside,
  hash,
  json,
  newId,
  DesignError,
  publish,
  bundle,
  stateRoot,
  withLock,
  exists,
  version,
} from './files.js';
import { config, context, record, decisions } from './project.js';
import { registry, worker } from './extensions.js';
export { init, lockPacks, validatePack } from './project.js';
export { projectRoot, DesignError } from './files.js';

async function observe(root: string, raw: unknown, signal?: AbortSignal) {
  const request = requests.observe.parse(raw);
  const c = await config(root);
  const reg = await registry(root, c, signal);
  const observer = reg.observers.get(request.observer);
  if (!observer)
    throw new DesignError('MISSING_DEPENDENCY', `No configured observer: ${request.observer}`);
  const startedAt = new Date().toISOString();
  const output = observationSchema.parse(
    await worker(
      {
        action: 'observe',
        module: observer.module,
        id: request.observer,
        input: request.input,
        allowedOrigins: c.allowedOrigins,
        projectRoot: root,
      },
      signal,
      60000,
    ),
  );
  const id = newId('cap');
  const files: Record<string, Buffer> = {};
  const seen = new Set<string>();
  let total = 0;
  const artifacts = output.artifacts.map((a, i) => {
    if (
      !/^[a-zA-Z0-9_-]+$/.test(a.id) ||
      seen.has(a.id) ||
      !observer.artifactKinds.includes(a.kind)
    )
      throw new DesignError(
        'INVALID_INPUT',
        'Observer returned duplicate IDs or an undeclared artifact kind',
      );
    seen.add(a.id);
    const data = Buffer.from(a.base64, 'base64');
    total += data.length;
    if (data.length > 20 * 1024 * 1024 || total > 25 * 1024 * 1024)
      throw new DesignError(
        'INVALID_INPUT',
        'Capture exceeds the 20 MB per-artifact or 25 MB total limit',
      );
    const file = `artifacts/${i}`;
    files[file] = data;
    return {
      id: `${id}/${a.id}`,
      kind: a.kind,
      path: file,
      mimeType: a.mimeType,
      bytes: data.length,
      sha256: hash(data),
    };
  });
  signal?.throwIfAborted();
  const result = captureSchema.parse({
    schemaVersion: 1,
    id,
    observer: request.observer,
    extension: observer.extension,
    version: observer.version,
    startedAt,
    endedAt: new Date().toISOString(),
    sourceRevision: 'unknown',
    input: request.input,
    metadata: output.metadata,
    artifacts,
    limitations: [
      ...output.limitations,
      'The relationship between this evidence and the local source revision is not independently verified.',
    ],
  });
  await publish(root, id, result, files);
  return result;
}
const esc = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
function html(
  report: ReturnType<typeof reviewSchema.parse>,
  task: string,
  screenshots: { id: string; mime: string; base64: string }[],
) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><title>Design review</title><style>body{max-width:1000px;margin:40px auto;padding:0 24px;font:17px/1.6 system-ui;color:#20252a;background:#fafaf7}h1{font-size:36px}article,section{border-top:1px solid #aaa;padding:20px 0}p{max-width:78ch}small{color:#46515a}img{max-width:100%;border:1px solid #aaa}code{overflow-wrap:anywhere}li{margin:8px 0}</style><h1>Design review</h1><p>${esc(task)}</p><small>${esc(report.id)} · ${esc(report.createdAt)}</small><section><h2>What was assessed</h2><ul>${report.coverage.map((c) => `<li>${esc(c.check)}: <strong>${esc(c.result.status)}</strong> ${esc(c.result.limitations.join(' '))}</li>`).join('')}</ul><p>${esc(report.comparison)}</p></section><section><h2>Findings (${report.findings.length})</h2>${report.findings.map((f) => `<article><small>${esc(f.priority)} · ${esc(f.basis)} · ${esc(f.author)}</small><h3>${esc(f.claim)}</h3><p>${esc(f.goalRelevance)}</p><p><strong>Suggested action:</strong> ${esc(f.proposedAction)}</p><p>${esc(f.uncertainty)}</p><small>Evidence: ${esc(f.evidence.join(', '))}</small></article>`).join('') || '<p>No findings were returned by the selected checks. This is not a universal design or accessibility verdict.</p>'}</section><section><h2>Limits and remaining work</h2><ul>${report.limitations.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></section><section><h2>Visual evidence</h2>${screenshots.map((s) => `<figure><img alt="Visual evidence ${esc(s.id)}" src="data:${s.mime};base64,${s.base64}"><figcaption>${esc(s.id)}</figcaption></figure>`).join('') || '<p>No image evidence was supplied.</p>'}</section></html>`;
}
async function review(root: string, raw: unknown, signal?: AbortSignal) {
  const request = requests.review.parse(raw);
  const c = await config(root);
  const ctx = contextSchema.parse((await bundle(root, request.contextId)).document);
  const reg = await registry(root, c, signal);
  const selection = request.checks ?? c.checks;
  const captures = await Promise.all(
    request.captureIds.map(async (id) => {
      const b = await bundle(root, id);
      return { ...b, document: captureSchema.parse(b.document) };
    }),
  );
  const files: Record<string, Buffer | string> = {};
  const evidence = new Set<string>();
  const screenshots: { id: string; mime: string; base64: string }[] = [];
  const coverage: ReturnType<typeof reviewSchema.parse>['coverage'] = [];
  for (const cap of captures) {
    const artifacts = await Promise.all(
      cap.document.artifacts.map(async (artifact) => {
        const data = await fs.readFile(await inside(cap.dir, artifact.path));
        files[`evidence/${cap.document.id}/${artifact.path}`] = data;
        evidence.add(artifact.id);
        if (['image/png', 'image/jpeg'].includes(artifact.mimeType))
          screenshots.push({
            id: artifact.id,
            mime: artifact.mimeType,
            base64: data.toString('base64'),
          });
        return { ...artifact, base64: data.toString('base64') };
      }),
    );
    files[`evidence/${cap.document.id}/capture.json`] = json(cap.document);
    for (const check of selection) {
      const ext = reg.checks.get(check.id);
      const started = performance.now();
      let result;
      try {
        if (!ext)
          result = {
            status: 'not_assessed',
            findings: [],
            limitations: [`Check is not configured or installed: ${check.id}`],
          };
        else if (!ext.requires.every((kind: string) => artifacts.some((a) => a.kind === kind)))
          result = {
            status: 'not_assessed',
            findings: [],
            limitations: [`Missing required artifacts: ${ext.requires.join(', ')}`],
          };
        else {
          result = checkResultSchema.parse(
            await worker(
              {
                module: ext.module,
                action: 'check',
                id: check.id,
                input: { artifacts, options: check.options, context: ctx },
              },
              signal,
            ),
          );
          for (const finding of result.findings)
            if (finding.evidence.some((id) => !artifacts.some((a) => a.id === id)))
              throw new DesignError('INVALID_INPUT', 'Check referenced nonexistent evidence');
          result.findings = result.findings.map((f) => ({
            ...f,
            id: `${check.id}/${cap.document.id}/${f.id}`,
            author: `${ext.extension}@${ext.version}:${check.id}`,
          }));
        }
      } catch (error) {
        result = {
          status: signal?.aborted ? 'cancelled' : 'error',
          findings: [],
          limitations: [error instanceof Error ? error.message : String(error)],
        };
      }
      coverage.push({
        check: check.id,
        captureId: cap.document.id,
        extension: ext?.extension ?? 'unavailable',
        version: ext?.version ?? 'unknown',
        options: check.options,
        durationMs: performance.now() - started,
        result: checkResultSchema.parse(result),
      });
    }
  }
  if (!captures.length)
    for (const check of selection)
      coverage.push({
        check: check.id,
        captureId: 'none',
        extension: 'unavailable',
        version: 'unknown',
        options: check.options,
        durationMs: 0,
        result: { status: 'not_assessed', findings: [], limitations: ['No capture was supplied.'] },
      });
  for (const finding of request.assessments) {
    if (finding.basis === 'measured')
      throw new DesignError(
        'INVALID_INPUT',
        'Host assessments must be inferred or human; measured findings come from checks.',
      );
    if (finding.evidence.some((id) => !evidence.has(id)))
      throw new DesignError('INVALID_INPUT', 'Assessment references evidence outside this review');
  }
  const findings = [
    ...coverage.flatMap((c) => c.result.findings),
    ...request.assessments.map((f) => ({ ...f, id: `host/${f.id}` })),
  ];
  if (new Set(findings.map((f) => f.id)).size !== findings.length)
    throw new DesignError('CONFLICT', 'Duplicate finding IDs');
  let comparison = 'No baseline review selected.';
  if (request.baseReviewId) {
    const base = reviewSchema.parse((await bundle(root, request.baseReviewId)).document);
    const oldCaptures = await Promise.all(
      base.captureIds.map(async (id) => captureSchema.parse((await bundle(root, id)).document)),
    );
    const matched =
      oldCaptures.length === captures.length &&
      captures.length > 0 &&
      captures.every(
        (cap, i) =>
          cap.document.observer === oldCaptures[i].observer &&
          json(cap.document.input) === json(oldCaptures[i].input),
      );
    comparison = matched
      ? `Capture requests match baseline ${base.id}. Findings: ${base.findings.length} before, ${findings.length} now. Counts are not a design-quality score; source association remains unverified.`
      : `Baseline ${base.id} has different capture inputs or no comparable capture. No equivalent-state comparison is claimed.`;
  }
  const incomplete = coverage.some((c) =>
    ['not_assessed', 'error', 'cancelled'].includes(c.result.status),
  );
  const exitCode = incomplete
    ? 2
    : request.ci && findings.some((f) => f.basis === 'measured' && f.priority === 'high')
      ? 1
      : 0;
  const report = reviewSchema.parse({
    schemaVersion: 1,
    id: newId('rev'),
    createdAt: new Date().toISOString(),
    toolVersion: version,
    contextId: ctx.id,
    captureIds: request.captureIds,
    baseReviewId: request.baseReviewId,
    comparison,
    ci: request.ci,
    exitCode,
    findings,
    coverage,
    limitations: [
      ...captures.flatMap((c) => c.document.limitations),
      'Automated checks do not establish complete accessibility or usability.',
      ...(request.assessments.length
        ? ['Host assessments are attributed judgments, not verified measurements.']
        : ['Visual critique and interaction success were not assessed by a host or human.']),
      ...(!selection.length ? ['No machine checks were selected.'] : []),
    ],
  });
  files['context.json'] = json(ctx);
  files['report.html'] = html(report, ctx.task, screenshots);
  const directory = await publish(root, report.id, report, files);
  return { ...report, reportPath: path.join(directory, 'report.html') };
}
async function read(root: string, raw: unknown) {
  const request = requests.read.parse(raw);
  if (request.id.startsWith('dec_')) {
    const row = (await decisions(root)).find((d) => d.id === request.id);
    if (!row) throw new DesignError('INVALID_INPUT', 'Decision not found in this project');
    return row;
  }
  const b = await bundle(root, request.id);
  if (!request.artifact) return b.document;
  const artifact = b.document.artifacts?.find((a: any) => a.id === request.artifact);
  const file =
    artifact?.path ??
    (request.id.startsWith('ctx_') ? `sources/${hash(request.artifact)}.txt` : request.artifact);
  if (!Object.hasOwn(b.manifest.files, file))
    throw new DesignError('OUT_OF_SCOPE', 'Artifact is not in this bundle');
  const data = await fs.readFile(await inside(b.dir, file));
  if (data.length > 20 * 1024 * 1024)
    throw new DesignError('INVALID_INPUT', 'Artifact is too large to return inline');
  const mimeType = artifact?.mimeType ?? 'text/plain';
  return ['image/png', 'image/jpeg'].includes(mimeType)
    ? { mimeType, base64: data.toString('base64') }
    : { mimeType, text: data.toString('utf8') };
}
export async function execute(
  operation: Operation,
  input: unknown,
  directory = process.cwd(),
  signal?: AbortSignal,
) {
  const operationId = newId('op');
  try {
    const root = await projectRoot(directory);
    const request = requests[operation].parse(input);
    const invoke = async () => {
      signal?.throwIfAborted();
      const result = await ({ context, observe, review, record, read }[operation] as Function)(
        root,
        request,
        signal,
      );
      if (signal?.aborted)
        return {
          schemaVersion: 1,
          operationId,
          result,
          error: {
            code: 'CANCELLED',
            message: 'Operation cancelled; completed partial artifacts are retained.',
            retryable: true,
          },
        };
      return { schemaVersion: 1, operationId, result };
    };
    if ('idempotencyKey' in request && request.idempotencyKey) {
      const key = `${operation}:${request.idempotencyKey}`;
      return await withLock(root, key, async () => {
        const dir = await stateRoot(root);
        const file = await inside(dir, `request-${hash(key)}.json`, true);
        const digest = hash(json(request));
        if (await exists(file)) {
          const prior = JSON.parse(await fs.readFile(file, 'utf8'));
          if (prior.digest !== digest)
            throw new DesignError(
              'CONFLICT',
              'Idempotency key was already used with different input',
            );
          if (!prior.response)
            throw new DesignError(
              'CONFLICT',
              'Previous operation was interrupted. Inspect completed artifacts before retrying with a new idempotency key.',
            );
          return prior.response;
        }
        await fs.writeFile(file, json({ digest, operationId, state: 'started' }), { flag: 'wx' });
        const response = await invoke();
        if (!response.error) {
          const temporary = `${file}.partial-${operationId}`;
          await fs.writeFile(temporary, json({ digest, response }), { flag: 'wx' });
          await fs.rename(temporary, file);
        }
        return response;
      });
    }
    return await invoke();
  } catch (error) {
    const cancelled = signal?.aborted;
    return {
      schemaVersion: 1,
      operationId,
      error: {
        code: cancelled
          ? 'CANCELLED'
          : error instanceof DesignError
            ? error.code
            : error instanceof ZodError
              ? 'INVALID_INPUT'
              : 'IO_ERROR',
        message: error instanceof Error ? error.message : String(error),
        retryable:
          cancelled ||
          (error instanceof DesignError && ['TIMEOUT', 'CONFLICT'].includes(error.code)),
      },
    };
  }
}
export async function doctor(directory: string) {
  const root = await projectRoot(directory);
  const c = await config(root);
  const r = await registry(root, c);
  return {
    version,
    node: process.version,
    project: root,
    observers: [...r.observers.keys()],
    checks: [...r.checks.keys()],
    limits: { artifactMB: 20, captureMB: 25, observerTimeoutSeconds: 60, checkTimeoutSeconds: 30 },
    integrations:
      'SDK transport testing is distinct from real-host certification. See docs/STATUS.md.',
  };
}
