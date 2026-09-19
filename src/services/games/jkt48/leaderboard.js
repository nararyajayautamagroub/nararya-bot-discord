export const leaderboard=(db,guildId)=>db.prepare('SELECT user_id,points,games,wins,streak,max_streak FROM quiz_scores WHERE guild_id=? ORDER BY points DESC,wins DESC LIMIT 10').all(guildId);
