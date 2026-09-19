import {rollGacha} from './index.js';
import {jakartaDay} from './databases.js';

export function saveGacha(db,guildId,userId,result,source='jkt48game',generation=null){
 const key=result.member.key||result.member.name;
 db.prepare('INSERT INTO gacha_pulls(guild_id,user_id,source,member_key,member_name,generation,rarity,created_at) VALUES(?,?,?,?,?,?,?,?)').run(guildId,userId,source,key,result.member.name||key,generation??result.member.generation??null,result.rarity,Date.now());
}
export function consumeDailyPull(db,guildId,userId,maxPulls=10){
 const day=jakartaDay();
 const row=db.prepare('SELECT pulls FROM gacha_daily WHERE guild_id=? AND user_id=? AND day=?').get(guildId,userId,day);
 if((row?.pulls||0)>=maxPulls)return {allowed:false,count:row.pulls,day};
 db.prepare('INSERT INTO gacha_daily(guild_id,user_id,day,pulls) VALUES(?,?,?,1) ON CONFLICT(guild_id,user_id,day) DO UPDATE SET pulls=pulls+1').run(guildId,userId,day);
 const next=(row?.pulls||0)+1;
 return {allowed:true,count:next,day};
}
export function getGachaHistory(db,guildId,userId,limit=20){
 return db.prepare('SELECT * FROM gacha_pulls WHERE guild_id=? AND user_id=? ORDER BY created_at DESC LIMIT ?').all(guildId,userId,limit);
}
export {rollGacha};
