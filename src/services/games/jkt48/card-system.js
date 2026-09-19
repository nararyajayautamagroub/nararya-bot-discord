import {rarityInfo} from './index.js';

export function makeCardId(type,key,rarity){
 const value=String(key||'unknown').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 return [type||'card',value||'unknown',rarity||'common'].join(':');
}
export function awardCard(db,{guildId,userId,type,key,name,rarity,generation=null,imageUrl=null,mode=null,source='unknown'}){
 const cardId=makeCardId(type,key,rarity),now=Date.now();
 db.prepare('INSERT INTO cards(card_id,card_type,subject_key,subject_name,rarity,generation,image_url,mode,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(card_id) DO UPDATE SET subject_name=excluded.subject_name,generation=excluded.generation,image_url=excluded.image_url,mode=excluded.mode').run(cardId,type,key,name,rarity,generation,imageUrl,mode,now);
 db.prepare('INSERT INTO user_cards(guild_id,user_id,card_id,quantity,first_obtained_at,last_obtained_at) VALUES(?,?,?,1,?,?) ON CONFLICT(guild_id,user_id,card_id) DO UPDATE SET quantity=quantity+1,last_obtained_at=excluded.last_obtained_at').run(guildId,userId,cardId,now,now);
 db.prepare('INSERT INTO card_events(guild_id,user_id,card_id,source,rarity,created_at) VALUES(?,?,?,?,?,?)').run(guildId,userId,cardId,source,rarity,now);
 return db.prepare('SELECT c.*,u.quantity FROM cards c JOIN user_cards u ON u.card_id=c.card_id WHERE u.guild_id=? AND u.user_id=? AND c.card_id=?').get(guildId,userId,cardId);
}
export function getInventory(db,guildId,userId,limit=30){
 return db.prepare('SELECT c.*,u.quantity FROM user_cards u JOIN cards c ON c.card_id=u.card_id WHERE u.guild_id=? AND u.user_id=? ORDER BY CASE c.rarity WHEN \'secret\' THEN 7 WHEN \'mythic\' THEN 6 WHEN \'legendary\' THEN 5 WHEN \'epic\' THEN 4 WHEN \'rare\' THEN 3 WHEN \'uncommon\' THEN 2 ELSE 1 END DESC,u.quantity DESC,c.subject_name LIMIT ?').all(guildId,userId,limit);
}
export function getCollectionStats(db,guildId,userId){
 return db.prepare('SELECT rarity,SUM(quantity) quantity,COUNT(*) unique_cards FROM user_cards u JOIN cards c ON c.card_id=u.card_id WHERE guild_id=? AND user_id=? GROUP BY rarity').all(guildId,userId);
}
