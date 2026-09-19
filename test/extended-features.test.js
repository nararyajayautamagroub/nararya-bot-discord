import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import {EXTENDED_FEATURES} from "../src/config/extended-features.js";
import {FEATURE_REGISTRY} from "../src/config/features.js";
import {createExtendedFeatures} from "../src/services/extended-features.js";
import {createXpCardSvg,createXpCardBuffer,levelFromXp,xpForLevel} from "../src/services/leveling/xp-card.js";
import {createPresenceRotation} from "../src/services/presence-rotation.js";

test("feature catalog reaches exactly 150",()=>{
 assert.equal(EXTENDED_FEATURES.length,89);
 assert.equal(FEATURE_REGISTRY.length,150);
 assert.equal(new Set(FEATURE_REGISTRY.map(x=>x.id)).size,150);
});

test("extended feature manager initializes persistent tables",()=>{
 const db=new Database(":memory:");
 const client={guilds:{cache:new Map()},channels:{fetch:async()=>null}};
 const botControl={isOwner:()=>true,isMaintenance:()=>false,settings:()=>[],setSetting:()=>{},getSetting:()=> "true",applyPresence:async()=>{}};
 const manager=createExtendedFeatures({db,client,botControl,embed:()=>({})});
 assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='feature_settings'").get());
 assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='security_incidents'").get());
 assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='owner_audit_log'").get());
 assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='polls'").get());
 assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='starboard'").get());
 manager.ensureTables(db);
 db.close();
});

test("XP card exposes level and progress",()=>{
 assert.equal(xpForLevel(3),900);
 assert.equal(levelFromXp(900),3);
 const svg=createXpCardSvg({username:"Rafa",xp:450,level:2,streak:5,rarity:"rare",wins:12});
 assert.match(svg,/NARARYA PROFILE CARD/);
 assert.match(svg,/LEVEL 2/);
 assert.match(svg,/Progress/);
 assert.ok(createXpCardBuffer({username:"Rafa",xp:100}).length>100);
});

test("presence rotation uses Discord Playing activity",async()=>{
 let state=null;
 const client={user:{setPresence:v=>{state=v;}}};
 const botControl={settings:()=>[{key:"activity_rotation",value:'["Nararya 1","Nararya 2"]'},{key:"maintenance",value:"false"}]};
 const rotation=createPresenceRotation({client,botControl,intervalMs:60000});
 await rotation.apply();
 assert.equal(state.status,"online");
 assert.equal(state.activities[0].type,0);
 assert.ok(state.activities[0].name);
 rotation.stop();
});
