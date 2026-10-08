import { fork } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { DesignError, inside } from './files.js';
import type { Project } from './contracts.js';

export function worker(
  request: Record<string, unknown>,
  signal?: AbortSignal,
  timeout = 30000,
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DesignError('CANCELLED', 'Operation cancelled'));
      return;
    }
    const env = Object.fromEntries(
      ['PATH', 'HOME', 'TMPDIR', 'SystemRoot'].flatMap((key) =>
        process.env[key] ? [[key, process.env[key]!]] : [],
      ),
    );
    const child = fork(new URL('./worker.js', import.meta.url), [], {
      env,
      execArgv: [],
      stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    });
    let settled = false;
    let diagnostics = '';
    child.stderr?.on('data', (data) => {
      diagnostics = (diagnostics + data.toString()).slice(-2000);
    });
    const finish = (error?: Error, value?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      child.kill();
      setTimeout(() => child.kill('SIGKILL'), 1000).unref();
      error ? reject(error) : resolve(value);
    };
    const cancel = () => {
      child.send({ cancel: true });
      setTimeout(() => child.kill('SIGKILL'), 1000).unref();
      finish(new DesignError('CANCELLED', 'Operation cancelled'));
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(new DesignError('TIMEOUT', 'Extension timed out'));
    }, timeout);
    signal?.addEventListener('abort', cancel, { once: true });
    child.once('error', (error) => finish(error));
    child.once('exit', (code) =>
      finish(new DesignError('MISSING_DEPENDENCY', `Extension exited (${code}). ${diagnostics}`)),
    );
    child.once('message', (reply: any) => {
      if (Buffer.byteLength(JSON.stringify(reply)) > 40 * 1024 * 1024)
        return finish(new DesignError('INVALID_INPUT', 'Extension response exceeds 40 MB'));
      reply.ok
        ? finish(undefined, reply.value)
        : finish(new DesignError('INVALID_INPUT', reply.error));
    });
    child.send(request);
  });
}
export async function registry(root: string, config: Project, signal?: AbortSignal) {
  const observers = new Map<string, any>();
  const checks = new Map<string, any>();
  const resolver = createRequire(path.join(root, 'package.json'));
  for (const entry of config.extensions) {
    if (!entry.trusted)
      throw new DesignError('UNTRUSTED_EXTENSION', `Extension is not trusted: ${entry.module}`);
    let resolved: string;
    try {
      resolved = entry.module.startsWith('.')
        ? await inside(root, entry.module)
        : resolver.resolve(entry.module);
    } catch {
      throw new DesignError('MISSING_DEPENDENCY', `Install or correct extension: ${entry.module}`);
    }
    const module = pathToFileURL(resolved).href;
    const meta = await worker({ module, action: 'describe' }, signal);
    for (const [kind, target] of [
      ['observers', observers],
      ['checks', checks],
    ] as const) {
      for (const [id, definition] of Object.entries(meta[kind])) {
        if (!/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test(id) || target.has(id))
          throw new DesignError('CONFLICT', `Invalid or duplicate extension ID: ${id}`);
        target.set(id, {
          ...(definition as object),
          module,
          extension: meta.id,
          version: meta.version,
        });
      }
    }
  }
  return { observers, checks };
}
