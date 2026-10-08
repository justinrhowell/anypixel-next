import { z } from 'zod';

export const text = z.string().min(1);
export const name = z.string().regex(/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/);
export const id = z.string().regex(/^(ctx|cap|rev|dec)_[0-9a-f-]{36}$/);
export const pathName = z
  .string()
  .min(1)
  .refine(
    (s) => !s.startsWith('/') && !s.includes('\\') && !s.split('/').includes('..'),
    'Use a project-relative path',
  );
const options = z.record(z.string(), z.unknown());
export const checkSelection = z.object({ id: name, options: options.default({}) }).strict();
export const projectSchema = z
  .object({
    schemaVersion: z.literal(1),
    packs: z.array(text).default([]),
    extensions: z.array(z.object({ module: text, trusted: z.literal(true) }).strict()).default([]),
    checks: z.array(checkSelection).default([]),
    allowedOrigins: z.array(z.string().url()).default([]),
  })
  .strict();
export const artifactSchema = z
  .object({
    id: text,
    kind: name,
    path: pathName,
    mimeType: text,
    bytes: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export const findingSchema = z
  .object({
    id: text,
    author: text,
    category: text,
    basis: z.enum(['measured', 'inferred', 'human']),
    priority: z.enum(['high', 'medium', 'low']),
    claim: text,
    goalRelevance: text,
    evidence: z.array(text),
    proposedAction: text,
    uncertainty: z.string(),
  })
  .strict()
  .refine(
    (f) => f.basis !== 'measured' || f.evidence.length > 0,
    'Measured findings need evidence',
  );
export const checkResultSchema = z
  .object({
    status: z.enum(['completed', 'not_applicable', 'not_assessed', 'error', 'cancelled']),
    findings: z.array(findingSchema),
    limitations: z.array(text),
  })
  .strict();
export const observationSchema = z
  .object({
    artifacts: z.array(
      z.object({ id: text, kind: name, mimeType: text, base64: z.string() }).strict(),
    ),
    limitations: z.array(text),
    metadata: options,
  })
  .strict();
export const acceptanceSchema = z.object({ actor: text, source: text }).strict();
export const decisionSchema = z
  .object({
    schemaVersion: z.literal(1),
    id,
    key: name,
    scope: z.array(text).min(1),
    status: z.enum(['proposed', 'accepted', 'rejected']),
    text,
    reason: text,
    evidence: z.array(text).default([]),
    createdAt: z.iso.datetime(),
    expiresAt: z.iso.datetime().optional(),
    supersedes: id.optional(),
    acceptance: acceptanceSchema.optional(),
  })
  .strict()
  .refine(
    (d) => d.status !== 'accepted' || !!d.acceptance,
    'Accepted decisions need an acceptance attestation',
  );
const common = { idempotencyKey: z.string().min(1).max(200).optional() };
export const contextRequest = z
  .object({
    ...common,
    task: text,
    scope: pathName.default('.'),
    budget: z.number().int().min(1000).max(100000).default(12000),
  })
  .strict();
export const observeRequest = z.object({ ...common, observer: name, input: options }).strict();
export const reviewRequest = z
  .object({
    ...common,
    contextId: id,
    captureIds: z.array(id).default([]),
    checks: z.array(checkSelection).optional(),
    assessments: z.array(findingSchema).default([]),
    baseReviewId: id.optional(),
    ci: z.boolean().default(false),
  })
  .strict();
export const recordRequest = z
  .object({
    ...common,
    key: name,
    scope: z.array(text).min(1),
    status: z.enum(['proposed', 'accepted', 'rejected']).default('proposed'),
    text,
    reason: text,
    evidence: z.array(text).default([]),
    expiresAt: z.iso.datetime().optional(),
    supersedes: id.optional(),
    acceptance: acceptanceSchema.optional(),
  })
  .strict();
export const readRequest = z.object({ id, artifact: text.optional() }).strict();
export const requests = {
  context: contextRequest,
  observe: observeRequest,
  review: reviewRequest,
  record: recordRequest,
  read: readRequest,
};
export type Operation = keyof typeof requests;
export type Finding = z.infer<typeof findingSchema>;
export type Decision = z.infer<typeof decisionSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Artifact = z.infer<typeof artifactSchema>;
export type CheckResult = z.infer<typeof checkResultSchema>;
export type Observation = z.infer<typeof observationSchema>;

export const contextSchema = z
  .object({
    schemaVersion: z.literal(1),
    id,
    task: text,
    scope: text,
    createdAt: z.iso.datetime(),
    lockDigest: text,
    passages: z.array(
      z.object({ id: text, path: text, sha256: text, text: z.string(), reason: text }).strict(),
    ),
    omitted: z.array(text),
  })
  .strict();
export const captureSchema = z
  .object({
    schemaVersion: z.literal(1),
    id,
    observer: name,
    extension: text,
    version: text,
    startedAt: z.iso.datetime(),
    endedAt: z.iso.datetime(),
    sourceRevision: text,
    input: options,
    metadata: options,
    artifacts: z.array(artifactSchema),
    limitations: z.array(text),
  })
  .strict();
export const reviewSchema = z
  .object({
    schemaVersion: z.literal(1),
    id,
    createdAt: z.iso.datetime(),
    toolVersion: text,
    contextId: id,
    captureIds: z.array(id),
    baseReviewId: id.optional(),
    comparison: text,
    ci: z.boolean(),
    exitCode: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    findings: z.array(findingSchema),
    coverage: z.array(
      z
        .object({
          check: text,
          captureId: text,
          extension: text,
          version: text,
          options,
          durationMs: z.number().nonnegative(),
          result: checkResultSchema,
        })
        .strict(),
    ),
    limitations: z.array(text),
  })
  .strict();
export const wireSchemas = {
  project: projectSchema,
  decision: decisionSchema,
  context: contextSchema,
  capture: captureSchema,
  review: reviewSchema,
  observation: observationSchema,
  checkResult: checkResultSchema,
  ...Object.fromEntries(Object.entries(requests).map(([k, v]) => [`${k}Request`, v])),
};
