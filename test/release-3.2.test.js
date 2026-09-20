import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("release 3.2.2 is fully aligned",()=>{
  const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
  const version=fs.readFileSync("VERSION.md","utf8").match(/Current version:\s*([^\s]+)/i)?.[1];
  assert.equal(pkg.version,"3.2.2");
  assert.equal(version,"3.2.2");
  assert.match(fs.readFileSync("website/jkt48/index.html","utf8"),/id="websiteVersion">3\.2/);
});
