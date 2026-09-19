import {configured,events,theater,birthdays,news,allLive,recentLive,dateOf,titleOf,memberName} from './connect.js';
export const TYPE_LABELS={event:'Event',theater:'Theater',setlist:'Setlist',songs:'Songs',live:'Live',liveShowroom:'Live SHOWROOM',liveIdn:'Live IDN',birthday:'Birthday',graduation:'Graduation'};
const fmtDate=x=>{const d=dateOf(x);if(!d)return 'Waktu belum tersedia';const dt=new Date(d);return Number.isNaN(dt.getTime())?String(d):dt.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'})+' WIB'};
const urlOf=x=>x?.url||x?.link||x?.detail_url||x?.room_url||x?.stream_url;
const line=x=>{const title=titleOf(x),member=memberName(x),extra=x?.setlist&&x.setlist!==title?' • Setlist: '+x.setlist:'';return '• **'+title+'**'+(member&&member!=='JKT48'?' • '+member:'')+extra+'\n  '+fmtDate(x)+(urlOf(x)?' • '+urlOf(x):'')};
function dbFallback(db,type,latest=false){
 if(!db)return [];
 const kinds=type==='event'?['jkt48-events','jkt48-web']:type==='theater'||type==='setlist'?['jkt48-theater','jkt48-web']:['jkt48-news','jkt48-web'];
 const placeholders=kinds.map(()=>'?').join(',');
 const order=latest?'fi.published_at DESC':'fi.published_at DESC';
 const rows=db.prepare(`SELECT fi.title,fi.url,fi.published_at FROM feed_items fi JOIN feed_sources fs ON fs.id=fi.source_id WHERE fs.kind IN (${placeholders}) ORDER BY ${order} LIMIT 10`).all(...kinds);
 return rows.map(x=>({title:x.title,url:x.url,published_at:x.published_at}));
}

export async function getUpcoming(type,db=null){
 if(!configured()){
  if(type==='event'||type==='theater'||type==='setlist'||type==='graduation'||type==='songs')return dbFallback(db,type);
  return [];
 }
 if(type==='event')return (await events()).slice(0,10);
 if(type==='theater'||type==='setlist')return (await theater()).filter(x=>type==='theater'||x.setlist).slice(0,10);
 if(type==='birthday')return (await birthdays({days:30})).slice(0,10);
 if(type==='live')return (await allLive()).slice(0,10);
 if(type==='graduation')return (await news({category:'Graduation'})).slice(0,10);
 if(type==='songs')return (await news({category:'Music'})).slice(0,10);
 return [];
}
export async function getLatest(type,db=null){
 if(!configured()){
  if(type==='event'||type==='theater'||type==='setlist'||type==='graduation'||type==='songs')return dbFallback(db,type,true).slice().reverse().slice(0,10);
  return [];
 }
 if(type==='event')return (await events({status:'completed'})).slice().reverse().slice(0,10);
 if(type==='theater'||type==='setlist')return (await theater({status:'completed'})).filter(x=>type==='theater'||x.setlist).slice().reverse().slice(0,10);
 if(type==='birthday')return (await birthdays({days:365})).filter(x=>new Date(dateOf(x))<=new Date()).slice(-10).reverse();
 if(type==='live')return (await recentLive()).slice(0,10);
 if(type==='graduation')return (await news({category:'Graduation'})).slice(0,10);
 if(type==='songs')return (await news({category:'Music'})).slice(0,10);
 return [];
}
export async function getLatestPlatform(platform,db=null){
 if(!configured()){
  if(!db)return [];
  const kind=platform==='showroom'?'showroom':platform==='idn'?'idn':platform;
  return db.prepare('SELECT fi.title,fi.url,fi.published_at FROM feed_items fi JOIN feed_sources fs ON fs.id=fi.source_id WHERE fs.kind=? ORDER BY fi.published_at DESC LIMIT 10').all(kind).map(x=>({title:x.title,url:x.url,published_at:x.published_at,platform}));
 }
 const api=(await recentLive()).filter(x=>String(x.platform||'').toLowerCase()===platform).slice(0,10);
 return api;
}
export function renderList(title,items){return items.length?items.map(line).join('\n\n'):'Belum ada data '+title.toLowerCase()+' yang tersedia.'}
