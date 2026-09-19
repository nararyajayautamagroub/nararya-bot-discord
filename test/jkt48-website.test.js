import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../website/jkt48/',import.meta.url));
const read=name=>readFileSync(join(root,name),'utf8');

test('JKT48 website assets exist and contain required responsive controls',()=>{
  const html=read('index.html');
  const css=read('style.css');
  const js=read('app.js');
  assert.match(html,/id="menuToggle"/);
  assert.match(html,/>=</);
  assert.match(html,/id="mainNav"/);
  assert.match(html,/id="memberGrid"/);
  assert.match(html,/id="memberSearch"/);
  assert.match(css,/--red:#d71920/);
  assert.match(css,/background:var\(--white\)/);
  assert.match(css,/\A?\.hamburger/.source);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(js,/AllMember\.json/);
  assert.match(js,/ActiveMember\.json/);
  assert.match(js,/AbortController/);
});

test('JKT48 website does not expose Discord token or owner secret',()=>{
  const files=[read('index.html'),read('style.css'),read('app.js')].join('\n');
  assert.doesNotMatch(files,/DISCORD_TOKEN/i);
  assert.doesNotMatch(files,/BOT_OWNER_IDS/i);
  assert.doesNotMatch(files,/API_KEY\s*=/i);
});

test('JKT48 source URLs remain public read-only endpoints',()=>{
  const js=read('app.js');
  assert.match(js,/https:\/\/raw\.githubusercontent\.com\/FrenzY8\/JKT48-Member/);
  assert.match(js,/accept:'application\/json'/);
});

test('website links and sections are internally consistent',()=>{
  const html=read('index.html');
  const ids=[...html.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
  const hrefs=[...html.matchAll(/href="#([^"]+)"/g)].map(match=>match[1]);
  for(const href of hrefs)assert.ok(ids.includes(href),'Missing section id for #'+href);
});
