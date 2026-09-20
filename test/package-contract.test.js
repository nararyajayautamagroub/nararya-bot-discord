import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("package scripts and runtime contract are install-ready",()=>{
  const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
  assert.equal(pkg.type,"module");
  assert.ok(pkg.engines.node.startsWith(">="));
  assert.equal(pkg.scripts.start,"node src/index.js");
  assert.equal(pkg.scripts["start:web"],"node src/index.js");
  assert.equal(pkg.scripts["check:runtime"],"npm run validate && find src test website -type f -name '*.js' -print0 | xargs -0 -n1 node --check");
  for(const dep of ["better-sqlite3","cheerio","discord.js","dotenv"])assert.ok(pkg.dependencies[dep],"Missing dependency: "+dep);
});
