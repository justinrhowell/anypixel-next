import { mkdir, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { wireSchemas } from '../dist/core/contracts.js';
await mkdir(new URL('../schemas/', import.meta.url), { recursive: true });
for (const [name, schema] of Object.entries(wireSchemas)) {
  await writeFile(
    new URL(`../schemas/${name}.schema.json`, import.meta.url),
    JSON.stringify(
      z.toJSONSchema(schema, { target: 'draft-2020-12', unrepresentable: 'any' }),
      null,
      2,
    ) + '\n',
  );
}
