import crypto from 'node:crypto';

function originOf(value){
  try{return new URL(String(value)).origin}catch{return '';}
}

export function createWebGateway({
  publicUrl='',
  bodyLimitBytes=30000,
  windowMs=60000,
  defaultLimit=60
}={}){
  const hits=new Map();
  const configuredOrigin=originOf(publicUrl);

  function cleanup(){
    const cutoff=Date.now()-windowMs;
    for(const [key,row] of hits)if(row.startedAt<cutoff)hits.delete(key);
  }

  function rateLimit(key,bucket='default',limit=defaultLimit){
    const now=Date.now();
    const id=bucket+':'+String(key||'unknown');
    const row=hits.get(id);
    if(!row||now-row.startedAt>=windowMs){
      hits.set(id,{startedAt:now,count:1});
      return true;
    }
    row.count+=1;
    return row.count<=limit;
  }

  function requestId(req){
    const incoming=String(req.headers['x-request-id']||'').trim();
    if(/^[a-zA-Z0-9._:-]{8,120}$/.test(incoming))return incoming;
    return crypto.randomUUID();
  }

  function originAllowed(req){
    const origin=String(req.headers.origin||'');
    if(!origin||!configuredOrigin)return true;
    return originOf(origin)===configuredOrigin;
  }

  async function readJson(req){
    let size=0;
    let data='';
    return new Promise((resolve,reject)=>{
      const fail=error=>{
        req.removeAllListeners('data');
        reject(error);
      };
      req.on('data',chunk=>{
        size+=chunk.length;
        if(size>bodyLimitBytes){
          fail(new Error('Request body too large.'));
          req.destroy();
          return;
        }
        data+=chunk;
      });
      req.on('end',()=>{
        try{resolve(data?JSON.parse(data):{})}
        catch{reject(new Error('Invalid JSON.'))}
      });
      req.on('error',reject);
    });
  }

  function securityHeaders(){
    return {
      'X-Content-Type-Options':'nosniff',
      'X-Frame-Options':'DENY',
      'Referrer-Policy':'strict-origin-when-cross-origin',
      'Permissions-Policy':'camera=(),microphone=(),geolocation=()',
      'Cross-Origin-Opener-Policy':'same-origin'
    };
  }

  const timer=setInterval(cleanup,windowMs);
  timer.unref?.();

  return {
    bodyLimitBytes,
    rateLimit,
    requestId,
    originAllowed,
    readJson,
    securityHeaders,
    close(){clearInterval(timer)}
  };
}
