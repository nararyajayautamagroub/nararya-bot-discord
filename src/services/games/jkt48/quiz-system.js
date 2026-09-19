import {rarityInfo} from './index.js';
import {jakartaDay} from './databases.js';

export function addQuizAsset(db,kind,answer,mediaUrl,rarity=null){
 db.prepare('INSERT INTO quiz_assets(kind,answer,media_url,rarity,created_at) VALUES(?,?,?,?,?)').run(kind,answer,mediaUrl,rarity,Date.now());
}
export function getQuizAssets(db,kind){
 return db.prepare('SELECT * FROM quiz_assets WHERE active=1 AND kind=? ORDER BY RANDOM()').all(kind);
}
export function migrateLegacyAssets(legacyDb,quizDb){
 try{
  const rows=legacyDb.prepare('SELECT id,kind,answer,media_url,active FROM jkt48_game_assets').all();
  if(!rows.length)return 0;
  const insert=quizDb.prepare('INSERT OR IGNORE INTO quiz_assets(id,kind,answer,media_url,active,created_at) VALUES(?,?,?,?,?,?)');
  const tx=quizDb.transaction(items=>{for(const x of items)insert.run(x.id,x.kind,x.answer,x.media_url,x.active,Date.now())});
  tx(rows);
  return rows.length;
 }catch{return 0}
}
export function consumeDailyQuiz(db,guildId,userId,maxPlays=10){
 const day=jakartaDay();
 const row=db.prepare('SELECT plays FROM quiz_daily WHERE guild_id=? AND user_id=? AND day=?').get(guildId,userId,day);
 if((row?.plays||0)>=maxPlays)return {allowed:false,count:row.plays,day};
 db.prepare('INSERT INTO quiz_daily(guild_id,user_id,day,plays) VALUES(?,?,?,1) ON CONFLICT(guild_id,user_id,day) DO UPDATE SET plays=plays+1').run(guildId,userId,day);
 return {allowed:true,count:(row?.plays||0)+1,day};
}
export function startSession(db,{guildId,userId,channelId,mode,answer,mediaUrl,rarity,durationMs=60000}){
 db.prepare('UPDATE quiz_sessions SET status=\'expired\' WHERE guild_id=? AND user_id=? AND status=\'active\'').run(guildId,userId);
 const now=Date.now();
 const info=db.prepare('INSERT INTO quiz_sessions(guild_id,user_id,channel_id,mode,answer,media_url,rarity,started_at,expires_at,status) VALUES(?,?,?,?,?,?,?,?,?,\'active\')').run(guildId,userId,channelId,mode,answer,mediaUrl,rarity,now,now+durationMs);
 return db.prepare('SELECT * FROM quiz_sessions WHERE id=?').get(info.lastInsertRowid);
}
export function getActiveSession(db,guildId,userId,channelId=null){
 const row=channelId?db.prepare('SELECT * FROM quiz_sessions WHERE guild_id=? AND user_id=? AND channel_id=? AND status=\'active\' ORDER BY id DESC LIMIT 1').get(guildId,userId,channelId):db.prepare('SELECT * FROM quiz_sessions WHERE guild_id=? AND user_id=? AND status=\'active\' ORDER BY id DESC LIMIT 1').get(guildId,userId);
 if(row&&row.expires_at<=Date.now()){db.prepare('UPDATE quiz_sessions SET status=\'expired\' WHERE id=?').run(row.id);return {...row,status:'expired',timed_out:true}}
 return row;
}
export function finishSession(db,id,status='finished'){
 db.prepare('UPDATE quiz_sessions SET status=? WHERE id=?').run(status,id);
}
export function calculatePoints(seconds,rarity){
 const info=rarityInfo[rarity]||rarityInfo.common;
 return Math.max(25,Math.round((100-Math.floor(Math.max(0,seconds)/10)*5)*info.multiplier));
}
export function recordAttempt(db,{guildId,userId,mode,rarity,answer,input,correct,points=0,durationMs=0}){db.prepare('INSERT INTO quiz_attempts(guild_id,user_id,mode,rarity,answer,input,correct,points,duration_ms,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(guildId,userId,mode,rarity,answer,input,correct?1:0,points,durationMs,Date.now());}
export function recordResult(db,{guildId,userId,mode,rarity,answer,input,correct,points,durationMs}){
 const now=Date.now();
 recordAttempt(db,{guildId,userId,mode,rarity,answer,input,correct,points,durationMs});
 const old=db.prepare('SELECT * FROM quiz_scores WHERE guild_id=? AND user_id=?').get(guildId,userId);
 const nextStreak=correct?(old?.streak||0)+1:0;
 const nextMax=Math.max(old?.max_streak||0,nextStreak);
 db.prepare('INSERT INTO quiz_scores(guild_id,user_id,points,games,wins,streak,max_streak) VALUES(?,?,?,?,?,?,?) ON CONFLICT(guild_id,user_id) DO UPDATE SET points=points+excluded.points,games=games+1,wins=wins+excluded.wins,streak=excluded.streak,max_streak=excluded.max_streak').run(guildId,userId,points,1,correct?1:0,nextStreak,nextMax);
 return db.prepare('SELECT * FROM quiz_scores WHERE guild_id=? AND user_id=?').get(guildId,userId);
}
export function getLeaderboard(db,guildId){
 return db.prepare('SELECT user_id,points,games,wins,streak,max_streak FROM quiz_scores WHERE guild_id=? ORDER BY points DESC,wins DESC LIMIT 10').all(guildId);
}
