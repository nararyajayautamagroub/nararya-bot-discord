import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";

const root=fileURLToPath(new URL("../website/jkt48/",import.meta.url));
const read=name=>readFileSync(join(root,name),"utf8");

test("JKT48 website assets and responsive controls are complete",()=>{
  const html=read("index.html");
  const css=read("style.css");
  const js=read("app.js");
  for(const token of ['id="menuToggle"','id="mainNav"','id="memberGrid"','id="memberSearch"','id="refreshMembers"'])assert.ok(html.includes(token),"Missing "+token);
  assert.ok(html.includes("aria-controls=\"mainNav\""));
  assert.ok(css.includes("--red:#d71920"));
  assert.ok(css.includes("background:var(--white)"));
  assert.ok(css.includes(".hamburger"));
  assert.ok(css.includes("@media(max-width:760px)"));
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.ok(css.includes(".button::after"));
  assert.ok(css.includes("transform:translateY(-2px)"));
  assert.ok(js.includes("AllMember.json"));
  assert.ok(js.includes("ActiveMember.json"));
  assert.ok(js.includes("AbortController"));
  assert.ok(js.includes("Promise.allSettled"));
  assert.ok(js.includes('$(".register-only").forEach'));
  assert.doesNotThrow(()=>new Function(js));
  for(const language of ["id","en","ja","ko","zh","ar","es","pt","fr","de"])assert.ok(js.includes('"'+language+'"'),"Missing language "+language);
});

test("JKT48 website never exposes bot secrets",()=>{
  const files=[read("index.html"),read("style.css"),read("app.js")].join("\n");
  for(const secret of ["DISCORD_TOKEN","BOT_OWNER_IDS","client.login(","API_KEY ="])assert.ok(!files.toLowerCase().includes(secret.toLowerCase()),"Secret token found: "+secret);
});

test("JKT48 source URLs are public read-only endpoints",()=>{
  const js=read("app.js");
  assert.ok(js.includes("https://raw.githubusercontent.com/FrenzY8/JKT48-Member/"));
  assert.ok(js.includes('accept:"application/json"'));
  assert.ok(js.includes('cache:"no-store"'));
});

test("website anchors point to existing sections",()=>{
  const html=read("index.html");
  const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(match=>match[1]));
  const hrefs=[...html.matchAll(/href="#([^"]+)"/g)].map(match=>match[1]);
  for(const href of hrefs)assert.ok(ids.has(href),"Missing section id for #"+href);
});

test("Discord embed utility uses the requested red theme",()=>{
  const source=readFileSync(join(root,"../../src/utils/embeds.js"),"utf8");
  assert.ok(source.includes("0xD71920"));
  assert.ok(source.includes("setColor(EMBED_RED)"));
});

test("website runtime security headers allow the documented public member source",()=>{
  const server=readFileSync(join(root,"../../src/web/website/server.js"),"utf8");
  assert.ok(server.includes("connect-src 'self' https://raw.githubusercontent.com"));
  assert.ok(server.includes("function isInside(base,target)"));
  assert.ok(server.includes("path.resolve(websiteDir,safe)"));
});
