import { Ajv } from 'ajv';
import type { Extension } from '../sdk/index.js';
const controller = new AbortController();
process.once('SIGTERM', () => {
  controller.abort();
  setTimeout(() => process.exit(0), 500).unref();
});
process.on('message', async (request: any) => {
  if (request.cancel) {
    controller.abort();
    return;
  }
  try {
    const extension = (await import(request.module)).default as Extension;
    if (extension.apiVersion !== 1 || !extension.id || !extension.version)
      throw new Error('Unsupported extension manifest');
    if (request.action === 'describe') {
      const convert = (entries: any = {}) =>
        Object.fromEntries(
          Object.entries(entries).map(([id, value]: [string, any]) => [
            id,
            {
              inputSchema: value.inputSchema,
              optionsSchema: value.optionsSchema,
              artifactKinds: value.artifactKinds,
              requires: value.requires,
            },
          ]),
        );
      process.send?.({
        ok: true,
        value: {
          apiVersion: 1,
          id: extension.id,
          version: extension.version,
          observers: convert(extension.observers),
          checks: convert(extension.checks),
        },
      });
    } else {
      const ajv = new Ajv({ strict: false, allErrors: true });
      let value;
      if (request.action === 'observe') {
        const observer = extension.observers?.[request.id];
        if (!observer) throw new Error('Unknown observer');
        if (!ajv.validate(observer.inputSchema, request.input)) throw new Error(ajv.errorsText());
        value = await observer.observe(request.input, {
          signal: controller.signal,
          allowedOrigins: request.allowedOrigins,
        });
      } else {
        const check = extension.checks?.[request.id];
        if (!check) throw new Error('Unknown check');
        if (!ajv.validate(check.optionsSchema, request.input.options))
          throw new Error(ajv.errorsText());
        value = await check.evaluate(request.input, { signal: controller.signal });
      }
      process.send?.({ ok: true, value });
    }
  } catch (error) {
    process.send?.({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});
