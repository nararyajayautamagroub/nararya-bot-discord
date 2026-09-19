import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export function createMediaDatabase(root=process.env.MEDIA_DATA_DIR||'./data/media'){
 const dir=path.resolve(root);
 fs.mkdirSync(dir,{recursive:true});
 const db=new Database(path.join(dir,'media.db'));
 db.pragma('journal_mode=WAL');
 db.exec(`
  CREATE TABLE IF NOT EXISTS media_jobs(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   guild_id TEXT NOT NULL,
   user_id TEXT NOT NULL,
   operation TEXT NOT NULL,
   status TEXT NOT NULL DEFAULT 'queued',
   input_source TEXT,
   input_path TEXT,
   output_path TEXT,
   output_mime TEXT,
   resolution TEXT,
   format TEXT,
   error TEXT,
   created_at INTEGER NOT NULL,
   updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_media_jobs_user ON media_jobs(guild_id,user_id,created_at DESC);
  CREATE TABLE IF NOT EXISTS media_files(
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   job_id INTEGER NOT NULL,
   path TEXT NOT NULL,
   mime TEXT,
   size_bytes INTEGER,
   created_at INTEGER NOT NULL,
   FOREIGN KEY(job_id) REFERENCES media_jobs(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS media_settings(
   guild_id TEXT NOT NULL,
   user_id TEXT NOT NULL,
   resolution TEXT NOT NULL DEFAULT '1080p',
   video_format TEXT NOT NULL DEFAULT 'mp4',
   audio_format TEXT NOT NULL DEFAULT 'mp3',
   updated_at INTEGER NOT NULL,
   PRIMARY KEY(guild_id,user_id)
  );
 `);
 return {db,dir};
}
export const createJob=(db,values)=>{
 const now=Date.now();
 const r=db.prepare('INSERT INTO media_jobs(guild_id,user_id,operation,status,input_source,resolution,format,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(values.guildId,values.userId,values.operation,'running',values.inputSource||null,values.resolution||null,values.format||null,now,now);
 return r.lastInsertRowid;
};
export const updateJob=(db,id,values)=>{
 const sets=Object.keys(values).map(k=>k+'=?');
 db.prepare('UPDATE media_jobs SET '+sets.join(',')+',updated_at=? WHERE id=?').run(...Object.values(values),Date.now(),id);
};
