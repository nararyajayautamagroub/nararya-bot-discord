import {request} from 'undici';

const API_BASE=process.env.JKT48CONNECT_BASE_URL||'https://v2.jkt48connect.com/api/jkt48';
const API_KEY=process.env.JKT48CONNECT_API_KEY||'';

async function fetchMembers(){
 if(!API_KEY)return [];
 const u=new URL(API_BASE.replace(/\\/$/,'')+'/members');
 u.searchParams.set('apikey',API_KEY);
 u.searchParams.set('include_graduated','true');
 const res=await request(u,{headers:{accept:'application/json','user-agent':'Nararya-Bot-Discord/1.0'}});
 if(res.statusCode<200||res.statusCode>=300)throw new Error('Members API HTTP '+res.statusCode);
 const data=await res.body.json();
 return Array.isArray(data)?data:(data.data||data.members||[]);
}

export async function syncMemberDatabase(db){
 db.exec(`
 CREATE TABLE IF NOT EXISTS jkt48_members(
  id TEXT PRIMARY KEY,name TEXT NOT NULL,nickname TEXT,generation INTEGER,virtual_generation INTEGER,
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
 const rows=await fetchMembers();
 if(rows.length){
  const up=db.prepare(`INSERT INTO jkt48_members(id,name,nickname,generation,virtual_generation,status,team,image_url,profile_url,join_date,graduation_date,showroom_url,idn_url,youtube_url,instagram_url,tiktok_url,x_url,updated_at)
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  ON CONFLICT(id) DO UPDATE SET name=excluded.name,nickname=excluded.nickname,generation=excluded.generation,virtual_generation=excluded.virtual_generation,status=excluded.status,team=excluded.team,image_url=excluded.image_url,profile_url=excluded.profile_url,join_date=excluded.join_date,graduation_date=excluded.graduation_date,showroom_url=excluded.showroom_url,idn_url=excluded.idn_url,youtube_url=excluded.youtube_url,instagram_url=excluded.instagram_url,tiktok_url=excluded.tiktok_url,x_url=excluded.x_url,updated_at=excluded.updated_at`);
  const tx=db.transaction(items=>{for(const m of items){const id=String(m.id||m.member_id||m.slug||m.name);up.run(id,m.name||'Unknown',m.nickname||null,Number(m.generation)||null,m.virtual_generation||null,m.is_active===true||m.status==='active'?'active':m.graduation_date?'graduated':(m.status||'historical'),m.team||null,m.image||m.image_url||m.photo||null,m.profile_url||m.url||null,m.join_date||null,m.graduation_date||null,m.showroom_url||m.showroom?.url||null,m.idn_url||m.idn?.url||null,m.youtube_url||m.youtube||null,m.instagram_url||m.instagram||null,m.tiktok_url||m.tiktok||null,m.x_url||m.twitter||m.x||null,Date.now())}});
  tx(rows);
 }
 return rows.length;
}
