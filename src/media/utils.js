import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const RESOLUTIONS=Object.freeze(['best','2160p','1440p','1080p','720p','480p','360p']);
export const VIDEO_FORMATS=Object.freeze(['mp4','webm','mkv']);
export const AUDIO_FORMATS=Object.freeze(['mp3','m4a','wav','flac']);
export const MIME_BY_EXT={
 mp4:'video/mp4',webm:'video/webm',mkv:'video/x-matroska',
 mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav',flac:'audio/flac',
 jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'
};
export function assertResolution(value='1080p'){
 const v=String(value).toLowerCase();
 if(!RESOLUTIONS.includes(v))throw new Error('Unsupported resolution: '+value);
 return v;
}
export function safeName(name='media'){
 const s=String(name).normalize('NFKC').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'');
 return (s||'media').slice(0,120);
}
export function newJobDir(root,id){
 const dir=path.join(root,'jobs',String(id));
 fs.mkdirSync(dir,{recursive:true});
 return dir;
}
export function uniqueFile(dir,prefix,ext){
 const file=path.join(dir,safeName(prefix)+'-'+crypto.randomBytes(4).toString('hex')+'.'+ext);
 return file;
}
export function firstFile(dir,exts=[]){
 const files=fs.readdirSync(dir).filter(x=>!x.startsWith('.'));
 const match=files.find(x=>!exts.length||exts.includes(path.extname(x).slice(1).toLowerCase()));
 return match?path.join(dir,match):null;
}
export function fileSize(pathname){
 return fs.statSync(pathname).size;
}
