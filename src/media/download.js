import fs from 'node:fs';
import path from 'node:path';
import {request} from 'undici';
import * as cheerio from 'cheerio';
import {run} from './runner.js';
import {MIME_BY_EXT,assertResolution,safeName,firstFile} from './utils.js';

const YTDLP=process.env.YTDLP_PATH||'yt-dlp';
const MAX_DOWNLOAD_MB=Number(process.env.MEDIA_MAX_DOWNLOAD_MB||200);
const timeoutMs=Number(process.env.MEDIA_HTTP_TIMEOUT_MS||30000);

function qualitySelector(resolution){
 if(resolution==='best')return 'bestvideo*+bestaudio/best';
 const h=resolution.replace(/p$/,'');
 return 'bestvideo*[height<='+h+']+bestaudio/best[height<='+h+']';
}

export async function downloadWithYtdlp({url,outdir,kind='video',resolution='best',format='mp4'}){
 const resolved=assertResolution(resolution);
 await fs.promises.mkdir(outdir,{recursive:true});
 const output=path.join(outdir,'%(_title)s-%(id)s.%(ext)s');
 const args=['--no-playlist','--restrict-filenames','--no-warnings','--no-progress','-o',output];
 if(kind==='audio'){
  args.push('-f','bestaudio/best','--extract-audio','--audio-format',format);
 }else{
  args.push('-f',qualitySelector(resolved));
  if(format==='mp4')args.push('--merge-output-format','mp4');
  else if(format==='webm')args.push('--merge-output-format','webm');
 }
 args.push(url);
 await run(YTDLP,args);
 const file=firstFile(outdir);
 if(!file)throw new Error('yt-dlp completed without producing a file');
 const stat=await fs.promises.stat(file);
 if(stat.size>MAX_DOWNLOAD_MB*1024*1024)throw new Error('Downloaded file exceeds MEDIA_MAX_DOWNLOAD_MB');
 return {path:file,mime:MIME_BY_EXT[path.extname(file).slice(1).toLowerCase()]||null};
}

async function directImage(url,outdir){
 const res=await request(url,{headers:{accept:'image/*,*/*;q=0.8','user-agent':process.env.SCRAPER_USER_AGENT||'NararyaBotDiscord/1.0'},bodyTimeout:timeoutMs});
 if(res.statusCode<200||res.statusCode>=300)throw new Error('Image URL returned HTTP '+res.statusCode);
 const type=String(res.headers['content-type']||'').split(';')[0];
 if(!type.startsWith('image/'))return null;
 const ext=type==='image/jpeg'?'jpg':type==='image/png'?'png':type==='image/webp'?'webp':'bin';
 const target=path.join(outdir,'download.'+ext);
 const buffer=Buffer.from(await res.body.arrayBuffer());
 if(buffer.length>MAX_DOWNLOAD_MB*1024*1024)throw new Error('Downloaded file exceeds MEDIA_MAX_DOWNLOAD_MB');
 await fs.promises.writeFile(target,buffer);
 return {path:target,mime:type};
}

async function ogImage(url,outdir){
 const res=await request(url,{headers:{accept:'text/html','user-agent':process.env.SCRAPER_USER_AGENT||'NararyaBotDiscord/1.0'},bodyTimeout:timeoutMs});
 if(res.statusCode<200||res.statusCode>=300)throw new Error('Page returned HTTP '+res.statusCode);
 const html=await res.body.text();
 const $=cheerio.load(html);
 const image=$('meta[property="og:image"]').attr('content')||$('meta[name="twitter:image"]').attr('content');
 if(!image)throw new Error('No public preview image found on page');
 return directImage(new URL(image,url).href,outdir);
}

export async function downloadImage({url,outdir}){
 const direct=await directImage(url,outdir).catch(()=>null);
 if(direct)return direct;
 try{return await ogImage(url,outdir);}catch{}
 await run(YTDLP,['--no-playlist','--skip-download','--write-thumbnail','--convert-thumbnails','jpg','-o',path.join(outdir,'%(_title)s-%(id)s.%(ext)s'),url]);
 const file=firstFile(outdir,['jpg','jpeg','png','webp']);
 if(!file)throw new Error('No downloadable public image found');
 return {path:file,mime:MIME_BY_EXT[path.extname(file).slice(1).toLowerCase()]||'image/jpeg'};
}
export function validateUrl(url){
 let u;
 try{u=new URL(url);}catch{throw new Error('Invalid URL');}
 if(!/^https?:$/.test(u.protocol))throw new Error('Only http and https URLs are supported');
 return u.href;
}
