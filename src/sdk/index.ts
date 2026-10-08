export type { Finding, CheckResult, Observation, Artifact } from '../core/contracts.js';
import type { Artifact, CheckResult, Observation } from '../core/contracts.js';

/** Plugin code is trusted native code. Worker isolation is not a security sandbox. */
export interface Extension {
  apiVersion: 1;
  id: string;
  version: string;
  observers?: Record<string, {
    inputSchema: Record<string, unknown>;
    artifactKinds: string[];
    observe(input: Record<string, unknown>, io: { signal: AbortSignal; allowedOrigins: string[] }): Promise<Observation>;
  }>;
  checks?: Record<string, {
    optionsSchema: Record<string, unknown>;
    requires: string[];
    evaluate(input: { artifacts: (Artifact & { base64: string })[]; options: Record<string, unknown>; context: unknown }, io: { signal: AbortSignal }): Promise<CheckResult>;
  }>;
}
