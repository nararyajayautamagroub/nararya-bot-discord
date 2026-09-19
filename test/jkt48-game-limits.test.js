import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {consumeDailyPull} from '../src/services/games/jkt48/gacha.js';
import {consumeDailyQuiz} from '../src/services/games/jkt48/quiz-system.js';
import {rarityPercentage,rollRarity} from '../src/services/games/jkt48/index.js';

test('gacha uses a date-keyed 10 pull limit',()=>{
 const db=new Database(':memory:');
 db.exec('CREATE TABLE gacha_daily(guild_id TEXT,user_id TEXT,day TEXT,pulls INTEGER,PRIMARY KEY(guild_id,user_id,day));');
 for(let i=0;i<10;i++)assert.equal(consumeDailyPull(db,'g','u',10).allowed,true);
 assert.equal(consumeDailyPull(db,'g','u',10).allowed,false);
});

test('quiz uses a date-keyed 10 play limit',()=>{
 const db=new Database(':memory:');
 db.exec('CREATE TABLE quiz_daily(guild_id TEXT,user_id TEXT,day TEXT,plays INTEGER,PRIMARY KEY(guild_id,user_id,day));');
 for(let i=0;i<10;i++)assert.equal(consumeDailyQuiz(db,'g','u',10).allowed,true);
 assert.equal(consumeDailyQuiz(db,'g','u',10).allowed,false);
});

test('rarity percentages sum to 100 and rolls are valid',()=>{
 const total=Object.values(rarityPercentage).reduce((a,b)=>a+b,0);
 assert.equal(Number(total.toFixed(4)),100);
 for(let i=0;i<100;i++)assert.ok(rarityPercentage[rollRarity()]!==undefined);
});
