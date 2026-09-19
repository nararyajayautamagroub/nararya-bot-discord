import {events,theater,birthdays,news,allLive,recentLive,dateOf,titleOf,memberName} from './connect.js';
export const TYPE_LABELS={event:'Event',theater:'Theater',setlist:'Setlist',songs:'Songs',live:'Live',liveShowroom:'Live SHOWROOM',liveIdn:'Live IDN',birthday:'Birthday',graduation:'Graduation'};
const fmtDate=x=>{const d=dateOf(x);if(!d)return 'Waktu belum tersedia';const dt=new Date(d);return Number.isNaN(dt.getTime())?String(d):dt.toLocaleString('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'})+' WIB'};
const urlOf=x=>x?.url||x?.link||x?.detail_url||x?.room_url||x?.stream_url;
const line=x=>{const title=titleOf(x),member=memberName(x),extra=x?.setlist&&x.setlist!==title?' • Setlist: '+x.setlist:'';return '• **'+title+'**'+(member&&member!=='JKT48'?' • '+member:'')+extra+'\n  '+fmtDate(x)+(urlOf(x)?' • '+urlOf(x):'')};
export async function getUpcoming(type){
 if(type==='event')return (await events()).slice(0,10);
 if(type==='theater'||type==='setlist')return (await theater()).filter(x=>type==='theater'||x.setlist).slice(0,10);
 if(type==='birthday')return (await birthdays({days:30})).slice(0,10);
 if(type==='live')return (await allLive()).slice(0,10);
 if(type==='graduation')return (await news({category:'Graduation'})).slice(0,10);
 if(type==='songs')return (await news({category:'Music'})).slice(0,10);
 return [];
}
export async function getLatest(type){
 if(type==='event')return (await events({status:'completed'})).slice().reverse().slice(0,10);
 if(type==='theater'||type==='setlist')return (await theater({status:'completed'})).slice().reverse().slice(0,10);
 if(type==='birthday')return (await birthdays({days:365})).filter(x=>new Date(dateOf(x))<=new Date()).slice(-10).reverse();
 if(type==='live')return (await recentLive()).slice(0,10);
 if(type==='graduation')return (await news({category:'Graduation'})).slice(0,10);
 if(type==='songs')return (await news({category:'Music'})).slice(0,10);
 return [];
}
export async function getLatestPlatform(platform){return (await recentLive()).filter(x=>String(x.platform||'').toLowerCase()===platform).slice(0,10)}
export function renderList(title,items){return items.length?items.map(line).join('\n\n'):'Belum ada data '+title.toLowerCase()+' yang tersedia.'}
