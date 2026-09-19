import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";

const root=fileURLToPath(new URL("../website/jkt48/",import.meta.url));
const read=name=>readFileSync(join(root,name),"utf8");

test("JKT48 website assets and responsive controls are complete",()=>{
  const html=read("index.html"),css=read("style.css"),js=read("app.js");
  for(const token of ['id="menuToggle"','id="mainNav"','id="memberGrid"','id="memberSearch"','id="refreshMembers"'])assert.ok(html.includes(token),`Missing ${token}`);
  assert.match(html,/>=</);
  assert.match(css,/--red:#d71920/);
  assert.match(css,/background:var\\(--white\\)/);
  assert.match(css,/\\.hamburger/);
  assert.match(css,/@media\\(max-width:760px\\)/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/\\.button::after/);
  assert.match(css,/transform:translateY\\(-2px\\)/);
  assert.match(js,/AllMember\\.json/);
  assert.match(js,/ActiveMember\\.json/);
  assert.match(js,/AbortController/);
  assert.match(js,/Promise\\.allSettled/);
});

test("JKT48 website never exposes bot secrets",()=>{
  const files=[read("index.html"),read("style.css"),read("app.js")].join("\
");
  assert.doesNotMatch(files,/DISCORD_TOKEN/i);
  assert.doesNotMatch(files,/BOT_OWNER_IDS/i);
  assert.doesNotMatch(files,/API_KEY\\s*=/i);
  assert.doesNotMatch(files,/client\\.login\\(/i);
});

test("JKT48 source URLs are public read-only endpoints",()=>{
  const js=read("app.js");
  assert.match(js,/https:\\/\\/raw\\.githubusercontent\\.com\\/FrenzY8\\/JKT48-Member/);
  assert.match(js,/accept:"application\\/json"/);
  assert.match(js,/cache:"no-store"/);
});

test("website anchors point to existing sections",()=>{
  const html=read("index.html");
  const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(match=>match[1]));
  const hrefs=[...html.matchAll(/href="#([^"]+)"/g)].map(match=>match[1]);
  for(const href of hrefs)assert.ok(ids.has(href),"Missing section id for #"+href);
});

test("Discord embed utility uses the requested red theme",()=>{
  const source=readFileSync(join(root,"../../src/utils/embeds.js"),"utf8");
  assert.match(source,/0xD71920/);
  assert.match(source,/setColor\\(EMBED_RED\\)/);
});