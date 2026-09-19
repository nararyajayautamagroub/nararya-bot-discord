import {scrapeSource} from './adapters.js';

function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}

export function createFeedService({db,client,buildEmbed}){
 try{db.prepare('ALTER TABLE feed_sources ADD COLUMN last_success_at INTEGER').run()}catch{}
 try{db.prepare('ALTER TABLE feed_sources ADD COLUMN last_error TEXT').run()}catch{}
 try{db.prepare('ALTER TABLE feed_sources ADD COLUMN last_item_count INTEGER DEFAULT 0').run()}catch{}
 try{db.prepare('ALTER TABLE feed_sources ADD COLUMN last_checked_at INTEGER').run()}catch{}

 const claim=db.prepare('SELECT 1 FROM feed_items WHERE source_id=? AND item_key=?');
 const insert=db.prepare('INSERT INTO feed_items(source_id,item_key,title,url,published_at) VALUES(?,?,?,?,?)');
 const markSuccess=db.prepare('UPDATE feed_sources SET last_success_at=?,last_error=NULL,last_item_count=?,last_checked_at=? WHERE id=?');
 const markError=db.prepare('UPDATE feed_sources SET last_error=?,last_checked_at=? WHERE id=?');

 async function withRetry(fn){
  let last;
  for(let attempt=0;attempt<3;attempt++){
   try{return await fn()}catch(error){last=error;if(attempt<2)await sleep(400*(attempt+1))}
  }
  throw last||new Error('Feed gagal');
 }

 async function pollSource(row){
  const started=Date.now();
  try{
   const items=await withRetry(()=>scrapeSource(row));
   let sent=0;
   for(const sourceItem of items){
    if(!sourceItem?.url||claim.get(row.id,sourceItem.key))continue;
    insert.run(row.id,sourceItem.key,sourceItem.title,sourceItem.url,sourceItem.publishedAt||Date.now());
    const channel=await client.channels.fetch(row.channel_id).catch(()=>null);
    if(channel?.isTextBased()){
     await channel.send({embeds:[buildEmbed({...sourceItem,sourceName:row.name})]}).catch(()=>{});
     sent++;
    }
   }
   markSuccess.run(Date.now(),items.length,Date.now(),row.id);
   return {items:items.length,sent,elapsedMs:Date.now()-started};
  }catch(error){
   markError.run(String(error?.message||error),Date.now(),row.id);
   throw error;
  }
 }

 async function poll(){
  const rows=db.prepare('SELECT * FROM feed_sources WHERE enabled=1 ORDER BY id').all();
  const results=[];
  for(const row of rows){
   try{results.push({id:row.id,name:row.name,ok:true,...await pollSource(row)})}
   catch(error){console.warn('[feed:'+row.name+'] '+error.message);results.push({id:row.id,name:row.name,ok:false,error:error.message})}
  }
  return results;
 }

 function health(guildId){
  const rows=db.prepare('SELECT id,name,url,channel_id,kind,enabled,last_success_at,last_error,last_item_count,last_checked_at FROM feed_sources WHERE guild_id=? ORDER BY id').all(guildId);
  return rows.map(x=>({...x,healthy:!x.last_error}));
 }

 return {poll,pollSource,health};
}
