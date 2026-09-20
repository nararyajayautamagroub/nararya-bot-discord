export class ApiError extends Error{
  constructor(message,status=0,data=null){
    super(message);
    this.name='ApiError';
    this.status=status;
    this.data=data;
  }
}

function normalizePath(path){
  const value=String(path||'/');
  if(value.startsWith('/api/v1/'))return value;
  if(value.startsWith('/api/'))return value.replace(/^\/api(?=\/)/,'/api/v1');
  return value;
}

export function createApiClient({baseTimeoutMs=12000,retries=1}={}){
  async function request(path,options={}){
    const url=normalizePath(path);
    let lastError=null;

    for(let attempt=0;attempt<=retries;attempt++){
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),baseTimeoutMs);
      try{
        const headers={
          accept:'application/json',
          ...(options.body?{'content-type':'application/json'}:{}),
          ...(options.headers||{})
        };
        const response=await fetch(url,{
          ...options,
          credentials:'same-origin',
          headers,
          signal:controller.signal,
          cache:options.cache||'no-store'
        });
        const data=await response.json().catch(()=>({}));
        if(!response.ok){
          throw new ApiError(data.error||('Request failed with HTTP '+response.status),response.status,data);
        }
        return data;
      }catch(error){
        lastError=error?.name==='AbortError'
          ?new ApiError('Request timeout.',408)
          :error;
        if(attempt<retries&&(!lastError.status||lastError.status>=500)){
          await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));
        }else break;
      }finally{
        clearTimeout(timer);
      }
    }
    throw lastError||new ApiError('Request failed.');
  }

  return {
    get(path,options={}){return request(path,{...options,method:'GET'})},
    post(path,body,options={}){return request(path,{...options,method:'POST',body:JSON.stringify(body??{})})},
    request
  };
}
