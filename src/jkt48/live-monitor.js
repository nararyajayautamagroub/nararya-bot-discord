import {allLive,recentLive,events,theater} from './connect.js';
const key=x=>String(x.data_id||x.id||x.stream_id||x.url||x.room_url||x.title||JSON.stringify(x));
const label=x=>(x.member?.name||x.member_name||x.name||'JKT48')+' • '+String(x.platform||'live').toUpperCase();
const membership=x=>x.is_members_only||x.members_only||x.membership_only||x.visibility==='members_only'?'🔒 Membership Live':'🌐 Public Live';
export function createJkt48Monitor({db,client,embed,interval=30000}){
 db.exec('CREATE TABLE IF NOT EXISTS jkt48_monitor_state(kind TEXT PRIMARY KEY,payload TEXT NOT NULL,updated_at INTEGER NOT NULL)');
 const get=k=>{const r=db.prepare('SELECT payload FROM jkt48_monitor_state WHERE kind=?').get(k);try{return r?JSON.parse(r.payload):[]}catch{return[]}};
 const set=(k,v)=>db.prepare('INSERT INTO jkt48_monitor_state(kind,payload,updated_at) VALUES(?,?,?) ON CONFLICT(kind) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').run(k,JSON.stringify(v),Date.now());
 async function broadcast(e){for(const g of client.guilds.cache.values()){const id=db.prepare('SELECT feed_channel FROM guild_config WHERE guild_id=?').get(g.id)?.feed_channel;const ch=id?await client.channels.fetch(id).catch(()=>null):null;if(ch?.isTextBased())await ch.send({embeds:[e]}).catch(()=>{});}}
 async function pollLive(){
  const now=await allLive(),old=get('live_keys'),keys=now.map(key),misses=get('live_misses');
  for(const x of now.filter(x=>!old.includes(key(x))))await broadcast(embed('🔴 START LIVE • '+label(x),'Live baru terdeteksi.\nPlatform: **'+String(x.platform||'').toUpperCase()+'**\n'+(x.room_url||x.url||x.stream_url||''),{color:0xEF4444,image:x.image||x.thumbnail||x.thumbnail_url}));
  const nextMisses={};
  for(const k of old){if(keys.includes(k))continue;const count=Number(misses[k]||0)+1;if(count>=2)await broadcast(embed('⚫ END LIVE','Siaran live dengan ID **'+k+'** terdeteksi sudah berakhir.',{color:0x64748B}));else nextMisses[k]=count;}
  for(const k of keys)delete nextMisses[k];
  set('live_misses',nextMisses);set('live_keys',keys);
 }
 async function pollRecent(){
  const recent=await recentLive(),old=get('recent_keys'),fresh=recent.filter(x=>!old.includes(key(x)));
  for(const x of fresh.slice(0,5))await broadcast(embed('🕘 RECENT/LATEST LIVE',(x.member?.name||x.member_name||x.name||'JKT48')+' • '+String(x.platform||'').toUpperCase()+'\nMulai: '+(x.start_at||x.start_time||'-')+'\nSelesai: '+(x.end_at||x.end_time||'-')+'\n'+(x.url||x.room_url||x.stream_url||''),{color:0x3B82F6,image:x.image||x.thumbnail||x.thumbnail_url}));
  set('recent_keys',recent.slice(0,100).map(key));
 }
 async function pollFinished(){
  const rows=[...(await events({status:'completed'})).map(x=>({...x,__kind:'event'})),...(await theater({status:'completed'})).map(x=>({...x,__kind:'theater'}))],old=get('finished_keys'),fresh=rows.filter(x=>!old.includes(key(x)));
  for(const x of fresh.slice(0,10))await broadcast(embed('✅ RECENT/LATEST '+(x.__kind==='event'?'EVENT':'THEATER'),'Acara yang sudah selesai terdeteksi.\n**'+(x.title||x.name||x.show_name||'JKT48')+'**\n'+(x.end_at||x.end_time||x.date_time||x.date||'-')+'\n'+(x.url||x.link||''),{color:0x22C55E,image:x.image||x.poster||x.thumbnail}));
  set('finished_keys',rows.slice(-100).map(key));
 }
 async function poll(){if(!process.env.JKT48CONNECT_API_KEY)return;try{await pollLive();await pollRecent();await pollFinished()}catch(e){console.warn('[jkt48-monitor] '+e.message)}}
 return {poll,start(){poll();return setInterval(poll,Math.max(15000,interval))}};
}
