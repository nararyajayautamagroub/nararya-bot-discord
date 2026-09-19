import fs from 'node:fs';
import path from 'node:path';
import {request} from 'undici';
import {createJob,updateJob} from './database.js';
import {newJobDir,fileSize,MIME_BY_EXT} from './utils.js';
import {downloadWithYtdlp,downloadImage,validateUrl} from './download.js';
import {removeVocals,removeBackgroundImage,removeBackgroundVideo,removeWatermarkImage,removeWatermarkVideo,transcode} from './transforms.js';

const MAX_UPLOAD_MB=Number(process.env.MEDIA_MAX_UPLOAD_MB||8);

function inputToSource(input){
 if(input?.url)return validateUrl(input.url);
 return null;
}
async function downloadAttachment(attachment,dir){
 const res=await request(attachment.url,{headers:{'user-agent':'NararyaBotDiscord/1.0'},bodyTimeout:30000});
 if(res.statusCode<200||res.statusCode>=300)throw new Error('Attachment download failed: HTTP '+res.statusCode);
 const target=path.join(dir,(attachment.name||'attachment').replace(/[^a-zA-Z0-9._-]/g,'_'));
 const buffer=Buffer.from(await res.body.arrayBuffer());
 await fs.promises.writeFile(target,buffer);
 return target;
}
export function createMediaService({db,dir}){
 async function runJob(ctx,operation,input,work){
  const jobId=createJob(db,{guildId:ctx.guildId,userId:ctx.userId,operation,inputSource:input?.url||null,resolution:input?.resolution,format:input?.format});
  const jobDir=newJobDir(dir,jobId);
  try{
   updateJob(db,jobId,{status:'processing'});
   const inputPath=await work(jobDir,'input');
   updateJob(db,jobId,{input_path:inputPath});
   const output=await input.transform(inputPath,jobDir);
   const size=fileSize(output.path);
   if(size>MAX_UPLOAD_MB*1024*1024)throw new Error('Output exceeds MEDIA_MAX_UPLOAD_MB ('+MAX_UPLOAD_MB+' MB). Lower the resolution or choose a smaller format.');
   db.prepare('INSERT INTO media_files(job_id,path,mime,size_bytes,created_at) VALUES(?,?,?,?,?)').run(jobId,output.path,output.mime,size,Date.now());
   updateJob(db,jobId,{status:'completed',output_path:output.path,output_mime:output.mime});
   return {jobId,path:output.path,mime:output.mime,size};
  }catch(error){
   updateJob(db,jobId,{status:'failed',error:error.message});
   throw error;
  }
 }
 async function sourcePath(jobDir,opts){
  if(opts.attachment)return downloadAttachment(opts.attachment,jobDir);
  if(!opts.url)throw new Error('Provide a public URL or a Discord attachment');
  const url=validateUrl(opts.url);
  if(opts.kind==='image')return (await downloadImage({url,outdir:jobDir})).path;
  return (await downloadWithYtdlp({url,outdir:jobDir,kind:'video',resolution:opts.resolution||'best',format:opts.format||'mp4'})).path;
 }
 return {
  async download(opts,ctx){
   return runJob(ctx,'download',opts,async(jobDir)=>opts.kind==='image'
    ?(await downloadImage({url:validateUrl(opts.url),outdir:jobDir})).path
    :(await downloadWithYtdlp({url:validateUrl(opts.url),outdir:jobDir,kind:opts.kind,resolution:opts.resolution||'best',format:opts.format||'mp4'})).path,
   );
  },
  async removeVocals(opts,ctx){
   return runJob(ctx,'remove-vocals',opts,async(jobDir)=>sourcePath(jobDir,{...opts,kind:'video'}));
  },
  async removeBackground(opts,ctx){
   return runJob(ctx,'remove-background',opts,async(jobDir)=>sourcePath(jobDir,{...opts,kind:opts.mediaType}),);
  },
  async removeWatermark(opts,ctx){
   return runJob(ctx,'remove-watermark',opts,async(jobDir)=>sourcePath(jobDir,{...opts,kind:opts.mediaType}),);
  },
  getSettings(guildId,userId){return db.prepare('SELECT * FROM media_settings WHERE guild_id=? AND user_id=?').get(guildId,userId)||{resolution:'1080p',video_format:'mp4',audio_format:'mp3'};},
  setSettings(guildId,userId,values){const now=Date.now();db.prepare('INSERT INTO media_settings(guild_id,user_id,resolution,video_format,audio_format,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(guild_id,user_id) DO UPDATE SET resolution=excluded.resolution,video_format=excluded.video_format,audio_format=excluded.audio_format,updated_at=excluded.updated_at').run(guildId,userId,values.resolution||'1080p',values.video_format||'mp4',values.audio_format||'mp3',now);}
 };
}
