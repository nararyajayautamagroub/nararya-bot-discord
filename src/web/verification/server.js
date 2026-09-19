import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const publicDir=path.join(root,'public');

const json=(res,status,payload)=>{
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
 res.end(JSON.stringify(payload));
};

const readBody=req=>new Promise((resolve,reject)=>{
 let data='';
 req.on('data',chunk=>{data+=chunk;if(data.length>20000){req.destroy();reject(new Error('Request body too large.'));}});
 req.on('end',()=>{try{resolve(data?JSON.parse(data):{})}catch{reject(new Error('Invalid JSON.'))}});
 req.on('error',reject);
});

export function createVerificationWebServer({service,featureRegistry}){
 const port=Number(process.env.VERIFY_WEB_PORT||3000);
 const host=process.env.VERIFY_WEB_HOST||'0.0.0.0';
 const enabled=String(process.env.VERIFY_WEB_DISABLED||'false').toLowerCase()!=='true';

 const server=http.createServer(async(req,res)=>{
   try{
     const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
     if(req.method==='GET'&&url.pathname==='/health'){
       return json(res,200,{ok:true,service:'verification',version:process.env.npm_package_version||'1.5.0',verification:service.health()});
     }
     if(req.method==='GET'&&url.pathname==='/api/verify/session'){
       const ticket=url.searchParams.get('ticket');
       const row=service.getSession(ticket||'');
       if(!row)return json(res,404,{ok:false,error:'Sesi tidak ditemukan.'});
       return json(res,200,{ok:true,userId:row.user_id,guildId:row.guild_id,issuedAt:row.issued_at,expiresAt:row.expires_at,status:row.status});
     }
     if(req.method==='POST'&&url.pathname==='/api/verify/complete'){
       const body=await readBody(req);
       const result=service.completeWebChallenge(body);
       return json(res,200,{ok:true,message:'Verifikasi berhasil. Masukkan kode berikut ke Discord.',code:result.code,expiresAt:result.expiresAt});
     }
     if(req.method==='GET'&&url.pathname==='/api/features'){
       return json(res,200,{ok:true,features:featureRegistry});
     }
     if(req.method==='GET'&&url.pathname==='/'){
       res.writeHead(302,{Location:'/verify'});return res.end();
     }
     if(req.method==='GET'&&url.pathname==='/verify'){
       return sendStatic(res,'index.html','text/html; charset=utf-8');
     }
     if(req.method==='GET'&&url.pathname==='/verify/style.css'){
       return sendStatic(res,'style.css','text/css; charset=utf-8');
     }
     if(req.method==='GET'&&url.pathname==='/verify/app.js'){
       return sendStatic(res,'app.js','text/javascript; charset=utf-8');
     }
     json(res,404,{ok:false,error:'Not found'});
   }catch(error){
     json(res,400,{ok:false,error:error.message||'Request failed'});
   }
 });

 function sendStatic(res,file,type){
   const full=path.join(publicDir,file);
   if(!fs.existsSync(full)){res.writeHead(404);return res.end('Not found');}
   res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});
   fs.createReadStream(full).pipe(res);
 }

 return {
   start(){
     if(!enabled)return {enabled:false,server:null};
     server.listen(port,host,()=>console.log('[verification-web] listening on '+host+':'+port));
     return {enabled:true,server};
   },
   close(){server.close()},
   port,
   host,
   enabled
 };
}
