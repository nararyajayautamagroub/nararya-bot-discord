import test from "node:test";
import assert from "node:assert/strict";
import {SCRAPER_REGISTRY,getScraperDefinition} from "../src/services/scrapers/registry.js";

test("scraper registry is executable and internally consistent",()=>{
  assert.ok(Array.isArray(SCRAPER_REGISTRY));
  assert.ok(SCRAPER_REGISTRY.length>=20);
  const keys=new Set();
  for(const item of SCRAPER_REGISTRY){
    assert.match(item.key,/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
    assert.ok(!keys.has(item.key),"Duplicate scraper key: "+item.key);
    keys.add(item.key);
    assert.match(item.url,/^https?:\/\//);
    assert.ok(Number.isFinite(item.intervalMs)&&item.intervalMs>=10000);
    assert.match(item.group,/^[a-z0-9-]+$/);
    assert.equal(getScraperDefinition(item.key).key,item.key);
  }
});

test("scraper registry contains the configured data groups",()=>{
  const groups=new Set(SCRAPER_REGISTRY.map(x=>x.group));
  for(const group of ["news","prices","electronics","restaurant-prices","disaster","market","ramadan"])assert.ok(groups.has(group),"Missing scraper group: "+group);
});
