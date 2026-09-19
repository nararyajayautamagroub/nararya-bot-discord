import {JKT48_MEMBERS,JKT48V_MEMBERS} from './member-seed.js';

export function ensureMemberDatabase(db){
 db.exec(`
 CREATE TABLE IF NOT EXISTS jkt48_members(
  id TEXT PRIMARY KEY,name TEXT NOT NULL,nickname TEXT,generation INTEGER NOT NULL,virtual_generation INTEGER,
  status TEXT NOT NULL DEFAULT 'historical',team TEXT,image_url TEXT,profile_url TEXT,
  join_date TEXT,graduation_date TEXT,showroom_url TEXT,idn_url TEXT,youtube_url TEXT,
  instagram_url TEXT,tiktok_url TEXT,x_url TEXT,updated_at INTEGER DEFAULT 0
 );
 CREATE INDEX IF NOT EXISTS idx_jkt48_members_generation ON jkt48_members(generation);
 CREATE INDEX IF NOT EXISTS idx_jkt48_members_status ON jkt48_members(status);
 CREATE TABLE IF NOT EXISTS jkt48_virtual_members(
  id TEXT PRIMARY KEY,name TEXT NOT NULL,cohort TEXT,status TEXT NOT NULL DEFAULT 'historical',
  youtube_url TEXT,x_url TEXT,instagram_url TEXT,tiktok_url TEXT,graduation_date TEXT,updated_at INTEGER DEFAULT 0
 );
 `);
 const up=db.prepare(`INSERT INTO jkt48_members(id,name,nickname,generation,virtual_generation,status,profile_url,showroom_url,idn_url,youtube_url,instagram_url,tiktok_url,x_url,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
 ON CONFLICT(id) DO UPDATE SET name=excluded.name,nickname=excluded.nickname,generation=excluded.generation,status=excluded.status,
 profile_url=COALESCE(excluded.profile_url,jkt48_members.profile_url),showroom_url=COALESCE(excluded.showroom_url,jkt48_members.showroom_url),
 idn_url=COALESCE(excluded.idn_url,jkt48_members.idn_url),youtube_url=COALESCE(excluded.youtube_url,jkt48_members.youtube_url),
 instagram_url=COALESCE(excluded.instagram_url,jkt48_members.instagram_url),tiktok_url=COALESCE(excluded.tiktok_url,jkt48_members.tiktok_url),
 x_url=COALESCE(excluded.x_url,jkt48_members.x_url),updated_at=excluded.updated_at`);
 const tx=db.transaction(rows=>{for(const m of rows)up.run(m.id,m.name,m.nickname||null,m.generation,m.virtual_generation||null,m.status||'historical',m.profile_url||null,m.showroom_url||null,m.idn_url||null,m.youtube_url||null,m.instagram_url||null,m.tiktok_url||null,m.x_url||null,Date.now())});
 tx(JKT48_MEMBERS);
 const uv=db.prepare(`INSERT INTO jkt48_virtual_members(id,name,cohort,status,youtube_url,x_url,instagram_url,tiktok_url,graduation_date,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,cohort=excluded.cohort,status=excluded.status,
 youtube_url=COALESCE(excluded.youtube_url,jkt48_virtual_members.youtube_url),x_url=COALESCE(excluded.x_url,jkt48_virtual_members.x_url),
 instagram_url=COALESCE(excluded.instagram_url,jkt48_virtual_members.instagram_url),tiktok_url=COALESCE(excluded.tiktok_url,jkt48_virtual_members.tiktok_url),
 graduation_date=COALESCE(excluded.graduation_date,jkt48_virtual_members.graduation_date),updated_at=excluded.updated_at`);
 const tv=db.transaction(rows=>{for(const m of rows)uv.run(m.id,m.name,m.cohort,m.status,m.youtube_url||null,m.x_url||null,m.instagram_url||null,m.tiktok_url||null,m.graduation_date||null,Date.now())});
 tv(JKT48V_MEMBERS);
}
