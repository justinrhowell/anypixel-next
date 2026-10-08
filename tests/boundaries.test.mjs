import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
test('core has no browser or MCP dependency and main package does not require browser packages',async()=>{
  const dir=new URL('../src/core/',import.meta.url);
  for(const name of await readdir(dir)){
    const source=await readFile(new URL(name,dir),'utf8');
    assert.ok(!/from ['"](?:playwright|axe-core|@modelcontextprotocol\/|\.\.\/mcp)/.test(source),name);
  }
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  assert.ok(!pkg.dependencies.playwright);assert.ok(!pkg.dependencies['axe-core']);
});
