import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { init, execute } from '../dist/core/index.js';
export async function project(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'anypixel next test '));
  t?.after(() => rm(root, { recursive: true, force: true }));
  await init(root); return root;
}
export async function editConfig(root, change) {
  const file = path.join(root, 'design/project.json'); const c = JSON.parse(await readFile(file, 'utf8'));
  change(c); await writeFile(file, JSON.stringify(c, null, 2));
}
export async function ok(op, input, root, signal) {
  const response = await execute(op, input, root, signal);
  if (response.error) throw new Error(JSON.stringify(response.error)); return response.result;
}
export const fakeExtension = `export default {apiVersion:1,id:'test/fake',version:'1.0.0',observers:{'test/capture':{inputSchema:{type:'object'},artifactKinds:['test/data'],async observe(){return {metadata:{},limitations:[],artifacts:[{id:'facts',kind:'test/data',mimeType:'application/json',base64:Buffer.from('{}').toString('base64')}]}}}},checks:{'test/check':{optionsSchema:{type:'object'},requires:['test/data'],async evaluate(input){return {status:'completed',findings:[{id:'f',author:'fake',category:'test',basis:'measured',priority:'high',claim:'Fixture issue',goalRelevance:'Tests evidence',evidence:[input.artifacts[0].id],proposedAction:'Fix fixture',uncertainty:'Fixture only'}],limitations:[]}}}}}`;
export async function configureFake(root, code = fakeExtension) {
  await writeFile(path.join(root, 'extension.mjs'), code);
  await editConfig(root, c => { c.extensions = [{ module: './extension.mjs', trusted: true }]; c.checks = [{ id: 'test/check', options: {} }]; });
}
