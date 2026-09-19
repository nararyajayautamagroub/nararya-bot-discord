export function score(seconds=0,base=100,multiplier=1){return Math.max(25,Math.round((base-Math.floor(Math.max(0,seconds)/10)*5)*multiplier))}
export function addScore(db,guildId,userId,points,win){
 const old=db.prepare('SELECT * FROM quiz_scores WHERE guild_id=? AND user_id=?').get(guildId,userId);
 const streak=win?(old?.streak||0)+1:0;
 const maxStreak=Math.max(old?.max_streak||0,streak);
 db.prepare('INSERT INTO quiz_scores(guild_id,user_id,points,games,wins,streak,max_streak) VALUES(?,?,?,?,?,?,?) ON CONFLICT(guild_id,user_id) DO UPDATE SET points=points+excluded.points,games=games+1,wins=wins+excluded.wins,streak=excluded.streak,max_streak=excluded.max_streak').run(guildId,userId,points,1,win?1:0,streak,maxStreak);
 return db.prepare('SELECT * FROM quiz_scores WHERE guild_id=? AND user_id=?').get(guildId,userId);
}
