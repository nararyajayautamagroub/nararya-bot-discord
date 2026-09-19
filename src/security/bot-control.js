import {PermissionFlagsBits} from 'discord.js';

export function parseOwnerIds(value=''){
 return new Set(String(value||'').split(',').map(x=>x.trim()).filter(Boolean));
}

export function createBotControl({db,client}={}){
 db.exec(`
 CREATE TABLE IF NOT EXISTS bot_settings(
   key TEXT PRIMARY KEY,
   value TEXT,
   updated_at INTEGER NOT NULL
 );
 CREATE TABLE IF NOT EXISTS blacklisted_servers(
   guild_id TEXT PRIMARY KEY,
   reason TEXT,
   added_by TEXT NOT NULL,
   created_at INTEGER NOT NULL
 );
 CREATE TABLE IF NOT EXISTS blacklisted_users(
   user_id TEXT PRIMARY KEY,
   reason TEXT,
   added_by TEXT NOT NULL,
   created_at INTEGER NOT NULL
 );
 `);

 const configuredOwners=parseOwnerIds(process.env.BOT_OWNER_IDS);
 const applicationOwnerIds=()=> {
  const owner=client?.application?.owner;
  if(!owner)return [];
  if(owner.user) return [owner.user.id];
  if(owner.id) return [owner.id];
  if(owner.members?.map) return [...owner.members.keys()];
  return [];
 };

 function isOwner(userId){
  return configuredOwners.has(String(userId))||applicationOwnerIds().includes(String(userId));
 }

 function requireOwner(interaction){
  if(isOwner(interaction.user.id))return true;
  return false;
 }

 function isServerBlacklisted(guildId){
  return !!db.prepare('SELECT guild_id FROM blacklisted_servers WHERE guild_id=?').get(guildId);
 }

 function isUserBlacklisted(userId){
  return !!db.prepare('SELECT user_id FROM blacklisted_users WHERE user_id=?').get(userId);
 }

 function denyReason({guildId,userId}={}){
  if(userId&&isUserBlacklisted(userId))return'USER_BLACKLIST';
  if(guildId&&isServerBlacklisted(guildId))return'SERVER_BLACKLIST';
  return null;
 }

 function setSetting(key,value){
  db.prepare('INSERT INTO bot_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').run(key,String(value),Date.now());
 }

 function getSetting(key,fallback=null){
  const row=db.prepare('SELECT value FROM bot_settings WHERE key=?').get(key);
  return row?.value??fallback;
 }

 function settings(){
  return db.prepare('SELECT key,value,updated_at FROM bot_settings ORDER BY key').all();
 }

 async function applyPresence(){
  if(!client?.user)return;
  const maintenance=getSetting('maintenance','false')==='true';
  const activity=getSetting('activity','Nararya Bot Discord');
  await client.user.setPresence({
   activities:[{name:activity,type:0}],
   status:maintenance?'dnd':'online'
  });
 }

 function blacklistServer(guildId,reason,addedBy){
  db.prepare('INSERT INTO blacklisted_servers(guild_id,reason,added_by,created_at) VALUES(?,?,?,?) ON CONFLICT(guild_id) DO UPDATE SET reason=excluded.reason,added_by=excluded.added_by,created_at=excluded.created_at').run(String(guildId),reason||'No reason',String(addedBy),Date.now());
 }

 function unblacklistServer(guildId){
  return db.prepare('DELETE FROM blacklisted_servers WHERE guild_id=?').run(String(guildId)).changes>0;
 }

 function blacklistUser(userId,reason,addedBy){
  db.prepare('INSERT INTO blacklisted_users(user_id,reason,added_by,created_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET reason=excluded.reason,added_by=excluded.added_by,created_at=excluded.created_at').run(String(userId),reason||'No reason',String(addedBy),Date.now());
 }

 function unblacklistUser(userId){
  return db.prepare('DELETE FROM blacklisted_users WHERE user_id=?').run(String(userId)).changes>0;
 }

 function listServers(){return db.prepare('SELECT * FROM blacklisted_servers ORDER BY created_at DESC').all()}
 function listUsers(){return db.prepare('SELECT * FROM blacklisted_users ORDER BY created_at DESC').all()}

 async function leaveIfBlacklisted(guild){
  if(!guild||!isServerBlacklisted(guild.id))return false;
  await guild.leave().catch(()=>{});
  return true;
 }

 return {
  isOwner,requireOwner,isServerBlacklisted,isUserBlacklisted,denyReason,
  setSetting,getSetting,settings,applyPresence,
  blacklistServer,unblacklistServer,blacklistUser,unblacklistUser,listServers,listUsers,
  leaveIfBlacklisted
 };
}

export function ownerPermissionText(){
 return PermissionFlagsBits.Administrator.toString();
}
