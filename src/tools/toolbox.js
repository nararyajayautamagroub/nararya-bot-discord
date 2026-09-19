/**
 * Nararya Bot ToolBox v2.1
 * Shared low-dependency utilities used by data, restaurant, cache,
 * pagination, validation, logging, and database services.
 *
 * This file intentionally centralizes repeated helpers so feature
 * modules do not keep inventing slightly different implementations.
 */

export const TOOLBOX_VERSION='2.1.0';
export const now=()=>Date.now();
export const asString=(value,fallback='')=>value===undefined||value===null?fallback:String(value);
export const asTrimmed=(value,fallback='')=>asString(value,fallback).trim();
export const asLower=(value,fallback='')=>asTrimmed(value,fallback).toLowerCase();
export const asUpper=(value,fallback='')=>asTrimmed(value,fallback).toUpperCase();
export const asNumber=(value,fallback=0)=>{const n=Number(value);return Number.isFinite(n)?n:fallback};
export const asInteger=(value,fallback=0)=>{const n=Number(value);return Number.isInteger(n)?n:fallback};
export const clamp=(value,min,max)=>Math.min(max,Math.max(min,asNumber(value,min)));
export const clampInt=(value,min,max)=>Math.trunc(clamp(value,min,max));
export const isBlank=value=>asTrimmed(value)==='';
export const isNonBlank=value=>!isBlank(value);
export const isObject=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
export const isArray=Array.isArray;
export const toArray=value=>Array.isArray(value)?value:value===undefined||value===null?[]:[value];
export const unique=value=>[...new Set(toArray(value))];
export const uniqueStrings=value=>unique(toArray(value).map(asTrimmed).filter(Boolean));
export const firstDefined=(...values)=>values.find(value=>value!==undefined&&value!==null);
export const firstNonBlank=(...values)=>values.find(value=>isNonBlank(value));
export const coalesce=(value,fallback)=>firstDefined(value,fallback);
export const bool=(value,fallback=false)=>value===undefined||value===null?fallback:Boolean(value);
export const toBoolean=(value,fallback=false)=>['true','1','yes','on'].includes(asLower(value))?true:['false','0','no','off'].includes(asLower(value))?false:fallback;
export const sleep=ms=>new Promise(resolve=>setTimeout(resolve,Math.max(0,asInteger(ms,0))));
export const isoNow=()=>new Date().toISOString();
export const timestamp=()=>Math.floor(Date.now()/1000);
export const safeJsonParse=(text,fallback=null)=>{try{return JSON.parse(asString(text))}catch{return fallback}};
export const safeJsonStringify=(value,fallback='{}')=>{try{return JSON.stringify(value)}catch{return fallback}};
export const safeCall=(fn,fallback=null)=>{try{return fn()}catch{return fallback}};
export const safeAsync=async(fn,fallback=null)=>{try{return await fn()}catch{return fallback}};

export function normalizeWhitespace(value){
 return asTrimmed(value).replace(/\s+/g,' ');
}
export function normalizeSearch(value){
 return normalizeWhitespace(value).normalize('NFKC').toLowerCase();
}
export function slugify(value){
 return normalizeSearch(value).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
export function unslugify(value){return normalizeWhitespace(asString(value).replace(/[-_]+/g,' '));}
export function stripHtml(value){
 return asString(value).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ');
}
export function normalizeHtmlText(value){return normalizeWhitespace(stripHtml(value));}
export function removeControlCharacters(value){return asString(value).replace(/[\u0000-\u001F\u007F]/g,' ');}
export function cleanLabel(value){return normalizeWhitespace(removeControlCharacters(value));}
export function cleanUrl(value){return asTrimmed(value).replace(/[<>]/g,'');}
export function isHttpUrl(value){
 try{const url=new URL(asString(value));return url.protocol==='http:'||url.protocol==='https:'}catch{return false}
}
export function toAbsoluteUrl(base,href){
 try{return new URL(asString(href),asString(base)).toString()}catch{return null}
}
export function sameOrigin(a,b){
 try{return new URL(a).origin===new URL(b).origin}catch{return false}
}
export function originOf(value){
 try{return new URL(value).origin}catch{return null}
}
export function pathOf(value){
 try{return new URL(value).pathname}catch{return null}
}
export function queryOf(value){
 try{return new URL(value).search}catch{return ''}
}
export function hostOf(value){
 try{return new URL(value).hostname}catch{return null}
}

export function parseDigits(value){
 const digits=asString(value).replace(/[^0-9]/g,'');
 return digits?Number(digits):null;
}
export function parseDecimal(value){
 const text=asString(value).replace(/[^0-9,.-]/g,'').trim();
 if(!text)return null;
 const normalized=text.includes(',')&&text.includes('.')?text.replace(/\./g,'').replace(',','.'):text.replace(',','.');
 const n=Number(normalized);
 return Number.isFinite(n)?n:null;
}
export function parseRupiah(value){
 const text=asString(value).replace(/[^0-9,.-]/g,'').trim();
 if(!text)return null;
 let normalized=text;
 if(text.includes('.')&&text.includes(','))normalized=text.replace(/\./g,'').replace(',','.');
 else if(text.includes('.'))normalized=text.replace(/\./g,'');
 else if(text.includes(','))normalized=text.replace(',','.');
 const n=Number(normalized);
 return Number.isFinite(n)?n:null;
}
export function formatRupiah(value,{zero='Rp0',unknown='Tidak tersedia'}={}){
 const n=asNumber(value,NaN);
 if(!Number.isFinite(n))return unknown;
 if(n===0)return zero;
 return 'Rp'+Math.round(n).toLocaleString('id-ID');
}
export function formatRange(min,max,unit=''){
 const a=asNumber(min,NaN),b=asNumber(max,NaN);
 if(!Number.isFinite(a)&&!Number.isFinite(b))return 'Harga tidak tersedia';
 if(Number.isFinite(a)&&Number.isFinite(b)&&a!==b)return formatRupiah(a)+' - '+formatRupiah(b)+unit;
 return formatRupiah(Number.isFinite(a)?a:b)+unit;
}
export function priceSort(a,b){
 return asNumber(a?.price,Infinity)-asNumber(b?.price,Infinity);
}
export function minOf(items,selector=x=>x){
 const values=toArray(items).map(selector).map(v=>asNumber(v,NaN)).filter(Number.isFinite);
 return values.length?Math.min(...values):null;
}
export function maxOf(items,selector=x=>x){
 const values=toArray(items).map(selector).map(v=>asNumber(v,NaN)).filter(Number.isFinite);
 return values.length?Math.max(...values):null;
}
export function averageOf(items,selector=x=>x){
 const values=toArray(items).map(selector).map(v=>asNumber(v,NaN)).filter(Number.isFinite);
 return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
}
export function medianOf(items,selector=x=>x){
 const values=toArray(items).map(selector).map(v=>asNumber(v,NaN)).filter(Number.isFinite).sort((a,b)=>a-b);
 if(!values.length)return null;
 const middle=Math.floor(values.length/2);
 return values.length%2?values[middle]:(values[middle-1]+values[middle])/2;
}

export function clampPage(page,maxPage=1){
 return clampInt(page,1,Math.max(1,asInteger(maxPage,1)));
}
export function pageCount(total,pageSize=10){
 const size=Math.max(1,asInteger(pageSize,10));
 return Math.max(1,Math.ceil(Math.max(0,asInteger(total,0))/size));
}
export function pageSlice(items,page=1,pageSize=10){
 const rows=toArray(items);
 const pages=pageCount(rows.length,pageSize),safe=clampPage(page,pages);
 const size=Math.max(1,asInteger(pageSize,10));
 const start=(safe-1)*size;
 return {items:rows.slice(start,start+size),page:safe,pages,total:rows.length,start};
}
export function chunk(items,size=10){
 const rows=toArray(items),output=[],n=Math.max(1,asInteger(size,10));
 for(let i=0;i<rows.length;i+=n)output.push(rows.slice(i,i+n));
 return output;
}
export function chunkAsync(items,size,fn){
 return (async()=>{const outputs=[];for(const group of chunk(items,size))outputs.push(await fn(group));return outputs})();
}

export function groupBy(items,key){
 const map=new Map();
 for(const item of toArray(items)){
  const value=typeof key==='function'?key(item):item?.[key];
  const bucket=map.get(value)||[];
  bucket.push(item);map.set(value,bucket);
 }
 return map;
}
export function groupByObject(items,key){
 return Object.fromEntries(groupBy(items,key));
}
export function indexBy(items,key){
 const map=new Map();
 for(const item of toArray(items))map.set(typeof key==='function'?key(item):item?.[key],item);
 return map;
}
export function countBy(items,key){
 const out=new Map();
 for(const item of toArray(items)){
  const value=typeof key==='function'?key(item):item?.[key];
  out.set(value,(out.get(value)||0)+1);
 }
 return out;
}
export function countByObject(items,key){return Object.fromEntries(countBy(items,key));}

export function compareStrings(a,b){
 const x=normalizeSearch(a),y=normalizeSearch(b);
 return x.localeCompare(y,'id',{numeric:true,sensitivity:'base'});
}
export function compareNumbers(a,b){return asNumber(a,0)-asNumber(b,0);}
export function sortBy(items,key,direction='asc'){
 const rows=[...toArray(items)];
 rows.sort((a,b)=>{
  const av=typeof key==='function'?key(a):a?.[key],bv=typeof key==='function'?key(b):b?.[key];
  const result=typeof av==='number'&&typeof bv==='number'?compareNumbers(av,bv):compareStrings(av,bv);
  return direction==='desc'?-result:result;
 });
 return rows;
}
export function stableSort(items,comparators=[]){
 return [...toArray(items)].map((value,index)=>({value,index})).sort((a,b)=>{
  for(const compare of comparators){const result=compare(a.value,b.value);if(result!==0)return result}
  return a.index-b.index;
 }).map(x=>x.value);
}
export function top(items,count=10,score=value=>value){
 return [...toArray(items)].sort((a,b)=>asNumber(score(b),0)-asNumber(score(a),0)).slice(0,Math.max(0,asInteger(count,10)));
}

export function memoize(fn,{ttlMs=0,maxEntries=100}={}){
 const cache=new Map();
 return (...args)=>{
  const key=safeJsonStringify(args,'__memo__');
  const hit=cache.get(key);
  if(hit&&(!ttlMs||Date.now()-hit.at<ttlMs))return hit.value;
  const value=fn(...args);
  cache.set(key,{at:Date.now(),value});
  if(cache.size>maxEntries)cache.delete(cache.keys().next().value);
  return value;
 };
}
export function memoizeAsync(fn,{ttlMs=0,maxEntries=100}={}){
 const cache=new Map();
 return async(...args)=>{
  const key=safeJsonStringify(args,'__memo__');
  const hit=cache.get(key);
  if(hit&&(!ttlMs||Date.now()-hit.at<ttlMs))return hit.value;
  const value=await fn(...args);
  cache.set(key,{at:Date.now(),value});
  if(cache.size>maxEntries)cache.delete(cache.keys().next().value);
  return value;
 };
}
export function createTtlCache({defaultTtlMs=60000,maxEntries=500}={}){
 const map=new Map();
 const get=(key)=>{const hit=map.get(key);if(!hit){return null}if(Date.now()-hit.at>=hit.ttl){map.delete(key);return null}return hit.value};
 const set=(key,value,ttl=defaultTtlMs)=>{map.set(key,{value,at:Date.now(),ttl:Math.max(0,asInteger(ttl,defaultTtlMs))});if(map.size>maxEntries)map.delete(map.keys().next().value);return value};
 const del=key=>map.delete(key),clear=()=>map.clear(),size=()=>map.size;
 return {get,set,delete:del,clear,size,has:key=>get(key)!==null,keys:()=>[...map.keys()]};
}

export function retryDelay(attempt,{baseMs=250,maxMs=10000,jitterMs=100}={}){
 const exponent=Math.max(0,asInteger(attempt,0));
 const raw=Math.min(maxMs,baseMs*(2**exponent));
 return raw+Math.floor(Math.random()*Math.max(0,jitterMs));
}
export async function retry(fn,{retries=2,shouldRetry=()=>true,onRetry=async()=>{}}={}){
 let lastError;
 for(let attempt=0;attempt<=retries;attempt++){
  try{return await fn(attempt)}catch(error){lastError=error;if(attempt>=retries||!shouldRetry(error,attempt))break;await onRetry(error,attempt);await sleep(retryDelay(attempt))}
 }
 throw lastError;
}
export function timeoutSignal(ms){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(new Error('Operation timeout after '+ms+'ms')),Math.max(1,asInteger(ms,10000)));
 return {signal:controller.signal,cancel:()=>clearTimeout(timer)};
}

export function parseBooleanOption(value){return toBoolean(value,false)}
export function parseIntegerOption(value,{min=-Infinity,max=Infinity,fallback=null}={}){const n=asInteger(value,NaN);return Number.isInteger(n)&&n>=min&&n<=max?n:fallback}
export function parseStringOption(value,{min=0,max=2000,fallback=''}={}){const text=asTrimmed(value);return text.length>=min&&text.length<=max?text:fallback}
export function parseListOption(value,{separator='|',max=25,min=0}={}){
 const rows=asString(value).split(separator).map(asTrimmed).filter(Boolean).slice(0,max);
 return rows.length>=min?rows:[];
}
export function parseEnumOption(value,allowed,fallback=null){
 const normalized=asLower(value);
 return toArray(allowed).map(asLower).includes(normalized)?normalized:fallback;
}

export function dateInTimezone(date=new Date(),timeZone='Asia/Jakarta'){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(date);
 return Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
}
export function dateKeyInTimezone(date=new Date(),timeZone='Asia/Jakarta'){
 const x=dateInTimezone(date,timeZone);
 return x.year+'-'+x.month+'-'+x.day;
}
export function timeMinutesInTimezone(date=new Date(),timeZone='Asia/Jakarta'){
 const x=dateInTimezone(date,timeZone);return asInteger(x.hour,0)*60+asInteger(x.minute,0);
}
export function formatDateId(date=new Date(),timeZone='Asia/Jakarta'){
 return new Intl.DateTimeFormat('id-ID',{timeZone,dateStyle:'medium',timeStyle:'short'}).format(date);
}
export function sameDateInTimezone(a,b,timeZone='Asia/Jakarta'){return dateKeyInTimezone(a,timeZone)===dateKeyInTimezone(b,timeZone)}
export function isToday(date,timeZone='Asia/Jakarta'){return sameDateInTimezone(date,new Date(),timeZone)}

export function hashInput(value){
 let hash=2166136261;
 for(const char of asString(value)){hash^=char.codePointAt(0);hash=Math.imul(hash,16777619)}
 return (hash>>>0).toString(16).padStart(8,'0');
}
export function shortHash(value,length=8){return hashInput(value).slice(0,Math.max(1,asInteger(length,8)))}
export function safeId(value,prefix='id'){return prefix+'_'+shortHash(value,12)}
export function correlationId(prefix='req'){return prefix+'_'+shortHash(String(Date.now())+'_'+Math.random(),12)}

export function maskSecret(value,{visible=2}={}){
 const text=asString(value);
 if(text.length<=visible)return '*'.repeat(text.length);
 return text.slice(0,visible)+'*'.repeat(Math.max(3,text.length-visible));
}
export function redactObject(object,keys=['token','password','secret','api_key','apikey','authorization']){
 if(!isObject(object))return object;
 const redacted={};
 for(const [key,value] of Object.entries(object))redacted[keys.some(x=>key.toLowerCase().includes(x))?'[REDACTED]':key]=isObject(value)?redactObject(value,keys):value;
 return redacted;
}

export function createLogger(scope='nararya'){
 const prefix='['+scope+']';
 const log=(level,...args)=>console[level]?.(prefix,...args);
 return {debug:(...args)=>log('debug',...args),info:(...args)=>log('log',...args),warn:(...args)=>log('warn',...args),error:(...args)=>log('error',...args)};
}
export function createNoopLogger(){return{debug:()=>{},info:()=>{},warn:()=>{},error:()=>{}}}

export function requireString(value,name='value'){
 const result=asTrimmed(value);if(!result)throw new Error(name+' wajib diisi.');
 return result;
}
export function requireHttpUrl(value,name='URL'){
 const result=requireString(value,name);
 if(!isHttpUrl(result))throw new Error(name+' harus menggunakan http:// atau https://.');
 return result;
}
export function requireOneOf(value,allowed,name='value'){
 const result=asString(value);
 if(!toArray(allowed).includes(result))throw new Error(name+' tidak valid.');
 return result;
}
export function requireRange(value,{min=0,max=Infinity,name='value'}={}){
 const result=asNumber(value,NaN);
 if(!Number.isFinite(result)||result<min||result>max)throw new Error(name+' harus berada di antara '+min+' dan '+max+'.');
 return result;
}

export function serializeError(error){
 if(!error)return null;
 return {name:asString(error.name,'Error'),message:asString(error.message),code:error.code||null,stack:asString(error.stack).split('\n').slice(0,8).join('\n')};
}
export function errorMessage(error,fallback='Terjadi kesalahan.'){return asString(error?.message||error,fallback)}
export function isAbortError(error){return error?.name==='AbortError'||error?.code==='ABORT_ERR'}
export function isHttpStatusRetryable(status){return [408,425,429,500,502,503,504].includes(asInteger(status,0))}

export function dedupeAdjacent(items,key=value=>value){
 const output=[],seen=new Set(),getKey=typeof key==='function'?key:value=>value?.[key];
 for(const item of toArray(items)){const k=getKey(item);if(!seen.has(k)){seen.add(k);output.push(item)}}return output;
}
export function filterText(items,query,fields=[]){
 const q=normalizeSearch(query);if(!q)return [...toArray(items)];
 return toArray(items).filter(item=>fields.length?fields.some(field=>normalizeSearch(item?.[field]).includes(q)):normalizeSearch(item).includes(q));
}
export function filterNumber(items,{field,min,max}={}){
 return toArray(items).filter(item=>{const n=asNumber(item?.[field],NaN);return Number.isFinite(n)&&(min===undefined||n>=min)&&(max===undefined||n<=max)});
}

export function parsePaginationInput({page=1,limit=10,maxLimit=25}={}){
 const safeLimit=clampInt(limit,1,maxLimit),safePage=Math.max(1,asInteger(page,1));
 return {page:safePage,limit:safeLimit};
}
export function buildPageLabel({page,pages,total}){return 'Halaman '+page+'/'+pages+' • '+total+' item'}
export function pageIndex({page,limit}){return (Math.max(1,asInteger(page,1))-1)*Math.max(1,asInteger(limit,10))}
export function hasNextPage(page,pages){return asInteger(page,1)<asInteger(pages,1)}
export function hasPrevPage(page){return asInteger(page,1)>1}

export function mergeObjects(...objects){
 return Object.assign({},...objects.filter(isObject));
}
export function deepMerge(base,...sources){
 const result=isObject(base)?structuredClone(base):{};
 for(const source of sources){if(!isObject(source))continue;for(const [key,value] of Object.entries(source)){if(isObject(value)&&isObject(result[key]))result[key]=deepMerge(result[key],value);else result[key]=value}}
 return result;
}
export function pick(object,keys=[]){return Object.fromEntries(toArray(keys).filter(key=>Object.prototype.hasOwnProperty.call(object||{},key)).map(key=>[key,object[key]]))}
export function omit(object,keys=[]){const blocked=new Set(toArray(keys));return Object.fromEntries(Object.entries(object||{}).filter(([key])=>!blocked.has(key)))}
export function mapValues(object,fn){return Object.fromEntries(Object.entries(object||{}).map(([key,value])=>[key,fn(value,key)]))}
export function mapKeys(object,fn){return Object.fromEntries(Object.entries(object||{}).map(([key,value])=>[fn(value,key),value]))}
export function compactObject(object){return Object.fromEntries(Object.entries(object||{}).filter(([,value])=>value!==null&&value!==undefined&&value!==''))}
export function invertObject(object){return Object.fromEntries(Object.entries(object||{}).map(([key,value])=>[String(value),key]))}

export function sqlLike(value){return '%'+asString(value).replaceAll('%','').replaceAll('_','')+'%'}
export function safeIdentifier(value,fallback='value'){const text=asString(value);return /^[A-Za-z_][A-Za-z0-9_]*$/.test(text)?text:fallback}
export function safeLimit(value,fallback=25){return clampInt(value,1,Math.max(1,fallback))}
export function safeOffset(value){return Math.max(0,asInteger(value,0))}

export function eventKey(...parts){return parts.map(part=>normalizeSearch(part).replace(/\s+/g,'_')).filter(Boolean).join(':')}
export function cacheKey(scope,...parts){return scope+':'+parts.map(part=>normalizeSearch(part)).join(':')}
export function metricName(scope,name){return normalizeSearch(scope)+'_'+normalizeSearch(name).replace(/\s+/g,'_')}
export function elapsedMs(start){return Math.max(0,Date.now()-asNumber(start,Date.now()))}

export function isProbablyPriceText(value){
 const text=normalizeSearch(value);
 return /(?:rp|idr)\s*\d|\d[\d.,]+\s*(?:rb|ribu|jt|juta)?/.test(text);
}
export function parsePriceToken(value){
 const text=normalizeSearch(value).replaceAll(' ','');
 const m=text.match(/(?:rp|idr)?([0-9][0-9.,]*)(rb|ribu|jt|juta)?/i);
 if(!m)return null;
 let n=parseRupiah(m[1]);if(n===null)return null;
 const unit=(m[2]||'').toLowerCase();
 if(unit==='rb'||unit==='ribu')n*=1000;
 if(unit==='jt'||unit==='juta')n*=1000000;
 return Math.round(n);
}
export function parsePriceRangeText(value){
 const text=normalizeWhitespace(value);
 const matches=text.match(/(?:rp\.?\s*)?[0-9][0-9.,]*(?:\s*(?:rb|ribu|jt|juta))?/gi)||[];
 const values=matches.map(parsePriceToken).filter(v=>Number.isFinite(v));
 return {min:minOf(values),max:maxOf(values),values};
}

export const TOOL_GROUPS=Object.freeze({
 text:['asString','normalizeWhitespace','normalizeSearch','slugify','stripHtml'],
 number:['asNumber','asInteger','clamp','parseDigits','parseDecimal','parseRupiah','formatRupiah'],
 web:['isHttpUrl','toAbsoluteUrl','sameOrigin','originOf','pathOf','queryOf','hostOf'],
 pagination:['pageCount','pageSlice','chunk','parsePaginationInput','buildPageLabel'],
 collection:['unique','groupBy','indexBy','countBy','sortBy','stableSort','top'],
 cache:['memoize','memoizeAsync','createTtlCache','retryDelay','retry'],
 security:['maskSecret','redactObject','requireHttpUrl','safeId','correlationId'],
 date:['dateInTimezone','dateKeyInTimezone','timeMinutesInTimezone','formatDateId','sameDateInTimezone'],
 prices:['isProbablyPriceText','parsePriceToken','parsePriceRangeText','formatRange']
});

export function listToolGroups(){return Object.entries(TOOL_GROUPS).map(([name,tools])=>({name,tools:[...tools]}))}
export function listToolNames(){return unique(Object.values(TOOL_GROUPS).flat())}
export function hasTool(name){return listToolNames().includes(name)}
export function describeToolbox(){return{version:TOOLBOX_VERSION,groups:listToolGroups(),toolCount:listToolNames().length}}
