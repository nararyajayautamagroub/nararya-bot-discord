import {spawn}from'node:child_process';import {ffmpeg}from'./ffmpeg.js';
export function toPcm(input:string){return new Promise<NodeJS.ReadableStream>((resolve,reject)=>{const p=spawn(ffmpeg(),['-hide_banner','-loglevel','error','-i',input,'-f','s16le','-ar','48000','-ac','2','pipe:1']);p.once('error',reject);resolve(p.stdout)})}
