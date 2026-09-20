import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("3.2.2 final footer/runtime sanity",()=>{
  const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
  const footer="PT. NARARYA JAYA UTAMA GROUB - All Right Reserved";
  assert.equal(pkg.version,"3.2.2");
  assert.ok(fs.readFileSync("src/index.js","utf8").includes(footer));
  assert.ok(fs.readFileSync("src/utils/embeds.js","utf8").includes(footer));
  assert.ok(fs.readFileSync("website/jkt48/index.html","utf8").includes(footer));
});
