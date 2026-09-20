import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();

test('release metadata is aligned',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const version=fs.readFileSync(path.join(root,'VERSION.md'),'utf8').match(/Current version:\s*([^\s]+)/i)?.[1];
  assert.equal(pkg.version,version);
  assert.equal(pkg.version,'3.1.0');
});

test('scraper does not depend on undeclared undici package',()=>{
  const source=fs.readFileSync(path.join(root,'src/jkt48/adapters.js'),'utf8');
  assert.doesNotMatch(source,/from ['"]undici['"]/);
});

test('website exposes current major version',()=>{
  const html=fs.readFileSync(path.join(root,'website/jkt48/index.html'),'utf8');
  assert.match(html,/id="websiteVersion">3\.1</);
});

test('CI workflows contain repository validation',()=>{
  const ci=fs.readFileSync(path.join(root,'.github/workflows/ci.yml'),'utf8');
  const pages=fs.readFileSync(path.join(root,'.github/workflows/jkt48-pages.yml'),'utf8');
  assert.match(ci,/npm run validate/);
  assert.match(pages,/npm run validate/);
});
