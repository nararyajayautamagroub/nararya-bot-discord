import {createTtlCache,cacheKey,asInteger,asString,serializeError} from './toolbox.js';

/**
 * Named cache registry.
 * Keeps cache ownership explicit across modules.
 */
export function createCacheRegistry({defaultTtlMs=60000,maxEntries=500}={}){
 const namespaces=new Map();
 const getNamespace=name=>{
  const key=asString(name,'default');
  if(!namespaces.has(key))namespaces.set(key,createTtlCache({defaultTtlMs,maxEntries}));
  return namespaces.get(key);
 };
 const get=(namespace,key)=>getNamespace(namespace).get(key);
 const set=(namespace,key,value,ttl)=>getNamespace(namespace).set(key,value,ttl);
 const del=(namespace,key)=>getNamespace(namespace).delete(key);
 const clear=namespace=>namespace?getNamespace(namespace).clear():namespaces.forEach(cache=>cache.clear());
 const stats=()=>Object.fromEntries([...namespaces.entries()].map(([name,cache])=>[name,{size:cache.size(),keys:cache.keys()}]));
 return {get,set,delete:del,clear,stats,namespace:getNamespace};
}

export function createAsyncCache({ttlMs=60000,maxEntries=200}={}){
 const data=new Map();
 const inflight=new Map();
 async function get(key,loader,{force=false,ttl=ttlMs}={}){
  const normalized=asString(key);
  const existing=data.get(normalized);
  if(!force&&existing&&Date.now()<existing.expiresAt)return existing.value;
  if(inflight.has(normalized))return inflight.get(normalized);
  const promise=Promise.resolve().then(loader).then(value=>{
   data.set(normalized,{value,expiresAt:Date.now()+Math.max(0,asInteger(ttl,ttlMs))});
   if(data.size>maxEntries)data.delete(data.keys().next().value);
   inflight.delete(normalized);
   return value;
  }).catch(error=>{inflight.delete(normalized);throw error});
  inflight.set(normalized,promise);
  return promise;
 }
 return {
  get,
  has:key=>data.has(asString(key))&&Date.now()<data.get(asString(key)).expiresAt,
  delete:key=>data.delete(asString(key)),
  clear:()=>{data.clear();inflight.clear()},
  size:()=>data.size,
  keys:()=>[...data.keys()]
 };
}

export function restaurantCacheKey(city,query,category,minPrice,maxPrice,page,limit){
 return cacheKey('restaurant',city,query,category,minPrice,maxPrice,page,limit);
}

export function sourceCacheKey(source,url){
 return cacheKey(asString(source,'source'),url);
}

export function cacheResult(cache,key,value,{ttlMs=60000}={}){
 return cache.set(key,{value,cachedAt:Date.now(),expiresAt:Date.now()+Math.max(0,ttlMs)});
}

export function readCacheResult(cache,key){
 const row=cache.get(key);
 if(!row)return null;
 return row.value??row;
}

export function cacheDiagnostics(registry){
 try{return registry.stats()}catch(error){return{error:serializeError(error)}}
}

// CACHE TOOLING BLOCK 01
// CACHE TOOLING BLOCK 02
// CACHE TOOLING BLOCK 03
// CACHE TOOLING BLOCK 04
// CACHE TOOLING BLOCK 05
// CACHE TOOLING BLOCK 06
// CACHE TOOLING BLOCK 07
// CACHE TOOLING BLOCK 08
// CACHE TOOLING BLOCK 09
// CACHE TOOLING BLOCK 10
// CACHE TOOLING BLOCK 11
// CACHE TOOLING BLOCK 12
// CACHE TOOLING BLOCK 13
// CACHE TOOLING BLOCK 14
// CACHE TOOLING BLOCK 15
// CACHE TOOLING BLOCK 16
// CACHE TOOLING BLOCK 17
// CACHE TOOLING BLOCK 18
// CACHE TOOLING BLOCK 19
// CACHE TOOLING BLOCK 20
