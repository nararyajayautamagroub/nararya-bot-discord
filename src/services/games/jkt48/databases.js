import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export function createJkt48FeatureDatabases(root=process.env.JKT48_GAME_DATA_DIR||'./data/jkt48'){
 const dir=path.resolve(root);
 fs.mkdirSync(dir,{recursive:true});
 const open=name=>{
  const db=new Database(path.join(dir,name+'.db'));
  db.pragma('journal_mode=WAL');
  db.pragma('foreign_keys=ON');
  return db;
 };
 const quiz=open('quiz');
 const gacha=open('gacha');
 const cards=open('cards');
 quiz.exec(
  'CREATE TABLE IF NOT EXISTS quiz_assets(id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT NOT NULL,answer TEXT NOT NULL,media_url TEXT NOT NULL,rarity TEXT,active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL);'+
  'CREATE INDEX IF NOT EXISTS idx_quiz_assets_kind ON quiz_assets(kind,active);'+
  'CREATE TABLE IF NOT EXISTS quiz_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,channel_id TEXT NOT NULL,message_id TEXT,mode TEXT NOT NULL,answer TEXT NOT NULL,media_url TEXT,rarity TEXT NOT NULL,started_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,status TEXT NOT NULL DEFAULT \'active\');'+
  'CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_active_user ON quiz_sessions(guild_id,user_id) WHERE status=\'active\';'+
  'CREATE TABLE IF NOT EXISTS quiz_scores(guild_id TEXT NOT NULL,user_id TEXT NOT NULL,points INTEGER NOT NULL DEFAULT 0,games INTEGER NOT NULL DEFAULT 0,wins INTEGER NOT NULL DEFAULT 0,streak INTEGER NOT NULL DEFAULT 0,max_streak INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(guild_id,user_id));'+
  'CREATE TABLE IF NOT EXISTS quiz_attempts(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,mode TEXT NOT NULL,rarity TEXT NOT NULL,answer TEXT NOT NULL,input TEXT NOT NULL,correct INTEGER NOT NULL,points INTEGER NOT NULL DEFAULT 0,duration_ms INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);'
 );
 gacha.exec(
  'CREATE TABLE IF NOT EXISTS gacha_pulls(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,source TEXT NOT NULL,member_key TEXT NOT NULL,member_name TEXT NOT NULL,generation INTEGER,rarity TEXT NOT NULL,created_at INTEGER NOT NULL);'+
  'CREATE TABLE IF NOT EXISTS gacha_daily(guild_id TEXT NOT NULL,user_id TEXT NOT NULL,day TEXT NOT NULL,pulls INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(guild_id,user_id,day));'+
  'CREATE INDEX IF NOT EXISTS idx_gacha_pulls_user ON gacha_pulls(guild_id,user_id,created_at DESC);'
 );
 cards.exec(
  'CREATE TABLE IF NOT EXISTS cards(card_id TEXT PRIMARY KEY,card_type TEXT NOT NULL,subject_key TEXT NOT NULL,subject_name TEXT NOT NULL,rarity TEXT NOT NULL,generation INTEGER,image_url TEXT,mode TEXT,created_at INTEGER NOT NULL);'+
  'CREATE TABLE IF NOT EXISTS user_cards(guild_id TEXT NOT NULL,user_id TEXT NOT NULL,card_id TEXT NOT NULL,quantity INTEGER NOT NULL DEFAULT 0,first_obtained_at INTEGER NOT NULL,last_obtained_at INTEGER NOT NULL,PRIMARY KEY(guild_id,user_id,card_id),FOREIGN KEY(card_id) REFERENCES cards(card_id) ON DELETE CASCADE);'+
  'CREATE TABLE IF NOT EXISTS card_events(id INTEGER PRIMARY KEY AUTOINCREMENT,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,card_id TEXT NOT NULL,source TEXT NOT NULL,rarity TEXT NOT NULL,created_at INTEGER NOT NULL);'+
  'CREATE INDEX IF NOT EXISTS idx_user_cards ON user_cards(guild_id,user_id,quantity DESC);'+
  'CREATE INDEX IF NOT EXISTS idx_card_events_user ON card_events(guild_id,user_id,created_at DESC);'
 );
 return {dir,quiz,gacha,cards};
}

export function jakartaDay(date=new Date()){
 return date.toLocaleDateString('en-CA',{timeZone:process.env.BOT_TIMEZONE||'Asia/Jakarta'});
}
