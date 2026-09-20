import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {createWebGateway} from '../gateway/index.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const websiteDir=path.join(root,'website','jkt48');
const verificationDir=path.join(root,'src','web','verification','public');
const COOKIE_NAME='nararya_web_session';
const OAUTH_COOKIE='nararya_google_state';
const OAUTH_VERIFIER_COOKIE='nararya_google_verifier';
const ONE_DAY=86400000;
const MIME={
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.ico':'image/x-icon'
};
const SPA_ROUTES=new Set(['/','/index.html','/home','/members','/features','/games','/feeds','/commands','/sources','/settings']);

function parseCookies(req){
  const out={};
  for(const part of String(req.headers.cookie||'').split(';')){
    const index=part.indexOf('=');
    if(index<0)continue;
    try{out[part.slice(0,index).trim()]=decodeURIComponent(part.slice(index+1).trim())}
    catch{out[part.slice(0,index).trim()]=part.slice(index+1).trim()}
  }
  return out;
}
function cookie(name,value,{maxAge=ONE_DAY,httpOnly=true,sameSite='Lax',secure=String(process.env.WEB_COOKIE_SECURE||'false')==='true',path='/',clear=false}={}){
  const chunks=[name+'='+encodeURIComponent(value||''),'Path='+path,'SameSite='+sameSite];
  if(httpOnly)chunks.push('HttpOnly');
  if(secure)chunks.push('Secure');
  chunks.push('Max-Age='+(clear?0:Math.max(0,Math.floor(maxAge/1000))));
  return chunks.join('; ');
}
function json(res,status,payload,extraHeaders={}){
  res.writeHead(status,{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'X-Frame-Options':'DENY',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}
function redirect(res,location,headers=[]){
  res.writeHead(302,{
    Location:location,
    'Cache-Control':'no-store',
    'Set-Cookie':headers
  });
  res.end();
}
function safeReturnTo(value){
  const clean=String(value||'/');
  if(/[\r\n\\]/.test(clean)||!/^\/(?!\/)/.test(clean))return '/';
  return clean;
}
function pkceVerifier(){return crypto.randomBytes(48).toString('base64url')}
function pkceChallenge(verifier){return crypto.createHash('sha256').update(verifier).digest('base64url')}
function isInside(base,target){
  const relative=path.relative(base,target);
  return relative===''||(!relative.startsWith('..')&&!path.isAbsolute(relative));
}

export function createWebsiteServer({db,authService,verificationService,featureRegistry,scraperOrchestrator}){
  const port=Number(process.env.WEBSITE_PORT||process.env.VERIFY_WEB_PORT||3000);
  const host=process.env.WEBSITE_HOST||process.env.VERIFY_WEB_HOST||'0.0.0.0';
  const publicUrl=process.env.WEBSITE_PUBLIC_URL||process.env.VERIFY_WEB_BASE_URL||'';
  const enabled=String(process.env.WEBSITE_DISABLED||'false').toLowerCase()!=='true';
  const googleEnabled=Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET&&process.env.GOOGLE_REDIRECT_URI);
  const gateway=createWebGateway({publicUrl,bodyLimitBytes:30000,defaultLimit:60});
  const sessionTimer=setInterval(()=>authService.cleanup(),3600000);
  sessionTimer.unref?.();

  async function googleToken(code,verifier){
    const params=new URLSearchParams({
      code,
      client_id:String(process.env.GOOGLE_CLIENT_ID),
      client_secret:String(process.env.GOOGLE_CLIENT_SECRET),
      redirect_uri:String(process.env.GOOGLE_REDIRECT_URI),
      grant_type:'authorization_code',
      code_verifier:verifier
    });
    const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{
      method:'POST',
      headers:{'content-type':'application/x-www-form-urlencoded',accept:'application/json'},
      body:params
    });
    const token=await tokenResponse.json().catch(()=>({}));
    if(!tokenResponse.ok||!token.access_token)throw new Error('Google OAuth token exchange failed.');
    const profileResponse=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{
      headers:{authorization:'Bearer '+token.access_token,accept:'application/json'}
    });
    const profile=await profileResponse.json().catch(()=>({}));
    if(!profileResponse.ok||profile.email_verified!==true)throw new Error('Google account email is not verified.');
    return profile;
  }

  async function api(req,res,url){
    const cookies=parseCookies(req);
    const sessionUser=authService.userFromSession(cookies[COOKIE_NAME]);
    const ip=String(req.socket.remoteAddress||'unknown');
    const apiPath=url.pathname.replace(/^\/api\/v1(?=\/|$)/,'/api');

    if(!gateway.rateLimit(ip,'api',120))return json(res,429,{ok:false,error:'Terlalu banyak request. Coba lagi nanti.'});
    if(req.method==='POST'&&!gateway.originAllowed(req))return json(res,403,{ok:false,error:'Origin tidak diizinkan.'});

    if(apiPath==='/api/auth/me'&&req.method==='GET'){
      return json(res,200,{ok:true,user:sessionUser?authService.publicUser(sessionUser):null,googleEnabled});
    }
    if(apiPath==='/api/auth/register'&&req.method==='POST'){
      if(!gateway.rateLimit(ip,'auth',20))return json(res,429,{ok:false,error:'Terlalu banyak percobaan login/register.'});
      const body=await gateway.readJson(req);
      const result=authService.register(body);
      return json(res,201,{ok:true,user:result.user},{
        'Set-Cookie':cookie(COOKIE_NAME,result.token,{maxAge:result.expiresAt-Date.now(),httpOnly:true,sameSite:'Lax'})
      });
    }
    if(apiPath==='/api/auth/login'&&req.method==='POST'){
      if(!gateway.rateLimit(ip,'auth',20))return json(res,429,{ok:false,error:'Terlalu banyak percobaan login/register.'});
      const body=await gateway.readJson(req);
      const result=authService.login(body);
      return json(res,200,{ok:true,user:result.user},{
        'Set-Cookie':cookie(COOKIE_NAME,result.token,{maxAge:result.expiresAt-Date.now(),httpOnly:true,sameSite:'Lax'})
      });
    }
    if(apiPath==='/api/auth/logout'&&req.method==='POST'){
      authService.revokeSession(cookies[COOKIE_NAME]);
      return json(res,200,{ok:true},{
        'Set-Cookie':cookie(COOKIE_NAME,'',{clear:true,maxAge:0,httpOnly:true,sameSite:'Lax'})
      });
    }
    if(apiPath==='/api/auth/settings'&&req.method==='POST'){
      if(!sessionUser)return json(res,401,{ok:false,error:'Anda belum login.'});
      const body=await gateway.readJson(req);
      return json(res,200,{ok:true,user:authService.updateSettings(sessionUser.id,body)});
    }
    if(apiPath==='/api/auth/password'&&req.method==='POST'){
      if(!sessionUser)return json(res,401,{ok:false,error:'Anda belum login.'});
      const body=await gateway.readJson(req);
      const result=authService.changePassword(sessionUser.id,{currentPassword:body.currentPassword,newPassword:body.newPassword});
      return json(res,200,{ok:true,user:authService.getUser(sessionUser.id)},{
        'Set-Cookie':cookie(COOKIE_NAME,result.token,{maxAge:result.expiresAt-Date.now(),httpOnly:true,sameSite:'Lax'})
      });
    }
    if(apiPath==='/api/auth/google/start'&&req.method==='GET'){
      if(!googleEnabled)return json(res,503,{ok:false,error:'Google Login belum dikonfigurasi oleh administrator.'});
      const statePack=authService.createOAuthState({provider:'google',returnTo:safeReturnTo(url.searchParams.get('returnTo')||'/')});
      const verifier=pkceVerifier();
      db.prepare('UPDATE web_oauth_states SET return_to=? WHERE state_hash=?')
        .run(statePack.returnTo,crypto.createHash('sha256').update(statePack.state).digest('hex'));
      const query=new URLSearchParams({
        client_id:String(process.env.GOOGLE_CLIENT_ID),
        redirect_uri:String(process.env.GOOGLE_REDIRECT_URI),
        response_type:'code',
        scope:'openid email profile',
        state:statePack.state,
        code_challenge:pkceChallenge(verifier),
        code_challenge_method:'S256',
        access_type:'online',
        prompt:'select_account'
      });
      return redirect(res,'https://accounts.google.com/o/oauth2/v2/auth?'+query.toString(),[
        cookie(OAUTH_COOKIE,statePack.state,{maxAge:600000,httpOnly:true,sameSite:'Lax'}),
        cookie(OAUTH_VERIFIER_COOKIE,verifier,{maxAge:600000,httpOnly:true,sameSite:'Lax'})
      ]);
    }
    if(apiPath==='/api/auth/google/callback'&&req.method==='GET'){
      if(url.searchParams.get('error'))throw new Error('Google Login dibatalkan.');
      const code=url.searchParams.get('code');
      const state=url.searchParams.get('state');
      const storedState=cookies[OAUTH_COOKIE];
      const verifier=cookies[OAUTH_VERIFIER_COOKIE];
      if(!code||!state||!storedState||state!==storedState||!verifier)throw new Error('Google OAuth state tidak valid.');
      const stateRow=authService.consumeOAuthState(state);
      if(stateRow.provider!=='google')throw new Error('OAuth provider tidak valid.');
      const result=authService.upsertGoogleProfile(await googleToken(code,verifier));
      return redirect(res,stateRow.return_to,[
        cookie(OAUTH_COOKIE,'',{clear:true,maxAge:0,httpOnly:true,sameSite:'Lax'}),
        cookie(OAUTH_VERIFIER_COOKIE,'',{clear:true,maxAge:0,httpOnly:true,sameSite:'Lax'}),
        cookie(COOKIE_NAME,result.token,{maxAge:result.expiresAt-Date.now(),httpOnly:true,sameSite:'Lax'})
      ]);
    }
    if(apiPath==='/api/auth/health'&&req.method==='GET')return json(res,200,{ok:true,...authService.health()});
    if(apiPath==='/api/scrapers/status'&&req.method==='GET'){
      const rows=scraperOrchestrator?.status?.()||[];
      return json(res,200,{ok:true,rows:rows.map(x=>({
        key:x.key,
        group:x.group_name,
        status:x.last_status,
        latencyMs:x.last_latency_ms,
        error:x.last_error,
        checkedAt:x.last_checked_at,
        successAt:x.last_success_at
      }))});
    }
    if(apiPath==='/api/verify/session'&&req.method==='GET'){
      const row=verificationService.getSession(url.searchParams.get('ticket')||'');
      if(!row)return json(res,404,{ok:false,error:'Sesi tidak ditemukan.'});
      return json(res,200,{ok:true,userId:row.user_id,guildId:row.guild_id,issuedAt:row.issued_at,expiresAt:row.expires_at,status:row.status});
    }
    if(apiPath==='/api/verify/complete'&&req.method==='POST'){
      const body=await gateway.readJson(req);
      const result=verificationService.completeWebChallenge(body);
      return json(res,200,{ok:true,message:'Verifikasi berhasil. Masukkan kode berikut ke Discord.',code:result.code,expiresAt:result.expiresAt});
    }
    if(apiPath==='/api/features'&&req.method==='GET')return json(res,200,{ok:true,features:featureRegistry});
    return false;
  }

  function sendVerificationStatic(res,file,type){
    const full=path.resolve(verificationDir,file);
    if(!isInside(verificationDir,full)||!fs.existsSync(full)||!fs.statSync(full).isFile()){
      res.writeHead(404);return res.end('Not found');
    }
    res.writeHead(200,{...gateway.securityHeaders(),'Content-Type':type,'Cache-Control':'no-store'});
    fs.createReadStream(full).pipe(res);
  }

  function sendStatic(res,file){
    const safe=path.normalize(file).split(path.sep).filter(part=>part!=='..'&&part!=='.').join(path.sep);
    const full=path.resolve(websiteDir,safe);
    if(!isInside(websiteDir,full)||!fs.existsSync(full)||!fs.statSync(full).isFile()){
      res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
      return res.end('Not found');
    }
    const type=MIME[path.extname(full).toLowerCase()]||'application/octet-stream';
    const headers={
      ...gateway.securityHeaders(),
      'Content-Type':type,
      'Cache-Control':file==='index.html'?'no-cache':'public, max-age=300',
      'Content-Security-Policy':"default-src 'self'; img-src 'self' https: data:; style-src 'self'; script-src 'self'; connect-src 'self' https://raw.githubusercontent.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    };
    res.writeHead(200,headers);
    fs.createReadStream(full).pipe(res);
  }

  async function sendHealth(res,ready=false){
    const auth=authService.health();
    const verification=verificationService.health();
    const scraperRows=scraperOrchestrator?.status?.()||[];
    const readyState=Boolean(auth&&verification&&Array.isArray(scraperRows));
    return json(res,ready?(readyState?200:503):200,{
      ok:readyState,
      ready:readyState,
      service:'website',
      version:'3.2.1',
      gateway:'enabled',
      auth,
      verification,
      scrapers:{count:scraperRows.length}
    });
  }

  const server=http.createServer(async(req,res)=>{
    const requestId=gateway.requestId(req);
    res.setHeader('X-Request-ID',requestId);
    try{
      const url=new URL(req.url||'/','http://'+(req.headers.host||'localhost'));
      const handled=await api(req,res,url);
      if(handled!==false)return;
      if(req.method==='GET'){
        if(url.pathname==='/health')return sendHealth(res,false);
        if(url.pathname==='/ready')return sendHealth(res,true);
        if(url.pathname==='/verify')return sendVerificationStatic(res,'index.html','text/html; charset=utf-8');
        if(url.pathname==='/verify/style.css')return sendVerificationStatic(res,'style.css','text/css; charset=utf-8');
        if(url.pathname==='/verify/app.js')return sendVerificationStatic(res,'app.js','text/javascript; charset=utf-8');
        const requested=SPA_ROUTES.has(url.pathname)?'index.html':url.pathname.replace(/^\//,'');
        if(requested.includes('..'))return json(res,400,{ok:false,error:'Invalid path.'});
        return sendStatic(res,requested);
      }
      return json(res,404,{ok:false,error:'Not found'});
    }catch(error){
      const status=error.message==='Origin tidak diizinkan.'?403:400;
      return json(res,status,{ok:false,error:error.message||'Request failed'});
    }
  });

  return {
    start(){
      if(!enabled)return {enabled:false,server:null,googleEnabled};
      server.listen(port,host,()=>console.log('[website] listening on '+host+':'+port+' google='+googleEnabled));
      return {enabled:true,server,googleEnabled};
    },
    close(){
      gateway.close();
      clearInterval(sessionTimer);
      if(server.listening)server.close();
    },
    server,
    port,
    host,
    enabled,
    googleEnabled
  };
}
