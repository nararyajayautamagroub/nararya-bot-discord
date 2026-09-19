import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {createVerificationService} from '../src/security/verification.js';

test('verification codes are server-bound and redeemable once',()=>{
 const db=new Database(':memory:');
 const service=createVerificationService({db,baseUrl:'https://verify.example.test'});
 const a=service.createSession({guildId:'guild-a',userId:'user-a'});
 const b=service.createSession({guildId:'guild-b',userId:'user-b'});
 assert.notEqual(a.ticket,b.ticket);
 db.prepare('UPDATE verification_sessions SET issued_at=? WHERE id=?').run(Date.now()-2000,a.ticket);
 const completed=service.completeWebChallenge({ticket:a.ticket,challenge:a.challenge,human:true,honeypot:'',startedAt:Date.now()});
 assert.match(completed.code,/^[A-Z2-9]{4}$/);
 const redeemed=service.redeemCode({guildId:'guild-a',userId:'user-a',code:completed.code});
 assert.ok(redeemed.sessionId);
 assert.throws(()=>service.redeemCode({guildId:'guild-a',userId:'user-a',code:completed.code}),/Tidak ada sesi verifikasi aktif/);
 assert.throws(()=>service.redeemCode({guildId:'guild-b',userId:'user-b',code:completed.code}),/Kode salah/);
 db.close();
});

test('verification rejects honeypot submissions',()=>{
 const db=new Database(':memory:');
 const service=createVerificationService({db,baseUrl:'https://verify.example.test'});
 const session=service.createSession({guildId:'guild-a',userId:'user-a'});
 db.prepare('UPDATE verification_sessions SET issued_at=? WHERE id=?').run(Date.now()-2000,session.ticket);
 assert.throws(()=>service.completeWebChallenge({ticket:session.ticket,challenge:session.challenge,human:true,honeypot:'bot',startedAt:Date.now()}),/Verifikasi tidak valid/);
 db.close();
});
