import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("3.2.2 footer and runtime release contract",()=>{
  const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
  const website=fs.readFileSync("website/jkt48/index.html","utf8");
  const embeds=fs.readFileSync("src/utils/embeds.js","utf8");
  const footer="PT. NARARYA JAYA UTAMA GROUB - All Right Reserved";
  assert.equal(pkg.version,"3.2.2");
  assert.ok(website.includes(footer));
  assert.ok(embeds.includes(footer));
});
