import crypto from 'node:crypto';
import {SCRAPER_REGISTRY} from './registry.js';
import {probeUrl} from './http.js';

const CHECK_MS=10000;

export function createScraperOrchestrator({db,onDataRefresh}={}){
 db.exec(`
 CREATE TABLE IF NOT EXISTS scraper_sources(
   key TEXT PRIMARY KEY,
   url TEXT NOT NULL,
   group_name TEXT NOT NULL,
   interval_ms INTEGER NOT NULL,
   enabled INTEGER NOT NULL DEFAULT 1,
   last_checked_at INTEGER,
   last_success_at INTEGER,
   last_refresh_at INTEGER,
   last_status INTEGER,
   last_latency_ms INTEGER,
   etag TEXT,
   last_modified TEXT,
   last_error TEXT,
   content_hash TEXT
 );
 `);
 const upsert=db.prepare('INSERT INTO scraper_sources(key,url,group_name,interval_ms,enabled) VALUES(?,?,?,?,1) ON CONFLICT(key) DO UPDATE SET url=excluded.url,group_name=excluded.group_name,interval_ms=excluded.interval_ms');
 const check=db.prepare('UPDATE scraper_sources SET last_checked_at=?,last_success_at=CASE WHEN ? THEN ? ELSE last_success_at END,last_status=?,last_latency_ms=?,etag=?,last_modified=?,last_error=? WHERE key=?');
 for(const item of SCRAPER_REGISTRY)upsert.run(item.key,item.url,item.group,item.intervalMs);

 async function checkSources(){
  if(checkRunning)return {skipped:true,reason:'previous scraper URL check still running'};
  checkRunning=true;
  try{
   const rows=db.prepare('SELECT * FROM scraper_sources WHERE enabled=1 ORDER BY key').all();
   const batchSize=5;
   for(let offset=0;offset<rows.length;offset+=batchSize){
    const batch=rows.slice(offset,offset+batchSize);
    await Promise.all(batch.map(async row=>{
     try{
      const result=await probeUrl(row.url,{timeout:5000});
      const ok=result.ok?1:0;
      check.run(Date.now(),ok,Date.now(),result.status,result.latencyMs,result.etag,result.lastModified,ok?null:'HTTP '+result.status,row.key);
     }catch(error){
      check.run(Date.now(),0,Date.now(),0,0,null,null,error.message,row.key);
     }
    }));
   }
   return {skipped:false,count:rows.length};
  }finally{checkRunning=false}
 }

 async function refreshDue(){
  const now=Date.now();
  const rows=db.prepare('SELECT * FROM scraper_sources WHERE enabled=1 AND (last_refresh_at IS NULL OR last_refresh_at+interval_ms<=?) ORDER BY key').all(now);
  if(!onDataRefresh)return;
  for(const row of rows){
   try{
    await onDataRefresh(row);
    db.prepare('UPDATE scraper_sources SET last_refresh_at=?,last_success_at=?,last_error=NULL WHERE key=?').run(Date.now(),Date.now(),row.key);
   }catch(error){
    db.prepare('UPDATE scraper_sources SET last_refresh_at=?,last_error=? WHERE key=?').run(Date.now(),error.message,row.key);
   }
  }
 }

 let refreshTimer=null;
 let checkTimer=null;
 let checkRunning=false;
 return {
  start(){
   void checkSources();
   void refreshDue();
   checkTimer=setInterval(()=>void checkSources(),Math.max(10000,Number(process.env.SCRAPER_CHECK_INTERVAL_MS||CHECK_MS)));
   refreshTimer=setInterval(()=>void refreshDue(),Math.min(30*1000,Math.max(10*1000,Number(process.env.SCRAPER_REFRESH_TICK_MS||30000))));
   return {checkMs:CHECK_MS};
  },
  stop(){if(refreshTimer)clearInterval(refreshTimer);if(checkTimer)clearInterval(checkTimer)},
  checkNow(){return checkSources()},
  refreshNow(){return refreshDue()},
  status(){return db.prepare('SELECT key,url,group_name,enabled,last_checked_at,last_success_at,last_refresh_at,last_status,last_latency_ms,last_error FROM scraper_sources ORDER BY group_name,key').all()},
  sourceHash(value){return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')}
 };
}
