import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("final runtime contract is complete",()=>{
  const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
  assert.equal(pkg.version,"3.1.0");
  assert.equal(pkg.type,"module");
  assert.match(pkg.engines.node,/^>=22/);
  assert.equal(pkg.scripts.start,"node src/index.js");
  assert.equal(pkg.scripts["start:web"],"node src/index.js");
  assert.equal(pkg.scripts.validate,"node tools/validate-repo.mjs");
  assert.ok(fs.existsSync("src/web/gateway/index.js"));
  assert.ok(fs.existsSync("website/jkt48/runtime/api.js"));
  assert.ok(fs.existsSync("website/jkt48/runtime/device.js"));
  assert.ok(fs.existsSync("test/web-server.test.js"));
  assert.ok(fs.existsSync("test/gateway.test.js"));
  assert.ok(fs.existsSync("test/scraper-integrity.test.js"));
});
