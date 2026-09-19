import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {createBotControl,parseOwnerIds} from '../src/security/bot-control.js';

test('owner IDs parser handles comma separated IDs',()=>{
 const ids=parseOwnerIds('123, 456,,789');
 assert.deepEqual([...ids],['123','456','789']);
});

test('bot control persists server and user blacklists',()=>{
 const db=new Database(':memory:');
 const client={application:{owner:{id:'123'}},user:{id:'bot',setPresence:async()=>{}}};
 const control=createBotControl({db,client});
 assert.equal(control.isOwner('123'),true);
 assert.equal(control.isOwner('999'),false);
 control.blacklistServer('111','test','123');
 control.blacklistUser('222','test','123');
 assert.equal(control.isServerBlacklisted('111'),true);
 assert.equal(control.isUserBlacklisted('222'),true);
 assert.equal(control.denyReason({guildId:'111',userId:'999'}),'SERVER_BLACKLIST');
 assert.equal(control.denyReason({guildId:'999',userId:'222'}),'USER_BLACKLIST');
 assert.equal(control.denyReason({guildId:'111',userId:'123'}),null);
 assert.equal(control.unblacklistServer('111'),true);
 assert.equal(control.unblacklistUser('222'),true);
 assert.equal(control.isServerBlacklisted('111'),false);
 assert.equal(control.isUserBlacklisted('222'),false);
 db.close();
});

test('maintenance state persists',async()=>{
 const db=new Database(':memory:');
 const client={application:{owner:{id:'123'}},user:{id:'bot',setPresence:async()=>{}}};
 const control=createBotControl({db,client});
 assert.equal(control.isMaintenance(),false);
 control.setSetting('maintenance','true');
 assert.equal(control.isMaintenance(),true);
 await control.applyPresence();
 db.close();
});
