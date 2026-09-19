const DEFAULT_TIMEOUT=10000;

export async function requestText(url,{timeout=DEFAULT_TIMEOUT,headers={},method='GET',body=false}={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeout);
 try{
  const res=await fetch(url,{method,headers:{'user-agent':process.env.SCRAPER_USER_AGENT||'NararyaBotDiscord/1.6.0',accept:'text/html,application/json,application/xml,text/xml,*/*',...headers},signal:controller.signal});
  const text=body?await res.text():'';
  return {ok:res.ok,status:res.status,headers:res.headers,text,url};
 }finally{clearTimeout(timer)}
}

export async function requestJson(url,options={}){
 const result=await requestText(url,options);
 if(!result.ok)throw new Error('HTTP '+result.status+' '+url);
 try{return JSON.parse(result.text)}catch(error){throw new Error('JSON tidak valid dari '+url+': '+error.message)}
}

export async function probeUrl(url,{timeout=5000}={}){
 const started=Date.now();
 let result=await requestText(url,{timeout,method:'HEAD'});
 if(result.status===405||result.status===501){
  result=await requestText(url,{timeout,method:'GET',headers:{range:'bytes=0-256'},body:true});
 }
 return {
  ok:result.ok||[301,302,304].includes(result.status),
  status:result.status,
  latencyMs:Date.now()-started,
  etag:result.headers.get('etag'),
  lastModified:result.headers.get('last-modified'),
  contentType:result.headers.get('content-type'),
  url
 };
}
