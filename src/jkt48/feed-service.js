import { scrapeSource } from './adapters.js';
export function createFeedService({db,client,buildEmbed}){
 const claim=db.prepare('SELECT 1 FROM feed_items WHERE source_id=? AND item_key=?');
 const insert=db.prepare('INSERT INTO feed_items(source_id,item_key,title,url,published_at) VALUES(?,?,?,?,?)');
 async function pollSource(row){
  const items=await scrapeSource(row);
  for(const item of items){
   if(claim.get(row.id,item.key))continue;
   insert.run(row.id,item.key,item.title,item.url,item.publishedAt||Date.now());
   const ch=await client.channels.fetch(row.channel_id).catch(()=>null);
   if(ch?.isTextBased())await ch.send({embeds:[buildEmbed({...item,sourceName:row.name})]}).catch(()=>{});
  }
  return items.length;
 }
 async function poll(){
  for(const row of db.prepare('SELECT * FROM feed_sources WHERE enabled=1 ORDER BY id').all()){
   try{await pollSource(row)}catch(e){console.warn('[feed:'+row.name+'] '+e.message)}
  }
 }
 return {poll,pollSource};
}
