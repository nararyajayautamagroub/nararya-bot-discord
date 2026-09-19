import fs from 'node:fs';
import path from 'node:path';
import {request} from 'undici';
import {createJob,updateJob} from './database.js';
import {newJobDir,fileSize} from './utils.js';
import {downloadWithYtdlp,downloadImage,validateUrl} from './download.js';
import {removeVocals,removeBackgroundImage,removeBackgroundVideo,removeWatermarkImage,removeWatermarkVideo} from './transforms.js';

const MAX_UPLOAD_MB=Number(process.env.MEDIA_MAX_UPLOAD_MB||8);

async function downloadAttachment(attachment,dir){
 const res=await request(attachment.url,{headers:{'user-agent':'NararyaBotDiscord/1.0'},bodyTimeout:30000});
 if(res.statusCode<200||res.statusCode>=300)throw new Error('Attachment download failed: HTTP '+res.statusCode);
 const name=(attachment.name||'attachment').replace(/[^a-zA-Z0-9._-]/g,'_');
 const target=path.join(dir,name);
 const buffer=Buffer.from(await res.body.arrayBuffer());
 const max=Number(process.env.MEDIA_MAX_DOWNLOAD_MB||200)*1024*1024;
 if(buffer.length>max)throw new Error('Downloaded attachment exceeds MEDIA_MAX_DOWNLOAD_MB');
 await fs.promises.writeFile(target,buffer);
 return target;
}

function sourceExtension(name=''){return path.extname(name).slice(1).toLowerCase()||'bin';}

export function createMediaService({db,dir}){
 async function runJob(ctx,operation,opts,prepare,transform){
  const jobId=createJob(db,{guildId:ctx.guildId,userId:ctx.userId,operation,inputSource:opts.url||null,resolution:opts.resolution,format:opts.format});
  const jobDir=newJobDir(dir,jobId);
  try{
   updateJob(db,jobId,{status:'processing'});
   const inputPath=await prepare(jobDir);
   updateJob(db,jobId,{input_path:inputPath});
   const output=await transform(inputPath,jobDir);
   const size=fileSize(output.path);
   if(size>MAX_UPLOAD_MB*1024*1024)throw new Error('Output exceeds MEDIA_MAX_UPLOAD_MB ('+MAX_UPLOAD_MB+' MB). Lower the resolution or use a smaller output format.');
   db.prepare('INSERT INTO media_files(job_id,path,mime,size_bytes,created_at) VALUES(?,?,?,?,?)').run(jobId,output.path,output.mime,size,Date.now());
   updateJob(db,jobId,{status:'completed',output_path:output.path,output_mime:output.mime});
   return {jobId,path:output.path,mime:output.mime,size};
  }catch(error){
   updateJob(db,jobId,{status:'failed',error:error.message});
   throw error;
  }
 }

 async function prepareSource(opts,jobDir){
  if(opts.attachment)return downloadAttachment(opts.attachment,jobDir);
  const url=validateUrl(opts.url);
  if(opts.kind==='image')return (await downloadImage({url,outdir:jobDir})).path;
  return (await downloadWithYtdlp({url,outdir:jobDir,kind:'video',resolution:opts.resolution||'best',format:opts.format||'mp4'})).path;
 }

 return {
  async download(opts,ctx){
   return runJob(ctx,'download',opts,
    async dirPath=>{
     const url=validateUrl(opts.url);
     if(opts.kind==='image')return (await downloadImage({url,outdir:dirPath})).path;
     return (await downloadWithYtdlp({url,outdir:dirPath,kind:opts.kind,resolution:opts.resolution||'best',format:opts.format||'mp4'})).path;
    },
    async inputPath=>({path:inputPath,mime:opts.kind==='audio'?'audio/'+(opts.format||'mp3'):opts.kind==='image'?'image/jpeg':opts.format==='webm'?'video/webm':'video/mp4'})
   );
  },
  async removeVocals(opts,ctx){
   return runJob(ctx,'remove-vocals',opts,dirPath=>prepareSource({...opts,kind:'video'},dirPath),(inputPath,dirPath)=>removeVocals(inputPath,dirPath,opts.format||'mp3'));
  },
  async removeBackground(opts,ctx){
   return runJob(ctx,'remove-background',opts,dirPath=>prepareSource(opts,dirPath),(inputPath,dirPath)=>{
    if(opts.mediaType==='image')return removeBackgroundImage(inputPath,dirPath);
    return removeBackgroundVideo(inputPath,dirPath);
   });
  },
  async removeWatermark(opts,ctx){
   return runJob(ctx,'remove-watermark',opts,dirPath=>prepareSource(opts,dirPath),(inputPath,dirPath)=>{
    const rect={x:opts.x,y:opts.y,width:opts.width,height:opts.height};
    if(opts.mediaType==='image')return removeWatermarkImage(inputPath,dirPath,rect);
    return removeWatermarkVideo(inputPath,dirPath,rect);
   });
  },
  getSettings(guildId,userId){
   return db.prepare('SELECT * FROM media_settings WHERE guild_id=? AND user_id=?').get(guildId,userId)||{resolution:'1080p',video_format:'mp4',audio_format:'mp3'};
  },
  setSettings(guildId,userId,values){
   const now=Date.now();
   db.prepare('INSERT INTO media_settings(guild_id,user_id,resolution,video_format,audio_format,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(guild_id,user_id) DO UPDATE SET resolution=excluded.resolution,video_format=excluded.video_format,audio_format=excluded.audio_format,updated_at=excluded.updated_at').run(guildId,userId,values.resolution||'1080p',values.video_format||'mp4',values.audio_format||'mp3',now);
  }
 };
}
