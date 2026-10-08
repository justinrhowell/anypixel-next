#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { promises as fs } from 'node:fs';
import { execute, init, lockPacks, validatePack, doctor, projectRoot } from '../core/index.js';
import { requests, type Operation } from '../core/contracts.js';
import { json } from '../core/files.js';

const help = `AnyPixel Next — an editable design practice for your existing agent

  init                         Set up a project (preserves existing files)
  context --task TEXT --scope PATH
  observe --input request.json  Capture through a configured observer
  review --input request.json   Review evidence and write a portable report
  record --input decision.json Record a scoped project decision
  read ID [--artifact ID]       Verify and read a stored artifact
  pack validate PATH           Validate an editable practice pack
  pack lock                    Accept the current pack inventory
  doctor                       Inspect configuration and extension availability
  mcp                          Serve the same operations over stdio

Options: --project DIR, --json, --help
All commands accept paths containing spaces. No hosted account is required.
`;
const controller = new AbortController();
process.once('SIGINT', () => controller.abort());
try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    strict: true,
    options: {
      project: { type: 'string' },
      json: { type: 'boolean' },
      help: { type: 'boolean' },
      task: { type: 'string' },
      scope: { type: 'string' },
      input: { type: 'string' },
      artifact: { type: 'string' },
    },
  });
  const [command, sub, arg] = positionals;
  const dir = values.project ?? process.cwd();
  if (!command || values.help) process.stdout.write(help);
  else if (command === 'mcp') {
    const { serve } = await import('../mcp/index.js');
    await serve(dir);
  } else {
    let output: any;
    if (command === 'init') output = await init(dir);
    else if (command === 'doctor') output = await doctor(dir);
    else if (command === 'pack' && sub === 'validate' && arg) {
      const result = await validatePack(arg);
      output = { id: result.manifest.id, files: Object.keys(result.inventory) };
    } else if (command === 'pack' && sub === 'lock')
      output = await lockPacks(await projectRoot(dir));
    else if (Object.hasOwn(requests, command)) {
      let input: unknown;
      if (command === 'context') input = { task: values.task, scope: values.scope };
      else if (command === 'read') input = { id: sub, artifact: values.artifact };
      else {
        if (!values.input) throw new Error(`Use ${command} --input request.json`);
        input = JSON.parse(await fs.readFile(values.input, 'utf8'));
      }
      output = await execute(command as Operation, input, dir, controller.signal);
      process.exitCode = output.error
        ? output.error.code === 'CANCELLED'
          ? 130
          : 2
        : (output.result?.exitCode ?? 0);
    } else throw new Error(`Unknown command: ${positionals.join(' ')}. Use --help.`);
    if (values.json) process.stdout.write(json(output));
    else if (output.error) process.stderr.write(`${output.error.code}: ${output.error.message}\n`);
    else if (output.result?.reportPath)
      process.stdout.write(
        `${output.result.findings.length} findings · ${output.result.coverage.length} check results\nReport: ${output.result.reportPath}\n`,
      );
    else process.stdout.write(json(output.result ?? output));
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 2;
}
