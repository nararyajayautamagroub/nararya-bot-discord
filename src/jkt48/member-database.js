import {request} from 'undici';
import {JKT48V_MEMBERS} from './jkt48v-members.js';
import {JKT48_GEN14_MEMBERS} from './gen14-members.js';

const SOURCES={
 all:process.env.JKT48_ALL_MEMBER_URL||'https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/AllMember.json',
 active:process.env.JKT48_ACTIVE_MEMBER_URL||'https://raw.githubusercontent.com/FrenzY8/JKT48-Member/refs/heads/main/ActiveMember.json'
};
const API_BASE=process.env.JKT48CONNECT_BASE_URL||'https://v2.jkt48connect.com/api/jkt48';
const API_KEY=process.env.JKT48CONNECT_API_KEY||'';

const text=v=>String(v??'').trim();
const norm=v=>text(v).toLowerCase().normalize('NFKC').replace(/[^a-z0-9]+/g,' ').trim();
const first=(...values)=>values.find(v=>v!==undefined&&v!==null&&text(v)!=='');
function generationOf(m){
 const raw=first(m.generation,m.generation_number,m.gen,m.generasi,m.generationName,m.generasiName);
 if(typeof raw==='number')return Number.isInteger(raw)&&raw>=1&&raw<=14?raw:null;
 const match=text(raw).match(/(?:gen(?:eration)?|generasi)?\s*([0-9]{1,2})/i);
 const n=match?Number(match[1]):null;
 return Number.isInteger(n)&&n>=1&&n<=14?n:null;
}
function arrayFrom(data){
 if(Array.isArray(data))return data;
 if(!data||typeof data!=='object')return [];
 for(const key of ['data','members','results','items','all_members','active_members','AllMember','ActiveMember']){
  if(Array.isArray(data[key]))return data[key];
 }
 const values=Object.values(data);
 if(values.every(v=>v&&typeof v==='object'&&!Array.isArray(v)))return values;
 return [];
}
function extractName(m){
 if(typeof m==='string')return m.trim();
 return text(first(m.name,m.member_name,m.memberName,m.nama,m.full_name,m.fullName,m.real_name,m.stage_name));
}
function memberRecord(raw,active=false){
 if(typeof raw==='string')return {id:norm(raw),name:raw.trim(),active:true};
 const name=extractName(raw);if(!name)return null;
 const social=raw.social||raw.links||raw.accounts||{};
 const image=first(raw.image_url,raw.image,raw.photo,raw.photo_url,raw.avatar,raw.img);
 const profile=first(raw.profile_url,raw.profile,raw.url,raw.detail_url);
 return {
  id:text(first(raw.id,raw.member_id,raw.slug,raw.key))||norm(name),
  name,
  nickname:text(first(raw.nickname,raw.nicknames,raw.panggilan))||null,
  generation:generationOf(raw),
  status:active||raw.is_active===true||text(raw.status).toLowerCase()==='active'?'active':(raw.graduation_date||raw.graduated_at||text(raw.status).toLowerCase()==='graduated'?'graduated':'historical'),
  team:text(first(raw.team,raw.team_name,raw.unit,raw.division))||null,
  image_url:image||null,
  profile_url:profile||null,
  join_date:text(first(raw.join_date,raw.joined_at,raw.joining_date))||null,
  graduation_date:text(first(raw.graduation_date,raw.graduated_at,raw.graduate_date))||null,
  showroom_url:text(first(raw.showroom_url,raw.showroom,raw.showroom_id,social.showroom))||null,
  idn_url:text(first(raw.idn_url,raw.idn,social.idn))||null,
  youtube_url:text(first(raw.youtube_url,raw.youtube,raw.youtube_channel,social.youtube))||null,
  instagram_url:text(first(raw.instagram_url,raw.instagram,social.instagram))||null,
  tiktok_url:text(first(raw.tiktok_url,raw.tiktok,social.tiktok))||null,
  x_url:text(first(raw.x_url,raw.twitter,raw.x,social.x,social.twitter))||null
 };
}
async function fetchJson(url){
 const res=await request(url,{method:'GET',headers:{accept:'application/json','user-agent':'Nararya-Bot-Discord/1.0'},maxRedirections:3});
 if(res.statusCode<200||res.statusCode>=300)throw new Error('HTTP '+res.statusCode+' '+url);
 return res.body.json();
}
async function fetchSourceMembers(){
 const [allData,activeData]=await Promise.all([fetchJson(SOURCES.all),fetchJson(SOURCES.active)]);
 const all=arrayFrom(allData).map(x=>memberRecord(x,false)).filter(Boolean);
 const activeRows=arrayFrom(activeData).map(x=>memberRecord(x,true)).filter(Boolean);
 const activeKeys=new Set(activeRows.flatMap(x=>[x.id,norm(x.name)]));
 const merged=new Map();
 for(const row of all){
  if(row.generation===null||row.generation===undefined||row.generation<1||row.generation>14)continue;
  const active=activeKeys.has(row.id)||activeKeys.has(norm(row.name));
  merged.set(row.id,{...row,status:active?'active':row.status==='graduated'?'graduated':'historical'});
 }
 for(const row of activeRows){
  if(!row.name)continue;
  const id=row.id||norm(row.name);
  const existing=merged.get(id)||merged.get(norm(row.name));
  if(existing){merged.set(existing.id,{...existing,...row,generation:existing.generation??row.generation,status:'active'});}
  else if(row.generation&&row.generation<=14)merged.set(id,row);
 }
 return [...merged.values()];
}
async function fetchApiMembers(){
 if(!API_KEY)return [];
 try{
  const base=API_BASE.endsWith('/')?API_BASE.slice(0,-1):API_BASE;
  const u=new URL(base+'/members');
  u.searchParams.set('apikey',API_KEY);u.searchParams.set('include_graduated','true');
  const res=await request(u,{headers:{accept:'application/json','user-agent':'Nararya-Bot-Discord/1.0'}});
  if(res.statusCode<200||res.statusCode>=300)return [];
  const data=await res.body.json();
  return arrayFrom(data).map(x=>memberRecord(x,false)).filter(x=>x&&x.generation>=1&&x.generation<=14);
 }catch{return []}
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
 `);
 let rows=[];
 try{rows=await fetchSourceMembers()}catch(error){console.warn('[jkt48-member-source] '+error.message);rows=await fetchApiMembers();}
 if(JKT48_GEN14_MEMBERS.length){
  const supplemental=JKT48_GEN14_MEMBERS.map((m)=>({
   id:norm(m.name),
   name:m.name,
   nickname:null,
   generation:m.generation,
   status:m.status||'trainee',
   team:null,
   image_url:null,
   profile_url:null,
   join_date:null,
   graduation_date:null,
   showroom_url:m.showroom_url||null,
   idn_url:m.idn_url||null,
   youtube_url:null,
   instagram_url:m.instagram_url||null,
   tiktok_url:m.tiktok_url||null,
   x_url:m.x_url||null
  }));
  const byId=new Map(rows.map(x=>[x.id,x]));
  for(const row of supplemental)byId.set(row.id,{...(byId.get(row.id)||{}),...row});
  rows=[...byId.values()];
 }
 if(!rows.length)return 0;
 const up=db.prepare(`
 INSERT INTO jkt48_members(id,name,nickname,generation,virtual_generation,status,team,image_url,profile_url,join_date,graduation_date,showroom_url,idn_url,youtube_url,instagram_url,tiktok_url,x_url,updated_at)
 VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
 ON CONFLICT(id) DO UPDATE SET name=excluded.name,nickname=excluded.nickname,generation=excluded.generation,status=excluded.status,team=excluded.team,image_url=excluded.image_url,profile_url=excluded.profile_url,join_date=excluded.join_date,graduation_date=excluded.graduation_date,showroom_url=excluded.showroom_url,idn_url=excluded.idn_url,youtube_url=excluded.youtube_url,instagram_url=excluded.instagram_url,tiktok_url=excluded.tiktok_url,x_url=excluded.x_url,updated_at=excluded.updated_at
 `);
 const tx=db.transaction(items=>{for(const m of items)up.run(m.id,m.name,m.nickname,m.generation,null,m.status,m.team,m.image_url,m.profile_url,m.join_date,m.graduation_date,m.showroom_url,m.idn_url,m.youtube_url,m.instagram_url,m.tiktok_url,m.x_url,Date.now())});
 tx(rows);
 return rows.length;
}

export {SOURCES};
export const virtualMembers=()=>JKT48V_MEMBERS;
