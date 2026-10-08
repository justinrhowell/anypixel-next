import { open } from 'node:fs/promises';
import { isUtf8 } from 'node:buffer';
import path from 'node:path';
import type { Extension } from '../sdk/index.js';
import { inside, version } from '../core/files.js';

const limit = 20 * 1024 * 1024;
const formats: Record<string, { mimeType: string; kind: string }> = {
  '.png': { mimeType: 'image/png', kind: 'files/image' },
  '.jpg': { mimeType: 'image/jpeg', kind: 'files/image' },
  '.jpeg': { mimeType: 'image/jpeg', kind: 'files/image' },
  '.md': { mimeType: 'text/markdown', kind: 'files/document' },
  '.txt': { mimeType: 'text/plain', kind: 'files/document' },
  '.json': { mimeType: 'application/json', kind: 'files/document' },
};

const extension: Extension = {
  apiVersion: 1,
  id: 'anypixel/files',
  version,
  observers: {
    'files/import': {
      inputSchema: {
        type: 'object',
        required: ['path'],
        additionalProperties: false,
        properties: {
          path: { type: 'string', minLength: 1, maxLength: 4096 },
          description: { type: 'string', minLength: 1, maxLength: 2000 },
        },
      },
      artifactKinds: ['files/image', 'files/document'],
      async observe(input, io) {
        const relative = input.path as string;
        if (
          path.isAbsolute(relative) ||
          relative.includes('\\') ||
          relative.split('/').includes('..')
        )
          throw new Error('Use a project-relative path without parent traversal.');
        const format = formats[path.extname(relative).toLowerCase()];
        if (!format) throw new Error('Import supports PNG, JPEG, Markdown, text, and JSON files.');
        io.signal.throwIfAborted();
        const file = await open(await inside(io.projectRoot, relative), 'r');
        let data: Buffer;
        try {
          const stat = await file.stat();
          if (!stat.isFile()) throw new Error('Import requires a regular file.');
          if (stat.size > limit) throw new Error('Imported files must be 20 MB or smaller.');
          // Bound the actual read too: a file may grow after stat.
          const buffer = Buffer.alloc(limit + 1);
          let length = 0;
          while (length < buffer.length) {
            io.signal.throwIfAborted();
            const { bytesRead } = await file.read(buffer, length, buffer.length - length, null);
            if (!bytesRead) break;
            length += bytesRead;
          }
          if (length > limit) throw new Error('Imported files must be 20 MB or smaller.');
          data = buffer.subarray(0, length);
        } finally {
          await file.close();
        }
        if (!data.length) throw new Error('Cannot import an empty file.');
        if (
          format.mimeType === 'image/png' &&
          !data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
        )
          throw new Error('File does not have a PNG signature.');
        if (
          format.mimeType === 'image/jpeg' &&
          !data.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))
        )
          throw new Error('File does not have a JPEG signature.');
        if (format.kind === 'files/document') {
          if (!isUtf8(data) || data.includes(0))
            throw new Error('Documents must contain UTF-8 text.');
          if (format.mimeType === 'application/json') JSON.parse(data.toString('utf8'));
        }
        io.signal.throwIfAborted();
        return {
          metadata: {
            origin: 'import',
            path: relative,
            ...(input.description ? { suppliedDescription: input.description } : {}),
          },
          limitations: [
            'Imported evidence: source, capture time, and described interface state are supplied by the caller and not independently verified.',
            'No live browser, DOM, or accessibility measurements were collected by this import.',
            ...(format.kind === 'files/image'
              ? [
                  'Image format is checked by signature; the image is not decoded or validated in full.',
                ]
              : []),
          ],
          artifacts: [{ id: 'file', ...format, base64: data.toString('base64') }],
        };
      },
    },
  },
};

export default extension;
