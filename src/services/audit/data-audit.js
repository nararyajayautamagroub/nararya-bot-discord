import {probeUrl} from '../scrapers/http.js';
import {SCRAPER_REGISTRY} from '../scrapers/registry.js';

const URL_COLUMNS=/^(url|uri|link|.*_url|source_url|media_url)$/i;
const MAX_ROWS_PER_TABLE=Math.max(1000,Number(process.env.DATA_AUDIT_MAX_ROWS_PER_TABLE||10000));
const JKT48_HOSTS=new Set([
 'raw.githubusercontent.com',
 'jkt48.com'
]);
const KNOWN_DYNAMIC_HOSTS=new Set([
 'query1.finance.yahoo.com',
 'finance.yahoo.com',
 'api.myquran.com'
]);

function isUrl(value){
 try{const u=new URL(String(value));return ['http:','https:'].includes(u.protocol)?u:null}catch{return null}
}

function isJkt48Url(value){
 const u=isUrl(value);if(!u)return false;
 if(JKT48_HOSTS.has(u.hostname))return u.hostname==='jkt48.com'||u.pathname.includes('/FrenzY8/JKT48-Member');
 return false;
}

function registryMatch(url){
 const u=isUrl(url);if(!u)return null;
 const exact=SCRAPER_REGISTRY.find(x=>x.url===url);
 if(exact)return exact;
 return SCRAPER_REGISTRY.find(x=>{
  try{return new URL(x.url).hostname===u.hostname}
  catch{return false}
 })||null;
}

function suggestMethod(url,contentType=''){
 const u=isUrl(url);
 if(!u)return 'invalid-url';
 const path=u.pathname.toLowerCase();
 if(path.endsWith('.json')||contentType.includes('application/json'))return 'JSON API / fetch + JSON.parse';
 if(path.endsWith('.xml')||contentType.includes('xml')||u.searchParams.get('format')==='rss')return 'RSS/XML scraper + XML parser';
 if(/\.(jpg|jpeg|png|webp|gif|mp4|webm|mkv|mp3|wav|flac)(\?.*)?$/.test(path)||contentType.startsWith('image/')||contentType.startsWith('video/')||contentType.startsWith('audio/'))return 'Direct media adapter';
 if(KNOWN_DYNAMIC_HOSTS.has(u.hostname))return 'Official/public API adapter';
 return 'HTML scraper + Cheerio adapter';
}

export function ensureDataAuditTables(db){
 db.exec("CREATE TABLE IF NOT EXISTS data_audit_runs(id INTEGER PRIMARY KEY AUTOINCREMENT,started_at INTEGER NOT NULL,finished_at INTEGER,status TEXT NOT NULL,db_count INTEGER NOT NULL DEFAULT 0,url_count INTEGER NOT NULL DEFAULT 0,missing_scraper_count INTEGER NOT NULL DEFAULT 0,invalid_url_count INTEGER NOT NULL DEFAULT 0,error_count INTEGER NOT NULL DEFAULT 0);CREATE TABLE IF NOT EXISTS data_audit_findings(id INTEGER PRIMARY KEY AUTOINCREMENT,run_id INTEGER NOT NULL,db_name TEXT NOT NULL,table_name TEXT NOT NULL,column_name TEXT,record_key TEXT,url TEXT,status TEXT NOT NULL,method TEXT,suggestion TEXT,error TEXT,checked_at INTEGER NOT NULL);CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON data_audit_findings(status);CREATE INDEX IF NOT EXISTS idx_audit_findings_url ON data_audit_findings(url)");
}

function tableNames(db){
 return db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(x=>x.name);
}

function auditDbUrls(db,dbName){
 const rows=[];
 for(const table of tableNames(db)){
  const columns=db.prepare('PRAGMA table_info('+JSON.stringify(table).slice(1,-1)+')').all();
  const urlCols=columns.filter(c=>URL_COLUMNS.test(c.name));
  if(!urlCols.length)continue;
  const selectCols=columns.map(c=>'"'+String(c.name).replaceAll('"','""')+'"').join(',');
  const items=db.prepare('SELECT rowid AS __rowid__,'+selectCols+' FROM "'+String(table).replaceAll('"','""')+'" LIMIT '+MAX_ROWS_PER_TABLE).all();
  for(const item of items){
   for(const column of urlCols){
    const url=item[column.name];
    if(!url)continue;
    rows.push({dbName,table,column:column.name,recordKey:String(item.__rowid__),url:String(url)});
   }
  }
 }
 return rows;
}

let auditRunning=false;
export async function runDataAudit({databases}){
 if(auditRunning)return {skipped:true,reason:'previous audit still running'};
 auditRunning=true;
 const started=Date.now(),runIdHolder={id:null};
 const primary=databases[0]?.db;
 if(!primary)throw new Error('No audit database configured.');
 ensureDataAuditTables(primary);
 const run=primary.prepare("INSERT INTO data_audit_runs(started_at,finished_at,status) VALUES(?,?,?)").run(started,null,'running');
 runIdHolder.id=run.lastInsertRowid;
 let urlCount=0,missing=0,invalid=0,errors=0;
 try{
  for(const entry of databases){
   const candidates=auditDbUrls(entry.db,entry.name);
   for(const item of candidates){
    urlCount++;
    const parsed=isUrl(item.url);
    if(!parsed){
     invalid++;
     primary.prepare("INSERT INTO data_audit_findings(run_id,db_name,table_name,column_name,record_key,url,status,method,suggestion,error,checked_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(runIdHolder.id,item.dbName,item.table,item.column,item.recordKey,item.url,'invalid_url','n/a',suggestMethod(item.url),'Perbaiki URL menjadi http/https.', 'URL tidak valid',Date.now());
     continue;
    }
    if(isJkt48Url(item.url)){
     primary.prepare("INSERT INTO data_audit_findings(run_id,db_name,table_name,column_name,record_key,url,status,method,suggestion,error,checked_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(runIdHolder.id,item.dbName,item.table,item.column,item.recordKey,item.url,'jkt48-exempt','repository-source','JKT48 URL exempt from generic scraper validation','Sumber JKT48 mengikuti URL repository yang dikonfigurasi.',null,Date.now());
     continue;
    }
    const match=registryMatch(item.url);
    if(!match){
     missing++;
     let probe=null;
     try{probe=await probeUrl(item.url,{timeout:5000})}catch(error){errors++}
     primary.prepare("INSERT INTO data_audit_findings(run_id,db_name,table_name,column_name,record_key,url,status,method,suggestion,error,checked_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(runIdHolder.id,item.dbName,item.table,item.column,item.recordKey,item.url,'missing_scraper',probe?.contentType||'unknown',suggestMethod(item.url,probe?.contentType||''),'Tambahkan adapter ke src/services/scrapers/registry.js sebelum data dianggap terverifikasi.',probe?.ok?null:'URL probe gagal',Date.now());
     continue;
    }
    try{
     const probe=await probeUrl(item.url,{timeout:5000});
     primary.prepare("INSERT INTO data_audit_findings(run_id,db_name,table_name,column_name,record_key,url,status,method,suggestion,error,checked_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(runIdHolder.id,item.dbName,item.table,item.column,item.recordKey,item.url,probe.ok?'verified':'url_error',match.key,suggestMethod(item.url,probe.contentType||''),probe.ok?'URL terverifikasi.':'Periksa source adapter dan URL.',probe.ok?null:'HTTP '+probe.status,Date.now());
     if(!probe.ok)errors++;
    }catch(error){
     errors++;
     primary.prepare("INSERT INTO data_audit_findings(run_id,db_name,table_name,column_name,record_key,url,status,method,suggestion,error,checked_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(runIdHolder.id,item.dbName,item.table,item.column,item.recordKey,item.url,'url_error',match.key,suggestMethod(item.url), 'Periksa source adapter dan URL.',error.message,Date.now());
    }
   }
  }
  primary.prepare("UPDATE data_audit_runs SET finished_at=?,status='complete',db_count=?,url_count=?,missing_scraper_count=?,invalid_url_count=?,error_count=? WHERE id=?").run(Date.now(),databases.length,urlCount,missing,invalid,errors,runIdHolder.id);
  return getAuditStatus(primary);
 }catch(error){
  primary.prepare("UPDATE data_audit_runs SET finished_at=?,status='error',db_count=?,url_count=?,missing_scraper_count=?,invalid_url_count=?,error_count=? WHERE id=?").run(Date.now(),databases.length,urlCount,missing,invalid,errors+1,runIdHolder.id);
  throw error;
 }finally{
  auditRunning=false;
 }
}

export function getAuditStatus(db){
 ensureDataAuditTables(db);
 const lastRun=db.prepare('SELECT * FROM data_audit_runs ORDER BY id DESC LIMIT 1').get()||null;
 const findings=db.prepare("SELECT status,COUNT(*) AS count FROM data_audit_findings GROUP BY status ORDER BY status").all();
 const missing=db.prepare("SELECT db_name,table_name,column_name,url,method,suggestion,error,checked_at FROM data_audit_findings WHERE status IN ('missing_scraper','invalid_url','url_error') ORDER BY checked_at DESC LIMIT 50").all();
 return {lastRun,findings,missing};
}
