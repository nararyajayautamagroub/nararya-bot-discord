import fs from 'node:fs';
import path from 'node:path';
import {run} from './runner.js';
import {uniqueFile,assertResolution,MIME_BY_EXT} from './utils.js';

const FFMPEG=process.env.FFMPEG_PATH||null;
const ffmpeg=(...args)=>run(FFMPEG||process.env.FFMPEG_BINARY||'ffmpeg',args);

async function python(){
 return process.env.PYTHON_BIN||'python';
}

export async function removeVocals(input,outdir,format='mp3'){
 const target=uniqueFile(outdir,'instrumental',format);
 const py=await python();
 const model=process.env.DEMUCS_MODEL||'htdemucs';
 await run(py,['-m','demucs','--two-stems=vocals','-n',model,'-o',outdir,input]);
 const base=path.basename(input,path.extname(input));
 const candidate=path.join(outdir,model,base,'no_vocals.wav');
 if(!fs.existsSync(candidate))throw new Error('Demucs did not produce no_vocals.wav');
 await ffmpeg('-y','-i',candidate,'-vn','-c:a',format==='wav'?'pcm_s16le':'libmp3lame','-b:a',format==='mp3'?'320k':undefined,target);
 return {path:target,mime:MIME_BY_EXT[format]};
}

export async function removeBackgroundImage(input,outdir){
 const target=uniqueFile(outdir,'no-background','png');
 const py=await python();
 const script=process.env.REMBG_SCRIPT||path.resolve('tools/media/remove_background.py');
 await run(py,[script,input,target]);
 return {path:target,mime:'image/png'};
}

export async function removeBackgroundVideo(input,outdir){
 const frames=path.join(outdir,'frames');
 const result=path.join(outdir,'rgba');
 await fs.promises.mkdir(frames,{recursive:true});
 await fs.promises.mkdir(result,{recursive:true});
 await ffmpeg('-y','-i',input,path.join(frames,'%08d.png'));
 const py=await python();
 const script=process.env.REMBG_VIDEO_SCRIPT||path.resolve('tools/media/remove_background_video.py');
 await run(py,[script,frames,result]);
 const target=uniqueFile(outdir,'no-background','webm');
 await ffmpeg('-y','-framerate','30','i',path.join(result,'%08d.png'),'-c:v','libvpx-vp9','-pix_fmt','yuva420p','-auto-alt-ref','0',target);
 return {path:target,mime:'video/webm'};
}

export async function removeWatermarkImage(input,outdir,{x,y,width,height}){
 const target=uniqueFile(outdir,'no-watermark','png');
 const py=await python();
 const script=process.env.WATERMARK_SCRIPT||path.resolve('tools/media/remove_watermark.py');
 await run(py,[script,input,target,String(x),String(y),String(width),String(height)]);
 return {path:target,mime:'image/png'};
}

export async function removeWatermarkVideo(input,outdir,rect){
 const frames=path.join(outdir,'wm-frames');
 const clean=path.join(outdir,'wm-clean');
 await fs.promises.mkdir(frames,{recursive:true});
 await fs.promises.mkdir(clean,{recursive:true});
 await ffmpeg('-y','-i',input,path.join(frames,'%08d.png'));
 const py=await python();
 const script=process.env.WATERMARK_SCRIPT||path.resolve('tools/media/remove_watermark.py');
 const list=fs.readdirSync(frames).filter(x=>x.endsWith('.png')).sort();
 for(const file of list)await run(py,[script,path.join(frames,file),path.join(clean,file),String(rect.x),String(rect.y),String(rect.width),String(rect.height)]);
 const target=uniqueFile(outdir,'no-watermark','mp4');
 await ffmpeg('-y','-framerate','30','i',path.join(clean,'%08d.png'),'-i',input,'-map','0:v:0','-map','1:a?','-c:v','libx264','-crf','18','-preset','medium','-c:a','aac','-shortest',target);
 return {path:target,mime:'video/mp4'};
}

export async function transcode(input,outdir,{resolution='best',format='mp4'}){
 const target=uniqueFile(outdir,'transcoded',format);
 const r=assertResolution(resolution);
 const scale=r==='best'?null:'scale=-2:'+r.replace(/p$/,'');
 const args=['-y','-i',input];
 if(scale)args.push('-vf',scale);
 args.push('-c:v',format==='webm'?'libvpx-vp9':'libx264');
 if(format==='webm')args.push('-c:a','libopus'); else args.push('-c:a','aac');
 args.push(target);
 await ffmpeg(...args);
 return {path:target,mime:MIME_BY_EXT[format]};
}
