import * as cheerio from 'cheerio';
import {requestText,requestJson} from '../scrapers/http.js';

export const DISASTER_URLS=Object.freeze({
 earthquake:'https://www.bmkg.go.id/gempabumi',
 realtime:'https://www.bmkg.go.id/gempabumi/gempabumi-realtime',
 tsunami:'https://www.bmkg.go.id/gempabumi/berpotensi-tsunami',
 bnpb:'https://gis.bnpb.go.id/server/rest/services/Kejadian_Bencana_Mingguan/MapServer/25/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&resultRecordCount=30&orderByFields=objectid%20DESC&f=json',
 magma:'https://magma.esdm.go.id/'
});

const normalizeNumber=value=>Number(String(value||'').replace(',','.').replace(/[^0-9.-]/g,''));

function parseBmkgRows(html){
 const $=cheerio.load(html);
 const rows=[];
 $('table tbody tr').each((_,tr)=>{
  const cells=$(tr).find('td').map((i,td)=>$(td).text().replace(/\s+/g,' ').trim()).get();
  if(cells.length<4)return;
  const magnitude=cells.find(v=>/^\d+[,.]\d+$/.test(v));
  const depth=cells.find(v=>/\d+\s*km/i.test(v));
  const coord=cells.find(v=>/(LU|LS|BT|BB)/i.test(v)&&/[0-9]/.test(v));
  const time=cells.find(v=>/\d{2}.*\d{2}:\d{2}/.test(v))||cells[0]||null;
  if(!magnitude&&!depth&&cells.length<5)return;
  rows.push({id:cells.join('|'),magnitude:magnitude?normalizeNumber(magnitude):null,depth:depth||null,coordinates:coord||null,location:cells[cells.length-1]||'Indonesia',time});
 });
 return rows.slice(0,30);
}

async function scrapeBmkg(url,type){
 const result=await requestText(url,{timeout:10000});
 if(!result.ok)throw new Error('BMKG HTTP '+result.status);
 return {type,source:url,updatedAt:Date.now(),items:parseBmkgRows(result.text)};
}
export async function getEarthquakes(){return scrapeBmkg(DISASTER_URLS.earthquake,'earthquake')}
export async function getRealtimeEarthquakes(){return scrapeBmkg(DISASTER_URLS.realtime,'realtime-earthquake')}
export async function getTsunamiAlerts(){return scrapeBmkg(DISASTER_URLS.tsunami,'tsunami')}

async function getBnpb(){
 const data=await requestJson(DISASTER_URLS.bnpb,{timeout:15000});
 const items=(data.features||[]).map(item=>{
  const a=item.attributes||{},g=item.geometry||{};
  return {
   id:String(a.objectid||a.id||JSON.stringify(a)),
   type:a.jenis_bencana||a.kategori_bencana||a.jenis_bencana2||'Bencana',
   location:[a.kab_kota,a.provinsi].filter(Boolean).join(', ')||a.lokasi||a.location||'Indonesia',
   date:a.tgl_kejadian||a.tanggal||a.tgl||null,
   latitude:g.y??a.latitude??a.lat??null,
   longitude:g.x??a.longitude??a.lng??null,
   title:a.nama||a.keterangan||a.kategori_bencana||a.jenis_bencana||'Kejadian bencana'
  };
 });
 return {type:'bnpb',source:DISASTER_URLS.bnpb,updatedAt:Date.now(),items};
}

async function getMagma(){
 const result=await requestText(DISASTER_URLS.magma,{timeout:15000});
 if(!result.ok)throw new Error('MAGMA HTTP '+result.status);
 const $=cheerio.load(result.text),items=[];
 $('a').each((_,a)=>{
  const text=$(a).text().replace(/\s+/g,' ').trim();
  const href=$(a).attr('href')||'';
  const all=(text+' '+href).toLowerCase();
  if(!/gunung|volcano/.test(all)||text.length<3)return;
  const status=(text.match(/level\s*(iv|iii|ii|i)|awas|siaga|waspada|normal/i)||[])[0]||'Status tidak terbaca';
  items.push({id:new URL(href,DISASTER_URLS.magma).toString(),name:text.slice(0,100),status,location:text.replace(status,'').trim(),url:new URL(href,DISASTER_URLS.magma).toString()});
 });
 return {type:'volcano',source:DISASTER_URLS.magma,updatedAt:Date.now(),items:[...new Map(items.map(x=>[x.id,x])).values()].slice(0,30)};
}

export async function getDisasterSnapshot(){
 const jobs=await Promise.allSettled([getEarthquakes(),getTsunamiAlerts(),getBnpb(),getMagma()]);
 const pickResult=x=>x.status==='fulfilled'?x.value:{items:[],error:x.reason?.message||'unknown error'};
 return {fetchedAt:Date.now(),earthquake:pickResult(jobs[0]),tsunami:pickResult(jobs[1]),bnpb:pickResult(jobs[2]),volcano:pickResult(jobs[3])};
}

export function ensureDisasterTables(db){
 db.exec("CREATE TABLE IF NOT EXISTS disaster_events(event_id TEXT PRIMARY KEY,disaster_type TEXT NOT NULL,title TEXT NOT NULL,location TEXT,event_time TEXT,latitude REAL,longitude REAL,source TEXT NOT NULL,source_url TEXT,fingerprint TEXT NOT NULL,first_seen_at INTEGER NOT NULL,last_seen_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS disaster_configs(guild_id TEXT PRIMARY KEY,channel_id TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1,min_magnitude REAL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS disaster_notifications(key TEXT PRIMARY KEY,created_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS disaster_source_state(source TEXT PRIMARY KEY,last_success_at INTEGER,last_error TEXT,last_items INTEGER NOT NULL DEFAULT 0)");
}

function fingerprint(item){return JSON.stringify([item.type,item.location,item.time,item.date,item.magnitude,item.latitude,item.longitude,item.status||''])}

export async function refreshDisasterDatabase({db}){
 const snapshot=await getDisasterSnapshot(),now=Date.now();
 const groups=[
  ['bmkg-earthquake',snapshot.earthquake],
  ['bmkg-tsunami',snapshot.tsunami],
  ['bnpb',snapshot.bnpb],
  ['magma',snapshot.volcano]
 ];
 const insert=db.prepare("INSERT INTO disaster_events(event_id,disaster_type,title,location,event_time,latitude,longitude,source,source_url,fingerprint,first_seen_at,last_seen_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(event_id) DO UPDATE SET last_seen_at=excluded.last_seen_at");
 for(const group of groups){
  const source=group[0],data=group[1];
  if(data.error){
   db.prepare("INSERT INTO disaster_source_state(source,last_success_at,last_error,last_items) VALUES(?,?,?,0) ON CONFLICT(source) DO UPDATE SET last_error=excluded.last_error").run(source,null,data.error);
   continue;
  }
  let count=0;
  for(const item of data.items||[]){
   const id=String(item.id||item.url||fingerprint(item));
   const type=String(item.type||source);
   const title=String(item.title||item.name||item.location||type);
   const fp=fingerprint({...item,type});
   insert.run(id,type,title,item.location||'Indonesia',item.time||item.date||null,item.latitude??null,item.longitude??null,data.source,data.source,fp,now,now);
   count++;
  }
  db.prepare("INSERT INTO disaster_source_state(source,last_success_at,last_error,last_items) VALUES(?,?,NULL,?) ON CONFLICT(source) DO UPDATE SET last_success_at=excluded.last_success_at,last_error=NULL,last_items=excluded.last_items").run(source,now,count);
 }
 return snapshot;
}

export function recentDisasters(db,{type='',limit=15}={}){
 if(type)return db.prepare("SELECT * FROM disaster_events WHERE disaster_type LIKE ? ORDER BY last_seen_at DESC LIMIT ?").all('%'+type+'%',limit);
 return db.prepare("SELECT * FROM disaster_events ORDER BY last_seen_at DESC LIMIT ?").all(limit);
}

export function disasterStatus(db){
 return {
  sources:db.prepare("SELECT * FROM disaster_source_state ORDER BY source").all(),
  recent:recentDisasters(db,{limit:20})
 };
}

export function configureDisaster(db,{guildId,channelId,enabled=true,minMagnitude=0}){
 const now=Date.now();
 db.prepare("INSERT INTO disaster_configs(guild_id,channel_id,enabled,min_magnitude,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(guild_id) DO UPDATE SET channel_id=excluded.channel_id,enabled=excluded.enabled,min_magnitude=excluded.min_magnitude,updated_at=excluded.updated_at").run(guildId,channelId,enabled?1:0,minMagnitude,now,now);
}

export async function notifyDisasterConfigs({db,client,embed}){
 const configs=db.prepare("SELECT * FROM disaster_configs WHERE enabled=1").all();
 if(!configs.length)return;
 const recent=db.prepare("SELECT * FROM disaster_events WHERE first_seen_at>=? ORDER BY first_seen_at DESC LIMIT 20").all(Date.now()-120000);
 for(const cfg of configs){
  const channel=await client.channels.fetch(cfg.channel_id).catch(()=>null);
  if(!channel?.isTextBased())continue;
  for(const event of recent){
   const key=cfg.guild_id+':'+event.event_id;
   if(db.prepare("SELECT 1 FROM disaster_notifications WHERE key=?").get(key))continue;
   const mag=(event.title.match(/M\s*([0-9]+[.,][0-9]+)/i)||[])[1];
   if(mag&&Number(mag.replace(',','.'))<Number(cfg.min_magnitude||0))continue;
   await channel.send({embeds:[embed('⚠️ Informasi Bencana • '+event.disaster_type,event.title+'\n📍 **Lokasi:** '+(event.location||'Tidak diketahui')+'\n🕐 **Waktu:** '+(event.event_time||'Tidak tersedia')+'\n\nSumber: **'+event.source+'**')]}).catch(()=>{});
   db.prepare("INSERT OR IGNORE INTO disaster_notifications(key,created_at) VALUES(?,?)").run(key,Date.now());
  }
 }
}
