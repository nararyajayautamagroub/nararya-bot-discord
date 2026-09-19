import crypto from 'node:crypto';

export function stableHash(value){
 return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function safePublicUrl(value,base=null){
 try{
  const url=new URL(String(value),base||undefined);
  if(!['http:','https:'].includes(url.protocol))return null;
  return url.href;
 }catch{return null}
}

export function cleanText(value,max=900){
 return String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
}

export function parseDate(value,fallback=Date.now()){
 const parsed=Date.parse(String(value??''));
 return Number.isFinite(parsed)?parsed:fallback;
}

export function uniqueByUrl(items,limit=40){
 const seen=new Set();
 const out=[];
 for(const item of Array.isArray(items)?items:[]){
  if(!item?.url||seen.has(item.url))continue;
  seen.add(item.url);out.push(item);
  if(out.length>=limit)break;
 }
 return out;
}

export function splitPublicUrls(value){
 return String(value||'').split(/[|,\n]+/).map(x=>x.trim()).filter(Boolean).map(x=>safePublicUrl(x)).filter(Boolean);
}

export function parsePublicSocialJson(value){
 try{
  const data=JSON.parse(String(value||'[]'));
  if(!Array.isArray(data))return [];
  return data.filter(x=>x&&typeof x==='object'&&safePublicUrl(x.url));
 }catch{return []}
}

export function exponentialBackoff(attempt,{base=350,max=5000}={}){
 return Math.min(max,base*Math.pow(2,Math.max(0,attempt)));
}

export async function retry(task,{attempts=3,onError=()=>{}}={}){
 let last;
 for(let attempt=0;attempt<Math.max(1,attempts);attempt++){
  try{return await task(attempt)}catch(error){
   last=error;onError(error,attempt);
   if(attempt+1<attempts)await new Promise(r=>setTimeout(r,exponentialBackoff(attempt)));
  }
 }
 throw last||new Error('Operation failed');
}

export function redactUrl(value){
 try{
  const url=new URL(value);
  for(const key of [...url.searchParams.keys()]){
   if(/token|key|secret|cookie|auth|signature/i.test(key))url.searchParams.set(key,'[redacted]');
  }
  return url.href;
 }catch{return '[invalid-url]'}
}
